import React, { useEffect, useState } from 'react'
import { X, Star } from 'lucide-react'
import { progressOf, volumeText } from '../lib/utils.js'

export function Modal({ title, onClose, children, wide, footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`panel w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="h-display text-lg font-semibold">{title}</h2>
          <button className="btn btn-ghost !p-1" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-line flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// CSS-rendered illustrated book cover
export function Cover({ book, size = 'md', className = '', onClick }) {
  const dims = { xs: 'w-8 h-12', sm: 'w-16 h-24', md: 'w-28 h-40', lg: 'w-40 h-56', xl: 'w-48 h-72' }[size]
  const c = book.cover || {}
  const color = c.color || '#7C6F64'
  const pattern = {
    solid: 'none',
    stripes: 'repeating-linear-gradient(0deg, rgb(255 255 255 / .12) 0 6px, transparent 6px 14px)',
    diagonal: 'repeating-linear-gradient(135deg, rgb(255 255 255 / .14) 0 5px, transparent 5px 12px)',
    circle: 'radial-gradient(circle at 60% 35%, rgb(255 255 255 / .22) 0 22%, transparent 23%)',
    frame: 'linear-gradient(transparent, transparent)',
  }[c.style || 'solid']
  const showText = size !== 'xs'
  return (
    <div
      onClick={onClick}
      className={`book-cover ${dims} shrink-0 rounded-sm ${onClick ? 'cursor-pointer hover:-translate-y-0.5 transition' : ''} ${className}`}
      style={{ background: c.url ? `center/cover url("${c.url}")` : `${pattern}, ${color}` }}
      title={book.title + (volumeText(book) ? ' · ' + volumeText(book) : '')}
    >
      {!c.url && showText && (
        <div className={`absolute inset-0 pl-[12%] pr-2 py-2 flex flex-col justify-between text-white ${c.style === 'frame' ? 'm-1.5 border border-white/50' : ''}`}>
          <div className={`h-display font-bold leading-tight ${size === 'sm' ? 'text-[9px]' : 'text-sm'}`} style={{ textShadow: '0 1px 2px rgb(0 0 0 / .35)' }}>
            {book.title}
          </div>
          <div>
            {book.volume != null && book.volume !== '' && <div className={`font-mono font-bold ${size === 'sm' ? 'text-[8px]' : 'text-xs'}`}>Vol. {book.volume}</div>}
            <div className={`font-mono opacity-90 ${size === 'sm' ? 'text-[7px]' : 'text-[10px]'}`}>{book.author}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Stars({ value = 0, onChange, size = 16 }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange && onChange(value === n ? 0 : n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star`}
        >
          <Star size={size} className={n <= value ? 'text-accent fill-accent' : 'text-line'} />
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, className = '' }) {
  return (
    <div className={`h-2 bg-line/60 overflow-hidden rounded-full ${className}`}>
      <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }} />
    </div>
  )
}

export function BookProgress({ book }) {
  return <ProgressBar value={progressOf(book)} />
}

export function Empty({ icon: Icon, children }) {
  return (
    <div className="text-center text-muted py-10 text-sm">
      {Icon && <Icon className="mx-auto mb-2 opacity-60" size={28} />}
      {children}
    </div>
  )
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`panel p-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="h-display font-semibold text-base">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageTitle({ children, sub, action }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
      <div>
        <h1 className="h-display text-2xl sm:text-3xl font-bold">{children}</h1>
        {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line overflow-x-auto">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition ${value === id ? 'border-accent text-accent font-semibold' : 'border-transparent text-muted hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

// 0-100 rating: slider + direct number input
export function RatingInput({ value, onChange }) {
  const v = Number(value) || 0
  const set = (x) => onChange(Math.max(0, Math.min(100, Math.round(Number(x) || 0))))
  return (
    <div className="flex items-center gap-3">
      <input type="range" min="0" max="100" step="1" value={v} onChange={(e) => set(e.target.value)} className="flex-1 accent-[rgb(var(--accent))]" aria-label="Rating 0 to 100" />
      <input className="input !w-20 text-center font-mono" type="number" min="0" max="100" value={value === '' ? '' : v} onChange={(e) => (e.target.value === '' ? onChange(0) : set(e.target.value))} aria-label="Rating number" />
      <span className="text-xs text-muted font-mono">/100</span>
    </div>
  )
}

export function RatingBadge({ value }) {
  const v = Number(value) || 0
  if (!v) return <span className="text-xs text-muted font-mono">unrated</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono">
      <Star size={12} className="text-accent fill-accent" /> {v}<span className="text-muted">/100</span>
    </span>
  )
}

// Dropdown of known options plus a "Custom…" choice that reveals a text box
export function SelectCustom({ value, onChange, options, placeholder = 'Type your own' }) {
  const known = options.includes(value)
  const [custom, setCustom] = useState(!known && !!value)
  return (
    <div className="space-y-1.5">
      <select
        className="input"
        value={custom ? '__custom' : value}
        onChange={(e) => {
          if (e.target.value === '__custom') {
            setCustom(true)
            onChange('')
          } else {
            setCustom(false)
            onChange(e.target.value)
          }
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value="__custom">Custom…</option>
      </select>
      {custom && <input className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} autoFocus />}
    </div>
  )
}
