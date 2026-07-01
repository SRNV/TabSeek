/**
 * @file TablatureMoveService.ts
 * Handles pointer-move and pointer-up logic for all draggable elements in the
 * tablature editor: single notes (move/resize-left/resize-right), chord groups,
 * and progression groups.
 *
 * Each handler receives a typed drag-state discriminant union (see `src/types/drag.d.ts`)
 * and a pair of coordinate-conversion callbacks (`toWorldX`, `toWorldY`, `siFromWorldY`)
 * so that the calling component (TablatureR3F) stays decoupled from the conversion math.
 *
 * Collision avoidance is delegated to `src/utils/tabUtils.ts` constraint helpers which
 * read the Zustand store via `getState()` to avoid re-render subscriptions.
 */
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { RhythmModifierService } from './RhythmModifierService'
import { getNoteName, findFretForNote } from '../utils/guitarUtils'
import {
  BEAT_W, MIN_DUR,
  constrainMove, constrainRight, constrainLeft, constrainChordGroupMove
} from '../utils/tabUtils'
import type { DragNoteState, DragChordGroupState, DragProgGroupState } from '../types/drag'

type WxFn = (clientX: number) => number
type WyFn = (clientY: number) => number
type SiFromWorldY = (worldY: number) => number

type GroupNote = { id: string; startBeat: number; duration: number; string: number }

/**
 * Shared move/resize logic for chord groups and progression groups.
 * Previously duplicated verbatim in handleChordGroupMove + handleProgGroupMove (Paul P2-6).
 * The only difference between them was variable naming (origGroupStart vs origProgStart).
 */
function handleGroupMoveShared(
  d: { type: string; startX: number; origNotes: GroupNote[] },
  groupStart: number, groupEnd: number,
  clientX: number, wx: WxFn,
  tuningArr: string[], scaleNotes: string[]
) {
  const { updateNote } = useTablatureR3FStore.getState()
  const worldX = wx(clientX)
  const origW  = groupEnd - groupStart

  if (d.type === 'move') {
    const rawDelta = snapBeat((worldX - d.startX) / BEAT_W)
    const groupIds = new Set<string>(d.origNotes.map(n => n.id))
    const dBeat    = constrainChordGroupMove(d.origNotes, groupIds, rawDelta)
    for (const n of d.origNotes) {
      if (RhythmModifierService.isLegatoLocked(n.id)) continue
      updateNote(n.id, { startBeat: Math.max(0, n.startBeat + dBeat) }, tuningArr, scaleNotes)
    }
  } else if (d.type === 'resize-right') {
    const newEnd = Math.max(groupStart + MIN_DUR * Math.max(1, d.origNotes.length), snapBeat(worldX / BEAT_W))
    const newW   = newEnd - groupStart
    for (const n of d.origNotes) {
      if (RhythmModifierService.isLegatoLocked(n.id)) continue
      const relStart = (n.startBeat - groupStart) / origW
      updateNote(n.id, {
        startBeat: groupStart + relStart * newW,
        duration: Math.max(MIN_DUR, (n.duration / origW) * newW)
      }, tuningArr, scaleNotes)
    }
  } else if (d.type === 'resize-left') {
    const newStart = Math.max(0, Math.min(groupEnd - MIN_DUR, snapBeat(worldX / BEAT_W)))
    const newW     = groupEnd - newStart
    for (const n of d.origNotes) {
      if (RhythmModifierService.isLegatoLocked(n.id)) continue
      const relFromRight = (groupEnd - (n.startBeat + n.duration)) / origW
      const newDur = Math.max(MIN_DUR, (n.duration / origW) * newW)
      updateNote(n.id, {
        startBeat: Math.max(0, groupEnd - relFromRight * newW - newDur),
        duration: newDur
      }, tuningArr, scaleNotes)
    }
  }
}

export const TablatureMoveService = {
  handleNoteMove: (d: DragNoteState, clientX: number, clientY: number, wx: WxFn, wy: WyFn, siFromWorldY: SiFromWorldY, tuningArr: string[], scaleNotes: string[]) => {
    const { updateNote } = useTablatureR3FStore.getState()
    const n = useTablatureR3FStore.getState().notes.find(note => note.id === d.noteId)
    if (!n) return

    const locked = RhythmModifierService.isLegatoLocked(d.noteId)
    const dB = (wx(clientX) - d.startX) / BEAT_W

    if (d.type === 'move') {
      const newSi      = siFromWorldY(wy(clientY))
      const wantedBeat = locked ? d.origBeat : snapBeat(d.origBeat + dB)
      const newBeat    = constrainMove(wantedBeat, d.origDur, newSi, d.noteId)
      let newFret: number | undefined
      if (newSi !== n.string) {
        const state = useTablatureR3FStore.getState()
        const group = state.chordGroups.find(g => g.noteIds.includes(d.noteId))
        if (group) {
          // Rule: no two notes of the same chord can be on the same string.
          const stringTaken = state.notes.some(
            o => group.noteIds.includes(o.id) && o.id !== d.noteId && o.string === newSi
          )
          if (stringTaken) return  // block the move silently

          const tun   = useTablatureStore.getState().tuning.split(',')
          const pitch = getNoteName(tun[d.origSi], d.origFret)
          const found = newSi === d.origSi ? d.origFret : findFretForNote(tun[newSi], pitch)
          newFret = found !== null ? found : d.origFret
        }
      }
      updateNote(d.noteId, { startBeat: newBeat, string: newSi, ...(newFret !== undefined && { fret: newFret }) }, tuningArr, scaleNotes)
    } else if (d.type === 'resize-right') {
      if (locked) return
      updateNote(d.noteId, { duration: constrainRight(d.origBeat, snapBeat(d.origDur + dB), n.string, d.noteId) }, tuningArr, scaleNotes)
    } else if (d.type === 'resize-left') {
      if (locked) return
      const { beat, dur } = constrainLeft(d.origBeat + d.origDur, snapBeat(d.origBeat + dB), n.string, d.noteId)
      updateNote(d.noteId, { startBeat: beat, duration: dur }, tuningArr, scaleNotes)
    }
  },

  handleChordGroupMove: (d: DragChordGroupState, clientX: number, wx: WxFn, tuningArr: string[], scaleNotes: string[]) => {
    if (!d.didMove) { useTablatureR3FStore.getState().pushHistory(); d.didMove = true }
    handleGroupMoveShared(d, d.origGroupStart, d.origGroupEnd, clientX, wx, tuningArr, scaleNotes)
  },

  handleProgGroupMove: (d: DragProgGroupState, clientX: number, wx: WxFn, tuningArr: string[], scaleNotes: string[]) => {
    if (!d.didMove) { useTablatureR3FStore.getState().pushHistory(); d.didMove = true }
    handleGroupMoveShared(d, d.origProgStart, d.origProgEnd, clientX, wx, tuningArr, scaleNotes)
  }
}

function snapBeat(b: number) { return Math.round(b * 4) / 4 }
