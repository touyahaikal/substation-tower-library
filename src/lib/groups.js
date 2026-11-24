// Grouping of entries into "titles": same Title (case-insensitive) => one group.
// Inside a group, entries are split by edition/format; volume entries sort numerically so 0 and 0.5 come first.
import { progressOf, ratingOf } from './utils.js'

export const titleKey = (t) => String(t || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()
export const volNum = (b) => (b.volume == null || b.volume === '' ? null : Number(b.volume))
export const byVolume = (a, b) => {
  const x = volNum(a), y = volNum(b)
  if (x == null && y == null) return 0
  if (x == null) return 1
  if (y == null) return -1
  return x - y
}
export const fmtVol = (n) => (Number.isInteger(n) ? String(n) : String(n))

const totalPages = (list) => list.reduce((s, b) => s + (Number(b.pages) || 0), 0)

export function buildEditions(entries) {
  const map = new Map()
  entries.forEach((b) => {
    const k = (b.edition || 'Paperback').trim() || 'Paperback'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(b)
  })
  const eds = [...map.entries()].map(([edition, list]) => ({
    edition,
    entries: [...list].sort(byVolume),
    finished: list.filter((b) => b.status === 'finished').length,
    pages: totalPages(list),
    pagesRead: list.reduce((s, b) => s + (b.status === 'finished' ? Number(b.pages) || 0 : b.status === 'reading' ? Number(b.currentPage) || 0 : 0), 0),
  }))
  // main edition = most entries, ties broken by total pages
  eds.sort((a, b) => b.entries.length - a.entries.length || b.pages - a.pages || a.edition.localeCompare(b.edition))
  return eds
}

export function buildGroups(books) {
  const map = new Map()
  books.forEach((b) => {
    const k = titleKey(b.title) || b.id
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(b)
  })
  return [...map.entries()].map(([key, entries]) => {
    const editions = buildEditions(entries)
    const main = editions[0]
    const hasVolumes = entries.some((b) => volNum(b) != null)
    const isCollection = entries.length > 1 || hasVolumes
    const cover = entries.find((b) => b.isSeriesCover) || main.entries.find((b) => volNum(b) != null && volNum(b) >= 1) || main.entries[0]
    const finished = entries.filter((b) => b.status === 'finished').length
    const rated = entries.map(ratingOf).filter(Boolean)
    return {
      key, entries, editions, main, cover, hasVolumes, isCollection,
      title: main.entries[0].title,
      author: (main.entries.find((b) => b.author) || main.entries[0]).author,
      finished,
      pages: totalPages(entries),
      pagesRead: editions.reduce((s, e) => s + e.pagesRead, 0),
      progress: entries.reduce((s, b) => s + progressOf(b), 0) / entries.length,
      rating: rated.length ? Math.round(rated.reduce((a, c) => a + c, 0) / rated.length) : 0,
      hidden: entries.every((b) => b.hidden),
      addedAt: entries.map((b) => b.addedAt || '').sort().pop() || '',
      yearReleased: Math.min(...entries.map((b) => Number(b.yearReleased) || 9999)),
    }
  })
}

// volume numbers from "from..to" plus extras [{number,label}], de-duplicated
export function planVolumes({ from, to, extras }) {
  const out = new Map()
  const a = Number(from), z = Number(to)
  if (Number.isFinite(a) && Number.isFinite(z) && String(from) !== '' && String(to) !== '') {
    for (let n = Math.min(a, z); n <= Math.max(a, z) && out.size < 500; n++) out.set(n, '')
  }
  ;(extras || []).forEach((x) => {
    const n = Number(x.number)
    if (String(x.number).trim() !== '' && Number.isFinite(n)) out.set(n, x.label || out.get(n) || '')
  })
  return [...out.entries()].map(([number, label]) => ({ number, label })).sort((x, y) => x.number - y.number)
}
