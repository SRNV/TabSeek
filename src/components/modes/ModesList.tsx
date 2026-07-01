import React, { useMemo, useState } from 'react'
import '../chords/ChordsList.scss'
import { EXTRA_MODES } from '../../data/extraModes'
import type { ModeGuitar } from '../../types/mode'

// Draggable counterpart to ModesSideBar's click-to-select list — drag a mode onto the
// tablature to drop a red Mode pod (TablatureR3F.tsx onDrop, payload.kind === 'mode').
// Reuses ChordsList.scss's classes (generic enough, avoids a duplicate stylesheet).
export default function ModesList() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const modesByCategory = useMemo(() => {
    const result: Record<string, ModeGuitar[]> = {}
    EXTRA_MODES.forEach(mode => {
      const category = mode.category || 'Autres traditions'
      if (!result[category]) result[category] = []
      result[category].push(mode)
    })
    return result
  }, [])

  function toggleCategory(category: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function onDragStart(e: React.DragEvent, mode: ModeGuitar) {
    const payload = { kind: 'mode', modeName: mode.name }
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="chords-list">
      {Object.entries(modesByCategory).map(([category, modes]) => (
        <div key={category} className={`chords-list__category ${!expandedCategories.has(category) ? 'collapsed' : ''}`}>
          <div className="chords-list__category-header" onClick={() => toggleCategory(category)}>
            <div className="chords-list__category-title">{category} ({modes.length})</div>
            <span className="material-symbols-outlined expand-icon">
              {expandedCategories.has(category) ? 'expand_less' : 'expand_more'}
            </span>
          </div>

          {expandedCategories.has(category) && (
            <div className="chords-list__category-content">
              {modes.map(mode => (
                <div
                  key={mode.name}
                  className="chords-list__item"
                  draggable
                  onDragStart={e => onDragStart(e, mode)}
                  title="Glisser sur la tablature pour imposer ce mode"
                >
                  <div className="chords-list__header">
                    <span className="material-symbols-outlined">tune</span>
                    <span className="chords-list__name">{mode.name}</span>
                    <span className="chords-list__intervals">{mode.intervals.join(' · ')}</span>
                  </div>
                  {mode.description && (
                    <p className="chords-list__description">
                      {mode.description.length <= 80 ? mode.description : mode.description.substring(0, 80) + '…'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
