import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'

export const N_STRINGS       = 6
export const STRING_H        = 1.35
export const GAP_WU          = 0.20
export const LANE_H          = STRING_H - GAP_WU
export const NOTE_H          = LANE_H * 0.87
export const BEAT_W          = 3.0
export const SNAP            = 0.25
export const MIN_DUR         = 0.25
export const BEATS_PER_MEAS  = 4
export const MEASURE_W       = BEATS_PER_MEAS * BEAT_W

export function stringY(si: number) { return (si - (N_STRINGS - 1) / 2) * STRING_H }
export function siFromWorldY(y: number) {
  return Math.max(0, Math.min(N_STRINGS - 1, Math.round(y / STRING_H + (N_STRINGS - 1) / 2)))
}
export function snapBeat(v: number) { return Math.round(v / SNAP) * SNAP }

export function constrainMove(wantedBeat: number, dur: number, si: number, id: string) {
  const center = wantedBeat + dur / 2
  let lo = 0, hi = 1e9
  for (const o of useTablatureR3FStore.getState().notes) {
    if (o.id === id || o.string !== si) continue
    if (o.startBeat + o.duration / 2 < center) lo = Math.max(lo, o.startBeat + o.duration)
    else                                         hi = Math.min(hi, o.startBeat - dur)
  }
  return Math.max(lo, Math.min(hi, wantedBeat))
}

export function constrainRight(beat: number, wantedDur: number, si: number, id: string) {
  let max = 1e9
  for (const o of useTablatureR3FStore.getState().notes)
    if (o.id !== id && o.string === si && o.startBeat >= beat)
      max = Math.min(max, o.startBeat - beat)
  return Math.max(MIN_DUR, Math.min(max, wantedDur))
}

export function constrainLeft(rightEdge: number, wantedBeat: number, si: number, id: string) {
  let min = 0
  for (const o of useTablatureR3FStore.getState().notes)
    if (o.id !== id && o.string === si && o.startBeat + o.duration <= rightEdge)
      min = Math.max(min, o.startBeat + o.duration)
  const beat = Math.max(min, Math.min(rightEdge - MIN_DUR, wantedBeat))
  return { beat, dur: rightEdge - beat }
}

export function constrainChordGroupMove(
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>,
  movingNoteIds: Set<string>,
  dBeat: number
): number {
  const state  = useTablatureR3FStore.getState()
  const all    = state.notes
  const groups = state.chordGroups
  let lo = -1e9, hi = 1e9

  const gMin = Math.min(...origNotes.map(n => n.startBeat))
  const gMax = Math.max(...origNotes.map(n => n.startBeat + n.duration))

  for (const gn of origNotes) {
    for (const n of all) {
      if (movingNoteIds.has(n.id) || n.string !== gn.string) continue
      if (n.startBeat + n.duration <= gn.startBeat)
        lo = Math.max(lo, n.startBeat + n.duration - gn.startBeat)
      else if (n.startBeat >= gn.startBeat + gn.duration)
        hi = Math.min(hi, n.startBeat - (gn.startBeat + gn.duration))
    }
  }

  for (const other of groups) {
    if (other.noteIds.some(id => movingNoteIds.has(id))) continue
    const otherNotes = all.filter(n => other.noteIds.includes(n.id))
    if (!otherNotes.length) continue
    const oMin = Math.min(...otherNotes.map(n => n.startBeat))
    const oMax = Math.max(...otherNotes.map(n => n.startBeat + n.duration))

    if (oMax <= gMin) lo = Math.max(lo, oMax - gMin)
    else if (oMin >= gMax) hi = Math.min(hi, oMin - gMax)
  }

  return Math.max(lo, Math.min(hi, dBeat))
}
