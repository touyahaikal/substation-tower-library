import React, { useMemo, useRef, useState } from 'react'
import { Trophy, Download, RotateCcw } from 'lucide-react'
import { PageTitle, Card, Cover, Stars } from '../components/ui.jsx'
import SpendingBreakdown from '../components/SpendingBreakdown.jsx'
import { useStore } from '../lib/store.jsx'
import { MONTHS } from '../lib/utils.js'
import { fmtMoney, totalSpending } from '../lib/currency.js'
import { variantName } from '../lib/themes.js'

const top = (arr, n = 5) => {
  const m = {}
  arr.forEach((x) => (m[x] = (m[x] || 0) + 1))
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function BarList({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  if (!rows.length) return <p className="text-sm text-muted">No data yet.</p>
  return (
    <ul className="space-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-center gap-2">
          <span className="w-28 truncate">{k}</span>
          <div className="flex-1 h-2 bg-line/60 rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${(v / max) * 100}%` }} /></div>
          <span className="font-mono text-xs w-5 text-right">{v}</span>
        </li>
      ))}
    </ul>
  )
}

// Single-elimination head-to-head bracket for Book of the Year
function Tournament({ books }) {
  const { data, actions } = useStore()
  const t = data.tournament
  const start = () => {
    const ids = [...books].sort(() => Math.random() - 0.5).map((b) => b.id)
    actions.setTournament({ round: 1, pool: ids, winners: [], i: 0, champion: ids.length === 1 ? ids[0] : null })
  }
  const pick = (id) => {
    const winners = [...t.winners, id]
    let i = t.i + 2
    if (i >= t.pool.length) {
      // round done; odd one out advances
      const carried = t.pool.length % 2 === 1 ? [...winners, t.pool[t.pool.length - 1]] : winners
      if (carried.length === 1) return actions.setTournament({ ...t, champion: carried[0], winners: [] })
      return actions.setTournament({ round: t.round + 1, pool: carried, winners: [], i: 0, champion: null })
    }
    actions.setTournament({ ...t, winners, i })
  }
  const by = (id) => books.find((b) => b.id === id)
  if (books.length < 2) return <p className="text-sm text-muted">Finish at least two books this year to start a tournament.</p>
  if (!t || t.pool.some((id) => !by(id)) && !t.champion) return <button className="btn btn-primary" onClick={start}><Trophy size={14} /> Start tournament</button>
  if (t.champion) {
    const b = by(t.champion)
    return b ? (
      <div className="text-center">
        <div className="label">Book of the Year</div>
        <div className="flex justify-center my-3"><Cover book={b} size="lg" /></div>
        <div className="h-display text-xl font-bold">{b.title}</div>
        <div className="text-sm text-muted mb-3">{b.author}</div>
        <button className="btn" onClick={start}><RotateCcw size={14} /> Play again</button>
      </div>
    ) : <button className="btn btn-primary" onClick={start}>Start tournament</button>
  }
  const a = by(t.pool[t.i]), b = by(t.pool[t.i + 1])
  if (!b) { // bye
    return <button className="btn" onClick={() => pick(t.pool[t.i])}>Advance {a?.title} (bye)</button>
  }
  return (
    <div>
      <div className="label text-center">Round {t.round} · match {t.i / 2 + 1} of {Math.ceil(t.pool.length / 2)}</div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        {[a, b].map((x) => (
          <button key={x.id} onClick={() => pick(x.id)} className="panel p-3 hover:!border-accent flex flex-col items-center gap-2">
            <Cover book={x} size="md" />
            <div className="text-sm font-semibold">{x.title}</div>
            <Stars value={x.review?.rating || 0} size={12} />
          </button>
        ))}
      </div>
    </div>
  )
}

