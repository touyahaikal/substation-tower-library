import React from 'react'
import {
  Home, Library, LayoutGrid, Heart, Layers, FolderHeart, NotebookPen, Users, CalendarDays,
  Trophy, ListChecks, Sparkles, Compass, Settings, ChevronsLeft, ChevronsRight, BookOpen,
} from 'lucide-react'
import { useNav } from '../lib/nav.jsx'

const SECTIONS = [
  ['Main', [['home', 'Home', Home], ['library', 'Library', Library]]],
  ['Organize', [['shelves', 'Shelves', LayoutGrid], ['wishlist', 'Wish List', Heart], ['readnext', 'Read next', Compass], ['series', 'Series', Layers], ['collections', 'Collections', FolderHeart]]],
  ['Write', [['journal', 'Journal', NotebookPen], ['characters', 'Characters', Users], ['calendar', 'Calendar', CalendarDays]]],
  ['Progress', [['challenges', 'Challenges', Trophy], ['tasks', 'Tasks', ListChecks], ['recap', 'Recap', Sparkles]]],
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { page, go, goLibrary } = useNav()
  const Item = ([id, label, Icon]) => {
    const active = page === id || (id === 'library' && (page === 'book' || page === 'title'))
    return (
      <button
        key={id}
        onClick={() => (id === 'library' ? goLibrary('all') : go(id))}
        title={label}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition rounded-[var(--radius)] ${
          active ? 'bg-accent/15 text-accent font-semibold' : 'text-ink/80 hover:bg-line/50'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span>{label}</span>}
      </button>
    )
  }
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} shrink-0 border-r border-line bg-card h-full flex flex-col transition-all`}>
      <div className={`flex items-center ${collapsed ? 'flex-col gap-2 py-3' : 'justify-between px-4 py-4'}`}>
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-accent" />
          {!collapsed && <span className="h-display font-bold leading-tight">Reading<br />Journal</span>}
        </div>
        <button className="btn btn-ghost !p-1" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-4">
        {SECTIONS.map(([name, items]) => (
          <div key={name}>
            {!collapsed && <div className="label px-3 !mb-1">{name}</div>}
            <div className="space-y-0.5">{items.map(Item)}</div>
          </div>
        ))}
      </nav>
      <div className="p-2 border-t border-line">{Item(['preferences', 'Preferences', Settings])}</div>
    </aside>
  )
}
