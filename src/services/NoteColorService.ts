/**
 * @file NoteColorService.ts
 * Logic for computing note colors based on scale degrees, mode zones, and editor state.
 */
import * as THREE from 'three'
import { getNoteDegree } from '../hooks/useNoteHelpers'
import { getNoteName } from '../utils/guitarUtils'
import { ModeZoneService } from './ModeZoneService'
import {
  SCALE_COLORS, OFF_COL, LEGATO_COL, PEND_COL
} from '../components/tablature/scene/sceneConstants'
import type { TablatureNote } from '../types'

export class NoteColorService {
  /**
   * Computes the fill color for a note pod.
   * Colors are derived from scale degrees within the active Mode Zone.
   */
  static getNoteColor(
    note: TablatureNote,
    params: {
      legatoSourceId: string | null
      editingId: string | null
      tuningArr: string[]
      intermediateIds: Set<string>
      totalMeasures: number
      scaleNotes: string[]
      skipDarken?: boolean
      fretOverride?: number
    }
  ): string {
    const {
      legatoSourceId, editingId, tuningArr, intermediateIds,
      totalMeasures, scaleNotes, skipDarken = false, fretOverride
    } = params

    let hex = OFF_COL
    if (legatoSourceId) {
      if (legatoSourceId === note.id) hex = LEGATO_COL
      else hex = OFF_COL
    } else if (note.id === editingId) {
      hex = PEND_COL
    } else {
      const open = tuningArr[note.string]
      // Zone scale takes priority; fall back to the global scaleNotes when no zone covers this beat
      const zoneScale = ModeZoneService.getScaleForBeat(note.startBeat, totalMeasures)
      const activeScale = zoneScale ?? scaleNotes
      
      const deg = open ? getNoteDegree(getNoteName(open, fretOverride ?? note.fret), activeScale) : null
      hex = deg ? SCALE_COLORS[deg - 1] : OFF_COL
    }

    // Generated (intermediate) notes are 50% darker and 30% desaturated
    if (!skipDarken && intermediateIds.has(note.id) && hex !== LEGATO_COL && hex !== PEND_COL) {
      const c = new THREE.Color(hex)
      const hsl = { h: 0, s: 0, l: 0 }
      c.getHSL(hsl)
      c.setHSL(hsl.h, hsl.s * 0.7, hsl.l * 0.5)
      return '#' + c.getHexString()
    }

    return hex
  }
}
