import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './NavSidebar.scss'

interface NavSidebarProps {
  expanded: boolean
  onExpandedChange: (v: boolean) => void
}

export default function NavSidebar({ expanded, onExpandedChange }: NavSidebarProps) {
  const location = useLocation()

  return (
    <nav className={['nav-sidebar', expanded ? 'expanded' : ''].filter(Boolean).join(' ')}>
      <button
        className="sidebar-btn"
        onClick={() => onExpandedChange(!expanded)}
        title={expanded ? 'Réduire' : 'Étendre'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          {!expanded
            ? <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            : <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          }
        </svg>
        <span className="label">Menu</span>
      </button>

      <div className="separator" />

      <Link
        to="/"
        className={['sidebar-btn', 'nav-link', location.pathname === '/' ? 'active' : ''].filter(Boolean).join(' ')}
        title={expanded ? '' : 'Tablature selon le Mode'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <span className="label">Modes</span>
      </Link>

      <Link
        to="/chords"
        className={['sidebar-btn', 'nav-link', location.pathname === '/chords' ? 'active' : ''].filter(Boolean).join(' ')}
        title={expanded ? '' : 'Description des Accords'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>
        </svg>
        <span className="label">Accords</span>
      </Link>

      <Link
        to="/progressions"
        className={['sidebar-btn', 'nav-link', location.pathname === '/progressions' ? 'active' : ''].filter(Boolean).join(' ')}
        title={expanded ? '' : 'Progressions'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M4 8h4v8H4zm5 2h4v4H9zm5-3h4v10h-4z"/>
        </svg>
        <span className="label">Progressions</span>
      </Link>

      <Link
        to="/tablature"
        className={['sidebar-btn', 'nav-link', location.pathname === '/tablature' ? 'active' : ''].filter(Boolean).join(' ')}
        title={expanded ? '' : 'Tablature'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
        </svg>
        <span className="label">Tablature</span>
      </Link>
    </nav>
  )
}
