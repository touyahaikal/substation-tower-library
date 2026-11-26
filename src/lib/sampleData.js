import { uid, blankBook, COVER_COLORS } from './utils.js'

const Y = new Date().getFullYear()
const d = (m, day, y = Y) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const mk = (o) => {
  const b = blankBook()
  return { ...b, ...o, id: o.id || uid(), cover: { ...b.cover, ...(o.cover || {}) }, review: { ...b.review, ...(o.review || {}), scores: { ...b.review.scores, ...((o.review || {}).scores || {}) } } }
}

const fut = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
export const sampleBooks = () => [
  mk({
    id: 'b1', title: 'The Midnight Library', author: 'Matt Haig', genres: ['Fantasy', 'Literary'], pages: 304, status: 'finished',
    summary: 'Between life and death there is a library, and within it, an infinite number of books of lives you could have lived.',
    startDate: d(1, 4), finishDate: d(1, 19), readWhere: 'Owned', currency: 'MYR', price: 42.9, favorite: true, reads: 1,
    cover: { color: '#1F2933', style: 'circle' }, moods: ['Hopeful', 'Reflective'], tropes: ['Second chances'], tears: 3,
    review: { rating: 5, text: 'Gentle, clever and quietly devastating. I underlined half of it.', scores: { plot: 4, characters: 4, writing: 4, pacing: 5, world: 5 } },
    quotes: [{ id: 'q1', text: 'Between life and death there is a library.', page: 5, date: d(1, 5) }, { id: 'q2', text: 'You don’t have to understand life. You just have to live it.', page: 214, date: d(1, 15) }],
    notes: [{ id: 'n1', text: 'The Book of Regrets is such a good device.', date: d(1, 8) }],
    readingLog: [{ id: 'l1', date: d(1, 4), pages: 60 }, { id: 'l2', date: d(1, 8), pages: 80 }, { id: 'l3', date: d(1, 12), pages: 90 }, { id: 'l4', date: d(1, 19), pages: 74 }],
    characters: [{ id: 'c1', name: 'Nora Seed', note: 'Protagonist', x: 60, y: 60 }, { id: 'c2', name: 'Mrs Elm', note: 'The librarian', x: 300, y: 60 }, { id: 'c3', name: 'Joe', note: 'Ex-fiancé', x: 180, y: 190 }],
    relations: [{ id: 'r1', from: 'c1', to: 'c2', label: 'guided by' }, { id: 'r2', from: 'c1', to: 'c3', label: 'former love' }],
    vocab: [{ id: 'v1', word: 'Ephemeral', def: 'Lasting a very short time.', known: false }],
  }),
  mk({
    id: 'b2', title: 'Dune', author: 'Frank Herbert', genres: ['Sci-Fi', 'Classic'], pages: 688, status: 'finished',
    summary: 'A desert planet, a boy destined to become more than a man, and the spice that rules the universe.',
    startDate: d(2, 1), finishDate: d(3, 2), readWhere: 'Borrowed / Library', sourceNote: 'KL Public Library', currency: 'USD', price: 0, reads: 1,
    cover: { color: '#B8860B', style: 'stripes' }, moods: ['Tense', 'Adventurous'], series: 'Dune Chronicles', seriesNumber: 1, seriesTotal: 6,
    review: { rating: 5, text: 'Dense, political, mesmerising.', scores: { plot: 5, characters: 4, writing: 4, pacing: 3, world: 5 } },
    quotes: [{ id: 'q3', text: 'Fear is the mind-killer.', page: 8, date: d(2, 2) }],
    readingLog: [{ id: 'l5', date: d(2, 1), pages: 100 }, { id: 'l6', date: d(2, 14), pages: 250 }, { id: 'l7', date: d(3, 2), pages: 338 }],
  }),
  mk({
    id: 'b3', title: 'Pride and Prejudice', author: 'Jane Austen', genres: ['Classic', 'Romance'], pages: 432, status: 'finished',
    startDate: d(4, 3), finishDate: d(4, 27), readWhere: 'Owned', currency: 'GBP', price: 6.99, reads: 2, favorite: true,
    cover: { color: '#8A3B3B', style: 'frame' }, moods: ['Romantic', 'Funny'], spice: 1,
    review: { rating: 4, text: 'Witty as ever. Re-read on a rainy month.', scores: { plot: 4, characters: 5, writing: 5, pacing: 3, world: 3 } },
    readingLog: [{ id: 'l8', date: d(4, 3), pages: 120 }, { id: 'l9', date: d(4, 15), pages: 150 }, { id: 'l10', date: d(4, 27), pages: 162 }],
  }),
  mk({
    id: 'b4', title: 'Project Hail Mary', author: 'Andy Weir', genres: ['Sci-Fi'], pages: 476, status: 'finished',
    startDate: d(6, 2), finishDate: d(6, 20), readWhere: 'Online', currency: 'SGD', price: 18.5, reads: 1,
    cover: { color: '#0E7490', style: 'circle' }, moods: ['Funny', 'Hopeful', 'Tense'], tears: 2,
    review: { rating: 5, text: 'Rocky is the best character of the decade.', scores: { plot: 5, characters: 5, writing: 4, pacing: 5, world: 4 } },
    quotes: [{ id: 'q4', text: 'Fist my bump.', page: 330, date: d(6, 14) }],
    readingLog: [{ id: 'l11', date: d(6, 2), pages: 90 }, { id: 'l12', date: d(6, 10), pages: 200 }, { id: 'l13', date: d(6, 20), pages: 186 }],
  }),
  mk({
    id: 'b5', title: 'Circe', author: 'Madeline Miller', genres: ['Fantasy', 'Historical'], pages: 393, status: 'finished',
    startDate: d(8, 5), finishDate: d(8, 24), readWhere: 'Subscription', sourceNote: 'Kindle Unlimited', currency: 'EUR', price: 9.99, reads: 1,
    cover: { color: '#2F5D50', style: 'diagonal' }, moods: ['Dark', 'Reflective'], tears: 1,
    review: { rating: 4, text: 'Lyrical retelling with real bite.', scores: { plot: 4, characters: 5, writing: 5, pacing: 3, world: 4 } },
    readingLog: [{ id: 'l14', date: d(8, 5), pages: 130 }, { id: 'l15', date: d(8, 15), pages: 140 }, { id: 'l16', date: d(8, 24), pages: 123 }],
  }),
  mk({
    id: 'b6', title: 'The Name of the Wind', author: 'Patrick Rothfuss', genres: ['Fantasy'], pages: 662, status: 'paused', currentPage: 241,
    startDate: d(10, 28), readWhere: 'Owned', currency: 'MYR', price: 55, series: 'The Kingkiller Chronicle', seriesNumber: 1, seriesTotal: 3,
    cover: { color: '#4B3F72', style: 'frame' }, moods: ['Whimsical', 'Adventurous'],
    summary: 'The tale of Kvothe, told in his own words.',
    readingLog: [{ id: 'l17', date: d(11, 18), pages: 40 }, { id: 'l18', date: d(11, 20), pages: 55 }],
  }),
  mk({
    id: 'b7', title: 'Piranesi', author: 'Susanna Clarke', genres: ['Fantasy', 'Literary'], pages: 272, status: 'reading', currentPage: 90,
    startDate: d(11, 10), readWhere: 'Borrowed / Library', sourceNote: 'Due back soon', returnDate: d(12, 5), currency: 'GBP', price: 0,
    cover: { color: '#3F4B5B', style: 'stripes' }, moods: ['Reflective', 'Whimsical'],
  }),
  mk({
    id: 'b8', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genres: ['Literary'], pages: 416, status: 'bought',
    readWhere: 'Owned', currency: 'SGD', price: 22.9, cover: { color: '#C2410C', style: 'diagonal' }, moods: ['Heartbreaking', 'Reflective'],
  }),
  mk({
    id: 'b9', title: 'The Sunday Morning Murders', author: 'Eliza Hart', genres: ['Mystery'], pages: 340, status: 'bought',
    readWhere: 'Gifted', sourceNote: 'From Aunt Lin', currency: 'MYR', price: 0, cover: { color: '#6B7280', style: 'circle' }, moods: ['Cozy', 'Tense'],
  }),
  mk({
    id: 'b10', title: 'Babel', author: 'R. F. Kuang', genres: ['Fantasy', 'Historical'], pages: 545, status: 'bought',
    readWhere: 'Owned', currency: 'USD', price: 18.99, cover: { color: '#7C6F64', style: 'frame' }, moods: ['Dark', 'Reflective'],
  }),
  mk({
    id: 'b11', title: 'Klara and the Sun', author: 'Kazuo Ishiguro', genres: ['Sci-Fi', 'Literary'], pages: 303, status: 'wishlist', priority: 'Must Read', starred: true, releaseDate: fut(12), wishKind: 'read',
    cover: { color: '#B8860B', style: 'circle' }, currency: 'EUR', price: 14, moods: ['Reflective'],
  }),
  mk({
    id: 'b12', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', genres: ['Non-fiction'], pages: 391, status: 'wishlist', priority: 'Someday', releaseDate: fut(40),
    cover: { color: '#2F5D50', style: 'stripes' }, currency: 'USD', price: 17,
  }),
  // Demo of same-title grouping: one title, two editions (Manga is the main edition: more volumes)
  ...[[0, 'Prologue', 'finished'], [0.5, 'Special Prologue', 'finished'], [1, '', 'finished'], [2, '', 'finished'], [3, '', 'finished'], [4, '', 'reading'], [5, '', 'bought'], [6, '', 'wishlist']].map(([n, label, status], i) =>
    mk({
      id: `sb-m-${n}`, title: 'Skyward Blades', author: 'Aiko Mori', genres: ['Fantasy', 'Action'], language: 'English', edition: 'Manga', format: 'Paper',
      pages: 192, status, volume: n, volumeLabel: label, isSeriesCover: n === 1, yearReleased: 2018, currency: 'MYR', price: status === 'wishlist' ? 0 : 29.9,
      currentPage: status === 'finished' ? 192 : status === 'reading' ? 64 : 0,
      startDate: status === 'finished' || status === 'reading' ? d(2, 1 + i) : '', finishDate: status === 'finished' ? d(2, 3 + i) : '',
      cover: { color: '#3F4B5B', style: 'diagonal' }, reads: status === 'finished' ? 1 : 0,
      review: status === 'finished' ? { rating: n === 1 ? 4.5 : 4 } : {},
      characters: CHARS[n] || [],
    })
  ),
  ...[[1, 'finished'], [2, 'bought'], [3, 'wishlist']].map(([n, status], i) =>
    mk({
      id: `sb-n-${n}`, title: 'Skyward Blades', author: 'Aiko Mori', genres: ['Fantasy', 'Action'], language: 'Japanese', edition: 'Light Novel', format: 'Paper',
      pages: 264, status, volume: n, numbering: 'subtitle', subtitle: ['Summer of Ashes, Autumn of Dust', 'Thorny Road at Dawn', 'The Last Gale'][n - 1], yearReleased: 2016, currency: 'MYR', price: status === 'wishlist' ? 0 : 39.9,
      currentPage: status === 'finished' ? 264 : 0, startDate: status === 'finished' ? d(3, 1) : '', finishDate: status === 'finished' ? d(3, 20) : '',
      cover: { color: '#4B3F72', style: 'frame' }, reads: status === 'finished' ? 1 : 0, review: status === 'finished' ? { rating: 4 } : {},
      characters: n === 1 ? [{ id: 'ch-n1-a', name: 'Captain Haru', avatar: 'olderman', role: 'Mentor', desc: 'Veteran of the sky wars.', aka: 'The Old Hawk', group: 'Wind Corps', age: '58', firstAppearance: 'Chapter 2', quote: 'Fly lower than your fear.', x: 30, y: 30 }] : [],
    })
  ),
  ...extraBooks(),
]

