import React, { useMemo, useState } from 'react'
import { Heart, ShoppingBag, Star, Search, LayoutList, LayoutGrid, CalendarClock, BookOpen, Wallet, Layers } from 'lucide-react'
import { PageTitle, Cover, Modal, Field, Empty } from '../components/ui.jsx'
import ReleaseModal from '../components/ReleaseModal.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { displayTitle, volumeText, daysUntil, comingText } from '../lib/utils.js'
import { CURRENCIES, fmtMoney, convert } from '../lib/currency.js'

function BoughtPrompt({ book, onClose }) {
  const { actions, settings, flash } = useStore()
  const [price, setPrice] = useState(book.price || '')
  const [cur, setCur] = useState(book.currency || settings.primaryCurrency)
  const finish = (withPrice) => {
    if (actions.setStatus(book.id, 'bought', withPrice ? { price: Number(price) || 0, currency: cur } : {}) !== false) flash(`Moved '${displayTitle(book)}' to Bought`, 'success')
    onClose()
  }
  return (
    <Modal title={`Got “${book.title}”`} onClose={onClose}
      footer={<><button className="btn" onClick={() => finish(false)}>Skip price</button><button className="btn btn-primary" onClick={() => finish(true)}>Save</button></>}>
      <p className="text-sm text-muted mb-3">What did you pay? This is counted in your spending.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency"><select className="input" value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map(([c]) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Price paid"><input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus /></Field>
      </div>
    </Modal>
  )
}

const FILTERS = [['all', 'All'], ['star', 'Starred / Must Read'], ['own', 'To own'], ['soon', 'Coming soon']]
const isMust = (b) => b.priority === 'Must Read'
const kindPill = (b) => (b.wishKind === 'read' ? ['Read & own', 'border-emerald-500/60 text-emerald-600'] : isMust(b) ? ['Must read', 'border-accent text-accent'] : b.priority === 'Someday' ? ['Someday', 'border-line text-muted'] : ['To own', 'border-line text-muted'])

function Stat({ icon: I, label, value, children, onClick, open }) {
  return (
    <div className="panel p-3" data-stat={label} onClick={onClick} role={onClick ? 'button' : undefined} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted"><I size={13} />{label.toUpperCase()}</div>
      <div className="h-display text-2xl font-semibold mt-0.5">{value}</div>
      {children}
    </div>
  )
}

