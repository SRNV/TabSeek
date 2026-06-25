import React, { useEffect } from 'react'
import './TablatureMain.scss'
import { useTablatureStore } from '../../stores/useTablatureStore'
import TabContent from './TabContent'
import TabMultiSelection from './TabMultiSelection'
import TabNavigation from './TabNavigation'
import TabPlayback from './TabPlayback'

export default function TablatureMain() {
  const currentMeasure = useTablatureStore(s => s.currentMeasure)
  const tuningDisplay = useTablatureStore(s => s.tuningDisplay())
  const initializeMeasures = useTablatureStore(s => s.initializeMeasures)
  const stopPlayback = useTablatureStore(s => s.stopPlayback)

  useEffect(() => {
    initializeMeasures()
    return () => { stopPlayback() }
  }, [])

  return (
    <div className="partition-tab-container">
      <div className="tab-header">
        <h3 className="tab-title">Tablature - Mesure {currentMeasure + 1}</h3>
        <div className="tuning-info">Accordage: {tuningDisplay}</div>
      </div>

      <div className="tab-content">
        <TabContent />
        <TabMultiSelection />
      </div>

      <div className="tab-controls">
        <TabNavigation />
        <TabPlayback />
      </div>
    </div>
  )
}
