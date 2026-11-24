import React, { useMemo, useState } from 'react'
import { Modal, Field } from './ui.jsx'
import { DeleteButton } from './Confirm.jsx'
import { useStore } from '../lib/store.jsx'
import { AVATARS, CHAR_ROLES, uid } from '../lib/utils.js'

const BLANK = { name: '', avatar: 'woman', role: 'Protagonist', desc: '', aka: '', group: '', age: '', firstAppearance: '', quote: '' }
const FIELDS = ['name', 'avatar', 'role', 'desc', 'aka', 'group', 'age', 'firstAppearance', 'quote']

// Add / Edit a character. `choices` = [{id, label}] of volumes it can belong to; `bookId` = where it lives now / by default.
export default function CharacterModal({ choices, bookId, character, onClose }) {
  const { actions, flash } = useStore()
  const initial = useMemo(() => ({ ...BLANK, ...(character ? { ...character, desc: character.desc ?? character.note ?? '' } : {}) }), [character])
  const [f, setF] = useState(initial)
  const [where, setWhere] = useState(bookId || (choices[0] || {}).id)
  const [err, setErr] = useState(false)
  const dirty = FIELDS.some((k) => (f[k] || '') !== (initial[k] || '')) || where !== (bookId || (choices[0] || {}).id)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = () => {
    if (!f.name.trim()) { setErr(true); flash('Give the character a name first', 'error'); return }
    const char = { ...(character || {}), ...Object.fromEntries(FIELDS.map((k) => [k, typeof f[k] === 'string' ? f[k].trim() : f[k]])), id: (character && character.id) || uid() }
    if (actions.saveCharacter(where, char, bookId)) {
      flash(`Saved ${char.name}`, 'success')
      onClose(true)
    }
  }
  const remove = () => {
    if (actions.deleteCharacter(bookId, character.id)) { flash(`Deleted ${character.name}`, 'success'); onClose(true) }
  }

  return (
    <Modal
      title={character ? 'Edit character' : 'Add a character'}
      onClose={() => onClose(false)}
      wide
      footer={
        <div className="flex items-center gap-2 w-full">
          <span className={`text-xs font-mono ${dirty ? 'text-accent' : 'text-muted'}`} data-unsaved={dirty ? 'yes' : 'no'}>{dirty ? '● Unsaved changes' : 'No changes yet'}</span>
          <div className="ml-auto flex gap-2 items-center">
            {character && <DeleteButton className="btn" onConfirm={remove} />}
            <button className="btn" onClick={() => onClose(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      }
    >
      <div className="label">Who is it?</div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4" role="radiogroup" aria-label="Who is it?">
        {AVATARS.map(([id, label, icon]) => (
          <button key={id} type="button" role="radio" aria-checked={f.avatar === id} onClick={() => setF({ ...f, avatar: id })}
            className={`panel py-2 px-1 flex flex-col items-center gap-1 text-[11px] leading-tight text-center transition ${f.avatar === id ? '!border-accent ring-2 ring-accent bg-accent/10' : 'hover:!border-accent'}`}>
            <span className="text-2xl">{icon}</span>{label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name"><input className="input" value={f.name} aria-invalid={err && !f.name.trim()} onChange={(e) => { setErr(false); set('name')(e) }} placeholder="Character name" autoFocus /></Field>
        <Field label="Role in the story">
          <select className="input" value={f.role} onChange={set('role')}>{CHAR_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </Field>
        <Field label="Short description" className="sm:col-span-2"><textarea className="input" rows={2} value={f.desc} onChange={set('desc')} /></Field>
        <Field label="Also called"><input className="input" value={f.aka} onChange={set('aka')} /></Field>
        <Field label="Group or house"><input className="input" value={f.group} onChange={set('group')} /></Field>
        <Field label="Age"><input className="input" value={f.age} onChange={set('age')} /></Field>
        <Field label="First appearance"><input className="input" value={f.firstAppearance} onChange={set('firstAppearance')} placeholder="e.g. Chapter 1" /></Field>
        <Field label="A line they said" className="sm:col-span-2"><input className="input" value={f.quote} onChange={set('quote')} /></Field>
        {choices.length > 1 && (
          <Field label="Belongs to" className="sm:col-span-2">
            <select className="input" value={where} onChange={(e) => setWhere(e.target.value)} aria-label="Belongs to">{choices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </Field>
        )}
      </div>
    </Modal>
  )
}
