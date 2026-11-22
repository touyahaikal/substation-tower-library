import React, { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { PageTitle, Cover, Card, Modal, Field, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { uid } from '../lib/utils.js'

export const SMART_RULES = {
  rating5: ['5-star books', (b) => (b.review?.rating || 0) === 5],
  favorites: ['Favorites', (b) => b.favorite],
  borrowed: ['Borrowed / library', (b) => b.readWhere === 'Borrowed / Library'],
  unread: ['Unread owned (TBR)', (b) => b.status === 'bought'],
  long: ['Long reads (500+ pages)', (b) => (Number(b.pages) || 0) >= 500],
  reread: ['Re-reads', (b) => (b.reads || 0) > 1],
}

export const collectionBooks = (c, books) =>
  c.type === 'smart' ? books.filter((SMART_RULES[c.rule] || [, () => false])[1]) : books.filter((b) => c.bookIds.includes(b.id))

export default function Collections() {
  const { books, collections, actions } = useStore()
  const { openBook } = useNav()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('custom')
  const [rule, setRule] = useState('favorites')
  const [adding, setAdding] = useState(null)

  const create = () => {
    if (!name.trim()) return
    actions.setCollections((c) => [...c, { id: uid(), name: name.trim(), type, rule, bookIds: [] }])
    setName(''); setOpen(false)
  }
  const addTo = (cid, bid) => actions.setCollections((cs) => cs.map((c) => (c.id === cid && !c.bookIds.includes(bid) ? { ...c, bookIds: [...c.bookIds, bid] } : c)))
  const removeFrom = (cid, bid) => actions.setCollections((cs) => cs.map((c) => (c.id === cid ? { ...c, bookIds: c.bookIds.filter((x) => x !== bid) } : c)))

  return (
    <>
      <PageTitle sub="Smart collections update themselves; custom ones are hand-picked" action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> New collection</button>}>Collections</PageTitle>
      {collections.length === 0 && <Empty>No collections yet.</Empty>}
      <div className="space-y-4">
        {collections.map((c) => {
          const list = collectionBooks(c, books)
          return (
            <Card key={c.id} title={c.name}
              action={<div className="flex items-center gap-2"><span className="chip">{c.type === 'smart' ? `smart · ${SMART_RULES[c.rule]?.[0]}` : 'custom'}</span>
                {c.type === 'custom' && <button className="btn btn-ghost !p-1" onClick={() => setAdding(adding === c.id ? null : c.id)}><Plus size={15} /></button>}
                <button className="btn btn-ghost !p-1" onClick={() => confirm('Delete this collection?') && actions.setCollections((cs) => cs.filter((x) => x.id !== c.id))}><Trash2 size={15} /></button></div>}>
              {adding === c.id && (
                <select className="input mb-3" value="" onChange={(e) => e.target.value && addTo(c.id, e.target.value)}>
                  <option value="">Add a book…</option>
                  {books.filter((b) => !c.bookIds.includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              )}
              {list.length === 0 ? <p className="text-sm text-muted">Nothing here yet.</p> : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {list.map((b) => (
                    <div key={b.id} className="relative shrink-0">
                      <Cover book={b} size="sm" onClick={() => openBook(b.id)} />
                      {c.type === 'custom' && <button className="absolute -top-1.5 -right-1.5 bg-card border border-line rounded-full p-0.5" onClick={() => removeFrom(c.id, b.id)} aria-label="Remove"><X size={11} /></button>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
      {open && (
        <Modal title="New collection" onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={create}>Create</button></>}>
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
            <Field label="Type"><select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="custom">Custom (pick books)</option><option value="smart">Smart (auto-fills by rule)</option></select></Field>
            {type === 'smart' && <Field label="Rule"><select className="input" value={rule} onChange={(e) => setRule(e.target.value)}>{Object.entries(SMART_RULES).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></Field>}
          </div>
        </Modal>
      )}
    </>
  )
}
