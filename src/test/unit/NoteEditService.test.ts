import { NoteEditService } from '../../services/NoteEditService'

describe('NoteEditService', () => {
  const note = { string: 0 }
  const tuningArr = ['E2']

  it('should parse numeric fret strings', () => {
    expect(NoteEditService.parseFret('5', note as any, tuningArr)).toBe(5)
    expect(NoteEditService.parseFret('0', note as any, tuningArr)).toBe(0)
    expect(NoteEditService.parseFret('24', note as any, tuningArr)).toBe(24)
  })

  it('should return null for invalid numeric strings', () => {
    expect(NoteEditService.parseFret('-1', note as any, tuningArr)).toBe(null)
    expect(NoteEditService.parseFret('25', note as any, tuningArr)).toBe(null)
    expect(NoteEditService.parseFret('abc', note as any, tuningArr)).toBe(null)
  })

  it('should parse note names with octaves', () => {
    // E2 + ? = A2 -> 5th fret
    expect(NoteEditService.parseFret('A2', note as any, tuningArr)).toBe(5)
    // E2 + ? = E3 -> 12th fret
    expect(NoteEditService.parseFret('E3', note as any, tuningArr)).toBe(12)
  })

  it('should parse note names without octaves (pitch classes)', () => {
    // E2 + ? = G -> 3rd fret (nearest G is G2)
    expect(NoteEditService.parseFret('G', note as any, tuningArr)).toBe(3)
  })

  it('should return null for invalid note names', () => {
    expect(NoteEditService.parseFret('H', note as any, tuningArr)).toBe(null)
    expect(NoteEditService.parseFret('Z1', note as any, tuningArr)).toBe(null)
  })
})
