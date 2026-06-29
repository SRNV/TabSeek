import React, { useMemo } from 'react'
import { Note, Chord } from 'tonal'
import { useMainStore } from '../stores/useMainStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useMidiUtils } from '../composables/useMidiUtils'
import { EXTRA_MODES } from '../composables/extraModes'
import type { ModeGuitar } from '../types'
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
  const activeColumn         = useTablatureStore(s => s.activeColumn)
  const currentPlayingColumn = useTablatureStore(s => s.currentPlayingColumn)
  const isPlaying            = useTablatureStore(s => s.isPlaying)

  // Playing cursor takes priority over editing cursor
  const effectiveColumn = isPlaying ? currentPlayingColumn : activeColumn

  // Resolve mode override at the active tab column
  const contextModeObject = useMemo<ModeGuitar | undefined>(() => {
    if (effectiveColumn < 0) return undefined
    const modeName = useTablatureStore.getState().flatColumnMode(effectiveColumn)
    if (!modeName) return undefined
    return findModeByTabName(modeName) ?? undefined
  }, [effectiveColumn])

  // Tuning: store is low→high ('E2,A2,...'), Tab expects the same order as cords
  const cords = useMemo(() => tabTuning.split(','), [tabTuning])

  const midiList = useMemo(() => {
    if (tabHoveredChordName) {
      const pcs = Chord.get(tabHoveredChordName).notes   // pitch classes e.g. ["C","E","G","B"]
      return notesToMidi(pcs.map(pc => `${pc}4`))         // octave 4 → pitch-class match in Tab
    }
    const eff = contextModeObject ?? modeObject
    const modeNotes = eff.intervals.map((iv: string) => Note.transpose(userScale, iv))
    return notesToMidi(modeNotes)
  }, [tabHoveredChordName, userScale, modeObject, contextModeObject, notesToMidi])

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
