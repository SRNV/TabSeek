import { Note, Interval } from 'tonal'

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
      if (diff < minDiff) {
        minDiff = diff
        bestFret = f
      }
    }
  }
  return bestFret !== -1 ? bestFret : 0
}

/**
 * Finds the playable (string, fret) pair producing `targetMidi` that stays closest to a
 * reference position (refString/refFret) — minimizes hand movement when building a melodic
 * line note-by-note (legato sync, arpeggiator). Mirrors the inline search used historically
 * in syncLegatoHelper.
 */
export function findNearestFretForMidi(tuning: string[], targetMidi: number, refString: number, refFret: number): Voicing {
  let bestString = -1
  let bestFret = -1
  let minDiff = Infinity

  for (let si = 0; si < tuning.length; si++) {
    const openMidi = Note.midi(tuning[si] ?? 'E2') ?? 0
    const fret = targetMidi - openMidi
    if (fret < 0 || fret > 24) continue
    const diff = Math.abs(fret - refFret)
    const stringBonus = (si === refString) ? -0.1 : 0
    if (diff + stringBonus < minDiff) {
      minDiff = diff + stringBonus
      bestString = si
      bestFret = fret
    }
  }

  if (bestString === -1) {
    // Fallback: clamp on the reference string
    const openMidi = Note.midi(tuning[refString] ?? 'E2') ?? 0
    return { si: refString, fret: Math.max(0, Math.min(24, targetMidi - openMidi)) }
  }
  return { si: bestString, fret: bestFret }
}

export function findBestChordFrets(tuning: string[], notesPc: string[], startSi: number, forcedRoot?: Voicing): Voicing[] {
  const nNotes = notesPc.length
  const nStrings = tuning.length
  
  const candidatesPerNote = notesPc.map((pc, i) => {
    if (i === 0 && forcedRoot) {
      return [forcedRoot]
    }
    
    const list: Voicing[] = []
    for (let si = 0; si < nStrings; si++) {
      const openMidi = Note.midi(tuning[si] ?? 'E2') ?? 0
      for (let fret = 0; fret <= 24; fret++) {
        const pitch = Note.pitchClass(Note.fromMidi(openMidi + fret))
        if (pitch === pc) {
          list.push({ si, fret })
        }
      }
    }
    return list
  })

  let bestVoicing: Voicing[] = []
  let minScore = Infinity

  function search(noteIdx: number, usedStrings: Set<number>, usedMidis: Set<number>, current: Voicing[]) {
    if (noteIdx === nNotes) {
      const midis = current.map(v => (Note.midi(tuning[v.si] ?? 'E2') ?? 0) + v.fret)
      const frets = current.map(v => v.fret)
      const nonZero = frets.filter(f => f > 0)
      const fMin = nonZero.length > 0 ? Math.min(...nonZero) : 0
      const fMax = nonZero.length > 0 ? Math.max(...nonZero) : 0
      const span = nonZero.length > 1 ? (fMax - fMin) : 0
      
      const strings = current.map(v => v.si).sort((a, b) => a - b)
      let stringGaps = 0
      for (let i = 1; i < strings.length; i++) {
        stringGaps += Math.max(0, strings[i] - strings[i-1] - 1)
      }
      
      const minSi = Math.min(...strings)
      const siOffset = Math.abs(minSi - startSi)
      
      const rootMidi = midis[0]
      const isLowestRoot = rootMidi === Math.min(...midis)
      const isHighestRoot = rootMidi === Math.max(...midis)
      const rootPosBonus = (isLowestRoot || isHighestRoot) ? 200 : 0

      let penalty = 0
      if (span > 6) penalty += 100000
      else if (span > 4) penalty += (span - 4) * 500
      
      const openStringBonus = (nNotes - nonZero.length) * 15
      const positionPenalty = fMax / 5

      const score = (span * 100) - rootPosBonus + (stringGaps * 50) + (siOffset * 30) + positionPenalty - openStringBonus + penalty

      if (score < minScore) {
        minScore = score
        bestVoicing = [...current]
      }
      return
    }

    for (const cand of candidatesPerNote[noteIdx]) {
      const midi = (Note.midi(tuning[cand.si] ?? 'E2') ?? 0) + cand.fret
      if (!usedStrings.has(cand.si) && !usedMidis.has(midi)) {
        usedStrings.add(cand.si)
        usedMidis.add(midi)
        current.push(cand)
        search(noteIdx + 1, usedStrings, usedMidis, current)
        current.pop()
        usedMidis.delete(midi)
        usedStrings.delete(cand.si)
      }
    }
  }

  search(0, new Set(), new Set(), [])

  if (bestVoicing.length === 0) {
    for (let j = 0; j < nNotes; j++) {
      const si = Math.min(nStrings - 1, startSi + j)
      bestVoicing.push({ si, fret: findFretForPc(tuning[si], notesPc[j], 0) })
    }
  }

  return bestVoicing
}

