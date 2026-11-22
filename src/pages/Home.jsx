import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, Flame, Pause, Timer, Quote, Sparkles, BookOpen, Target } from 'lucide-react'
import { Card, Cover, ProgressBar, PageTitle, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { computeStreak, progressOf, unitTotal, unitSuffix, todayStr, weekKey, MONTHS } from '../lib/utils.js'

function Streak() {
  const { readDays, pausedDays, actions } = useStore()
  const streak = computeStreak(readDays, pausedDays)
  const today = todayStr()
  const readToday = readDays.includes(today)
  const wk = weekKey(today)
  const pausedThisWeek = pausedDays.filter((d) => weekKey(d) === wk).length
  const pausedToday = pausedDays.includes(today)
  return (
    <Card title="Daily streak">
      <div className="flex items-center gap-3 mb-3">
        <Flame size={34} className={streak ? 'text-accent' : 'text-line'} />
        <div>
          <div className="h-display text-3xl font-bold leading-none">{streak}</div>
          <div className="text-xs text-muted">day{streak === 1 ? '' : 's'} in a row</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary" disabled={readToday} onClick={actions.quickRead}>
          {readToday ? 'Logged today ✓' : 'I read today'}
        </button>
        <button className="btn" disabled={pausedToday || readToday || pausedThisWeek >= 2} onClick={actions.pauseToday}>
          <Pause size={14} /> Pause today
        </button>
      </div>
      <p className="text-[11px] text-muted mt-2">Rest days this week: {pausedThisWeek}/2</p>
    </Card>
  )
}

function CurrentlyReading() {
  const { books, actions } = useStore()
  const { openBook, setTimer, goLibrary } = useNav()
  const reading = books.filter((b) => b.status === 'reading')
  const [i, setI] = useState(0)
  if (!reading.length) {
    return (
      <Card title="Currently reading" className="md:col-span-2">
        <Empty icon={BookOpen}>
          Nothing in progress. <button className="text-accent underline" onClick={() => goLibrary('bought')}>Pick something from your Bought pile</button>.
        </Empty>
      </Card>
    )
  }
  const idx = Math.min(i, reading.length - 1)
  const b = reading[idx]
  const total = unitTotal(b)
  const step = b.unit === 'Percent' ? 1 : b.unit === 'Minutes' ? 5 : 10
  return (
    <Card
      title="Currently reading"
      className="md:col-span-2"
      action={
        reading.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-muted">
            <button className="btn btn-ghost !p-1" onClick={() => setI((idx - 1 + reading.length) % reading.length)}><ChevronLeft size={16} /></button>
            {idx + 1}/{reading.length}
            <button className="btn btn-ghost !p-1" onClick={() => setI((idx + 1) % reading.length)}><ChevronRight size={16} /></button>
          </div>
        )
      }
    >
      <div className="flex gap-4">
        <Cover book={b} size="md" onClick={() => openBook(b.id)} />
        <div className="flex-1 min-w-0">
          <button className="h-display text-lg font-semibold text-left hover:text-accent" onClick={() => openBook(b.id)}>{b.title}</button>
          <div className="text-sm text-muted mb-3">{b.author}</div>
          <ProgressBar value={progressOf(b)} />
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button className="btn !p-1.5" onClick={() => actions.setCurrentPage(b.id, (b.currentPage || 0) - step)}><Minus size={14} /></button>
            <input className="input !w-20 text-center" type="number" value={b.currentPage || 0} onChange={(e) => actions.setCurrentPage(b.id, e.target.value)} />
            <button className="btn !p-1.5" onClick={() => actions.setCurrentPage(b.id, Math.min(total || 1e9, (b.currentPage || 0) + step))}><Plus size={14} /></button>
            <span className="text-xs text-muted font-mono">/ {total || '?'}{unitSuffix(b)} · {Math.round(progressOf(b) * 100)}%</span>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button className="btn" onClick={() => setTimer({ bookId: b.id, startedAt: Date.now() })}><Timer size={14} /> Start a timer</button>
            <button className="btn" onClick={() => actions.setStatus(b.id, 'finished')}>Mark finished</button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AnnualGoal() {
  const { books, settings } = useStore()
  const { go } = useNav()
  const year = new Date().getFullYear()
  const fin = books.filter((b) => b.status === 'finished' && b.finishDate && b.finishDate.startsWith(String(year)))
  const pages = fin.reduce((s, b) => s + (Number(b.pages) || 0), 0)
  return (
    <Card title={`${year} goal`} action={<button className="btn btn-ghost !py-0.5 text-xs" onClick={() => go('preferences')}>Edit</button>}>
      <div className="space-y-3 text-sm">
        <div>
          <div className="flex justify-between mb-1"><span>Books</span><span className="font-mono">{fin.length}/{settings.goalBooks}</span></div>
          <ProgressBar value={fin.length / (settings.goalBooks || 1)} />
        </div>
        <div>
          <div className="flex justify-between mb-1"><span>Pages</span><span className="font-mono">{pages.toLocaleString()}/{Number(settings.goalPages).toLocaleString()}</span></div>
          <ProgressBar value={pages / (settings.goalPages || 1)} />
        </div>
      </div>
    </Card>
  )
}

function RecentlyRead() {
  const { books } = useStore()
  const { openBook } = useNav()
  const rec = books.filter((b) => b.status === 'finished').sort((a, b) => (b.finishDate || '').localeCompare(a.finishDate || '')).slice(0, 12)
  return (
    <Card title="Recently read" className="md:col-span-2">
      {rec.length === 0 ? <Empty>No finished books yet.</Empty> : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {rec.map((b) => (
            <div key={b.id} className="shrink-0 w-[4.5rem]">
              <Cover book={b} size="sm" onClick={() => openBook(b.id)} />
              <div className="text-[10px] text-muted mt-1 truncate">{b.title}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function MonthChart() {
  const { books } = useStore()
  const [metric, setMetric] = useState('books')
  const [hover, setHover] = useState(null)
  const year = new Date().getFullYear()
  const data = useMemo(() => {
    const arr = Array(12).fill(0)
    books.forEach((b) => {
      if (b.status !== 'finished' || !b.finishDate || !b.finishDate.startsWith(String(year))) return
      const m = Number(b.finishDate.slice(5, 7)) - 1
      arr[m] += metric === 'books' ? 1 : Number(b.pages) || 0
    })
    return arr
  }, [books, metric, year])
  const max = Math.max(1, ...data)
  return (
    <Card
      title={`Month by month · ${year}`}
      className="md:col-span-2"
      action={
        <div className="flex">
          {['books', 'pages'].map((m) => (
            <button key={m} onClick={() => setMetric(m)} className={`btn !rounded-none first:!rounded-l-[var(--radius)] last:!rounded-r-[var(--radius)] text-xs capitalize ${metric === m ? 'btn-primary' : ''}`}>{m}</button>
          ))}
        </div>
      }
    >
      <div className="flex items-end gap-1.5 h-40">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="text-[10px] font-mono text-muted h-4">{hover === i || v ? v : ''}</div>
            <div className="w-full bg-accent/80 hover:bg-accent transition-all rounded-t-sm" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 1, opacity: v ? 1 : 0.25 }} />
            <div className="text-[10px] text-muted mt-1">{MONTHS[i]}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function QuoteOfDay() {
  const { books } = useStore()
  const { openBook } = useNav()
  const all = books.flatMap((b) => b.quotes.map((q) => ({ ...q, book: b })))
  if (!all.length) return <Card title="Quote of the day"><Empty icon={Quote}>Save a quote to see it here.</Empty></Card>
  const day = Math.floor(Date.now() / 86400000)
  const q = all[day % all.length]
  return (
    <Card title="Quote of the day">
      <blockquote className="h-display italic text-lg leading-snug">“{q.text}”</blockquote>
      <button className="text-sm text-muted mt-2 hover:text-accent" onClick={() => openBook(q.book.id)}>— {q.book.title}{q.page ? `, p. ${q.page}` : ''}</button>
    </Card>
  )
}

function WhatNext() {
  const { books } = useStore()
  const { openBook } = useNav()
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState({})
  const pile = books.filter((b) => b.status === 'bought')
  const QS = [
    ['mood', 'What mood are you in?', ['Cozy', 'Dark', 'Funny', 'Reflective', 'Adventurous', 'Tense']],
    ['length', 'How long a book?', ['Short (<350 pages)', 'Medium', 'Long (500+)']],
    ['time', 'How much time do you have?', ['A few days', 'A couple of weeks', 'All month']],
  ]
  const picks = () => {
    const scored = pile.map((b) => {
      let s = 0
      if (b.moods.includes(ans.mood)) s += 3
      const p = Number(b.pages) || 0
      if (ans.length?.startsWith('Short') && p && p < 350) s += 2
      if (ans.length?.startsWith('Long') && p >= 500) s += 2
      if (ans.length === 'Medium' && p >= 350 && p < 500) s += 2
      if (ans.time === 'A few days' && p < 350) s += 1
      if (ans.time === 'All month' && p >= 450) s += 1
      return { b, s }
    })
    return scored.sort((a, b) => b.s - a.s).slice(0, 3)
  }
  return (
    <Card title="What to read next" action={step > 0 && <button className="btn btn-ghost text-xs !py-0.5" onClick={() => { setStep(0); setAns({}) }}>Restart</button>}>
      {pile.length === 0 ? (
        <Empty icon={Sparkles}>Your Bought pile is empty.</Empty>
      ) : step < QS.length ? (
        <div>
          <div className="text-sm mb-2">{QS[step][1]}</div>
          <div className="flex flex-wrap gap-2">
            {QS[step][2].map((o) => (
              <button key={o} className="btn" onClick={() => { setAns({ ...ans, [QS[step][0]]: o }); setStep(step + 1) }}>{o}</button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {picks().map(({ b }) => (
            <li key={b.id} className="flex items-center gap-3">
              <Cover book={b} size="xs" onClick={() => openBook(b.id)} />
              <button className="text-sm text-left hover:text-accent" onClick={() => openBook(b.id)}>
                <div className="font-semibold">{b.title}</div>
                <div className="text-xs text-muted">{b.author} · {b.pages} pages</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function CollectionsOverview() {
  const { collections } = useStore()
  const { go } = useNav()
  return (
    <Card title="Collections" action={<button className="btn btn-ghost text-xs !py-0.5" onClick={() => go('collections')}>Manage</button>}>
      <ul className="space-y-1.5 text-sm">
        {collections.map((c) => (
          <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className="chip">{c.type}</span></li>
        ))}
      </ul>
    </Card>
  )
}

export default function Home() {
  const { settings } = useStore()
  return (
    <>
      <PageTitle sub="Your reading, at a glance">Home</PageTitle>
      <div className="grid md:grid-cols-3 gap-4">
        <CurrentlyReading />
        <div className="space-y-4"><Streak /><AnnualGoal /></div>
        <MonthChart />
        <QuoteOfDay />
        <RecentlyRead />
        <WhatNext />
        <CollectionsOverview />
      </div>
    </>
  )
}
