import React, { useState, useEffect } from 'react'
import './TabMultiSelection.scss'
import { useTablatureStore } from '../../stores/useTablatureStore'

export default function TabMultiSelection() {
  const store = useTablatureStore()
  const [selectionStartModel, setSelectionStartModel] = useState(store.selectionStart)
  const [selectionEndModel, setSelectionEndModel] = useState(store.selectionEnd)
  const [selectedModeOverride, setSelectedModeOverride] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const selectionStart = useTablatureStore(s => s.selectionStart)
  const selectionEnd = useTablatureStore(s => s.selectionEnd)
  const hasSelection = useTablatureStore(s => s.hasSelection())
  const columns = useTablatureStore(s => s.columns)

  useEffect(() => { setSelectionStartModel(selectionStart) }, [selectionStart])
  useEffect(() => { setSelectionEndModel(selectionEnd) }, [selectionEnd])

  function updateSelectionStart(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    setSelectionStartModel(val)
    store.updateSelection(val, selectionEndModel)
  }

  function updateSelectionEnd(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    setSelectionEndModel(val)
    store.updateSelection(selectionStartModel, val)
  }

  function applyModeOverride() {
    store.applyModeOverride(selectedModeOverride)
    if (selectedModeOverride) {
      setTimeout(() => setSelectedModeOverride(''), 100)
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
    if (e.dataTransfer?.types.includes('text/plain')) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  function onDragLeave() { setIsDragOver(false) }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const data = e.dataTransfer?.getData('text/plain')
    if (!data) return
    try {
      const progression = JSON.parse(data)
      const dropZone = e.currentTarget as HTMLElement
      const rect = dropZone.getBoundingClientRect()
      const relativeX = e.clientX - rect.left
      const columnWidth = rect.width / columns
      const columnIndex = Math.floor(relativeX / columnWidth)
      store.dropProgressionAt(progression, columnIndex)
    } catch {}
  }

  const minSel = Math.min(selectionStartModel, selectionEndModel)
  const maxSel = Math.max(selectionStartModel, selectionEndModel)
  const selWidth = Math.abs(selectionEndModel - selectionStartModel)

  return (
    <div className="multi-selection-controls">
      <div className="range-slider">
        <input
          type="range"
          min={0}
          max={columns - 1}
          value={selectionStartModel}
          onChange={updateSelectionStart}
          className="range-input start-range"
        />
        <input
          type="range"
          min={0}
          max={columns - 1}
          value={selectionEndModel}
          onChange={updateSelectionEnd}
          className="range-input end-range"
        />
        <div
          className="selected-range"
          style={{
            left: (minSel / (columns - 1) * 100) + '%',
            width: (selWidth / (columns - 1) * 100) + '%',
          }}
        />
      </div>

      {hasSelection && (
        <div className="selection-actions">
          <div className="mode-override">
            <label>Mode Override:</label>
            <select value={selectedModeOverride} onChange={e => setSelectedModeOverride(e.target.value)} onBlur={applyModeOverride}>
              <option value="">Aucun override</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="dorian">Dorian</option>
              <option value="phrygian">Phrygian</option>
              <option value="lydian">Lydian</option>
              <option value="mixolydian">Mixolydian</option>
              <option value="locrian">Locrian</option>
            </select>
          </div>
          <div className="column-actions">
            <button onClick={() => store.insertColumnLeft()} className="action-btn" title="Insérer une colonne à gauche">
              <span>◀+</span>
            </button>
            <button onClick={() => store.insertColumnRight()} className="action-btn" title="Insérer une colonne à droite">
              <span>+▶</span>
            </button>
            <button onClick={() => store.clearSelection()} className="action-btn" title="Effacer la sélection">
              <span>×</span>
            </button>
          </div>
        </div>
      )}

      <div
        className={['drop-zone', isDragOver ? 'drag-over' : ''].filter(Boolean).join(' ')}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="drop-zone-text">
          Déposez ici une progression d'accords ou de notes
        </div>
      </div>
    </div>
  )
}
