// GitHub sync via the repository Contents API. The token only ever goes to api.github.com.
const API = 'https://api.github.com'
export const SYNC_MESSAGE = 'chore: sync book tracker data [skip ci]'

const headers = (token) => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

async function fail(res, what) {
  let detail = ''
  try {
    detail = (await res.json()).message || ''
  } catch {}
  const e = new Error(`${what}: ${res.status}${detail ? ' ' + detail : ''}`)
  e.status = res.status
  throw e
}

const encPath = (p) => p.split('/').map(encodeURIComponent).join('/')
const fileUrl = (c) => `${API}/repos/${c.owner}/${c.repo}/contents/${encPath(c.path)}`
const toB64 = (s) => btoa(unescape(encodeURIComponent(s)))
const fromB64 = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))))

// GET /user — proves the token is valid
export async function verifyToken(token) {
  const res = await fetch(`${API}/user`, { headers: headers(token) })
  if (res.status === 401) throw new Error('GitHub rejected this token (invalid or expired).')
  if (!res.ok) await fail(res, 'Could not verify token')
  return res.json()
}

// GET /repos/{owner}/{repo} — confirms the token can see the repo and has write access
export async function checkRepo(token, owner, repo) {
  const res = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) })
  if (res.status === 404)
    throw new Error(`Repository ${owner}/${repo} not found, or this token was not granted access to it (fine-grained tokens must select the repository).`)
  if (!res.ok) await fail(res, 'Could not open repository')
  const info = await res.json()
  if (info.permissions && info.permissions.push === false)
    throw new Error('This token can read the repository but not write. Give it “Contents: Read and write”.')
  return info
}

// GET /repos/{owner}/{repo}/contents/{path}?ref={branch}  → { data, sha } or null when the file doesn't exist yet
export async function readFile(c) {
  const res = await fetch(`${fileUrl(c)}?ref=${encodeURIComponent(c.branch)}`, { headers: { ...headers(c.token), 'Cache-Control': 'no-cache' }, cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) await fail(res, 'Could not read library file')
  const j = await res.json()
  let text
  if (j.content) text = fromB64(j.content)
  else {
    // files over 1 MB come back without inline content: fetch the raw bytes instead
    const raw = await fetch(`${fileUrl(c)}?ref=${encodeURIComponent(c.branch)}`, { headers: { ...headers(c.token), Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' })
    if (!raw.ok) await fail(raw, 'Could not read library file')
    text = await raw.text()
  }
  return { data: JSON.parse(text), sha: j.sha }
}

// PUT /repos/{owner}/{repo}/contents/{path} — create or update; returns the new file sha
export async function writeFile(c, data, sha) {
  const res = await fetch(fileUrl(c), {
    method: 'PUT',
    headers: { ...headers(c.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: SYNC_MESSAGE,
      content: toB64(JSON.stringify(data, null, 2)),
      branch: c.branch,
      ...(sha ? { sha } : {}),
    }),
  })
  if (res.status === 409 || res.status === 422) {
    // stale or missing sha (file changed elsewhere): caller refetches the sha and retries
    const e = new Error('The file changed on GitHub since it was loaded')
    e.conflict = true
    throw e
  }
  if (res.status === 403 || res.status === 404)
    await fail(res, 'GitHub refused the save (token needs “Contents: Read and write” on this repo, and the branch must exist)')
  if (!res.ok) await fail(res, 'Save failed')
  return (await res.json()).content.sha
}

// Visitors: no token. Read the public file straight from the repo.
export async function readPublic({ owner, repo, branch = 'main', path = 'data/library.json' }) {
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encPath(path)}?t=${Date.now()}`
  let res = await fetch(raw, { cache: 'no-store' })
  if (!res.ok) {
    res = await fetch(`${fileUrl({ owner, repo, path })}?ref=${encodeURIComponent(branch)}`, { headers: { Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' })
  }
  if (!res.ok) throw new Error(`Could not load ${path}`)
  return res.json()
}

export async function readUrl(url) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`Could not load ${url}`)
  return r.json()
}