function ShareCard({ stats, year }) {
  const { settings } = useStore()
  const css = (v) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(v).trim().split(/\s+/).join(',')})`
  const download = () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
    const x = c.getContext('2d')
    x.fillStyle = css('--bg'); x.fillRect(0, 0, 1080, 1350)
    x.strokeStyle = css('--accent'); x.lineWidth = 6; x.strokeRect(40, 40, 1000, 1270)
    x.textAlign = 'center'; x.fillStyle = css('--accent'); x.font = '36px monospace'
    x.fillText(`${settings.name.toUpperCase()}’S ${year} IN BOOKS`, 540, 180)
    x.fillStyle = css('--ink'); x.font = 'bold 220px Georgia, serif'; x.fillText(String(stats.count), 540, 460)
    x.font = '44px Georgia, serif'; x.fillText('books finished', 540, 530)
    x.font = '60px Georgia, serif'; x.fillText(`${stats.pages.toLocaleString()} pages`, 540, 700)
    if (stats.fav) { x.font = 'italic 44px Georgia, serif'; x.fillText(`Top pick: ${stats.fav.title}`, 540, 860) }
    if (stats.genre) { x.font = '40px Georgia, serif'; x.fillText(`Favourite genre: ${stats.genre}`, 540, 960) }
    x.fillStyle = css('--accent'); x.font = '28px monospace'; x.fillText(variantName(settings.theme, settings.mode), 540, 1250)
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `recap-${year}.png`; a.click()
  }
  return (
    <Card title="Share card">
      <div className="aspect-[4/5] max-w-xs mx-auto bg-bg border-2 border-accent p-6 flex flex-col items-center justify-center text-center gap-2">
        <div className="label !mb-0">{settings.name}’s {year}</div>
        <div className="h-display text-7xl font-bold">{stats.count}</div>
        <div className="text-sm">books · {stats.pages.toLocaleString()} pages</div>
        {stats.fav && <div className="text-xs text-muted mt-2 italic">Top pick: {stats.fav.title}</div>}
        {stats.genre && <div className="text-xs text-muted">Favourite genre: {stats.genre}</div>}
      </div>
      <div className="text-center mt-3"><button className="btn btn-primary" onClick={download}><Download size={14} /> Save as PNG</button></div>
    </Card>
  )
}

export default function Recap() {
  const { books, settings } = useStore()
  const [year, setYear] = useState(new Date().getFullYear())
  const years = useMemo(() => [...new Set([new Date().getFullYear(), ...books.filter((b) => b.finishDate).map((b) => Number(b.finishDate.slice(0, 4)))])].sort((a, b) => b - a), [books])
  const fin = books.filter((b) => b.status === 'finished' && b.finishDate?.startsWith(String(year)))
  const bought = books.filter((b) => b.status !== 'wishlist')
  const pages = fin.reduce((s, b) => s + (Number(b.pages) || 0), 0)
  const rated = fin.filter((b) => b.review?.rating)
  const avg = rated.length ? rated.reduce((s, b) => s + b.review.rating, 0) / rated.length : 0
  const fav = [...fin].sort((a, b) => (b.review?.rating || 0) - (a.review?.rating || 0))[0]
  const genres = top(fin.flatMap((b) => b.genres))
  const moods = top(fin.flatMap((b) => b.moods))
  const perMonth = Array(12).fill(0)
  fin.forEach((b) => (perMonth[Number(b.finishDate.slice(5, 7)) - 1] += 1))
  const bestMonth = perMonth.indexOf(Math.max(...perMonth))
  const stats = { count: fin.length, pages, fav, genre: genres[0]?.[0] }
  const yearBought = bought.filter((b) => (b.addedAt || '').startsWith(String(year)) || (b.finishDate || '').startsWith(String(year)))

  return (
    <>
      <PageTitle sub="Your year in review" action={<select className="input !w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select>}>Recap</PageTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[['Books finished', fin.length], ['Pages read', pages.toLocaleString()], ['Average rating', avg ? avg.toFixed(1) : '–'], ['Busiest month', fin.length ? MONTHS[bestMonth] : '–']].map(([l, v]) => (
          <div key={l} className="panel p-4"><div className="label">{l}</div><div className="h-display text-3xl font-bold">{v}</div></div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <SpendingBreakdown books={bought} title="Spending summary" />
        <Card title="Top genres"><BarList rows={genres} /></Card>
        <Card title="Top moods"><BarList rows={moods} /></Card>
        <Card title="Book Tournament"><Tournament books={fin} /></Card>
        <ShareCard stats={stats} year={year} />
      </div>
    </>
  )
}
