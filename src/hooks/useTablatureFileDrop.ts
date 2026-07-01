/**
 * @file useTablatureFileDrop.ts
 * Custom hook for handling native drag-and-drop events on the tablature canvas.
 * Handles dropping modes, rhythm patterns, and chords/progressions from the UI sidebar.
 */
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { TablatureDropService } from '../services/TablatureDropService'
import { DropPayload } from '../types'
import {
  LEFT_MARGIN_W, BEAT_W, siFromWorldY, snapBeat
} from '../utils/tabUtils'

interface UseTablatureFileDropParams {
  halfWRef: React.MutableRefObject<number>
  scaleNotes: string[]
  setDragHoverSi: (si: number | null) => void
}

export function useTablatureFileDrop({
  halfWRef,
  scaleNotes,
  setDragHoverSi
}: UseTablatureFileDropParams) {
  const { camera, gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement

    function onDragOver(e: DragEvent) {
      if (!Array.from(e.dataTransfer?.types ?? []).includes('application/json')) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      const rect = canvas.getBoundingClientRect()
      const ndy  = 1 - ((e.clientY - rect.top) / rect.height) * 2
      const oc   = camera as THREE.OrthographicCamera
      const worldY = oc.position.y + (oc.top + oc.bottom) / 2 + ndy * (oc.top - oc.bottom) / 2
      setDragHoverSi(siFromWorldY(worldY))
    }

    function onDragLeave() { setDragHoverSi(null) }

    function onDrop(e: DragEvent) {
      setDragHoverSi(null)
      const data = e.dataTransfer?.getData('application/json')
      if (!data) return
      e.preventDefault()
      let payload: DropPayload
      try { payload = JSON.parse(data) } catch { return }

      const o    = camera as THREE.OrthographicCamera
      const rect = canvas.getBoundingClientRect()
      const ndx  = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndy  = 1 - ((e.clientY - rect.top)  / rect.height) * 2
      const worldX = (o.position.x - LEFT_MARGIN_W) + ndx * halfWRef.current
      const worldY = o.position.y + (o.top + o.bottom) / 2 + ndy * (o.top - o.bottom) / 2
      const si     = siFromWorldY(worldY)
      const beat   = Math.max(0, snapBeat(worldX / BEAT_W))

      const state = useTablatureR3FStore.getState()

      if ('kind' in payload && payload.kind === 'mode') {
        state.pushHistory()
        state.addModeZone(beat, payload.modeName)
      } else if ('kind' in payload && payload.kind === 'rhythm') {
        const noteUnder = state.notes.find(n =>
          n.string === si &&
          beat >= n.startBeat &&
          beat < (n.startBeat + n.duration)
        )
        if (noteUnder) {
          TablatureDropService.handleRhythmDrop(payload.pattern, noteUnder.id, payload.trackIndex)
        }
      } else {
        TablatureDropService.handleDrop(payload as ChordProgression, si, beat, scaleNotes)
      }
    }

    canvas.addEventListener('dragover',  onDragOver)
    canvas.addEventListener('dragleave', onDragLeave)
    canvas.addEventListener('drop',      onDrop)
    return () => {
      canvas.removeEventListener('dragover',  onDragOver)
      canvas.removeEventListener('dragleave', onDragLeave)
      canvas.removeEventListener('drop',      onDrop)
    }
  }, [camera, gl, scaleNotes, halfWRef, setDragHoverSi])
}
