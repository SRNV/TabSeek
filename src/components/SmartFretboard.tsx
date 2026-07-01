import React, { useMemo } from 'react'
import { Note, Chord } from 'tonal'
import { useMainStore } from '../stores/useMainStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useMidiUtils } from '../hooks/useMidiUtils'
import { EXTRA_MODES } from '../data/extraModes'
import { ModeZoneService } from '../services/ModeZoneService'
import type { ModeGuitar } from '../types/mode'
import Tab from './tab/Tab'

// Maps TabContent mode keys ('major','minor',...) to EXTRA_MODES entries
const TAB_MODE_ALIAS: Record<string, string> = { major: 'ionian', minor: 'aeolian' }

function findModeByTabName(name: string): ModeGuitar | null {
  const lookup = TAB_MODE_ALIAS[name] ?? name
  return (
    EXTRA_MODES.find(m => m.name === lookup) ??
    EXTRA_MODES.find(m => m.aliases.includes(name)) ??
    null
  )
}

export default function SmartFretboard() {
  const userScale           = useMainStore(s => s.userScale)
  const modeObject          = useMainStore(s => s.modeObject)
  const tabHoveredChordName = useMainStore(s => s.tabHoveredChordName)
  const { notesToMidi } = useMidiUtils()

  // ── Tablature sync ────────────────────────────────────────────────────────
  const tabTuning            = useTablatureStore(s => s.tuning)
  
  // R3F sync
  const isPlayingR3F         = useTablatureR3FStore(s => s.isPlaying)
  const playbackBeat         = useTablatureR3FStore(s => s.playbackBeat)
  const modeZones            = useTablatureR3FStore(s => s.modeZones)

  // Resolve mode override at the current beat
  const contextModeObject = useMemo<ModeGuitar | undefined>(() => {
    // In R3F mode, we use ModeZones.
    const activeZone = ModeZoneService.getActiveZoneAt(playbackBeat, 1000)
    if (activeZone) {
      return findModeByTabName(activeZone.modeName) ?? undefined
    }
    return undefined
  }, [playbackBeat, modeZones])

  // Tuning: store is low→high ('E2,A2,...'), Tab expects the same order as cords
  const cords = useMemo(() => tabTuning.split(','), [tabTuning])

  const midiList = useMemo(() => {
    if (tabHoveredChordName) {
      const pcs = Chord.get(tabHoveredChordName).notes
      return notesToMidi(pcs.map(pc => `${pc}4`))
    }
    const eff = contextModeObject ?? modeObject
    const scaleWithOctave = Note.get(userScale).oct !== null ? userScale : `${userScale}4`
    const modeNotes = eff.intervals.map((iv: string) => Note.transpose(scaleWithOctave, iv))
    return notesToMidi(modeNotes)
  // Stable string keys for mode/chord (P5-3: avoids recompute when same mode stays active).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tabHoveredChordName,
    userScale,
    modeObject.name + modeObject.intervals.join(','),
    contextModeObject ? contextModeObject.name + contextModeObject.intervals.join(',') : '',
  ])

  return (
    <Tab
      midiList={midiList}
      matchType="multiple"
      tabLength={24}
      visibleStart={0}
      visibleEnd={20}
      cords={cords}
      contextModeObject={contextModeObject}
    />
  )
}
