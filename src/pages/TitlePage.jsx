import React, { useMemo, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Layers, Star } from 'lucide-react'
import { Cover, ProgressBar, RatingBadge, Empty } from '../components/ui.jsx'
import { DeleteButton } from '../components/Confirm.jsx'
import { EditionBlock, useVolumeGenerator } from '../components/SeriesCard.jsx'
import { CornerBadge } from '../components/StatusUI.jsx'
import { useStore } from '../lib/store.jsx'
import { useNav } from '../lib/nav.jsx'
import { buildGroups, volNum } from '../lib/groups.js'
import { statusLabel, statusColor, displayTitle } from '../lib/utils.js'

const categoryOf = (ed) => (/light\s*novel|^novel$/i.test(ed.edition) ? 'lightnovels' : /databook|fanbook/i.test(ed.edition) ? 'databooks' : /guidebook/i.test(ed.edition) ? 'guidebooks' : /artbook/i.test(ed.edition) ? 'artbooks' : 'other')
const CATS = [['lightnovels', 'Light Novels'], ['databooks', 'Databooks / Fanbooks'], ['guidebooks', 'Guidebooks'], ['artbooks', 'Artbooks'], ['other', 'Other formats']]

// Level 1: the Official Title master page (every volume, databook and light novel of one title)
export default function TitlePage() {
  const { books, actions, flash } = useStore()
  const { titleId, openBook, goLibrary } = useNav()
  const [startAdd, genEl] = useVolumeGenerator()
  const group = useMemo(() => buildGroups(books).find((g) => g.key === titleId), [books, titleId])
  if (!group) return <Empty>Title not found. <button className="underline" onClick={() => goLibrary('all')}>Back to library</button></Empty>

  const ids = group.entries.map((b) => b.id)
  const [main, ...rest] = group.editions
  const byCat = { lightnovels: [], databooks: [], guidebooks: [], artbooks: [], other: [] }
  rest.forEach((ed) => byCat[categoryOf(ed)].push(ed))
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

      <div className="mt-4" data-sections>
        <section data-cat="primary">
          <EditionBlock ed={main} primary startAdd={startAdd} openDrawer={openBook} />
        </section>
        {CATS.filter(([id]) => byCat[id].length).map(([id, label]) => (
          <section key={id} data-cat={id} className="border-t border-dashed border-line mt-5 pt-4">
            <h2 className="h-display text-base font-semibold mb-2">{label} <span className="text-xs text-muted font-mono">{byCat[id].reduce((n, e) => n + e.entries.length, 0)}</span></h2>
            <div className="space-y-4">
              {byCat[id].map((ed) => <EditionBlock key={ed.edition} ed={ed} startAdd={startAdd} openDrawer={openBook} />)}
            </div>
          </section>
        ))}
        <div className="flex gap-3 text-[11px] text-muted flex-wrap items-center mt-5">
          {['wishlist', 'bought', 'reading', 'paused', 'finished'].map((s) => <span key={s} className={`vtile vtile-${s} !h-5 !min-w-0 !px-2 !text-[10px] cursor-default`}>{statusLabel(s)}</span>)}
          <span>Tap a tile to open its page.</span>
        </div>
      </div>
      {genEl}
    </>
  )
}
