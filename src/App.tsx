import { useState, useEffect } from 'react'
import './App.scss'
import MainGrid from './components/MainGrid'
import NavSidebar from './components/NavSidebar'
import NotesSideBar from './components/sidebars/NotesSideBar'
import ModesSideBar from './components/sidebars/ModesSideBar'
import ChordsDetailsSideBar from './components/sidebars/ChordsDetailsSideBar'
import GuitarSoundSideBar from './components/sidebars/GuitarSoundSideBar'
import { useUIStore } from './composables/useUIState'

export default function App() {
  const [navExpanded, setNavExpanded] = useState(false)
  const activePanel = useUIStore(s => s.activePanel)
  const closePanel  = useUIStore(s => s.closePanel)

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeydown, true)
    return () => document.removeEventListener('keydown', onKeydown, true)
  }, [closePanel])

  const popoverLeft = navExpanded ? '188px' : '52px'

  return (
    <>
      <div className="app">
        <div className="nav-area">
          <NavSidebar expanded={navExpanded} onExpandedChange={setNavExpanded} />
        </div>
        <div className="main">
          <MainGrid />
        </div>
      </div>

      {activePanel && (
        <div className="popover-backdrop" style={{ left: popoverLeft }} onClick={closePanel} />
      )}

      {activePanel && (
        <div className="config-popover" style={{ left: popoverLeft }}>
          {activePanel === 'notes'  && <NotesSideBar />}
          {activePanel === 'modes'  && <ModesSideBar />}
          {activePanel === 'chords' && <ChordsDetailsSideBar />}
          {activePanel === 'guitar' && <GuitarSoundSideBar />}
        </div>
      )}
    </>
  )
}
