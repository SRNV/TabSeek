import { create } from 'zustand'
import { Note, Chord } from 'tonal'
import { findNearestFretForMidi } from '../utils/guitarUtils'

export type LegatoBehavior = 
  'chromatique' | 'secondes' | 'tierces' | 'quartes' | 'quintes' | 'sixtes' | 'septiemes' | 'octaves' | 
  'gamme' | 'pentatonique' | 'triade' | 'arp7' | 'blues' | 'free' | 'whole-tone' | 'diminished'

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
  legatoAuto?: boolean  // If true, moving source/dest moves intermediate notes (default true)
  legatoChain?: boolean // If true, moving an intermediate note syncs the following ones (default false)
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

export type RhythmModifierMode = 'proportional' | 'extended'

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'downup'

export interface RhythmModifier {
  id: string
  kind?: 'rhythm' | 'arpeggio'  // defaults to 'rhythm' when absent
  targetType: 'note' | 'chord' | 'progression'
  targetId: string      // noteId, chordGroupId, or progressionGroupId
  patternName: string   // Reference to rhythmPatterns (unused for kind='arpeggio')
  activeTracks: string[] // e.g. ["kick", "snare"]
  mode: RhythmModifierMode
  enabled: boolean
  fillGaps?: boolean    // stretch each virtual note to the next onset (no silence between notes)
  stringTrackOverrides?: Record<string, string>  // noteId -> track.part ('__all__' = merged default)
  arpeggioDirection?: ArpeggioDirection   // kind='arpeggio' only
  arpeggioNoteCount?: number              // kind='arpeggio' only
  arpeggioOrigNotes?: { string: number; fret: number; startBeat: number; duration: number }[]  // simultaneous chord notes removed by the arpeggio, restored on dematerialize
  legato?: boolean      // materialize sub-notes as real legato notes (source → intermediates → dest)
  // Single-chain fields — used for targetType='note' (one base note, one chain).
  legatoBaseNoteId?: string  // ID of the base note that was used as legato source (reliable across chord lookups)
  legatoExtras?: string[]  // IDs of materialized notes (dest + intermediates), excluding the base note
  legatoOrigRange?: { startBeat: number; duration: number }  // base note range before legato was applied
  // Multi-chain fields — used for targetType='chord': every note of the chord gets its own
  // independent materialized chain (not just the root), so the rhythm applies to the whole chord.
  legatoChains?: { baseNoteId: string; extras: string[]; origRange: { startBeat: number; duration: number } }[]
}

// A Mode pod doesn't target a note/chord/progression — it's a pure time zone that imposes a
// musical mode from its position up to the next ModeZone (or the end of the piece). No
// "length"/duration field by design: the influence zone is always implicit, never explicit.
export const MODE_ZONE_MIN_LENGTH = 0.125 // 1/8 of a measure — hard floor when resizing

export interface ModeZone {
  id: string
  startBeat: number
  length: number      // in measures (1 = one measure); >= MODE_ZONE_MIN_LENGTH
  modeName: string   // references EXTRA_MODES (composables/extraModes.ts) by .name
  forceNote: boolean
  color: string       // hex chosen by the user, drives the measure-tint gradient
}

const MAX_HISTORY = 60

type HistoryEntry = {
  notes:        TablatureNote[]
  groups:       ChordGroup[]
  progressions: ProgressionGroup[]
  rhythmModifiers: RhythmModifier[]
  modeZones:    ModeZone[]
}

interface State {
  notes:            TablatureNote[]
  chordGroups:      ChordGroup[]
  progressionGroups: ProgressionGroup[]
  rhythmModifiers:  RhythmModifier[]
  modeZones:        ModeZone[]
  legatoSourceId:    string | null
  past:             HistoryEntry[]
  future:           HistoryEntry[]

  setLegatoSourceId: (id: string | null) => void

  // Playback
  isPlaying: boolean
  playbackBeat: number
  tempo: number
  isLooping: boolean
  isFollowing: boolean
  togglePlayback: () => void
  setPlaybackBeat: (beat: number) => void
  setTempo: (tempo: number) => void
  setLooping: (loop: boolean) => void
  setFollowing: (follow: boolean) => void

