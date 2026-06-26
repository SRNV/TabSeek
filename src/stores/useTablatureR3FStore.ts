import { create } from 'zustand'

export interface TablatureNote {
  id: string
  string: number    // 0 = low E … 5 = high e
  startBeat: number
  duration: number
  fret: number
}

export interface ChordGroup {
  id: string
  noteIds: string[]
  chordName: string   // e.g. "Cmaj7", "Am", "G7"
}

const MAX_HISTORY = 60

type HistoryEntry = { notes: TablatureNote[]; groups: ChordGroup[] }

interface State {
  notes:       TablatureNote[]
  chordGroups: ChordGroup[]
  past:        HistoryEntry[]
  future:      HistoryEntry[]

  addNote:          (n: Omit<TablatureNote, 'id'>) => string
  updateNote:       (id: string, patch: Partial<Omit<TablatureNote, 'id'>>) => void
  deleteNote:       (id: string) => void
  addChordGroup:    (noteIds: string[], chordName: string) => string
  removeChordGroup: (id: string) => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
}

export const useTablatureR3FStore = create<State>((set) => ({
  notes: [], chordGroups: [], past: [], future: [],

  addNote: (n) => {
    const id = Math.random().toString(36).slice(2, 10)
    set(s => ({ notes: [...s.notes, { ...n, id }] }))
    return id
  },

  updateNote: (id, patch) =>
    set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...patch } : n) })),

  // Auto-removes note from chord groups; deletes empty groups
  deleteNote: (id) =>
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
      chordGroups: s.chordGroups
        .map(g => ({ ...g, noteIds: g.noteIds.filter(nid => nid !== id) }))
        .filter(g => g.noteIds.length > 0),
    })),

  addChordGroup: (noteIds, chordName) => {
    const id = Math.random().toString(36).slice(2, 10)
    set(s => ({ chordGroups: [...s.chordGroups, { id, noteIds, chordName }] }))
    return id
  },

  removeChordGroup: (id) =>
    set(s => ({ chordGroups: s.chordGroups.filter(g => g.id !== id) })),

  pushHistory: () =>
    set(s => ({
      past:   [...s.past.slice(-(MAX_HISTORY - 1)), { notes: s.notes, groups: s.chordGroups }],
      future: [],
    })),

  undo: () => set(s => {
    if (s.past.length === 0) return s
    const prev = s.past[s.past.length - 1]
    return {
      notes:       prev.notes,
      chordGroups: prev.groups,
      past:        s.past.slice(0, -1),
      future:      [{ notes: s.notes, groups: s.chordGroups }, ...s.future.slice(0, MAX_HISTORY - 1)],
    }
  }),

  redo: () => set(s => {
    if (s.future.length === 0) return s
    const next = s.future[0]
    return {
      notes:       next.notes,
      chordGroups: next.groups,
      past:        [...s.past.slice(-(MAX_HISTORY - 1)), { notes: s.notes, groups: s.chordGroups }],
      future:      s.future.slice(1),
    }
  }),
}))
