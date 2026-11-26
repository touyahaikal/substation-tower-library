export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const todayStr = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}

export const STATUSES = [
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'bought', label: 'Bought' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'paused', label: 'Paused' },
  { id: 'finished', label: 'Finished' },
]
// colour per status as an "r g b" triple (Paused = warm amber, Finished = green; the others follow the theme)
export const STATUS_RGB = { wishlist: 'var(--muted)', bought: '59 130 246', reading: 'var(--accent)', paused: '217 154 15', finished: '22 163 74' }
export const statusColor = (id) => `rgb(${STATUS_RGB[id] || STATUS_RGB.wishlist})`
export const inProgress = (b) => b.status === 'reading' || b.status === 'paused'
export const statusLabel = (id) => (STATUSES.find((s) => s.id === id) || {}).label || id

export const SOURCES = ['Owned', 'Online', 'Borrowed / Library', 'Subscription', 'Gifted']
export const FORMATS = ['Paper', 'eBook', 'Audio']
export const UNITS = ['Pages', 'Percent', 'Minutes']
export const MOODS = ['Cozy', 'Dark', 'Funny', 'Heartbreaking', 'Hopeful', 'Tense', 'Whimsical', 'Reflective', 'Adventurous', 'Romantic']
export const QUICK_GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Action', 'Slice of Life', 'Drama', 'Horror', 'Poetry', 'Non-Fiction']
export const LANGUAGES = ['English', 'Japanese', 'Malay', 'Chinese', 'Korean', 'French']
export const EDITIONS = ['Manga', 'Light Novel', 'Databook', 'Guidebook', 'Fanbook', 'Novel', 'Hardcover', 'Paperback', 'Artbook', 'Omnibus', 'eBook', 'Audiobook']
export const NUMBERING = [
  ['volume', 'Numbered volume', 'Vol. 0, 0.5, 1, 2… (great for manga)'],
  ['subtitle', 'Numbered + subtitle', 'Novel 1 plus a book subtitle'],
  ['named', 'Standalone / named', 'No number: a companion with its own name'],
]
export const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Literary', 'Historical', 'Non-fiction', 'Poetry', 'Horror', 'Classic', 'Memoir']
export const PRIORITIES = ['Must Read', 'Want to Read', 'Someday']

export const COVER_STYLES = ['solid', 'stripes', 'circle', 'diagonal', 'frame']
export const COVER_COLORS = ['#7C6F64', '#3F4B5B', '#8A3B3B', '#2F5D50', '#B8860B', '#4B3F72', '#1F2933', '#C2410C', '#0E7490', '#6B7280']

export const monthKey = (d) => d.slice(0, 7)
export const yearOf = (d) => (d ? Number(d.slice(0, 4)) : null)

// Progress as 0..1 for a book
export const progressOf = (b) => {
  if (b.status === 'finished') return 1
  if (!inProgress(b)) return 0
  const total = b.unit === 'Minutes' ? b.audioMinutes : b.unit === 'Percent' ? 100 : b.pages
  if (!total) return 0
  return Math.min(1, (b.currentPage || 0) / total)
}

export const unitSuffix = (b) => (b.unit === 'Percent' ? '%' : b.unit === 'Minutes' ? ' min' : ' pages')
export const unitTotal = (b) => (b.unit === 'Minutes' ? b.audioMinutes : b.unit === 'Percent' ? 100 : b.pages)

export const avgRating = (b) => {
  const r = b.review || {}
  return r.rating || 0
}

