import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'

describe('useTablatureR3FStore', () => {
  beforeEach(() => {
    // Reset store before each test
    // Since Zustand stores are persistent in Vitest, we need a way to reset them.
    // A simple way is to use the store's internal state if exposed, or just clear notes.
    const state = useTablatureR3FStore.getState()
    state.notes = []
    state.chordGroups = []
    state.rhythmModifiers = []
    state.past = []
    state.future = []
  })

  describe('Note CRUD', () => {
    it('should add a note and generate an ID', () => {
      const { addNote } = useTablatureR3FStore.getState()
      const id = addNote({ string: 0, fret: 5, startBeat: 0, duration: 1 })
      
      const state = useTablatureR3FStore.getState()
      expect(id).toBeDefined()
      expect(state.notes.length).toBe(1)
      expect(state.notes[0].fret).toBe(5)
    })

    it('should update an existing note', () => {
      const { addNote, updateNote } = useTablatureR3FStore.getState()
      const id = addNote({ string: 0, fret: 5, startBeat: 0, duration: 1 })
      
      updateNote(id, { fret: 7 })
      
      const state = useTablatureR3FStore.getState()
      expect(state.notes[0].fret).toBe(7)
    })

    it('should delete a note and remove it from chord groups', () => {
      const { addNote, addChordGroup, deleteNote } = useTablatureR3FStore.getState()
      const n1 = addNote({ string: 0, fret: 5, startBeat: 0, duration: 1 })
      const n2 = addNote({ string: 1, fret: 7, startBeat: 0, duration: 1 })
      
      addChordGroup([n1, n2], 'A5')
      
      let state = useTablatureR3FStore.getState()
      expect(state.chordGroups[0].noteIds.length).toBe(2)
      
      deleteNote(n1)
      
      state = useTablatureR3FStore.getState()
      expect(state.notes.length).toBe(1)
      expect(state.chordGroups[0].noteIds).toEqual([n2])
    })
  })

  describe('History (Undo/Redo)', () => {
    it('should push current state to past when pushHistory is called', () => {
      const { addNote, pushHistory, undo } = useTablatureR3FStore.getState()
      
      pushHistory()
      addNote({ string: 0, fret: 5, startBeat: 0, duration: 1 })
      
      expect(useTablatureR3FStore.getState().notes.length).toBe(1)
      
      undo()
      
      expect(useTablatureR3FStore.getState().notes.length).toBe(0)
    })

    it('should redo an undone action', () => {
      const { addNote, pushHistory, undo, redo } = useTablatureR3FStore.getState()
      
      pushHistory()
      addNote({ string: 0, fret: 5, startBeat: 0, duration: 1 })
      
      undo()
      expect(useTablatureR3FStore.getState().notes.length).toBe(0)
      
      redo()
      expect(useTablatureR3FStore.getState().notes.length).toBe(1)
    })
  })
})
