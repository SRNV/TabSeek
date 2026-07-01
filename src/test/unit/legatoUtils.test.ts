import { 
  getNoteNameFromFret, detectChordName, syncLegatoHelper 
} from '../../utils/legatoUtils'

describe('legatoUtils', () => {
  const standardTuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

  describe('Note name helper', () => {
    it('getNoteNameFromFret should return correct note names', () => {
      expect(getNoteNameFromFret('E2', 5)).toBe('A2')
      expect(getNoteNameFromFret('G3', 1)).toBe('Ab3') // tonal.js returns Ab or G# depending on internal logic
    })
  })

  describe('Chord detection', () => {
    const allNotes = [
      { id: 'n1', string: 0, fret: 0 }, // E2
      { id: 'n2', string: 1, fret: 2 }, // B2
      { id: 'n3', string: 2, fret: 2 }, // E3
    ]
    
    it('detectChordName should detect an E5 power chord', () => {
      const name = detectChordName(['n1', 'n2', 'n3'], allNotes as any, standardTuning)
      expect(name).toBe('E5')
    })

    it('detectChordName should be invariant to note order', () => {
      const name1 = detectChordName(['n1', 'n2', 'n3'], allNotes as any, standardTuning)
      const name2 = detectChordName(['n3', 'n2', 'n1'], allNotes as any, standardTuning)
      expect(name1).toBe(name2)
    })
  })

  describe('Legato synchronization', () => {
    it('syncLegatoHelper should interpolate intermediate notes chromatically by default', () => {
      const notes = [
        { 
          id: 'src', string: 3, fret: 0, startBeat: 0, duration: 1, 
          legatoNext: 'dest', intermediateNoteIds: ['int1', 'int2'] 
        },
        { id: 'int1', string: 3, fret: 0, startBeat: 1, duration: 1 },
        { id: 'int2', string: 3, fret: 0, startBeat: 2, duration: 1 },
        { id: 'dest', string: 3, fret: 3, startBeat: 3, duration: 1 }
      ]
      
      // G3 (0) to Bb3 (3) with 2 intermediate notes
      // Intermediate notes should be Ab3 (1) and A3 (2)
      const result = syncLegatoHelper(notes as any, 'src', standardTuning)
      const int1 = result.find(n => n.id === 'int1')!
      const int2 = result.find(n => n.id === 'int2')!
      
      expect(int1.fret).toBe(1)
      expect(int2.fret).toBe(2)
      // Check timing: source ends at 1.0, dest starts at 3.0. Range = 2.0.
      // 2 notes -> dur = 1.0 each.
      expect(int1.startBeat).toBe(1.0)
      expect(int2.startBeat).toBe(2.0)
    })

    it('syncLegatoHelper should respect scale-aware behaviors (gamme)', () => {
      const scaleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] // C Major
      const notes = [
        { 
          id: 'src', string: 3, fret: 5, startBeat: 0, duration: 1, // C4
          legatoNext: 'dest', intermediateNoteIds: ['int'], legatoBehavior: 'gamme'
        },
        { id: 'int', string: 3, fret: 0, startBeat: 1, duration: 1 },
        { id: 'dest', string: 3, fret: 9, startBeat: 2, duration: 1 } // E4
      ]
      
      // C4 to E4 in C Major. Scale notes in between: D4.
      // C4 is fret 5 on G string. E4 is fret 9. D4 is fret 7.
      const result = syncLegatoHelper(notes as any, 'src', standardTuning, scaleNotes)
      const int = result.find(n => n.id === 'int')!
      expect(int.fret).toBe(7) // D4
    })
  })
})
