import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageTitle, Cover, Modal, Field } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { todayStr, uid, MONTHS } from '../lib/utils.js'

export default function Calendar() {
  const { books, planned, actions } = useStore()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [day, setDay] = useState(null)
  const [bookId, setBookId] = useState('')
  const [pages, setPages] = useState('')
  const today = todayStr()
  const y = cursor.getFullYear(), m = cursor.getMonth()
  const first = new Date(y, m, 1).getDay()
  const dim = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]
  const ds = (n) => `${y}-${String(m + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`

  const readOn = (date) => books.filter((b) => b.readingLog.some((l) => l.date === date))
  const plansOn = (date) => planned.filter((p) => p.date === date)
  const isFuture = day && day > today

  const submit = () => {
    if (!bookId) return
    if (isFuture) actions.setPlanned((p) => [...p, { id: uid(), date: day, bookId, pages: Number(pages) || 0 }])
    else actions.logReading(bookId, Number(pages) || 0, day)
    setPages(''); setDay(null)
  }

  const readable = books.filter((b) => b.status === 'reading' || b.status === 'bought')

  return (
    <>
      <PageTitle sub="Click a past day to log pages, a future day to plan reading">Calendar</PageTitle>
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <button className="btn !p-1.5" onClick={() => setCursor(new Date(y, m - 1, 1))}><ChevronLeft size={16} /></button>
          <h2 className="h-display text-lg font-semibold">{MONTHS[m]} {y}</h2>
          <button className="btn !p-1.5" onClick={() => setCursor(new Date(y, m + 1, 1))}><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center label">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((n, i) => {
            if (!n) return <div key={i} />
            const date = ds(n)
            const read = readOn(date)
            const plans = plansOn(date)
            return (
              <button key={i} onClick={() => { setDay(date); setBookId((readable[0] || books[0] || {}).id || '') }}
                className={`aspect-square sm:aspect-[4/3] border text-left p-1 flex flex-col hover:border-accent transition rounded-[var(--radius)] ${date === today ? 'border-accent' : 'border-line'}`}>
                <span className={`text-xs font-mono ${date === today ? 'text-accent font-bold' : 'text-muted'}`}>{n}</span>
                <div className="flex gap-0.5 mt-auto flex-wrap">
                  {read.slice(0, 3).map((b) => <Cover key={b.id} book={b} size="xs" className="!w-4 !h-6" />)}
                  {plans.slice(0, 2).map((p) => <span key={p.id} className="text-[9px] border border-dashed border-accent text-accent px-0.5 rounded">plan</span>)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      {day && (
        <Modal title={`${isFuture ? 'Plan reading' : 'Log reading'} · ${day}`} onClose={() => setDay(null)}
          footer={<><button className="btn" onClick={() => setDay(null)}>Close</button><button className="btn btn-primary" onClick={submit}>{isFuture ? 'Schedule' : 'Log pages'}</button></>}>
          <div className="space-y-3">
            <Field label="Book"><select className="input" value={bookId} onChange={(e) => setBookId(e.target.value)}>{books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></Field>
            <Field label={isFuture ? 'Planned pages' : 'Pages read'}><input className="input" type="number" min="0" value={pages} onChange={(e) => setPages(e.target.value)} /></Field>
            {readOn(day).length > 0 && <p className="text-xs text-muted">Already read: {readOn(day).map((b) => b.title).join(', ')}</p>}
            {plansOn(day).map((p) => {
              const b = books.find((x) => x.id === p.bookId)
              return <div key={p.id} className="flex justify-between text-sm"><span>Planned: {b?.title} {p.pages ? `· ${p.pages}p` : ''}</span><button className="underline text-xs" onClick={() => actions.setPlanned((ps) => ps.filter((x) => x.id !== p.id))}>remove</button></div>
            })}
          </div>
        </Modal>
      )}
    </>
  )
}
