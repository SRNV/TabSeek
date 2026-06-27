import { create } from 'zustand'
import { Note } from 'tonal'

export type LegatoBehavior = 'demi-tons' | 'tierces' | 'quintes' | 'septiemes' | 'octaves' | 'free' | 'gamme'

export interface TablatureNote {
  id: string
  string: number    // 0 = low E … 5 = high e
  startBeat: number
  duration: number
  fret: number
  legatoNext?: string   // ID of the destination note
  legatoPrev?: string
  legatoCount?: number  // Number of intermediate chromatic notes
  legatoBehavior?: LegatoBehavior
  intermediateNoteIds?: string[] // IDs of generated notes
  legatoRatio?: { t: number; stringT: number } // Position relative to source/dest
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
  updateNote: (id: string, patch: Partial<Omit<TablatureNote, 'id'>>, tuning?: string[], scaleNotes?: string[]) => void
  deleteNote:            (id: string) => void
  addChordGroup:         (noteIds: string[], chordName: string) => string
  removeChordGroup:      (id: string) => void
  addProgressionGroup:    (chordGroupIds: string[], name: string) => string
  updateProgressionGroup: (id: string, patch: Partial<Pick<ProgressionGroup, 'name' | 'chordGroupIds'>>) => void
  removeProgressionGroup: (id: string) => void
  setLegato: (sourceId: string, destId: string | undefined, count?: number, tuning?: string[]) => void
  setLegatoBehavior: (sourceId: string, behavior: LegatoBehavior, tuning: string[], scaleNotes: string[]) => void
  syncLegato: (sourceId: string, tuning: string[], scaleNotes?: string[]) => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
}

function uid() { return Math.random().toString(36).slice(2, 10) }

function syncLegatoHelper(notes: TablatureNote[], sourceId: string, tuning: string[], scaleNotes?: string[]) {
  const src = notes.find(n => n.id === sourceId)
  if (!src || !src.legatoNext) return notes
  const dest = notes.find(n => n.id === src.legatoNext)
  if (!dest) return notes

  const ids = new Set(src.intermediateNoteIds ?? [])
  if (ids.size === 0) return notes
  
  const behavior = src.legatoBehavior || 'demi-tons'
  
  // X positions and Durations
  const x1 = src.startBeat + src.duration
  const x2 = dest.startBeat
  const totalX = Math.max(0.1, x2 - x1)
  
  // Y positions (Strings)
  const y1 = src.string
  const y2 = dest.string
  
  // MIDI / Pitch Gradient
  const srcOpenMidi = Note.midi(tuning[src.string] ?? 'E2') ?? 0
  const destOpenMidi = Note.midi(tuning[dest.string] ?? 'E2') ?? 0
  const srcMidi = srcOpenMidi + src.fret
  const destMidi = destOpenMidi + dest.fret
  
  const orderedIds = src.intermediateNoteIds || []
  const count = orderedIds.length
  const duration = Math.max(0.05, totalX / count)

  return notes.map(n => {
    const idx = orderedIds.indexOf(n.id)
    if (idx === -1) return n
    
    // Position based on index to ensure contiguity
    const startBeat = x1 + idx * duration
    const t = (idx + 1) / (count + 1)
    
    let string = Math.round(y1 + (y2 - y1) * t)
    const diff = destMidi - srcMidi
    const dir = diff > 0 ? 1 : diff < 0 ? -1 : 0
    
    let targetMidi = srcMidi + (destMidi - srcMidi) * t
    
    // Legato Behavior Snapping
    if (behavior !== 'free' && dir !== 0) {
      if (behavior === 'demi-tons') {
        targetMidi = srcMidi + dir * (idx + 1)
      } else if (behavior === 'octaves') {
        targetMidi = srcMidi + dir * 12 * (idx + 1)
      } else if (behavior === 'quintes') {
        targetMidi = srcMidi + dir * 7 * (idx + 1)
      } else if (behavior === 'tierces') {
        targetMidi = srcMidi + dir * 4 * (idx + 1)
      } else if (scaleNotes && scaleNotes.length > 0) {
        let allowedChromas: Set<number>
        
        if (behavior === 'septiemes') {
          allowedChromas = new Set([
            Note.chroma(scaleNotes[0])!,
            Note.chroma(scaleNotes[Math.min(2, scaleNotes.length - 1)])!,
            Note.chroma(scaleNotes[Math.min(4, scaleNotes.length - 1)])!,
            Note.chroma(scaleNotes[Math.min(6, scaleNotes.length - 1)])!
          ])
        } else {
          allowedChromas = new Set(scaleNotes.map(pc => Note.chroma(pc)!))
        }

        const isAsc = dir > 0
        const seq: number[] = []
        let m = srcMidi
        // Build a sequence of allowed notes starting from src
        while (seq.length < count) {
          m += isAsc ? 1 : -1
          if (allowedChromas.has((m % 12 + 12) % 12)) {
            seq.push(m)
          }
        }

        if (seq.length > 0) {
          targetMidi = seq[idx]
        }
      }
    }

      let fret = Math.round(targetMidi - (Note.midi(tuning[string] ?? 'E2') ?? 0))
      
      // If fret is invalid (>24 or <0), try to find a better string for this pitch
      if (fret < 0 || fret > 24) {
        for (let sIdx = 0; sIdx < tuning.length; sIdx++) {
          const openM = Note.midi(tuning[sIdx] ?? 'E2') ?? 0
          const f = Math.round(targetMidi - openM)
          if (f >= 0 && f <= 24) {
            string = sIdx
            fret = f
            break
          }
        }
      }

      // Final clamp to ensure we never display > 24
      fret = Math.max(0, Math.min(24, fret))
      
      return {
        ...n,
        string,
        fret,
        startBeat: Math.max(x1, startBeat),
        duration: Math.max(0.05, duration),
        legatoRatio: { t, stringT: t }
      }
  })
}

