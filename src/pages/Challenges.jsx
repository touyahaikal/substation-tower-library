import React, { useMemo, useState } from 'react'
import { Heart, Star, Zap, Plus, Trash2 } from 'lucide-react'
import { PageTitle, Card, ProgressBar, Modal, Field } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { uid, todayStr } from '../lib/utils.js'
import { collectionBooks } from './Collections.jsx'

const ICONS = { heart: Heart, star: Star, bolt: Zap }

export function longestStreak(days) {
  const sorted = [...new Set(days)].sort()
  let best = 0, cur = 0, prev = null
  sorted.forEach((d) => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000
      cur = diff === 1 ? cur + 1 : 1
    } else cur = 1
    best = Math.max(best, cur)
    prev = d
  })
  return best
}

// Each badge has 5 star levels with thresholds
export const BADGES = [
  { id: 'bookworm', name: 'Bookworm', desc: 'Books finished', levels: [1, 5, 10, 25, 50], val: (s) => s.finished },
  { id: 'pages', name: 'Page Turner', desc: 'Pages read', levels: [500, 2000, 5000, 10000, 25000], val: (s) => s.pages },
  { id: 'streak', name: 'Streak Keeper', desc: 'Longest streak (days)', levels: [3, 7, 14, 30, 60], val: (s) => s.streak },
  { id: 'genres', name: 'Genre Explorer', desc: 'Different genres finished', levels: [2, 4, 6, 8, 10], val: (s) => s.genres },
  { id: 'quotes', name: 'Quote Collector', desc: 'Quotes saved', levels: [3, 10, 25, 50, 100], val: (s) => s.quotes },
  { id: 'reviewer', name: 'Critic', desc: 'Reviews written', levels: [1, 5, 10, 20, 40], val: (s) => s.reviews },
  { id: 'library', name: 'Library Regular', desc: 'Borrowed books finished', levels: [1, 3, 5, 10, 20], val: (s) => s.borrowed },
  { id: 'series', name: 'Series Finisher', desc: 'Series completed', levels: [1, 2, 3, 5, 8], val: (s) => s.series },
  { id: 'vocab', name: 'Wordsmith', desc: 'Words collected', levels: [3, 10, 25, 50, 100], val: (s) => s.vocab },
  { id: 'notes', name: 'Note Taker', desc: 'Reading notes written', levels: [3, 10, 25, 50, 100], val: (s) => s.notes },
  { id: 'reread', name: 'Re-reader', desc: 'Books read again', levels: [1, 2, 4, 7, 10], val: (s) => s.rereads },
]

export function useStats() {
  const { books, readDays } = useStore()
  return useMemo(() => {
    const fin = books.filter((b) => b.status === 'finished')
    const seriesMap = {}
    books.filter((b) => b.series).forEach((b) => (seriesMap[b.series] = [...(seriesMap[b.series] || []), b]))
    const seriesDone = Object.values(seriesMap).filter((l) => {
      const total = Math.max(...l.map((b) => b.seriesTotal || 0), l.length)
      return l.filter((b) => b.status === 'finished').length >= total && total > 0
    }).length
    return {
      finished: fin.length,
      pages: fin.reduce((s, b) => s + (Number(b.pages) || 0), 0),
      streak: longestStreak(readDays),
      genres: new Set(fin.flatMap((b) => b.genres)).size,
      quotes: books.reduce((s, b) => s + b.quotes.length, 0),
      reviews: books.filter((b) => b.review?.text).length,
      borrowed: fin.filter((b) => b.readWhere === 'Borrowed / Library').length,
      series: seriesDone,
      vocab: books.reduce((s, b) => s + (b.vocab || []).length, 0),
      notes: books.reduce((s, b) => s + b.notes.length, 0),
      rereads: books.reduce((s, b) => s + Math.max(0, (b.reads || 0) - 1), 0),
    }
  }, [books, readDays])
}

