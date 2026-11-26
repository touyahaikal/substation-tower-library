import React, { useMemo, useState } from 'react'
import { PageTitle, Cover } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { STATUSES, displayTitle } from '../lib/utils.js'

const autoSeason = () => {
  const m = new Date().getMonth()
  if (m === 11 || m <= 1) return 'winter'
  if (m <= 4) return 'spring'
  if (m <= 7) return 'minimal'
  return 'autumn'
}
export const DECOR = [['auto', 'Seasonal'], ['autumn', 'Autumn'], ['spring', 'Spring'], ['winter', 'Winter'], ['minimal', 'Minimal'], ['off', 'Off']]

// ---- small inline SVG ornaments, coloured per theme ----
const Leaf = ({ c, r = 0, s = 1 }) => <path transform={`rotate(${r}) scale(${s})`} d="M0 -14 C10 -10 12 4 0 14 C-12 4 -10 -10 0 -14 Z M0 -14 L0 14" fill={c} stroke="rgb(0 0 0 / .25)" strokeWidth=".8" />
function Ornament({ kind, theme, i }) {
  const tt = theme === 'ttpd'
  const brass = tt ? '#B08D57' : '#D97706', copper = tt ? '#8A6A4F' : '#B45309', paper = tt ? '#E7DCC4' : '#9CA3AF'
  const leaves = tt ? ['#B5651D', '#9A4F1C', '#C9953C'] : ['#D97706', '#B45309', '#F59E0B']
  const wrap = (children, w = 64) => <svg width={w} height="96" viewBox={`0 0 ${w} 96`} className="shrink-0 self-end mb-0" aria-hidden="true">{children}</svg>
  if (kind === 'autumn') {
    return tt
      ? wrap(<>
          <rect x="22" y="62" width="20" height="34" rx="3" fill={brass} />
          <rect x="25" y="58" width="14" height="6" fill={copper} />
          <g transform="translate(32 38)"><Leaf c={leaves[i % 3]} r={-20} s={1.3} /></g>
          <g transform="translate(20 52)"><Leaf c={leaves[(i + 1) % 3]} r={35} s={.9} /></g>
          <rect x="6" y="86" width="52" height="10" rx="1" fill={paper} stroke="rgb(0 0 0 / .2)" />
        </>)
      : wrap(<>
          <rect x="14" y="70" width="36" height="26" rx="2" fill={copper} />
          <rect x="14" y="70" width="36" height="5" fill={brass} />
          <g transform="translate(32 52)"><Leaf c={leaves[i % 3]} r={10} s={1.6} /></g>
          <g transform="translate(22 56)"><Leaf c={leaves[(i + 2) % 3]} r={-40} s={1.1} /></g>
        </>)
  }
  if (kind === 'spring') {
    const stem = '#6B8E5A', bloom = tt ? '#C99AA6' : '#F59E0B'
    return tt
      ? wrap(<>
          <path d="M32 90 C30 70 36 56 32 34" stroke={stem} strokeWidth="2" fill="none" />
          <path d="M32 70 C42 64 46 58 48 50" stroke={stem} strokeWidth="2" fill="none" />
          {[[32, 30], [48, 46], [24, 52]].map(([x, y], k) => <g key={k} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-5" rx="3.2" ry="5" fill={bloom} transform={`rotate(${a})`} />)}<circle r="2" fill={brass} /></g>)}
          <rect x="22" y="86" width="20" height="10" rx="2" fill={paper} stroke="rgb(0 0 0 / .2)" />
        </>)
      : wrap(<>
          <rect x="16" y="76" width="32" height="20" rx="2" fill={copper} />
          {[22, 32, 42].map((x, k) => <path key={x} d={`M${x} 76 C${x - 6} ${58 - k * 4} ${x + 6} ${52 - k * 3} ${x} ${44 - k * 2}`} stroke={stem} strokeWidth="3" fill="none" />)}
          <circle cx="32" cy="42" r="4" fill={bloom} />
        </>)
  }
  if (kind === 'winter') {
    return wrap(<>
      <rect x="20" y="64" width="24" height="32" rx="4" fill={tt ? paper : '#475569'} stroke="rgb(0 0 0 / .25)" />
      <path d="M32 64 C28 52 36 48 32 36 C40 46 38 54 32 64Z" fill={brass} opacity=".9" />
      <rect x="29" y="60" width="6" height="6" fill={copper} />
      <g stroke={tt ? '#8A9BB0' : '#93C5FD'} strokeWidth="1.2"><path d="M10 18v10M5 23h10M54 10v10M49 15h10" /></g>
    </>)
  }
  return null
}

// Spine: a narrow coloured book whose height scales with page count
function Spine({ book, onClick }) {
  const h = 130 + Math.min(70, (Number(book.pages) || 200) / 6)
  const w = 26 + Math.min(26, (Number(book.pages) || 200) / 30)
  return (
    <button onClick={onClick} title={`${displayTitle(book)} — ${book.author}`} className="shrink-0 relative text-white hover:-translate-y-1 transition rounded-[2px] shadow" style={{ height: h, width: w, background: book.cover?.color || '#7C6F64' }}>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ writingMode: 'vertical-rl', maxHeight: h - 14 }}>{book.title}</span>
      </span>
      <span className="absolute inset-x-0 top-2 h-px bg-white/40" />
      <span className="absolute inset-x-0 bottom-2 h-px bg-white/40" />
    </button>
  )
}

