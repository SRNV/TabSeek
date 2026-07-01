import { RhythmModifierService } from '../../services/RhythmModifierService'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { rhythmPatterns } from '../../data/rhythmPatterns'

vi.mock('../../stores/useTablatureR3FStore', () => ({
  useTablatureR3FStore: {
    getState: vi.fn()
  }
}))

// Mock rhythm patterns for predictable tests
vi.mock('../../data/rhythmPatterns', () => ({
  rhythmPatterns: [
    {
      name: 'TestPattern',
      bars: 1,
      tracks: [
        { part: 'kick', steps: [1, 0, 1, 0] },
        { part: 'snare', steps: [0, 1, 0, 1] }
      ]
    }
  ]
}))

describe('RhythmModifierService', () => {
  const mockNote = { id: 'n1', startBeat: 0, duration: 4, string: 0, fret: 0 }
  const mockMod = {
    id: 'm1',
    targetType: 'note',
    targetId: 'n1',
    patternName: 'TestPattern',
    activeTracks: ['kick'],
    mode: 'proportional',
    enabled: true,
    fillGaps: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Hierarchy', () => {
    it('getActiveModifierForNote should find note-specific modifier first', () => {
      vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
        rhythmModifiers: [mockMod],
        chordGroups: [],
        progressionGroups: []
      } as any)
      
      const mod = RhythmModifierService.getActiveModifierForNote(mockNote as any)
      expect(mod?.id).toBe('m1')
    })

    it('getActiveModifierForNote should fall back to chord modifier', () => {
      const chordMod = { ...mockMod, id: 'm-chord', targetType: 'chord', targetId: 'c1' }
      vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
        rhythmModifiers: [chordMod],
        chordGroups: [{ id: 'c1', noteIds: ['n1'] }],
        progressionGroups: []
      } as any)
      
      const mod = RhythmModifierService.getActiveModifierForNote(mockNote as any)
      expect(mod?.id).toBe('m-chord')
    })
  })

  describe('Virtual Notes calculation', () => {
    it('getVirtualRhythm should compute correct onsets for kick track', () => {
      vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
        rhythmModifiers: [mockMod],
        chordGroups: [],
        progressionGroups: []
      } as any)

      // TestPattern kick has steps at index 0 and 2 of 4.
      // Note dur 4 -> each step is 1.0 beat.
      // Onsets at 0.0 and 2.0.
      const virtual = RhythmModifierService.getVirtualRhythm(mockNote as any)
      expect(virtual?.length).toBe(2)
      expect(virtual![0].startBeat).toBe(0)
      expect(virtual![1].startBeat).toBe(2)
    })

    it('getVirtualRhythm should fill gaps if enabled', () => {
      const fillMod = { ...mockMod, fillGaps: true }
      vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
        rhythmModifiers: [fillMod],
        chordGroups: [],
        progressionGroups: []
      } as any)

      const virtual = RhythmModifierService.getVirtualRhythm(mockNote as any)
      // Step 0 onset: duration should be (2 - 0) * 1.0 = 2.0
      // Step 2 onset: duration should be (4 - 2) * 1.0 = 2.0
      expect(virtual![0].duration).toBe(2)
      expect(virtual![1].duration).toBe(2)
    })
  })

  describe('Materialization', () => {
    it('materializeChainForNote should create real notes in the store', () => {
      const mockAddNote = vi.fn(() => 'new-id')
      const mockUpdateNote = vi.fn()
      vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
        addNote: mockAddNote,
        updateNote: mockUpdateNote
      } as any)

      const result = RhythmModifierService.materializeChainForNote(mockMod as any, mockNote as any)
      
      expect(result).not.toBeNull()
      // TestPattern kick has 2 onsets -> source + destination (no intermediates)
      expect(mockAddNote).toHaveBeenCalledTimes(1) // only destination
      expect(mockUpdateNote).toHaveBeenCalledTimes(3) // source x2, destination x1
    })
  })
})
