import { useMemo, useCallback } from 'react'
import './ChordTab.scss'
import { Note } from 'tonal'
import { useMainStore } from '../../stores/useMainStore'
import { CHORD_TYPES_BY_CATEGORY, getReadableChordName } from '../../composables/tonalChordsMapping'
import Tab from '../tab/Tab'
import Notes from '../Notes'
import { useMidiUtils } from '../../composables/useMidiUtils'

interface ChordTabProps {
  chordType: string
  chordData: any
  hideFretboard?: boolean
}

const ALL_CHORDS: any[] = [
  null,
  ...Object.values(CHORD_TYPES_BY_CATEGORY).flatMap((cat: any) => cat.chords),
]

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
        <button className="chord-nav-btn" onClick={() => navigate(-1)}>◀</button>
        <h3 className="chord-title">{formattedChordName}</h3>
        <button className="chord-nav-btn" onClick={() => navigate(1)}>▶</button>
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
              rootNote={chordRootNote}
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
                      <span className="interval-note">{getIntervalNote(chordRootNote, iv)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {chordData.positions?.length > 0 && (
              <div className="chord-fingering">
                <h4>Positions des doigts:</h4>
                <div className="fingering-list">
                  {chordData.positions.slice(0, 1).map((pos: any, pi: number) => (
                    <div key={pi} className="position-card">
                      <div className="position-number">Position {pos.position || pi + 1}</div>
                      <div className="position-frets">
                        {pos.frets?.map((fret: any, fi: number) => (
                          <span key={fi} className={['fret-value', fret === null ? 'muted' : ''].filter(Boolean).join(' ')}>
                            {fret === null ? 'x' : fret}
                            {pos.fingers?.[fi] !== null && (
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
