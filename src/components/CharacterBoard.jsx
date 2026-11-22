import React, { useRef, useState } from 'react'
import { Plus, ZoomIn, ZoomOut, Link2, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { uid } from '../lib/utils.js'

const W = 130, H = 56

// Node-based character relationship map for one book: drag cards, connect them, zoom.
export default function CharacterBoard({ book }) {
  const { actions, readOnly } = useStore()
  const [zoom, setZoom] = useState(1)
  const [linking, setLinking] = useState(null)
  const [selected, setSelected] = useState(null)
  const drag = useRef(null)
  const chars = book.characters || []
  const rels = book.relations || []

  const save = (patch) => actions.updateBook(book.id, patch)
  const add = () => {
    const name = prompt('Character name?')
    if (!name) return
    const i = chars.length
    save({ characters: [...chars, { id: uid(), name, note: '', x: 30 + (i % 4) * 160, y: 30 + Math.floor(i / 4) * 100 }] })
  }
  const move = (id, x, y) => save({ characters: chars.map((c) => (c.id === id ? { ...c, x, y } : c)) })
  const onDown = (e, c) => {
    if (readOnly) return
    if (linking) {
      if (linking !== c.id) {
        const label = prompt('Relationship (e.g. sister of, rival of)?') || ''
        save({ relations: [...rels, { id: uid(), from: linking, to: c.id, label }] })
      }
      setLinking(null)
      return
    }
    setSelected(c.id)
    drag.current = { id: c.id, sx: e.clientX, sy: e.clientY, ox: c.x, oy: c.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    move(d.id, Math.max(0, d.ox + (e.clientX - d.sx) / zoom), Math.max(0, d.oy + (e.clientY - d.sy) / zoom))
  }
  const onUp = () => (drag.current = null)
  const del = (id) => save({ characters: chars.filter((c) => c.id !== id), relations: rels.filter((r) => r.from !== id && r.to !== id) })
  const edit = (c) => {
    const note = prompt('Note about this character', c.note || '')
    if (note !== null) save({ characters: chars.map((x) => (x.id === c.id ? { ...x, note } : x)) })
  }
  const byId = Object.fromEntries(chars.map((c) => [c.id, c]))
  const maxX = Math.max(600, ...chars.map((c) => c.x + W + 40))
  const maxY = Math.max(320, ...chars.map((c) => c.y + H + 40))

  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap items-center">
        <button className="btn" onClick={add}><Plus size={14} /> Add character</button>
        <button className="btn" disabled={!selected} onClick={() => setLinking(selected)}><Link2 size={14} /> {linking ? 'Click a second character…' : 'Connect selected'}</button>
        <button className="btn" disabled={!selected} onClick={() => { del(selected); setSelected(null) }}><Trash2 size={14} /> Delete</button>
        <div className="ml-auto flex items-center gap-1">
          <button className="btn !p-1.5" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}><ZoomOut size={14} /></button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button className="btn !p-1.5" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}><ZoomIn size={14} /></button>
        </div>
      </div>
      <div className="panel overflow-auto h-[26rem] relative" style={{ backgroundImage: 'radial-gradient(rgb(var(--line)) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
        {chars.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">Add characters, then select one and connect it to another.</div>}
        <div style={{ width: maxX * zoom, height: maxY * zoom }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: maxX, height: maxY, position: 'relative' }} onPointerMove={onMove} onPointerUp={onUp}>
            <svg width={maxX} height={maxY} className="absolute inset-0 pointer-events-none">
              {rels.map((r) => {
                const a = byId[r.from], b = byId[r.to]
                if (!a || !b) return null
                const x1 = a.x + W / 2, y1 = a.y + H / 2, x2 = b.x + W / 2, y2 = b.y + H / 2
                return (
                  <g key={r.id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--accent))" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))" fontFamily="var(--font-mono)">{r.label}</text>
                  </g>
                )
              })}
            </svg>
            {chars.map((c) => (
              <div key={c.id} onPointerDown={(e) => onDown(e, c)} onDoubleClick={() => edit(c)}
                className={`absolute panel px-2 py-1.5 cursor-grab select-none touch-none ${selected === c.id ? '!border-accent ring-1 ring-accent' : ''} ${linking && linking !== c.id ? 'hover:!border-accent' : ''}`}
                style={{ left: c.x, top: c.y, width: W, minHeight: H }}>
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="text-[10px] text-muted truncate">{c.note || 'double-click to add a note'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {rels.length > 0 && (
        <ul className="mt-2 text-xs text-muted space-y-0.5">
          {rels.map((r) => byId[r.from] && byId[r.to] && (
            <li key={r.id} className="flex items-center gap-2">
              {byId[r.from].name} → {byId[r.to].name}{r.label ? ` (${r.label})` : ''}
              <button className="underline" onClick={() => save({ relations: rels.filter((x) => x.id !== r.id) })}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
