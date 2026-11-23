import React, { useMemo, useState } from 'react'
import { StretchHorizontal, List as ListIcon, LayoutGrid, ClipboardPaste, Eye, EyeOff, Pencil, Layers, ChevronDown, ChevronRight, ChevronsUp, Heart, Search } from 'lucide-react'
import { Card, Cover, Modal, PageTitle, Tabs, ProgressBar, RatingBadge, Empty } from '../components/ui.jsx'
import { DeleteButton } from '../components/Confirm.jsx'
import QuickPage from '../components/QuickPage.jsx'
import SeriesCard, { useVolumeGenerator } from '../components/SeriesCard.jsx'
import SpendingBreakdown from '../components/SpendingBreakdown.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { STATUSES, statusLabel, displayTitle, progressOf, unitTotal, unitSuffix } from '../lib/utils.js'
import { buildGroups } from '../lib/groups.js'
import { fmtMoney } from '../lib/currency.js'

// ---------------------------------------------------------------- paste-a-list import
function PasteList({ onClose }) {
  const { actions, settings, flash } = useStore()
  const [text, setText] = useState('')
  const [status, setStatus] = useState('wishlist')
  const rows = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const parse = (l) => {
    const m = l.split(/\s+by\s+|\s+[-–—]\s+|,\s*/i)
    return { title: m[0], author: m[1] || '' }
  }
  const go = () => {
    if (actions.addBooks(rows.map((l) => ({ ...parse(l), status, currency: settings.primaryCurrency })))) {
      flash(`Added ${rows.length} book${rows.length === 1 ? '' : 's'} to library`, 'success')
      onClose()
    }
  }
  return (
    <Modal title="Paste a list" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!rows.length} onClick={go}>Import {rows.length}</button></>}>
      <p className="text-sm text-muted mb-2">One book per line. Use “Title by Author”, “Title - Author” or “Title, Author”.</p>
      <textarea className="input font-mono" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Emma by Jane Austen\nThe Hobbit - J.R.R. Tolkien'} />
      <div className="mt-3 flex items-center gap-2 text-sm">
        Add as
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- shared bits for single entries
function Chips({ b }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="chip !border-accent text-accent">{statusLabel(b.status)}</span>
      {b.edition && <span className="chip">{b.edition}</span>}
      {b.language && <span className="chip">{b.language}</span>}
      {(b.genres || []).map((g) => <span key={g} className="chip">{g}</span>)}
      {b.yearReleased ? <span className="chip font-mono">{b.yearReleased}</span> : null}
      {b.hidden && <span className="chip">Hidden</span>}
    </div>
  )
}

function Progress({ b }) {
  if (b.status !== 'reading' && b.status !== 'finished') return null
  const total = unitTotal(b)
  const cur = b.status === 'finished' ? total : Number(b.currentPage) || 0
  return (
    <div className="mt-2">
      <ProgressBar value={progressOf(b)} />
      <div className="text-[11px] text-muted font-mono mt-1">{Math.round(progressOf(b) * 100)}%{total ? ` · ${cur}/${total}${unitSuffix(b)}` : ''}</div>
    </div>
  )
}

// Edit / Hide / Add volumes / Delete (inline "Confirm Delete?" bar, never a browser popup)
function EntryActions({ b, onAddVolumes, iconOnly }) {
  const { actions, flash } = useStore()
  const { setBookModal, openBook } = useNav()
  const hide = () => {
    if (actions.setHidden([b.id], !b.hidden)) flash(b.hidden ? `Unhid '${displayTitle(b)}'` : `Hid '${displayTitle(b)}'`, 'success')
  }
  const cls = iconOnly ? 'btn btn-ghost !p-1.5' : 'btn !py-1 text-xs'
  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button className={cls} onClick={() => setBookModal({ book: b })} title="Edit" aria-label="Edit"><Pencil size={iconOnly ? 15 : 12} />{!iconOnly && ' Edit'}</button>
      <button className={cls} onClick={hide} title={b.hidden ? 'Unhide' : 'Hide'} aria-label={b.hidden ? 'Unhide' : 'Hide'}>{b.hidden ? <Eye size={iconOnly ? 15 : 12} /> : <EyeOff size={iconOnly ? 15 : 12} />}{!iconOnly && (b.hidden ? ' Unhide' : ' Hide')}</button>
      <button className={cls} onClick={() => onAddVolumes([b])} title="Add volumes" aria-label="Add volumes"><Layers size={iconOnly ? 15 : 12} />{!iconOnly && ' Add volumes'}</button>
      <DeleteButton className={iconOnly ? 'btn btn-ghost !p-1.5' : 'btn !py-1 text-xs'} onConfirm={() => { if (actions.deleteBooks([b.id])) flash(`Deleted '${displayTitle(b)}'`, 'success') }} />
      {!iconOnly && <button className="btn btn-ghost !py-1 text-xs" onClick={() => openBook(b.id)}>Open page</button>}
    </div>
  )
}

