import React, { useEffect, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { displayTitle, unitSuffix, unitTotal } from '../lib/utils.js'

// Type a page, or tap -10 / -1 / +1 / +10, then press Save. Reaching the last page finishes the book;
// any progress on a Wishlist/Bought entry starts it.
export default function QuickPage({ book, className = '' }) {
  const { actions, flash } = useStore()
  const total = unitTotal(book) || 0
  const cur = Number(book.currentPage) || 0
  const [v, setV] = useState(String(cur))
  useEffect(() => setV(String(cur)), [cur, book.id])
  const n = Math.max(0, Number(v) || 0)
  // functional update: several quick taps in a row each build on the previous one
  const bump = (d) => setV((prev) => { const x = Math.max(0, Number(prev) || 0) + d; return String(Math.max(0, total ? Math.min(total, x) : x)) })
  const changed = n !== cur
  const save = () => {
    if (!changed) return flash('Nothing to save: the page is unchanged', 'info')
    if (actions.savePage(book.id, n)) {
      const done = total > 0 && n >= total
      flash(done ? `Finished '${displayTitle(book)}'!` : `Saved '${displayTitle(book)}' at${unitSuffix(book) === ' pages' ? ' page' : ''} ${n}${unitSuffix(book) === ' pages' ? '' : unitSuffix(book)}`, 'success')
    }
  }
  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`} onClick={(e) => e.stopPropagation()}>
      {[-10, -1].map((d) => <button key={d} className="btn !px-2 !py-1 text-xs font-mono" onClick={() => bump(d)}>{d}</button>)}
      <input className="input !w-16 !py-1 text-center font-mono" type="number" min="0" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} aria-label="Current page" />
      {[1, 10].map((d) => <button key={d} className="btn !px-2 !py-1 text-xs font-mono" onClick={() => bump(d)}>+{d}</button>)}
      <span className="text-xs text-muted font-mono">/ {total || '?'}</span>
      <button className={`btn !py-1 text-xs ${changed ? 'btn-primary' : ''}`} onClick={save}>Save</button>
    </div>
  )
}
