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

export interface ProgressionGroup {
  id: string
  chordGroupIds: string[]
  name: string
}

const MAX_HISTORY = 60

type HistoryEntry = {
  notes:        TablatureNote[]
  groups:       ChordGroup[]
  progressions: ProgressionGroup[]
}

interface State {
  notes:            TablatureNote[]
  chordGroups:      ChordGroup[]
  progressionGroups: ProgressionGroup[]
  past:             HistoryEntry[]
  future:           HistoryEntry[]

  addNote:               (n: Omit<TablatureNote, 'id'>) => string
  updateNote:            (id: string, patch: Partial<Omit<TablatureNote, 'id'>>) => void
  deleteNote:            (id: string) => void
  addChordGroup:         (noteIds: string[], chordName: string) => string
  removeChordGroup:      (id: string) => void
  addProgressionGroup:   (chordGroupIds: string[], name: string) => string
  removeProgressionGroup:(id: string) => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export const useTablatureR3FStore = create<State>((set) => ({
  notes: [], chordGroups: [], progressionGroups: [], past: [], future: [],

  addNote: (n) => {
    const id = uid()
    set(s => ({ notes: [...s.notes, { ...n, id }] }))
    return id
  },

  updateNote: (id, patch) =>
    set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...patch } : n) })),

  // Cascade: removes note → prunes empty chord groups → prunes empty progression groups
  deleteNote: (id) =>
    set(s => {
      const newGroups = s.chordGroups
        .map(g => ({ ...g, noteIds: g.noteIds.filter(nid => nid !== id) }))
        .filter(g => g.noteIds.length > 0)
      const validGroupIds = new Set(newGroups.map(g => g.id))
      return {
        notes: s.notes.filter(n => n.id !== id),
        chordGroups: newGroups,
        progressionGroups: s.progressionGroups
          .map(p => ({ ...p, chordGroupIds: p.chordGroupIds.filter(gid => validGroupIds.has(gid)) }))
          .filter(p => p.chordGroupIds.length > 0),
      }
    }),

  // Cascade: removes chord group → prunes empty progression groups
  removeChordGroup: (id) =>
    set(s => ({
      chordGroups: s.chordGroups.filter(g => g.id !== id),
      progressionGroups: s.progressionGroups
        .map(p => ({ ...p, chordGroupIds: p.chordGroupIds.filter(gid => gid !== id) }))
        .filter(p => p.chordGroupIds.length > 0),
    })),

  addChordGroup: (noteIds, chordName) => {
    const id = uid()
    set(s => ({ chordGroups: [...s.chordGroups, { id, noteIds, chordName }] }))
    return id
  },

  addProgressionGroup: (chordGroupIds, name) => {
    const id = uid()
    set(s => ({ progressionGroups: [...s.progressionGroups, { id, chordGroupIds, name }] }))
    return id
  },

  removeProgressionGroup: (id) =>
    set(s => ({ progressionGroups: s.progressionGroups.filter(p => p.id !== id) })),

  pushHistory: () =>
    set(s => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), {
        notes: s.notes, groups: s.chordGroups, progressions: s.progressionGroups,
      }],
      future: [],
    })),

  undo: () => set(s => {
    if (s.past.length === 0) return s
    const prev = s.past[s.past.length - 1]
    return {
      notes:            prev.notes,
      chordGroups:      prev.groups,
      progressionGroups: prev.progressions ?? [],
      past:             s.past.slice(0, -1),
      future: [{
        notes: s.notes, groups: s.chordGroups, progressions: s.progressionGroups,
      }, ...s.future.slice(0, MAX_HISTORY - 1)],
    }
  }),

  redo: () => set(s => {
    if (s.future.length === 0) return s
    const next = s.future[0]
    return {
      notes:            next.notes,
      chordGroups:      next.groups,
      progressionGroups: next.progressions ?? [],
      past: [...s.past.slice(-(MAX_HISTORY - 1)), {
        notes: s.notes, groups: s.chordGroups, progressions: s.progressionGroups,
      }],
      future: s.future.slice(1),
    }
  }),
}))
