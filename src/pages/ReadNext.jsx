import React, { useMemo, useState } from 'react'
import { Sparkles, Repeat } from 'lucide-react'
import { PageTitle, Cover, Modal, Empty, RatingBadge } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { displayTitle, statusLabel, statusColor, ratingOf } from '../lib/utils.js'
import { titleKey } from '../lib/groups.js'

const PILES = [['all', 'All unread'], ['bought', 'Bought / On my shelves'], ['paused', 'Paused'], ['wishlist', 'Wishlist']]
const FIELDS = [['genres', 'Genre'], ['tropes', 'Trope'], ['moods', 'Mood']]

function Toggle({ on, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="accent-[rgb(var(--accent))]" />
      {label}
    </label>
  )
}

function Quiz({ pool, onClose }) {
  const { openBook } = useNav()
  const QS = [
    ['mood', 'What mood are you in?', ['Cozy', 'Dark', 'Funny', 'Reflective', 'Adventurous', 'Tense']],
    ['length', 'How long a book?', ['Short (<350 pages)', 'Medium', 'Long (500+)']],
    ['time', 'How much time do you have?', ['A few days', 'A couple of weeks', 'All month']],
  ]
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState({})
  const picks = () => pool.map((b) => {
    let s = 0
    const p = Number(b.pages) || 0
    if ((b.moods || []).includes(ans.mood)) s += 3
    if (ans.length?.startsWith('Short') && p && p < 350) s += 2
    if (ans.length?.startsWith('Long') && p >= 500) s += 2
    if (ans.length === 'Medium' && p >= 350 && p < 500) s += 2
    if (ans.time === 'A few days' && p && p < 350) s += 1
    if (ans.time === 'All month' && p >= 450) s += 1
    return { b, s }
  }).sort((a, b) => b.s - a.s).slice(0, 3)
  return (
    <Modal title="What should I read next?" onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      {pool.length === 0 ? <div className="text-sm text-muted">Nothing in the current pile. Change the filters first.</div>
        : step < QS.length ? (
          <div data-quiz>
            <div className="text-sm font-semibold mb-2">{QS[step][1]}</div>
            <div className="flex flex-wrap gap-2">{QS[step][2].map((o) => <button key={o} className="btn" onClick={() => { setAns({ ...ans, [QS[step][0]]: o }); setStep(step + 1) }}>{o}</button>)}</div>
          </div>
        ) : (
          <ul className="space-y-3" data-quiz-result>
            {picks().map(({ b }) => (
              <li key={b.id} className="flex gap-3 items-center">
                <Cover book={b} size="xs" onClick={() => { onClose(); openBook(b.id) }} />
                <button className="text-left hover:text-accent" onClick={() => { onClose(); openBook(b.id) }}>
                  <div className="font-semibold text-sm">{displayTitle(b)}</div>
                  <div className="text-xs text-muted">{b.author}{b.pages ? ` · ${b.pages} pages` : ''} · {statusLabel(b.status)}</div>
                </button>
              </li>
            ))}
            <button className="btn btn-ghost text-xs" onClick={() => { setStep(0); setAns({}) }}>Start over</button>
          </ul>
        )}
    </Modal>
  )
}