const isActive = (b) => b.status === 'reading' || b.status === 'bought'

// ---------------------------------------------------------------- layout 1: Cards
function EntryCard({ b, selected, onSelect, addVolumes }) {
  const { openBook } = useNav()
  return (
    <section className={`panel p-4 ${b.hidden ? 'opacity-70' : ''}`}>
      <div className="flex gap-4">
        <input type="checkbox" className="mt-1 accent-[rgb(var(--accent))]" checked={!!selected} onChange={onSelect} aria-label="Select" />
        <Cover book={b} size="md" onClick={() => openBook(b.id)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="h-display text-lg font-semibold leading-tight">{displayTitle(b)}</h3>
              <div className="text-sm text-muted">{b.author}</div>
            </div>
            <div className="text-right shrink-0">
              <RatingBadge value={b.review?.rating} />
              {b.favorite && <Heart size={13} className="text-accent fill-accent inline ml-2" />}
              {b.price > 0 && b.status !== 'wishlist' && <div className="text-xs font-mono text-muted mt-0.5">{fmtMoney(b.price, b.currency)}</div>}
            </div>
          </div>
          <div className="mt-2"><Chips b={b} /></div>
          <Progress b={b} />
          {isActive(b) && <QuickPage book={b} className="mt-2" />}
          {b.notesText && <p className="text-xs text-muted mt-2 line-clamp-2">{b.notesText}</p>}
          <div className="mt-3"><EntryActions b={b} onAddVolumes={addVolumes} /></div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- layout 2: List
function EntryRow({ b, selected, onSelect, addVolumes }) {
  const { openBook } = useNav()
  return (
    <div className={`panel p-3 flex gap-3 items-center flex-wrap sm:flex-nowrap ${b.hidden ? 'opacity-70' : ''}`}>
      <input type="checkbox" className="accent-[rgb(var(--accent))]" checked={!!selected} onChange={onSelect} aria-label="Select" />
      <Cover book={b} size="sm" onClick={() => openBook(b.id)} />
      <div className="flex-1 min-w-[10rem]">
        <button className="font-semibold text-left hover:text-accent block max-w-full truncate" onClick={() => openBook(b.id)}>{displayTitle(b)}</button>
        <div className="text-sm text-muted truncate">{b.author}</div>
        <div className="flex gap-1 mt-1 flex-wrap items-center">
          <span className="chip !border-accent text-accent">{statusLabel(b.status)}</span>
          <span className="chip">{b.edition}</span>
          {b.language && <span className="chip hidden md:inline-flex">{b.language}</span>}
          {b.hidden && <span className="chip">Hidden</span>}
        </div>
      </div>
      <div className="hidden lg:block w-28 text-xs text-muted font-mono">
        <ProgressBar value={progressOf(b)} />
        <div className="mt-1">{Math.round(progressOf(b) * 100)}%{b.pages ? ` · ${b.pages}p` : ''}</div>
      </div>
      <div className="hidden sm:block w-24 text-right"><RatingBadge value={b.review?.rating} /></div>
      {isActive(b) && <QuickPage book={b} className="w-full sm:w-auto" />}
      <EntryActions b={b} onAddVolumes={addVolumes} iconOnly />
    </div>
  )
}

// A series / multi-edition group shown as one compact row that expands into the full series card
function GroupRow({ g, open, onToggle, selected, onSelect }) {
  const { actions, flash } = useStore()
  const ids = g.entries.map((b) => b.id)
  return (
    <div>
      <div className={`panel p-3 flex gap-3 items-center flex-wrap sm:flex-nowrap ${g.hidden ? 'opacity-70' : ''}`}>
        <input type="checkbox" className="accent-[rgb(var(--accent))]" checked={!!selected} onChange={onSelect} aria-label="Select" />
        <Cover book={g.cover} size="sm" onClick={onToggle} />
        <div className="flex-1 min-w-[10rem]">
          <button className="font-semibold text-left hover:text-accent block max-w-full truncate" onClick={onToggle}>{g.title}</button>
          <div className="text-sm text-muted truncate">{g.author}</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            <span className="chip"><Layers size={11} className="mr-1" />{g.entries.length} {g.entries.length === 1 ? 'entry' : 'volumes'}</span>
            {g.editions.map((e) => <span key={e.edition} className="chip">{e.edition}</span>)}
            {g.hidden && <span className="chip">Hidden</span>}
          </div>
        </div>
        <div className="hidden lg:block w-28 text-xs text-muted font-mono">
          <ProgressBar value={g.entries.length ? g.finished / g.entries.length : 0} />
          <div className="mt-1">{g.finished}/{g.entries.length} finished</div>
        </div>
        <div className="hidden sm:block w-24 text-right"><RatingBadge value={g.rating} /></div>
        <div className="flex items-center gap-1.5">
          <button className="btn btn-ghost !p-1.5" aria-label={g.hidden ? 'Unhide series' : 'Hide series'} title={g.hidden ? 'Unhide series' : 'Hide series'} onClick={() => { if (actions.setHidden(ids, !g.hidden)) flash(g.hidden ? `Unhid '${g.title}'` : `Hid '${g.title}'`, 'success') }}>{g.hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
          <DeleteButton prompt="Confirm Delete Series?" onConfirm={() => { if (actions.deleteBooks(ids)) flash(`Deleted '${g.title}' (${ids.length} entries)`, 'success') }} />
          <button className="btn btn-ghost !p-1.5" onClick={onToggle} aria-label={open ? 'Collapse' : 'Expand'}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
        </div>
      </div>
      {open && <div className="mt-2 ml-2 sm:ml-6"><SeriesCard group={g} defaultOpen /></div>}
    </div>
  )
}

// ---------------------------------------------------------------- layout 3: Covers (poster wall)
function Poster({ g, onToggle }) {
  const b = g.cover
  return (
    <button type="button" onClick={onToggle} className={`text-left group ${g.hidden ? 'opacity-60' : ''}`} aria-label={`Expand ${g.title}`}>
      <div className="relative">
        <Cover book={b} size="md" className="!w-full !h-52 group-hover:!-translate-y-1 transition" />
      </div>
      <div className="mt-2 text-sm font-semibold leading-tight truncate">{g.title}</div>
      <div className="text-xs text-muted truncate">{g.hidden ? 'Hidden · ' : ''}{g.isCollection ? `${g.entries.length} volumes · ${g.finished} finished` : statusLabel(b.status)}</div>
    </button>
  )
}

function PosterExpanded({ g, onCollapse, addVolumes }) {
  const { openBook } = useNav()
  const b = g.entries[0]
  if (g.isCollection) {
    return (
      <div className="col-span-full">
        <div className="flex justify-between items-center mb-2">
          <span className="label">Expanded · {g.title}</span>
          <button className="btn !py-1 text-xs" onClick={onCollapse}><ChevronsUp size={13} /> Collapse</button>
        </div>
        <SeriesCard group={g} defaultOpen />
      </div>
    )
  }
  const years = [['Released', b.yearReleased], ['Bought', b.yearBought], ['Started', b.yearStarted], ['Finished', b.yearFinished]].filter(([, y]) => y)
  return (
    <section className={`col-span-full panel p-4 ${b.hidden ? 'opacity-70' : ''}`}>
      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        <Cover book={b} size="lg" onClick={() => openBook(b.id)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="h-display text-xl font-semibold leading-tight">{displayTitle(b)}</h3>
              <div className="text-sm text-muted">{b.author}</div>
            </div>
            <button className="btn !py-1 text-xs shrink-0" onClick={onCollapse}><ChevronsUp size={13} /> Collapse</button>
          </div>
          <div className="mt-2"><Chips b={b} /></div>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted font-mono">
            <RatingBadge value={b.review?.rating} />
            {b.pages > 0 && <span>{b.pages} pages</span>}
            {b.price > 0 && b.status !== 'wishlist' && <span>{fmtMoney(b.price, b.currency)}</span>}
            {years.map(([l, y]) => <span key={l}>{l} {y}</span>)}
          </div>
          {b.summary && <p className="text-sm mt-3 leading-relaxed">{b.summary}</p>}
          {b.notesText && <p className="text-sm mt-2 text-muted whitespace-pre-wrap border-l-2 border-line pl-3">{b.notesText}</p>}
          <Progress b={b} />
          {isActive(b) && <QuickPage book={b} className="mt-3" />}
          <div className="mt-3"><EntryActions b={b} onAddVolumes={addVolumes} /></div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- page
const haystack = (b) =>
  [b.title, b.author, (b.genres || []).join(' '), b.language, b.edition, b.series, b.notesText, ...(b.notes || []).map((n) => n.text)].join(' ').toLowerCase()

export default function Library() {
  const { books, actions, flash, ask } = useStore()
  const { search, setSearch, libraryTab, setLibraryTab } = useNav()
  const [view, setView] = useState('cards')
  const [sort, setSort] = useState('newest')
  const [genre, setGenre] = useState('')
  const [lang, setLang] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  const [expanded, setExpanded] = useState(() => new Set())
  const [sel, setSel] = useState([])
  const [paste, setPaste] = useState(false)
  const [startAdd, genEl] = useVolumeGenerator()

  const hiddenCount = useMemo(() => books.filter((b) => b.hidden).length, [books])
  const visible = useMemo(() => books.filter((b) => showHidden || !b.hidden), [books, showHidden])
  const genres = useMemo(() => {
    const m = new Map()
    visible.forEach((b) => (b.genres || []).forEach((g) => m.set(g.toLowerCase(), g)))
    return [...m.values()].sort((a, b) => a.localeCompare(b))
  }, [visible])
  const langs = useMemo(() => [...new Set(visible.map((b) => (b.language || '').trim()).filter(Boolean))].sort(), [visible])
  const counts = useMemo(() => {
    const c = { all: visible.length }
    STATUSES.forEach((s) => (c[s.id] = visible.filter((b) => b.status === s.id).length))
    return c
  }, [visible])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const entryOk = (b) =>
      (libraryTab === 'all' || b.status === libraryTab) &&
      (!genre || (b.genres || []).some((g) => g.toLowerCase() === genre.toLowerCase())) &&
      (!lang || (b.language || '').toLowerCase() === lang.toLowerCase()) &&
      (!q || haystack(b).includes(q))
    const yr = (g) => (g.yearReleased === 9999 ? -1 : g.yearReleased)
    const cmp = {
      newest: (a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''),
      title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      author: (a, b) => (a.author || '').localeCompare(b.author || '', undefined, { sensitivity: 'base' }),
      progress: (a, b) => b.progress - a.progress,
      rating: (a, b) => b.rating - a.rating,
      year: (a, b) => yr(b) - yr(a),
    }[sort]
    return buildGroups(visible).filter((g) => g.entries.some(entryOk)).sort(cmp)
  }, [visible, search, libraryTab, genre, lang, sort])

  const entryCount = list.reduce((s, g) => s + g.entries.length, 0)
  const anyExpanded = expanded.size > 0
  const toggleOpen = (key) => setExpanded((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })
  const closeOne = (key) => setExpanded((s) => { const n = new Set(s); n.delete(key); return n })

  const idsOf = (g) => g.entries.map((b) => b.id)
  const isSel = (g) => g.entries.every((b) => sel.includes(b.id))
  const toggleSel = (g) => setSel((s) => (isSel(g) ? s.filter((id) => !idsOf(g).includes(id)) : [...new Set([...s, ...idsOf(g)])]))

  const bulkStatus = (st) => { if (actions.bulkSetStatus(sel, st)) { flash(`${sel.length} entr${sel.length === 1 ? 'y' : 'ies'} set to ${statusLabel(st)}`, 'success'); setSel([]) } }
  const bulkHide = (hide) => { if (actions.setHidden(sel, hide)) { flash(`${hide ? 'Hid' : 'Unhid'} ${sel.length} entr${sel.length === 1 ? 'y' : 'ies'}`, 'success'); setSel([]) } }
  const bulkDelete = async () => {
    const ok = await ask({ title: 'Delete selected entries?', message: `This permanently deletes ${sel.length} entr${sel.length === 1 ? 'y' : 'ies'}.`, confirmLabel: 'Yes, Delete', danger: true })
    if (ok && actions.deleteBooks(sel)) { flash(`Deleted ${sel.length} entr${sel.length === 1 ? 'y' : 'ies'}`, 'success'); setSel([]) }
  }

  const renderGroup = (g) => {
    if (g.isCollection) {
      return view === 'list'
        ? <GroupRow key={g.key} g={g} open={expanded.has(g.key)} onToggle={() => toggleOpen(g.key)} selected={isSel(g)} onSelect={() => toggleSel(g)} />
        : <SeriesCard key={g.key} group={g} defaultOpen={false} selected={isSel(g)} onSelect={() => toggleSel(g)} />
    }
    const b = g.entries[0]
    return view === 'list'
      ? <EntryRow key={g.key} b={b} selected={isSel(g)} onSelect={() => toggleSel(g)} addVolumes={startAdd} />
      : <EntryCard key={g.key} b={b} selected={isSel(g)} onSelect={() => toggleSel(g)} addVolumes={startAdd} />
  }

  return (
    <>
      <PageTitle
        sub={`${list.length} title${list.length === 1 ? '' : 's'} · ${entryCount} entr${entryCount === 1 ? 'y' : 'ies'}`}
        action={<button className="btn" onClick={() => setPaste(true)}><ClipboardPaste size={14} /> Paste a list</button>}
      >
        Library
      </PageTitle>

      <Tabs
        value={libraryTab}
        onChange={(t) => { setLibraryTab(t); setSel([]) }}
        tabs={[['all', `All (${counts.all})`], ...STATUSES.map((s) => [s.id, `${s.label} (${counts[s.id]})`])]}
      />

      <div className="flex flex-wrap gap-2 my-4 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !w-64 !pl-8" placeholder="Search title, author, genre, language, notes" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search library" />
        </div>
        <select className="input !w-auto" value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter by genre"><option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}</select>
        <select className="input !w-auto" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Filter by language"><option value="">All languages</option>{langs.map((g) => <option key={g}>{g}</option>)}</select>
        <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Sort: Newest</option><option value="title">Title (A–Z)</option><option value="author">Author (A–Z)</option>
          <option value="progress">Progress (%)</option><option value="rating">Rating (0–100)</option><option value="year">Year released</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none" title="Hidden entries and series stay tucked away unless this is on">
          <input type="checkbox" role="switch" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="accent-[rgb(var(--accent))] w-4 h-4" />
          Show Hidden{hiddenCount > 0 && <span className="chip font-mono">{hiddenCount}</span>}
        </label>
        <div className="flex ml-auto items-center gap-2">
          {view === 'covers' && anyExpanded && <button className="btn" onClick={() => setExpanded(new Set())}><ChevronsUp size={14} /> Collapse All</button>}
          <div className="flex">
            {[['cards', 'Cards', StretchHorizontal], ['list', 'List', ListIcon], ['covers', 'Covers', LayoutGrid]].map(([id, label, Icon]) => (
              <button key={id} onClick={() => { setView(id); setExpanded(new Set()) }} aria-label={`${label} layout`} aria-pressed={view === id} className={`btn !rounded-none first:!rounded-l-[var(--radius)] last:!rounded-r-[var(--radius)] ${view === id ? 'btn-primary' : ''}`}><Icon size={14} /> <span className="hidden sm:inline">{label}</span></button>
            ))}
          </div>
        </div>
      </div>

      {sel.length > 0 && (
        <div className="panel px-3 py-2 mb-4 flex items-center gap-2 flex-wrap text-sm">
          <b>{sel.length} selected</b>
          {STATUSES.map((s) => <button key={s.id} className="btn text-xs" onClick={() => bulkStatus(s.id)}>→ {s.label}</button>)}
          <button className="btn text-xs" onClick={() => bulkHide(true)}><EyeOff size={13} /> Hide</button>
          <button className="btn text-xs" onClick={() => bulkHide(false)}><Eye size={13} /> Unhide</button>
          <button className="btn text-xs !border-red-500/60 text-red-500" onClick={bulkDelete}>Delete…</button>
          <button className="btn btn-ghost text-xs ml-auto" onClick={() => setSel([])}>Clear</button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty>{books.length === 0 ? 'Your library is empty. Press N or use “New entry” to add your first book.' : hiddenCount > 0 && !showHidden ? 'No entries match. Some entries are hidden; switch on “Show Hidden” to see them.' : 'No entries match these filters.'}</Empty>
      ) : view === 'covers' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-5">
          {list.map((g) => (expanded.has(g.key)
            ? <PosterExpanded key={g.key} g={g} onCollapse={() => closeOne(g.key)} addVolumes={startAdd} />
            : <Poster key={g.key} g={g} onToggle={() => toggleOpen(g.key)} />))}
        </div>
      ) : (
        <div className="space-y-3">{list.map(renderGroup)}</div>
      )}

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <SpendingBreakdown books={books} title="Library spending" />
        <Card title="Library stats">
          <ul className="text-sm space-y-1.5">
            <li className="flex justify-between"><span className="text-muted">Total entries</span><b>{visible.length}</b></li>
            {STATUSES.map((s) => <li key={s.id} className="flex justify-between"><span className="text-muted">{s.label}</span><b>{counts[s.id]}</b></li>)}
            <li className="flex justify-between"><span className="text-muted">Pages read (finished)</span><b>{books.filter((b) => b.status === 'finished').reduce((s, b) => s + (Number(b.pages) || 0), 0).toLocaleString()}</b></li>
          </ul>
        </Card>
      </div>
      {paste && <PasteList onClose={() => setPaste(false)} />}
      {genEl}
    </>
  )
}
