import React, { useRef, useState } from 'react'
import { Upload, Link2, X, Plus, ExternalLink } from 'lucide-react'
import { Modal, Field, Cover, PillTabs, RatingInput, SelectCustom } from './ui.jsx'
import { DeleteButton } from './Confirm.jsx'
import { useStore } from '../lib/store.jsx'
import {
  blankBook, tagList, STATUSES, SOURCES, UNITS, QUICK_GENRES, LANGUAGES, EDITIONS, PRIORITIES, COVER_COLORS, COVER_STYLES, NUMBERING,
  formatFromEdition, syncYears, displayTitle, volumeText, numPrefix, splitAuthors, normalizeUrl, linkInfo, uid,
} from '../lib/utils.js'
import { titleKey } from '../lib/groups.js'
import { CURRENCIES } from '../lib/currency.js'
import { compressImage } from '../lib/image.js'

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
const parseGenres = (t) => [...new Set(t.split(',').map((x) => x.trim()).filter(Boolean))]

export default function AddBookModal({ initial, defaults, onClose }) {
  const { actions, settings, books, flash } = useStore()
  const editing = !!initial
  const [b, setB] = useState(() => ({ ...blankBook(), currency: settings.primaryCurrency, language: settings.defaultLanguage || 'English', ...(initial || {}), ...(defaults || {}) }))
  const [tab, setTab] = useState('general')
  const [genreText, setGenreText] = useState(() => (b.genres || []).join(', '))
  const [authorText, setAuthorText] = useState('')
  const [linkText, setLinkText] = useState('')
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [titleErr, setTitleErr] = useState(false)
  const [busy, setBusy] = useState(false)
  // titles that already exist (other entries), for "another edition of a book I have"
  const existing = (() => {
    const m = new Map()
    books.forEach((x) => { if (x.id !== b.id && x.title && !m.has(titleKey(x.title))) m.set(titleKey(x.title), x.title) })
    return [...m.values()].sort((p, q) => p.localeCompare(q))
  })()
  const [asEdition, setAsEdition] = useState(() => !!(initial || defaults) && existing.some((t) => titleKey(t) === titleKey((b.title) || '')) && editing)
  const titleRef = useRef(null)
  const fileRef = useRef(null)
  const set = (patch) => setB((x) => ({ ...x, ...patch }))
  const setCover = (patch) => setB((x) => ({ ...x, cover: { ...x.cover, ...patch } }))
  const setReview = (patch) => setB((x) => ({ ...x, review: { ...x.review, ...patch } }))
  const num = (k) => (e) => set({ [k]: e.target.value === '' ? '' : Number(e.target.value) })
  const seriesNames = [...new Set(books.map((x) => x.series).filter(Boolean))]
  const genres = parseGenres(genreText)
  const isAudio = b.edition === 'Audiobook'
  const authors = b.authors || []

  const setGenresList = (list) => { setGenreText(list.join(', ')); set({ genres: list }) }
  const onGenreText = (t) => { setGenreText(t); set({ genres: parseGenres(t) }) }
  const setEdition = (edition) => set({ edition, format: formatFromEdition(edition), ...(edition === 'Audiobook' ? { unit: 'Minutes' } : b.unit === 'Minutes' ? { unit: 'Pages' } : {}) })

  const addAuthors = (text) => {
    const add = splitAuthors(text)
    if (!add.length) return
    const next = [...authors]
    add.forEach((a) => { if (!next.some((x) => x.toLowerCase() === a.toLowerCase())) next.push(a) })
    set({ authors: next })
    setAuthorText('')
  }
  const addLink = () => {
    if (!linkText.trim()) return
    const url = normalizeUrl(linkText)
    if (!url) return flash('That does not look like a web address', 'error')
    if ((b.links || []).some((l) => l.url === url)) { setLinkText(''); return }
    set({ links: [...(b.links || []), { id: uid(), url }] })
    setLinkText('')
  }
  const useUrl = () => {
    const url = urlText.trim()
    if (!url) return
    setCover({ url })
    setUrlText('')
    setUrlOpen(false)
  }

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    try {
      const url = await compressImage(f)
      setCover({ url })
      flash(`Cover resized and compressed (${Math.round(url.length / 1024)} KB)`, 'success')
    } catch (err) {
      flash(err.message || 'Could not use that image', 'error')
    }
  }

  const dots = {
    general: !!(authors.length || genres.length || b.summary),
    details: !!(Number(b.pages) || b.publisher || b.notesText || (b.links || []).length || b.yearReleased || b.yearBought),
    series: !!((b.volume != null && b.volume !== '') || b.subtitle || b.companionName || b.series || asEdition),
    status: !!(b.startDate || b.finishDate || b.sourceNote || b.releaseDate || b.status !== 'bought'),
    mood: !!(b.review.rating || b.review.text || b.moods.length || (b.tropes || []).length || (b.contentWarnings || []).length || Number(b.price)),
  }

  const save = () => {
    if (busy) return
    if (!b.title.trim()) {
      setTab('general')
      setTitleErr(true)
      flash('Title is required: please enter a title before saving', 'error')
      setTimeout(() => titleRef.current && titleRef.current.focus(), 50)
      return
    }
    if (b.numbering === 'named' && !(b.companionName || '').trim()) {
      setTab('series')
      flash('Please name this companion book (e.g. Official Fanbook)', 'error')
      return
    }
    setBusy(true)
    try {
      const pendingAuthors = splitAuthors(authorText)
      const finalAuthors = [...authors]
      pendingAuthors.forEach((a) => { if (!finalAuthors.some((x) => x.toLowerCase() === a.toLowerCase())) finalAuthors.push(a) })
      let clean = {
        ...b,
        title: b.title.trim(), authors: finalAuthors, author: finalAuthors.join(', '), genres,
        format: formatFromEdition(b.edition || 'Paperback'), edition: (b.edition || '').trim() || 'Paperback',
        language: (b.language || '').trim() || 'English',
        pages: Number(b.pages) || 0, price: Number(b.price) || 0, audioMinutes: Number(b.audioMinutes) || 0, currentPage: Number(b.currentPage) || 0,
        review: { ...b.review, rating: Math.max(0, Math.min(100, Number(b.review.rating) || 0)) },
        volume: b.numbering === 'named' ? null : b.volume,
        companionName: b.numbering === 'named' ? (b.companionName || '').trim() : '',
        subtitle: (b.subtitle || '').trim(),
      }
      if (clean.numbering === 'subtitle') clean.volumeLabel = clean.subtitle
      const t = new Date().toISOString().slice(0, 10)
      if (clean.status === 'reading' && clean.pages > 0 && clean.unit === 'Pages' && clean.currentPage >= clean.pages) clean.status = 'finished'
      if (clean.status === 'finished' && !clean.finishDate && !clean.yearFinished) clean.finishDate = t
      if ((clean.status === 'reading' || clean.status === 'paused') && !clean.startDate && !clean.yearStarted) clean.startDate = t
      clean = syncYears(clean)
      const ok = editing ? actions.updateBook(clean.id, clean) : actions.addBook(clean)
      if (!ok) return
      flash(`Saved '${displayTitle(clean)}' to library`, 'success')
      onClose(clean)
    } catch (err) {
      flash(`Could not save: ${err.message || err}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = () => {
    if (actions.deleteBooks([b.id])) {
      flash(`Deleted '${displayTitle(b)}'`, 'success')
      onClose()
    }
  }

  const priceCur = b.currency || settings.primaryCurrency
  const preview = volumeText({ ...b, volume: b.numbering === 'named' ? null : b.volume, subtitle: b.subtitle })

  return (
    <Modal
      wide="xl"
      title={editing ? 'Edit entry' : 'New entry'}
      onClose={() => onClose()}
      footer={
        <div className="flex items-center gap-2 w-full">
          {editing && <DeleteButton className="btn text-red-500" label="Delete" prompt="Delete this entry?" onConfirm={remove} />}
          <span className="flex-1" />
          <button className="btn" onClick={() => onClose()}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{editing ? 'Save changes' : 'Save entry'}</button>
        </div>
      }
    >
      <div className="grid md:grid-cols-[11rem,1fr] gap-5">
        {/* cover column */}
        <div className="space-y-2.5 md:w-44 max-w-[11rem] mx-auto md:mx-0 w-full">
          <Cover book={b} size="lg" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <button type="button" className="btn w-full text-xs" onClick={() => fileRef.current && fileRef.current.click()}><Upload size={13} /> From my device</button>
          <button type="button" className="btn w-full text-xs" aria-expanded={urlOpen} onClick={() => setUrlOpen((v) => !v)}><Link2 size={13} /> From a link</button>
          {urlOpen && (
            <div className="space-y-1.5">
              <input className="input" placeholder="https://…/cover.jpg" value={urlText} onChange={(e) => setUrlText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); useUrl() } }} aria-label="Cover image link" />
              <button type="button" className="btn btn-primary w-full text-xs" onClick={useUrl}>Use this image</button>
            </div>
          )}
          {b.cover.url && b.cover.url.startsWith('data:') && <div className="text-[11px] text-muted">Uploaded · {Math.round(b.cover.url.length / 1024)} KB (auto-shrunk)</div>}
          {b.cover.url && <button type="button" className="btn btn-ghost w-full text-xs" onClick={() => setCover({ url: '' })}><X size={12} /> Remove image</button>}
          {!b.cover.url && (
            <>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {COVER_COLORS.map((c) => (
                  <button key={c} aria-label={c} onClick={() => setCover({ color: c })} className={`w-5 h-5 rounded-full border ${b.cover.color === c ? 'ring-2 ring-accent' : 'border-line'}`} style={{ background: c }} />
                ))}
              </div>
              <select className="input" value={b.cover.style} onChange={(e) => setCover({ style: e.target.value })} aria-label="Cover style">
                {COVER_STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </>
          )}
        </div>

        <div className="min-w-0">
          <PillTabs value={tab} onChange={setTab} dots={dots} tabs={[['general', 'General'], ['details', 'Details'], ['series', 'Series & formats'], ['status', 'Status & dates'], ['mood', 'Mood & budget']]} />
          <div className="pt-4 space-y-3">
            {tab === 'general' && (
              <>
                <Field label="TITLE *  (official franchise title)">
                  <input ref={titleRef} className={`input ${titleErr ? '!border-red-500 ring-2 ring-red-500/40' : ''}`} value={b.title} onChange={(e) => { set({ title: e.target.value }); setTitleErr(false) }} autoFocus onKeyDown={(e) => e.key === 'Enter' && save()} aria-invalid={titleErr} placeholder="e.g. Skyward Blades" />
                  {titleErr && <span className="text-xs text-red-500">Required</span>}
                </Field>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={asEdition} disabled={!existing.length && !asEdition}
                    onChange={(e) => { setAsEdition(e.target.checked); if (e.target.checked && existing.length && !existing.some((t) => titleKey(t) === titleKey(b.title))) set({ title: '' }) }} />
                  <span>This is another edition of a book I have<span className="block text-[11px] text-muted">Pick the existing Official Title so this entry groups under it{!existing.length ? ' (add a book first)' : ''}.</span></span>
                </label>
                {asEdition && (
                  <Field label="Existing Official Title">
                    <select className="input" aria-label="Existing Official Title" value={existing.find((t) => titleKey(t) === titleKey(b.title)) || ''} onChange={(e) => { set({ title: e.target.value }); setTitleErr(false) }}>
                      <option value="">Choose a title…</option>
                      {existing.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                )}

                <Field label="AUTHORS">
                  <div className="input !h-auto flex flex-wrap items-center gap-1.5 min-h-[2.5rem]">
                    {authors.map((a) => (
                      <span key={a} className="chip !pr-1 inline-flex items-center gap-1">{a}
                        <button type="button" aria-label={`Remove ${a}`} className="hover:text-red-500" onClick={() => set({ authors: authors.filter((x) => x !== a) })}><X size={12} /></button>
                      </span>
                    ))}
                    <input className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm" value={authorText} placeholder={authors.length ? 'Add another…' : 'Type a name and press Enter'} aria-label="Add author"
                      onChange={(e) => setAuthorText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (authorText.trim()) addAuthors(authorText); else save() }
                        else if (e.key === 'Backspace' && !authorText && authors.length) set({ authors: authors.slice(0, -1) })
                      }}
                      onBlur={() => authorText.trim() && addAuthors(authorText)} />
                  </div>
                </Field>

                <Field label="Genre (comma-separated)">
                  <input className="input" value={genreText} onChange={(e) => onGenreText(e.target.value)} placeholder="Fantasy, Drama" />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {tagList(settings, books, 'genres').map((g) => {
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
                <Field label="Summary"><textarea className="input" rows={3} value={b.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="What is it about?" /></Field>
              </>
            )}

            {tab === 'details' && (
              <>
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
                <Field label="Publisher"><input className="input" value={b.publisher || ''} onChange={(e) => set({ publisher: e.target.value })} placeholder="e.g. Shueisha" /></Field>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['yearReleased', 'Year released'], ['yearBought', 'Year bought'], ['yearStarted', 'Year started'], ['yearFinished', 'Year finished']].map(([k, l]) => (
                    <Field key={k} label={l}><input className="input font-mono" type="number" min="1000" max="2100" placeholder="YYYY" value={b[k]} onChange={num(k)} /></Field>
                  ))}
                </div>
                <Field label="Notes"><textarea className="input" rows={3} value={b.notesText} onChange={(e) => set({ notesText: e.target.value })} placeholder="Anything you want to remember" /></Field>

                <div className="border-t border-dashed border-line pt-3">
                  <div className="text-[11px] font-semibold tracking-wider text-muted mb-1.5">LINKS</div>
                  <div className="space-y-1.5">
                    {(b.links || []).map((l) => (
                      <div key={l.id} className="flex items-center gap-2 text-sm">
                        <span className="chip !border-accent text-accent shrink-0" data-link-badge>{linkInfo(l.url).label}</span>
                        <span className="truncate text-muted text-xs flex-1 min-w-0">{l.url}</span>
                        <a href={l.url} target="_blank" rel="noreferrer" className="btn btn-ghost !p-1" aria-label="Open link"><ExternalLink size={13} /></a>
                        <button type="button" className="btn btn-ghost !p-1" aria-label="Remove link" onClick={() => set({ links: b.links.filter((x) => x.id !== l.id) })}><X size={13} /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input className="input" placeholder="Paste a link (Amazon, Goodreads, Kobo, Shopee, Kinokuniya, MangaDex…)" value={linkText} onChange={(e) => setLinkText(e.target.value)} aria-label="Link address"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addLink() } }} />
                      <button type="button" className="btn shrink-0" onClick={addLink}><Plus size={14} /> Add a link</button>
                    </div>
                    {linkText.trim() && normalizeUrl(linkText) && <div className="text-[11px] text-muted">Detected: {linkInfo(normalizeUrl(linkText)).label}</div>}
                  </div>
                </div>
              </>
            )}

            {tab === 'series' && (
              <>
                <Field label="Numbering mode">
                  <div className="grid sm:grid-cols-3 gap-2">
                    {NUMBERING.map(([id, label, hint]) => (
                      <button key={id} type="button" aria-pressed={b.numbering === id} onClick={() => set({ numbering: id, ...(id === 'named' ? { volume: null } : {}) })}
                        className={`panel text-left p-2.5 transition ${b.numbering === id ? '!border-accent ring-2 ring-accent bg-accent/10' : 'hover:!border-accent'}`}>
                        <div className="text-sm font-semibold">{label}</div>
                        <div className="text-[11px] text-muted leading-tight">{hint}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {b.numbering === 'volume' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Volume number (optional)"><input className="input font-mono" type="number" step="0.5" placeholder="e.g. 0, 0.5, 1, 2…" value={b.volume ?? ''} onChange={(e) => set({ volume: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                    <Field label="Volume subtitle (optional)"><input className="input" placeholder="e.g. Prologue" value={b.volumeLabel} onChange={(e) => set({ volumeLabel: e.target.value })} /></Field>
                  </div>
                )}
                {b.numbering === 'subtitle' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label={`${numPrefix(b) === 'Vol.' ? 'Number' : numPrefix(b)} number`}><input className="input font-mono" type="number" step="0.5" placeholder="e.g. 1" value={b.volume ?? ''} onChange={(e) => set({ volume: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                    <Field label="Subtitle"><input className="input" placeholder="e.g. Summer of Ashes, Autumn of Dust" value={b.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
                  </div>
                )}
                {b.numbering === 'named' && (
                  <Field label="Companion / Book Name"><input className="input" placeholder="e.g. Official Fanbook" value={b.companionName} onChange={(e) => set({ companionName: e.target.value })} aria-label="Companion / Book Name" /></Field>
                )}
                {preview && <div className="text-xs text-muted">Will appear as: <b className="text-ink">{b.title ? `${b.title} · ` : ''}{preview}</b></div>}
                <p className="text-xs text-muted">Entries with the same Official Title group together automatically, sorted by format. Use “Add volumes” on a library entry to create a whole range at once.</p>
                <div className="border-t border-dashed border-line pt-3 grid sm:grid-cols-3 gap-3">
                  <Field label="Older-style series name">
                    <input className="input" list="series-list" value={b.series} onChange={(e) => set({ series: e.target.value })} />
                    <datalist id="series-list">{seriesNames.map((s) => <option key={s} value={s} />)}</datalist>
                  </Field>
                  <Field label="Book # in series"><input className="input" type="number" min="0" value={b.seriesNumber} onChange={num('seriesNumber')} /></Field>
                  <Field label="Total books in series"><input className="input" type="number" min="0" value={b.seriesTotal} onChange={num('seriesTotal')} /></Field>
                </div>
              </>
            )}

            {tab === 'status' && (
              <>
                <Field label="Status">
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button key={s.id} type="button" className={`btn ${b.status === s.id ? 'btn-primary' : ''}`} aria-pressed={b.status === s.id} onClick={() => set({ status: s.id })}>{s.label}</button>
                    ))}
                  </div>
                </Field>
                {b.status === 'wishlist' && (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Priority"><select className="input" value={b.priority} onChange={(e) => set({ priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
                    <Field label="Wishlist type"><select className="input" value={b.wishKind} onChange={(e) => set({ wishKind: e.target.value })}><option value="own">To own</option><option value="read">Read &amp; own</option></select></Field>
                    <Field label="Coming out"><input className="input" type="date" value={b.releaseDate} onChange={(e) => set({ releaseDate: e.target.value })} aria-label="Release date" /></Field>
                  </div>
                )}
                {b.status !== 'wishlist' && b.releaseDate && <Field label="Release date"><input className="input" type="date" value={b.releaseDate} onChange={(e) => set({ releaseDate: e.target.value })} /></Field>}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start date"><input className="input" type="date" value={b.startDate} onChange={(e) => set({ startDate: e.target.value, yearStarted: e.target.value ? Number(e.target.value.slice(0, 4)) : b.yearStarted })} /></Field>
                  <Field label="Finish date"><input className="input" type="date" value={b.finishDate} onChange={(e) => set({ finishDate: e.target.value, yearFinished: e.target.value ? Number(e.target.value.slice(0, 4)) : b.yearFinished })} /></Field>
                </div>
                <p className="text-xs text-muted">Only know the year? Use the year fields on the Details tab; exact dates place the book in the monthly chart.</p>
                <Field label="Where do I read it?">
                  <select className="input" value={b.readWhere} onChange={(e) => set({ readWhere: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
                </Field>
                <Field label="Source note"><input className="input" placeholder="e.g. Kindle Unlimited, KL Library, from Aunt Lin" value={b.sourceNote} onChange={(e) => set({ sourceNote: e.target.value })} /></Field>
                {b.readWhere === 'Borrowed / Library' && <Field label="Return date"><input className="input" type="date" value={b.returnDate} onChange={(e) => set({ returnDate: e.target.value })} /></Field>}
              </>
            )}

            {tab === 'mood' && (
              <>
                <Field label="Rating (0–100)"><RatingInput value={b.review.rating} onChange={(rating) => setReview({ rating })} /></Field>
                <Field label="Review"><textarea className="input" rows={3} value={b.review.text} onChange={(e) => setReview({ text: e.target.value })} /></Field>
                <Field label="Mood tags">
                  <div className="flex flex-wrap gap-1.5">
                    {tagList(settings, books, 'moods').map((m) => <button key={m} type="button" className={`chip ${b.moods.includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => set({ moods: toggle(b.moods, m) })}>{m}</button>)}
                  </div>
                </Field>
                <Field label="Tropes">
                  <div className="flex flex-wrap gap-1.5">
                    {tagList(settings, books, 'tropes').map((m) => <button key={m} type="button" className={`chip ${(b.tropes || []).includes(m) ? '!border-accent text-accent' : ''}`} onClick={() => set({ tropes: toggle(b.tropes || [], m) })}>{m}</button>)}
                  </div>
                </Field>
                <Field label="Content warnings">
                  <div className="flex flex-wrap gap-1.5">
                    {tagList(settings, books, 'warnings').map((m) => <button key={m} type="button" className={`chip ${(b.contentWarnings || []).includes(m) ? '!border-red-500 text-red-500' : ''}`} onClick={() => set({ contentWarnings: toggle(b.contentWarnings || [], m) })}>{m}</button>)}
                  </div>
                </Field>
                <div className="border-t border-dashed border-line pt-3">
                  <Field label="Price">
                    <div className="flex gap-2">
                      <select className="input !w-28" value={priceCur} onChange={(e) => set({ currency: e.target.value })} aria-label="Currency">
                        {CURRENCIES.map(([c, n]) => <option key={c} value={c} title={n}>{c}</option>)}
                      </select>
                      <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={b.price} onChange={num('price')} aria-label="Price" />
                    </div>
                    <span className="text-[11px] text-muted">Wishlist entries aren’t counted as spending until they move to Bought.</span>
                  </Field>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
