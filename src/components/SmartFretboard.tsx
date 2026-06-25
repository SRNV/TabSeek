import React, { useMemo } from 'react'
import { Note } from 'tonal'
import { useMainStore } from '../stores/useMainStore'
import { useMidiUtils } from '../composables/useMidiUtils'
import Tab from './tab/Tab'

export default function SmartFretboard() {
  const userScale    = useMainStore(s => s.userScale)
  const modeObject   = useMainStore(s => s.modeObject)
  const { notesToMidi } = useMidiUtils()

  const midiList = useMemo(() => {
    const modeNotes = modeObject.intervals.map((iv: string) => Note.transpose(userScale, iv))
    return notesToMidi(modeNotes)
  }, [userScale, modeObject, notesToMidi])

  return (
    <Tab
      midiList={midiList}
      matchType="multiple"
      tabLength={24}
      visibleStart={0}
      visibleEnd={10}
    />
  )
}