  addNote:               (n: Omit<TablatureNote, 'id'>) => string
  updateNote: (id: string, patch: Partial<Omit<TablatureNote, 'id'>>, tuning?: string[], scaleNotes?: string[]) => void
  deleteNote:            (id: string, tuning?: string[]) => void
  addChordGroup:         (noteIds: string[], chordName: string) => string
  removeChordGroup:      (id: string) => void
  // Swaps a chord group's constituent notes for a brand new voicing in one atomic step
  // (chord type cycling/search/arpeggio) — bypasses deleteNote's empty-group cascade so the
  // group id (and any progression referencing it) survives.
  replaceChordGroupVoicing: (groupId: string, notes: Omit<TablatureNote, 'id'>[], chordName: string) => string[]
  // Swaps an entire progression's chord groups for a new set built from a different template,
  // in one atomic step (progression template cycling) — bypasses removeProgressionGroup's
  // "delete progression when empty" cascade.
  replaceProgressionContent: (progId: string, chordEntries: { notes: Omit<TablatureNote, 'id'>[]; chordName: string }[], name?: string) => void
  // Overwrites a chord group's noteIds in place (used by the arpeggiator, which adds/removes
  // notes one at a time via addNote/deleteNote and then re-syncs the group's membership).
  setChordGroupNoteIds: (groupId: string, noteIds: string[]) => void
  addProgressionGroup:    (chordGroupIds: string[], name: string) => string
  updateProgressionGroup: (id: string, patch: Partial<Pick<ProgressionGroup, 'name' | 'chordGroupIds'>>) => void
  removeProgressionGroup: (id: string) => void
  addRhythmModifier: (mod: Omit<RhythmModifier, 'id'>) => string
  updateRhythmModifier: (id: string, patch: Partial<Omit<RhythmModifier, 'id'>>) => void
  removeRhythmModifier: (id: string) => void
  addModeZone: (startBeat: number, modeName: string) => string
  updateModeZone: (id: string, patch: Partial<Omit<ModeZone, 'id'>>) => void
  removeModeZone: (id: string) => void
  setLegato: (sourceId: string, destId: string | undefined, count?: number, tuning?: string[]) => void
  setLegatoBehavior: (sourceId: string, behavior: LegatoBehavior, tuning: string[], scaleNotes: string[]) => void
  setLegatoAuto: (sourceId: string, enabled: boolean) => void
  setLegatoChain: (sourceId: string, enabled: boolean) => void
  addLegatoIntermediate: (noteId: string, tuning: string[], scaleNotes: string[]) => void
  removeLegatoIntermediate: (noteId: string, tuning: string[], scaleNotes: string[]) => void
  syncLegato: (sourceId: string, tuning: string[], scaleNotes?: string[]) => void
  renderLegato: (sourceId: string) => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
}

function uid() { return Math.random().toString(36).slice(2, 10) }

