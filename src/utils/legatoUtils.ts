/**
 * Pure utility functions for legato chain operations.
 * Extracted from useTablatureR3FStore to keep the store file focused on state management.
 * Also imported by RhythmModifierService (was duplicated there to avoid a circular import —
 * this file is the single source of truth).
 */

import { Note, Chord } from 'tonal'
import { findNearestFretForMidi } from './guitarUtils'
import type { TablatureNote, RhythmModifier, LegatoBehavior } from '../stores/useTablatureR3FStore'

// ── Note name helper ──────────────────────────────────────────────────────────

/** Computes the note name (e.g. "E3", "C#4") for an open string + fret offset. */
export function getNoteNameFromFret(openNote: string, fret: number): string {
  const midi = (Note.midi(openNote) ?? 0) + fret
  return Note.fromMidi(midi)
}

// ── Chord detection ───────────────────────────────────────────────────────────

/**
 * Detects the chord name from a set of note IDs.
 * Sorts by ascending MIDI pitch before Chord.detect to make the result invariant to insertion
 * order (Chord.detect is order-sensitive: ['C4','E4','G4'] → 'CM' but ['E4','C4','G4'] → 'Em#5').
 */
export function detectChordName(
  noteIds: string[],
  allNotes: TablatureNote[],
  tuning: string[]
): string | null {
  const notes = allNotes.filter(n => noteIds.includes(n.id))
  if (notes.length === 0) return null
  const pitches = notes
    .map(n => getNoteNameFromFret(tuning[n.string] ?? 'E2', n.fret))
    .sort((a, b) => (Note.midi(a) ?? 0) - (Note.midi(b) ?? 0))
  const detected = Chord.detect(pitches)
  return detected.length > 0 ? detected[0] : '?'
}

// ── Rhythm-legato lock check ──────────────────────────────────────────────────

/**
 * Returns true when noteId belongs to a still-linked materialized rhythm-modifier legato chain.
 * Locked notes may only change string manually — horizontal move and resize are blocked.
 *
 * Checks the base note's live `legatoNext` field so that "merge" (renderLegato clears
 * legatoNext) and "delete destination" (deleteNote also clears legatoNext) automatically
 * unlock affected notes without any explicit cleanup call.
 */
