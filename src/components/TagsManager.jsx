import React, { useState } from 'react'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { Card } from './ui.jsx'
import { useStore } from '../lib/store.jsx'
import { tagList, tagUsage } from '../lib/utils.js'

const KINDS = [['genres', 'Genres'], ['moods', 'Moods'], ['tropes', 'Tropes'], ['warnings', 'Content warnings']]

function TagCard({ kind, title }) {
  const { books, settings, actions, flash, ask } = useStore()
  const [add, setAdd] = useState('')
  const [edit, setEdit] = useState(null) // {from, to}
  const tags = tagList(settings, books, kind).sort((a, b) => a.localeCompare(b))

  const doAdd = () => {
    const v = add.trim()
    if (!v) return
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) return flash(`'${v}' already exists`, 'error')
    if (actions.addTag(kind, v)) { setAdd(''); flash(`Added '${v}'`, 'success') }
  }
  const doRename = () => {
    const to = edit.to.trim()
    if (!to || to === edit.from) return setEdit(null)
    if (tags.some((t) => t.toLowerCase() === to.toLowerCase() && t.toLowerCase() !== edit.from.toLowerCase())) return flash(`'${to}' already exists`, 'error')
    if (actions.renameTag(kind, edit.from, to)) { flash(`Renamed '${edit.from}' to '${to}'`, 'success'); setEdit(null) }
  }
  const doDelete = async (t) => {
    const n = tagUsage(books, kind, t)
    const ok = await ask({ title: `Delete '${t}'?`, message: n ? `It is used by ${n} book${n === 1 ? '' : 's'} and will be removed from ${n === 1 ? 'it' : 'them'}.` : 'It is not used by any book.', confirmLabel: 'Yes, Delete', danger: true })
    if (ok && actions.deleteTag(kind, t)) flash(`Deleted '${t}'`, 'success')
  }

  return (
    <Card title={<span className="label !mb-0 tracking-widest">{title.toUpperCase()}</span>} className="!p-4" >
      <div className="flex flex-wrap gap-1.5 mb-3" data-tags={kind}>
        {tags.map((t) => (
          <span key={t} className="chip gap-1.5" data-tag={t}>
            {edit && edit.from === t ? (
              <>
                <input className="bg-transparent outline-none w-24 text-xs" autoFocus value={edit.to} onChange={(e) => setEdit({ ...edit, to: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setEdit(null) }} aria-label={`Rename ${t}`} />
                <button onClick={doRename} aria-label="Save name"><Check size={12} /></button>
                <button onClick={() => setEdit(null)} aria-label="Cancel rename"><X size={12} /></button>
              </>
            ) : (
              <>
                {t}<span className="font-mono text-muted" data-count>{tagUsage(books, kind, t)}</span>
                <button className="text-muted hover:text-ink" onClick={() => setEdit({ from: t, to: t })} aria-label={`Rename ${t}`}><Pencil size={11} /></button>
                <button className="text-muted hover:text-red-500" onClick={() => doDelete(t)} aria-label={`Delete ${t}`}><Trash2 size={11} /></button>
              </>
            )}
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-muted">Nothing here yet.</span>}
      </div>
      <div className="flex gap-2">
        <input className="input !py-1" placeholder={`New ${title.toLowerCase().replace(/s$/, '')}…`} value={add} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doAdd()} aria-label={`Add to ${title}`} />
        <button className="btn !py-1" onClick={doAdd}><Plus size={13} /> Add</button>
      </div>
    </Card>
  )
}

export default function TagsManager() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {KINDS.map(([k, t]) => <TagCard key={k} kind={k} title={t} />)}
    </div>
  )
}
