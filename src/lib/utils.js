export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const todayStr = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}

export const STATUSES = [
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'bought', label: 'Bought' },
  { id: 'reading', label: 'Reading' },
  { id: 'finished', label: 'Finished' },
]
export const statusLabel = (id) => (STATUSES.find((s) => s.id === id) || {}).label || id

export const SOURCES = ['Owned', 'Online', 'Borrowed / Library', 'Subscription', 'Gifted']
export const FORMATS = ['Paper', 'eBook', 'Audio']
export const UNITS = ['Pages', 'Percent', 'Minutes']
export const MOODS = ['Cozy', 'Dark', 'Funny', 'Heartbreaking', 'Hopeful', 'Tense', 'Whimsical', 'Reflective', 'Adventurous', 'Romantic']
export const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Literary', 'Historical', 'Non-fiction', 'Poetry', 'Horror', 'Classic', 'Memoir']
export const PRIORITIES = ['Must Read', 'Want to Read', 'Someday']

export const COVER_STYLES = ['solid', 'stripes', 'circle', 'diagonal', 'frame']
export const COVER_COLORS = ['#7C6F64', '#3F4B5B', '#8A3B3B', '#2F5D50', '#B8860B', '#4B3F72', '#1F2933', '#C2410C', '#0E7490', '#6B7280']

export const monthKey = (d) => d.slice(0, 7)
export const yearOf = (d) => (d ? Number(d.slice(0, 4)) : null)

// Progress as 0..1 for a book
export const progressOf = (b) => {
  if (b.status === 'finished') return 1
  if (b.status !== 'reading') return 0
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
  status: 'wishlist', priority: 'Want to Read', startDate: '', finishDate: '',
  readWhere: 'Owned', sourceNote: '', returnDate: '',
  series: '', seriesNumber: 0, seriesTotal: 0,
  review: { rating: 0, text: '', scores: { plot: 0, characters: 0, writing: 0, pacing: 0, world: 0 } },
  moods: [], tropes: [], spice: 0, tears: 0,
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
