import React, { useMemo } from 'react'
import './ChordsDetailsSideBar.scss'
import { useMainStore } from '../../stores/useMainStore'
import { CHORD_TYPES_BY_CATEGORY } from '../../composables/tonalChordsMapping'

export default function ChordsDetailsSideBar() {
  const chordRootNoteType = useMainStore(s => s.chordRootNoteType)
  const setChordObject = useMainStore(s => s.setChordObject)
  const setChordRootNoteType = useMainStore(s => s.setChordRootNoteType)

  const categorizedChords = useMemo(() => {
    const result: Record<string, { description?: string; chords: any[] }> = {}
    Object.keys(CHORD_TYPES_BY_CATEGORY).forEach(category => {
      const categoryData = (CHORD_TYPES_BY_CATEGORY as any)[category]
      result[category] = {
        description: categoryData.description,
        chords: categoryData.chords
      }
    })
    result['Autres'] = {
      description: "Accords spéciaux ou moins courants.",
      chords: []
    }
    // Remove empty categories
    Object.keys(result).forEach(cat => {
      if (result[cat].chords.length === 0) delete result[cat]
    })
    return result
  }, [])

  function selectChord(chord: any) {
    setChordObject(chord)
    setChordRootNoteType(chord.id)
  }

  return (
    <div className="menu">
      {Object.entries(categorizedChords).map(([category, data]) => (
        <div key={category} className="chord-category">
          <h2 className="category-title">{category}</h2>
          {data.description && (
            <p className="category-description">{data.description}</p>
          )}
          <div className="chord-buttons">
            {data.chords.map((chord: any) => (
              <button
                key={chord.name || chord.id}
                className={['item', chordRootNoteType === chord.id ? 'current' : ''].filter(Boolean).join(' ')}
                onClick={(e) => { e.stopPropagation(); selectChord(chord) }}
              >
                {chord.id} ({chord.intervals?.length ?? 0})
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