export function isRhythmLegatoLocked(
  rhythmModifiers: RhythmModifier[],
  notes: TablatureNote[],
  noteId: string
): boolean {
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

// ── Legato interpolation engine ───────────────────────────────────────────────

/**
 * Recomputes the pitch, string, and beat position of all intermediate notes in a legato chain.
 * Pure function: receives the current notes array and returns a new one.
 *
 * @param notes       Current notes array (from store)
 * @param sourceId    ID of the legato source note
 * @param tuning      Tuning array (e.g. ['E2','A2','D3','G3','C4','E4'])
 * @param scaleNotes  Optional scale notes for behavior-aware interpolation
 * @param startFromId Optional: only re-sync intermediate notes after this ID (Chain mode)
 */
export function syncLegatoHelper(
  notes: TablatureNote[],
  sourceId: string,
  tuning: string[],
  scaleNotes?: string[],
  startFromId?: string
): TablatureNote[] {
  const srcOrig = notes.find(n => n.id === sourceId)
  if (!srcOrig || !srcOrig.legatoNext) return notes
  const dest = notes.find(n => n.id === srcOrig.legatoNext)
  if (!dest) return notes

  const orderedIds = srcOrig.intermediateNoteIds || []
  const countTotal = orderedIds.length
  if (countTotal === 0) return notes

  let syncIndex = -1
  if (startFromId) syncIndex = orderedIds.indexOf(startFromId)

  const segmentSource = syncIndex === -1 ? srcOrig : notes.find(n => n.id === startFromId)!
  const notesToSync = orderedIds.slice(syncIndex + 1)
  const countSegment = notesToSync.length
  if (countSegment === 0) return notes

  const behavior: LegatoBehavior = srcOrig.legatoBehavior || 'chromatique'

  const x1 = segmentSource.startBeat + segmentSource.duration
  const x2 = dest.startBeat
  const totalX = Math.max(0.1, x2 - x1)
  const uniformDur = totalX / countSegment

  const srcOpenMidi = Note.midi(tuning[segmentSource.string] ?? 'E2') ?? 0
  const destOpenMidi = Note.midi(tuning[dest.string] ?? 'E2') ?? 0
  const srcMidi = srcOpenMidi + segmentSource.fret
  const destMidi = destOpenMidi + dest.fret
  const diff = destMidi - srcMidi
  const dir = diff >= 0 ? 1 : -1

  // Determine allowed pitch classes for scale-aware behaviors
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
      case 'pentatonique': {
        const pent: number[] = []
        for (let i = 0; i < 5; i++) pent.push(scaleChromas[[0, 2, 4, 5, 7][i] % scaleChromas.length])
        allowedChromas = new Set(pent)
        break
      }
      case 'blues':
        allowedChromas = new Set([0, 3, 5, 6, 7, 10].map(c => (rootChroma + c) % 12))
        break
      case 'secondes': case 'tierces': case 'quartes': case 'quintes': case 'sixtes': case 'septiemes': {
        const stepMap: Record<string, number> = { secondes: 1, tierces: 2, quartes: 3, quintes: 4, sixtes: 5, septiemes: 6 }
        const step = stepMap[behavior] || 1
        const subset: number[] = []
        for (let i = 0; i < scaleChromas.length; i += step) subset.push(scaleChromas[i])
        allowedChromas = new Set(subset)
        break
      }
      case 'whole-tone':
        allowedChromas = new Set([0, 2, 4, 6, 8, 10].map(c => (rootChroma + c) % 12))
        break
      case 'diminished':
        allowedChromas = new Set([0, 1, 3, 4, 6, 7, 9, 10].map(c => (rootChroma + c) % 12))
        break
    }
  }

  // Build the target MIDI sequence
  const seq: number[] = []
  const minM = Math.min(srcMidi, destMidi)
  const maxM = Math.max(srcMidi, destMidi)

  if (behavior === 'free') {
    for (let i = 0; i < countSegment; i++) {
      const t = (i + 1) / (countSegment + 1)
      seq.push(Math.round(srcMidi + (destMidi - srcMidi) * t))
    }
  } else {
    const candidates: number[] = []
    if (behavior === 'chromatique' || !allowedChromas) {
      for (let m = minM; m <= maxM; m++) candidates.push(m)
    } else {
      for (let m = minM; m <= maxM; m++) {
        if (allowedChromas.has((m % 12 + 12) % 12)) candidates.push(m)
      }
    }
    if (dir > 0) candidates.sort((a, b) => a - b)
    else candidates.sort((a, b) => b - a)

    const filtered = candidates.filter(m => m !== srcMidi && m !== destMidi)
    if (filtered.length > 0) {
      for (let i = 0; i < countSegment; i++) {
        const t = (i + 1) / (countSegment + 1)
        seq.push(filtered[Math.min(filtered.length - 1, Math.floor(t * filtered.length))])
      }
    } else {
      for (let i = 0; i < countSegment; i++) {
        const t = (i + 1) / (countSegment + 1)
        seq.push(Math.max(minM, Math.min(maxM, Math.round(srcMidi + (destMidi - srcMidi) * t))))
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
    const targetFretPos = segmentSource.fret + (dest.fret - segmentSource.fret) * tSeg
    const interpString = Math.round(segmentSource.string + (dest.string - segmentSource.string) * tSeg)
    const nearest = findNearestFretForMidi(tuning, seq[idxInSegment], interpString, targetFretPos)
    return {
      ...n,
      string: nearest.si,
      fret: Math.max(0, Math.min(24, nearest.fret)),
      startBeat: Math.max(x1, startBeat),
      duration: Math.max(0.05, uniformDur),
      legatoRatio: { t: tGlobal, stringT: tGlobal }
    }
  })
}
