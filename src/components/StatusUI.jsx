import React from 'react'
import { Check, Pause, Heart, Play, BookOpen, ShoppingBag, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Cover } from './ui.jsx'
import { useStore } from '../lib/store.jsx'
import { statusColor, statusLabel, displayTitle, progressOf } from '../lib/utils.js'

// ---------- one-click status buttons (used on cards, the volume drawer and the book page) ----------
// wishlist: I Bought It / Start Reading · bought: Start Reading · reading: Pause Reading / Mark as Finished
// paused: Resume Reading / Mark as Finished · finished: Read it again
export function StatusActions({ book, small, primaryOnly, className = '' }) {
  const { actions, flash } = useStore()
  const name = displayTitle(book)
  const cls = (primary) => `btn ${small ? '!py-1 text-xs' : ''} ${primary ? 'btn-primary' : ''}`
  const set = (status, msg) => () => {
    if (actions.setStatus(book.id, status)) flash(msg, 'success')
  }
  const again = () => {
    if (actions.readAgain(book.id)) flash(`Reading '${name}' again`, 'success')
  }
  const sz = small ? 12 : 14
  const list = {
    wishlist: [
      ['I Bought It', <ShoppingBag size={sz} />, set('bought', `Marked '${name}' as bought`), false],
      ['Start Reading', <Play size={sz} />, set('reading', `Started '${name}'`), true],
    ],
    bought: [['Start Reading', <Play size={sz} />, set('reading', `Started '${name}'`), true]],
    reading: [
      ['Pause Reading', <Pause size={sz} />, set('paused', `Paused '${name}' (page kept)`), false],
      ['Mark as Finished', <CheckCircle2 size={sz} />, set('finished', `Finished '${name}'!`), true],
    ],
    paused: [
      ['Resume Reading', <Play size={sz} />, set('reading', `Resumed '${name}'`), true],
      ['Mark as Finished', <CheckCircle2 size={sz} />, set('finished', `Finished '${name}'!`), false],
    ],
    finished: [['Read it again', <RotateCcw size={sz} />, again, false]],
  }[book.status] || []
  const shown = primaryOnly ? [list.find((x) => x[3]) || list[0]].filter(Boolean) : list
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      {shown.map(([label, icon, fn, primary]) => (
        <button key={label} className={cls(primary)} onClick={fn}>{icon} {label}</button>
      ))}
    </div>
  )
}

// ---------- status header bar above the cover ----------
export function StatusHeader({ status, favorite, compact }) {
  const c = statusColor(status)
  const icon = status === 'finished' ? <Check size={12} strokeWidth={3} /> : status === 'paused' ? <Pause size={11} strokeWidth={3} /> : status === 'reading' ? <BookOpen size={12} /> : null
  return (
    <div className={`flex items-center justify-between ${compact ? 'px-2.5 py-1' : 'px-4 py-1.5'} text-[11px] font-mono font-bold tracking-wider uppercase`} style={{ color: c, background: `color-mix(in srgb, ${c} 10%, transparent)` }} data-status-header={status}>
      <span className="inline-flex items-center gap-1.5">{icon}{status === 'bought' || status === 'wishlist' ? <span className="rounded-full border px-2 py-px" style={{ borderColor: c }}>{statusLabel(status)}</span> : status === 'reading' ? 'Currently Reading' : statusLabel(status)}</span>
      {status === 'finished' && favorite && <Heart size={13} className="fill-current" />}
    </div>
  )
}

// ---------- progress ring ----------
export function ProgressRing({ value, size = 40 }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct}% read`}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill="rgb(var(--card))" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="3.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--accent))" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${c * (pct / 100)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.27} fontWeight="700" fontFamily="var(--font-mono)" fill="rgb(var(--ink))">{pct}%</text>
    </svg>
  )
}

// circular badge at the bottom-right corner of a cover
export function CornerBadge({ status, progress = 0, size = 28 }) {
  if (status === 'finished' || status === 'paused') {
    return (
      <span className="absolute -bottom-2 -right-2 rounded-full flex items-center justify-center text-white shadow ring-2 ring-[rgb(var(--card))]" style={{ width: size, height: size, background: statusColor(status) }} data-badge={status}>
        {status === 'finished' ? <Check size={size * 0.6} strokeWidth={3.5} /> : <Pause size={size * 0.5} strokeWidth={3.5} fill="currentColor" />}
      </span>
    )
  }
  if (status === 'reading') {
    return <span className="absolute -bottom-3 -right-3 drop-shadow" data-badge="reading"><ProgressRing value={progress} size={size + 14} /></span>
  }
  return null
}

// a cover with the status badge on its corner. `book` draws the cover; `status`/`progress` drive the badge
export function BadgedCover({ book, status, progress, size = 'md', onClick, className, wrapClass = 'shrink-0 h-fit' }) {
  const st = status || book.status
  const pr = progress ?? progressOf(book)
  return (
    <div className={`relative ${wrapClass}`}>
      <Cover book={book} size={size} onClick={onClick} className={className} />
      <CornerBadge status={st} progress={pr} size={size === 'sm' ? 22 : 28} />
    </div>
  )
}

// card shell: coloured top border, status header, optional thin progress bar at the bottom for readers
export function StatusFrame({ status, favorite, progress, hidden, compact, children, className = '' }) {
  const c = statusColor(status)
  return (
    <section className={`panel overflow-hidden relative ${compact ? 'flex flex-col' : ''} ${hidden ? 'opacity-70' : ''} ${className}`} style={{ borderTop: `3px solid ${c}` }} data-status={status}>
      <StatusHeader status={status} favorite={favorite} compact={compact} />
      <div className={compact ? 'p-2.5 flex-1 flex flex-col' : 'p-4'}>{children}</div>
      {status === 'reading' && (
        <div className="h-1 bg-line/60" data-bottom-bar>
          <div className="h-full bg-accent" style={{ width: `${Math.round(Math.min(1, progress || 0) * 100)}%` }} />
        </div>
      )}
    </section>
  )
}
