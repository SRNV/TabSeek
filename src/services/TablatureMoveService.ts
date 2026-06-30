import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { RhythmModifierService } from './RhythmModifierService'
import { getNoteName, findFretForNote } from '../utils/guitarUtils'
import {
  BEAT_W, MIN_DUR,
  constrainMove, constrainRight, constrainLeft, constrainChordGroupMove
} from '../utils/tabUtils'

export const TablatureMoveService = {
  handleNoteMove: (d: any, clientX: number, clientY: number, wx: Function, wy: Function, siFromWorldY: Function, tuningArr: string[], scaleNotes: string[]) => {
    const { updateNote } = useTablatureR3FStore.getState()
    const n = useTablatureR3FStore.getState().notes.find(note => note.id === d.noteId)
    if (!n) return

    const locked = RhythmModifierService.isLegatoLocked(d.noteId)
    const dB = (wx(clientX) - d.startX) / BEAT_W

    if (d.type === 'move') {
      const newSi   = siFromWorldY(wy(clientY))
      // Locked notes (rhythm-legato chain) may only change string — beat stays frozen
      const wantedBeat = locked ? d.origBeat : snapBeat(d.origBeat + dB)
      const newBeat = constrainMove(wantedBeat, d.origDur, newSi, d.noteId)

      let newFret: number | undefined
      if (newSi !== n.string) {
        const inGroup = useTablatureR3FStore.getState().chordGroups.some(g => g.noteIds.includes(d.noteId))
        if (inGroup) {
          const tun    = useTablatureStore.getState().tuning.split(',')
          const pitch  = getNoteName(tun[d.origSi], d.origFret)
          const found  = newSi === d.origSi ? d.origFret : findFretForNote(tun[newSi], pitch)
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

  handleChordGroupMove: (d: any, clientX: number, wx: Function, tuningArr: string[], scaleNotes: string[]) => {
    const { updateNote, pushHistory } = useTablatureR3FStore.getState()
    const worldX = wx(clientX)
    const origW  = d.origGroupEnd - d.origGroupStart
    
    if (!d.didMove) { 
      pushHistory()
      d.didMove = true 
    }

    if (d.type === 'move') {
      const rawDelta = snapBeat((worldX - d.startX) / BEAT_W)
      const groupIds = new Set<string>(d.origNotes.map((n: any) => n.id as string))
      const dBeat    = constrainChordGroupMove(d.origNotes, groupIds, rawDelta)
      for (const n of d.origNotes) {
        if (RhythmModifierService.isLegatoLocked(n.id)) continue
        updateNote(n.id, { startBeat: Math.max(0, n.startBeat + dBeat) }, tuningArr, scaleNotes)
      }
    } else if (d.type === 'resize-right') {
      const newEnd = Math.max(d.origGroupStart + MIN_DUR * d.origNotes.length, snapBeat(worldX / BEAT_W))
      const newW   = newEnd - d.origGroupStart
      for (const n of d.origNotes) {
        if (RhythmModifierService.isLegatoLocked(n.id)) continue
        const relStart = (n.startBeat - d.origGroupStart) / origW
        updateNote(n.id, {
          startBeat: d.origGroupStart + relStart * newW,
          duration: Math.max(MIN_DUR, (n.duration / origW) * newW)
        }, tuningArr, scaleNotes)
      }
    } else if (d.type === 'resize-left') {
      const newStart = Math.max(0, Math.min(d.origGroupEnd - MIN_DUR, snapBeat(worldX / BEAT_W)))
      const newW     = d.origGroupEnd - newStart
      for (const n of d.origNotes) {
        if (RhythmModifierService.isLegatoLocked(n.id)) continue
        const relFromRight = (d.origGroupEnd - (n.startBeat + n.duration)) / origW
        const newDur  = Math.max(MIN_DUR, (n.duration / origW) * newW)
        updateNote(n.id, {
          startBeat: Math.max(0, d.origGroupEnd - relFromRight * newW - newDur),
          duration: newDur
        }, tuningArr, scaleNotes)
      }
    }
  },

  handleProgGroupMove: (d: any, clientX: number, wx: Function, tuningArr: string[], scaleNotes: string[]) => {
    const { updateNote, pushHistory } = useTablatureR3FStore.getState()
    const worldX = wx(clientX)
    const origW  = d.origProgEnd - d.origProgStart
    
    if (!d.didMove) { 
      pushHistory()
      d.didMove = true 
    }

    if (d.type === 'move') {
      const rawDelta = snapBeat((worldX - d.startX) / BEAT_W)
      const groupNoteIds = new Set<string>(d.origNotes.map((n: any) => n.id as string))
      const dBeat = constrainChordGroupMove(d.origNotes, groupNoteIds, rawDelta)
      for (const n of d.origNotes) {
        if (RhythmModifierService.isLegatoLocked(n.id)) continue
        updateNote(n.id, { startBeat: Math.max(0, n.startBeat + dBeat) }, tuningArr, scaleNotes)
      }
    } else if (d.type === 'resize-right') {
      const newEnd = Math.max(d.origProgStart + MIN_DUR, snapBeat(worldX / BEAT_W))
      const newW   = newEnd - d.origProgStart
      for (const n of d.origNotes) {
        if (RhythmModifierService.isLegatoLocked(n.id)) continue
        const relStart = (n.startBeat - d.origProgStart) / origW
        updateNote(n.id, {
          startBeat: d.origProgStart + relStart * newW,
          duration: Math.max(MIN_DUR, (n.duration / origW) * newW)
        }, tuningArr, scaleNotes)
      }
    } else if (d.type === 'resize-left') {
      const newStart = Math.max(0, Math.min(d.origProgEnd - MIN_DUR, snapBeat(worldX / BEAT_W)))
      const newW     = d.origProgEnd - newStart
      for (const n of d.origNotes) {
        if (RhythmModifierService.isLegatoLocked(n.id)) continue
        const relFromRight = (d.origProgEnd - (n.startBeat + n.duration)) / origW
        const newDur  = Math.max(MIN_DUR, (n.duration / origW) * newW)
        updateNote(n.id, {
          startBeat: Math.max(0, d.origProgEnd - relFromRight * newW - newDur),
          duration: newDur
        }, tuningArr, scaleNotes)
      }
    }
  }
}

function snapBeat(b: number) { return Math.round(b * 4) / 4 }
