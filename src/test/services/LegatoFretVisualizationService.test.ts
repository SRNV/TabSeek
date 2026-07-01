import { LegatoFretVisualizationService } from '../../services/LegatoFretVisualizationService'
import { useMainStore } from '../../stores/useMainStore'

vi.mock('../../stores/useMainStore', () => ({
  useMainStore: {
    getState: vi.fn(() => ({
      setLegatoFretHighlights: vi.fn()
    }))
  }
}))

describe('LegatoFretVisualizationService', () => {
  const mockSetHighlights = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMainStore.getState).mockReturnValue({
      setLegatoFretHighlights: mockSetHighlights
    } as any)
  })

  it('should highlight all notes in a legato chain when source is hovered', () => {
    const notes = [
      { id: 'src', string: 0, fret: 5, legatoNext: 'dest', intermediateNoteIds: ['int'] },
      { id: 'int', string: 0, fret: 7, legatoPrev: 'src', startBeat: 1 },
      { id: 'dest', string: 0, fret: 8, legatoPrev: 'src' }
    ]
    LegatoFretVisualizationService.show('src', notes as any)
    expect(mockSetHighlights).toHaveBeenCalledWith([
      { si: 0, fret: 5 },
      { si: 0, fret: 7 },
      { si: 0, fret: 8 }
    ])
  })

  it('should clear highlights', () => {
    LegatoFretVisualizationService.clear()
    expect(mockSetHighlights).toHaveBeenCalledWith([])
  })
})
