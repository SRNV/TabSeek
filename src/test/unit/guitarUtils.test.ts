import { Note } from 'tonal'
import {
  getNoteName, findFretForNote, nextFretSamePc, findFretForPc,
  findNearestFretForMidi, findBestChordFrets, findRankedChordVoicings
} from '../../utils/guitarUtils'

// Helpers shared across ergonomic tests
function maxNonZeroFret(voicing: { si: number; fret: number }[]): number {
  const nonZero = voicing.map(v => v.fret).filter(f => f > 0)
  return nonZero.length > 0 ? Math.max(...nonZero) : 0
}

function avgMidi(voicing: { si: number; fret: number }[], tuning: string[]): number {
  const midis = voicing.map(v => (Note.midi(tuning[v.si] ?? 'E2') ?? 0) + v.fret)
  return midis.reduce((a, b) => a + b, 0) / midis.length
}

describe('guitarUtils', () => {
  const standardTuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
  // Non-standard tuning used in TabSeek (5th string is C4, not B3)
  const tabseekTuning = ['E2', 'A2', 'D3', 'G3', 'C4', 'E4']

  describe('Pitch conversion', () => {
    it('getNoteName should return correct note for string and fret', () => {
      expect(getNoteName('E2', 0)).toBe('E2')
      expect(getNoteName('E2', 5)).toBe('A2')
      expect(getNoteName('G3', 2)).toBe('A3')
    })

    it('findFretForNote should find the correct fret on a given string', () => {
      expect(findFretForNote('E2', 'A2')).toBe(5)
      expect(findFretForNote('D3', 'F3')).toBe(3)
      expect(findFretForNote('E4', 'G#4')).toBe(4)
      expect(findFretForNote('E2', 'C1')).toBe(null) // impossible
    })

    it('nextFretSamePc should cycle through pitch classes on same string', () => {
      // E2 string: 0 (E2), 12 (E3), 24 (E4)
      expect(nextFretSamePc('E2', 0)).toBe(12)
      expect(nextFretSamePc('E2', 12)).toBe(24)
      expect(nextFretSamePc('E2', 24)).toBe(0)
    })

    it('findFretForPc should find the nearest fret for a pitch class', () => {
      // E2 string, PC 'A'. Options are 5, 17.
      expect(findFretForPc('E2', 'A', 0)).toBe(5)
      expect(findFretForPc('E2', 'A', 15)).toBe(17)
    })
  })

  describe('Legato helpers', () => {
    it('findNearestFretForMidi should stay on same string if possible', () => {
      // Target A3 (MIDI 57). 
      // D3 string (MIDI 50) -> fret 7
      // G3 string (MIDI 55) -> fret 2
      // If ref is (string 2 (D3), fret 5 (G3)), and target is A3:
      // Same-string bonus should keep it on string 2 (fret 7) unless string 3 is much closer.
      const res = findNearestFretForMidi(standardTuning, 57, 2, 5)
      expect(res.si).toBe(2)
      expect(res.fret).toBe(7)
    })

    it('findNearestFretForMidi should respect siRange', () => {
      // Target E4 (MIDI 64).
      // Available on string 0 (fret 24), string 1 (fret 19), string 2 (fret 14), string 3 (fret 9), string 4 (fret 5), string 5 (fret 0)
      // If range is [1, 2], should pick string 2 (fret 14) or 1 (fret 19)
      const res = findNearestFretForMidi(standardTuning, 64, 5, 0, [1, 2])
      expect(res.si).toBeGreaterThanOrEqual(1)
      expect(res.si).toBeLessThanOrEqual(2)
    })
  })

  describe('Chord Voicing search', () => {
    it('findBestChordFrets should return a valid voicing without string duplication', () => {
      const pcs = ['C', 'E', 'G'] // C Major
      const res = findBestChordFrets(standardTuning, pcs, 1) // start on A string
      
      expect(res.length).toBe(3)
      const strings = new Set(res.map(v => v.si))
      expect(strings.size).toBe(3) // No duplicate strings
      
      // Check if notes are correct
      res.forEach((v, i) => {
        const name = getNoteName(standardTuning[v.si], v.fret)
        expect(name.startsWith(pcs[i])).toBe(true)
      })
    })

    it('findBestChordFrets should handle chords with more notes than strings (fallback)', () => {
      const pcs = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] // 7 notes
      const res = findBestChordFrets(standardTuning, pcs, 0)
      
      expect(res.length).toBe(7)
      // Should use all 6 strings and wrap around or clamp
      const strings = res.map(v => v.si)
      const uniqueStrings = new Set(strings)
      expect(uniqueStrings.size).toBe(6) // Maximum unique strings
    })

    it('findRankedChordVoicings should return distinct voicings', () => {
      const pcs = ['C', 'E', 'G']
      const ranked = findRankedChordVoicings(standardTuning, pcs, 1, undefined, 5)

      expect(ranked.length).toBeGreaterThan(1)

      // Each voicing should be unique
      const keys = new Set(ranked.map(v =>
        v.sort((a, b) => a.si - b.si).map(x => `${x.si}:${x.fret}`).join(',')
      ))
      expect(keys.size).toBe(ranked.length)
    })
  })

  // ── Ergonomic voicing (TabSeek non-standard tuning E2,A2,D3,G3,C4,E4) ──────
  //
  // Root cause being tested: the original `rootPosBonus=200` reward for "root in
  // melody" completely overrides `positionPenalty=fMax/5`, causing voicings at
  // fret 13 (barre pattern, root as top note) to beat ergonomic low-position
  // voicings by ~197 points — even though fret 13 is far less accessible.
  //
  // Expected invariants after the fix:
  //   1. Without context the algorithm defaults to a low position (fMax ≤ 8).
  //   2. With a high-position prevVoicing the algorithm stays near it (VL wins).
  //   3. With a low-position prevVoicing the algorithm stays low (continuity).

  describe('Ergonomic voicing — position preference (TabSeek tuning)', () => {

    // [ERG-01] Bb major default: no context → prefers a low-position voicing.
    // Previously the algorithm could pick fret-13 barre when root lands as top
    // note (rootPosBonus 200 > positionPenalty 2.6). Expected: fMax ≤ 8.
    it('[ERG-01] Bb major without context: fMax ≤ 8 (prefer low position)', () => {
      const bbVoicing = findBestChordFrets(tabseekTuning, ['Bb', 'D', 'F'], 0)
      expect(maxNonZeroFret(bbVoicing)).toBeLessThanOrEqual(8)
    })

    // [ERG-02] Eb major is the hardest case: Eb4 at D3-fret-13 lands as the top
    // note giving rootPosBonus while Bb(A2,13) + open-G3 yields span=0 — the
    // combination made fret-13 win by ~197 points over the fret-1 equivalent.
    it('[ERG-02] Eb major without context: fMax ≤ 8 (root-in-melody must not force high fret)', () => {
      const ebVoicing = findBestChordFrets(tabseekTuning, ['Eb', 'G', 'Bb'], 0)
      expect(maxNonZeroFret(ebVoicing)).toBeLessThanOrEqual(8)
    })

    // [ERG-03] F major without context: same family as ERG-02.
    it('[ERG-03] F major without context: fMax ≤ 8', () => {
      const fVoicing = findBestChordFrets(tabseekTuning, ['F', 'A', 'C'], 0)
      expect(maxNonZeroFret(fVoicing)).toBeLessThanOrEqual(8)
    })

    // [ERG-04] Chained Bb→Eb: the Eb voicing that follows Bb should stay in the
    // same positional zone (fMax difference ≤ 5 frets).
    it('[ERG-04] Bb→Eb chained: fMax jump between consecutive voicings ≤ 5', () => {
      const bbVoicing = findBestChordFrets(tabseekTuning, ['Bb', 'D', 'F'], 0)
      const ebVoicing = findBestChordFrets(tabseekTuning, ['Eb', 'G', 'Bb'], 0, undefined, bbVoicing)
      expect(Math.abs(maxNonZeroFret(ebVoicing) - maxNonZeroFret(bbVoicing))).toBeLessThanOrEqual(5)
    })

    // [ERG-05] Bb blues I–IV–V chained: all voicings should sit within 6 frets of
    // the first chord's fMax — no chord should suddenly jump to a distant position.
    it('[ERG-05] Bb blues I-IV-V chained: each chord stays within 6 frets of the first', () => {
      const bbVoicing = findBestChordFrets(tabseekTuning, ['Bb', 'D', 'F'], 0)
      const ebVoicing = findBestChordFrets(tabseekTuning, ['Eb', 'G', 'Bb'], 0, undefined, bbVoicing)
      const fVoicing  = findBestChordFrets(tabseekTuning, ['F',  'A', 'C'],  0, undefined, ebVoicing)

      const bbMax = maxNonZeroFret(bbVoicing)
      expect(Math.abs(maxNonZeroFret(ebVoicing) - bbMax)).toBeLessThanOrEqual(6)
      expect(Math.abs(maxNonZeroFret(fVoicing)  - bbMax)).toBeLessThanOrEqual(6)
    })

    // [ERG-06] Voice-leading continuity: when prevVoicing sits at a HIGH position
    // (frets ~10-13), the next chord should stay near it rather than dropping back
    // to open position (avgMidi of new chord within 8 semitones of prev avgMidi).
    it('[ERG-06] With high-position prevVoicing, next chord stays near (avgMidi Δ ≤ 8)', () => {
      // Eb major voiced at high position — frets 13, 13, 0
      const highPrevVoicing = [
        { si: 2, fret: 13 }, // Eb4 on D3
        { si: 3, fret: 0  }, // G3  open
        { si: 1, fret: 13 }, // Bb3 on A2
      ]
      const prevAvg = avgMidi(highPrevVoicing, tabseekTuning) // ≈ 58.7

      const bbVoicing = findBestChordFrets(tabseekTuning, ['Bb', 'D', 'F'], 0, undefined, highPrevVoicing)
      const newAvg = avgMidi(bbVoicing, tabseekTuning)

      expect(Math.abs(newAvg - prevAvg)).toBeLessThanOrEqual(8)
    })
  })
})
