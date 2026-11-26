import React, { useState } from 'react'
import { Modal, Field } from './ui.jsx'
import { useStore } from '../lib/store.jsx'

// Pick a wishlist book and give it a release date (shared by Home and Wish List)
export default function ReleaseModal({ bookId, onClose }) {
  const { books, actions, flash } = useStore()
  const cands = books.filter((b) => b.status === 'wishlist')
  const [id, setId] = useState(bookId || (cands.find((b) => !b.releaseDate) || cands[0] || {}).id || '')
  const cur = books.find((b) => b.id === id)
  const [date, setDate] = useState((cur && cur.releaseDate) || '')
  const save = () => {
    if (!id) return flash('Add a book to your wish list first', 'error')
    if (!date) return flash('Pick a release date', 'error')
    if (actions.updateBook(id, { releaseDate: date })) { flash('Release date saved', 'success'); onClose() }
  }
  return (
    <Modal title="Add a release date" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
      {cands.length === 0 ? <p className="text-sm text-muted">Your wish list is empty. Add a book there first.</p> : (
        <div className="space-y-3">
          <Field label="Wish list book">
            <select className="input" value={id} onChange={(e) => { setId(e.target.value); const x = books.find((b) => b.id === e.target.value); setDate((x && x.releaseDate) || '') }}>
              {cands.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </Field>
          <Field label="Coming out"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Release date" autoFocus /></Field>
        </div>
      )}
    </Modal>
  )
}
