import React from 'react'
import { Card } from './ui.jsx'
import { useStore } from '../lib/store.jsx'
import { CURRENCIES, spendingByCurrency, totalSpending, fmtMoney } from '../lib/currency.js'

// Per-currency subtotals + one unified Final Total in the chosen Primary Summary Currency.
export default function SpendingBreakdown({ books, title = 'Spending Breakdown' }) {
  const { settings, actions } = useStore()
  const by = spendingByCurrency(books)
  const entries = Object.entries(by).sort((a, b) => b[1] - a[1])
  const primary = settings.primaryCurrency
  const total = totalSpending(books, primary, settings.rates)
  return (
    <Card
      title={title}
      action={
        <select className="input !w-auto !py-1 text-xs" value={primary} onChange={(e) => actions.setSettings({ primaryCurrency: e.target.value })} aria-label="Primary summary currency">
          {CURRENCIES.map(([c]) => <option key={c}>{c}</option>)}
        </select>
      }
    >
      {entries.length === 0 ? (
        <p className="text-sm text-muted">No purchases with a price yet.</p>
      ) : (
        <ul className="space-y-1.5 text-sm font-mono">
          {entries.map(([c, v]) => (
            <li key={c} className="flex justify-between border-b border-dashed border-line pb-1">
              <span className="text-muted">{c}</span>
              <span>{fmtMoney(v, c)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 pt-3 border-t border-line flex items-baseline justify-between">
        <span className="label !mb-0">Final total ({primary})</span>
        <span className="h-display text-xl font-bold text-accent">{fmtMoney(total, primary)}</span>
      </div>
      <p className="text-[11px] text-muted mt-1">Converted using the exchange rates saved in Preferences.</p>
    </Card>
  )
}
