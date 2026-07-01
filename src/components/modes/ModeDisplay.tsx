import React, { useState, useEffect, useMemo } from 'react'
import './ModeDisplay.scss'
import { useMainStore } from '../../stores/useMainStore'
import { Note } from 'tonal'
import Tab from '../tab/Tab'
import { EXTRA_MODES } from '../../data/extraModes'
import type { ModeGuitar } from '../../types/mode'
import { useMidiUtils } from '../../hooks/useMidiUtils'

const MAIN_MODES: ModeGuitar[] = [
  {
    name: "ionian",
    aliases: ["major", "M"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
    alt: [],
    triad: "major",
    seventh: "maj7",
    description: "Le mode ionien est la gamme majeure traditionnelle, caractérisé par sa sonorité lumineuse et équilibrée.",
    culture: "Occidentale classique",
    category: "Modes Principaux"
  },
]

export default function ModeDisplay() {
  const userScale = useMainStore(s => s.userScale)
  const selectedMode = useMainStore(s => s.selectedMode)
  const setModeObject = useMainStore(s => s.setModeObject)

  const { notesToMidi } = useMidiUtils()

  const tabLength = 24
  const visibleStart = 0
  const visibleEnd = 10

  const allModes = useMemo(() => [...MAIN_MODES, ...EXTRA_MODES], [])

  const [currentMode, setCurrentMode] = useState<ModeGuitar | null>(null)

  function getModeNotes(mode: ModeGuitar): string[] {
    return mode.intervals.map(interval => Note.transpose(userScale, interval))
  }

  function selectMode(mode: ModeGuitar) {
    setModeObject(mode)
    setCurrentMode(mode)
  }

  function refresh() {
    const selected = allModes.find(m => m.name === selectedMode)
    if (selected) {
      setCurrentMode(selected)
      setModeObject(selected)
    } else if (allModes.length > 0) {
      selectMode(allModes[0])
    }
  }

  useEffect(() => { refresh() }, [userScale, selectedMode])

  const modeMidiNotes = useMemo(() => {
    if (!currentMode) return []
    return notesToMidi(getModeNotes(currentMode))
  }, [currentMode, userScale])

  if (!currentMode) return null

  return (
    <div className="mode-display-wrap">
      <Tab
        midiList={modeMidiNotes}
        matchType="multiple"
        tabLength={tabLength}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
      />
    </div>
  )
}
