/**
 * @file guitarUtils.ts
 * Guitar-specific pitch utilities: fret-to-note conversion, voicing search, and legato
 * interpolation helpers.
 *
 * All pitch arithmetic uses Tonal.js.  Voicing search (`findBestChordFrets`,
 * `findRankedChordVoicings`) uses a backtracking algorithm scored by `scoreVoicing`,
 * which factors in hand span, root position, string gaps, position, open-string bonuses,
 * octave-doubling penalty, and optional voice-leading continuity from a previous chord.
 *
 * `findNearestFretForMidi` accepts an optional `siRange` parameter so that legato
 * intermediate notes can be constrained to the string range between the source and
 * destination notes (more physically plausible fingering).
 */
import { Note, Interval } from 'tonal'

/** Returns the note name (e.g. `"E3"`) produced by playing `fret` on string `cord`. */
export function getNoteName(cord: string, fret: number): string {
  return Note.transpose(cord, Interval.fromSemitones(fret));
}

export function findFretForNote(openNote: string, targetNote: string): number | null {
  const targetMidi = Note.midi(targetNote)
  if (targetMidi === null) return null
  for (let f = 0; f <= 24; f++)
    if (Note.midi(getNoteName(openNote, f)) === targetMidi) return f
  return null
}

export function nextFretSamePc(openNote: string, currentFret: number): number {
  const targetPc = Note.pitchClass(getNoteName(openNote, currentFret))
  const matches: number[] = []
  for (let f = 0; f <= 24; f++)
    if (Note.pitchClass(getNoteName(openNote, f)) === targetPc) matches.push(f)
  const idx = matches.indexOf(currentFret)
  return matches[(idx + 1) % matches.length]
}

export interface Voicing { si: number; fret: number }

export function findFretForPc(openNote: string, pc: string, minFret = 0): number {
  const openMidi = Note.midi(openNote) ?? 0
  let bestFret = -1
  let minDiff = Infinity
  for (let f = 0; f <= 24; f++) {
    const pitch = Note.pitchClass(Note.fromMidi(openMidi + f))
    if (pitch === pc) {
      const diff = Math.abs(f - minFret)
      if (diff < minDiff) { minDiff = diff; bestFret = f }
    }
  }
  return bestFret !== -1 ? bestFret : 0
}

/** All frets [0..24] on `openNote` string whose pitch class matches `pc`. */
export function findAllFretsForPc(openNote: string, pc: string): number[] {
  const openMidi = Note.midi(openNote) ?? 0
  const out: number[] = []
  for (let f = 0; f <= 24; f++)
    if (Note.pitchClass(Note.fromMidi(openMidi + f)) === pc) out.push(f)
  return out
}

// ── Shared voicing score ──────────────────────────────────────────────────────
//
// Factors (lower = better):
//   span          – tight hand position preferred
//   rootPosBonus  – root in bass or melody is idiomatic (negative weight)
//   stringGaps    – contiguous strings preferred
//   siOffset      – distance from desired start string
//   positionPenalty – prefer low/open positions
//   openStringBonus – open strings need no fretting (negative weight)
//   octaveDupPenalty – same pitch-class in two octaves muddies the harmony
//   voiceLeadCost – (optional) minimise total MIDI movement from previous chord

