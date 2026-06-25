import { create } from 'zustand'
import { Note, Interval } from 'tonal'
import { useMainStore } from './useMainStore'

export interface ColumnOverride {
  measureIdx: number
  columnIdx: number
  mode: string
}

export interface TabMeasure {
  data: string[][]
  modeOverrides: ColumnOverride[]
  indexPositions: number[]
  rhythmValues: number[]
}

export const RHYTHM_OPTIONS = [0, 1, 2, 4, 8, 16, 32, 64] as const
export const BEAM_COUNTS: Record<number, number> = { 8: 1, 16: 2, 32: 3, 64: 4 }

interface TablatureState {
  measures: TabMeasure[]
  currentMeasure: number
  currentPlayingColumn: number
  currentEditingCell: { string: number; column: number } | null
  isPlaying: boolean
  tempo: number
  metronomeEnabled: boolean
  filterByScaleEnabled: boolean
  tuning: string
  columns: number
  selectedColumns: number[]
  selectionStart: number
  selectionEnd: number
  activeColumn: number
  // getters (computed via functions)
  tuningArray: () => string[]
  tuningDisplay: () => string
  currentMeasureData: () => string[][]
  currentMeasureOverrides: () => ColumnOverride[]
  currentIndexPositions: () => number[]
  totalColumns: () => number
  flatCellValue: (stringIndex: number, globalCol: number) => string
  flatIndexPosition: (globalCol: number) => number
  flatColumnMode: (globalCol: number) => string | null
  flatRhythmValue: (globalCol: number) => number
  measureForColumn: (globalCol: number) => number
  isMeasureStart: (globalCol: number) => boolean
  hasSelection: () => boolean
  selectionWidth: () => number
  availableFrets: () => any[]
  getColumnMode: (columnIdx: number) => string | null
  isColumnSelected: (columnIdx: number) => boolean
  // actions
  initializeMeasures: () => void
  setTempo: (newTempo: number) => void
  setTuning: (newTuning: string) => void
  toggleMetronome: () => void
  setMetronomeEnabled: (value: boolean) => void
  toggleFilterByScale: () => void
  setFilterByScaleEnabled: (value: boolean) => void
  setCurrentMeasure: (measureIdx: number) => void
  addMeasure: () => void
  deleteMeasure: () => void
  previousMeasure: () => void
  nextMeasure: () => void
  setCurrentEditingCell: (stringIndex: number, columnIndex: number) => void
  clearCurrentEditingCell: () => void
  updateIndexPosition: (columnIndex: number, value: number) => void
  updateCellValue: (stringIndex: number, columnIndex: number, value: string) => void
  flatUpdateCellValue: (stringIndex: number, globalCol: number, value: string) => void
  flatUpdateIndexPosition: (globalCol: number, value: number) => void
  flatUpdateRhythmValue: (globalCol: number, value: number) => void
  cycleRhythmValue: (globalCol: number) => void
  ensureColumn: (globalCol: number) => void
  togglePlayback: () => void
  stopPlayback: () => void
  setCurrentPlayingColumn: (columnIdx: number) => void
  incrementPlayingColumn: () => void
  updateSelection: (start: number, end: number) => void
  clearSelection: () => void
  setActiveColumn: (col: number) => void
  applyModeOverride: (mode: string) => void
  insertColumnAt: (index: number) => void
  insertColumnLeft: () => void
  insertColumnRight: () => void
  dropProgressionAt: (progression: any[], columnIndex: number) => void
  handleChordProgression: (chords: any[], startColumn: number) => void
  handleNoteProgression: (notes: any[], startColumn: number) => void
  placeNotesInColumn: (notes: any[], columnIndex: number) => void
  findBestPosition: (noteName: string, tuningArray: string[]) => { string: number; fret: number } | null
}

function createEmptyMeasure(stringCount: number, columnCount: number): string[][] {
  const measure: string[][] = []
  for (let i = 0; i < stringCount; i++) {
    const row: string[] = []
    for (let j = 0; j < columnCount; j++) {
      row.push('-')
    }
    measure.push(row)
  }
  return measure
}