const extraBooks = () => [
  mk({
    id: 'sb-fan', title: 'Skyward Blades', author: 'Aiko Mori', genres: ['Fantasy', 'Action'], language: 'English', edition: 'Fanbook', format: 'Paper',
    pages: 144, status: 'bought', numbering: 'named', companionName: 'Official Fanbook', yearReleased: 2020, currency: 'MYR', price: 49.9,
    cover: { color: '#8A5A44', style: 'frame' }, links: [{ id: 'l1', url: 'https://www.kinokuniya.com/' }],
  }),
  mk({
    id: 'sb-guide', title: 'Skyward Blades', author: 'Aiko Mori', genres: ['Fantasy', 'Action'], language: 'English', edition: 'Guidebook', format: 'Paper',
    pages: 120, status: 'wishlist', numbering: 'named', companionName: 'TV Anime Official Start Guide', yearReleased: 2024, currency: 'JPY', price: 1650, releaseDate: fut(25),
    cover: { color: '#2F6D80', style: 'diagonal' },
  }),
]

const CHARS = {
  1: [
    { id: 'ch-m1-a', name: 'Rin Takeda', avatar: 'girl', role: 'Protagonist', desc: 'A stubborn apprentice swordswoman.', aka: 'Sky Rin', group: 'Wind Corps', age: '16', firstAppearance: 'Chapter 1', quote: 'I will cut the sky open.', x: 30, y: 30 },
    { id: 'ch-m1-b', name: 'Kaito', avatar: 'boy', role: 'Love interest', desc: 'Quiet rival from the northern academy.', aka: '', group: 'North Academy', age: '17', firstAppearance: 'Chapter 3', quote: '', x: 190, y: 30 },
  ],
  2: [
    { id: 'ch-m2-a', name: 'Lady Sora', avatar: 'woman', role: 'Antagonist', desc: 'Warden of the storm gate.', aka: 'The Gale Queen', group: 'Storm Gate', age: '', firstAppearance: 'Chapter 7', quote: 'No one passes in daylight.', x: 30, y: 30 },
  ],
}

