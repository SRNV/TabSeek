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
        <span className="material-symbols-outlined icon">
          {expanded ? 'navigate_before' : 'navigate_next'}
        </span>
        <span className="label">Menu</span>
      </button>

      <div className="separator" />

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'notes' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('notes')}
        title={expanded ? '' : 'Notes / Fondamentale'}
      >
        <span className="material-symbols-outlined icon">queue_music</span>
        <span className="label">Notes</span>
      </button>

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'modes' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('modes')}
        title={expanded ? '' : 'Modes'}
      >
        <span className="material-symbols-outlined icon">subject</span>
        <span className="label">Modes</span>
      </button>

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'chords' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('chords')}
        title={expanded ? '' : 'Accords'}
      >
        <span className="material-symbols-outlined icon">grid_view</span>
        <span className="label">Accords</span>
      </button>

      <button
        className={['sidebar-btn', 'config-link', activePanel === 'guitar' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('guitar')}
        title={expanded ? '' : 'Son de guitare'}
      >
        <span className="material-symbols-outlined icon">music_note</span>
        <span className="label">Son</span>
      </button>
    </nav>
  )
}