export const blankBook = () => ({
  id: uid(),
  title: '', author: '', summary: '', genres: [], pages: 0, format: 'Paper', audioMinutes: 0, narrator: '',
  unit: 'Pages', currentPage: 0,
  cover: { color: COVER_COLORS[0], style: 'solid', url: '' },
  language: 'English', edition: 'Paperback', notesText: '',
  yearReleased: '', yearBought: '', yearStarted: '', yearFinished: '',
  hidden: false, volume: null, volumeLabel: '', isSeriesCover: false,
  authors: [], numbering: 'volume', subtitle: '', companionName: '', links: [], releaseDate: '', starred: false, wishKind: 'own',
  status: 'wishlist', priority: 'Want to Read', startDate: '', finishDate: '',
  readWhere: 'Owned', sourceNote: '', returnDate: '',
  series: '', seriesNumber: 0, seriesTotal: 0,
  review: { rating: 0 /* 0-100 */, text: '', scores: { plot: 0, characters: 0, writing: 0, pacing: 0, world: 0 } },
  moods: [], tropes: [], contentWarnings: [], spice: 0, tears: 0, publisher: '',
  currency: 'USD', price: 0, favorite: false,
  quotes: [], notes: [], readingLog: [], characters: [], relations: [], vocab: [],
  reads: 0, addedAt: new Date().toISOString(),
})

