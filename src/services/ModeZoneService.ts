/**
 * @file ModeZoneService.ts
 * Business logic for Mode pods — temporal zones that impose a musical scale on a
 * range of beats in the tablature.
 *
 * Key design decisions:
 * - `getVirtualFret` is purely non-destructive: it never writes to the store. Callers
 *   read the effective fret for display/playback without altering the note's own `fret`.
 *   Moving or deleting the Mode pod reverts the effect instantly, with nothing to undo.
 * - When zones overlap in time, the one with the latest `startBeat` takes priority
 *   (the most recently placed pod wins — matches user mental model of "last placed = active").
 * - `getVirtualFret` checks ALL fret positions of each scale pitch-class on the string
 *   (not just the nearest octave), and accepts an optional `melodicDirection` hint so
 *   ascending/descending phrases resolve to the musically correct octave.
 */
import { Note } from 'tonal'
import { useTablatureR3FStore, ModeZone, TablatureNote } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useMainStore } from '../stores/useMainStore'
import { EXTRA_MODES } from '../data/extraModes'
import { getNoteName } from '../hooks/useNoteHelpers'
import { findAllFretsForPc } from '../utils/guitarUtils'
import { BEATS_PER_MEAS } from '../utils/tabUtils'

export const ModeZoneService = {
  /** Nav chevrons cycling through EXTRA_MODES (62 modes, flat list) — same pattern as
   * PodModifierService.getChordTypeNav. */
  getModeNav(zone: ModeZone) {
    const idx = Math.max(0, EXTRA_MODES.findIndex(m => m.name === zone.modeName))
    const apply = (name: string) => {
      useTablatureR3FStore.getState().pushHistory()
      useTablatureR3FStore.getState().updateModeZone(zone.id, { modeName: name })
    }
    return {
      label: zone.modeName,
      prev: () => apply(EXTRA_MODES[(idx - 1 + EXTRA_MODES.length) % EXTRA_MODES.length].name),
      next: () => apply(EXTRA_MODES[(idx + 1) % EXTRA_MODES.length].name),
    }
  },

  /**
   * A Mode pod's influence zone is `[startBeat, startBeat + length measures)` — explicit,
   * user-resizable (1 measure by default, minimum MODE_ZONE_MIN_LENGTH = 1/8 measure).
   */
  getZoneBounds(zone: ModeZone): { startBeat: number; endBeat: number } {
    return { startBeat: zone.startBeat, endBeat: zone.startBeat + zone.length * BEATS_PER_MEAS }
  },

  /** The ModeZone (if any) whose influence zone covers `beat`. If zones overlap, the one with
   * the latest startBeat wins (the most recently/closely placed pod takes priority). */
  getActiveZoneAt(beat: number, totalMeasures: number): ModeZone | undefined {
    const allZones = useTablatureR3FStore.getState().modeZones
    const covering = allZones.filter(z => {
      const { startBeat, endBeat } = ModeZoneService.getZoneBounds(z)
      return beat >= startBeat && beat < endBeat
    })
    if (covering.length === 0) return undefined
    return covering.reduce((latest, z) => z.startBeat > latest.startBeat ? z : latest)
  },

  /**
   * The scale (pitch-class array, rooted on the global userScale tonic) for whichever Mode
   * Zone covers `beat`, or null if no zone covers it. There is no app-wide "current mode"
   * anymore (legacy concept, removed) — a note's scale membership/color is determined purely
   * by its own position relative to the Mode pods actually placed on the tablature. A note
   * outside every zone has no scale to be measured against (renders as off-scale/neutral).
   */
  getScaleForBeat(beat: number, totalMeasures: number): string[] | null {
    const zone = ModeZoneService.getActiveZoneAt(beat, totalMeasures)
    if (!zone) return null
    const zoneMode = EXTRA_MODES.find(m => m.name === zone.modeName)
    if (!zoneMode) return null
    const userScale = useMainStore.getState().userScale
    return zoneMode.intervals.map(iv => Note.transpose(userScale, iv))
  },

  /**
   * Non-destructive "force note": returns the EFFECTIVE fret to display/play for a note that
   * falls inside an active force-note Mode zone, or null to leave the note unchanged.
   *
   * Improvements over the naïve "nearest fret" approach:
   * - Checks ALL fret positions of each scale pitch-class on the same string (not just the
   *   nearest-octave one) so the melodic direction can select the correct register.
   * - Accepts an optional `melodicDirection` hint ('up' | 'down'): candidates moving against
   *   the direction incur a large fixed penalty so the correct octave is preferred even when
   *   it is farther away in absolute fret distance.
   *
   * Purely zone-local — if the note's pitch-class is already in the zone's scale, returns null.
   */
  getVirtualFret(
    note: TablatureNote,
    totalMeasures: number,
    melodicDirection?: 'up' | 'down'
  ): number | null {
    const zone = ModeZoneService.getActiveZoneAt(note.startBeat, totalMeasures)
    if (!zone || !zone.forceNote) return null

    const scale = ModeZoneService.getScaleForBeat(note.startBeat, totalMeasures)
    if (!scale) return null

    const tuning = useTablatureStore.getState().tuning.split(',')
    const openNote = tuning[note.string] ?? 'E2'
    const notePc = Note.pitchClass(getNoteName(openNote, note.fret))
    const scalePcs = scale.map(n => Note.pitchClass(n))
    if (scalePcs.includes(notePc)) return null

    let bestFret: number | null = null
    let bestScore = Infinity

    for (const pc of scalePcs) {
      // Check every fret on this string that matches the pitch class (multiple octaves)
      for (const f of findAllFretsForPc(openNote, pc)) {
        const diff = Math.abs(f - note.fret)
        // When a melodic direction is supplied, penalise candidates going the wrong way.
        // The penalty (50 + diff) guarantees that even the nearest wrong-direction fret
        // loses to any in-direction candidate reachable within a reasonable hand stretch.
        const dirPenalty = melodicDirection
          ? ((melodicDirection === 'up'   && f <= note.fret) ||
             (melodicDirection === 'down' && f >= note.fret))
            ? 50 + diff
            : 0
          : 0
        const score = diff + dirPenalty
        if (score < bestScore) { bestScore = score; bestFret = f }
      }
    }

    return bestFret
  },
}