function createDefaultIndexPositions(columnCount: number): number[] {
  return Array(columnCount).fill(1)
}

function createDefaultRhythmValues(columnCount: number): number[] {
  return Array(columnCount).fill(0)
}

export const useTablatureStore = create<TablatureState>((set, get) => ({
  measures: [],
  currentMeasure: 0,
  currentPlayingColumn: -1,
  currentEditingCell: null,
  isPlaying: false,
  tempo: 120,
  metronomeEnabled: false,
  filterByScaleEnabled: true,
  tuning: 'E2,A2,D3,G3,C3,E4',
  columns: 8 * 4,
  selectedColumns: [],
  selectionStart: 0,
  selectionEnd: 0,
  activeColumn: -1,

  tuningArray: () => get().tuning.split(',').reverse(),
  tuningDisplay: () => get().tuning.split(',').join(' - '),
  currentMeasureData: () => {
    const s = get()
    if (s.currentMeasure >= s.measures.length) {
      return createEmptyMeasure(s.tuning.split(',').length, s.columns)
    }
    return s.measures[s.currentMeasure].data
  },
  currentMeasureOverrides: () => {
    const s = get()
    if (s.currentMeasure >= s.measures.length) return []
    return s.measures[s.currentMeasure].modeOverrides
  },
  currentIndexPositions: () => {
    const s = get()
    if (s.currentMeasure >= s.measures.length) return createDefaultIndexPositions(s.columns)
    return s.measures[s.currentMeasure].indexPositions
  },
  totalColumns: () => {
    const s = get()
    return s.measures.length * s.columns
  },
  flatCellValue: (stringIndex, globalCol) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    if (measureIdx >= s.measures.length) return '-'
    return s.measures[measureIdx]?.data[stringIndex]?.[localCol] ?? '-'
  },
  flatIndexPosition: (globalCol) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    if (measureIdx >= s.measures.length) return 1
    return s.measures[measureIdx]?.indexPositions[localCol] ?? 1
  },
  flatColumnMode: (globalCol) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    const overrides = s.measures[measureIdx]?.modeOverrides || []
    const override = overrides.find(o => o.columnIdx === localCol)
    return override ? override.mode : null
  },
  flatRhythmValue: (globalCol) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    if (measureIdx >= s.measures.length) return 0
    return s.measures[measureIdx]?.rhythmValues[localCol] ?? 0
  },
  measureForColumn: (globalCol) => {
    const s = get()
    return Math.floor(globalCol / s.columns)
  },
  isMeasureStart: (globalCol) => {
    const s = get()
    return globalCol % s.columns === 0
  },
  hasSelection: () => get().selectedColumns.length > 0,
  selectionWidth: () => {
    const s = get()
    return s.selectionEnd - s.selectionStart
  },
  availableFrets: () => {
    const s = get()
    const mainStore = useMainStore.getState()
    const tuningArray = s.tuning.split(',').reverse()
    const frets: any[] = []
    const values = new Set()
    const modeNotes = mainStore.getModeNotes()
    const scaleNotesSimple = modeNotes.map(note => {
      const midi = Note.midi(note)
      return midi !== null ? midi % 12 : -1
    }).filter(midi => midi !== -1)

    for (let stringIdx = 0; stringIdx < tuningArray.length; stringIdx++) {
      for (let i = 0; i <= 24; i++) {
        const stringTuning = tuningArray[stringIdx]
        if (!values.has(i)) {
          frets.push({
            value: i.toString(),
            label: i.toString(),
            inScale: isNoteInScale(stringTuning, i, scaleNotesSimple)
          })
          values.add(i)
        }
      }
    }

    for (let i = 1; i <= 12; i++) {
      frets.push({ value: `${i}h`, label: `${i}h`, inScale: true })
      frets.push({ value: `${i}p`, label: `${i}p`, inScale: true })
      frets.push({ value: `${i}/${i+1}`, label: `${i}/${i+1}`, inScale: true })
    }

    return frets

    function isNoteInScale(stringTuning: string, fret: number, scaleNotesSimple: number[]): boolean {
      const noteToCheck = Note.transpose(stringTuning, Interval.fromSemitones(fret))
      const midiNote = Note.midi(noteToCheck)
      if (midiNote === null) return false
      return scaleNotesSimple.includes(midiNote % 12)
    }
  },
  getColumnMode: (columnIdx) => {
    const s = get()
    const overrides = s.measures[s.currentMeasure]?.modeOverrides || []
    const override = overrides.find(o => o.columnIdx === columnIdx)
    return override ? override.mode : null
  },
  isColumnSelected: (columnIdx) => get().selectedColumns.includes(columnIdx),

  initializeMeasures: () => {
    const s = get()
    if (s.measures.length === 0) {
      const newMeasures: TabMeasure[] = []
      for (let i = 0; i < 4; i++) {
        newMeasures.push({
          data: createEmptyMeasure(s.tuning.split(',').length, s.columns),
          modeOverrides: [],
          indexPositions: createDefaultIndexPositions(s.columns),
          rhythmValues: createDefaultRhythmValues(s.columns)
        })
      }
      set({ measures: newMeasures })
    }
  },
  setTempo: (newTempo) => set({ tempo: newTempo }),
  setTuning: (newTuning) => set({ tuning: newTuning }),
  toggleMetronome: () => set(s => ({ metronomeEnabled: !s.metronomeEnabled })),
  setMetronomeEnabled: (value) => set({ metronomeEnabled: value }),
  toggleFilterByScale: () => set(s => ({ filterByScaleEnabled: !s.filterByScaleEnabled })),
  setFilterByScaleEnabled: (value) => set({ filterByScaleEnabled: value }),
  setCurrentMeasure: (measureIdx) => {
    const s = get()
    if (measureIdx >= 0 && measureIdx < s.measures.length) {
      set({ currentMeasure: measureIdx })
    }
  },
  addMeasure: () => {
    const s = get()
    const emptyMeasure = createEmptyMeasure(s.tuning.split(',').length, s.columns)
    const newMeasures = [...s.measures, {
      data: emptyMeasure,
      modeOverrides: [],
      indexPositions: createDefaultIndexPositions(s.columns),
      rhythmValues: createDefaultRhythmValues(s.columns)
    }]
    set({ measures: newMeasures, currentMeasure: newMeasures.length - 1 })
  },
  deleteMeasure: () => {
    const s = get()
    if (s.measures.length <= 1) return
    const newMeasures = [...s.measures]
    newMeasures.splice(s.currentMeasure, 1)
    const newCurrentMeasure = s.currentMeasure >= newMeasures.length ? newMeasures.length - 1 : s.currentMeasure
    set({ measures: newMeasures, currentMeasure: newCurrentMeasure })
  },
  previousMeasure: () => {
    const s = get()
    if (s.currentMeasure > 0) {
      set({ currentMeasure: s.currentMeasure - 1 })
    }
    get().clearSelection()
  },
  nextMeasure: () => {
    const s = get()
    if (s.currentMeasure < s.measures.length - 1) {
      set({ currentMeasure: s.currentMeasure + 1 })
    } else {
      get().addMeasure()
    }
    get().clearSelection()
  },
  setCurrentEditingCell: (stringIndex, columnIndex) => set({ currentEditingCell: { string: stringIndex, column: columnIndex } }),
  clearCurrentEditingCell: () => set({ currentEditingCell: null }),
  updateIndexPosition: (columnIndex, value) => {
    const s = get()
    if (s.measures[s.currentMeasure] && value >= 0 && value <= 24) {
      const newMeasures = s.measures.map((m, idx) => {
        if (idx !== s.currentMeasure) return m
        const newPositions = [...m.indexPositions]
        newPositions[columnIndex] = value
        return { ...m, indexPositions: newPositions }
      })
      set({ measures: newMeasures })
    }
  },
  updateCellValue: (stringIndex, columnIndex, value) => {
    const s = get()
    if (s.measures[s.currentMeasure]) {
      const newMeasures = s.measures.map((m, idx) => {
        if (idx !== s.currentMeasure) return m
        const newData = m.data.map((row, rIdx) => {
          if (rIdx !== stringIndex) return row
          const newRow = [...row]
          newRow[columnIndex] = value
          return newRow
        })
        return { ...m, data: newData }
      })
      set({ measures: newMeasures })
    }
  },
  flatUpdateCellValue: (stringIndex, globalCol, value) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    if (s.measures[measureIdx]) {
      const newMeasures = s.measures.map((m, idx) => {
        if (idx !== measureIdx) return m
        const newData = m.data.map((row, rIdx) => {
          if (rIdx !== stringIndex) return row
          const newRow = [...row]
          newRow[localCol] = value
          return newRow
        })
        return { ...m, data: newData }
      })
      set({ measures: newMeasures })
    }
  },
  flatUpdateIndexPosition: (globalCol, value) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    if (s.measures[measureIdx] && value >= 0 && value <= 24) {
      const newMeasures = s.measures.map((m, idx) => {
        if (idx !== measureIdx) return m
        const newPositions = [...m.indexPositions]
        newPositions[localCol] = value
        return { ...m, indexPositions: newPositions }
      })
      set({ measures: newMeasures })
    }
  },
  flatUpdateRhythmValue: (globalCol, value) => {
    const s = get()
    const measureIdx = Math.floor(globalCol / s.columns)
    const localCol = globalCol % s.columns
    if (s.measures[measureIdx]) {
      const newMeasures = s.measures.map((m, idx) => {
        if (idx !== measureIdx) return m
        const newRhythm = [...m.rhythmValues]
        newRhythm[localCol] = value
        return { ...m, rhythmValues: newRhythm }
      })
      set({ measures: newMeasures })
    }
  },
  cycleRhythmValue: (globalCol) => {
    const s = get()
    const current = s.flatRhythmValue(globalCol)
    const options = [0, 1, 2, 4, 8, 16, 32, 64]
    const idx = options.indexOf(current)
    const next = options[(idx + 1) % options.length]
    s.flatUpdateRhythmValue(globalCol, next)
  },
  ensureColumn: (globalCol) => {
    const s = get()
    const neededMeasures = Math.floor(globalCol / s.columns) + 1
    if (s.measures.length < neededMeasures) {
      const newMeasures = [...s.measures]
      while (newMeasures.length < neededMeasures) {
        newMeasures.push({
          data: createEmptyMeasure(s.tuning.split(',').length, s.columns),
          modeOverrides: [],
          indexPositions: createDefaultIndexPositions(s.columns),
          rhythmValues: createDefaultRhythmValues(s.columns)
        })
      }
      set({ measures: newMeasures })
    }
  },
  togglePlayback: () => {
    const s = get()
    const newIsPlaying = !s.isPlaying
    set({ isPlaying: newIsPlaying })
    if (newIsPlaying && s.currentPlayingColumn === -1) {
      set({ currentPlayingColumn: 0 })
    }
  },
  stopPlayback: () => set({ isPlaying: false, currentPlayingColumn: -1 }),
  setCurrentPlayingColumn: (columnIdx) => set({ currentPlayingColumn: columnIdx }),
  incrementPlayingColumn: () => {
    const s = get()
    const next = s.currentPlayingColumn + 1
    if (next >= s.columns) {
      if (s.currentMeasure < s.measures.length - 1) {
        set({ currentPlayingColumn: 0, currentMeasure: s.currentMeasure + 1 })
      } else {
        set({ currentPlayingColumn: 0, currentMeasure: 0 })
      }
    } else {
      set({ currentPlayingColumn: next })
    }
  },
  updateSelection: (start, end) => {
    const selected: number[] = []
    for (let i = start; i <= end; i++) selected.push(i)
    set({ selectionStart: start, selectionEnd: end, selectedColumns: selected })
  },
  clearSelection: () => set({ selectedColumns: [], selectionStart: 0, selectionEnd: 0 }),
  setActiveColumn: (col) => set({ activeColumn: col }),
  applyModeOverride: (mode) => {
    const s = get()
    if (s.selectedColumns.length === 0) return
    if (!s.measures[s.currentMeasure]) return
    const newMeasures = s.measures.map((m, idx) => {
      if (idx !== s.currentMeasure) return m
      let overrides = m.modeOverrides.filter(o => !s.selectedColumns.includes(o.columnIdx))
      if (mode) {
        for (const columnIdx of s.selectedColumns) {
          overrides.push({ measureIdx: s.currentMeasure, columnIdx, mode })
        }
      }
      return { ...m, modeOverrides: overrides }
    })
    set({ measures: newMeasures })
  },
  insertColumnAt: (index) => {
    const s = get()
    if (!s.measures[s.currentMeasure]) return
    const newMeasures = s.measures.map((m, idx) => {
      if (idx !== s.currentMeasure) return m
      const newData = m.data.map(row => {
        const newRow = [...row]
        newRow.splice(index, 0, '-')
        if (newRow.length > s.columns) newRow.pop()
        return newRow
      })
      const newOverrides = m.modeOverrides.map(override => {
        if (override.columnIdx >= index) return { ...override, columnIdx: override.columnIdx + 1 }
        return override
      })
      return { ...m, data: newData, modeOverrides: newOverrides }
    })
    set({ measures: newMeasures, selectedColumns: [], selectionStart: 0, selectionEnd: 0 })
  },
  insertColumnLeft: () => {
    const s = get()
    if (s.selectedColumns.length === 0) return
    get().insertColumnAt(Math.min(...s.selectedColumns))
  },
  insertColumnRight: () => {
    const s = get()
    if (s.selectedColumns.length === 0) return
    get().insertColumnAt(Math.max(...s.selectedColumns) + 1)
  },
  dropProgressionAt: (progression, columnIndex) => {
    if (!progression || !Array.isArray(progression) || progression.length === 0) return
    const s = get()
    if (!s.measures[s.currentMeasure]) return
    const isChordProgression = progression.some((item: any) => item.type === 'chord')
    if (isChordProgression) {
      get().handleChordProgression(progression, columnIndex)
    } else {
      get().handleNoteProgression(progression, columnIndex)
    }
  },
  handleChordProgression: (chords, startColumn) => {
    const s = get()
    chords.forEach((chord: any, index: number) => {
      const colIndex = startColumn + index
      if (colIndex >= s.columns) return
      if (chord.mode) {
        const currentSelection = [...s.selectedColumns]
        set({ selectedColumns: [colIndex] })
        get().applyModeOverride(chord.mode)
        set({ selectedColumns: currentSelection })
      }
      if (chord.notes && Array.isArray(chord.notes)) {
        get().placeNotesInColumn(chord.notes, colIndex)
      }
    })
  },
  handleNoteProgression: (notes, startColumn) => {
    const s = get()
    notes.forEach((note: any, index: number) => {
      const colIndex = startColumn + index
      if (colIndex >= s.columns) return
      get().placeNotesInColumn([note], colIndex)
    })
  },
  placeNotesInColumn: (notes, columnIndex) => {
    const s = get()
    const tuningArray = s.tuning.split(',').reverse()
    notes.forEach((note: any, index: number) => {
      if (index >= tuningArray.length) return
      const noteName = typeof note === 'string' ? note : note.name
      if (!noteName) return
      const bestPosition = get().findBestPosition(noteName, tuningArray)
      if (bestPosition) {
        get().updateCellValue(bestPosition.string, columnIndex, bestPosition.fret.toString())
      }
    })
  },
  findBestPosition: (noteName, tuningArray) => {
    const targetMidi = Note.midi(noteName)
    if (targetMidi === null) return null
    let bestPosition: { string: number; fret: number } | null = null
    let minDistance = Infinity
    tuningArray.forEach((stringNote, stringIndex) => {
      const openStringMidi = Note.midi(stringNote)
      if (openStringMidi === null) return
      for (let fret = 0; fret <= 24; fret++) {
        const fretMidi = openStringMidi + fret
        if (fretMidi % 12 === targetMidi % 12) {
          const distance = Math.abs(fretMidi - targetMidi)
          if (distance < minDistance) {
            minDistance = distance
            bestPosition = { string: stringIndex, fret }
          }
          if (fret >= 0 && fret <= 5) return
        }
      }
    })
    return bestPosition
  },
}))
