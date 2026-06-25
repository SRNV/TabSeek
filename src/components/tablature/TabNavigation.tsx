import React from 'react'
import './TabNavigation.scss'
import { useTablatureStore } from '../../stores/useTablatureStore'

export default function TabNavigation() {
  const currentMeasure = useTablatureStore(s => s.currentMeasure)
  const measures = useTablatureStore(s => s.measures)
  const previousMeasure = useTablatureStore(s => s.previousMeasure)
  const nextMeasure = useTablatureStore(s => s.nextMeasure)
  const addMeasure = useTablatureStore(s => s.addMeasure)
  const deleteMeasure = useTablatureStore(s => s.deleteMeasure)

  return (
    <div className="measure-navigation">
      <button
        className="nav-btn"
        onClick={previousMeasure}
        disabled={currentMeasure === 0}
        title="Mesure précédente"
      >
        <span className="nav-icon">◀</span>
      </button>

      <div className="measure-indicator">
        Mesure {currentMeasure + 1}/{measures.length}
      </div>

      <button className="nav-btn" onClick={nextMeasure} title="Mesure suivante">
        <span className="nav-icon">▶</span>
      </button>

      <button className="add-measure-btn" onClick={addMeasure} title="Ajouter une mesure">
        <span className="nav-icon">+</span>
      </button>

      <button
        className="delete-measure-btn"
        onClick={deleteMeasure}
        disabled={measures.length <= 1}
        title="Supprimer la mesure actuelle"
      >
        <span className="delete-icon">-</span>
      </button>
    </div>
  )
}
