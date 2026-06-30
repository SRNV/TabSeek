import { useEffect } from 'react'
import './MainGrid.scss'
import SmartFretboard from './SmartFretboard'
import TabGroup from './TabGroup'
import CurrentModeDisplay from './modes/CurrentModeDisplay'
import ChordTab from './chords/ChordTab'
import ChordsList from './chords/ChordsList'
import ProgressionCompiler from './progression/ProgressionCompiler'
import ProgressionsList from './sidebars/ProgressionsList'
import RhythmList from './sidebars/RhythmList'
import TablatureMain from './tablature/TablatureMain'
import { useMainStore } from '../stores/useMainStore'
import { CHORD_TYPES_BY_CATEGORY } from '../composables/tonalChordsMapping'

export default function MainGrid() {
  const chordRootObject   = useMainStore(s => s.chordRootObject)
  const chordRootNoteType = useMainStore(s => s.chordRootNoteType)

  // Default to tonic major chord (1st degree) if no chord is selected
  useEffect(() => {
    const { chordRootObject: cur, setChordObject, setChordRootNoteType, setChordRootNote, userScale } = useMainStore.getState()
    if (!cur) {
      const majorChord = (CHORD_TYPES_BY_CATEGORY as any)['Triades'].chords[0]
      setChordObject(majorChord)
      setChordRootNoteType('major')
      setChordRootNote(userScale)
    }
  }, [])

  return (
    <div className="main-grid">
      <div className="area-f">
        <SmartFretboard />
      </div>

      {/* Progression Compilée — single tab (extensible later) */}
      <div className="area-pc">
        <TabGroup tabs={[
          { label: 'Progression Compilée', content: <ProgressionCompiler /> },
        ]} />
      </div>

      {/* Progressions Disponibles + Accords */}
      <div className="area-pda">
        <TabGroup tabs={[
          { label: 'Accords', content: <ChordsList /> },
          { label: 'Rythmes', content: <RhythmList /> },
          { label: 'Progressions', content: <ProgressionsList /> },
          { label: 'Accords Infos', content: <ChordTab chordType={chordRootNoteType} chordData={chordRootObject} hideFretboard /> },
        ]} />
      </div>

      {/* Tablature + Info mode */}
      <div className="area-ti">
        <TabGroup tabs={[
          { label: 'Tablature', content: <TablatureMain /> },
          { label: 'Info Mode', content: <CurrentModeDisplay /> },
        ]} />
      </div>
    </div>
  )
}
