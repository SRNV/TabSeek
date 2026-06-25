import React from 'react'
import './ConfigSidebar.scss'
import { useUIStore } from '../composables/useUIState'

export default function ConfigSidebar() {
  const activePanel = useUIStore(s => s.activePanel)
  const togglePanel = useUIStore(s => s.togglePanel)

  return (
    <aside className="config-sidebar">
      <button
        className={['config-btn', activePanel === 'notes' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('notes')}
        title="Notes / Fondamentale"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16-8v6.18C18.69 15.07 18.36 15 18 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V7h3V5h-4z"/>
        </svg>
      </button>

      <button
        className={['config-btn', activePanel === 'modes' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('modes')}
        title="Modes"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M4 8h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0-12h10v2H4z"/>
        </svg>
      </button>

      <button
        className={['config-btn', activePanel === 'chords' ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => togglePanel('chords')}
        title="Accords"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c1.1 0 2-.9 2-2V5h14c0-1.1-.9-2-2-2zm-2 4H7v10h2V9h3v8h2V9h3v8h2V7z"/>
        </svg>
      </button>
    </aside>
  )
}
