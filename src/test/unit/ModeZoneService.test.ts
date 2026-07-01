import { ModeZoneService } from '../../services/ModeZoneService'
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

describe('ModeZoneService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTablatureR3FStore.getState as any).mockReturnValue({
      modeZones: [],
      pushHistory: vi.fn(),
      updateModeZone: vi.fn()
    })
    ;(useTablatureStore.getState as any).mockReturnValue({
      tuning: 'E2,A2,D3,G3,B3,E4'
    })
    ;(useMainStore.getState as any).mockReturnValue({
      userScale: 'C'
    })
  })

  it('getZoneBounds should return correct start and end beats', () => {
    const zone: any = { startBeat: 4, length: 1 } // length 1 measure = 4 beats
    const bounds = ModeZoneService.getZoneBounds(zone)
    expect(bounds.startBeat).toBe(4)
    expect(bounds.endBeat).toBe(8)
  })

  it('getActiveZoneAt should return the latest zone if overlapping', () => {
    const zones = [
      { id: '1', startBeat: 0, length: 2 }, // 0 to 8
      { id: '2', startBeat: 4, length: 1 }, // 4 to 8
    ]
    ;(useTablatureR3FStore.getState as any).mockReturnValue({ modeZones: zones })

    const active = ModeZoneService.getActiveZoneAt(5, 10)
    expect(active?.id).toBe('2') // latest startBeat
  })

  describe('getVirtualFret', () => {
    it('should return null if no zone or forceNote is false', () => {
      const note: any = { startBeat: 2, string: 0, fret: 5 }
      expect(ModeZoneService.getVirtualFret(note, 10)).toBeNull()
    })

    it('should return null if note is already in scale', () => {
      const zones = [{ id: '1', startBeat: 0, length: 2, forceNote: true, modeName: 'ionian' }]
      ;(useTablatureR3FStore.getState as any).mockReturnValue({ modeZones: zones })
      ;(useMainStore.getState as any).mockReturnValue({ userScale: 'C' })

      // C on string 0 (E2) fret 8
      const note: any = { startBeat: 2, string: 0, fret: 8 }
      expect(ModeZoneService.getVirtualFret(note, 10)).toBeNull()
    })

    it('should force note to nearest scale tone', () => {
      const zones = [{ id: '1', startBeat: 0, length: 2, forceNote: true, modeName: 'ionian' }]
      ;(useTablatureR3FStore.getState as any).mockReturnValue({ modeZones: zones })
      ;(useMainStore.getState as any).mockReturnValue({ userScale: 'C' })

      // F# (fret 2 on string 0) -> F (fret 1) or G (fret 3)
      const note: any = { startBeat: 2, string: 0, fret: 2 }
      const virtual = ModeZoneService.getVirtualFret(note, 10)
      expect(virtual).toBe(1) // F is found first in scale traversal and is equally close as G
    })

    it('should respect melodicDirection up', () => {
      const zones = [{ id: '1', startBeat: 0, length: 2, forceNote: true, modeName: 'ionian' }]
      ;(useTablatureR3FStore.getState as any).mockReturnValue({ modeZones: zones })
      ;(useMainStore.getState as any).mockReturnValue({ userScale: 'C' })

      // D# (fret 11 on string 0) -> E (fret 12) or D (fret 10)
      const note: any = { startBeat: 2, string: 0, fret: 11 }
      
      expect(ModeZoneService.getVirtualFret(note, 10, 'up')).toBe(12)
    })

    it('should respect melodicDirection down', () => {
      const zones = [{ id: '1', startBeat: 0, length: 2, forceNote: true, modeName: 'ionian' }]
      ;(useTablatureR3FStore.getState as any).mockReturnValue({ modeZones: zones })
      ;(useMainStore.getState as any).mockReturnValue({ userScale: 'C' })

      const note: any = { startBeat: 2, string: 0, fret: 11 }
      expect(ModeZoneService.getVirtualFret(note, 10, 'down')).toBe(10)
    })
  })
})
