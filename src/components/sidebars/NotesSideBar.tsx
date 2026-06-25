import React, { useMemo } from 'react'
import './NotesSideBar.scss'
import GuitarNote from '../tab/GuitarNote'
import { useMainStore } from '../../stores/useMainStore'
import { Scale } from 'tonal'
import { getNoteColor, getNoteDegreeLabel } from '../../composables/useNoteHelpers'

const NOTES = ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4']

export default function NotesSideBar() {
  const userScale = useMainStore(s => s.userScale)
  const selectedMode = useMainStore(s => s.selectedMode)
  const setUserScale = useMainStore(s => s.setUserScale)

  const scaleNotes = useMemo(
    () => Scale.get(`${userScale} ${selectedMode}`).notes,
    [userScale, selectedMode]
  )

  function getColor(noteName: string): string {
    return getNoteColor(noteName, 0, scaleNotes)
  }

  function getDegreeLabel(noteName: string): string {
    return getNoteDegreeLabel(noteName, 0, scaleNotes)
  }

  function onNoteClicked(noteName: string) {
    setUserScale(noteName)
  }

  return (
    <div className="notes-sidebar">
      <div className="notes-grid">
        {NOTES.map(noteName => (
          <GuitarNote
            key={noteName}
            position={0}
            mode={`${userScale} ${selectedMode}`}
            displayName={noteName}
            background={getColor(noteName)}
            degreeLabel={getDegreeLabel(noteName)}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onNoteClicked(noteName) }}
          />
        ))}
      </div>
    </div>
  )
}