// Streak: consecutive days with a log entry (or a paused day). Today does not break the streak if not yet logged.
export const computeStreak = (readDays, pausedDays) => {
  const set = new Set([...(readDays || []), ...(pausedDays || [])])
  let d = new Date()
  let streak = 0
  if (!set.has(todayStr(d))) d.setDate(d.getDate() - 1)
  while (set.has(todayStr(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export const weekKey = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return todayStr(d)
}

export const downloadJSON = (obj, name) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ---------- v2 additions ----------
export const SCHEMA_VERSION = 2

// Rating is stored 0-100. Star displays use ratingStars().
export const ratingOf = (b) => Number((b.review || {}).rating) || 0
export const ratingStars = (b) => ratingOf(b) / 20

// "Naruto · Vol. 3 — Subtitle" for volume entries, plain title otherwise
const hasVol = (b) => b.volume != null && b.volume !== ''
// prefix for "Numbered + subtitle" entries: Light Novel / Novel -> "Novel 1", Databook -> "Databook 1"
export const numPrefix = (b) => {
  if (b.numbering !== 'subtitle') return 'Vol.'
  const e = (b.edition || '').trim()
  return !e ? 'No.' : /^(light\s*)?novel$/i.test(e) ? 'Novel' : e
}
// the text that identifies one entry inside its title:  "Vol. 3 — Prologue" | "Novel 1 · Summer of Ashes" | "Official Fanbook"
export const volumeText = (b) => {
  if (b.numbering === 'named') return (b.companionName || '').trim()
  if (b.numbering === 'subtitle') {
    const sub = (b.subtitle || b.volumeLabel || '').trim()
    return hasVol(b) ? `${numPrefix(b)} ${b.volume}${sub ? ` · ${sub}` : ''}` : sub
  }
  return hasVol(b) ? `Vol. ${b.volume}${b.volumeLabel ? ` — ${b.volumeLabel}` : ''}` : ''
}
export const displayTitle = (b) => (volumeText(b) ? `${b.title} · ${volumeText(b)}` : b.title)
// short label for a tile: the volume number, or the companion's name
export const tileLabel = (b) => (b.numbering === 'named' ? (b.companionName || '').trim() || '★' : hasVol(b) ? String(b.volume) : '')
export const splitAuthors = (s) => [...new Set(String(s || '').split(/\s*(?:[,;&]|\band\b)\s*/i).map((x) => x.trim()).filter(Boolean))]

// ---------- external links ----------
const SITES = { amazon: 'Amazon', goodreads: 'Goodreads', kobo: 'Kobo', shopee: 'Shopee', kinokuniya: 'Kinokuniya', bookxcess: 'BookXcess', mangadex: 'MangaDex', novelupdates: 'NovelUpdates', webtoons: 'Webtoon', webtoon: 'Webtoon', bookwalker: 'BookWalker', 'books.google': 'Google Books', wikipedia: 'Wikipedia', myanimelist: 'MyAnimeList', anilist: 'AniList', fishpond: 'Fishpond', lazada: 'Lazada', carousell: 'Carousell' }
export const normalizeUrl = (u) => {
  let t = String(u || '').trim()
  if (!t) return ''
  if (!/^https?:\/\//i.test(t)) t = 'https://' + t
  try {
    const x = new URL(t)
    return /\./.test(x.hostname) ? x.href : ''
  } catch {
    return ''
  }
}
export const linkInfo = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const key = Object.keys(SITES).find((k) => host.includes(k))
    if (key) return { host, label: SITES[key] }
    const parts = host.split('.')
    const core = parts.length > 2 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2] || host
    return { host, label: core.charAt(0).toUpperCase() + core.slice(1) }
  } catch {
    return { host: '', label: 'Link' }
  }
}
// days from today to a YYYY-MM-DD date (negative = past)
export const daysUntil = (d) => {
  if (!d) return null
  const t = new Date(todayStr() + 'T00:00:00'), x = new Date(d + 'T00:00:00')
  return Number.isNaN(x.getTime()) ? null : Math.round((x - t) / 86400000)
}
export const comingText = (d) => {
  const n = daysUntil(d)
  return n == null ? '' : n <= 0 ? 'Out now' : n === 1 ? 'tomorrow' : `in ${n} days`
}

const editionFromFormat = (f) => (f === 'eBook' ? 'eBook' : f === 'Audio' ? 'Audiobook' : 'Paperback')
export const formatFromEdition = (e) => (e === 'eBook' ? 'eBook' : e === 'Audiobook' ? 'Audio' : 'Paper')

// Keep the year fields and the exact dates consistent (dates drive the charts; years are what you type)
export const syncYears = (b) => {
  const out = { ...b }
  const y = (d) => (d ? Number(d.slice(0, 4)) : '')
  if (out.startDate && !out.yearStarted) out.yearStarted = y(out.startDate)
  if (out.finishDate && !out.yearFinished) out.yearFinished = y(out.finishDate)
  if (out.yearStarted && (!out.startDate || y(out.startDate) !== Number(out.yearStarted))) out.startDate = `${out.yearStarted}-07-01`
  if (out.yearFinished && (!out.finishDate || y(out.finishDate) !== Number(out.yearFinished))) out.finishDate = `${out.yearFinished}-07-01`
  if (!out.yearFinished && !out.finishDate) out.finishDate = ''
  return out
}

// Bring older saved data up to the current shape (rating 0-5 -> 0-100, edition, ...)
export const migrateBook = (b, fromVersion) => {
  b = b && typeof b === 'object' ? b : {}
  const base = blankBook()
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
  const m = { ...base, ...b, cover: { ...base.cover, ...obj(b.cover) }, review: { ...base.review, ...obj(b.review), scores: { ...base.review.scores, ...obj(obj(b.review).scores) } } }
  m.id = b.id || base.id
  // authors: new chips list; older entries only have the single "author" text
  m.authors = Array.isArray(b.authors) ? b.authors.map((x) => String(x).trim()).filter(Boolean) : splitAuthors(b.author)
  m.author = m.authors.length ? m.authors.join(', ') : String(b.author ?? '')
  m.links = (Array.isArray(b.links) ? b.links : []).map((l) => (typeof l === 'string' ? { url: l } : l)).filter((l) => l && typeof l.url === 'string').map((l) => ({ id: l.id || uid(), url: normalizeUrl(l.url) })).filter((l) => l.url)
  m.numbering = ['volume', 'subtitle', 'named'].includes(b.numbering) ? b.numbering : String(b.companionName || '').trim() && (b.volume == null || b.volume === '') ? 'named' : 'volume'
  m.starred = !!b.starred
  m.wishKind = b.wishKind === 'read' ? 'read' : 'own'
  m.releaseDate = /^\d{4}-\d{2}-\d{2}$/.test(String(b.releaseDate || '')) ? b.releaseDate : ''
  // older / hand-edited files may hold null, strings or missing values: coerce everything the UI reads
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x != null) : [])
  ;['genres', 'moods', 'tropes', 'contentWarnings'].forEach((k) => { m[k] = list(m[k]).map(String) })
  m.quotes = list(m.quotes).filter((x) => x && typeof x === 'object').map((x) => ({ ...x, id: x.id || uid(), text: String(x.text ?? ''), date: String(x.date ?? '') }))
  m.notes = list(m.notes).filter((x) => x && typeof x === 'object').map((x) => ({ ...x, id: x.id || uid(), text: String(x.text ?? ''), date: String(x.date ?? '') }))
  m.readingLog = list(m.readingLog).filter((x) => x && typeof x === 'object').map((x) => ({ ...x, id: x.id || uid(), date: String(x.date ?? ''), pages: Number(x.pages) || 0 }))
  m.characters = list(m.characters).filter((x) => x && typeof x === 'object').map((x, i) => ({ ...x, id: x.id || uid(), name: String(x.name ?? ''), x: Number.isFinite(Number(x.x)) ? Number(x.x) : 30 + (i % 4) * 160, y: Number.isFinite(Number(x.y)) ? Number(x.y) : 30 + Math.floor(i / 4) * 100 }))
  m.relations = list(m.relations).filter((x) => x && typeof x === 'object')
  m.vocab = list(m.vocab)
  ;['title', 'author', 'summary', 'notesText', 'language', 'edition', 'publisher', 'volumeLabel', 'subtitle', 'companionName'].forEach((k) => { m[k] = m[k] == null ? '' : String(m[k]) })
  ;['pages', 'currentPage', 'audioMinutes', 'price', 'spice', 'tears', 'reads'].forEach((k) => { m[k] = Number(m[k]) || 0 })
  m.review.rating = Number(m.review.rating) || 0
  if (!['wishlist', 'bought', 'reading', 'paused', 'finished'].includes(m.status)) m.status = 'wishlist'
  if (!b.edition) m.edition = editionFromFormat(b.format)
  if ((fromVersion || 1) < 2 && m.review.rating && m.review.rating <= 5) m.review.rating = Math.round(m.review.rating * 20)
  return m
}