// Random hue, fixed saturation/lightness for a consistently vivid, legible Mode pod color —
// each newly dropped Mode pod gets its own distinct tint instead of always defaulting to red.
// Plain HSL->RGB math (no THREE dependency in this file).
function randomHexColor(): string {
  const h = Math.random() * 360
  const s = 0.65
  const l = 0.45
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

function getNoteName(openNote: string, fret: number): string {
  const midi = (Note.midi(openNote) ?? 0) + fret
  return Note.fromMidi(midi)
}

function detectChordName(noteIds: string[], allNotes: TablatureNote[], tuning: string[]): string | null {
  const notes = allNotes.filter(n => noteIds.includes(n.id))
  if (notes.length === 0) return null
  // Sort by ascending pitch (not store insertion order) before detecting: Chord.detect is
  // order-sensitive — the same set of notes in a different order can resolve to a different
  // name (e.g. ['C4','E4','G4'] -> "CM" but ['E4','C4','G4'] -> "Em#5"). Insertion order is
  // incidental (depends on note creation history, not the chord's actual shape), so without
  // this sort, moving a note and putting it back unchanged could still rename the chord.
  const pitches = notes
    .map(n => getNoteName(tuning[n.string] ?? 'E2', n.fret))
    .sort((a, b) => (Note.midi(a) ?? 0) - (Note.midi(b) ?? 0))
  const detected = Chord.detect(pitches)
  return detected.length > 0 ? detected[0] : '?'
}

// True when `noteId` is the source/intermediate/destination of a still-linked rhythm-modifier
// legato chain (mod.legato === true). These chains have manually fixed, pattern-derived
// durations — any resync (syncLegatoHelper) would silently resize them, so callers must skip
// it entirely for locked notes regardless of legatoAuto/legatoChain. Local copy of
// RhythmModifierService.isLegatoLocked to avoid a store → service → store circular import.
function isRhythmLegatoLocked(rhythmModifiers: RhythmModifier[], notes: TablatureNote[], noteId: string): boolean {
  return rhythmModifiers.some(m => {
    if (!m.legato) return false
    if (m.legatoChains && m.legatoChains.length > 0) {
      return m.legatoChains.some(chain => {
        if (chain.baseNoteId !== noteId && !chain.extras.includes(noteId)) return false
        const base = notes.find(n => n.id === chain.baseNoteId)
        return !!base?.legatoNext
      })
    }
    if (!m.legatoBaseNoteId) return false
    if (m.legatoBaseNoteId !== noteId && !m.legatoExtras?.includes(noteId)) return false
    const base = notes.find(n => n.id === m.legatoBaseNoteId)
    return !!base?.legatoNext
  })
}

function syncLegatoHelper(notes: TablatureNote[], sourceId: string, tuning: string[], scaleNotes?: string[], startFromId?: string) {
  const srcOrig = notes.find(n => n.id === sourceId)
  if (!srcOrig || !srcOrig.legatoNext) return notes
  const dest = notes.find(n => n.id === srcOrig.legatoNext)
  if (!dest) return notes

  const orderedIds = srcOrig.intermediateNoteIds || []
  const countTotal = orderedIds.length
  if (countTotal === 0) return notes

  // If startFromId is given, we only sync notes strictly after it
  let syncIndex = -1
  if (startFromId) {
    syncIndex = orderedIds.indexOf(startFromId)
  }

  // Segment to interpolate: [SegmentSource, Destination]
  const segmentSource = syncIndex === -1 ? srcOrig : notes.find(n => n.id === startFromId)!
  const notesToSync = orderedIds.slice(syncIndex + 1)
  const countSegment = notesToSync.length
  if (countSegment === 0) return notes
  
  const behavior = srcOrig.legatoBehavior || 'chromatique'
  
  // X positions and Durations
  const x1 = segmentSource.startBeat + segmentSource.duration
  const x2 = dest.startBeat
  const totalX = Math.max(0.1, x2 - x1)
  const duration = Math.max(0.05, totalX / (countSegment + (syncIndex === -1 ? 0 : 0))) // simplistic
  // Actually, if we are chaining, the duration of subsequent notes should probably be uniform in the remaining space
  const uniformDur = totalX / countSegment

  // MIDI / Pitch Gradient
  const srcOpenMidi = Note.midi(tuning[segmentSource.string] ?? 'E2') ?? 0
  const destOpenMidi = Note.midi(tuning[dest.string] ?? 'E2') ?? 0
  const srcMidi = srcOpenMidi + segmentSource.fret
  const destMidi = destOpenMidi + dest.fret
  
  const diff = destMidi - srcMidi
  const dir = diff >= 0 ? 1 : -1
  
  // 1. Determine allowed pitch classes (chromas)
  let allowedChromas: Set<number> | null = null
  
  if (scaleNotes && scaleNotes.length > 0) {
    const scaleChromas = scaleNotes.map(pc => Note.chroma(pc)!)
    const rootChroma = scaleChromas[0]
    
    switch (behavior) {
      case 'gamme':
        allowedChromas = new Set(scaleChromas)
        break
      case 'triade':
        allowedChromas = new Set([scaleChromas[0], scaleChromas[2 % scaleChromas.length], scaleChromas[4 % scaleChromas.length]])
        break
      case 'arp7':
        allowedChromas = new Set([scaleChromas[0], scaleChromas[2 % scaleChromas.length], scaleChromas[4 % scaleChromas.length], scaleChromas[6 % scaleChromas.length]])
        break
      case 'pentatonique':
        const pent: number[] = []
        for (let i = 0; i < 5; i++) {
          const d = [0, 2, 4, 5, 7][i] % scaleChromas.length 
          pent.push(scaleChromas[d])
        }
        allowedChromas = new Set(pent)
        break
      case 'blues':
        allowedChromas = new Set([0, 3, 5, 6, 7, 10].map(c => (rootChroma + c) % 12))
        break
      case 'secondes':
      case 'tierces':
      case 'quartes':
      case 'quintes':
      case 'sixtes':
      case 'septiemes':
        const stepMap: Record<string, number> = { secondes: 1, tierces: 2, quartes: 3, quintes: 4, sixtes: 5, septiemes: 6 }
        const step = stepMap[behavior] || 1
        const subset: number[] = []
        for (let i = 0; i < scaleChromas.length; i += step) subset.push(scaleChromas[i])
        allowedChromas = new Set(subset)
        break
      case 'whole-tone':
        allowedChromas = new Set([0, 2, 4, 6, 8, 10].map(c => (rootChroma + c) % 12))
        break
      case 'diminished':
        allowedChromas = new Set([0, 1, 3, 4, 6, 7, 9, 10].map(c => (rootChroma + c) % 12))
        break
    }
  }

  // 2. Build the sequence of target MIDIs within [srcMidi, destMidi]
  const seq: number[] = []
  const minM = Math.min(srcMidi, destMidi)
  const maxM = Math.max(srcMidi, destMidi)
  
  if (behavior === 'free') {
    for (let i = 0; i < countSegment; i++) {
      const t = (i + 1) / (countSegment + 1)
      seq.push(Math.round(srcMidi + (destMidi - srcMidi) * t))
    }
  } else {
    // Collect ALL valid pitches in range
    const candidates: number[] = []
    
    if (behavior === 'chromatique' || !allowedChromas) {
      for (let m = minM; m <= maxM; m++) candidates.push(m)
    } else {
      for (let m = minM; m <= maxM; m++) {
        if (allowedChromas.has((m % 12 + 12) % 12)) {
          candidates.push(m)
        }
      }
    }
    
    // Sort candidates according to movement direction
    if (dir > 0) candidates.sort((a, b) => a - b)
    else         candidates.sort((a, b) => b - a)
    
    // Remove source and destination from candidates to strictly stay BETWEEN (if possible)
    const filtered = candidates.filter(m => m !== srcMidi && m !== destMidi)
    
    if (filtered.length > 0) {
      // Pick 'countSegment' notes from filtered candidates
      for (let i = 0; i < countSegment; i++) {
        const t = (i + 1) / (countSegment + 1)
        const idx = Math.min(filtered.length - 1, Math.floor(t * filtered.length))
        seq.push(filtered[idx])
      }
    } else {
      // Fallback: interpolate if no candidates in between
      for (let i = 0; i < countSegment; i++) {
        const t = (i + 1) / (countSegment + 1)
        const val = Math.round(srcMidi + (destMidi - srcMidi) * t)
        seq.push(Math.max(minM, Math.min(maxM, val)))
      }
    }
  }

  const idsToUpdateSet = new Set(notesToSync)

  return notes.map(n => {
    if (!idsToUpdateSet.has(n.id)) return n
    const idxInSegment = notesToSync.indexOf(n.id)
    
    const startBeat = x1 + idxInSegment * uniformDur
    const tSeg = (idxInSegment + 1) / (countSegment + 1)
    const tGlobal = (orderedIds.indexOf(n.id) + 1) / (countTotal + 1)
    
    const targetMidi = seq[idxInSegment]
    
    // Physical constraint heuristic: 
    // We try to stay near the "fret position" defined by linear interpolation between source and dest.
    // This minimizes unnecessary hand shifts and keeps notes within a playable span.
    const targetFretPos = segmentSource.fret + (dest.fret - segmentSource.fret) * tSeg
    
    const interpString = Math.round(segmentSource.string + (dest.string - segmentSource.string) * tSeg)
    const nearest = findNearestFretForMidi(tuning, targetMidi, interpString, targetFretPos)
    let string = nearest.si
    let fret = nearest.fret

    return {
      ...n,
      string,
      fret: Math.max(0, Math.min(24, fret)),
      startBeat: Math.max(x1, startBeat),
      duration: Math.max(0.05, uniformDur),
      legatoRatio: { t: tGlobal, stringT: tGlobal }
    }
  })
}

export const useTablatureR3FStore = create<State>((set) => ({
  notes: [], chordGroups: [], progressionGroups: [], rhythmModifiers: [], modeZones: [], past: [], future: [],
  legatoSourceId: null,
  isPlaying: false,
  playbackBeat: 0,
  tempo: 120,
  isLooping: true,
  isFollowing: false,

  setLegatoSourceId: (id) => set({ legatoSourceId: id }),

  togglePlayback: () => set(s => ({ isPlaying: !s.isPlaying })),
  setPlaybackBeat: (beat) => set({ playbackBeat: beat }),
  setTempo: (tempo) => set({ tempo }),
  setLooping: (isLooping) => set({ isLooping }),
  setFollowing: (isFollowing) => set({ isFollowing }),

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
      let finalGroups = s.chordGroups

      if (tuning && note) {
        // Update chord labels for groups containing this note
        finalGroups = s.chordGroups.map(g => {
          if (g.noteIds.includes(id)) {
            const newName = detectChordName(g.noteIds, finalNotes, tuning)
            return { ...g, chordName: newName || g.chordName }
          }
          return g
        })

        // 1. If note is a source/destination and Auto is on
        const source = note.legatoNext ? note : newNotes.find(n => n.id === note.legatoPrev)
        const isAuto = source?.legatoAuto ?? true

        if (source && isAuto && !isRhythmLegatoLocked(s.rhythmModifiers, newNotes, source.id)) {
          finalNotes = syncLegatoHelper(finalNotes, source.id, tuning, scaleNotes)
        }

        // 2. If note is an intermediate note and Chain is on
        if (!source) {
          const actualSource = newNotes.find(n => n.intermediateNoteIds?.includes(id))
          if (actualSource && actualSource.legatoChain && !isRhythmLegatoLocked(s.rhythmModifiers, newNotes, actualSource.id)) {
            // Reactive only when the note (pitch) changes
            if (patch.fret !== undefined || patch.string !== undefined) {
              finalNotes = syncLegatoHelper(finalNotes, actualSource.id, tuning, scaleNotes, id)
            }
          }
        }
      }
      return { notes: finalNotes, chordGroups: finalGroups }
    }),


  // Cascade: removes note → prunes empty chord groups → prunes empty progression groups
  deleteNote: (id, tuning) =>
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
      
      const finalNotes = s.notes
        .filter(n => n.id !== id && !intermediateToRemove.has(n.id))
        .map(n => {
          const isSource = n.legatoNext === id
          const newIntermediateIds = isSource ? [] : n.intermediateNoteIds?.filter(inid => inid !== id)
          // If it was a legato source and now has no intermediate notes, break the legato
          const shouldBreakLegato = n.legatoNext && n.intermediateNoteIds && n.intermediateNoteIds.length > 0 && newIntermediateIds?.length === 0
          
          return {
            ...n,
            legatoNext: (isSource || shouldBreakLegato) ? undefined : n.legatoNext,
            legatoPrev: n.legatoPrev === id ? undefined : n.legatoPrev,
            intermediateNoteIds: newIntermediateIds
          }
        })

      const newGroups = s.chordGroups
        .map(g => {
          const remainingNoteIds = g.noteIds.filter(nid => nid !== id && !intermediateToRemove.has(nid))
          if (remainingNoteIds.length === 0) return null
          if (tuning && remainingNoteIds.length < g.noteIds.length) {
            const newName = detectChordName(remainingNoteIds, finalNotes, tuning)
            return { ...g, noteIds: remainingNoteIds, chordName: newName || g.chordName }
          }
          return { ...g, noteIds: remainingNoteIds }
        })
        .filter((g): g is ChordGroup => g !== null)

      const validGroupIds = new Set(newGroups.map(g => g.id))
      
      // Final cleanup: ensure no orphaned legatoPrev
      const sourceIds = new Set(finalNotes.filter(n => n.legatoNext).map(n => n.id))
      const cleanedNotes = finalNotes.map(n => {
        if (n.legatoPrev && !sourceIds.has(n.legatoPrev)) {
          return { ...n, legatoPrev: undefined }
        }
        return n
      })

      return {
        notes: cleanedNotes,
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

  replaceChordGroupVoicing: (groupId, newNotes, chordName) => {
    const newIds = newNotes.map(() => uid())
    set(s => {
      const group = s.chordGroups.find(g => g.id === groupId)
      if (!group) return s
      const oldIds = new Set(group.noteIds)
      return {
        notes: [
          ...s.notes.filter(n => !oldIds.has(n.id)),
          ...newNotes.map((n, i) => ({ ...n, id: newIds[i] })),
        ],
        chordGroups: s.chordGroups.map(g => g.id === groupId ? { ...g, noteIds: newIds, chordName } : g),
        rhythmModifiers: s.rhythmModifiers.filter(m => !(m.targetType === 'note' && oldIds.has(m.targetId))),
      }
    })
    return newIds
  },

  replaceProgressionContent: (progId, chordEntries, name) =>
    set(s => {
      const prog = s.progressionGroups.find(p => p.id === progId)
      if (!prog) return s
      const oldGroupIds = new Set(prog.chordGroupIds)
      const oldNoteIds = new Set(
        s.chordGroups.filter(g => oldGroupIds.has(g.id)).flatMap(g => g.noteIds)
      )

      const newChordGroups: ChordGroup[] = []
      const newNotes: TablatureNote[] = []
      chordEntries.forEach(({ notes: entryNotes, chordName }) => {
        const ids = entryNotes.map(() => uid())
        entryNotes.forEach((n, i) => newNotes.push({ ...n, id: ids[i] }))
        newChordGroups.push({ id: uid(), noteIds: ids, chordName })
      })

      return {
        notes: [...s.notes.filter(n => !oldNoteIds.has(n.id)), ...newNotes],
        chordGroups: [...s.chordGroups.filter(g => !oldGroupIds.has(g.id)), ...newChordGroups],
        progressionGroups: s.progressionGroups.map(p => p.id === progId
          ? { ...p, chordGroupIds: newChordGroups.map(g => g.id), name: name ?? p.name }
          : p),
        rhythmModifiers: s.rhythmModifiers.filter(m =>
          !(m.targetType === 'note' && oldNoteIds.has(m.targetId)) &&
          !(m.targetType === 'chord' && oldGroupIds.has(m.targetId))
        ),
      }
    }),

  setChordGroupNoteIds: (groupId, noteIds) =>
    set(s => ({
      chordGroups: s.chordGroups.map(g => g.id === groupId ? { ...g, noteIds } : g),
    })),

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
        rhythmModifiers: s.rhythmModifiers.filter(m => m.targetType !== 'progression' || m.targetId !== id),
      }
    }),

  addRhythmModifier: (mod) => {
    const id = uid()
    set(s => ({ rhythmModifiers: [...s.rhythmModifiers, { ...mod, id }] }))
    return id
  },

  updateRhythmModifier: (id, patch) =>
    set(s => ({
      rhythmModifiers: s.rhythmModifiers.map(m => m.id === id ? { ...m, ...patch } : m),
    })),

  removeRhythmModifier: (id) =>
    set(s => ({ rhythmModifiers: s.rhythmModifiers.filter(m => m.id !== id) })),

  addModeZone: (startBeat, modeName) => {
    const id = uid()
    set(s => ({ modeZones: [...s.modeZones, { id, startBeat, length: 1, modeName, forceNote: false, color: randomHexColor() }] }))
    return id
  },

  updateModeZone: (id, patch) =>
    set(s => ({ modeZones: s.modeZones.map(z => z.id === id ? { ...z, ...patch } : z) })),

  removeModeZone: (id) =>
    set(s => ({ modeZones: s.modeZones.filter(z => z.id !== id) })),

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
      if (isRhythmLegatoLocked(s.rhythmModifiers, source, sourceId)) return { notes: source }
      const finalNotes = syncLegatoHelper(source, sourceId, tuning, scaleNotes)
      return { notes: finalNotes }
    }),

  syncLegato: (sourceId: string, tuning: string[], scaleNotes?: string[]) =>
    set(s => {
      if (isRhythmLegatoLocked(s.rhythmModifiers, s.notes, sourceId)) return s
      return { notes: syncLegatoHelper(s.notes, sourceId, tuning, scaleNotes) }
    }),

  renderLegato: (sourceId: string) =>
    set(s => {
      const source = s.notes.find(n => n.id === sourceId)
      if (!source?.legatoNext) return s
      const intermediateIds = new Set(source.intermediateNoteIds ?? [])
      return {
        notes: s.notes.map(n => {
          if (n.id === sourceId)
            return { ...n, legatoNext: undefined, intermediateNoteIds: [], legatoCount: 0 }
          if (n.id === source.legatoNext)
            return { ...n, legatoPrev: undefined }
          if (intermediateIds.has(n.id)) {
            const { legatoRatio, ...rest } = n
            return rest
          }
          return n
        })
      }
    }),

  setLegatoAuto: (sourceId: string, enabled: boolean) =>
    set(s => ({
      notes: s.notes.map(n => n.id === sourceId ? { ...n, legatoAuto: enabled } : n)
    })),

  setLegatoChain: (sourceId: string, enabled: boolean) =>
    set(s => ({
      notes: s.notes.map(n => n.id === sourceId ? { ...n, legatoChain: enabled } : n)
    })),

  addLegatoIntermediate: (noteId: string, tuning: string[], scaleNotes: string[]) =>
    set(s => {
      const source = s.notes.find(n => n.intermediateNoteIds?.includes(noteId))
      if (!source || !source.legatoNext) return s
      if (isRhythmLegatoLocked(s.rhythmModifiers, s.notes, source.id)) return s

      const id = uid()
      const clickedNote = s.notes.find(n => n.id === noteId)!
      
      const newIntermediateIds = [...source.intermediateNoteIds!]
      newIntermediateIds.splice(newIntermediateIds.indexOf(noteId) + 1, 0, id)

      // Split the clicked note in two
      const baseNotes = s.notes.map(n => {
        if (n.id === source.id) return { ...n, legatoCount: (n.legatoCount || 0) + 1, intermediateNoteIds: newIntermediateIds }
        if (n.id === noteId) return { ...n, duration: n.duration / 2 }
        return n
      })
      baseNotes.push({
        id,
        string: clickedNote.string,
        fret: clickedNote.fret,
        startBeat: clickedNote.startBeat + clickedNote.duration / 2,
        duration: clickedNote.duration / 2,
      })
      
      const syncedNotes = syncLegatoHelper(baseNotes, source.id, tuning, scaleNotes)
      return { notes: syncedNotes }
    }),

  removeLegatoIntermediate: (noteId: string, tuning: string[], scaleNotes: string[]) =>
    set(s => {
      const source = s.notes.find(n => n.intermediateNoteIds?.includes(noteId))
      if (!source || !source.legatoNext) return s
      if (isRhythmLegatoLocked(s.rhythmModifiers, s.notes, source.id)) return s

      const newIds = source.intermediateNoteIds!.filter(id => id !== noteId)
      
      if (newIds.length === 0) {
        // Break the legato entirely
        const destId = source.legatoNext
        return {
          notes: s.notes
            .filter(n => n.id !== noteId)
            .map(n => {
              if (n.id === source.id) return { ...n, legatoNext: undefined, legatoCount: 0, intermediateNoteIds: [] }
              if (n.id === destId) return { ...n, legatoPrev: undefined }
              return n
            })
        }
      }

      const baseNotes = s.notes
        .filter(n => n.id !== noteId)
        .map(n => n.id === source.id ? { ...n, legatoCount: newIds.length, intermediateNoteIds: newIds } : n)

      const syncedNotes = syncLegatoHelper(baseNotes, source.id, tuning, scaleNotes)
      return { notes: syncedNotes }
    }),

  pushHistory: () =>
    set(s => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), {
        notes: s.notes, groups: s.chordGroups, progressions: s.progressionGroups, rhythmModifiers: s.rhythmModifiers, modeZones: s.modeZones,
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
      rhythmModifiers:  prev.rhythmModifiers ?? [],
      modeZones:        prev.modeZones ?? [],
      past:             s.past.slice(0, -1),
      future: [{
        notes: s.notes, groups: s.chordGroups, progressions: s.progressionGroups, rhythmModifiers: s.rhythmModifiers, modeZones: s.modeZones,
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
      rhythmModifiers:  next.rhythmModifiers ?? [],
      modeZones:        next.modeZones ?? [],
      past: [...s.past.slice(-(MAX_HISTORY - 1)), {
        notes: s.notes, groups: s.chordGroups, progressions: s.progressionGroups, rhythmModifiers: s.rhythmModifiers, modeZones: s.modeZones,
      }],
      future: s.future.slice(1),
    }
  }),
}))
