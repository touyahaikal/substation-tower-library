import React, { useEffect, useState } from 'react'
import { Pause, Play, Square, Timer as TimerIcon } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { unitSuffix } from '../lib/utils.js'

// Docked live reading-session timer (bottom of the screen)
export default function TimerDock() {
  const { books, actions } = useStore()
  const { timer, setTimer } = useNav()
  const [now, setNow] = useState(Date.now())
  const [paused, setPaused] = useState(false)
  const [elapsedBase, setElapsedBase] = useState(0)
  const [page, setPage] = useState('')
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!timer) return
    setPaused(false)
    setElapsedBase(0)
    setFinishing(false)
    const b = books.find((x) => x.id === timer.bookId)
    setPage(b ? String(b.currentPage || 0) : '')
    setNow(Date.now())
    // eslint-disable-next-line
  }, [timer?.startedAt])

  useEffect(() => {
    if (!timer || paused) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [timer, paused])

  if (!timer) return null
  const book = books.find((b) => b.id === timer.bookId)
  if (!book) return null
  const lastTick = paused ? elapsedBase : elapsedBase + (now - timer.startedAt)
  const secs = Math.floor(lastTick / 1000)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  const togglePause = () => {
    if (paused) {
      setTimer({ ...timer, startedAt: Date.now() - elapsedBase })
      setPaused(false)
    } else {
      setElapsedBase(now - timer.startedAt)
      setPaused(true)
    }
  }

  const save = () => {
    const newPage = Number(page) || 0
    const gained = Math.max(0, newPage - (book.currentPage || 0))
    actions.setCurrentPage(book.id, newPage)
    actions.logReading(book.id, gained)
    actions.updateBook(book.id, (b) => ({ readingLog: b.readingLog.map((l, i, arr) => (i === arr.length - 1 ? { ...l, minutes: Math.max(1, Math.round(secs / 60)) } : l)) }))
    setTimer(null)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-card shadow-[0_-4px_16px_rgb(0_0_0/0.15)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <TimerIcon size={18} className="text-accent" />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{book.title}</div>
          <div className="text-[11px] text-muted">Reading session</div>
        </div>
        <div className="font-mono text-2xl tabular-nums mx-auto">{mm}:{ss}</div>
        {finishing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Reached{unitSuffix(book)}:</span>
            <input className="input !w-24" type="number" value={page} onChange={(e) => setPage(e.target.value)} />
            <button className="btn btn-primary" onClick={save}>Save session</button>
            <button className="btn" onClick={() => setFinishing(false)}>Back</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button className="btn" onClick={togglePause}>{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? 'Resume' : 'Pause'}</button>
            <button className="btn btn-primary" onClick={() => { if (!paused) togglePause(); setFinishing(true) }}><Square size={14} /> Stop & log</button>
            <button className="btn btn-ghost" onClick={() => setTimer(null)}>Discard</button>
          </div>
        )}
      </div>
    </div>
  )
}