// ---------- tags & labels ----------
export const DEFAULT_TAGS = {
  genres: QUICK_GENRES,
  moods: MOODS,
  tropes: ['Enemies to Lovers', 'Found Family', 'Chosen One', 'Slow Burn', 'Mentor Figure', 'Unreliable Narrator'],
  warnings: ['Violence', 'Death', 'Grief', 'Abuse', 'War'],
}
export const TAG_FIELD = { genres: 'genres', moods: 'moods', tropes: 'tropes', warnings: 'contentWarnings' }
// known tags = the saved list (or the defaults) plus anything a book already uses
export const tagList = (settings, books, kind) => {
  const saved = settings && settings.tags && Array.isArray(settings.tags[kind]) ? settings.tags[kind] : null
  const base = saved || DEFAULT_TAGS[kind]
  const m = new Map()
  base.forEach((t) => m.set(String(t).toLowerCase(), String(t)))
  books.forEach((b) => (b[TAG_FIELD[kind]] || []).forEach((t) => !m.has(t.toLowerCase()) && m.set(t.toLowerCase(), t)))
  return [...m.values()]
}
export const tagUsage = (books, kind, tag) => books.filter((b) => (b[TAG_FIELD[kind]] || []).some((t) => t.toLowerCase() === tag.toLowerCase())).length

// ---------- characters ----------
export const AVATARS = [
  ['woman', 'Woman', '👩'], ['man', 'Man', '👨'], ['girl', 'Girl', '👧'], ['boy', 'Boy', '👦'],
  ['olderwoman', 'Older woman', '👵'], ['olderman', 'Older man', '👴'], ['creature', 'Creature or other', '🐉'],
]
export const avatarOf = (id) => (AVATARS.find((a) => a[0] === id) || AVATARS[6])[2]
export const CHAR_ROLES = ['Protagonist', 'Love interest', 'Antagonist', 'Side character', 'Mentor', 'Other']
