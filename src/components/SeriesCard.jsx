import React, { useRef, useState } from 'react'
import { ChevronDown, ChevronRight, EyeOff, Eye, Plus, Pencil, Upload, Layers, Star, X } from 'lucide-react'
import { Modal, Field, Cover, ProgressBar, RatingInput } from './ui.jsx'
import { DeleteButton } from './Confirm.jsx'
import QuickPage from './QuickPage.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { blankBook, uid, STATUSES, statusLabel, displayTitle, syncYears } from '../lib/utils.js'
import { byVolume, planVolumes, titleKey, volNum } from '../lib/groups.js'
import { compressImage } from '../lib/image.js'

const edKey = (b) => (b.edition || 'Paperback').trim() || 'Paperback'

// ---------- Generator: batch-add a volume range plus special/fractional extras ----------
export function VolumeGenerator({ template, onClose }) {
  const { books, actions, flash } = useStore()
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('10')
  const [extras, setExtras] = useState([])
  const [status, setStatus] = useState('wishlist')
  const [pages, setPages] = useState(String(template.pages || ''))
  const existing = new Set(books.filter((b) => titleKey(b.title) === titleKey(template.title) && edKey(b) === edKey(template) && volNum(b) != null).map(volNum))
  const plan = planVolumes({ from, to, extras })
  const fresh = plan.filter((p) => !existing.has(p.number))
  const addExtra = (number = '', label = '') => setExtras((x) => (number !== '' && x.some((e) => String(e.number) === String(number)) ? x : [...x, { number, label }]))
  const setExtra = (i, patch) => setExtras((x) => x.map((e, j) => (j === i ? { ...e, ...patch } : e)))

  const create = () => {
    if (!fresh.length) return flash(plan.length ? 'Those volumes already exist: nothing new to add' : 'Enter a volume range or at least one extra first', 'error')
    const base = blankBook()
    const list = fresh.map((p) => ({
      ...base,
      id: uid(),
      title: template.title, author: template.author, genres: [...(template.genres || [])], language: template.language, edition: template.edition, format: template.format,
      unit: template.unit === 'Minutes' ? 'Minutes' : 'Pages', audioMinutes: 0,
      cover: { ...template.cover }, currency: template.currency, hidden: template.hidden, yearReleased: '',
      pages: Number(pages) || 0, status, volume: p.number, volumeLabel: p.label, isSeriesCover: false,
      currentPage: status === 'finished' ? Number(pages) || 0 : 0,
    })).map((b) => (status === 'finished' ? { ...b, ...syncYears({ ...b, finishDate: new Date().toISOString().slice(0, 10) }) } : b))
    if (actions.addBooks(list)) {
      flash(`Added ${list.length} volume${list.length === 1 ? '' : 's'} to '${template.title}'`, 'success')
      onClose()
    }
  }

  return (
    <Modal title={`Add volumes · ${template.title}`} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={create}>Add {fresh.length || ''} volume{fresh.length === 1 ? '' : 's'}</button></>}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip">{template.edition}</span>
          <span className="text-xs text-muted">New volumes copy this entry’s author, genres, language and cover.</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Volumes from"><input className="input font-mono" type="number" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="to"><input className="input font-mono" type="number" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Pages each"><input className="input font-mono" type="number" min="0" value={pages} onChange={(e) => setPages(e.target.value)} /></Field>
          <Field label="Start as">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          </Field>
        </div>
        <div>
          <div className="label">Special / fractional extras</div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            <button type="button" className="chip" onClick={() => addExtra(0, 'Prologue')}>+ 0 = Prologue</button>
            <button type="button" className="chip" onClick={() => addExtra(0.5, 'Special Prologue')}>+ 0.5 = Special Prologue</button>
            <button type="button" className="chip" onClick={() => addExtra('', '')}>+ Custom number</button>
          </div>
          {extras.map((x, i) => (
            <div key={i} className="flex gap-2 mb-1.5 items-center">
              <input className="input !w-24 font-mono" type="number" step="any" placeholder="No." value={x.number} onChange={(e) => setExtra(i, { number: e.target.value })} aria-label="Volume number" />
              <input className="input" placeholder="Subtitle (optional)" value={x.label} onChange={(e) => setExtra(i, { label: e.target.value })} />
              <button className="btn btn-ghost !p-1.5" onClick={() => setExtras((l) => l.filter((_, j) => j !== i))} aria-label="Remove"><X size={14} /></button>
            </div>
          ))}
        </div>
        <p className="text-sm">
          {plan.length === 0 ? 'Nothing planned yet.' : <>Will create <b>{fresh.length}</b> new volume{fresh.length === 1 ? '' : 's'}{plan.length - fresh.length > 0 && ` (${plan.length - fresh.length} already exist and are skipped)`}. Order: {plan.slice(0, 6).map((p) => p.number).join(', ')}{plan.length > 6 && ', …'}</>}
        </p>
      </div>
    </Modal>
  )
}

