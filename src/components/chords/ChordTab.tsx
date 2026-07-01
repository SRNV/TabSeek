import { useMemo, useCallback } from 'react'
import './ChordTab.scss'
import { Note } from 'tonal'
import { useMainStore } from '../../stores/useMainStore'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { ALL_CHORDS, getReadableChordName, TonalChordType } from '../../data/tonalChordsMapping'
import Tab from '../tab/Tab'
import Notes from '../Notes'
import { useMidiUtils } from '../../hooks/useMidiUtils'
import { detectChordVoicings } from '../../hooks/useGuitarChords'
import { CHORDS } from '../../data/chords'

import { ChordsCompleteDef } from '../../types'

type VoicingDisplay = {
  position: number
  frets: (number | null)[]
  fingers?: (number | null)[]
}

interface ChordTabProps {
  chordType: string
  chordData: ChordsCompleteDef | null
  hideFretboard?: boolean
}


export default function ChordTab({ chordType, chordData, hideFretboard = false }: ChordTabProps) {
  const chordRootNote     = useMainStore(s => s.chordRootNote)
  const chordRootNoteType = useMainStore(s => s.chordRootNoteType)
  const hoveredRootNote   = useMainStore(s => s.hoveredRootNote)
  const modeObject        = useMainStore(s => s.modeObject)
  const userScale         = useMainStore(s => s.userScale)

  // When a fretboard cell is hovered, use that pitch class as the chord root
  const effectiveRoot = useMemo(() => {
    if (!hoveredRootNote) return chordRootNote
    const oct = Note.get(chordRootNote).oct ?? 4
    return `${hoveredRootNote}${oct}`
  }, [hoveredRootNote, chordRootNote])

  const { notesToMidi } = useMidiUtils()
  const tuningStr = useTablatureStore(s => s.tuning)

  // ── Navigation ────────────────────────────────────────────────────────────
  const currentIdx = useMemo(() => {
    if (!chordData) return 0
    const idx = ALL_CHORDS.findIndex(c => c?.id === chordData.id)
    return idx < 0 ? 0 : idx
  }, [chordData])

  const navigate = useCallback((delta: -1 | 1) => {
    const nextIdx = (currentIdx + delta + ALL_CHORDS.length) % ALL_CHORDS.length
    const next = ALL_CHORDS[nextIdx]
    const { setChordObject, setChordRootNoteType } = useMainStore.getState()
    if (!next) {
      setChordObject(null)
      setChordRootNoteType('')
    } else {
      setChordObject(next)
      setChordRootNoteType(next.id)
    }
  }, [currentIdx])

  // ── Chord data ────────────────────────────────────────────────────────────
  const modeNotes = useMemo(() =>
    modeObject.intervals.map((iv: string) => Note.transpose(userScale, iv))
  , [modeObject, userScale])

  const chordNotes = useMemo(() => {
    if (!chordData?.intervals) return []
    return chordData.intervals.map((iv: string) => Note.transpose(effectiveRoot, iv))
  }, [chordData, effectiveRoot])

  const chordMidiList = useMemo(() => notesToMidi(chordNotes), [chordNotes, notesToMidi])

  // ── Dynamic voicings (tuning-aware) ──────────────────────────────────────
  const voicings = useMemo((): VoicingDisplay[] => {
    if (!chordData) return []
    const rootPc = Note.get(effectiveRoot).pc || 'C'
    const tuning = tuningStr.split(',')
    const dynamic = detectChordVoicings(chordType, rootPc, tuning)
    if (dynamic.length > 0) {
      return dynamic.slice(0, 3).map((v, i) => ({
        position: i + 1,
        frets: v.frets.map(f => f === -1 ? null : f),
      }))
    }
    // Fallback: static templates from chords.ts (for chord types unknown to Tonal.js)
    const staticDef = CHORDS[chordType as TonalChordType]
    if (!staticDef) return []
    return staticDef.positions.slice(0, 3).map(p => ({
      position: p.position,
      frets: p.frets,
      fingers: p.fingers,
    }))
  }, [chordData, chordType, effectiveRoot, tuningStr])

  const formattedChordName = useMemo(() => {
    if (!chordData) return '—'
    const type = getReadableChordName(chordType, 'symbol')
    const rootDisplay = hoveredRootNote || Note.get(chordRootNote).pc || chordRootNote
    return `${rootDisplay}${type}`
  }, [chordData, chordType, chordRootNote, hoveredRootNote])

  function isIntervalInMode(interval: string): boolean {
    return modeObject.intervals.includes(interval)
  }

  function getIntervalNote(root: string, interval: string): string {
    try { return Note.transpose(root, interval) } catch { return '?' }
  }


  return (
    <div className="chord-tab-container">
      <div className="chord-header">
        <button className="chord-nav-btn" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h3 className="chord-title">{formattedChordName}</h3>
        <button className="chord-nav-btn" onClick={() => navigate(1)}>
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {!chordData ? (
        <div className="chord-empty">Aucun accord sélectionné</div>
      ) : (
        <>
          {chordData.description && (
            <div className="chord-description">{chordData.description}</div>
          )}

          <div className="chord-content">
            <Notes
              key={`${chordRootNoteType}-${chordRootNote}`}
              rootNote={effectiveRoot}
              notes={chordNotes}
              collection={modeNotes}
              chordType={chordRootNoteType}
            />

            {!hideFretboard && (
              <div className="tab-wrapper">
                <Tab
                  midiList={chordMidiList}
                  matchType="one"
                  tabLength={24}
                  visibleStart={0}
                  visibleEnd={10}
                />
              </div>
            )}

            {chordData.intervals?.length > 0 && (
              <div className="chord-intervals">
                <h4>Intervalles:</h4>
                <div className="intervals-list">
                  {chordData.intervals.map((iv: string) => (
                    <span
                      key={iv}
                      className={['interval-chip', !isIntervalInMode(iv) ? 'outside-mode' : ''].filter(Boolean).join(' ')}
                    >
                      {iv}
                      <span className="interval-note">{getIntervalNote(effectiveRoot, iv)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {voicings.length > 0 && (
              <div className="chord-fingering">
                <h4>Positions ({voicings.length}):</h4>
                <div className="fingering-list">
                  {voicings.map((pos, pi) => (
                    <div key={pi} className="position-card">
                      <div className="position-number">Position {pos.position}</div>
                      <div className="position-frets">
                        {pos.frets.map((fret, fi) => (
                          <span key={fi} className={['fret-value', fret === null ? 'muted' : ''].filter(Boolean).join(' ')}>
                            {fret === null ? 'x' : fret}
                            {pos.fingers?.[fi] != null && pos.fingers[fi] !== 0 && (
                              <small className="finger-indicator">{pos.fingers[fi]}</small>
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
        </>
      )}
    </div>
  )
}
