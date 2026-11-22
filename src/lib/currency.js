// Currency helpers. Rates are "units of currency per 1 USD".
export const CURRENCIES = [
  ['USD', 'US Dollar', '$'], ['MYR', 'Malaysian Ringgit', 'RM'], ['SGD', 'Singapore Dollar', 'S$'],
  ['GBP', 'British Pound', '£'], ['EUR', 'Euro', '€'], ['JPY', 'Japanese Yen', '¥'],
  ['AUD', 'Australian Dollar', 'A$'], ['CAD', 'Canadian Dollar', 'C$'], ['CNY', 'Chinese Yuan', '¥'],
  ['INR', 'Indian Rupee', '₹'], ['IDR', 'Indonesian Rupiah', 'Rp'], ['THB', 'Thai Baht', '฿'],
  ['KRW', 'South Korean Won', '₩'], ['HKD', 'Hong Kong Dollar', 'HK$'], ['NZD', 'New Zealand Dollar', 'NZ$'],
  ['CHF', 'Swiss Franc', 'CHF'], ['PHP', 'Philippine Peso', '₱'],
]

export const DEFAULT_RATES = {
  USD: 1, MYR: 4.45, SGD: 1.34, GBP: 0.79, EUR: 0.92, JPY: 150, AUD: 1.52, CAD: 1.37, CNY: 7.2,
  INR: 83.2, IDR: 15700, THB: 35.5, KRW: 1340, HKD: 7.8, NZD: 1.65, CHF: 0.88, PHP: 56,
}

export const symbolOf = (code) => (CURRENCIES.find((c) => c[0] === code) || [code, code, code])[2]

export const fmtMoney = (amount, code) => {
  const n = Number(amount) || 0
  const digits = ['JPY', 'KRW', 'IDR'].includes(code) ? 0 : 2
  return `${code} ${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export const convert = (amount, from, to, rates) => {
  const rf = rates[from] || 1
  const rt = rates[to] || 1
  return (Number(amount) || 0) * (rt / rf)
}

// Spending = books that have been bought (not wishlist) and have a price.
export const spendingByCurrency = (books) => {
  const out = {}
  books.forEach((b) => {
    if (b.status === 'wishlist' || !b.price) return
    const c = b.currency || 'USD'
    out[c] = (out[c] || 0) + Number(b.price)
  })
  return out
}

export const totalSpending = (books, primary, rates) => {
  const by = spendingByCurrency(books)
  return Object.entries(by).reduce((s, [c, v]) => s + convert(v, c, primary, rates), 0)
}

// Live rates from a free public API; falls back to saved rates on failure.
export async function fetchLiveRates() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!res.ok) throw new Error('rate request failed')
  const data = await res.json()
  if (!data.rates) throw new Error('bad rate payload')
  const rates = {}
  CURRENCIES.forEach(([c]) => {
    if (data.rates[c]) rates[c] = data.rates[c]
  })
  rates.USD = 1
  return rates
}