export const sampleCollections = () => [
  { id: 'col1', name: 'Comfort Reads', type: 'custom', bookIds: ['b1', 'b3', 'b9'] },
  { id: 'col2', name: 'Five-Star Club', type: 'smart', rule: 'rating5', bookIds: [] },
  { id: 'col3', name: 'Library Loans', type: 'smart', rule: 'borrowed', bookIds: [] },
]

export const defaultSettings = () => ({
  name: 'Reader',
  theme: 'ttpd',
  pattern: 'plain', patternDensity: 'balanced', patternIntensity: 'soft', spacing: 'roomy', textSize: 'normal', shelfDecor: 'auto',
  mode: 'light',
  goalBooks: 24,
  goalPages: 8000,
  primaryCurrency: 'MYR',
  rates: null, // filled from DEFAULT_RATES in store
  ratesUpdated: null,
  visitorPublicEnabled: true,
  pixelIcon: 'heart',
  defaultLanguage: 'English',
  tags: null, // null = built-in tag lists; the Tags & labels manager saves its own
})

export const sampleChallenges = () => [
  { id: 'ch1', name: 'Read 12 books', kind: 'books', target: 12, year: Y },
  { id: 'ch2', name: '5,000 pages', kind: 'pages', target: 5000, year: Y },
  { id: 'ch3', name: 'Genre explorer (6 genres)', kind: 'genres', target: 6, year: Y },
]

export const sampleTasks = () => [
  { id: 't1', text: 'Return Piranesi to the library', done: false },
  { id: 't2', text: 'Update the wishlist before the book fair', done: false },
]

export { COVER_COLORS }
