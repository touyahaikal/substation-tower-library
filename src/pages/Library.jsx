import React, { useMemo, useState } from 'react'
import { LayoutGrid, List, Table as TableIcon, ClipboardPaste, Trash2, Heart } from 'lucide-react'
import { Card, Cover, Modal, PageTitle, Stars, Tabs, BookProgress, Empty } from '../components/ui.jsx'
import SpendingBreakdown from '../components/SpendingBreakdown.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { STATUSES, SOURCES, MOODS, statusLabel } from '../lib/utils.js'
import { fmtMoney } from '../lib/currency.js'

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
    actions.addBooks(rows.map((l) => ({ ...parse(l), status, currency: settings.primaryCurrency })))
    flash(`Added ${rows.length} book${rows.length === 1 ? '' : 's'}`)
    onClose()
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

export default function Library() {
  const { books, actions } = useStore()
  const { search, setSearch, libraryTab, setLibraryTab, openBook } = useNav()
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('added')
  const [genre, setGenre] = useState('')
  const [where, setWhere] = useState('')
  const [mood, setMood] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [sel, setSel] = useState([])
  const [paste, setPaste] = useState(false)

  const genres = useMemo(() => [...new Set(books.flatMap((b) => b.genres))].sort(), [books])
  const counts = useMemo(() => {
    const c = { all: books.length }
    STATUSES.forEach((s) => (c[s.id] = books.filter((b) => b.status === s.id).length))
    return c
  }, [books])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    let r = books.filter((b) => {
      if (libraryTab !== 'all' && b.status !== libraryTab) return false
      if (q && !`${b.title} ${b.author} ${b.series}`.toLowerCase().includes(q)) return false
      if (genre && !b.genres.includes(genre)) return false
      if (where && b.readWhere !== where) return false
      if (mood && !b.moods.includes(mood)) return false
      if (minRating && (b.review?.rating || 0) < minRating) return false
      return true
    })
    const cmp = {
      added: (a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''),
      title: (a, b) => a.title.localeCompare(b.title),
      author: (a, b) => a.author.localeCompare(b.author),
      rating: (a, b) => (b.review?.rating || 0) - (a.review?.rating || 0),
      pages: (a, b) => (b.pages || 0) - (a.pages || 0),
      finished: (a, b) => (b.finishDate || '').localeCompare(a.finishDate || ''),
    }[sort]
    return [...r].sort(cmp)
  }, [books, libraryTab, search, genre, where, mood, minRating, sort])

  const toggleSel = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const bulkStatus = (st) => { sel.forEach((id) => actions.setStatus(id, st)); setSel([]) }
  const bulkDelete = () => { if (confirm(`Delete ${sel.length} book(s)?`)) { actions.deleteBooks(sel); setSel([]) } }

  const Check = ({ id }) => (
    <input type="checkbox" checked={sel.includes(id)} onChange={() => toggleSel(id)} onClick={(e) => e.stopPropagation()} className="accent-[rgb(var(--accent))]" />
  )

  return (
    <>
      <PageTitle
        sub={`${list.length} of ${books.length} books`}
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
        <input className="input !w-48" placeholder="Search title, author, series" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input !w-auto" value={genre} onChange={(e) => setGenre(e.target.value)}><option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}</select>
        <select className="input !w-auto" value={where} onChange={(e) => setWhere(e.target.value)}><option value="">Where I read it</option>{SOURCES.map((g) => <option key={g}>{g}</option>)}</select>
        <select className="input !w-auto" value={mood} onChange={(e) => setMood(e.target.value)}><option value="">Any mood</option>{MOODS.map((g) => <option key={g}>{g}</option>)}</select>
        <select className="input !w-auto" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
          <option value={0}>Any rating</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★ & up</option>)}
        </select>
        <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="added">Sort: recently added</option><option value="title">Title</option><option value="author">Author</option>
          <option value="rating">Rating</option><option value="pages">Pages</option><option value="finished">Finish date</option>
        </select>
        <div className="flex ml-auto">
          {[['grid', LayoutGrid], ['list', List], ['table', TableIcon]].map(([id, Icon]) => (
            <button key={id} onClick={() => setView(id)} aria-label={id} className={`btn !rounded-none first:!rounded-l-[var(--radius)] last:!rounded-r-[var(--radius)] ${view === id ? 'btn-primary' : ''}`}><Icon size={14} /></button>
          ))}
        </div>
      </div>

      {sel.length > 0 && (
        <div className="panel px-3 py-2 mb-4 flex items-center gap-2 flex-wrap text-sm">
          <b>{sel.length} selected</b>
          {STATUSES.map((s) => <button key={s.id} className="btn text-xs" onClick={() => bulkStatus(s.id)}>→ {s.label}</button>)}
          <button className="btn text-xs" onClick={bulkDelete}><Trash2 size={13} /> Delete</button>
          <button className="btn btn-ghost text-xs ml-auto" onClick={() => setSel([])}>Clear</button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty>No books match these filters.</Empty>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-5">
          {list.map((b) => (
            <div key={b.id} className="relative group">
              <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 has-[:checked]:opacity-100"><Check id={b.id} /></div>
              <Cover book={b} size="md" className="!w-full !h-48" onClick={() => openBook(b.id)} />
              <div className="mt-2 text-sm font-semibold leading-tight truncate">{b.title}</div>
              <div className="text-xs text-muted truncate">{b.author}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="chip">{statusLabel(b.status)}</span>
                {b.favorite && <Heart size={12} className="text-accent fill-accent" />}
              </div>
              {b.status === 'reading' && <BookProgress book={b} />}
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="space-y-2">
          {list.map((b) => (
            <div key={b.id} className="panel p-3 flex gap-3 items-center cursor-pointer hover:border-accent" onClick={() => openBook(b.id)}>
              <Check id={b.id} />
              <Cover book={b} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{b.title}</div>
                <div className="text-sm text-muted truncate">{b.author}{b.series ? ` · ${b.series} #${b.seriesNumber || '?'}` : ''}</div>
                <div className="flex gap-1 mt-1 flex-wrap">{b.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>
              </div>
              <div className="text-right text-xs text-muted hidden sm:block">
                <Stars value={b.review?.rating || 0} size={12} />
                <div className="mt-1">{statusLabel(b.status)} · {b.pages || '?'}p</div>
                {b.price > 0 && <div className="font-mono">{fmtMoney(b.price, b.currency)}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left label border-b border-line">
              <tr><th className="p-2 w-8"></th><th className="p-2">Title</th><th className="p-2">Author</th><th className="p-2">Status</th><th className="p-2">Pages</th><th className="p-2">Rating</th><th className="p-2">Where</th><th className="p-2">Price</th></tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-b border-line/60 hover:bg-line/30 cursor-pointer" onClick={() => openBook(b.id)}>
                  <td className="p-2"><Check id={b.id} /></td>
                  <td className="p-2 font-semibold">{b.title}</td>
                  <td className="p-2 text-muted">{b.author}</td>
                  <td className="p-2">{statusLabel(b.status)}</td>
                  <td className="p-2 font-mono">{b.pages || '–'}</td>
                  <td className="p-2"><Stars value={b.review?.rating || 0} size={12} /></td>
                  <td className="p-2 text-muted">{b.readWhere}</td>
                  <td className="p-2 font-mono">{b.price > 0 ? fmtMoney(b.price, b.currency) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <SpendingBreakdown books={books} title="Library spending" />
        <Card title="Library stats">
          <ul className="text-sm space-y-1.5">
            <li className="flex justify-between"><span className="text-muted">Total books</span><b>{books.length}</b></li>
            {STATUSES.map((s) => <li key={s.id} className="flex justify-between"><span className="text-muted">{s.label}</span><b>{counts[s.id]}</b></li>)}
            <li className="flex justify-between"><span className="text-muted">Pages read (finished)</span><b>{books.filter((b) => b.status === 'finished').reduce((s, b) => s + (Number(b.pages) || 0), 0).toLocaleString()}</b></li>
          </ul>
        </Card>
      </div>
      {paste && <PasteList onClose={() => setPaste(false)} />}
    </>
  )
}
