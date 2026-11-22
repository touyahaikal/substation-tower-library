import React, { useState } from 'react'
import { ArrowLeft, Heart, Pencil, Trash2, Plus } from 'lucide-react'
import { Card, Cover, Stars, Tabs, ProgressBar, Field, Empty } from '../components/ui.jsx'
import CharacterBoard from '../components/CharacterBoard.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { MOODS, todayStr, uid, progressOf, unitTotal, unitSuffix, statusLabel } from '../lib/utils.js'
import { fmtMoney } from '../lib/currency.js'

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
const SCORES = [['plot', 'Plot'], ['characters', 'Characters'], ['writing', 'Writing'], ['pacing', 'Pacing'], ['world', 'World-building']]

function Meter({ label, value, onChange, max = 5 }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 text-muted">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <button key={i} onClick={() => onChange(value === i + 1 ? 0 : i + 1)} className={`w-5 h-5 rounded-full border ${i < value ? 'bg-accent border-accent' : 'border-line'}`} aria-label={`${label} ${i + 1}`} />
        ))}
      </div>
    </div>
  )
}

export default function BookDetail() {
  const { books, actions } = useStore()
  const { bookId, go, goLibrary, setBookModal, setTimer } = useNav()
  const [tab, setTab] = useState('review')
  const [q, setQ] = useState({ text: '', page: '' })
  const [note, setNote] = useState('')
  const [log, setLog] = useState({ date: todayStr(), pages: '' })
  const b = books.find((x) => x.id === bookId)
  if (!b) return <Empty>Book not found. <button className="underline" onClick={() => goLibrary('all')}>Back to library</button></Empty>

  const upd = (patch) => actions.updateBook(b.id, patch)
  const setReview = (patch) => upd({ review: { ...b.review, ...patch } })
  const total = unitTotal(b)

  const transitions = {
    wishlist: [['Move to Bought', () => actions.setStatus(b.id, 'bought')]],
    bought: [['Start reading', () => actions.setStatus(b.id, 'reading')]],
    reading: [['Mark as finished', () => actions.setStatus(b.id, 'finished')], ['Start a timer', () => setTimer({ bookId: b.id, startedAt: Date.now() })]],
    finished: [['Read it again', () => actions.readAgain(b.id)]],
  }[b.status]

  return (
    <>
      <button className="btn btn-ghost mb-3" onClick={() => goLibrary('all')}><ArrowLeft size={14} /> Library</button>
      <div className="panel p-4 flex gap-5 flex-wrap sm:flex-nowrap">
        <Cover book={b} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="h-display text-2xl sm:text-3xl font-bold">{b.title}</h1>
              <div className="text-muted">{b.author}{b.series ? ` · ${b.series} #${b.seriesNumber || '?'}` : ''}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="btn btn-ghost !p-1.5" onClick={() => upd({ favorite: !b.favorite })} aria-label="Favorite"><Heart size={18} className={b.favorite ? 'text-accent fill-accent' : ''} /></button>
              <button className="btn btn-ghost !p-1.5" onClick={() => setBookModal({ book: b })} aria-label="Edit"><Pencil size={16} /></button>
              <button className="btn btn-ghost !p-1.5" onClick={() => { if (confirm(`Delete “${b.title}”?`)) { actions.deleteBooks([b.id]); goLibrary('all') } }} aria-label="Delete"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 my-3">
            <span className="chip !border-accent text-accent">{statusLabel(b.status)}</span>
            <span className="chip">{b.readWhere}{b.sourceNote ? ` · ${b.sourceNote}` : ''}</span>
            {b.price > 0 && b.status !== 'wishlist' && <span className="chip font-mono">{fmtMoney(b.price, b.currency)}</span>}
            <span className="chip">{b.format}{b.pages ? ` · ${b.pages}p` : ''}</span>
            {b.genres.map((g) => <span key={g} className="chip">{g}</span>)}
            {b.readWhere === 'Borrowed / Library' && b.returnDate && <span className="chip">Return by {b.returnDate}</span>}
          </div>
          {b.summary && <p className="text-sm leading-relaxed mb-3">{b.summary}</p>}
          {b.status === 'reading' && (
            <div className="mb-3">
              <ProgressBar value={progressOf(b)} />
              <div className="flex items-center gap-2 mt-2 text-sm">
                <input className="input !w-24" type="number" value={b.currentPage || 0} onChange={(e) => actions.setCurrentPage(b.id, e.target.value)} />
                <span className="text-muted font-mono text-xs">/ {total || '?'}{unitSuffix(b)}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {transitions.map(([l, fn]) => <button key={l} className="btn btn-primary" onClick={fn}>{l}</button>)}
            {b.status !== 'wishlist' && b.status !== 'bought' && null}
            {b.status === 'reading' && <button className="btn" onClick={() => actions.setStatus(b.id, 'bought')}>Move to Bought</button>}
          </div>
          <div className="text-xs text-muted mt-3 font-mono">
            {b.startDate && `Started ${b.startDate}`}{b.finishDate && ` · Finished ${b.finishDate}`}{b.reads > 1 && ` · Read ${b.reads}×`}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Tabs value={tab} onChange={setTab} tabs={[['review', 'Review'], ['quotes', `Quotes (${b.quotes.length})`], ['notes', `Notes (${b.notes.length})`], ['log', 'Reading Log'], ['chars', 'Characters'], ['mood', 'Mood & Tropes']]} />
        <div className="pt-4">
          {tab === 'review' && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card title="Rating & review">
                <Stars size={24} value={b.review.rating} onChange={(r) => setReview({ rating: r })} />
                <textarea className="input mt-3" rows={6} placeholder="What did you think?" value={b.review.text} onChange={(e) => setReview({ text: e.target.value })} />
              </Card>
              <Card title="Story elements">
                <div className="space-y-2">{SCORES.map(([k, l]) => <Meter key={k} label={l} value={b.review.scores?.[k] || 0} onChange={(v) => setReview({ scores: { ...b.review.scores, [k]: v } })} />)}</div>
              </Card>
            </div>
          )}

          {tab === 'quotes' && (
            <div className="space-y-3">
              <Card title="Save a quote">
                <div className="grid sm:grid-cols-[1fr,6rem,auto] gap-2">
                  <input className="input" placeholder="Quote text" value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} />
                  <input className="input" type="number" placeholder="Page" value={q.page} onChange={(e) => setQ({ ...q, page: e.target.value })} />
                  <button className="btn btn-primary" onClick={() => { if (!q.text.trim()) return; upd({ quotes: [{ id: uid(), text: q.text.trim(), page: q.page, date: todayStr() }, ...b.quotes] }); setQ({ text: '', page: '' }) }}><Plus size={14} /> Save</button>
                </div>
              </Card>
              {b.quotes.length === 0 && <Empty>No quotes saved yet.</Empty>}
              {b.quotes.map((x) => (
                <Card key={x.id}>
                  <blockquote className="h-display italic">“{x.text}”</blockquote>
                  <div className="flex justify-between text-xs text-muted mt-2"><span>{x.page ? `p. ${x.page} · ` : ''}{x.date}</span><button className="underline" onClick={() => upd({ quotes: b.quotes.filter((y) => y.id !== x.id) })}>delete</button></div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              <Card title="Add a reading thought">
                <div className="flex gap-2">
                  <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Today I felt…" />
                  <button className="btn btn-primary self-start" onClick={() => { if (!note.trim()) return; upd({ notes: [{ id: uid(), text: note.trim(), date: todayStr() }, ...b.notes] }); setNote('') }}>Add</button>
                </div>
              </Card>
              {b.notes.length === 0 && <Empty>No notes yet.</Empty>}
              {b.notes.map((n) => (
                <Card key={n.id}>
                  <div className="text-xs text-muted font-mono mb-1">{n.date}</div>
                  <p className="text-sm whitespace-pre-wrap">{n.text}</p>
                  <button className="underline text-xs text-muted mt-2" onClick={() => upd({ notes: b.notes.filter((y) => y.id !== n.id) })}>delete</button>
                </Card>
              ))}
            </div>
          )}

          {tab === 'log' && (
            <div className="space-y-3">
              <Card title="Add a day">
                <div className="flex gap-2 flex-wrap">
                  <input className="input !w-44" type="date" value={log.date} onChange={(e) => setLog({ ...log, date: e.target.value })} />
                  <input className="input !w-32" type="number" min="0" placeholder="Pages" value={log.pages} onChange={(e) => setLog({ ...log, pages: e.target.value })} />
                  <button className="btn btn-primary" onClick={() => { if (!log.pages) return; actions.logReading(b.id, log.pages, log.date); setLog({ date: todayStr(), pages: '' }) }}>Add a day</button>
                </div>
              </Card>
              {b.readingLog.length === 0 ? <Empty>Nothing logged yet.</Empty> : (
                <div className="panel divide-y divide-line">
                  {[...b.readingLog].sort((a, c) => c.date.localeCompare(a.date)).map((l) => (
                    <div key={l.id} className="flex justify-between px-3 py-2 text-sm">
                      <span className="font-mono">{l.date}</span>
                      <span>{l.pages} pages{l.minutes ? ` · ${l.minutes} min` : ''}</span>
                      <button className="underline text-xs text-muted" onClick={() => upd({ readingLog: b.readingLog.filter((x) => x.id !== l.id) })}>remove</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted">Total logged: {b.readingLog.reduce((s, l) => s + (Number(l.pages) || 0), 0)} pages</p>
            </div>
          )}

          {tab === 'chars' && <CharacterBoard book={b} />}

          {tab === 'mood' && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card title="Mood tags">
                <div className="flex flex-wrap gap-1.5">{MOODS.map((m) => <button key={m} className={`chip ${b.moods.includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => upd({ moods: toggle(b.moods, m) })}>{m}</button>)}</div>
              </Card>
              <Card title="Tropes & meters">
                <input className="input mb-3" placeholder="Add tropes, comma separated" value={(b.tropes || []).join(', ')} onChange={(e) => upd({ tropes: e.target.value.split(',').map((s) => s.trimStart()) })} onBlur={(e) => upd({ tropes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                <div className="space-y-2"><Meter label="Spice" value={b.spice || 0} onChange={(v) => upd({ spice: v })} /><Meter label="Tears" value={b.tears || 0} onChange={(v) => upd({ tears: v })} /></div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
