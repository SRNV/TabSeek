import { Note } from 'tonal'
import { useTablatureR3FStore, ModeZone, TablatureNote } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useMainStore } from '../stores/useMainStore'
import { EXTRA_MODES } from '../composables/extraModes'
import { getNoteName } from '../composables/useNoteHelpers'
import { findFretForPc } from '../utils/guitarUtils'
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
  getZoneBounds(zone: ModeZone, _allZones?: ModeZone[], _totalMeasures?: number): { startBeat: number; endBeat: number } {
    return { startBeat: zone.startBeat, endBeat: zone.startBeat + zone.length * BEATS_PER_MEAS }
  },

  /** The ModeZone (if any) whose influence zone covers `beat`. If zones overlap, the one with
   * the latest startBeat wins (the most recently/closely placed pod takes priority). */
  getActiveZoneAt(beat: number, totalMeasures: number): ModeZone | undefined {
    const allZones = useTablatureR3FStore.getState().modeZones
    const covering = allZones.filter(z => {
      const { startBeat, endBeat } = ModeZoneService.getZoneBounds(z, allZones, totalMeasures)
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
   * Non-destructive "force note": never writes to the note's own string/fret. Returns the
   * EFFECTIVE fret to display/play for this note if it falls inside an active force-note Mode
   * zone, or null to use the note's own fret unchanged. Computed fresh every call (no stored
   * state to go stale) — moving/deleting/toggling off the zone reverts the effect instantly,
   * nothing to undo.
   *
   * Purely zone-local (no "previous global mode" reference, which no longer exists): if the
   * note's own pitch class is already in the zone's scale, no change. Otherwise snaps to the
   * nearest pitch class of that scale, same string (no cross-string jump).
   */
  getVirtualFret(note: TablatureNote, totalMeasures: number): number | null {
    const zone = ModeZoneService.getActiveZoneAt(note.startBeat, totalMeasures)
    if (!zone || !zone.forceNote) return null

    const scale = ModeZoneService.getScaleForBeat(note.startBeat, totalMeasures)
    if (!scale) return null

    const tuning = useTablatureStore.getState().tuning.split(',')
    const openNote = tuning[note.string] ?? 'E2'
    const notePc = Note.pitchClass(getNoteName(openNote, note.fret))
    const scalePcs = scale.map(n => Note.pitchClass(n))
    if (scalePcs.includes(notePc)) return null // already in the zone's scale, nothing to do

    // Nearest fret (any pitch class in the zone's scale), same string, closest to the current fret
    let bestFret: number | null = null
    let bestDiff = Infinity
    scalePcs.forEach(pc => {
      const f = findFretForPc(openNote, pc, note.fret)
      if (f < 0 || f > 24) return // skip frets outside playable range
      const diff = Math.abs(f - note.fret)
      if (diff < bestDiff) { bestDiff = diff; bestFret = f }
    })
    return bestFret
  },
}
