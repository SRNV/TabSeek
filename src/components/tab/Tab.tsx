import React, { useState } from 'react'
import './Tab.scss'
import GuitarNote from './GuitarNote'
import { getNoteName } from '../../composables/useNoteHelpers'
import { Note } from 'tonal'
import { useMainStore } from '../../stores/useMainStore'
import { useGuitarNotes } from '../../composables/useGuitarNotes'

interface TabProps {
  midiList: number[]
  matchType: 'one' | 'multiple'
  tabLength: number
  visibleStart: number
  visibleEnd: number
  forChordsDisplay?: boolean
  cords?: string[]
}

const DEFAULT_COLOR = '#333'
const HIGHLIGHT_COLOR = '#FF9500'

function getNoteDegreeLocal(noteName: string, collection: string[]): number | null {
  const noteData = Note.get(noteName)
  const midi = noteData.midi
  if (midi == null) return null
  const notePc = midi % 12
  const scaleNotes = collection.map(n => {
    const m = Note.midi(n)
    return m != null ? m % 12 : null
  })
  const index = scaleNotes.indexOf(notePc)
  return index === -1 ? null : index + 1
}

export default function Tab({
  midiList,
  matchType,
  tabLength,
  visibleStart,
  visibleEnd,
  forChordsDisplay,
  cords: cordsProp,
}: TabProps) {
  const [localVisibleStart, setLocalVisibleStart] = useState(visibleStart)
  const [localVisibleEnd, setLocalVisibleEnd] = useState(visibleEnd)

  const modeNotes = useMainStore(s => s.getModeNotes())

  const cords = cordsProp ?? ['E2', 'A2', 'D3', 'G3', 'C3', 'E4'].reverse()

  const visibleFretRange: number[] = []
  for (let i = localVisibleStart; i <= localVisibleEnd; i++) {
    visibleFretRange.push(i)
  }

  function getScaleColor(noteName: string): string {
    const { GuitarNote: GuitarNoteData } = useGuitarNotes()
    const degree = getNoteDegreeLocal(noteName, modeNotes)
    return degree ? GuitarNoteData.colors[degree - 1] : DEFAULT_COLOR
  }

  function getNoteBackground(cord: string, fret: number): string {
    const noteName = getNoteName(cord, fret)
    const noteMidi = Note.midi(noteName)
    if (noteMidi === null) return DEFAULT_COLOR
    if (matchType === 'one') {
      return midiList.map((m) => m % 12).includes(noteMidi % 12) ? HIGHLIGHT_COLOR : DEFAULT_COLOR
    } else {
      return getScaleColor(noteName)
    }
  }

  function getDegreeLabel(cord: string, fret: number): string {
    const noteName = getNoteName(cord, fret)
    const noteMidi = Note.midi(noteName)
    if (noteMidi === null) return ''
    if (matchType === 'one') {
      return midiList.includes(noteMidi) ? '●' : ''
    } else {
      const degree = getNoteDegreeLocal(noteName, modeNotes)
      return degree ? `${degree}°` : ''
    }
  }

  function moveLeft() {
    if (localVisibleStart > 0) {
      setLocalVisibleStart(s => s - 1)
      setLocalVisibleEnd(s => s - 1)
    }
  }

  function moveRight() {
    if (localVisibleEnd < tabLength) {
      setLocalVisibleStart(s => s + 1)
      setLocalVisibleEnd(s => s + 1)
    }
  }

  return (
    <div className="tab-container">
      <div className="tab-navigation-container">
        <button
          className={['nav-btn', 'nav-left', localVisibleStart === 0 ? 'disabled' : ''].filter(Boolean).join(' ')}
          onClick={moveLeft}
          disabled={localVisibleStart === 0}
        >
          <span className="arrow-icon">◀</span>
        </button>

        <div className="tab-content">
          {cords.map((cord, cIdx) => (
            <div key={`cord-${cIdx}`} className="fret-row">
              <GuitarNote
                className="open-string"
                position={0}
                cord={cIdx}
                displayName={getNoteName(cord, 0)}
                background={getNoteBackground(cord, 0)}
                degreeLabel={getDegreeLabel(cord, 0)}
                forChordsDisplay={localVisibleStart === 0}
              />
              {visibleFretRange.map((fret) => (
                <GuitarNote
                  key={`fret-${fret}`}
                  position={fret + 1}
                  cord={cIdx}
                  displayName={getNoteName(cord, fret + 1)}
                  background={getNoteBackground(cord, fret + 1)}
                  degreeLabel={getDegreeLabel(cord, fret + 1)}
                  forChordsDisplay={true}
                />
              ))}
            </div>
          ))}
        </div>

        <button
          className={['nav-btn', 'nav-right', localVisibleEnd >= tabLength ? 'disabled' : ''].filter(Boolean).join(' ')}
          onClick={moveRight}
          disabled={localVisibleEnd >= tabLength}
        >
          <span className="arrow-icon">▶</span>
        </button>
      </div>

      <div className="position-indicator">
        Position {localVisibleStart + 1}-{localVisibleEnd + 1}
      </div>
    </div>
  )
}
