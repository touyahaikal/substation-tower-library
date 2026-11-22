import React, { useState } from 'react'
import { Users } from 'lucide-react'
import { PageTitle, Cover, Empty } from '../components/ui.jsx'
import CharacterBoard from '../components/CharacterBoard.jsx'
import { useStore } from '../lib/store.jsx'

export default function Characters() {
  const { books } = useStore()
  const [id, setId] = useState('')
  const withChars = books.filter((b) => (b.characters || []).length)
  const current = books.find((b) => b.id === (id || (withChars[0] || books[0] || {}).id))
  return (
    <>
      <PageTitle sub="A relationship map for every story">Characters</PageTitle>
      {!current ? <Empty icon={Users}>Add a book first.</Empty> : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Cover book={current} size="xs" />
            <select className="input !w-auto min-w-[14rem]" value={current.id} onChange={(e) => setId(e.target.value)}>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title}{(b.characters || []).length ? ` (${b.characters.length})` : ''}</option>)}
            </select>
          </div>
          <CharacterBoard key={current.id} book={current} />
        </>
      )}
    </>
  )
}
