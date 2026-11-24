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
export const STATUS_RGB = { wishlist: 'var(--muted)', bought: 'var(--accent2)', reading: 'var(--accent)', paused: '217 154 15', finished: '22 163 74' }
export const statusColor = (id) => `rgb(${STATUS_RGB[id] || STATUS_RGB.wishlist})`
export const inProgress = (b) => b.status === 'reading' || b.status === 'paused'
export const statusLabel = (id) => (STATUSES.find((s) => s.id === id) || {}).label || id

export const SOURCES = ['Owned', 'Online', 'Borrowed / Library', 'Subscription', 'Gifted']
export const FORMATS = ['Paper', 'eBook', 'Audio']
export const UNITS = ['Pages', 'Percent', 'Minutes']
export const MOODS = ['Cozy', 'Dark', 'Funny', 'Heartbreaking', 'Hopeful', 'Tense', 'Whimsical', 'Reflective', 'Adventurous', 'Romantic']
export const QUICK_GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Action', 'Slice of Life', 'Drama', 'Horror', 'Poetry', 'Non-Fiction']
export const LANGUAGES = ['English', 'Japanese', 'Malay', 'Chinese', 'Korean', 'French']
export const EDITIONS = ['Manga', 'Light Novel', 'Databook', 'Novel', 'Hardcover', 'Paperback', 'Artbook', 'Omnibus', 'eBook', 'Audiobook']
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
export const volumeText = (b) => (b.volume == null || b.volume === '' ? '' : `Vol. ${b.volume}${b.volumeLabel ? ` — ${b.volumeLabel}` : ''}`)
export const displayTitle = (b) => (volumeText(b) ? `${b.title} · ${volumeText(b)}` : b.title)

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
  const base = blankBook()
  const m = { ...base, ...b, cover: { ...base.cover, ...(b.cover || {}) }, review: { ...base.review, ...(b.review || {}), scores: { ...base.review.scores, ...((b.review || {}).scores || {}) } } }
  m.id = b.id || base.id
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
  const base = (settings && settings.tags && settings.tags[kind]) || DEFAULT_TAGS[kind]
  const m = new Map()
  base.forEach((t) => m.set(t.toLowerCase(), t))
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
