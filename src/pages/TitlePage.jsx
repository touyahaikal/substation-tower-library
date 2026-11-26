import React, { useMemo, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Layers, Star } from 'lucide-react'
import { Cover, Tabs, ProgressBar, RatingBadge, Empty } from '../components/ui.jsx'
import { DeleteButton } from '../components/Confirm.jsx'
import { EditionBlock, useVolumeGenerator } from '../components/SeriesCard.jsx'
import { CornerBadge } from '../components/StatusUI.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { buildGroups, volNum } from '../lib/groups.js'
import { statusLabel, statusColor, displayTitle } from '../lib/utils.js'

const categoryOf = (ed, isMain) => (isMain ? 'volumes' : /databook/i.test(ed.edition) ? 'databooks' : /light\s*novel/i.test(ed.edition) ? 'lightnovels' : 'other')
const CATS = [['volumes', 'Volumes'], ['databooks', 'Databooks'], ['lightnovels', 'Light Novels'], ['other', 'Other Formats']]

// Level 1: the Official Title master page (every volume, databook and light novel of one title)
export default function TitlePage() {
  const { books, actions, flash } = useStore()
  const { titleId, openBook, goLibrary } = useNav()
  const [tab, setTab] = useState('volumes')
  const [startAdd, genEl] = useVolumeGenerator()
  const group = useMemo(() => buildGroups(books).find((g) => g.key === titleId), [books, titleId])
  if (!group) return <Empty>Title not found. <button className="underline" onClick={() => goLibrary('all')}>Back to library</button></Empty>

  const ids = group.entries.map((b) => b.id)
  const [main, ...rest] = group.editions
  const byCat = { volumes: [main], databooks: [], lightnovels: [], other: [] }
  rest.forEach((ed) => byCat[categoryOf(ed, false)].push(ed))
  const tabs = CATS.filter(([id]) => id === 'volumes' || byCat[id].length).map(([id, label]) => [id, `${label} (${byCat[id].reduce((s, e) => s + e.entries.length, 0)})`])
  const active = byCat[tab]?.length ? tab : 'volumes'
  const color = statusColor(group.status)
  const total = group.entries.length

  return (
    <>
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-3 flex-wrap" aria-label="Breadcrumb">
        <button className="btn btn-ghost !py-1" onClick={() => goLibrary('all')}><ArrowLeft size={14} /> Library</button>
        <span>›</span>
        <span className="text-ink font-semibold">{group.title}</span>
      </nav>

      <section className="panel overflow-hidden" style={{ borderTop: `3px solid ${color}` }} data-page="title">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-[170px_1fr] md:grid-cols-[240px_1fr] gap-4 md:gap-6">
          <div className="relative h-fit w-[170px] sm:w-full mx-auto sm:mx-0">
            <Cover book={group.cover} size="xl" className="!w-full" />
            <CornerBadge status={group.status} progress={group.progress} size={34} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="label !mb-0">Official title</div>
                <h1 className="h-display text-2xl sm:text-3xl font-bold uppercase tracking-wide">{group.title}</h1>
                <div className="text-muted">{group.author}</div>
                <div className="mt-1"><RatingBadge value={group.rating} /></div>
              </div>
              <div className="flex gap-1.5 items-center">
                <button className="btn !py-1 text-xs" onClick={() => { if (actions.setHidden(ids, !group.hidden)) flash(group.hidden ? `Unhid '${group.title}'` : `Hid '${group.title}'`, 'success') }}>
                  {group.hidden ? <Eye size={13} /> : <EyeOff size={13} />} {group.hidden ? 'Unhide series' : 'Hide series'}
                </button>
                <DeleteButton prompt="Confirm Delete Series?" className="btn !py-1 text-xs" onConfirm={() => { if (actions.deleteBooks(ids)) { flash(`Deleted '${group.title}' (${total} entr${total === 1 ? 'y' : 'ies'})`, 'success'); goLibrary('all') } }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="chip font-semibold" style={{ color, borderColor: color }}>{statusLabel(group.status)}</span>
              <span className="chip"><Layers size={11} className="mr-1" />{total} {total === 1 ? 'entry' : 'entries'}</span>
              {group.editions.map((e) => <span key={e.edition} className="chip">{e.edition} · {e.entries.length}</span>)}
              {group.hidden && <span className="chip">Hidden</span>}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted font-mono mb-1">
                <span>{group.finished}/{total} finished · {Math.round(group.progress * 100)}% overall</span>
                <span>{group.pages ? `${group.pagesRead.toLocaleString()}/${group.pages.toLocaleString()} pages` : ''}</span>
              </div>
              <ProgressBar value={group.progress} />
            </div>

            <div className="flex items-end gap-3 flex-wrap mt-4">
              <label className="block">
                <span className="label"><Star size={11} className="inline mr-1" />Series cover</span>
                <select className="input !w-auto !py-1 text-sm" value={group.cover.id} onChange={(e) => { if (actions.setSeriesCover(e.target.value)) flash('Series cover updated', 'success') }} aria-label="Series cover">
                  {group.entries.map((b) => <option key={b.id} value={b.id}>{displayTitle(b)}{b.edition ? ` (${b.edition})` : ''}</option>)}
                </select>
              </label>
              <button className="btn btn-primary" onClick={() => startAdd(main.entries)}><Layers size={14} /> Add volumes</button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4">
        <Tabs value={active} onChange={setTab} tabs={tabs} />
        <div className="pt-3 space-y-4">
          {byCat[active].map((ed, i) => (
            <div key={ed.edition} className={i ? 'border-t border-dashed border-line pt-4' : ''}>
              <EditionBlock ed={ed} primary={active === 'volumes'} startAdd={startAdd} openDrawer={openBook} bulkDefault={ed.entries.length > 1} />
            </div>
          ))}
          <div className="flex gap-3 text-[11px] text-muted flex-wrap items-center">
            {['wishlist', 'bought', 'reading', 'paused', 'finished'].map((s) => <span key={s} className={`vtile vtile-${s} !h-5 !min-w-0 !px-2 !text-[10px] cursor-default`}>{statusLabel(s)}</span>)}
            <span>Tap a volume to open its page.</span>
          </div>
        </div>
      </div>
      {genEl}
    </>
  )
}
