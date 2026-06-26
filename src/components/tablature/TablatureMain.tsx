import React from 'react'
import './TablatureMain.scss'
import { useTablatureStore } from '../../stores/useTablatureStore'
import TablatureR3F from './TablatureR3F'

export default function TablatureMain() {
  const tuningDisplay = useTablatureStore(s => s.tuningDisplay())

  return (
    <div className="partition-tab-container">
      <div className="tab-header">
        <h3 className="tab-title">Tablature</h3>
        <div className="tuning-info">Accordage: {tuningDisplay}</div>
      </div>

      <div className="tab-r3f-content">
        <TablatureR3F />
      </div>
    </div>
  )
}
