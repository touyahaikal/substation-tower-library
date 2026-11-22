import React, { useState } from 'react'
import { Modal, Field, Cover, Tabs, Stars } from './ui.jsx'
import { useStore } from '../lib/store.jsx'
import {
  blankBook, STATUSES, SOURCES, FORMATS, UNITS, MOODS, GENRES, PRIORITIES, COVER_COLORS, COVER_STYLES,
} from '../lib/utils.js'
import { CURRENCIES } from '../lib/currency.js'

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export default function AddBookModal({ initial, defaults, onClose }) {
  const { actions, settings, books } = useStore()
  const editing = !!initial
  const [b, setB] = useState(() => initial || { ...blankBook(), currency: settings.primaryCurrency, ...(defaults || {}) })
  const [tab, setTab] = useState('details')
  const [genreText, setGenreText] = useState('')
  const set = (patch) => setB((x) => ({ ...x, ...patch }))
  const setCover = (patch) => setB((x) => ({ ...x, cover: { ...x.cover, ...patch } }))
  const setReview = (patch) => setB((x) => ({ ...x, review: { ...x.review, ...patch } }))
  const num = (k) => (e) => set({ [k]: e.target.value === '' ? '' : Number(e.target.value) })
  const seriesNames = [...new Set(books.map((x) => x.series).filter(Boolean))]

  const save = () => {
    if (!b.title.trim()) {
      setTab('details')
      return alert('Please enter a title')
    }
    const clean = { ...b, pages: Number(b.pages) || 0, price: Number(b.price) || 0, audioMinutes: Number(b.audioMinutes) || 0, currentPage: Number(b.currentPage) || 0 }
    if (clean.status === 'finished' && !clean.finishDate) clean.finishDate = new Date().toISOString().slice(0, 10)
    if (clean.status === 'reading' && !clean.startDate) clean.startDate = new Date().toISOString().slice(0, 10)
    if (editing) actions.updateBook(clean.id, clean)
    else actions.addBook(clean)
    onClose(clean)
  }

  const addGenre = () => {
    const g = genreText.trim()
    if (g && !b.genres.includes(g)) set({ genres: [...b.genres, g] })
    setGenreText('')
  }

  return (
    <Modal
      wide
      title={editing ? 'Edit book' : 'Add a book'}
      onClose={() => onClose()}
      footer={
        <>
          <button className="btn" onClick={() => onClose()}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>{editing ? 'Save changes' : 'Add book'}</button>
        </>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[['details', 'Details'], ['status', 'Status & Source'], ['series', 'Series, Review & Mood'], ['budget', 'Budget']]}
      />
      <div className="pt-4">
        {tab === 'details' && (
          <div className="grid sm:grid-cols-[auto,1fr] gap-5">
            <div className="space-y-3">
              <Cover book={b} size="lg" />
              <div className="flex flex-wrap gap-1.5 max-w-[10rem]">
                {COVER_COLORS.map((c) => (
                  <button key={c} aria-label={c} onClick={() => setCover({ color: c, url: '' })} className={`w-5 h-5 rounded-full border ${b.cover.color === c ? 'ring-2 ring-accent' : 'border-line'}`} style={{ background: c }} />
                ))}
              </div>
              <select className="input" value={b.cover.style} onChange={(e) => setCover({ style: e.target.value })}>
                {COVER_STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className="input" placeholder="Cover image URL (optional)" value={b.cover.url || ''} onChange={(e) => setCover({ url: e.target.value })} />
            </div>
            <div className="space-y-3">
              <Field label="Title *"><input className="input" value={b.title} onChange={(e) => set({ title: e.target.value })} autoFocus /></Field>
              <Field label="Author"><input className="input" value={b.author} onChange={(e) => set({ author: e.target.value })} /></Field>
              <Field label="Summary"><textarea className="input" rows={3} value={b.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
              <Field label="Genres">
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {b.genres.map((g) => (
                    <button key={g} className="chip !border-accent text-accent" onClick={() => set({ genres: b.genres.filter((x) => x !== g) })}>{g} ×</button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input className="input" list="genre-list" placeholder="Add a genre" value={genreText} onChange={(e) => setGenreText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())} />
                  <datalist id="genre-list">{GENRES.map((g) => <option key={g} value={g} />)}</datalist>
                  <button className="btn" type="button" onClick={addGenre}>Add</button>
                </div>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Format">
                  <select className="input" value={b.format} onChange={(e) => set({ format: e.target.value, ...(e.target.value === 'Audio' ? { unit: 'Minutes' } : {}) })}>
                    {FORMATS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Pages"><input className="input" type="number" min="0" value={b.pages} onChange={num('pages')} /></Field>
                <Field label="Progress unit">
                  <select className="input" value={b.unit} onChange={(e) => set({ unit: e.target.value })}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </Field>
              </div>
              {b.format === 'Audio' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Audio length (minutes)"><input className="input" type="number" min="0" value={b.audioMinutes} onChange={num('audioMinutes')} /></Field>
                  <Field label="Narrator"><input className="input" value={b.narrator} onChange={(e) => set({ narrator: e.target.value })} /></Field>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'status' && (
          <div className="space-y-4 max-w-xl">
            <Field label="Status">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s.id} type="button" className={`btn ${b.status === s.id ? 'btn-primary' : ''}`} onClick={() => set({ status: s.id })}>{s.label}</button>
                ))}
              </div>
            </Field>
            {b.status === 'wishlist' && (
              <Field label="Priority">
                <select className="input" value={b.priority} onChange={(e) => set({ priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
              </Field>
            )}
            {b.status === 'reading' && (
              <Field label={`Current progress (${b.unit.toLowerCase()})`}><input className="input" type="number" min="0" value={b.currentPage} onChange={num('currentPage')} /></Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date"><input className="input" type="date" value={b.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
              <Field label="Finish date"><input className="input" type="date" value={b.finishDate} onChange={(e) => set({ finishDate: e.target.value })} /></Field>
            </div>
            <Field label="Where do I read it?">
              <select className="input" value={b.readWhere} onChange={(e) => set({ readWhere: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Source note"><input className="input" placeholder="e.g. Kindle Unlimited, KL Library, from Aunt Lin" value={b.sourceNote} onChange={(e) => set({ sourceNote: e.target.value })} /></Field>
            {b.readWhere === 'Borrowed / Library' && (
              <Field label="Return date"><input className="input" type="date" value={b.returnDate} onChange={(e) => set({ returnDate: e.target.value })} /></Field>
            )}
          </div>
        )}

        {tab === 'series' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Series name">
                <input className="input" list="series-list" value={b.series} onChange={(e) => set({ series: e.target.value })} />
                <datalist id="series-list">{seriesNames.map((s) => <option key={s} value={s} />)}</datalist>
              </Field>
              <Field label="Book # in series"><input className="input" type="number" min="0" value={b.seriesNumber} onChange={num('seriesNumber')} /></Field>
              <Field label="Total books in series"><input className="input" type="number" min="0" value={b.seriesTotal} onChange={num('seriesTotal')} /></Field>
            </div>
            <Field label="Rating"><Stars size={22} value={b.review.rating} onChange={(r) => setReview({ rating: r })} /></Field>
            <Field label="Review"><textarea className="input" rows={3} value={b.review.text} onChange={(e) => setReview({ text: e.target.value })} /></Field>
            <Field label="Mood tags">
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <button key={m} type="button" className={`chip ${b.moods.includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => set({ moods: toggle(b.moods, m) })}>{m}</button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {tab === 'budget' && (
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <Field label="Currency">
              <select className="input" value={b.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
              </select>
            </Field>
            <Field label="Price paid"><input className="input" type="number" min="0" step="0.01" value={b.price} onChange={num('price')} /></Field>
            <p className="col-span-2 text-xs text-muted">Wishlist books are not counted as spending until they move to Bought.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