export default function WishList() {
  const { books, actions, settings, flash } = useStore()
  const { openBook, setBookModal } = useNav()
  const [prompt, setPrompt] = useState(null)
  const [dateFor, setDateFor] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list')
  const [costOpen, setCostOpen] = useState(false)
  const all = useMemo(() => books.filter((b) => b.status === 'wishlist'), [books])
  const rates = settings.rates, prim = settings.primaryCurrency

  const stats = useMemo(() => {
    const byCur = {}
    let total = 0
    all.forEach((b) => {
      if (!(Number(b.price) > 0)) return
      const c = b.currency || prim
      byCur[c] = (byCur[c] || 0) + Number(b.price)
      total += convert(b.price, c, prim, rates)
    })
    return { pages: all.reduce((s, b) => s + (Number(b.pages) || 0), 0), starred: all.filter((b) => b.starred).length, byCur, total }
  }, [all, rates, prim])

  const list = all
    .filter((b) => {
      if (q.trim()) {
        const t = q.toLowerCase()
        if (![b.title, b.author, b.companionName, b.subtitle, (b.genres || []).join(' '), b.edition].join(' ').toLowerCase().includes(t)) return false
      }
      if (filter === 'star') return b.starred || isMust(b)
      if (filter === 'own') return b.wishKind !== 'read'
      if (filter === 'soon') { const n = daysUntil(b.releaseDate); return n != null && n > 0 }
      return true
    })
    .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0) || (a.releaseDate || '9999').localeCompare(b.releaseDate || '9999') || a.title.localeCompare(b.title))

  const got = (b) => {
    if (!(Number(b.price) > 0)) return setPrompt(b)
    if (actions.setStatus(b.id, 'bought') !== false) flash(`Moved '${displayTitle(b)}' to Bought`, 'success')
  }
  const readDays = (b) => (Number(b.pages) > 0 ? Math.max(1, Math.ceil(Number(b.pages) / 40)) : 0)

  const Star_ = ({ b }) => (
    <button className="btn btn-ghost !p-1" aria-pressed={!!b.starred} aria-label={b.starred ? 'Remove star' : 'Star this book'} data-star onClick={(e) => { e.stopPropagation(); actions.updateBook(b.id, { starred: !b.starred }) }}>
      <Star size={16} className={b.starred ? 'fill-current text-amber-500' : 'text-muted'} />
    </button>
  )
  const Date_ = ({ b }) => {
    const n = daysUntil(b.releaseDate)
    return b.releaseDate
      ? <button className={`chip ${n > 0 ? '!border-accent text-accent' : ''}`} data-release onClick={() => setDateFor(b.id)}><CalendarClock size={11} className="inline -mt-0.5" /> {n > 0 ? `coming out ${b.releaseDate}` : 'out now'}</button>
      : <button className="chip text-muted" onClick={() => setDateFor(b.id)}>+ release date</button>
  }

  return (
    <>
      <PageTitle sub={`${all.length} on the list`} action={<button className="btn btn-primary" onClick={() => setBookModal({ defaults: { status: 'wishlist' } })}>+ Add to wish list</button>}>Wish List</PageTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={BookOpen} label="Books" value={all.length} />
        <Stat icon={Layers} label="Pages" value={stats.pages.toLocaleString()} />
        <Stat icon={Wallet} label="Estimated cost" value={fmtMoney(stats.total, prim)} onClick={() => setCostOpen((v) => !v)}>
          <div className="text-[11px] text-muted mt-0.5" title={Object.entries(stats.byCur).map(([c, v]) => fmtMoney(v, c)).join('\n')}>{costOpen ? 'hide' : 'tap or hover for'} per-currency</div>
          {costOpen && <div className="mt-1 text-xs font-mono space-y-0.5" data-cost-detail>{Object.keys(stats.byCur).length ? Object.entries(stats.byCur).map(([c, v]) => <div key={c}>{fmtMoney(v, c)}</div>) : <div className="text-muted">No prices yet</div>}</div>}
        </Stat>
        <Stat icon={Star} label="★ Starred" value={stats.starred} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pl-8" placeholder="Search the wish list…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search wish list" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([id, l]) => <button key={id} className={`chip ${filter === id ? '!border-accent text-accent font-semibold' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{l}</button>)}
        </div>
        <div className="flex gap-1">
          <button className={`btn !p-1.5 ${view === 'list' ? 'btn-primary' : ''}`} aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><LayoutList size={15} /></button>
          <button className={`btn !p-1.5 ${view === 'covers' ? 'btn-primary' : ''}`} aria-label="Covers view" aria-pressed={view === 'covers'} onClick={() => setView('covers')}><LayoutGrid size={15} /></button>
        </div>
      </div>

      {all.length === 0 && <Empty icon={Heart}>Your wish list is empty.</Empty>}
      {all.length > 0 && list.length === 0 && <div className="text-sm text-muted py-6 text-center">Nothing matches this filter.</div>}

      {view === 'list' ? (
        <div className="space-y-2">
          {list.map((b) => {
            const [kl, kc] = kindPill(b)
            const rd = readDays(b)
            const sub = volumeText(b)
            return (
              <div key={b.id} className="panel p-3 flex gap-3 items-start" data-wish-row>
                <Star_ b={b} />
                <Cover book={b} size="xs" onClick={() => openBook(b.id)} />
                <div className="flex-1 min-w-0">
                  <button className="font-semibold text-left hover:text-accent block max-w-full truncate" onClick={() => openBook(b.id)}>{b.title}</button>
                  {sub && <div className="text-xs text-muted truncate">{sub}</div>}
                  <div className="text-xs text-muted mt-0.5">
                    {[b.author, (b.genres || [])[0], b.edition + (b.volume != null && b.volume !== '' && b.numbering !== 'named' ? ` ${b.volume}` : ''), b.pages ? `${b.pages} pp` : '', rd ? `about ${rd} days to read` : '', b.notesText ? b.notesText.slice(0, 40) : ''].filter(Boolean).join(' · ')}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <Date_ b={b} />
                    <span className={`chip ${kc}`}>{kl}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="text-sm font-mono">{Number(b.price) > 0 ? fmtMoney(b.price, b.currency || prim) : <span className="text-muted">no price</span>}</div>
                  <button className="btn btn-primary text-xs" onClick={() => got(b)}><ShoppingBag size={13} /> I got it</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-wish-covers>
          {list.map((b) => (
            <div key={b.id} className="space-y-1.5">
              <div className="relative"><Cover book={b} size="xl" onClick={() => openBook(b.id)} /><div className="absolute top-1 right-1 bg-[rgb(var(--card))]/80 rounded"><Star_ b={b} /></div></div>
              <div className="text-sm font-semibold truncate">{b.title}</div>
              <div className="text-xs text-muted truncate">{volumeText(b) || b.author}</div>
              <div className="flex flex-wrap gap-1"><Date_ b={b} /></div>
              <button className="btn btn-primary text-xs w-full" onClick={() => got(b)}><ShoppingBag size={13} /> I got it</button>
            </div>
          ))}
        </div>
      )}
      {prompt && <BoughtPrompt book={prompt} onClose={() => setPrompt(null)} />}
      {dateFor && <ReleaseModal bookId={dateFor} onClose={() => setDateFor(null)} />}
    </>
  )
}
