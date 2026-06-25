import React, { useEffect } from 'react'
import './ChordsTabsDisplay.scss'
import { useMainStore } from '../../stores/useMainStore'
import ChordTab from './ChordTab'
import { CHORD_TYPES_BY_CATEGORY } from '../../composables/tonalChordsMapping'

export default function ChordsTabsDisplay() {
  const chordRootObject = useMainStore(s => s.chordRootObject)
  const chordRootNoteType = useMainStore(s => s.chordRootNoteType)
  const setChordRootNote = useMainStore(s => s.setChordRootNote)
  const setChordObject = useMainStore(s => s.setChordObject)
  const setChordRootNoteType = useMainStore(s => s.setChordRootNoteType)

  useEffect(() => {
    if (!chordRootObject) {
      const majorChord = (CHORD_TYPES_BY_CATEGORY['Triades'] as any).chords.find(
        (c: any) => c.id === 'major'
      )
      if (majorChord) {
        setChordRootNote('A4')
        setChordObject(majorChord)
        setChordRootNoteType('major')
      }
    }
  }, [])

  return (
    <div className="chords-display-container">
      <div className="chord-display">
        {chordRootObject && (
          <ChordTab
            chordData={chordRootObject}
            chordType={chordRootNoteType}
          />
        )}
      </div>
    </div>
  )
}
