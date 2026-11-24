import React from 'react'
import { Search, Plus, Moon, Sun, Github, RefreshCw, CheckCircle2, AlertTriangle, CloudUpload, Palette, Eye, Save, Download } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { variantName } from '../lib/themes.js'

function SyncBadge() {
  const { admin, syncState, syncError, readOnly, save, reload } = useStore()
  const { setSyncOpen } = useNav()
  if (!admin) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="chip hidden sm:inline-flex" title={readOnly ? 'Viewing the owner\'s public library. Log in to edit.' : 'Changes are not saved. Log in to save to GitHub.'}>
          <Eye size={12} /> Guest Mode{readOnly ? ' · read-only' : ''}
        </span>
        <button className="btn" onClick={() => setSyncOpen(true)}>
          <Github size={14} /> <span className="hidden sm:inline">Admin Sync</span>
        </button>
      </div>
    )
  }
  const map = {
    synced: ['Synced to GitHub', CheckCircle2, 'text-accent2'],
    syncing: ['Saving…', RefreshCw, 'text-accent'],
    dirty: ['Saving…', CloudUpload, 'text-accent'],
    loading: ['Loading…', RefreshCw, 'text-accent'],
    error: ['Sync Error', AlertTriangle, 'text-red-500'],
    idle: ['Ready', CheckCircle2, 'text-muted'],
  }
  const [label, Icon, color] = map[syncState] || map.idle
  const busy = syncState === 'syncing' || syncState === 'loading'
  return (
    <div className="flex items-center gap-1.5">
      <button className="btn" onClick={() => setSyncOpen(true)} title={syncError || `Signed in as ${admin.login} — ${admin.owner}/${admin.repo}`}>
        <img src={admin.avatar} alt="" className="w-4 h-4 rounded-full" />
        <Icon size={14} className={`${color} ${busy ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{label}</span>
      </button>
      {syncState === 'error' && <span className="text-xs text-red-500 max-w-[200px] truncate hidden lg:inline" title={syncError}>{syncError}</span>}
      <button className="btn" onClick={() => save(true)} disabled={busy} title="Save now"><Save size={14} /> <span className="hidden xl:inline">Save Now</span></button>
      <button className="btn" onClick={() => reload()} disabled={busy} title="Reload from GitHub"><Download size={14} /> <span className="hidden xl:inline">Reload</span></button>
    </div>
  )
}

export default function Header() {
  const { settings, actions } = useStore()
  const { search, setSearch, goLibrary, page, setBookModal } = useNav()
  const v = variantName(settings.theme, settings.mode)
  const onSearch = (val) => {
    setSearch(val)
    if (val && page !== 'library') goLibrary('all')
  }
  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-b border-line bg-card/80 backdrop-blur flex-wrap">
      <div className="h-display text-base sm:text-lg font-semibold mr-auto hidden md:block">Welcome back, {settings.name}</div>
      <div className="relative flex-1 min-w-[140px] max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input id="global-search" className="input !pl-8" placeholder="Search books…  ( / )" value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
      <div className="flex items-stretch">
        <button
          className="btn !rounded-r-none max-w-[190px] sm:max-w-[320px]"
          onClick={() => actions.setSettings({ mode: settings.mode === 'light' ? 'dark' : 'light' })}
          title="Toggle light / dark"
        >
          {settings.mode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
          <span className="truncate text-[11px] font-mono hidden sm:inline">{v}</span>
        </button>
        <button
          className="btn !rounded-l-none border-l-0"
          onClick={() => actions.setSettings({ theme: settings.theme === 'ttpd' ? 'substation' : 'ttpd' })}
          title="Switch theme"
        >
          <Palette size={14} />
        </button>
      </div>
      <SyncBadge />
      <button className="btn btn-primary" onClick={() => setBookModal({})}>
        <Plus size={16} /> <span className="hidden sm:inline">New entry</span>
      </button>
    </header>
  )
}