// start("Add volumes") for one edition: a lone single entry becomes Volume 1 of a new series first
export function useVolumeGenerator() {
  const { actions } = useStore()
  const [tpl, setTpl] = useState(null)
  const start = (editionEntries) => {
    const first = editionEntries[0]
    if (editionEntries.length === 1 && volNum(first) == null) {
      if (!actions.updateBook(first.id, { volume: 1 })) return
      setTpl({ ...first, volume: 1 })
    } else setTpl(first)
  }
  return [start, tpl ? <VolumeGenerator template={tpl} onClose={() => setTpl(null)} /> : null]
}

// ---------- Quick-update drawer for one volume ----------
function VolumeDrawer({ id, onClose }) {
  const { books, actions, flash } = useStore()
  const { openBook, setBookModal } = useNav()
  const fileRef = useRef(null)
  const b = books.find((x) => x.id === id)
  if (!b) return null
  const upd = (patch) => actions.updateBook(b.id, patch)
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    try {
      upd({ cover: { ...b.cover, url: await compressImage(f) } })
      flash('Cover updated', 'success')
    } catch (err) {
      flash(err.message, 'error')
    }
  }
  return (
    <Modal title={displayTitle(b)} onClose={onClose} footer={<><button className="btn" onClick={() => { onClose(); setBookModal({ book: b }) }}><Pencil size={13} /> Full edit</button><button className="btn" onClick={() => { onClose(); openBook(b.id) }}>Open page</button><button className="btn btn-primary" onClick={onClose}>Done</button></>}>
      <div className="flex gap-4">
        <Cover book={b} size="md" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1.5">{STATUSES.map((s) => <button key={s.id} className={`btn !py-1 text-xs ${b.status === s.id ? 'btn-primary' : ''}`} onClick={() => actions.setStatus(b.id, s.id)}>{s.label}</button>)}</div>
          {(b.status === 'reading' || b.status === 'bought') && <div><div className="label">Page</div><QuickPage book={b} /></div>}
          <div><div className="label">Rating</div><RatingInput value={b.review.rating} onChange={(rating) => upd({ review: { ...b.review, rating } })} /></div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <button className={`btn text-xs ${b.isSeriesCover ? 'btn-primary' : ''}`} onClick={() => { if (actions.setSeriesCover(b.id)) flash(`Using ${displayTitle(b)}’s cover for the whole series`, 'success') }}><Star size={13} /> {b.isSeriesCover ? 'Series cover ✓' : 'Set as Series Cover'}</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <button className="btn text-xs" onClick={() => fileRef.current && fileRef.current.click()}><Upload size={13} /> Upload cover</button>
          <input className="input !w-56 !py-1 text-xs" placeholder="Cover image URL" value={b.cover.url && b.cover.url.startsWith('data:') ? '' : b.cover.url || ''} onChange={(e) => upd({ cover: { ...b.cover, url: e.target.value.trim() } })} />
        </div>
        <Field label="Notes"><textarea className="input" rows={3} value={b.notesText || ''} onChange={(e) => upd({ notesText: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

// ---------- Range bulk status ----------
function RangeStatus({ ed }) {
  const { actions, flash, ask } = useStore()
  const nums = ed.entries.map(volNum).filter((n) => n != null)
  const [from, setFrom] = useState(String(nums.length ? Math.min(...nums) : ''))
  const [to, setTo] = useState(String(nums.length ? Math.max(...nums) : ''))
  const [status, setStatus] = useState('finished')
  const apply = async () => {
    const lo = Math.min(Number(from), Number(to)), hi = Math.max(Number(from), Number(to))
    const ids = ed.entries.filter((b) => volNum(b) != null && volNum(b) >= lo && volNum(b) <= hi).map((b) => b.id)
    if (!ids.length) return flash('No volumes in that range', 'error')
    const ok = await ask({ title: 'Update volume range?', message: `Set ${ids.length} volume${ids.length === 1 ? '' : 's'} (${lo} to ${hi}) of ${ed.edition} to “${statusLabel(status)}”?`, confirmLabel: 'Yes, update' })
    if (ok && actions.bulkSetStatus(ids, status)) flash(`${ids.length} volume${ids.length === 1 ? '' : 's'} set to ${statusLabel(status)}`, 'success')
  }
  return (
    <div className="flex items-end gap-2 flex-wrap mt-2">
      <Field label="From vol."><input className="input !w-20 !py-1 font-mono" type="number" step="any" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
      <Field label="To vol."><input className="input !w-20 !py-1 font-mono" type="number" step="any" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      <Field label="Set to"><select className="input !w-auto !py-1" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
      <button className="btn btn-primary !py-1 text-xs" onClick={apply}>Apply to range</button>
    </div>
  )
}

// ---------- One edition: header, progress, tile grid, controls ----------
function EditionBlock({ ed, primary, startAdd, openDrawer }) {
  const n = ed.entries.length
  const isSingle = n === 1 && volNum(ed.entries[0]) == null
  const [open, setOpen] = useState(true)
  const [bulk, setBulk] = useState(primary && !isSingle)
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {!primary && <button className="btn btn-ghost !p-1" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'}>{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>}
        <span className="chip !border-accent text-accent font-semibold">{ed.edition}</span>
        <span className="text-xs text-muted font-mono">{isSingle ? statusLabel(ed.entries[0].status) : `${ed.finished}/${n} volumes finished`}{ed.pages > 0 && ` · ${ed.pagesRead.toLocaleString()}/${ed.pages.toLocaleString()} pages`}</span>
        <div className="ml-auto flex gap-1.5 flex-wrap">
          <button className="btn !py-1 text-xs" onClick={() => startAdd(ed.entries)}>{isSingle ? '+ Add volumes' : 'Add more volumes'}</button>
          {!isSingle && <button className={`btn !py-1 text-xs ${bulk ? 'btn-primary' : ''}`} onClick={() => setBulk(!bulk)}>Bulk status</button>}
        </div>
      </div>
      <ProgressBar value={n ? ed.entries.reduce((s, b) => s + (b.status === 'finished' ? 1 : b.status === 'reading' ? Math.min(0.99, (b.currentPage || 0) / (b.pages || 1)) : 0), 0) / n : 0} className="mt-2" />
      {bulk && <RangeStatus ed={ed} />}
      {open && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ed.entries.map((b) => (
            <button key={b.id} className={`vtile vtile-${b.status} ${b.hidden ? 'opacity-50' : ''}`} onClick={() => openDrawer(b.id)} title={`${displayTitle(b)} · ${statusLabel(b.status)}${b.isSeriesCover ? ' · series cover' : ''}`} aria-label={displayTitle(b)}>
              {volNum(b) == null ? 'Book' : volNum(b)}
              {b.isSeriesCover && <Star size={8} className="absolute -top-1 -right-1 fill-accent text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- The unified card ----------
export default function SeriesCard({ group, defaultOpen = true, selected, onSelect }) {
  const { actions, flash } = useStore()
  const { openBook } = useNav()
  const [open, setOpen] = useState(defaultOpen)
  const [drawer, setDrawer] = useState(null)
  const [startAdd, genEl] = useVolumeGenerator()
  const ids = group.entries.map((b) => b.id)
  const total = group.entries.length
  const [main, ...others] = group.editions
  const toggleHide = () => { if (actions.setHidden(ids, !group.hidden)) flash(group.hidden ? `Unhid '${group.title}'` : `Hid '${group.title}'`, 'success') }

  return (
    <section className={`panel p-4 ${group.hidden ? 'opacity-70' : ''}`}>
      <div className="flex gap-4">
        {onSelect && <input type="checkbox" className="mt-1 accent-[rgb(var(--accent))]" checked={!!selected} onChange={onSelect} aria-label="Select" />}
        <Cover book={group.cover} size="md" onClick={() => openBook(group.cover.id)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <h3 className="h-display text-lg font-semibold leading-tight truncate">{group.title}</h3>
              <div className="text-sm text-muted truncate">{group.author}</div>
            </div>
            <div className="flex gap-1 flex-wrap items-center">
              <button className="btn btn-ghost !p-1.5" onClick={toggleHide} title={group.hidden ? 'Unhide series' : 'Hide series'} aria-label={group.hidden ? 'Unhide series' : 'Hide series'}>{group.hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              <DeleteButton prompt="Confirm Delete Series?" onConfirm={() => { if (actions.deleteBooks(ids)) flash(`Deleted '${group.title}' (${total} entr${total === 1 ? 'y' : 'ies'})`, 'success') }} />
              <button className="btn btn-ghost !p-1.5" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse card' : 'Expand card'}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="chip"><Layers size={11} className="mr-1" />{total} {total === 1 ? 'entry' : 'volumes'}</span>
            {group.editions.map((e) => <span key={e.edition} className="chip">{e.edition}</span>)}
            {group.hidden && <span className="chip">Hidden</span>}
            {group.rating > 0 && <span className="chip font-mono">avg {group.rating}/100</span>}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted font-mono mb-1"><span>{group.finished}/{total} finished</span><span>{group.pages ? `${group.pagesRead.toLocaleString()}/${group.pages.toLocaleString()} pages` : ''}</span></div>
            <ProgressBar value={total ? group.finished / total : 0} />
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-4">
          <EditionBlock ed={main} primary startAdd={startAdd} openDrawer={setDrawer} />
          {others.length > 0 && (
            <div className="mt-4">
              <div className="label">Other formats</div>
              {others.map((ed) => (
                <div key={ed.edition} className="border-t border-dashed border-line pt-3 mt-3">
                  <EditionBlock ed={ed} startAdd={startAdd} openDrawer={setDrawer} />
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 text-[11px] text-muted mt-4 flex-wrap items-center">
            <span className="vtile vtile-wishlist !h-5 !min-w-0 !px-2 !text-[10px] cursor-default">Wishlist</span>
            <span className="vtile vtile-bought !h-5 !min-w-0 !px-2 !text-[10px] cursor-default">Bought</span>
            <span className="vtile vtile-reading !h-5 !min-w-0 !px-2 !text-[10px] cursor-default">Reading</span>
            <span className="vtile vtile-finished !h-5 !min-w-0 !px-2 !text-[10px] cursor-default">Finished</span>
            <span>Tap a volume to update it.</span>
          </div>
        </div>
      )}
      {drawer && <VolumeDrawer id={drawer} onClose={() => setDrawer(null)} />}
      {genEl}
    </section>
  )
}
