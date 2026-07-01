import { TablatureDropService } from '../../services/TablatureDropService'
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
    getState: vi.fn(() => ({ tuning: 'E2,A2,D3,G3,B3,E4' }))
  }
}))

vi.mock('../../stores/useMainStore', () => ({
  useMainStore: {
    getState: vi.fn(() => ({ 
      userScale: 'C',
      setUserScale: vi.fn() 
    }))
  }
}))

describe('TablatureDropService', () => {
  const mockAddNote = vi.fn(() => 'new-note-id')
  const mockAddChordGroup = vi.fn(() => 'new-group-id')
  const mockAddProgressionGroup = vi.fn(() => 'new-prog-id')
  const mockUpdateNote = vi.fn()
  const mockPushHistory = vi.fn()
  const mockSetUserScale = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMainStore.getState).mockReturnValue({
      userScale: 'C',
      setUserScale: mockSetUserScale
    } as any)
    vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
      notes: [],
      chordGroups: [],
      rhythmModifiers: [],
      addNote: mockAddNote,
      addChordGroup: mockAddChordGroup,
      addProgressionGroup: mockAddProgressionGroup,
      updateNote: mockUpdateNote,
      setLegatoSourceId: vi.fn(),
      pushHistory: mockPushHistory,
      removeChordGroup: vi.fn()
    } as any)
  })

  it('handleDrop should create a chord group from a progression template', () => {
    const prog = {
      name: 'Test Prog',
      numerals: 'I-IV',
      description: '',
      compatibleModes: []
    }

    TablatureDropService.handleDrop(prog as any, 0, 0, [])

    expect(mockPushHistory).toHaveBeenCalled()
    expect(mockAddNote).toHaveBeenCalled()
    expect(mockAddChordGroup).toHaveBeenCalled()
    expect(mockAddProgressionGroup).toHaveBeenCalled()
  })

  it('handleDrop should anchor chord to existing note if dropped on it', () => {
    const prog = {
      name: 'Test Prog',
      numerals: 'I',
      description: '',
      compatibleModes: []
    }
    const existingNote = { id: 'n1', string: 0, startBeat: 0, duration: 4, fret: 0 }
    
    vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
      notes: [existingNote],
      chordGroups: [],
      rhythmModifiers: [],
      addNote: mockAddNote,
      addChordGroup: mockAddChordGroup,
      addProgressionGroup: mockAddProgressionGroup,
      updateNote: mockUpdateNote,
      setLegatoSourceId: vi.fn(),
      pushHistory: mockPushHistory,
      removeChordGroup: vi.fn()
    } as any)

    // Drop on E2 (string 0, fret 0)
    TablatureDropService.handleDrop(prog as any, 0, 0, [])

    // Should update existing note instead of adding a new one for string 0
    expect(mockUpdateNote).toHaveBeenCalledWith('n1', expect.anything(), expect.anything(), expect.anything())
  })
})