function Picker({ list, onPick, onClose }) {
  return (
    <Modal title="Change book" onClose={onClose} footer={<button className="btn" onClick={onClose}>Cancel</button>}>
      <ul className="space-y-1.5">
        {list.map((b) => (
          <li key={b.id}>
            <button className="w-full flex items-center gap-3 text-left panel p-2 hover:!border-accent" onClick={() => onPick(b.id)}>
              <Cover book={b} size="xs" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold truncate">{displayTitle(b)}</span><span className="block text-xs text-muted truncate">{b.author}</span></span>
              <span className="text-sm font-mono">{ratingOf(b) || '—'}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

function LovedColumn({ loved, pool, idx, finished, onChange }) {
  const { openBook } = useNav()
  const [field, setField] = useState('genres')
  const [off, setOff] = useState([]) // tags the user switched off
  const [picking, setPicking] = useState(false)
  const tags = (loved[field] || []).filter(Boolean)
  const active = tags.filter((t) => !off.includes(t))
  const matches = useMemo(() => {
    const seen = new Set([titleKey(loved.title)])
    const out = []
    pool.map((b) => ({ b, n: (b[field] || []).filter((t) => active.some((a) => a.toLowerCase() === String(t).toLowerCase())).length }))
      .filter((x) => x.n > 0).sort((a, c) => c.n - a.n || a.b.title.localeCompare(c.b.title))
      .forEach(({ b, n }) => { const k = titleKey(b.title); if (!seen.has(k)) { seen.add(k); out.push({ b, n }) } })
    return out
  }, [pool, field, active.join('|'), loved.id])
  return (
    <section className="panel p-4 space-y-3 min-w-0" data-loved={idx}>
      <div className="text-[11px] font-semibold tracking-wider text-muted">BECAUSE YOU LOVED…</div>
      <div className="flex gap-3">
        <Cover book={loved} size="sm" onClick={() => openBook(loved.id)} />
        <div className="min-w-0 flex-1">
          <button className="font-semibold text-left hover:text-accent block max-w-full truncate" onClick={() => openBook(loved.id)}>{loved.title}</button>
          <div className="text-xs text-muted truncate">{loved.author}</div>
          <div className="mt-1"><RatingBadge value={ratingOf(loved)} /></div>
          <div className="text-[11px] text-muted font-mono mt-0.5">{loved.finishDate ? `Finished ${loved.finishDate}` : loved.yearFinished ? `Finished ${loved.yearFinished}` : ''}</div>
          <button className="btn !py-0.5 text-xs mt-1.5" onClick={() => setPicking(true)}><Repeat size={12} /> Change book</button>
        </div>
      </div>
      <div className="border-t border-dashed border-line pt-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[11px] font-semibold tracking-wider text-muted" htmlFor={`rb-${idx}`}>RECOMMEND BY</label>
          <select id={`rb-${idx}`} className="input !w-auto !py-1 text-sm" value={field} onChange={(e) => { setField(e.target.value); setOff([]) }}>
            {FIELDS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
          </select>
          <span className="chip font-mono" data-count>{active.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.length === 0 && <span className="text-xs text-muted">No {FIELDS.find((f) => f[0] === field)[1].toLowerCase()} tags on this book yet.</span>}
          {tags.map((t) => <button key={t} className={`chip ${off.includes(t) ? 'opacity-50' : '!border-accent text-accent'}`} aria-pressed={!off.includes(t)} onClick={() => setOff(off.includes(t) ? off.filter((x) => x !== t) : [...off, t])}>{t}</button>)}
        </div>
      </div>
      <ul className="space-y-2" data-matches>
        {matches.length === 0 && <li className="text-xs text-muted">No matching books in your current pile.</li>}
        {matches.slice(0, 6).map(({ b, n }) => (
          <li key={b.id} className="flex gap-2.5 items-center" data-match>
            <Cover book={b} size="xs" onClick={() => openBook(b.id)} />
            <button className="min-w-0 flex-1 text-left hover:text-accent" onClick={() => openBook(b.id)}>
              <span className="block text-sm font-semibold truncate">{b.title}</span>
              <span className="block text-[11px] text-muted truncate">{b.author} · {n} shared</span>
            </button>
            <span className="chip !text-[10px]" style={{ color: statusColor(b.status), borderColor: statusColor(b.status) }}>{statusLabel(b.status)}</span>
          </li>
        ))}
      </ul>
      {picking && <Picker list={finished} onClose={() => setPicking(false)} onPick={(id) => { onChange(id); setPicking(false); setOff([]) }} />}
    </section>
  )
}

export default function ReadNext() {
  const { books } = useStore()
  const [pile, setPile] = useState('all')
  const [exW, setExW] = useState(false)
  const [exP, setExP] = useState(false)
  const [quiz, setQuiz] = useState(false)
  const [over, setOver] = useState({}) // column index -> chosen book id

  const finished = useMemo(() => books.filter((b) => b.status === 'finished').sort((a, b) => ratingOf(b) - ratingOf(a) || (b.finishDate || '').localeCompare(a.finishDate || '')), [books])
  // one top-rated finished book per Official Title, so three columns are three different titles
  const tops = useMemo(() => {
    const seen = new Set(), out = []
    finished.forEach((b) => { const k = titleKey(b.title); if (!seen.has(k)) { seen.add(k); out.push(b) } })
    return out
  }, [finished])
  const pool = useMemo(() => books.filter((b) => {
    if (!['bought', 'paused', 'wishlist'].includes(b.status)) return false
    if (pile !== 'all' && b.status !== pile) return false
    if (exW && b.status === 'wishlist') return false
    if (exP && b.status === 'paused') return false
    return true
  }), [books, pile, exW, exP])

  const cols = [0, 1, 2].map((i) => (over[i] && books.find((b) => b.id === over[i])) || tops[i]).filter(Boolean)
  return (
    <>
      <PageTitle sub="Pick your next book from what you already love" action={<button className="btn btn-primary" onClick={() => setQuiz(true)}><Sparkles size={14} /> What should I read next?</button>}>Read next</PageTitle>
      <div className="flex flex-wrap items-center gap-2 mb-3" data-piles>
        {PILES.map(([id, l]) => <button key={id} className={`chip ${pile === id ? '!border-accent text-accent font-semibold' : ''}`} aria-pressed={pile === id} onClick={() => setPile(id)}>{l}</button>)}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4">
        <Toggle on={exW} onChange={setExW} label="Exclude Wishlist" />
        <Toggle on={exP} onChange={setExP} label="Exclude Paused" />
        <span className="text-xs text-muted font-mono self-center">{pool.length} book{pool.length === 1 ? '' : 's'} in this pile</span>
      </div>
      {cols.length === 0 ? <Empty icon={Sparkles}>Finish and rate a book and it will show up here.</Empty> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {cols.map((b, i) => <LovedColumn key={i + b.id} loved={b} idx={i} pool={pool} finished={finished} onChange={(id) => setOver({ ...over, [i]: id })} />)}
        </div>
      )}
      {quiz && <Quiz pool={pool} onClose={() => setQuiz(false)} />}
    </>
  )
}
