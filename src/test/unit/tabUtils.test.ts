import { 
  stringY, siFromWorldY, snapBeat, noteZone, noteZoneCompact, zoneCursor, noteInRect,
  constrainMove, constrainRight, constrainLeft,
  N_STRINGS, STRING_H, BEAT_W, LANE_H, SNAP, MIN_DUR
} from '../../utils/tabUtils'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'

// Mock the store for constraint functions
vi.mock('../../stores/useTablatureR3FStore', () => ({
  useTablatureR3FStore: {
    getState: vi.fn()
  }
}))

describe('tabUtils', () => {
  describe('Geometry helpers', () => {
    it('stringY should return correct Y position for each string', () => {
      expect(stringY(0)).toBeCloseTo(-3.375)
      expect(stringY(5)).toBeCloseTo(3.375)
    })

    it('siFromWorldY should return correct string index from Y coordinate', () => {
      expect(siFromWorldY(-3.375)).toBe(0)
      expect(siFromWorldY(3.375)).toBe(5)
    })

    it('snapBeat should snap to the nearest SNAP interval', () => {
      expect(snapBeat(0.2)).toBe(0.25)
      expect(snapBeat(1.12)).toBe(1.0)
    })
  })

  describe('Hit-zone detection', () => {
    it('noteZone should return correct zone based on relative X', () => {
      const w = 4.0
      const invX = 1.0
      expect(noteZone(0.05, w, invX)).toBe('resize-left')
      expect(noteZone(3.9, w, invX)).toBe('resize-right')
      expect(noteZone(3.0, w, invX)).toBe('move')
    })
  })

  describe('Rect intersection', () => {
    const note = { id: '1', string: 2, startBeat: 1, duration: 2, fret: 5 }
    it('noteInRect should return true if note is within bounds', () => {
      const ny = stringY(2)
      expect(noteInRect(note as any, 2, ny - 0.1, 4, ny + 0.1)).toBe(true)
    })
  })

  describe('Constraint functions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('constrainMove should prevent overlapping with other notes on same string', () => {
      const notes = [
        { id: '1', string: 2, startBeat: 0, duration: 1 },
        { id: '2', string: 2, startBeat: 4, duration: 2 }
      ]
      vi.mocked(useTablatureR3FStore.getState).mockReturnValue({ notes } as any)
      expect(constrainMove(0.5, 2, 2, '2')).toBe(1.0)
    })
  })
})
