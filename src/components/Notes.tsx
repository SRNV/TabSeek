import React, { useState } from 'react'
import './Notes.scss'
import { Interval, Note, Scale } from 'tonal'
import { playChord, playFullChord } from '../composables/useAudio'
import { getJoinedNotesColor } from '../composables/useNoteHelpers'
import { getReadableChordName } from '../composables/tonalChordsMapping'
import { useMainStore } from '../stores/useMainStore'

interface NotesProps {
  rootNote: string
  notes: string[]
  collection: string[]
  duration?: number
  gap?: number
  type?: OscillatorType
  chordType?: string
}

const waveforms = [
  { id: 'sine', name: 'Sine', description: 'Doux et pur' },
  { id: 'square', name: 'Square', description: 'Riche en harmoniques' },
  { id: 'sawtooth', name: 'Sawtooth', description: 'Brillant, synthétique' },
  { id: 'triangle', name: 'Triangle', description: 'Entre sine et square' },
]

export default function Notes({
  rootNote,
  notes,
  collection,
  duration: durationProp = 0.2,
  gap: gapProp = 0.1,
  chordType,
}: NotesProps) {
  const [localNotes, setLocalNotes] = useState([...notes])
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedOctave, setSelectedOctave] = useState(0)
  const [selectedWaveform, setSelectedWaveform] = useState<OscillatorType>('sine')

  const userScale = useMainStore(s => s.userScale)
  const selectedMode = useMainStore(s => s.selectedMode)

  const formattedChordType = chordType ? getReadableChordName(chordType, 'symbol') : ''

  function getDisplay(note: string): string {
    const noteData = Note.get(note)
    if (noteData.acc && noteData.acc.length > 0) {
      return `${note} ${Note.enharmonic(note)}`
    }
    return note
  }

  function getColor(note: string): string {
    return getJoinedNotesColor(
      note,
      0,
      Scale.get(`${userScale} ${selectedMode}`).notes,
      localNotes
    )
  }

  function getNoteRole(note: string): string {
    const pc1 = Note.get(note).pc
    const pc2 = Note.get(rootNote).pc
    if (pc1 === pc2) return 'Fondamentale'
    const interval = Interval.distance(rootNote, note)
    switch (interval) {
      case '3M': return 'Tierce majeure'
      case '3m': return 'Tierce mineure'
      case '5P': return 'Quinte juste'
      case '5d': return 'Quinte diminuée'
      case '5A': return 'Quinte augmentée'
      case '7M': return 'Septième majeure'
      case '7m': return 'Septième mineure'
      case '9M': return 'Neuvième'
      case '11P': return 'Onzième'
      case '13M': return 'Treizième'
      default: return interval
    }
  }

  async function playArpeggio() {
    if (isPlaying) return
    setIsPlaying(true)
    await playChord(localNotes, durationProp, gapProp, selectedWaveform)
    setIsPlaying(false)
  }

  async function playFull() {
    if (isPlaying) return
    setIsPlaying(true)
    await playFullChord(localNotes, 1, selectedWaveform)
    setIsPlaying(false)
  }

  function octave(semi: number) {
    setSelectedOctave(prev => prev + (semi === 12 ? 1 : semi === -12 ? -1 : 0))
    const result = localNotes.map(n => Note.transpose(n, Interval.fromSemitones(semi)))
    setLocalNotes(result)
    // play after state update — use the result directly
    playChord(result, durationProp, gapProp, selectedWaveform)
  }

  function resetOctave() {
    if (selectedOctave === 0) return
    const semi = -12 * selectedOctave
    const result = localNotes.map(n => Note.transpose(n, Interval.fromSemitones(semi)))
    setLocalNotes(result)
    setSelectedOctave(0)
  }

  return (
    <div className="notes-container">
      {formattedChordType && (
        <div className="notes-header">
          <span className="chord-type">{formattedChordType}</span>
        </div>
      )}

      <div className="notes-grid" onClick={(e) => { e.stopPropagation(); playArpeggio() }}>
        <div
          className={['note-square', 'octave-btn', selectedOctave <= -2 ? 'disabled' : ''].filter(Boolean).join(' ')}
          onClick={(e) => { e.stopPropagation(); octave(-12) }}
        >
          <span>-</span>
        </div>

        {localNotes.map((note, index) => (
          <div
            key={index}
            className="note-square"
            style={{ backgroundColor: getColor(note) }}
            title={getNoteRole(note)}
          >
            <span>{getDisplay(note)}</span>
          </div>
        ))}

        <div
          className={['note-square', 'octave-btn', selectedOctave >= 2 ? 'disabled' : ''].filter(Boolean).join(' ')}
          onClick={(e) => { e.stopPropagation(); octave(12) }}
        >
          <span>+</span>
        </div>

        <div className="note-square reset-btn" onClick={(e) => { e.stopPropagation(); resetOctave() }}>
          <span>Reset</span>
        </div>
      </div>

      <div className="controls-container">
        <div className="play-btns">
          <button
            className={['play-btn', 'arpeggio', isPlaying ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={(e) => { e.stopPropagation(); playArpeggio() }}
          >
            <span className="play-icon">♫</span> Arpège
          </button>
          <button
            className={['play-btn', 'chord', isPlaying ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={(e) => { e.stopPropagation(); playFull() }}
          >
            <span className="play-icon">♪</span> Accord
          </button>
        </div>

        <div className="waveform-selector">
          <span className="waveform-label">Timbre:</span>
          <div className="waveform-buttons">
            {waveforms.map(wf => (
              <button
                key={wf.id}
                className={['waveform-btn', selectedWaveform === wf.id ? 'active' : ''].filter(Boolean).join(' ')}
                title={wf.description}
                onClick={(e) => { e.stopPropagation(); setSelectedWaveform(wf.id as OscillatorType) }}
              >
                {wf.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
