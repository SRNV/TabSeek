import { create } from 'zustand'
import { Note } from 'tonal'
import type { ModeGuitar } from '../types'
import type { ChordsCompleteDef } from '../composables/chords'

const defaultMode: ModeGuitar = {
  name: 'ionian',
  aliases: ['major', 'M'],
  modeNum: 0,
  mode: 0,
  intervals: ['1P', '2M', '3M', '4P', '5P', '6M', '7M'],
  alt: [],
  triad: 'major',
  seventh: 'maj7',
  category: '',
}

interface MainState {
  userScale: string
  selectedMidi: number | null
  selectedMode: string
  modeObject: ModeGuitar
  chordRootNote: string
  chordRootObject: ChordsCompleteDef | null
  chordRootNoteType: string
  setUserScale: (scale: string) => void
  setSelectedMidi: (midi: number | null) => void
  clearSelectedMidi: () => void
  setSelectedMode: (mode: string | ModeGuitar) => void
  setModeObject: (modeObj: ModeGuitar) => void
  setChordObject: (obj: ChordsCompleteDef | null) => void
  setChordRootNote: (note: string, type?: string) => void
  setChordRootNoteType: (type: string) => void
  getModeNotes: () => string[]
  getModeTriad: () => string
  getModeSeventh: () => string
}

export const useMainStore = create<MainState>((set, get) => ({
  userScale: 'C4',
  selectedMidi: null,
  selectedMode: defaultMode.name,
  modeObject: defaultMode,
  chordRootNote: 'C4',
  chordRootObject: null,
  chordRootNoteType: 'major',

  getModeNotes: () => {
    const { userScale, modeObject } = get()
    return modeObject.intervals.map(interval => Note.transpose(userScale, interval))
  },
  getModeTriad: () => get().modeObject.triad,
  getModeSeventh: () => get().modeObject.seventh,

  setUserScale: (scale) => set({ userScale: scale }),
  setSelectedMidi: (midi) => {
    set({ selectedMidi: midi })
    if (midi !== null) {
      const noteStr = Note.fromMidi(midi)
      if (noteStr) set({ chordRootNote: noteStr })
    }
  },
  clearSelectedMidi: () => set({ selectedMidi: null }),
  setSelectedMode: (mode) => {
    if (typeof mode === 'string') {
      set({ selectedMode: mode })
    } else {
      set({ selectedMode: mode.name, modeObject: mode })
    }
  },
  setModeObject: (modeObj) => set({ modeObject: modeObj, selectedMode: modeObj.name }),
  setChordObject: (obj) => set({ chordRootObject: obj }),
  setChordRootNote: (note) => set({ chordRootNote: note }),
  setChordRootNoteType: (type) => set({ chordRootNoteType: type }),
}))
