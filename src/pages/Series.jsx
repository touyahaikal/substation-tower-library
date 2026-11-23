import React from 'react'
import { Layers } from 'lucide-react'
import { PageTitle, Cover, Card, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import SeriesCard from '../components/SeriesCard.jsx'
import { buildGroups } from '../lib/groups.js'

export default function Series() {
  const { books } = useStore()
  const { openBook } = useNav()
  const volumeGroups = buildGroups(books.filter((b) => !b.hidden)).filter((g) => g.isCollection).sort((a, b) => a.title.localeCompare(b.title))
  const groups = {}
  books.filter((b) => b.series).forEach((b) => (groups[b.series] = [...(groups[b.series] || []), b]))
  const names = Object.keys(groups).sort()
  return (
    <>
      <PageTitle sub="Track how far you are through each series">Series</PageTitle>
      {volumeGroups.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="label">Volumes &amp; editions</div>
          {volumeGroups.map((g) => <SeriesCard key={g.key} group={g} defaultOpen />)}
        </div>
      )}
      {volumeGroups.length === 0 && names.length === 0 && <Empty icon={Layers}>No series yet. Use “Add volumes” on any entry in the Library to turn it into a series.</Empty>}
      {names.length > 0 && <div className="label mb-2">Reading-order series</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {names.map((n) => {
          const list = groups[n].sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0))
          const total = Math.max(...list.map((b) => b.seriesTotal || 0), ...list.map((b) => b.seriesNumber || 0), list.length)
          const slot = (i) => list.find((b) => (b.seriesNumber || 0) === i + 1)
          const done = list.filter((b) => b.status === 'finished').length
          return (
            <Card key={n} title={n} action={<span className="text-xs text-muted font-mono">{done}/{total} read</span>}>
              <div className="flex gap-2 flex-wrap mb-3">
                {Array.from({ length: total }).map((_, i) => {
                  const b = slot(i)
                  const state = !b ? 'missing' : b.status === 'finished' ? 'finished' : b.status === 'reading' ? 'reading' : 'owned'
                  return (
                    <button key={i} title={b ? `#${i + 1} ${b.title} (${b.status})` : `#${i + 1} not in library`} onClick={() => b && openBook(b.id)}
                      className={`w-6 h-6 rounded-full border-2 text-[10px] font-mono flex items-center justify-center transition ${
                        state === 'finished' ? 'bg-accent border-accent text-white' : state === 'reading' ? 'border-accent text-accent bg-accent/20' : state === 'owned' ? 'border-accent text-accent' : 'border-line text-muted border-dashed'
                      }`}>{i + 1}</button>
                  )
                })}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {list.map((b) => <Cover key={b.id} book={b} size="sm" onClick={() => openBook(b.id)} />)}
              </div>
              <p className="text-[11px] text-muted mt-2">Filled = finished · tinted = reading · outlined = owned or wishlisted · dashed = not in library</p>
            </Card>
          )
        })}
      </div>
    </>
  )
}
