import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { sampleBooks, sampleCollections, defaultSettings, sampleChallenges, sampleTasks } from './sampleData.js'
import { DEFAULT_RATES } from './currency.js'
import { uid, todayStr, blankBook } from './utils.js'
import * as gh from './github.js'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

// No localStorage anywhere. Library data lives only in React memory (and on GitHub when logged in).
// The admin token + sync target live in sessionStorage so closing the tab logs you out.
const SS_ADMIN = 'bt.admin.session'

const freshData = () => ({
  books: sampleBooks(),
  collections: sampleCollections(),
  challenges: sampleChallenges(),
  tasks: sampleTasks(),
  readDays: [todayStr(new Date(Date.now() - 86400000)), todayStr(new Date(Date.now() - 2 * 86400000))],
  pausedDays: [],
  planned: [], // {id, date, bookId, pages}
  settings: { ...defaultSettings(), rates: { ...DEFAULT_RATES } },
  badgesSeen: [],
  tournament: null,
})

const loadAdmin = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SS_ADMIN)) || null
  } catch {
    return null
  }
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(freshData)
  const [admin, setAdmin] = useState(loadAdmin) // {token, login, avatar, owner, repo, branch, path}
  const [syncState, setSyncState] = useState('idle') // idle | synced | syncing | dirty | error
  const [syncError, setSyncError] = useState('')
  const [readOnly, setReadOnly] = useState(false)
  const [toast, setToast] = useState('')
  const dirtyRef = useRef(false)
  const timer = useRef(null)
  const dataRef = useRef(data)
  dataRef.current = data

  const flash = useCallback((m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }, [])

  // Theme attributes on <html>
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme
    document.documentElement.dataset.mode = data.settings.mode
  }, [data.settings.theme, data.settings.mode])

  // ----- Sync: one JSON file in your repo, via the GitHub Contents API -----
  const shaRef = useRef(null)
  const savingRef = useRef(false)
  const loadingRef = useRef(false)
  const adminRef = useRef(admin)
  adminRef.current = admin

  const fail = (e) => {
    setSyncState('error')
    setSyncError(e.message || String(e))
  }

  const applyRemote = (remote) => {
    const base = freshData()
    // theme + mode are per-visit display choices: keep what is on screen
    const { theme, mode } = dataRef.current.settings
    setData({ ...base, ...remote, settings: { ...base.settings, ...(remote.settings || {}), theme, mode, rates: { ...DEFAULT_RATES, ...((remote.settings || {}).rates || {}) } } })
  }

  // Commit the current data (PUT with the latest sha). Edits made while a save is running are picked up by the same loop.
  const save = useCallback(async (manual) => {
    const a = adminRef.current
    if (!a || loadingRef.current) return
    if (savingRef.current) {
      dirtyRef.current = true
      return
    }
    clearTimeout(timer.current)
    savingRef.current = true
    setSyncState('syncing')
    try {
      do {
        dirtyRef.current = false
        const payload = dataRef.current
        try {
          shaRef.current = await gh.writeFile(a, payload, shaRef.current)
        } catch (e) {
          if (!e.conflict) throw e
          const cur = await gh.readFile(a)
          shaRef.current = await gh.writeFile(a, payload, cur ? cur.sha : null)
        }
      } while (dirtyRef.current)
      setSyncState('synced')
      setSyncError('')
      if (manual) flash('Saved to GitHub')
    } catch (e) {
      dirtyRef.current = true
      fail(e)
    } finally {
      savingRef.current = false
    }
  }, [])

  // Replace what's on screen with the file currently on GitHub
  const reload = useCallback(async (silent) => {
    const a = adminRef.current
    if (!a) return
    if (silent !== true && dirtyRef.current && !window.confirm('You have changes that are not saved yet. Reload from GitHub and discard them?')) return
    loadingRef.current = true
    setSyncState('loading')
    try {
      const r = await gh.readFile(a)
      if (r) {
        shaRef.current = r.sha
        applyRemote(r.data)
      } else shaRef.current = null // file doesn't exist yet: the first save creates it
      dirtyRef.current = false
      setSyncState('synced')
      setSyncError('')
      if (silent !== true) flash('Reloaded from GitHub')
    } catch (e) {
      fail(e)
    } finally {
      loadingRef.current = false
    }
  }, [])

  const login = async ({ token, owner, repo, branch, path }) => {
    const user = await gh.verifyToken(token)
    await gh.checkRepo(token, owner, repo)
    const a = { token, login: user.login, avatar: user.avatar_url, owner, repo, branch: branch || 'main', path: path || 'data/library.json' }
    const cur = await gh.readFile(a)
    let note
    if (cur) {
      shaRef.current = cur.sha
      applyRemote(cur.data)
      note = `loaded ${a.path}`
    } else {
      shaRef.current = await gh.writeFile(a, dataRef.current, null)
      note = `created ${a.path}`
    }
    try {
      sessionStorage.setItem(SS_ADMIN, JSON.stringify(a))
    } catch {}
    setAdmin(a)
    setReadOnly(false)
    dirtyRef.current = false
    setSyncState('synced')
    setSyncError('')
    return { ...user, note }
  }

  const logout = () => {
    if (dirtyRef.current && !window.confirm('You have changes that are not saved to GitHub yet. Log out anyway?')) return false
    try {
      sessionStorage.removeItem(SS_ADMIN)
    } catch {}
    clearTimeout(timer.current)
    setAdmin(null)
    shaRef.current = null
    dirtyRef.current = false
    setSyncState('idle')
    setSyncError('')
    return true
  }

  // Auto-save: every change is committed 2.5 s after the last edit, so rapid clicks become one commit
  useEffect(() => {
    if (!admin || readOnly || !dirtyRef.current) return
    setSyncState((s) => (s === 'syncing' ? s : 'dirty'))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save(false), 2500)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line
  }, [data])

  // Opening the site in a tab that still holds the session token: load the latest from GitHub
  useEffect(() => {
    if (admin) reload(true)
    // eslint-disable-next-line
  }, [])

  // Nothing is kept on this computer, so warn before closing with unsaved edits
  useEffect(() => {
    const h = (e) => {
      if (admin && (syncState === 'dirty' || syncState === 'syncing' || syncState === 'error')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [admin, syncState])

  // Visitor mode (no token): read the public JSON from the repo, read-only.
  // Sources: ?repo=owner/name in the URL, ./config.json, or the repo this *.github.io site is served from.
  useEffect(() => {
    if (admin) return
    let dead = false
    ;(async () => {
      const cands = []
      const q = new URLSearchParams(window.location.search)
      if (q.get('repo') && q.get('repo').includes('/')) {
        const [owner, repo] = q.get('repo').split('/')
        cands.push({ owner, repo, branch: q.get('branch') || 'main', path: q.get('path') || 'data/library.json' })
      }
      try {
        const r = await fetch('./config.json', { cache: 'no-store' })
        if (r.ok) {
          const c = await r.json()
          if (c && c.owner && c.repo) cands.push({ owner: c.owner, repo: c.repo, branch: c.branch || 'main', path: c.path || 'data/library.json' })
          else if (c && typeof c.publicSource === 'string' && /^https?:/.test(c.publicSource)) cands.push({ url: c.publicSource })
        }
      } catch {}
      const m = window.location.hostname.match(/^([^.]+)\.github\.io$/)
      const repoName = window.location.pathname.split('/')[1]
      if (m && repoName) cands.push({ owner: m[1], repo: repoName, branch: 'main', path: 'data/library.json' })
      for (const c of cands) {
        try {
          const remote = c.url ? await gh.readUrl(c.url) : await gh.readPublic(c)
          if (dead || !remote || !Array.isArray(remote.books)) continue
          if (remote.settings && remote.settings.visitorPublicEnabled === false) return // owner chose to keep it private
          applyRemote(remote)
          setReadOnly(true)
          return
        } catch {}
      }
    })()
    return () => {
      dead = true
    }
    // eslint-disable-next-line
  }, [admin])

  // Visitor escape hatch: leave the owner's read-only library for a blank in-memory demo copy
  const switchToLocalCopy = () => {
    setReadOnly(false)
    setData(freshData())
  }

  // Mutate helper — blocks edits in read-only visitor mode
  const mutate = useCallback(
    (fn) => {
      if (readOnly) {
        flash('Read-only view — log in as Admin to edit')
        return
      }
      if (loadingRef.current) {
        flash('Still loading from GitHub — try again in a moment')
        return
      }
      dirtyRef.current = true
      setData((d) => fn(d))
    },
    [readOnly, flash]
  )

  // ----- Actions -----
  const actions = useMemo(() => {
    const patchBook = (id, patch) => mutate((d) => ({ ...d, books: d.books.map((b) => (b.id === id ? { ...b, ...(typeof patch === 'function' ? patch(b) : patch) } : b)) }))
    const logPages = (d, bookId, pages, date = todayStr()) => {
      const books = d.books.map((b) => {
        if (b.id !== bookId) return b
        const log = [...b.readingLog, { id: uid(), date, pages: Number(pages) || 0 }]
        return { ...b, readingLog: log }
      })
      return { ...d, books, readDays: d.readDays.includes(date) ? d.readDays : [...d.readDays, date] }
    }
    return {
      addBook: (book) => mutate((d) => ({ ...d, books: [{ ...blankBook(), ...book }, ...d.books] })),
      addBooks: (list) => mutate((d) => ({ ...d, books: [...list.map((b) => ({ ...blankBook(), ...b })), ...d.books] })),
      updateBook: patchBook,
      deleteBooks: (ids) => mutate((d) => ({ ...d, books: d.books.filter((b) => !ids.includes(b.id)) })),
      setStatus: (id, status, extra = {}) =>
        patchBook(id, (b) => {
          const p = { status, ...extra }
          if (status === 'reading' && !b.startDate) p.startDate = todayStr()
          if (status === 'reading' && b.status === 'finished') {
            p.currentPage = 0
            p.finishDate = ''
            p.startDate = todayStr()
          }
          if (status === 'finished') {
            p.finishDate = todayStr()
            p.reads = (b.reads || 0) + (b.status === 'finished' ? 0 : 1)
            p.currentPage = b.unit === 'Minutes' ? b.audioMinutes : b.unit === 'Percent' ? 100 : b.pages
          }
          return p
        }),
      readAgain: (id) =>
        patchBook(id, (b) => ({ status: 'reading', currentPage: 0, startDate: todayStr(), finishDate: '', review: { ...b.review } })),
      setCurrentPage: (id, val) => patchBook(id, (b) => ({ currentPage: Math.max(0, Number(val) || 0) })),
      logReading: (bookId, pages, date) => mutate((d) => logPages(d, bookId, pages, date)),
      quickRead: () => mutate((d) => ({ ...d, readDays: d.readDays.includes(todayStr()) ? d.readDays : [...d.readDays, todayStr()] })),
      pauseToday: () => mutate((d) => ({ ...d, pausedDays: d.pausedDays.includes(todayStr()) ? d.pausedDays : [...d.pausedDays, todayStr()] })),
      setSettings: (patch) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      setCollections: (fn) => mutate((d) => ({ ...d, collections: fn(d.collections) })),
      setChallenges: (fn) => mutate((d) => ({ ...d, challenges: fn(d.challenges) })),
      setTasks: (fn) => mutate((d) => ({ ...d, tasks: fn(d.tasks) })),
      setPlanned: (fn) => mutate((d) => ({ ...d, planned: fn(d.planned) })),
      setTournament: (t) => mutate((d) => ({ ...d, tournament: t })),
      resetDemo: () => {
        dirtyRef.current = true
        setReadOnly(false)
        setData((d) => ({ ...freshData(), settings: { ...freshData().settings, theme: d.settings.theme, mode: d.settings.mode, name: d.settings.name } }))
      },
      importData: (obj) => {
        if (!obj || !Array.isArray(obj.books)) throw new Error('Not a valid library file')
        dirtyRef.current = true
        applyRemote(obj)
      },
      // theme/mode do not count as library edits, but they live in settings so they sync too
    }
    // eslint-disable-next-line
  }, [mutate])

  const value = {
    ...data,
    data,
    actions,
    admin,
    login,
    logout,
    save,
    reload,
    syncState,
    syncError,
    readOnly,
    switchToLocalCopy,
    flash,
    toast,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
