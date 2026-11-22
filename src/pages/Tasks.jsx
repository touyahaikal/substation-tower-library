import React, { useMemo, useState } from 'react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { PageTitle, Card, Tabs, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { uid, todayStr } from '../lib/utils.js'

export default function Tasks() {
  const { books, tasks, actions } = useStore()
  const { openBook } = useNav()
  const [tab, setTab] = useState('active')
  const [text, setText] = useState('')

  // Auto-generated tasks resolve themselves when the underlying data changes
  const auto = useMemo(() => {
    const out = []
    const today = todayStr()
    const soon = todayStr(new Date(Date.now() + 7 * 86400000))
    books.forEach((b) => {
      if (b.status === 'finished' && !b.review?.rating) out.push({ id: `rate-${b.id}`, text: `Rate “${b.title}”`, bookId: b.id })
      if (b.readWhere === 'Borrowed / Library' && b.returnDate && b.status !== 'finished' && b.returnDate <= soon)
        out.push({ id: `due-${b.id}`, text: b.returnDate < today ? `“${b.title}” is overdue (was due ${b.returnDate})` : `Return “${b.title}” by ${b.returnDate}`, bookId: b.id })
      if (b.status === 'reading' && !b.readingLog.length && !b.currentPage) out.push({ id: `start-${b.id}`, text: `Log your first pages of “${b.title}”`, bookId: b.id })
    })
    return out
  }, [books])

  const active = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const add = () => { if (!text.trim()) return; actions.setTasks((t) => [{ id: uid(), text: text.trim(), done: false }, ...t]); setText('') }
  const flip = (id) => actions.setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <>
      <PageTitle sub="Auto-generated reminders plus your own list">Tasks</PageTitle>
      <Card title="Suggested for you" className="mb-4">
        {auto.length === 0 ? <Empty icon={Sparkles}>All caught up.</Empty> : (
          <ul className="divide-y divide-line">
            {auto.map((t) => (
              <li key={t.id} className="py-2 flex justify-between items-center text-sm">
                <span>{t.text}</span>
                <button className="btn text-xs" onClick={() => openBook(t.bookId)}>Open</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="My tasks">
        <div className="flex gap-2 mb-3">
          <input className="input" placeholder="Add a task" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn btn-primary" onClick={add}><Plus size={14} /> Add</button>
        </div>
        <Tabs value={tab} onChange={setTab} tabs={[['active', `Active (${active.length})`], ['done', `Done (${done.length})`]]} />
        <ul className="divide-y divide-line">
          {(tab === 'active' ? active : done).map((t) => (
            <li key={t.id} className="py-2 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={t.done} onChange={() => flip(t.id)} className="accent-[rgb(var(--accent))]" />
              <span className={`flex-1 ${t.done ? 'line-through text-muted' : ''}`}>{t.text}</span>
              <button className="btn btn-ghost !p-1" onClick={() => actions.setTasks((ts) => ts.filter((x) => x.id !== t.id))} aria-label="Delete"><Trash2 size={14} /></button>
            </li>
          ))}
          {(tab === 'active' ? active : done).length === 0 && <li className="py-6 text-center text-sm text-muted">Nothing here.</li>}
        </ul>
      </Card>
    </>
  )
}
