import { PodModifierService } from '../../services/PodModifierService'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { useMainStore } from '../../stores/useMainStore'

vi.mock('../../stores/useTablatureR3FStore', () => ({
  useTablatureR3FStore: {
    getState: vi.fn()
  }
}))

vi.mock('../../stores/useTablatureStore', () => ({
  useTablatureStore: {
    getState: vi.fn()
  }
}))

vi.mock('../../stores/useMainStore', () => ({
  useMainStore: {
    getState: vi.fn()
  }
}))

describe('PodModifierService', () => {
  const mockState = {
    notes: [],
    chordGroups: [],
    rhythmModifiers: [],
    pushHistory: vi.fn(),
    updateNote: vi.fn(),
    addNote: vi.fn(),
    deleteNote: vi.fn(),
    setChordGroupNoteIds: vi.fn(),
    removeRhythmModifier: vi.fn(),
    replaceChordGroupVoicing: vi.fn(),
    syncLegato: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTablatureR3FStore.getState as any).mockReturnValue(mockState)
    ;(useTablatureStore.getState as any).mockReturnValue({
      tuning: 'E2,A2,D3,G3,B3,E4'
    })
    ;(useMainStore.getState as any).mockReturnValue({
      userScale: 'C',
      modeObject: { intervals: ['1P', '2M', '3M', '4P', '5P', '6M', '7M'] }
    })
  })

  describe('cycleVoicing', () => {
    it('should cycle through different voicings of the same chord', () => {
      const notes = [
        { id: 'n1', string: 5, fret: 3, startBeat: 0, duration: 4 }, // C3
        { id: 'n2', string: 4, fret: 2, startBeat: 0, duration: 4 }, // E3
        { id: 'n3', string: 3, fret: 0, startBeat: 0, duration: 4 }, // G3
      ]
      const group = { id: 'g1', chordName: 'C', noteIds: ['n1', 'n2', 'n3'] }
      
      mockState.notes = notes as any
      mockState.chordGroups = [group] as any
      mockState.replaceChordGroupVoicing.mockReturnValue(['new-n1', 'new-n2', 'new-n3'])

      PodModifierService.cycleVoicing(group as any, 1)

      expect(mockState.pushHistory).toHaveBeenCalled()
      expect(mockState.replaceChordGroupVoicing).toHaveBeenCalled()
      const args = mockState.replaceChordGroupVoicing.mock.calls[0]
      expect(args[0]).toBe('g1')
      expect(args[2]).toBe('C')
    })
  })

  describe('transposeOctave', () => {
    it('should transpose chord up an octave if possible', () => {
      const notes = [
        { id: 'n1', string: 5, fret: 3, startBeat: 0, duration: 4 },
      ]
      const group = { id: 'g1', chordName: 'C', noteIds: ['n1'] }
      
      mockState.notes = notes as any
      mockState.chordGroups = [group] as any
      mockState.replaceChordGroupVoicing.mockReturnValue(['new-n1'])

      PodModifierService.transposeOctave(group as any, 1)

      expect(mockState.replaceChordGroupVoicing).toHaveBeenCalled()
      const newNotes = mockState.replaceChordGroupVoicing.mock.calls[0][1]
      // C3 (fret 3 on string 5) + 12 = C4
      // C4 on string 5 is fret 15
      expect(newNotes[0].fret).toBe(15)
    })

    it('should bail out if transposition goes out of bounds', () => {
      const notes = [
        { id: 'n1', string: 5, fret: 20, startBeat: 0, duration: 4 },
      ]
      const group = { id: 'g1', chordName: 'C', noteIds: ['n1'] }
      
      mockState.notes = notes as any
      mockState.chordGroups = [group] as any

      PodModifierService.transposeOctave(group as any, 1)

      expect(mockState.replaceChordGroupVoicing).not.toHaveBeenCalled()
    })
  })
})