function challengeProgress(c, books) {
  const fin = books.filter((b) => b.status === 'finished' && b.finishDate?.startsWith(String(c.year)))
  if (c.kind === 'books') return fin.length
  if (c.kind === 'pages') return fin.reduce((s, b) => s + (Number(b.pages) || 0), 0)
  if (c.kind === 'genres') return new Set(fin.flatMap((b) => b.genres)).size
  if (c.kind === 'authors') return new Set(fin.map((b) => b.author)).size
  return 0
}

function PixelGrid() {
  const { books, settings, actions } = useStore()
  const year = new Date().getFullYear()
  const Icon = ICONS[settings.pixelIcon] || Heart
  const perDay = useMemo(() => {
    const m = {}
    books.forEach((b) => b.readingLog.forEach((l) => { if (l.date.startsWith(String(year))) m[l.date] = (m[l.date] || 0) + (Number(l.pages) || 0) }))
    return m
  }, [books, year])
  const days = []
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) days.push(todayStr(d))
  const max = Math.max(60, ...Object.values(perDay))
  return (
    <Card title={`Year in pixels · ${year}`} action={
      <div className="flex gap-1">{Object.entries(ICONS).map(([k, I]) => <button key={k} className={`btn !p-1.5 ${settings.pixelIcon === k ? 'btn-primary' : ''}`} onClick={() => actions.setSettings({ pixelIcon: k })} aria-label={k}><I size={14} /></button>)}</div>
    }>
      <div className="flex flex-wrap gap-[3px]">
        {days.map((d) => {
          const p = perDay[d] || 0
          const size = p ? 8 + Math.round((p / max) * 10) : 6
          return (
            <div key={d} title={`${d}: ${p} pages`} className="w-5 h-5 flex items-center justify-center">
              <Icon size={size} className={p ? 'text-accent fill-accent' : 'text-line'} />
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted mt-2">Bigger icon = more pages that day.</p>
    </Card>
  )
}

export default function Challenges() {
  const { books, challenges, actions } = useStore()
  const stats = useStats()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', kind: 'books', target: 10 })
  const year = new Date().getFullYear()
  const create = () => {
    if (!f.name.trim()) return
    actions.setChallenges((c) => [...c, { id: uid(), name: f.name.trim(), kind: f.kind, target: Number(f.target) || 1, year }])
    setF({ name: '', kind: 'books', target: 10 }); setOpen(false)
  }
  return (
    <>
      <PageTitle sub="Goals, habits and badges" action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> New challenge</button>}>Challenges</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {challenges.map((c) => {
          const v = challengeProgress(c, books)
          return (
            <Card key={c.id} title={c.name} action={<button className="btn btn-ghost !p-1" onClick={() => actions.setChallenges((cs) => cs.filter((x) => x.id !== c.id))} aria-label="Delete"><Trash2 size={14} /></button>}>
              <ProgressBar value={v / c.target} />
              <div className="flex justify-between text-xs text-muted font-mono mt-2"><span>{v.toLocaleString()} / {c.target.toLocaleString()} {c.kind}</span><span>{Math.min(100, Math.round((v / c.target) * 100))}%</span></div>
            </Card>
          )
        })}
      </div>
      <PixelGrid />
      <h2 className="h-display text-xl font-semibold mt-8 mb-3">Badges</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const v = b.val(stats)
          const level = b.levels.filter((t) => v >= t).length
          const next = b.levels[level]
          return (
            <div key={b.id} className={`panel p-3 ${level === 0 ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div><div className="font-semibold">{b.name}</div><div className="text-xs text-muted">{b.desc}</div></div>
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < level ? 'text-accent fill-accent' : 'text-line'} />)}</div>
              </div>
              <ProgressBar className="mt-2" value={next ? v / next : 1} />
              <div className="text-[11px] text-muted font-mono mt-1">{v.toLocaleString()}{next ? ` / ${next.toLocaleString()} for level ${level + 1}` : ' · max level'}</div>
            </div>
          )
        })}
      </div>
      {open && (
        <Modal title="New challenge" onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={create}>Create</button></>}>
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Counts"><select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="books">Books finished</option><option value="pages">Pages read</option><option value="genres">Different genres</option><option value="authors">Different authors</option></select></Field>
              <Field label="Target"><input className="input" type="number" min="1" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
