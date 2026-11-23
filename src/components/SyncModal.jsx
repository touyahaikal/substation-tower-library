import React, { useEffect, useState } from 'react'
import { Github, LogOut, RefreshCw, Save, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Modal, Field } from './ui.jsx'
import { useStore } from '../lib/store.jsx'

const guessOwner = () => {
  const m = window.location.hostname.match(/^([^.]+)\.github\.io$/)
  return m ? m[1] : ''
}
const guessRepo = () => (guessOwner() ? window.location.pathname.split('/')[1] || '' : '')

export function SyncPanel({ onDone }) {
  const { admin, login, logout, save, reload, syncState, syncError, readOnly, flash, settings, actions } = useStore()
  const [token, setToken] = useState('')
  const [owner, setOwner] = useState(guessOwner)
  const [repo, setRepo] = useState(guessRepo)
  const [branch, setBranch] = useState('main')
  const [path, setPath] = useState('data/library.json')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Nothing is remembered in this browser, so prefill the repo details from public/config.json when the owner set them
  useEffect(() => {
    fetch('./config.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((c) => {
        if (!c) return
        if (c.owner) setOwner((v) => v || c.owner)
        if (c.repo) setRepo((v) => v || c.repo)
        if (c.branch) setBranch(c.branch)
        if (c.path) setPath(c.path)
      })
      .catch(() => {})
  }, [])

  const doLogin = async () => {
    setErr('')
    setBusy(true)
    try {
      if (!token.trim()) throw new Error('Paste your fine-grained token first')
      if (!owner.trim() || !repo.trim()) throw new Error('Enter your GitHub username and repository name')
      const clean = path.trim().replace(/^\/+/, '')
      if (!clean.endsWith('.json')) throw new Error('File path must end in .json, e.g. data/library.json')
      const u = await login({ token: token.trim(), owner: owner.trim(), repo: repo.trim(), branch: branch.trim() || 'main', path: clean })
      flash(`Signed in as ${u.login} — ${u.note}`)
      setToken('')
      onDone && onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (admin) {
    const label = { synced: 'Synced to GitHub', syncing: 'Saving…', dirty: 'Saving…', loading: 'Loading…', error: 'Sync error', idle: 'Ready' }[syncState]
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <img src={admin.avatar} alt="" className="w-12 h-12 rounded-full border border-line" />
          <div className="min-w-0">
            <div className="font-semibold">{admin.login}</div>
            <div className="text-xs text-muted font-mono break-all">{admin.owner}/{admin.repo} · {admin.branch} · {admin.path}</div>
          </div>
        </div>
        <div className="text-sm mb-1 flex items-center gap-1.5">
          {syncState === 'error' ? <AlertTriangle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-accent2" />}
          <b>{label}</b>
        </div>
        {syncError && <div className="text-red-500 text-xs mb-2 break-words">{syncError}</div>}
        <p className="text-xs text-muted mb-3">Every change is committed to this file about 2.5 seconds after you stop editing. Nothing is stored on this computer.</p>
        <div className="flex gap-2 flex-wrap mb-4">
          <button className="btn btn-primary" onClick={() => save(true)} disabled={syncState === 'syncing' || syncState === 'loading'}><Save size={14} /> Save Now</button>
          <button className="btn" onClick={() => reload()} disabled={syncState === 'syncing' || syncState === 'loading'}><RefreshCw size={14} /> Reload from GitHub</button>
        </div>
        <label className="flex items-start gap-2 text-sm mb-4">
          <input className="mt-1" type="checkbox" checked={settings.visitorPublicEnabled !== false} onChange={(e) => actions.setSettings({ visitorPublicEnabled: e.target.checked })} />
          <span>
            Show my library to visitors (read-only)
            <span className="block text-xs text-muted">Visitors load <span className="font-mono">{admin.path}</span> straight from your public repository. Switch off to hide it.</span>
          </span>
        </label>
        <button className="btn" onClick={async () => { if (await logout()) onDone && onDone() }}><LogOut size={14} /> Log out / clear token</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {readOnly && <div className="chip">You are viewing a public, read-only library</div>}
      <p className="text-sm text-muted">
        Log in with a GitHub <b>fine-grained</b> personal access token. It is verified with GitHub, kept only for this browser tab (sessionStorage), and forgotten when you close the tab. Your library is saved straight to a JSON file in your repository.
      </p>
      <Field label="Fine-grained personal access token">
        <input className="input font-mono" type="password" autoComplete="off" placeholder="github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GitHub username (repo owner)"><input className="input font-mono" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="octocat" /></Field>
        <Field label="Repository name"><input className="input font-mono" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="book-tracker" /></Field>
        <Field label="Branch"><input className="input font-mono" value={branch} onChange={(e) => setBranch(e.target.value)} /></Field>
        <Field label="File path"><input className="input font-mono" value={path} onChange={(e) => setPath(e.target.value)} /></Field>
      </div>
      <p className="text-xs text-muted">
        Token needs access to <b>only this repository</b> with <b>Contents: Read and write</b>. If the file doesn’t exist yet, it is created for you.
      </p>
      {err && <div className="text-red-500 text-sm break-words">{err}</div>}
      <div className="flex justify-between items-center">
        <a className="text-xs text-accent inline-flex items-center gap-1" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
          Create a token <ExternalLink size={11} />
        </a>
        <button className="btn btn-primary" disabled={busy} onClick={doLogin}>
          <Github size={14} /> {busy ? 'Verifying…' : 'Log in'}
        </button>
      </div>
    </div>
  )
}

export default function SyncModal({ onClose }) {
  const { admin } = useStore()
  return (
    <Modal title={admin ? 'GitHub Sync' : 'GitHub Admin Login'} onClose={onClose}>
      <SyncPanel onDone={onClose} />
    </Modal>
  )
}
