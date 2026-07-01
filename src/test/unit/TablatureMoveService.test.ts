import { TablatureMoveService } from '../../services/TablatureMoveService'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { RhythmModifierService } from '../../services/RhythmModifierService'

vi.mock('../../stores/useTablatureR3FStore', () => ({
  useTablatureR3FStore: {
    getState: vi.fn()
  }
}))

vi.mock('../../services/RhythmModifierService', () => ({
  RhythmModifierService: {
    isLegatoLocked: vi.fn(() => false)
  }
}))

describe('TablatureMoveService', () => {
  const mockUpdateNote = vi.fn()
  const mockNotes = [{ id: 'n1', string: 0, fret: 5, startBeat: 0, duration: 1 }]
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
      notes: mockNotes,
      chordGroups: [],
      updateNote: mockUpdateNote
    } as any)
  })

  it('handleNoteMove should move a note based on mouse delta', () => {
    const dragData = {
      type: 'move',
      noteId: 'n1',
      startX: 0,
      origBeat: 0,
      origDur: 1,
      origSi: 0,
      origFret: 5
    }

    // Move 1 beat to the right (BEAT_W = 3.0)
    TablatureMoveService.handleNoteMove(
      dragData as any, 
      3.0, 0, 
      (x) => x, (y) => y, (y) => 0, 
      ['E2'], []
    )

    expect(mockUpdateNote).toHaveBeenCalledWith('n1', expect.objectContaining({
      startBeat: 1
    }), expect.anything(), expect.anything())
  })

  it('handleNoteMove should prevent move if legato locked', () => {
    vi.mocked(RhythmModifierService.isLegatoLocked).mockReturnValue(true)
    
    const dragData = {
      type: 'resize-right',
      noteId: 'n1',
      startX: 0,
      origBeat: 0,
      origDur: 1,
      origSi: 0,
      origFret: 5
    }

    TablatureMoveService.handleNoteMove(
      dragData as any, 
      3.0, 0, 
      (x) => x, (y) => y, (y) => 0, 
      ['E2'], []
    )

    expect(mockUpdateNote).not.toHaveBeenCalled()
  })
})
