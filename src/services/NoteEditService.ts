/**
 * @file NoteEditService.ts
 * Logic for parsing and validating note/fret input from the editor.
 */
import { Note } from 'tonal'
import { findFretForNote, findFretForPc } from '../utils/guitarUtils'
import type { TablatureNote } from '../types'

export class NoteEditService {
  /**
   * Parses a string value (fret number or note name) and returns a valid fret number [0-24].
   * Returns null if the input is invalid.
   */
  static parseFret(val: string, note: TablatureNote, tuningArr: string[]): number | null {
    if (val === '') return null

    if (/^[A-Ga-g][#b]?(\d?)$/.test(val)) {
      const openNote = tuningArr[note.string]
      const hasOctave = /\d$/.test(val)
      if (hasOctave) {
        return findFretForNote(openNote, val)
      } else {
        const pc = Note.pitchClass(val)
        if (pc) return findFretForPc(openNote, pc)
      }
    } else {
      const n = parseInt(val, 10)
      if (!isNaN(n) && n >= 0 && n <= 24) return n
    }

    return null
  }
}
