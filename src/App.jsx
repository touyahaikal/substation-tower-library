import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { ConfirmHost } from './components/Confirm.jsx'
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
import TitlePage from './pages/TitlePage.jsx'

const PAGES = {
  home: Home, library: Library, shelves: Shelves, wishlist: WishList, series: Series, collections: Collections,
  journal: Journal, characters: Characters, calendar: Calendar, challenges: Challenges, tasks: Tasks, recap: Recap,
  preferences: Preferences, book: BookDetail, title: TitlePage,
}

function Shell() {
  const { page, bookModal, setBookModal, syncOpen, setSyncOpen, timer, openBook } = useNav()
  const { toast, readOnly, admin, switchToLocalCopy, confirmReq, actions, flash } = useStore()
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 900)
  const Page = PAGES[page] || Home

  // "N" opens the New entry modal (ignored while typing in a field or while a dialog is already open)
  useEffect(() => {
    const h = (e) => {
      if ((e.key !== 'n' && e.key !== 'N') || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const t = e.target
      const tag = ((t && t.tagName) || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return
      if (bookModal || syncOpen || confirmReq) return
      e.preventDefault()
      setBookModal({})
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [bookModal, syncOpen, confirmReq, setBookModal])

  // "/" jumps to search; Ctrl/Cmd+Z undoes the last change (not while typing in a field, so the field's own undo still works)
  useEffect(() => {
    const typing = (t) => { const tag = ((t && t.tagName) || '').toLowerCase(); return tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable) }
    const h = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target)) {
        if (bookModal || syncOpen || confirmReq) return
        const el = document.getElementById('global-search')
        if (el) { e.preventDefault(); el.focus(); el.select() }
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey && !typing(e.target)) {
        e.preventDefault()
        if (actions.undo()) flash('Undone', 'success')
        else flash('Nothing to undo', 'info')
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [bookModal, syncOpen, confirmReq, actions, flash])
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
        <main className={`flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 pt-4 ${timer ? 'pb-40' : 'pb-24'}`}>
          <div className="w-full max-w-[1600px] mx-auto">
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
      {!bookModal && (
        <button
          className={`btn btn-primary fixed right-3 sm:right-6 ${timer ? 'bottom-24' : 'bottom-3 sm:bottom-6'} z-40 !rounded-full !p-3 sm:!px-4 shadow-lg`}
          onClick={() => setBookModal({})}
          title="New entry (press N)"
          aria-label="New entry"
        >
          <Plus size={18} /> <span className="font-semibold hidden sm:inline">New entry</span>
        </button>
      )}
      <ConfirmHost />
      {toast && (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] panel px-4 py-2.5 text-sm shadow-xl max-w-[92vw] flex items-center gap-2 ${toast.kind === 'error' ? '!border-red-500 text-red-500' : toast.kind === 'success' ? '!border-accent2' : ''}`}
        >
          {toast.kind === 'error' ? <AlertTriangle size={16} className="shrink-0" /> : toast.kind === 'success' ? <CheckCircle2 size={16} className="shrink-0 text-accent2" /> : <Info size={16} className="shrink-0" />}
          <span>{toast.msg}</span>
        </div>
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
