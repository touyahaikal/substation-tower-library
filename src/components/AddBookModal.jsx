import React, { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Modal, Field, Cover, Tabs, RatingInput, SelectCustom } from './ui.jsx'
import { useStore } from '../lib/store.jsx'
import {
  blankBook, STATUSES, SOURCES, UNITS, MOODS, QUICK_GENRES, LANGUAGES, EDITIONS, PRIORITIES, COVER_COLORS, COVER_STYLES,
  formatFromEdition, syncYears, displayTitle,
} from '../lib/utils.js'
import { CURRENCIES } from '../lib/currency.js'
import { compressImage } from '../lib/image.js'

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
const parseGenres = (t) => [...new Set(t.split(',').map((x) => x.trim()).filter(Boolean))]

export default function AddBookModal({ initial, defaults, onClose }) {
  const { actions, settings, books, flash } = useStore()
  const editing = !!initial
  const [b, setB] = useState(() => ({ ...blankBook(), currency: settings.primaryCurrency, ...(initial || {}), ...(defaults || {}) }))
  const [tab, setTab] = useState('details')
  const [genreText, setGenreText] = useState(() => (b.genres || []).join(', '))
  const [titleErr, setTitleErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const titleRef = useRef(null)
  const fileRef = useRef(null)
  const set = (patch) => setB((x) => ({ ...x, ...patch }))
  const setCover = (patch) => setB((x) => ({ ...x, cover: { ...x.cover, ...patch } }))
  const setReview = (patch) => setB((x) => ({ ...x, review: { ...x.review, ...patch } }))
  const num = (k) => (e) => set({ [k]: e.target.value === '' ? '' : Number(e.target.value) })
  const seriesNames = [...new Set(books.map((x) => x.series).filter(Boolean))]
  const genres = parseGenres(genreText)
  const isAudio = b.edition === 'Audiobook'

  const setGenresList = (list) => {
    setGenreText(list.join(', '))
    set({ genres: list })
  }
  const onGenreText = (t) => {
    setGenreText(t)
    set({ genres: parseGenres(t) })
  }
  const setEdition = (edition) => set({ edition, format: formatFromEdition(edition), ...(edition === 'Audiobook' ? { unit: 'Minutes' } : b.unit === 'Minutes' ? { unit: 'Pages' } : {}) })

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    try {
      const url = await compressImage(f, { maxWidth: 400, quality: 0.8 })
      setCover({ url })
      flash(`Cover resized and compressed (${Math.round(url.length / 1024)} KB)`, 'success')
    } catch (err) {
      flash(err.message || 'Could not use that image', 'error')
    }
  }

  const save = () => {
    if (busy) return
    if (!b.title.trim()) {
      setTab('details')
      setTitleErr(true)
      flash('Title is required: please enter a title before saving', 'error')
      setTimeout(() => titleRef.current && titleRef.current.focus(), 50)
      return
    }
    setBusy(true)
    try {
      let clean = {
        ...b,
        title: b.title.trim(), author: (b.author || '').trim(), genres,
        format: formatFromEdition(b.edition || 'Paperback'), edition: (b.edition || '').trim() || 'Paperback',
        language: (b.language || '').trim() || 'English',
        pages: Number(b.pages) || 0, price: Number(b.price) || 0, audioMinutes: Number(b.audioMinutes) || 0, currentPage: Number(b.currentPage) || 0,
        review: { ...b.review, rating: Math.max(0, Math.min(100, Number(b.review.rating) || 0)) },
      }
      const t = new Date().toISOString().slice(0, 10)
      if (clean.status === 'reading' && clean.pages > 0 && clean.unit === 'Pages' && clean.currentPage >= clean.pages) clean.status = 'finished'
      if (clean.status === 'finished' && !clean.finishDate && !clean.yearFinished) clean.finishDate = t
      if (clean.status === 'reading' && !clean.startDate && !clean.yearStarted) clean.startDate = t
      clean = syncYears(clean)
      const ok = editing ? actions.updateBook(clean.id, clean) : actions.addBook(clean)
      if (!ok) return // mutate() already showed why (read-only / still loading)
      flash(`Saved '${displayTitle(clean)}' to library`, 'success')
      onClose(clean)
    } catch (err) {
      flash(`Could not save: ${err.message || err}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const priceCur = b.currency || settings.primaryCurrency

  return (
    <Modal
      wide
      title={editing ? 'Edit entry' : 'New entry'}
      onClose={() => onClose()}
      footer={
        <>
          <button className="btn" onClick={() => onClose()}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{editing ? 'Save changes' : 'Save entry'}</button>
        </>
      }
    >
      <Tabs value={tab} onChange={setTab} tabs={[['details', 'Details'], ['status', 'Dates & Source'], ['series', 'Series, Review & Mood']]} />
      <div className="pt-4">
        {tab === 'details' && (
          <div className="grid sm:grid-cols-[auto,1fr] gap-5">
            <div className="space-y-3 sm:w-44">
              <Cover book={b} size="lg" />
              <div className="flex flex-wrap gap-1.5">
                {COVER_COLORS.map((c) => (
                  <button key={c} aria-label={c} onClick={() => setCover({ color: c, url: '' })} className={`w-5 h-5 rounded-full border ${b.cover.color === c && !b.cover.url ? 'ring-2 ring-accent' : 'border-line'}`} style={{ background: c }} />
                ))}
              </div>
              <select className="input" value={b.cover.style} onChange={(e) => setCover({ style: e.target.value, url: '' })}>
                {COVER_STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className="input" placeholder="Paste image URL" value={b.cover.url && b.cover.url.startsWith('data:') ? '' : b.cover.url || ''} onChange={(e) => setCover({ url: e.target.value.trim() })} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <button type="button" className="btn w-full text-xs" onClick={() => fileRef.current && fileRef.current.click()}><Upload size={13} /> Upload image</button>
              {b.cover.url && b.cover.url.startsWith('data:') && <div className="text-[11px] text-muted">Uploaded · {Math.round(b.cover.url.length / 1024)} KB (auto-shrunk)</div>}
              {b.cover.url && <button type="button" className="btn btn-ghost w-full text-xs" onClick={() => setCover({ url: '' })}><X size={12} /> Remove image</button>}
            </div>

            <div className="space-y-3 min-w-0">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Title *">
                  <input ref={titleRef} className={`input ${titleErr ? '!border-red-500 ring-2 ring-red-500/40' : ''}`} value={b.title} onChange={(e) => { set({ title: e.target.value }); setTitleErr(false) }} autoFocus onKeyDown={(e) => e.key === 'Enter' && save()} aria-invalid={titleErr} />
                  {titleErr && <span className="text-xs text-red-500">Required</span>}
                </Field>
                <Field label="Author"><input className="input" value={b.author} onChange={(e) => set({ author: e.target.value })} /></Field>
              </div>

              <Field label="Genre (comma-separated)">
                <input className="input" value={genreText} onChange={(e) => onGenreText(e.target.value)} placeholder="Fantasy, Drama" />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {QUICK_GENRES.map((g) => {
                    const on = genres.some((x) => x.toLowerCase() === g.toLowerCase())
                    return (
                      <button key={g} type="button" className={`chip ${on ? '!border-accent text-accent' : ''}`} aria-pressed={on}
                        onClick={() => setGenresList(on ? genres.filter((x) => x.toLowerCase() !== g.toLowerCase()) : [...genres, g])}>
                        {on ? '✓ ' : '+ '}{g}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Language"><SelectCustom value={b.language} onChange={(language) => set({ language })} options={LANGUAGES} placeholder="Language" /></Field>
                <Field label="Edition / Format"><SelectCustom value={b.edition} onChange={setEdition} options={EDITIONS} placeholder="Edition" /></Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Total pages"><input className="input" type="number" min="0" value={b.pages} onChange={num('pages')} /></Field>
                <Field label="Current page"><input className="input" type="number" min="0" value={b.currentPage} onChange={num('currentPage')} /></Field>
                <Field label="Progress unit" className="col-span-2 sm:col-span-1">
                  <select className="input" value={b.unit} onChange={(e) => set({ unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                </Field>
              </div>
              {isAudio && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Audio length (minutes)"><input className="input" type="number" min="0" value={b.audioMinutes} onChange={num('audioMinutes')} /></Field>
                  <Field label="Narrator"><input className="input" value={b.narrator} onChange={(e) => set({ narrator: e.target.value })} /></Field>
                </div>
              )}

              <Field label="Status">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s.id} type="button" className={`btn ${b.status === s.id ? 'btn-primary' : ''}`} aria-pressed={b.status === s.id} onClick={() => set({ status: s.id })}>{s.label}</button>
                  ))}
                </div>
              </Field>

              <Field label="Rating (0–100)"><RatingInput value={b.review.rating} onChange={(rating) => setReview({ rating })} /></Field>

              <Field label="Price">
                <div className="flex gap-2">
                  <select className="input !w-28" value={priceCur} onChange={(e) => set({ currency: e.target.value })} aria-label="Currency">
                    {CURRENCIES.map(([c, n]) => <option key={c} value={c} title={n}>{c}</option>)}
                  </select>
                  <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={b.price} onChange={num('price')} aria-label="Price" />
                </div>
                <span className="text-[11px] text-muted">Wishlist entries aren’t counted as spending until they move to Bought.</span>
              </Field>

              <Field label="Notes"><textarea className="input" rows={3} value={b.notesText} onChange={(e) => set({ notesText: e.target.value })} placeholder="Anything you want to remember" /></Field>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[['yearReleased', 'Year released'], ['yearBought', 'Year bought'], ['yearStarted', 'Year started'], ['yearFinished', 'Year finished']].map(([k, l]) => (
                  <Field key={k} label={l}><input className="input font-mono" type="number" min="1000" max="2100" placeholder="YYYY" value={b[k]} onChange={num(k)} /></Field>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'status' && (
          <div className="space-y-4 max-w-xl">
            {b.status === 'wishlist' && (
              <Field label="Priority"><select className="input" value={b.priority} onChange={(e) => set({ priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date"><input className="input" type="date" value={b.startDate} onChange={(e) => set({ startDate: e.target.value, yearStarted: e.target.value ? Number(e.target.value.slice(0, 4)) : b.yearStarted })} /></Field>
              <Field label="Finish date"><input className="input" type="date" value={b.finishDate} onChange={(e) => set({ finishDate: e.target.value, yearFinished: e.target.value ? Number(e.target.value.slice(0, 4)) : b.yearFinished })} /></Field>
            </div>
            <p className="text-xs text-muted">Only know the year? Fill in the year fields on the Details tab; exact dates are optional (they place the book in the monthly chart).</p>
            <Field label="Where do I read it?">
              <select className="input" value={b.readWhere} onChange={(e) => set({ readWhere: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Source note"><input className="input" placeholder="e.g. Kindle Unlimited, KL Library, from Aunt Lin" value={b.sourceNote} onChange={(e) => set({ sourceNote: e.target.value })} /></Field>
            {b.readWhere === 'Borrowed / Library' && <Field label="Return date"><input className="input" type="date" value={b.returnDate} onChange={(e) => set({ returnDate: e.target.value })} /></Field>}
          </div>
        )}

        {tab === 'series' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Volume number (optional)"><input className="input font-mono" type="number" step="0.5" placeholder="e.g. 0, 0.5, 1, 2…" value={b.volume ?? ''} onChange={(e) => set({ volume: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
              <Field label="Volume subtitle (optional)"><input className="input" placeholder="e.g. Prologue" value={b.volumeLabel} onChange={(e) => set({ volumeLabel: e.target.value })} /></Field>
            </div>
            <p className="text-xs text-muted -mt-2">Entries with the same title and different editions group together automatically. Use “Add volumes” on a library entry to create a whole range at once.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Older-style series name">
                <input className="input" list="series-list" value={b.series} onChange={(e) => set({ series: e.target.value })} />
                <datalist id="series-list">{seriesNames.map((s) => <option key={s} value={s} />)}</datalist>
              </Field>
              <Field label="Book # in series"><input className="input" type="number" min="0" value={b.seriesNumber} onChange={num('seriesNumber')} /></Field>
              <Field label="Total books in series"><input className="input" type="number" min="0" value={b.seriesTotal} onChange={num('seriesTotal')} /></Field>
            </div>
            <Field label="Review"><textarea className="input" rows={3} value={b.review.text} onChange={(e) => setReview({ text: e.target.value })} /></Field>
            <Field label="Mood tags">
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => <button key={m} type="button" className={`chip ${b.moods.includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => set({ moods: toggle(b.moods, m) })}>{m}</button>)}
              </div>
            </Field>
          </div>
        )}
      </div>
    </Modal>
  )
}
