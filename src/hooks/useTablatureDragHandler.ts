import { MutableRefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { MODE_ZONE_MIN_LENGTH } from '../types'
import type { TablatureNote } from '../types'
import { TablatureMoveService } from '../services/TablatureMoveService'
import { snapBeat, BEAT_W, BEATS_PER_MEAS, LEFT_MARGIN_W, noteInRect } from '../utils/tabUtils'
import { AnyDragState, DragRectState as DragRect, DragNewProgState as DragNewProg } from '../types/drag'

interface DragHandlerProps {
  drag: MutableRefObject<AnyDragState | null>
  lanePend: MutableRefObject<any | null>
  halfWRef: MutableRefObject<number>
  totalMeasures: number
  tuningArr: string[]
  scaleNotes: string[]
  setPlaybackBeat: (beat: number) => void
  setRectBox: (rect: DragRect | null) => void
  setNewProgDrag: (prog: { startBeat: number; endBeat: number } | null) => void
  setSelectedIds: (ids: Set<string>) => void
  setSelectedChordGroupIds: (ids: ((prev: Set<string>) => Set<string>) | Set<string>) => void
  siFromWorldY: (wy: number) => number
}

export const useTablatureDragHandler = ({
  drag,
  lanePend,
  halfWRef,
  totalMeasures,
  tuningArr,
  scaleNotes,
  setPlaybackBeat,
  setRectBox,
  setNewProgDrag,
  setSelectedIds,
  setSelectedChordGroupIds,
  siFromWorldY
}: DragHandlerProps) => {
  const { camera, gl } = useThree()
  const RECT_DRAG_PX = 5

  const wx = (cx: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const ndc = ((cx - rect.left) / rect.width) * 2 - 1
    const o = camera as THREE.OrthographicCamera
    return (o.position.x - LEFT_MARGIN_W) + ndc * (o.right - o.left) / 2
  }

  const wy = (cy: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const ndc = -((cy - rect.top) / rect.height) * 2 + 1
    const o = camera as THREE.OrthographicCamera
    return o.position.y + (o.top + o.bottom) / 2 + ndc * (o.top - o.bottom) / 2
  }

  const onMove = (e: PointerEvent) => {
    const d = drag.current
    const canvas = gl.domElement
    const state = useTablatureR3FStore.getState()

    if (d?.kind === 'playback-beat') {
      const beat = wx(e.clientX, canvas) / BEAT_W
      setPlaybackBeat(Math.max(0, Math.min(totalMeasures * BEATS_PER_MEAS, beat)))
    } else if (d?.kind === 'note') {
      TablatureMoveService.handleNoteMove(d, e.clientX, e.clientY, (x) => wx(x, canvas), (y) => wy(y, canvas), siFromWorldY, tuningArr, scaleNotes)
    } else if (d?.kind === 'chord-group') {
      TablatureMoveService.handleChordGroupMove(d, e.clientX, (x) => wx(x, canvas), tuningArr, scaleNotes)
    } else if (d?.kind === 'prog-group') {
      TablatureMoveService.handleProgGroupMove(d, e.clientX, (x) => wx(x, canvas), tuningArr, scaleNotes)
    } else if (d?.kind === 'mode-zone') {
      const dBeat = snapBeat((wx(e.clientX, canvas) - d.startX) / BEAT_W)
      if (d.type === 'resize-right') {
        const newLength = Math.max(MODE_ZONE_MIN_LENGTH, d.origLength + dBeat / BEATS_PER_MEAS)
        state.updateModeZone(d.zoneId, { length: newLength })
      } else {
        state.updateModeZone(d.zoneId, { startBeat: Math.max(0, d.origStartBeat + dBeat) })
      }
    } else if (d?.kind === 'new-prog') {
      const endBeat = wx(e.clientX, canvas) / BEAT_W
      ;(drag.current as DragNewProg).endBeat = endBeat
      setNewProgDrag({ startBeat: d.startBeat, endBeat })
    } else if (d?.kind === 'rect') {
      const upd = { ...d, x1: wx(e.clientX, canvas), y1: wy(e.clientY, canvas) }
      drag.current = upd
      setRectBox(upd as DragRect)
    } else if (lanePend.current) {
      const p = lanePend.current
      const dx = e.clientX - p.startCX
      const dy = e.clientY - p.startCY
      if (Math.sqrt(dx * dx + dy * dy) > RECT_DRAG_PX) {
        const r: DragRect = { kind: 'rect', x0: p.startWX, y0: p.startWY, x1: wx(e.clientX, canvas), y1: wy(e.clientY, canvas) }
        drag.current = r
        lanePend.current = null
        setRectBox(r)
        canvas.style.cursor = 'crosshair'
      }
    }
  }

  const onUp = (e: PointerEvent) => {
    const d = drag.current
    const state = useTablatureR3FStore.getState()

    if (d?.kind === 'chord-group' && !d.didMove) {
      setSelectedIds(new Set(d.origNotes.map(n => n.id)))
    } else if (d?.kind === 'rect') {
      const hits = state.notes
        .filter(n => noteInRect(n, d.x0, d.y0, d.x1, d.y1))
        .map(n => n.id)
      setSelectedIds(new Set(hits))
      setRectBox(null)
    } else if (d?.kind === 'new-prog') {
      setNewProgDrag(null)
      const beatMin = Math.min(d.startBeat, d.endBeat)
      const beatMax = Math.max(d.startBeat, d.endBeat)
      if (beatMax - beatMin > 0.1) {
        const matching = state.chordGroups.filter(g => {
          const gNotes = state.notes.filter(n => g.noteIds.includes(n.id))
          if (!gNotes.length) return false
          const gMin = Math.min(...gNotes.map(n => n.startBeat))
          const gMax = Math.max(...gNotes.map(n => n.startBeat + n.duration))
          return gMin < beatMax && gMax > beatMin
        })
        if (matching.length > 0) {
          state.pushHistory()
          state.addProgressionGroup(matching.map(g => g.id), 'Progression')
        }
      } else if (d.fromGroupId) {
        const gId = d.fromGroupId
        setSelectedChordGroupIds((prev: Set<string>) => {
          if (d.ctrlKey) {
            const s = new Set(prev)
            s.has(gId) ? s.delete(gId) : s.add(gId)
            return s
          }
          return new Set([gId])
        })
      }
    }

    drag.current = null
    lanePend.current = null
    gl.domElement.style.cursor = 'default'
  }

  return { onMove, onUp }
}
