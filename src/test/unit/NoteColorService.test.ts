import { NoteColorService } from '../../services/NoteColorService'
import { ModeZoneService } from '../../services/ModeZoneService'
import {
  SCALE_COLORS, OFF_COL, LEGATO_COL, PEND_COL
} from '../../components/tablature/scene/sceneConstants'

vi.mock('../../services/ModeZoneService', () => ({
  ModeZoneService: {
    getScaleForBeat: vi.fn()
  }
}))

describe('NoteColorService', () => {
  const note = { id: 'n1', string: 0, fret: 0, startBeat: 0, duration: 1 }
  const params = {
    legatoSourceId: null,
    editingId: null,
    tuningArr: ['E2'],
    intermediateIds: new Set<string>(),
    totalMeasures: 4,
    scaleNotes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] // E Major
  }

  it('should return LEGATO_COL if note is legato source', () => {
    const res = NoteColorService.getNoteColor(note as any, { ...params, legatoSourceId: 'n1' })
    expect(res).toBe(LEGATO_COL)
  })

  it('should return PEND_COL if note is being edited', () => {
    const res = NoteColorService.getNoteColor(note as any, { ...params, editingId: 'n1' })
    expect(res).toBe(PEND_COL)
  })

  it('should return first scale color for tonic note', () => {
    const res = NoteColorService.getNoteColor(note as any, params)
    expect(res).toBe(SCALE_COLORS[0])
  })

  it('should return OFF_COL for non-scale note', () => {
    const nonScaleNote = { ...note, fret: 1 } // F2
    const res = NoteColorService.getNoteColor(nonScaleNote as any, params)
    expect(res).toBe(OFF_COL)
  })

  it('should use zone scale if available', () => {
    vi.mocked(ModeZoneService.getScaleForBeat).mockReturnValue(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']) // F Major
    const fNote = { ...note, fret: 1 } // F2
    const res = NoteColorService.getNoteColor(fNote as any, params)
    expect(res).toBe(SCALE_COLORS[0])
  })

  it('should darken intermediate notes', () => {
    const res = NoteColorService.getNoteColor(note as any, { 
      ...params, 
      intermediateIds: new Set(['n1']) 
    })
    expect(res).not.toBe(SCALE_COLORS[0])
    expect(res.startsWith('#')).toBe(true)
  })
})