function scoreVoicing(
  voicing: Voicing[],
  tuning: string[],
  startSi: number,
  prevMidis?: number[]
): number {
  const midis   = voicing.map(v => (Note.midi(tuning[v.si] ?? 'E2') ?? 0) + v.fret)
  const frets   = voicing.map(v => v.fret)
  const nonZero = frets.filter(f => f > 0)
  const fMax    = nonZero.length > 0 ? Math.max(...nonZero) : 0
  const span    = nonZero.length > 1 ? fMax - Math.min(...nonZero) : 0

  const strings  = [...voicing.map(v => v.si)].sort((a, b) => a - b)
  let stringGaps = 0
  for (let i = 1; i < strings.length; i++)
    stringGaps += Math.max(0, strings[i] - strings[i - 1] - 1)

  const siOffset     = Math.abs(Math.min(...strings) - startSi)
  const rootMidi     = midis[0]
  const rootPosBonus = (rootMidi === Math.min(...midis) || rootMidi === Math.max(...midis)) ? 200 : 0

  let penalty = 0
  if (span > 6)      penalty += 100_000
  else if (span > 4) penalty += (span - 4) * 500

  const openStringBonus = (voicing.length - nonZero.length) * 15
  const positionPenalty = fMax / 5

  // Penalise having the same pitch-class in two different octaves (muddy harmony)
  const chromaCounts = new Map<number, number>()
  for (const m of midis) {
    const c = ((m % 12) + 12) % 12
    chromaCounts.set(c, (chromaCounts.get(c) ?? 0) + 1)
  }
  let octaveDupPenalty = 0
  for (const cnt of chromaCounts.values()) if (cnt > 1) octaveDupPenalty += (cnt - 1) * 80

  // Voice-leading: total distance of each note to its nearest counterpart in the previous chord
  let voiceLeadCost = 0
  if (prevMidis && prevMidis.length > 0) {
    for (const m of midis)
      voiceLeadCost += Math.min(...prevMidis.map(pm => Math.abs(pm - m))) * 15
  }

  return (span * 100) - rootPosBonus + (stringGaps * 50) + (siOffset * 30) +
    positionPenalty - openStringBonus + penalty + octaveDupPenalty + voiceLeadCost
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds the playable (string, fret) pair producing `targetMidi` closest to
 * (refString, refFret). When `siRange` is given the search is restricted to that
 * inclusive string range — legato sync uses this to keep intermediate notes on
 * the same string(s) as the phrase endpoints (more physically plausible). Falls
 * back to unconstrained search if no valid fret exists within the range.
 */
export function findNearestFretForMidi(
  tuning: string[],
  targetMidi: number,
  refString: number,
  refFret: number,
  siRange?: [number, number]
): Voicing {
  const siMin = siRange ? Math.max(0, siRange[0])              : 0
  const siMax = siRange ? Math.min(tuning.length - 1, siRange[1]) : tuning.length - 1
  let bestString = -1
  let bestFret   = -1
  let minDiff    = Infinity

  for (let si = siMin; si <= siMax; si++) {
    const openMidi = Note.midi(tuning[si] ?? 'E2') ?? 0
    const fret = targetMidi - openMidi
    if (fret < 0 || fret > 24) continue
    // Stronger same-string bonus (was -0.1 → -2.0) so intermediate notes cluster on
    // the reference string and only jump to an adjacent string when the fret distance
    // would exceed ~2 positions. This avoids the chromatic "staircase across strings"
    // visual where each note zigzags to a new string unnecessarily.
    const diff = Math.abs(fret - refFret) + (si === refString ? -2.0 : 0)
    if (diff < minDiff) { minDiff = diff; bestString = si; bestFret = fret }
  }

  // Retry unconstrained when the range had no valid fret
  if (bestString === -1 && siRange)
    return findNearestFretForMidi(tuning, targetMidi, refString, refFret)

  if (bestString === -1) {
    const openMidi = Note.midi(tuning[refString] ?? 'E2') ?? 0
    return { si: refString, fret: Math.max(0, Math.min(24, targetMidi - openMidi)) }
  }
  return { si: bestString, fret: bestFret }
}

/**
 * Finds the best-scoring voicing for `notesPc` pitch classes.
 * When `prevVoicing` is provided, voice-leading continuity from the previous
 * chord is factored into the score (minimises total MIDI movement).
 */
export function findBestChordFrets(
  tuning: string[],
  notesPc: string[],
  startSi: number,
  forcedRoot?: Voicing,
  prevVoicing?: Voicing[]
): Voicing[] {
  const nNotes   = notesPc.length
  const nStrings = tuning.length
  const prevMidis = prevVoicing?.map(v => (Note.midi(tuning[v.si] ?? 'E2') ?? 0) + v.fret)

  const candidatesPerNote = notesPc.map((pc, i) => {
    if (i === 0 && forcedRoot) return [forcedRoot]
    const list: Voicing[] = []
    for (let si = 0; si < nStrings; si++) {
      const openMidi = Note.midi(tuning[si] ?? 'E2') ?? 0
      for (let fret = 0; fret <= 24; fret++)
        if (Note.pitchClass(Note.fromMidi(openMidi + fret)) === pc) list.push({ si, fret })
    }
    return list
  })

  let bestVoicing: Voicing[] = []
  let minScore = Infinity

  function search(noteIdx: number, usedStrings: Set<number>, usedMidis: Set<number>, current: Voicing[]) {
    if (noteIdx === nNotes) {
      const score = scoreVoicing(current, tuning, startSi, prevMidis)
      if (score < minScore) { minScore = score; bestVoicing = [...current] }
      return
    }
    for (const cand of candidatesPerNote[noteIdx]) {
      const midi = (Note.midi(tuning[cand.si] ?? 'E2') ?? 0) + cand.fret
      if (!usedStrings.has(cand.si) && !usedMidis.has(midi)) {
        usedStrings.add(cand.si); usedMidis.add(midi); current.push(cand)
        search(noteIdx + 1, usedStrings, usedMidis, current)
        current.pop(); usedMidis.delete(midi); usedStrings.delete(cand.si)
      }
    }
  }

  search(0, new Set(), new Set(), [])

  // Fallback: the backtracking search found no valid voicing (can happen when the chord
  // has more notes than available strings, or all candidates clash with usedMidis).
  // Spread notes across ALL strings from low to high, never reusing a string.
  // The old fallback used `Math.min(nStrings-1, startSi+j)` which placed every note
  // on the highest string when startSi was already at the top — the root cause of the
  // "3 notes on the same string" bug.
  if (bestVoicing.length === 0) {
    const takenStrings = new Set<number>()
    // If forcedRoot is provided, always honour it first
    if (forcedRoot) {
      bestVoicing.push(forcedRoot)
      takenStrings.add(forcedRoot.si)
    }
    for (let j = forcedRoot ? 1 : 0; j < nNotes; j++) {
      // Find the lowest unused string
      let si = 0
      while (takenStrings.has(si) && si < nStrings) si++
      si = Math.min(si, nStrings - 1)
      bestVoicing.push({ si, fret: findFretForPc(tuning[si], notesPc[j], 0) })
      takenStrings.add(si)
    }
  }
  return bestVoicing
}

/**
 * Returns the N best-scoring DISTINCT voicings for `notesPc` — used to cycle
 * through alternate fingerings of the same chord (different strings/frets).
 * Voice-leading and octave-coherence penalties are included via scoreVoicing.
 */
export function findRankedChordVoicings(
  tuning: string[],
  notesPc: string[],
  startSi: number,
  forcedRoot?: Voicing,
  limit = 12,
  prevVoicing?: Voicing[]
): Voicing[][] {
  const nNotes   = notesPc.length
  const nStrings = tuning.length
  const prevMidis = prevVoicing?.map(v => (Note.midi(tuning[v.si] ?? 'E2') ?? 0) + v.fret)

  const candidatesPerNote = notesPc.map((pc, i) => {
    if (i === 0 && forcedRoot) return [forcedRoot]
    const list: Voicing[] = []
    for (let si = 0; si < nStrings; si++) {
      const openMidi = Note.midi(tuning[si] ?? 'E2') ?? 0
      for (let fret = 0; fret <= 24; fret++)
        if (Note.pitchClass(Note.fromMidi(openMidi + fret)) === pc) list.push({ si, fret })
    }
    return list
  })

  const found: { voicing: Voicing[]; score: number }[] = []

  function search(noteIdx: number, usedStrings: Set<number>, usedMidis: Set<number>, current: Voicing[]) {
    if (noteIdx === nNotes) {
      found.push({ voicing: [...current], score: scoreVoicing(current, tuning, startSi, prevMidis) })
      return
    }
    for (const cand of candidatesPerNote[noteIdx]) {
      const midi = (Note.midi(tuning[cand.si] ?? 'E2') ?? 0) + cand.fret
      if (!usedStrings.has(cand.si) && !usedMidis.has(midi)) {
        usedStrings.add(cand.si); usedMidis.add(midi); current.push(cand)
        search(noteIdx + 1, usedStrings, usedMidis, current)
        current.pop(); usedMidis.delete(midi); usedStrings.delete(cand.si)
      }
    }
  }

  search(0, new Set(), new Set(), [])
  found.sort((a, b) => a.score - b.score)

  const seen = new Set<string>()
  const ranked: Voicing[][] = []
  for (const { voicing } of found) {
    const key = [...voicing].sort((a, b) => a.si - b.si).map(v => `${v.si}:${v.fret}`).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    ranked.push(voicing)
    if (ranked.length >= limit) break
  }
  return ranked
}
