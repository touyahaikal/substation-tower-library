import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Heart, Pencil, Plus, Eye, EyeOff, Layers, Star, Timer } from 'lucide-react'
import { Card, Cover, RatingInput, RatingBadge, Tabs, ProgressBar, Field, Empty } from '../components/ui.jsx'
import { DeleteButton } from '../components/Confirm.jsx'
import QuickPage from '../components/QuickPage.jsx'
import { useVolumeGenerator } from '../components/SeriesCard.jsx'
import { titleKey, byVolume } from '../lib/groups.js'
import CharacterBoard from '../components/CharacterBoard.jsx'
import { StatusActions, CornerBadge } from '../components/StatusUI.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { STATUSES, statusLabel, statusColor, tagList, todayStr, uid, progressOf, unitTotal, displayTitle } from '../lib/utils.js'
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
  const { books, actions, flash, settings } = useStore()
  const { bookId, openBook, openTitle, goLibrary, setBookModal, setTimer } = useNav()
  const [about, setAbout] = useState(true)
  const [startAdd, genEl] = useVolumeGenerator()
  const [tab, setTab] = useState('review')
  const [q, setQ] = useState({ text: '', page: '' })
  const [note, setNote] = useState('')
  const [log, setLog] = useState({ date: todayStr(), pages: '' })
  const b = books.find((x) => x.id === bookId)
  if (!b) return <Empty>Book not found. <button className="underline" onClick={() => goLibrary('all')}>Back to library</button></Empty>

  const upd = (patch) => actions.updateBook(b.id, patch)
  const setReview = (patch) => upd({ review: { ...b.review, ...patch } })
  const tk = titleKey(b.title)
  const siblings = books.filter((x) => titleKey(x.title) === tk)
  const sameEd = siblings.filter((x) => (x.edition || '') === (b.edition || '')).sort(byVolume)
  const at = sameEd.findIndex((x) => x.id === b.id)
  const prev = at > 0 ? sameEd[at - 1] : null
  const next = at >= 0 && at < sameEd.length - 1 ? sameEd[at + 1] : null
  const inSeries = siblings.length > 1 || (b.volume != null && b.volume !== '')
  const vol = b.volume != null && b.volume !== '' ? `Vol. ${b.volume}` : ''
  const crumb = [vol || b.edition || 'Book', vol && b.edition ? `· ${b.edition}` : ''].join(' ').trim()
  const days = b.startDate && b.finishDate ? Math.max(1, Math.round((new Date(b.finishDate) - new Date(b.startDate)) / 86400000) + 1) : null
  const meta = [
    ['Pages', b.pages ? b.pages.toLocaleString() : '—'],
    ['Started', b.startDate || b.yearStarted || '—'],
    ['Finished', b.finishDate || b.yearFinished || '—'],
    ['Days to read', days ? `${days}` : '—'],
    ['Publisher', b.publisher || '—'],
    ['Published', b.yearReleased || '—'],
    ['List price', b.price > 0 ? fmtMoney(b.price, b.currency) : '—'],
    ['Added', b.addedAt ? b.addedAt.slice(0, 10) : '—'],
  ]
  const color = statusColor(b.status)
  const moods = tagList(settings, books, 'moods')
  const tropeList = tagList(settings, books, 'tropes')
  const warnList = tagList(settings, books, 'warnings')

  return (
    <>
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-3 flex-wrap" aria-label="Breadcrumb">
        <button className="btn btn-ghost !py-1" onClick={() => goLibrary('all')}>Library</button>
        <span>›</span>
        {inSeries ? <button className="btn btn-ghost !py-1 font-semibold" onClick={() => openTitle(tk)} data-crumb="title">{b.title}</button> : <span className="text-ink font-semibold">{b.title}</span>}
        {inSeries && <><span>›</span><span className="text-ink" data-crumb="volume">{crumb}</span></>}
        <div className="ml-auto flex gap-1.5">
          <button className="btn !py-1 text-xs" disabled={!prev} onClick={() => prev && openBook(prev.id)}><ChevronLeft size={13} /> Prev Vol</button>
          <button className="btn !py-1 text-xs" disabled={!next} onClick={() => next && openBook(next.id)}>Next Vol <ChevronRight size={13} /></button>
        </div>
      </nav>

      <div className="panel overflow-hidden" style={{ borderTop: `3px solid ${color}` }} data-page="book">
       <div className="p-4 grid grid-cols-1 sm:grid-cols-[170px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-6">
        <div className="relative h-fit w-[170px] sm:w-full mx-auto sm:mx-0">
          <Cover book={b} size="xl" className="!w-full" />
          <CornerBadge status={b.status} progress={progressOf(b)} size={34} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="h-display text-2xl sm:text-3xl font-bold">{displayTitle(b)}</h1>
              <div className="text-muted">{b.author}{b.series ? ` · ${b.series} #${b.seriesNumber || '?'}` : ''}</div>
              <div className="mt-1 flex items-center gap-3 flex-wrap"><RatingBadge value={b.review.rating} /></div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="btn btn-ghost !p-1.5" onClick={() => upd({ favorite: !b.favorite })} aria-label="Favorite"><Heart size={18} className={b.favorite ? 'text-accent fill-accent' : ''} /></button>
              <button className="btn btn-ghost !p-1.5" onClick={() => setBookModal({ book: b })} aria-label="Edit"><Pencil size={16} /></button>
              <button className="btn btn-ghost !p-1.5" onClick={() => { if (actions.setHidden([b.id], !b.hidden)) flash(b.hidden ? `Unhid '${displayTitle(b)}'` : `Hid '${displayTitle(b)}'`, 'success') }} aria-label={b.hidden ? 'Unhide' : 'Hide'} title={b.hidden ? 'Unhide' : 'Hide'}>{b.hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
              <DeleteButton className="btn btn-ghost !p-1.5" onConfirm={() => { if (actions.deleteBooks([b.id])) { flash(`Deleted '${displayTitle(b)}'`, 'success'); inSeries && siblings.length > 1 ? openTitle(tk) : goLibrary('all') } }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 my-2" aria-label="Status">
            {STATUSES.map((s) => (
              <button key={s.id} className="chip transition" data-pill={s.id} aria-pressed={b.status === s.id}
                style={b.status === s.id ? { color: '#fff', background: statusColor(s.id), borderColor: statusColor(s.id), fontWeight: 600 } : {}}
                onClick={() => b.status !== s.id && actions.setStatus(b.id, s.id)}>{s.label}</button>
            ))}
            {b.edition && <span className="chip">{b.edition}</span>}
            {b.language && <span className="chip">{b.language}</span>}
            {b.hidden && <span className="chip">Hidden</span>}
            {b.genres.map((g) => <span key={g} className="chip">{g}</span>)}
            {b.readWhere === 'Borrowed / Library' && b.returnDate && <span className="chip">Return by {b.returnDate}</span>}
          </div>

          {(b.status === 'reading' || b.status === 'paused' || b.status === 'bought') && (
            <div className="mb-3">
              {b.status !== 'bought' && <ProgressBar value={progressOf(b)} />}
              <QuickPage book={b} className="mt-2" />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <StatusActions book={b} />
            {b.status === 'reading' && <button className="btn" onClick={() => setTimer({ bookId: b.id, startedAt: Date.now() })}><Timer size={14} /> Start a timer</button>}
            <button className={`btn ${b.isSeriesCover ? 'btn-primary' : ''}`} onClick={() => { if (actions.setSeriesCover(b.id)) flash(`Using ${displayTitle(b)}’s cover for the whole series`, 'success') }}><Star size={14} /> {b.isSeriesCover ? 'Series cover ✓' : 'Set as Series Cover'}</button>
            <button className="btn" onClick={() => startAdd(sameEd)}><Layers size={14} /> {b.volume != null && b.volume !== '' ? 'Add more volumes' : 'Add volumes'}</button>
          </div>
          {b.reads > 1 && <div className="text-xs text-muted mt-3 font-mono">Read {b.reads}×</div>}
        <div className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" data-meta>
            {meta.map(([l, v]) => (
              <div key={l} className="rounded-full border border-line px-3 py-1 text-center min-w-0">
                <div className="text-[10px] font-mono tracking-wider uppercase text-muted">{l}</div>
                <div className="text-sm font-semibold truncate">{v}</div>
              </div>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase text-muted hover:text-ink" onClick={() => setAbout(!about)} aria-expanded={about}>
            <ChevronDown size={14} className={`transition ${about ? '' : '-rotate-90'}`} /> About the book
          </button>
          {about && (
            <div className="mt-2 text-sm leading-relaxed space-y-2" data-about>
              {b.summary ? <p>{b.summary}</p> : <p className="text-muted">No description yet. Use Edit to add one.</p>}
              {b.notesText && <p className="whitespace-pre-wrap border-l-2 border-line pl-3 text-muted">{b.notesText}</p>}
            </div>
          )}
         </div>
  
        </div>
       </div>

      </div>

      <div className="mt-4">
        <Tabs value={tab} onChange={setTab} tabs={[['review', 'Review'], ['quotes', `Quotes (${b.quotes.length})`], ['notes', `Notes (${b.notes.length})`], ['log', 'Reading Log'], ['chars', 'Characters'], ['mood', 'Mood & Tropes']]} />
        <div className="pt-3">
          {tab === 'review' && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card title="Rating & review">
                <RatingInput value={b.review.rating} onChange={(r) => setReview({ rating: r })} />
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
                <div className="flex flex-wrap gap-1.5">{moods.map((m) => <button key={m} className={`chip ${b.moods.includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => upd({ moods: toggle(b.moods, m) })}>{m}</button>)}</div>
              </Card>
              <Card title="Tropes & meters">
                <div className="flex flex-wrap gap-1.5 mb-2">{tropeList.map((m) => <button key={m} className={`chip ${(b.tropes || []).includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => upd({ tropes: toggle(b.tropes || [], m) })}>{m}</button>)}</div>
                <input className="input mb-3" placeholder="Add tropes, comma separated" value={(b.tropes || []).join(', ')} onChange={(e) => upd({ tropes: e.target.value.split(',').map((s) => s.trimStart()) })} onBlur={(e) => upd({ tropes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
 <div className="label">Content warnings</div>
                <div className="flex flex-wrap gap-1.5 mb-3">{warnList.map((m) => <button key={m} className={`chip ${(b.contentWarnings || []).includes(m) ? '!border-red-500 text-red-500' : ''}`} onClick={() => upd({ contentWarnings: toggle(b.contentWarnings || [], m) })}>{m}</button>)}</div>
                <div className="space-y-2"><Meter label="Spice" value={b.spice || 0} onChange={(v) => upd({ spice: v })} /><Meter label="Tears" value={b.tears || 0} onChange={(v) => upd({ tears: v })} /></div>
              </Card>
            </div>
          )}
        </div>
      </div>
      {genEl}
    </>
  )
}
