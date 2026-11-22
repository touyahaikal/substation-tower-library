import React from 'react'
import { Layers } from 'lucide-react'
import { PageTitle, Cover, Card, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'

export default function Series() {
  const { books } = useStore()
  const { openBook } = useNav()
  const groups = {}
  books.filter((b) => b.series).forEach((b) => (groups[b.series] = [...(groups[b.series] || []), b]))
  const names = Object.keys(groups).sort()
  return (
    <>
      <PageTitle sub="Track how far you are through each series">Series</PageTitle>
      {names.length === 0 && <Empty icon={Layers}>No series yet. Add a series name when editing a book.</Empty>}
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
