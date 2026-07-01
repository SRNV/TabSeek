import { 
  getNoteName, findFretForNote, nextFretSamePc, findFretForPc, 
  findNearestFretForMidi, findBestChordFrets, findRankedChordVoicings
} from '../../utils/guitarUtils'

describe('guitarUtils', () => {
  const standardTuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

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
})
