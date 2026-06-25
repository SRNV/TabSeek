import React, { useState, useMemo } from 'react'
import './ChordTab.scss'
import { Note } from 'tonal'
import { useMainStore } from '../../stores/useMainStore'
import { getReadableChordName } from '../../composables/tonalChordsMapping'
import Tab from '../tab/Tab'
import Notes from '../Notes'
import { useMidiUtils } from '../../composables/useMidiUtils'

interface ChordTabProps {
  chordType: string
  chordData: any
  rootNote?: string
  scale?: number
}

export default function ChordTab({ chordType, chordData }: ChordTabProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  const chordRootNote = useMainStore(s => s.chordRootNote)
  const chordRootObject = useMainStore(s => s.chordRootObject)
  const chordRootNoteType = useMainStore(s => s.chordRootNoteType)
  const modeObject = useMainStore(s => s.modeObject)
  const userScale = useMainStore(s => s.userScale)
  const selectedMode = useMainStore(s => s.selectedMode)

  const { notesToMidi } = useMidiUtils()

  const tabLength = 24
  const visibleStart = 0
  const visibleEnd = 10

  const modeNotes = useMemo(() => {
    return modeObject.intervals.map(interval => Note.transpose(userScale, interval))
  }, [modeObject, userScale])

  const chordNotes = useMemo(() => {
    if (!chordRootObject?.intervals) return []
    return chordRootObject.intervals.map((interval: string) =>
      Note.transpose(chordRootNote, interval)
    )
  }, [chordRootObject, chordRootNote])

  const chordMidiList = useMemo(() => notesToMidi(chordNotes), [chordNotes])

  const formattedChordName = useMemo(() => {
    const type = getReadableChordName(chordType, 'symbol')
    return `${chordRootNote}${type}`
  }, [chordType, chordRootNote])

  const MAX_DESCRIPTION_LENGTH = 100
  const truncatedDescription = chordData.description
    ? chordData.description.length <= MAX_DESCRIPTION_LENGTH
      ? chordData.description
      : chordData.description.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
    : ''
  const isDescriptionTruncated = chordData.description && chordData.description.length > MAX_DESCRIPTION_LENGTH

  function isIntervalInMode(interval: string): boolean {
    return modeObject.intervals.includes(interval)
  }

  function getIntervalNote(root: string, interval: string): string {
    try { return Note.transpose(root, interval) } catch { return '?' }
  }

  return (
    <div className="chord-tab-container">
      <div className="chord-header">
        <h3 className="chord-title">
          {formattedChordName}
        </h3>
      </div>

      {chordData.description && (
        <div className="chord-description">
          {truncatedDescription}
          {isDescriptionTruncated && (
            <button
              className="show-more-btn"
              onClick={() => setShowFullDescription(v => !v)}
            >
              {showFullDescription ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
          {showFullDescription && (
            <div className="full-description">{chordData.description}</div>
          )}
        </div>
      )}

      <div className="chord-content">
        <Notes
          key={`${chordRootNoteType}-${chordRootNote}`}
          rootNote={chordRootNote}
          notes={chordNotes}
          collection={modeNotes}
          chordType={chordRootNoteType}
        />

        <div className="tab-wrapper">
          <Tab
            midiList={chordMidiList}
            matchType="one"
            tabLength={tabLength}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
          />
        </div>

        {chordData.intervals && chordData.intervals.length > 0 && (
          <div className="chord-intervals">
            <h4>Intervalles:</h4>
            <div className="intervals-list">
              {chordData.intervals.map((interval: string) => (
                <span
                  key={interval}
                  className={['interval-chip', !isIntervalInMode(interval) ? 'outside-mode' : ''].filter(Boolean).join(' ')}
                >
                  {interval}
                  <span className="interval-note">{getIntervalNote(chordRootNote, interval)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {chordData.positions && chordData.positions.length > 0 && (
          <div className="chord-fingering">
            <h4>Positions des doigts:</h4>
            <div className="fingering-list">
              {chordData.positions.slice(0, 1).map((position: any, posIndex: number) => (
                <div key={posIndex} className="position-card">
                  <div className="position-number">Position {position.position || posIndex + 1}</div>
                  <div className="position-frets">
                    {position.frets?.map((fret: any, fretIndex: number) => (
                      <span key={fretIndex} className={['fret-value', fret === null ? 'muted' : ''].filter(Boolean).join(' ')}>
                        {fret === null ? 'x' : fret}
                        {position.fingers && position.fingers[fretIndex] !== null && (
                          <small className="finger-indicator">{position.fingers[fretIndex]}</small>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