export default function Shelves() {
  const { books, settings, actions } = useStore()
  const { openBook } = useNav()
  const [group, setGroup] = useState('status')
  const [display, setDisplay] = useState('cover')
  const mode = settings.shelfDecor || 'auto'
  const kind = mode === 'auto' ? autoSeason() : mode
  const theme = settings.theme

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

  const plank = theme === 'ttpd' ? 'linear-gradient(#8A6A4F,#6B5039)' : 'linear-gradient(#B45309,#78350F)'
  const showDecor = kind !== 'off' && kind !== 'minimal'
  return (
    <>
      <PageTitle sub="Your bookcase" action={
        <div className="flex gap-2 flex-wrap">
          <select className="input !w-auto" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group shelves">
            <option value="status">Group by status</option><option value="genre">Group by genre</option><option value="year">Group by year</option>
          </select>
          <select className="input !w-auto" value={display} onChange={(e) => setDisplay(e.target.value)} aria-label="Cover or spine">
            <option value="cover">Covers</option><option value="spine">Spines</option>
          </select>
          <select className="input !w-auto" value={mode} onChange={(e) => actions.setSettings({ shelfDecor: e.target.value })} aria-label="Shelf decoration">
            {DECOR.map(([id, l]) => <option key={id} value={id}>Decor: {l}</option>)}
          </select>
        </div>
      }>Shelves</PageTitle>
      <div className="space-y-6">
        {rows.map(([name, list], i) => (
          <section key={name} data-shelf>
            <div className="flex items-baseline gap-2 mb-1.5">
              <h2 className="h-display text-xl font-semibold">{name}</h2>
              <span className="text-xs text-muted font-mono">{list.length}</span>
            </div>
            <div className="panel !bg-line/20 px-5 pt-5 pb-0 min-h-[220px] flex flex-col justify-end relative" data-shelf-body>
              {showDecor && <span className="absolute right-4 bottom-4 pointer-events-none hidden sm:block" data-decor={kind}><Ornament kind={kind} theme={theme} i={i} /></span>}
              <div className={`flex items-end gap-3 overflow-x-auto pb-0 relative ${showDecor ? 'sm:pr-20' : ''}`}>
                {list.length === 0 && <div className="text-xs text-muted pb-6">Empty shelf</div>}
                {list.map((b) => (display === 'cover'
                  ? <Cover key={b.id} book={b} size="md" onClick={() => openBook(b.id)} />
                  : <Spine key={b.id} book={b} onClick={() => openBook(b.id)} />))}
              </div>
              <div className="h-4 -mx-5 border-t border-black/20 shadow-[0_3px_6px_rgb(0_0_0/.25)]" style={{ background: plank }} />
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
