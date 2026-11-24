import React, { useMemo, useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { PageTitle, Empty } from '../components/ui.jsx'
import CharacterBoard from '../components/CharacterBoard.jsx'
import CharacterModal from '../components/CharacterModal.jsx'
import { useStore } from '../lib/store.jsx'
import { buildGroups, volNum } from '../lib/groups.js'
import { avatarOf, displayTitle } from '../lib/utils.js'

// "Vol. 1" for the main edition, "Databook 1" / "Light Novel 2" for the others
export const entryBadge = (b, mainEdition) => {
  const n = volNum(b)
  const main = !mainEdition || (b.edition || 'Paperback') === mainEdition
  if (n == null) return b.edition || 'Book'
  return main ? `Vol. ${n}` : `${b.edition} ${n}`
}

export default function Characters() {
  const { books } = useStore()
  const [titleKey, setTitleKey] = useState('') // '' = All Titles
  const [volId, setVolId] = useState('') // '' = All Volumes
  const [form, setForm] = useState(null)

  const groups = useMemo(() => buildGroups(books).sort((a, b) => a.title.localeCompare(b.title)), [books])
  const group = groups.find((g) => g.key === titleKey)
  const scope = group ? group.entries : books
  const volumes = group ? group.editions.flatMap((e) => e.entries) : []
  const vol = volumes.find((b) => b.id === volId)
  const inScope = vol ? [vol] : scope
  const mainEd = group ? group.editions[0].edition : null
  const rows = inScope.flatMap((b) => (b.characters || []).map((c) => ({ c, b })))
  const board = vol || (group && group.entries.length === 1 ? group.entries[0] : null)
  const choices = (group ? volumes : books).map((b) => ({ id: b.id, label: group ? entryBadge(b, mainEd) + (b.volumeLabel ? ` — ${b.volumeLabel}` : '') : displayTitle(b) }))
  const defaultBook = (vol || (group && volumes[0]) || books[0] || {}).id

  return (
    <>
      <PageTitle sub="A cast list and relationship map for every story" action={books.length > 0 && <button className="btn btn-primary" onClick={() => setForm({})}><Plus size={14} /> Add character</button>}>Characters</PageTitle>
      {books.length === 0 ? <Empty icon={Users}>Add a book first.</Empty> : (
        <>
          <div className="flex items-end gap-3 flex-wrap mb-4">
            <label className="block">
              <span className="label">Official title</span>
              <select className="input !w-auto min-w-[14rem]" value={titleKey} onChange={(e) => { setTitleKey(e.target.value); setVolId('') }} aria-label="Official title">
                <option value="">All Titles</option>
                {groups.map((g) => { const n = g.entries.reduce((s, b) => s + (b.characters || []).length, 0); return <option key={g.key} value={g.key}>{g.title}{n ? ` (${n})` : ''}</option> })}
              </select>
            </label>
            <label className="block">
              <span className="label">Volume / edition</span>
              <select className="input !w-auto min-w-[11rem]" value={volId} disabled={!group} onChange={(e) => setVolId(e.target.value)} aria-label="Volume or edition">
                <option value="">All Volumes</option>
                {volumes.map((b) => <option key={b.id} value={b.id}>{entryBadge(b, mainEd)}{b.volumeLabel ? ` — ${b.volumeLabel}` : ''}{group.editions.length > 1 && (b.edition || '') === mainEd ? '' : ''}</option>)}
              </select>
            </label>
            <span className="text-xs text-muted font-mono pb-2">{rows.length} character{rows.length === 1 ? '' : 's'}</span>
          </div>

          {rows.length === 0 ? <Empty icon={Users}>No characters here yet. Use “Add character”.</Empty> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-char-list>
              {rows.map(({ c, b }) => (
                <button key={c.id} className="panel p-3 text-left hover:!border-accent transition" onClick={() => setForm({ character: c, bookId: b.id })} data-char={c.name}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none">{avatarOf(c.avatar)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold truncate">{c.name}</span>
                        <span className="chip font-mono !text-[10px]" data-volume-badge>{entryBadge(b, buildGroups(books.filter((x) => x.title.trim().toLowerCase() === b.title.trim().toLowerCase()))[0]?.editions[0].edition)}</span>
                      </div>
                      {!group && <div className="text-[11px] text-muted truncate">{b.title}</div>}
                      <div className="text-xs text-accent">{c.role}</div>
                      {(c.desc || c.note) && <p className="text-xs text-muted mt-1 line-clamp-2">{c.desc || c.note}</p>}
                      {c.quote && <p className="text-xs italic mt-1 line-clamp-2">“{c.quote}”</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <div className="label">Relationship map</div>
            {board ? <CharacterBoard key={board.id} book={board} /> : <p className="text-sm text-muted">Pick a single volume (or a title with one entry) to open its relationship map.</p>}
          </div>
        </>
      )}
      {form && <CharacterModal choices={choices} bookId={form.bookId || (form.character ? undefined : defaultBook)} character={form.character} onClose={() => setForm(null)} />}
    </>
  )
}
