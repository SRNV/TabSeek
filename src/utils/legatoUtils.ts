/**
 * Pure utility functions for legato chain operations.
 * Extracted from useTablatureR3FStore to keep the store file focused on state management.
 * Also imported by RhythmModifierService (was duplicated there to avoid a circular import —
 * this file is the single source of truth).
 */

import { Note, Chord } from 'tonal'
import { findNearestFretForMidi } from './guitarUtils'
import type { TablatureNote, RhythmModifier, LegatoBehavior, LegatoChain } from '../types'

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

  // ── Determine allowed pitch classes for scale-aware behaviors ─────────────────
  // `allowedChromas` is a Set of pitch-class integers (0-11). The candidate-building
  // loop below filters MIDI values in [minM, maxM] by membership in this set.
  // null = no filter (all semitones allowed, equivalent to 'chromatique').
  //
  // Eva's corrections (session 10):
  //   - 'octaves'     : was missing → fell through to chromatique (bug). Fixed.
  //   - 'pentatonique': wrong indices [0,2,4,5,7] produced degree VI and a duplicate
  //                     of degree I. Correct major-pentatonic indices are [0,1,2,4,5].
  //   - 'secondes'    : was identical to 'gamme' (step=1 → all 7 scale chromas).
  //                     Renamed to 'approche' and reimplemented as chromatic approach.
  //   - 'tierces'     : was identical to 'arp7' (step=2 → degrees I,III,V,VII).
  //                     Now computes thirds by advancing from the source's position in
  //                     the scale, not always from degree I.
  //   - 'bebop'       : new — major bebop scale (gamme + b6 passing tone).

  let allowedChromas: Set<number> | null = null
  if (scaleNotes && scaleNotes.length > 0) {
    const scaleChromas = scaleNotes.map(pc => Note.chroma(pc)!)
    const rootChroma   = scaleChromas[0]
    const srcChroma    = ((srcMidi % 12) + 12) % 12

    switch (behavior) {

      // ── Diatonic / gamme ──────────────────────────────────────────────────
      case 'gamme':
        allowedChromas = new Set(scaleChromas)
        break

      // ── Approche du dessous ──────────────────────────────────────────────
      // Each scale degree + chromatic half-step immediately BELOW it.
      // Creates the ascending resolution sound (tension → release going up).
      case 'approche': {
        const s = new Set<number>()
        for (const c of scaleChromas) { s.add(c); s.add((c - 1 + 12) % 12) }
        allowedChromas = s
        break
      }

      // ── Approche du dessus ───────────────────────────────────────────────
      // Each scale degree + chromatic half-step immediately ABOVE it.
      // Creates the descending resolution sound — typical in minor/blues contexts.
      case 'approche_dessus': {
        const s = new Set<number>()
        for (const c of scaleChromas) { s.add(c); s.add((c + 1) % 12) }
        allowedChromas = s
        break
      }

      // ── Encerclement (enclosure / encircling) ────────────────────────────
      // Each scale degree + one semitone below AND one above.
      // The quintessential bebop approach — the target is "surrounded" by
      // chromatic neighbors before being struck. Creates maximum tension then
      // release on each scale tone.
      case 'encerclement': {
        const s = new Set<number>()
        for (const c of scaleChromas) {
          s.add(c)
          s.add((c - 1 + 12) % 12)   // half-step from below
          s.add((c + 1) % 12)         // half-step from above
        }
        allowedChromas = s
        break
      }

      // ── Double chromatique (Parker double-chromatic approach) ────────────
      // Each scale degree + the TWO chromatic semitones immediately below it.
      // The "Parker lick" DNA: two consecutive chromatic notes lead into the
      // target scale tone from beneath. Extremely dense, fast chromatic runs.
      case 'double_chroma': {
        const s = new Set<number>()
        for (const c of scaleChromas) {
          s.add(c)
          s.add((c - 1 + 12) % 12)   // 1st chromatic approach
          s.add((c - 2 + 12) % 12)   // 2nd chromatic approach
        }
        allowedChromas = s
        break
      }

      // ── Gamme bébop majeur ─────────────────────────────────────────────────
      // Major scale + chromatic passing tone between degree V (sol) and VI (la),
      // placing a b6 between them. Results in 8 notes per octave — all chord tones
      // of a major 7th chord land on strong beats when ascending. Standard in jazz.
      case 'bebop': {
        const bebopSet = new Set<number>(scaleChromas)
        // b6 = degree V chroma + 1 semitone (chromatic passing tone)
        const degree5 = scaleChromas[4 % scaleChromas.length]
        bebopSet.add((degree5 + 1) % 12)
        allowedChromas = bebopSet
        break
      }

      // ── Tierces (thirds from source position) ────────────────────────────
      // Advances through the scale by diatonic thirds starting from wherever
      // the SOURCE note falls in the scale, not always from degree I.
      // This makes 'tierces' genuinely different from 'arp7'.
      case 'tierces': {
        const scaleLen = scaleChromas.length
        // Find the index of srcChroma in the scale (or nearest)
        let srcIdx = scaleChromas.indexOf(srcChroma)
        if (srcIdx === -1) {
          // Source not in scale — find closest scale degree
          srcIdx = scaleChromas.reduce((best, c, i) => {
            const dist = Math.min(Math.abs(c - srcChroma), 12 - Math.abs(c - srcChroma))
            const bdist = Math.min(Math.abs(scaleChromas[best] - srcChroma), 12 - Math.abs(scaleChromas[best] - srcChroma))
            return dist < bdist ? i : best
          }, 0)
        }
        const thirds = new Set<number>()
        for (let step = 0; step < scaleLen; step += 2) {
          thirds.add(scaleChromas[(srcIdx + step) % scaleLen])
        }
        allowedChromas = thirds
        break
      }

      // ── Intervalles diatoniques par sauts (quartes–septiemes) ────────────
      // Advances through the scale by N diatonic steps at a time.
      // Each behavior selects a sparser subset of scale notes, creating wider leaps.
      case 'quartes': case 'quintes': case 'sixtes': case 'septiemes': {
        const stepMap: Record<string, number> = { quartes: 3, quintes: 4, sixtes: 5, septiemes: 6 }
        const step     = stepMap[behavior]
        const scaleLen = scaleChromas.length
        const subset   = new Set<number>()
        for (let i = 0; i < scaleLen; i += step) subset.add(scaleChromas[i])
        allowedChromas = subset
        break
      }

      // ── Triade / arp7 ─────────────────────────────────────────────────────
      case 'triade':
        allowedChromas = new Set([
          scaleChromas[0],
          scaleChromas[2 % scaleChromas.length],
          scaleChromas[4 % scaleChromas.length],
        ])
        break
      case 'arp7':
        allowedChromas = new Set([
          scaleChromas[0],
          scaleChromas[2 % scaleChromas.length],
          scaleChromas[4 % scaleChromas.length],
          scaleChromas[6 % scaleChromas.length],
        ])
        break

      // ── Pentatonique majeure ─────────────────────────────────────────────
      // Degrees I,II,III,V,VI (indices 0,1,2,4,5 in a heptatonic scale).
      case 'pentatonique': {
        const idx = [0, 1, 2, 4, 5]
        allowedChromas = new Set(idx.map(i => scaleChromas[i % scaleChromas.length]))
        break
      }

      // ── Pentatonique mineure ─────────────────────────────────────────────
      // Degrees I, b3, IV, V, b7 — the rock/blues pentatonic.
      // Intervals from root: 0, 3, 5, 7, 10 semitones.
      // Genuinely different from major pentatonic; essential for blues and rock guitar.
      case 'penta_min':
        allowedChromas = new Set([0, 3, 5, 7, 10].map(c => (rootChroma + c) % 12))
        break

      // ── Octaves ───────────────────────────────────────────────────────────
      case 'octaves':
        allowedChromas = new Set([srcChroma])
        break

      // ── Blues mineure ─────────────────────────────────────────────────────
      case 'blues':
        allowedChromas = new Set([0, 3, 5, 6, 7, 10].map(c => (rootChroma + c) % 12))
        break

      // ── Gamme bébop majeur ────────────────────────────────────────────────
      // Major scale + b6 chromatic passing tone between degree V and VI.
      // Creates 8 notes/octave so maj7 chord tones land on strong beats ascending.
      case 'bebop': {
        const s = new Set<number>(scaleChromas)
        s.add(((scaleChromas[4 % scaleChromas.length] ?? rootChroma) + 1) % 12)
        allowedChromas = s
        break
      }

      // ── Gamme bébop dominante ─────────────────────────────────────────────
      // Major scale + b7 chromatic passing tone between degree VII and the octave.
      // The dominant bebop scale — chord tones of a dominant 7th (1,3,5,b7) land
      // on strong beats when played in eighth notes. Standard swing/bop vocabulary.
      case 'bebop_dominant': {
        const s = new Set<number>(scaleChromas)
        // b7 = a half-step below the root (passing tone between leading tone and root)
        s.add((rootChroma - 1 + 12) % 12)
        allowedChromas = s
        break
      }

      // ── Gamme mineure harmonique ─────────────────────────────────────────
      // Natural minor with raised 7th: 1,2,b3,4,5,b6,7.
      // Intervals: 0,2,3,5,7,8,11.
      // The characteristic augmented 2nd (b6→7) creates the distinctive
      // Spanish/Jewish/classical tension. Used in Phrygian dominant, flamenco,
      // metal, and classical cadential progressions.
      case 'harmonique':
        allowedChromas = new Set([0, 2, 3, 5, 7, 8, 11].map(c => (rootChroma + c) % 12))
        break

      // ── Gamme mineure mélodique (jazz) ───────────────────────────────────
      // Ascending jazz melodic minor: 1,2,b3,4,5,6,7. Intervals: 0,2,3,5,7,9,11.
      // Unlike classical melodic minor, the jazz version uses the same ascending
      // form in both directions. Used extensively in modern jazz (on m(maj7) chords,
      // Lydian dominant, super-Locrian substitutions).
      case 'melodique':
        allowedChromas = new Set([0, 2, 3, 5, 7, 9, 11].map(c => (rootChroma + c) % 12))
        break

      // ── Gamme altérée (super-locrienne) ─────────────────────────────────
      // The 7th mode of melodic minor: 1,b2,b3,b4(#2),b5(#4),b6(#5),b7.
      // Intervals: 0,1,3,4,6,8,10.
      // THE jazz scale for altered dominant chords (V7alt → b9,#9,b5,#5).
      // Maximum tension before resolution to tonic. Essential in modern jazz.
      case 'altere':
        allowedChromas = new Set([0, 1, 3, 4, 6, 8, 10].map(c => (rootChroma + c) % 12))
        break

      // ── Gammes symétriques ────────────────────────────────────────────────
      case 'whole-tone':
        allowedChromas = new Set([0, 2, 4, 6, 8, 10].map(c => (rootChroma + c) % 12))
        break
      case 'diminished':
        allowedChromas = new Set([0, 1, 3, 4, 6, 7, 9, 10].map(c => (rootChroma + c) % 12))
        break
    }
  }

  // ── Build the target MIDI sequence ───────────────────────────────────────────
  //
  // legatoOvershoot (boolean): when true, the candidate MIDI range extends beyond
  // [src, dest] in both directions. The extension is auto-computed as the larger of
  // 2 semitones or 25 % of the total pitch distance — enough to add musical interest
  // without producing an unreasonable jump.
  const pitchSpan  = Math.abs(destMidi - srcMidi)
  const overshootSt = srcOrig.legatoOvershoot ? Math.max(2, Math.round(pitchSpan * 0.25)) : 0
  const seq: number[] = []
  const minM = Math.min(srcMidi, destMidi) - overshootSt
  const maxM = Math.max(srcMidi, destMidi) + overshootSt

  if (behavior === 'free') {
    for (let i = 0; i < countSegment; i++) {
      const t   = (i + 1) / (countSegment + 1)
      // When overshoot is on: sinusoidal arc peaks above the linear path at t=0.5
      const arc = overshootSt > 0 ? Math.sin(t * Math.PI) * overshootSt * dir : 0
      seq.push(Math.round(srcMidi + (destMidi - srcMidi) * t + arc))
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
    // Constrain to the string range between source and dest so intermediate notes
    // stay on physically playable strings (hammer-ons/pull-offs don't jump across the neck).
    const siLo = Math.min(segmentSource.string, dest.string)
    const siHi = Math.max(segmentSource.string, dest.string)
    const nearest = findNearestFretForMidi(tuning, seq[idxInSegment], interpString, targetFretPos, [siLo, siHi])
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
