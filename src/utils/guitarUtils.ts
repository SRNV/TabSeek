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
