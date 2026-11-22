import React, { useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { PageTitle, Cover, Modal, Field, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { PRIORITIES } from '../lib/utils.js'
import { CURRENCIES, fmtMoney } from '../lib/currency.js'

function BoughtPrompt({ book, onClose }) {
  const { actions, settings } = useStore()
  const [price, setPrice] = useState(book.price || '')
  const [cur, setCur] = useState(book.currency || settings.primaryCurrency)
  const confirm = (withPrice) => {
    actions.setStatus(book.id, 'bought', withPrice ? { price: Number(price) || 0, currency: cur } : {})
    onClose()
  }
  return (
    <Modal title={`Bought “${book.title}”`} onClose={onClose}
      footer={<><button className="btn" onClick={() => confirm(false)}>Skip price</button><button className="btn btn-primary" onClick={() => confirm(true)}>Save</button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency"><select className="input" value={cur} onChange={(e) => setCur(e.target.value)}>{CURRENCIES.map(([c]) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Price paid"><input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus /></Field>
      </div>
    </Modal>
  )
}

export default function WishList() {
  const { books, actions } = useStore()
  const { openBook, setBookModal } = useNav()
  const [prompt, setPrompt] = useState(null)
  const list = books.filter((b) => b.status === 'wishlist')
  return (
    <>
      <PageTitle sub={`${list.length} on the list`} action={<button className="btn btn-primary" onClick={() => setBookModal({ defaults: { status: 'wishlist' } })}>+ Add to wish list</button>}>Wish List</PageTitle>
      {list.length === 0 && <Empty icon={Heart}>Your wish list is empty.</Empty>}
      {PRIORITIES.map((p) => {
        const items = list.filter((b) => (b.priority || 'Want to Read') === p)
        if (!items.length) return null
        return (
          <section key={p} className="mb-6">
            <h2 className="h-display text-lg font-semibold mb-2">{p} <span className="text-xs text-muted font-mono">{items.length}</span></h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((b) => (
                <div key={b.id} className="panel p-3 flex gap-3">
                  <Cover book={b} size="sm" onClick={() => openBook(b.id)} />
                  <div className="flex-1 min-w-0">
                    <button className="font-semibold text-left hover:text-accent truncate block max-w-full" onClick={() => openBook(b.id)}>{b.title}</button>
                    <div className="text-sm text-muted truncate">{b.author}</div>
                    {b.price > 0 && <div className="text-xs font-mono text-muted">≈ {fmtMoney(b.price, b.currency)}</div>}
                    <div className="flex gap-2 mt-2 flex-wrap items-center">
                      <select className="input !w-auto !py-1 text-xs" value={b.priority || 'Want to Read'} onChange={(e) => actions.updateBook(b.id, { priority: e.target.value })}>
                        {PRIORITIES.map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <button className="btn btn-primary text-xs" onClick={() => setPrompt(b)}><ShoppingBag size={13} /> I bought it</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
      {prompt && <BoughtPrompt book={prompt} onClose={() => setPrompt(null)} />}
    </>
  )
}
