/**
 * @file tabUtils.ts
 * Core geometry constants and pure utility functions shared across the tablature editor.
 *
 * This file is the single source of truth for layout constants (string spacing, beat
 * width, lane height, etc.) and the hit-zone detection logic used by all interactive
 * pods.  It also re-exports `NoteZone` from `src/types/drag.d.ts` so consumers can
 * import both the type and the functions from one place.
 *
 * Constraint functions (`constrainMove`, `constrainChordGroupMove`, etc.) access the
 * Zustand store via `getState()` — they are intentionally NOT pure so that callers
 * do not need to pass the full notes array on every call (would cause re-renders).
 */
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import type { TablatureNote } from '../stores/useTablatureR3FStore'
import type { NoteZone } from '../types/drag'
export type { NoteZone }

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

// ── Derived scene geometry (shared by TablatureR3F and scene sub-components) ──
export const LANE_H_HALF  = LANE_H / 2
export const gridTop      = ((N_STRINGS - 1) / 2) * STRING_H + LANE_H / 2 + 0.12
export const gridBottom   = -gridTop
export const LEFT_MARGIN_W = MEASURE_W / 8 * 0.7
export const HEADER_H     = GAP_WU
export const POD_HEADER_OFF = LANE_H / 2 + GAP_WU / 2
export const BUBBLE_W     = 0.25

export function stringY(si: number) { return (si - (N_STRINGS - 1) / 2) * STRING_H }
export function siFromWorldY(y: number) {
  return Math.max(0, Math.min(N_STRINGS - 1, Math.round(y / STRING_H + (N_STRINGS - 1) / 2)))
}
export function snapBeat(v: number) { return Math.round(v / SNAP) * SNAP }

// ── Hit-zone detection for note/chord/progression pods ───────────────────────
export function noteZone(lx: number, w: number, invStretchX: number): NoteZone {
  const rx = 0.15 * invStretchX, bx = 0.50 * invStretchX
  const fx = 1.20 * invStretchX, nx = 2.40 * invStretchX
  if (lx < rx) return 'resize-left'
  if (lx < bx) return 'bubble-prev'
  if (lx < fx) return 'fret'
  if (lx < nx) return 'name'
  if (lx > w - rx) return 'resize-right'
  if (lx > w - bx) return 'bubble-next'
  return 'move'
}

export function noteZoneCompact(lx: number, w: number, invStretchX: number, showBubble = false): NoteZone {
  const rx = 0.15 * invStretchX, bx = 0.50 * invStretchX
  if (lx < rx) return 'resize-left'
  if (lx > w - rx) return 'resize-right'
  if (showBubble && lx > w - bx) return 'bubble-next'
  return 'move'
}

export function zoneCursor(z: NoteZone): string {
  if (z === 'resize-left')  return 'w-resize'
  if (z === 'resize-right') return 'e-resize'
  if (z === 'bubble-prev' || z === 'bubble-next') return 'crosshair'
  if (z === 'fret' || z === 'name') return 'text'
  return 'grab'
}

export function noteInRect(n: TablatureNote, x0: number, y0: number, x1: number, y1: number): boolean {
  const rx0 = Math.min(x0, x1), rx1 = Math.max(x0, x1)
  const ry0 = Math.min(y0, y1), ry1 = Math.max(y0, y1)
  const nx0 = n.startBeat * BEAT_W
  const nx1 = nx0 + n.duration * BEAT_W
  const ny  = stringY(n.string)
  return nx0 < rx1 && nx1 > rx0 && (ny - LANE_H / 2) < ry1 && (ny + LANE_H / 2) > ry0
}

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

  // ── Per-note string collision (unchanged, correct) ──────────────────────────
  for (const gn of origNotes) {
    for (const n of all) {
      if (movingNoteIds.has(n.id) || n.string !== gn.string) continue
      if (n.startBeat + n.duration <= gn.startBeat)
        lo = Math.max(lo, n.startBeat + n.duration - gn.startBeat)
      else if (n.startBeat >= gn.startBeat + gn.duration)
        hi = Math.min(hi, n.startBeat - (gn.startBeat + gn.duration))
    }
  }

  // ── Group-level collision — FIXED: check string overlap before applying
  // temporal constraint. Two chord groups that occupy different strings can
  // coexist at the same beat position; the old code incorrectly blocked moves
  // between groups that had no shared string (false positives). ──────────────
  const movingStrings = new Set(origNotes.map(n => n.string))
  const gMin = Math.min(...origNotes.map(n => n.startBeat))
  const gMax = Math.max(...origNotes.map(n => n.startBeat + n.duration))

  for (const other of groups) {
    if (other.noteIds.some(id => movingNoteIds.has(id))) continue
    const otherNotes = all.filter(n => other.noteIds.includes(n.id))
    if (!otherNotes.length) continue

    // Only apply group-level time constraint when the other group shares at
    // least one string with the moving group — otherwise they can't collide.
    const otherStrings = new Set(otherNotes.map(n => n.string))
    const sharesString = [...movingStrings].some(s => otherStrings.has(s))
    if (!sharesString) continue

    const oMin = Math.min(...otherNotes.map(n => n.startBeat))
    const oMax = Math.max(...otherNotes.map(n => n.startBeat + n.duration))
    if (oMax <= gMin) lo = Math.max(lo, oMax - gMin)
    else if (oMin >= gMax) hi = Math.min(hi, oMin - gMax)
  }

  return Math.max(lo, Math.min(hi, dBeat))
}
