import { create } from 'zustand'

export interface TablatureNote {
  id: string
  string: number    // 0 = low E … 5 = high e
  startBeat: number
  duration: number
  fret: number
}

const MAX_HISTORY = 60

interface State {
  notes:   TablatureNote[]
  past:    TablatureNote[][]
  future:  TablatureNote[][]

  addNote:     (n: Omit<TablatureNote, 'id'>) => string
  updateNote:  (id: string, patch: Partial<Omit<TablatureNote, 'id'>>) => void
  deleteNote:  (id: string) => void

  // Call before any significant mutation to create one undo checkpoint
  pushHistory: () => void
  undo: () => void
  redo: () => void
}

export const useTablatureR3FStore = create<State>((set, get) => ({
  notes:  [],
  past:   [],
  future: [],

  addNote: (n) => {
    const id = Math.random().toString(36).slice(2, 10)
    set(s => ({ notes: [...s.notes, { ...n, id }] }))
    return id
  },

  updateNote: (id, patch) =>
    set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...patch } : n) })),

  deleteNote: (id) =>
    set(s => ({ notes: s.notes.filter(n => n.id !== id) })),

  pushHistory: () =>
    set(s => ({
      past:   [...s.past.slice(-(MAX_HISTORY - 1)), s.notes],
      future: [],
    })),

  undo: () =>
    set(s => {
      if (s.past.length === 0) return s
      const prev = s.past[s.past.length - 1]
      return {
        notes:  prev,
        past:   s.past.slice(0, -1),
        future: [s.notes, ...s.future.slice(0, MAX_HISTORY - 1)],
      }
    }),

  redo: () =>
    set(s => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      return {
        notes:  next,
        past:   [...s.past.slice(-(MAX_HISTORY - 1)), s.notes],
        future: s.future.slice(1),
      }
    }),
}))
