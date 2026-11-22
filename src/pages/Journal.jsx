import React, { useMemo, useRef, useState } from 'react'
import { Share2, Check, Plus, Download } from 'lucide-react'
import { PageTitle, Card, Modal, Tabs, Stars, Field, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { uid } from '../lib/utils.js'
import { variantName } from '../lib/themes.js'

function QuoteCardModal({ quote, onClose }) {
  const { settings } = useStore()
  const ref = useRef(null)
  const css = (v) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(v).trim().split(/\s+/).join(',')})`

  const download = () => {
    const c = document.createElement('canvas')
    c.width = 1080; c.height = 1080
    const x = c.getContext('2d')
    x.fillStyle = css('--card'); x.fillRect(0, 0, 1080, 1080)
    x.strokeStyle = css('--accent'); x.lineWidth = 4; x.strokeRect(50, 50, 980, 980)
    x.fillStyle = css('--ink'); x.textAlign = 'center'
    x.font = 'italic 54px Georgia, serif'
    const words = `“${quote.text}”`.split(' ')
    let line = '', y = 380; const lines = []
    words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (x.measureText(t).width > 800) { lines.push(line); line = w } else line = t })
    lines.push(line)
    y = 540 - (lines.length * 36)
    lines.forEach((l, i) => x.fillText(l, 540, y + i * 72))
    x.font = '32px Georgia, serif'; x.fillStyle = css('--accent')
    x.fillText(`— ${quote.book.title}, ${quote.book.author}`, 540, 900)
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'quote-card.png'; a.click()
  }

  return (
    <Modal title="Shareable quote card" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Close</button><button className="btn btn-primary" onClick={download}><Download size={14} /> Save as PNG</button></>}>
      <div ref={ref} className="aspect-square bg-card border-2 border-accent p-8 flex flex-col items-center justify-center text-center">
        <div className="h-display italic text-xl sm:text-2xl leading-snug">“{quote.text}”</div>
        <div className="text-accent text-sm mt-6">— {quote.book.title}, {quote.book.author}</div>
        <div className="text-[10px] text-muted font-mono mt-4">{variantName(settings.theme, settings.mode)}</div>
      </div>
    </Modal>
  )
}

function Flashcards({ vocab, onUpdate }) {
  const [flip, setFlip] = useState({})
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {vocab.map((v) => (
        <div key={v.id} className={`panel p-4 cursor-pointer min-h-[7rem] flex flex-col justify-between ${v.known ? 'opacity-60' : ''}`} onClick={() => setFlip({ ...flip, [v.id]: !flip[v.id] })}>
          <div>
            <div className="label">{v.bookTitle}</div>
            {flip[v.id] ? <p className="text-sm">{v.def || 'No definition yet'}</p> : <div className="h-display text-xl font-semibold">{v.word}</div>}
          </div>
          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="text-muted">{flip[v.id] ? 'definition' : 'tap to flip'}</span>
            <button className={`btn text-xs !py-0.5 ${v.known ? 'btn-primary' : ''}`} onClick={(e) => { e.stopPropagation(); onUpdate(v, { known: !v.known }) }}><Check size={12} /> I know it</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Journal() {
  const { books, actions } = useStore()
  const { openBook } = useNav()
  const [tab, setTab] = useState('quotes')
  const [card, setCard] = useState(null)
  const [vf, setVf] = useState({ bookId: '', word: '', def: '' })

  const quotes = useMemo(() => books.flatMap((b) => b.quotes.map((q) => ({ ...q, book: b }))).sort((a, b) => (b.date || '').localeCompare(a.date || '')), [books])
  const reviews = books.filter((b) => b.review?.text || b.review?.rating)
  const notes = useMemo(() => books.flatMap((b) => b.notes.map((n) => ({ ...n, book: b }))).sort((a, b) => (b.date || '').localeCompare(a.date || '')), [books])
  const vocab = books.flatMap((b) => (b.vocab || []).map((v) => ({ ...v, bookId: b.id, bookTitle: b.title })))

  const addWord = () => {
    const id = vf.bookId || books[0]?.id
    if (!id || !vf.word.trim()) return
    actions.updateBook(id, (b) => ({ vocab: [...(b.vocab || []), { id: uid(), word: vf.word.trim(), def: vf.def.trim(), known: false }] }))
    setVf({ ...vf, word: '', def: '' })
  }
  const updWord = (v, patch) => actions.updateBook(v.bookId, (b) => ({ vocab: b.vocab.map((x) => (x.id === v.id ? { ...x, ...patch } : x)) }))

  return (
    <>
      <PageTitle sub="Everything you have written about your reading">Journal</PageTitle>
      <Tabs value={tab} onChange={setTab} tabs={[['quotes', `Quotes (${quotes.length})`], ['reviews', `Reviews (${reviews.length})`], ['notes', `Notes (${notes.length})`], ['vocab', `Vocabulary (${vocab.length})`]]} />
      <div className="pt-4 space-y-3">
        {tab === 'quotes' && (quotes.length === 0 ? <Empty>No quotes yet. Save one from a book’s page.</Empty> : quotes.map((q) => (
          <Card key={q.id}>
            <blockquote className="h-display italic text-lg">“{q.text}”</blockquote>
            <div className="flex justify-between items-center mt-2 text-sm">
              <button className="text-muted hover:text-accent" onClick={() => openBook(q.book.id)}>— {q.book.title}{q.page ? `, p. ${q.page}` : ''}</button>
              <button className="btn text-xs" onClick={() => setCard(q)}><Share2 size={13} /> Quote card</button>
            </div>
          </Card>
        )))}

        {tab === 'reviews' && (reviews.length === 0 ? <Empty>No reviews yet.</Empty> : reviews.map((b) => (
          <Card key={b.id} title={b.title} action={<Stars value={b.review.rating} size={14} />}>
            <p className="text-sm">{b.review.text || <span className="text-muted">Rated, no written review.</span>}</p>
            <button className="text-xs text-muted hover:text-accent mt-2" onClick={() => openBook(b.id)}>{b.author} · open book</button>
          </Card>
        )))}

        {tab === 'notes' && (notes.length === 0 ? <Empty>No notes yet.</Empty> : notes.map((n) => (
          <Card key={n.id}>
            <div className="text-xs text-muted font-mono mb-1">{n.date} · <button className="hover:text-accent" onClick={() => openBook(n.book.id)}>{n.book.title}</button></div>
            <p className="text-sm whitespace-pre-wrap">{n.text}</p>
          </Card>
        )))}

        {tab === 'vocab' && (
          <>
            <Card title="Add a word">
              <div className="grid sm:grid-cols-[12rem,10rem,1fr,auto] gap-2">
                <select className="input" value={vf.bookId} onChange={(e) => setVf({ ...vf, bookId: e.target.value })}>{books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select>
                <input className="input" placeholder="Word" value={vf.word} onChange={(e) => setVf({ ...vf, word: e.target.value })} />
                <input className="input" placeholder="Definition" value={vf.def} onChange={(e) => setVf({ ...vf, def: e.target.value })} />
                <button className="btn btn-primary" onClick={addWord}><Plus size={14} /> Add</button>
              </div>
            </Card>
            {vocab.length === 0 ? <Empty>No words saved yet.</Empty> : <Flashcards vocab={vocab} onUpdate={updWord} />}
          </>
        )}
      </div>
      {card && <QuoteCardModal quote={card} onClose={() => setCard(null)} />}
    </>
  )
}