/**
 * Same search as findBestChordFrets, but returns the N best-scoring DISTINCT voicings
 * instead of only the top one — used by the chord pod's "search another fingering"
 * action to cycle through alternate ways to play the same chord (different frets/strings,
 * same notes) instead of changing the chord itself.
 */
export function findRankedChordVoicings(tuning: string[], notesPc: string[], startSi: number, forcedRoot?: Voicing, limit = 12): Voicing[][] {
  const nNotes = notesPc.length
  const nStrings = tuning.length

  const candidatesPerNote = notesPc.map((pc, i) => {
    if (i === 0 && forcedRoot) return [forcedRoot]
    const list: Voicing[] = []
    for (let si = 0; si < nStrings; si++) {
      const openMidi = Note.midi(tuning[si] ?? 'E2') ?? 0
      for (let fret = 0; fret <= 24; fret++) {
        if (Note.pitchClass(Note.fromMidi(openMidi + fret)) === pc) list.push({ si, fret })
      }
    }
    return list
  })

  const found: { voicing: Voicing[]; score: number }[] = []

  function search(noteIdx: number, usedStrings: Set<number>, usedMidis: Set<number>, current: Voicing[]) {
    if (noteIdx === nNotes) {
      const midis = current.map(v => (Note.midi(tuning[v.si] ?? 'E2') ?? 0) + v.fret)
      const frets = current.map(v => v.fret)
      const nonZero = frets.filter(f => f > 0)
      const fMin = nonZero.length > 0 ? Math.min(...nonZero) : 0
      const fMax = nonZero.length > 0 ? Math.max(...nonZero) : 0
      const span = nonZero.length > 1 ? (fMax - fMin) : 0

      const strings = current.map(v => v.si).sort((a, b) => a - b)
      let stringGaps = 0
      for (let i = 1; i < strings.length; i++) stringGaps += Math.max(0, strings[i] - strings[i - 1] - 1)

      const minSi = Math.min(...strings)
      const siOffset = Math.abs(minSi - startSi)

      const rootMidi = midis[0]
      const isLowestRoot = rootMidi === Math.min(...midis)
      const isHighestRoot = rootMidi === Math.max(...midis)
      const rootPosBonus = (isLowestRoot || isHighestRoot) ? 200 : 0

      let penalty = 0
      if (span > 6) penalty += 100000
      else if (span > 4) penalty += (span - 4) * 500

      const openStringBonus = (nNotes - nonZero.length) * 15
      const positionPenalty = fMax / 5

      const score = (span * 100) - rootPosBonus + (stringGaps * 50) + (siOffset * 30) + positionPenalty - openStringBonus + penalty
      found.push({ voicing: [...current], score })
      return
    }

    for (const cand of candidatesPerNote[noteIdx]) {
      const midi = (Note.midi(tuning[cand.si] ?? 'E2') ?? 0) + cand.fret
      if (!usedStrings.has(cand.si) && !usedMidis.has(midi)) {
        usedStrings.add(cand.si)
        usedMidis.add(midi)
        current.push(cand)
        search(noteIdx + 1, usedStrings, usedMidis, current)
        current.pop()
        usedMidis.delete(midi)
        usedStrings.delete(cand.si)
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
