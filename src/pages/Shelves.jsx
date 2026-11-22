import React, { useMemo, useState } from 'react'
import { PageTitle, Cover } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { STATUSES, statusLabel } from '../lib/utils.js'

const season = () => {
  const m = new Date().getMonth()
  if (m === 11 || m <= 1) return { icon: '❄️', label: 'Winter' }
  if (m <= 4) return { icon: '🌸', label: 'Spring' }
  if (m <= 7) return { icon: '☀️', label: 'Summer' }
  return { icon: '🍂', label: 'Autumn' }
}

// Spine: a narrow coloured book whose height scales with page count
function Spine({ book, onClick }) {
  const h = 90 + Math.min(70, (Number(book.pages) || 200) / 8)
  const w = 18 + Math.min(22, (Number(book.pages) || 200) / 40)
  return (
    <button
      onClick={onClick}
      title={`${book.title} — ${book.author}`}
      className="shrink-0 relative text-white hover:-translate-y-1 transition rounded-[2px] shadow"
      style={{ height: h, width: w, background: book.cover?.color || '#7C6F64' }}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[9px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ writingMode: 'vertical-rl', maxHeight: h - 10 }}>{book.title}</span>
      </span>
      <span className="absolute inset-x-0 top-1.5 h-px bg-white/40" />
      <span className="absolute inset-x-0 bottom-1.5 h-px bg-white/40" />
    </button>
  )
}

export default function Shelves() {
  const { books } = useStore()
  const { openBook } = useNav()
  const [group, setGroup] = useState('status')
  const [display, setDisplay] = useState('cover')
  const [decor, setDecor] = useState(true)
  const s = season()

  const rows = useMemo(() => {
    if (group === 'status') return STATUSES.map((st) => [st.label, books.filter((b) => b.status === st.id)])
    if (group === 'genre') {
      const g = {}
      books.forEach((b) => (b.genres.length ? b.genres : ['Uncategorised']).forEach((x) => (g[x] = [...(g[x] || []), b])))
      return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]))
    }
    const y = {}
    books.forEach((b) => {
      const k = (b.finishDate || b.startDate || b.addedAt || '').slice(0, 4) || 'Undated'
      y[k] = [...(y[k] || []), b]
    })
    return Object.entries(y).sort((a, b) => b[0].localeCompare(a[0]))
  }, [books, group])

  return (
    <>
      <PageTitle sub="Your bookcase" action={
        <div className="flex gap-2 flex-wrap">
          <select className="input !w-auto" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="status">Group by status</option><option value="genre">Group by genre</option><option value="year">Group by year</option>
          </select>
          <select className="input !w-auto" value={display} onChange={(e) => setDisplay(e.target.value)}>
            <option value="cover">Covers</option><option value="spine">Spines</option>
          </select>
          <label className="btn cursor-pointer"><input type="checkbox" checked={decor} onChange={(e) => setDecor(e.target.checked)} /> {s.icon} {s.label}</label>
        </div>
      }>Shelves</PageTitle>
      <div className="space-y-8">
        {rows.map(([name, list], i) => (
          <section key={name}>
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="h-display text-lg font-semibold">{name}</h2>
              <span className="text-xs text-muted font-mono">{list.length}</span>
            </div>
            <div className="panel !bg-line/20 px-4 pt-4 pb-0 min-h-[8rem]">
              <div className="flex items-end gap-2 overflow-x-auto pb-0 relative">
                {list.length === 0 && <div className="text-xs text-muted pb-4">Empty shelf</div>}
                {list.map((b) => (display === 'cover'
                  ? <Cover key={b.id} book={b} size="sm" onClick={() => openBook(b.id)} />
                  : <Spine key={b.id} book={b} onClick={() => openBook(b.id)} />))}
                {decor && <span className="ml-auto pl-4 text-2xl shrink-0 pb-1 opacity-80">{['🕯️', '🪴', '☕', '🦉'][i % 4]}</span>}
              </div>
              <div className="h-2.5 -mx-4 bg-accent/40 border-t border-line" />
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
