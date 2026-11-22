import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import { NavProvider, useNav } from './lib/nav.jsx'
import { useStore } from './lib/store.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import SyncModal from './components/SyncModal.jsx'
import AddBookModal from './components/AddBookModal.jsx'
import TimerDock from './components/TimerDock.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Shelves from './pages/Shelves.jsx'
import WishList from './pages/WishList.jsx'
import Series from './pages/Series.jsx'
import Collections from './pages/Collections.jsx'
import Journal from './pages/Journal.jsx'
import Characters from './pages/Characters.jsx'
import Calendar from './pages/Calendar.jsx'
import Challenges from './pages/Challenges.jsx'
import Tasks from './pages/Tasks.jsx'
import Recap from './pages/Recap.jsx'
import Preferences from './pages/Preferences.jsx'
import BookDetail from './pages/BookDetail.jsx'

const PAGES = {
  home: Home, library: Library, shelves: Shelves, wishlist: WishList, series: Series, collections: Collections,
  journal: Journal, characters: Characters, calendar: Calendar, challenges: Challenges, tasks: Tasks, recap: Recap,
  preferences: Preferences, book: BookDetail,
}

function Shell() {
  const { page, bookModal, setBookModal, syncOpen, setSyncOpen, timer, openBook } = useNav()
  const { toast, readOnly, admin, switchToLocalCopy } = useStore()
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 900)
  const Page = PAGES[page] || Home
  return (
    <div className="h-full flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        {readOnly && !admin && (
          <div className="bg-accent/15 text-accent text-xs px-4 py-1.5 text-center">
            Read-only view of a public library. Use <b>Admin Sync</b> to log in and edit, or{' '}
            <button className="underline" onClick={switchToLocalCopy}>play with a blank demo copy</button>.
          </div>
        )}
        {!readOnly && !admin && (
          <div className="bg-accent/15 text-accent text-xs px-4 py-1.5 text-center">
            Guest mode: changes live only in this tab and vanish on refresh. Use <b>Admin Sync</b> to save your library to GitHub.
          </div>
        )}
        <main className={`flex-1 overflow-y-auto px-3 sm:px-6 py-5 ${timer ? 'pb-28' : ''}`}>
          <div className="max-w-6xl mx-auto">
            <Page />
          </div>
        </main>
      </div>
      {bookModal && (
        <AddBookModal
          initial={bookModal.book}
          defaults={bookModal.defaults}
          onClose={(saved) => {
            setBookModal(null)
            if (saved && !bookModal.book && bookModal.openAfter) openBook(saved.id)
          }}
        />
      )}
      {syncOpen && <SyncModal onClose={() => setSyncOpen(false)} />}
      <TimerDock />
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] panel px-4 py-2 text-sm shadow-lg">{toast}</div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <NavProvider>
      <Shell />
    </NavProvider>
  )
}