export const useTablatureR3FStore = create<State>((set) => ({
  notes: [], chordGroups: [], progressionGroups: [], past: [], future: [],

  addNote: (n) => {
    const id = uid()
    set(s => ({ notes: [...s.notes, { ...n, id }] }))
    return id
  },

  updateNote: (id, patch, tuning, scaleNotes) =>
    set(s => {
      const newNotes = s.notes.map(n => n.id === id ? { ...n, ...patch } : n)
      const note = newNotes.find(n => n.id === id)
      
      let finalNotes = newNotes
      if (tuning) {
        if (note?.legatoNext) finalNotes = syncLegatoHelper(finalNotes, id, tuning, scaleNotes)
        if (note?.legatoPrev) finalNotes = syncLegatoHelper(finalNotes, note.legatoPrev, tuning, scaleNotes)
      }
      return { notes: finalNotes }
    }),


  // Cascade: removes note → prunes empty chord groups → prunes empty progression groups
  deleteNote: (id) =>
    set(s => {
      const note = s.notes.find(n => n.id === id)
      const intermediateToRemove = new Set(note?.intermediateNoteIds ?? [])
      
      // If deleting a destination, also remove intermediate notes of the source
      if (note?.legatoPrev) {
        const source = s.notes.find(n => n.id === note.legatoPrev)
        if (source?.intermediateNoteIds) {
          source.intermediateNoteIds.forEach(inid => intermediateToRemove.add(inid))
        }
      }
      
      const newGroups = s.chordGroups
        .map(g => ({ ...g, noteIds: g.noteIds.filter(nid => nid !== id && !intermediateToRemove.has(nid)) }))
        .filter(g => g.noteIds.length > 0)
      const validGroupIds = new Set(newGroups.map(g => g.id))
      
      return {
        notes: s.notes
          .filter(n => n.id !== id && !intermediateToRemove.has(n.id))
          .map(n => ({
            ...n,
            legatoNext: n.legatoNext === id ? undefined : n.legatoNext,
            legatoPrev: n.legatoPrev === id ? undefined : n.legatoPrev,
            intermediateNoteIds: n.legatoNext === id ? [] : n.intermediateNoteIds?.filter(inid => inid !== id)
          })),
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

  updateProgressionGroup: (id, patch) =>
    set(s => ({
      progressionGroups: s.progressionGroups.map(p => p.id === id ? { ...p, ...patch } : p),
    })),

  removeProgressionGroup: (id) =>
    set(s => {
      const prog = s.progressionGroups.find(p => p.id === id)
      if (!prog) return s
      const gIds = new Set(prog.chordGroupIds)
      const notesInGroups = s.notes.filter(n => s.chordGroups.some(g => gIds.has(g.id) && g.noteIds.includes(n.id)))
      const nIds = new Set(notesInGroups.map(n => n.id))
      const intermediateIds = new Set(notesInGroups.flatMap(n => n.intermediateNoteIds ?? []))
      
      const toRemove = new Set([...nIds, ...intermediateIds])

      return {
        notes: s.notes.filter(n => !toRemove.has(n.id)),
        chordGroups: s.chordGroups.filter(g => !gIds.has(g.id)),
        progressionGroups: s.progressionGroups.filter(p => p.id !== id),
      }
    }),

  setLegato: (sourceId, destId, count = 2, tuning) =>
    set(s => {
      const source = s.notes.find(n => n.id === sourceId)
      const dest = s.notes.find(n => n.id === destId)
      if (!source || !dest) return s

      // Clean old intermediate notes if any
      const oldIntermediateIds = new Set(source.intermediateNoteIds ?? [])
      
      const newIntermediateNotes: TablatureNote[] = []
      const newIntermediateIds: string[] = []

      // Generate intermediate notes (chromatic slide)
      const startBeat = source.startBeat + source.duration
      const endBeat = dest.startBeat
      const duration = count > 0 ? (endBeat - startBeat) / count : 0
      
      const srcOpenMidi = tuning ? (Note.midi(tuning[source.string] ?? 'E2') ?? 0) : 0
      const destOpenMidi = tuning ? (Note.midi(tuning[dest.string] ?? 'E2') ?? 0) : 0
      const srcMidi = srcOpenMidi + source.fret
      const destMidi = destOpenMidi + dest.fret
      
      for (let i = 0; i < count; i++) {
        const id = uid()
        const t = (i + 0.5) / count
        
        // String interpolation
        const string = tuning ? Math.round(source.string + (dest.string - source.string) * t) : source.string
        
        let fret = 0
        if (tuning) {
          const targetMidi = srcMidi + (destMidi - srcMidi) * t
          const currentOpenMidi = Note.midi(tuning[string] ?? 'E2') ?? 0
          fret = Math.round(targetMidi - currentOpenMidi)
        } else {
          fret = Math.round(source.fret + (dest.fret - source.fret) * t)
        }

        newIntermediateNotes.push({
          id,
          string,
          fret: Math.max(0, fret),
          startBeat: startBeat + i * duration,
          duration: Math.max(0.1, duration),
          legatoRatio: { t, stringT: t }
        })
        newIntermediateIds.push(id)
      }

      return {
        notes: [
          ...s.notes.filter(n => !oldIntermediateIds.has(n.id)).map(n => 
            n.id === sourceId ? { ...n, legatoNext: destId, legatoCount: count, intermediateNoteIds: newIntermediateIds } :
            n.id === destId ? { ...n, legatoPrev: sourceId } : n
          ),
          ...newIntermediateNotes
        ]
      }
    }),

  setLegatoBehavior: (sourceId, behavior, tuning, scaleNotes) =>
    set(s => {
      const source = s.notes.map(n => n.id === sourceId ? { ...n, legatoBehavior: behavior } : n)
      const finalNotes = syncLegatoHelper(source, sourceId, tuning, scaleNotes)
      return { notes: finalNotes }
    }),

  syncLegato: (sourceId, tuning, scaleNotes) =>
    set(s => ({
      notes: syncLegatoHelper(s.notes, sourceId, tuning, scaleNotes)
    })),

  addLegatoIntermediate: (noteId, tuning, scaleNotes) =>
    set(s => {
      const source = s.notes.find(n => n.intermediateNoteIds?.includes(noteId))
      if (!source || !source.legatoNext) return s
      
      const id = uid()
      const clickedNote = s.notes.find(n => n.id === noteId)!
      
      const newIntermediateIds = [...source.intermediateNoteIds!]
      newIntermediateIds.splice(newIntermediateIds.indexOf(noteId) + 1, 0, id)

      // 1. First, create the new state with the added note and updated source count/ids
      // This ensures syncLegatoHelper sees the correct total count.
      const baseNotes = [
        ...s.notes.map(n => n.id === source.id ? { ...n, legatoCount: (n.legatoCount || 0) + 1, intermediateNoteIds: newIntermediateIds } : n),
        {
          id,
          string: clickedNote.string,
          fret: clickedNote.fret,
          startBeat: clickedNote.startBeat + clickedNote.duration / 2,
          duration: clickedNote.duration / 2,
        }
      ]
      
      // 2. Then sync the entire legato chain
      const syncedNotes = syncLegatoHelper(baseNotes, source.id, tuning, scaleNotes)
      
      return { notes: syncedNotes }
    }),

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
