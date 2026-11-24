import React, { createContext, useContext, useState } from 'react'

const Nav = createContext(null)
export const useNav = () => useContext(Nav)

export function NavProvider({ children }) {
  const [page, setPage] = useState('home')
  const [bookId, setBookId] = useState(null)
  const [titleId, setTitleId] = useState(null) // normalized title key of the Official Title page
  const [search, setSearch] = useState('')
  const [bookModal, setBookModal] = useState(null) // null | {book?: existing, defaults?: {}}
  const [syncOpen, setSyncOpen] = useState(false)
  const [timer, setTimer] = useState(null) // {bookId, startedAt}
  const [libraryTab, setLibraryTab] = useState('all')

  const go = (p) => {
    setPage(p)
    setBookId(null)
    setTitleId(null)
    window.scrollTo?.(0, 0)
  }
  const openBook = (id) => {
    setBookId(id)
    setPage('book')
  }
  const openTitle = (key) => {
    setTitleId(key)
    setBookId(null)
    setPage('title')
    window.scrollTo?.(0, 0)
  }
  const goLibrary = (tab = 'all') => {
    setLibraryTab(tab)
    go('library')
  }

  return (
    <Nav.Provider
      value={{ page, bookId, titleId, openTitle, search, setSearch, go, openBook, goLibrary, libraryTab, setLibraryTab, bookModal, setBookModal, syncOpen, setSyncOpen, timer, setTimer }}
    >
      {children}
    </Nav.Provider>
  )
}
