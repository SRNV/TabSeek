import './NavSidebar.scss'
import { useUIStore } from '../composables/useUIState'

interface NavSidebarProps {
  expanded: boolean
  onExpandedChange: (v: boolean) => void
}

export default function NavSidebar({ expanded, onExpandedChange }: NavSidebarProps) {
  const activePanel = useUIStore(s => s.activePanel)
  const togglePanel = useUIStore(s => s.togglePanel)

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

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'notes' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('notes')}
        title={expanded ? '' : 'Notes / Fondamentale'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16-8v6.18C18.69 15.07 18.36 15 18 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V7h3V5h-4z"/>
        </svg>
        <span className="label">Notes</span>
      </button>

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'modes' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('modes')}
        title={expanded ? '' : 'Modes'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M4 8h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0-12h10v2H4z"/>
        </svg>
        <span className="label">Modes</span>
      </button>

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'chords' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('chords')}
        title={expanded ? '' : 'Accords'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c1.1 0 2-.9 2-2V5h14c0-1.1-.9-2-2-2zm-2 4H7v10h2V9h3v8h2V9h3v8h2V7z"/>
        </svg>
        <span className="label">Accords</span>
      </button>
    </nav>
  )
}
