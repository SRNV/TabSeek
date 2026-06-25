import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './App.scss'
import { AppRoutes } from './router'
import NavSidebar from './components/NavSidebar'
import ConfigSidebar from './components/ConfigSidebar'
import NotesSideBar from './components/sidebars/NotesSideBar'
import ModesSideBar from './components/sidebars/ModesSideBar'
import ChordsDetailsSideBar from './components/sidebars/ChordsDetailsSideBar'
import TabSVGOverlay from './components/tab/TabSVGOverlay'
import { useUIStore } from './composables/useUIState'

export default function App() {
  const [navExpanded, setNavExpanded] = useState(false)
  const location = useLocation()
  const activePanel = useUIStore(s => s.activePanel)
  const closePanel = useUIStore(s => s.closePanel)
  const closePanelIfUnavailable = useUIStore(s => s.closePanelIfUnavailable)

  useEffect(() => {
    closePanelIfUnavailable(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeydown, true)
    return () => document.removeEventListener('keydown', onKeydown, true)
  }, [closePanel])

  const popoverLeft = navExpanded ? '240px' : '104px'

  return (
    <>
      <TabSVGOverlay />
      <div className="app">
        <div className="nav-area">
          <NavSidebar expanded={navExpanded} onExpandedChange={setNavExpanded} />
        </div>
        <div className="config-area">
          <ConfigSidebar />
        </div>
        <div className="main">
          <AppRoutes />
        </div>
      </div>

      {activePanel && (
        <div
          className="popover-backdrop"
          style={{ left: popoverLeft }}
          onClick={closePanel}
        />
      )}

      {activePanel && (
        <div
          className="config-popover"
          style={{ left: popoverLeft }}
        >
          {activePanel === 'notes' && <NotesSideBar />}
          {activePanel === 'modes' && <ModesSideBar />}
          {activePanel === 'chords' && <ChordsDetailsSideBar />}
        </div>
      )}
    </>
  )
}
