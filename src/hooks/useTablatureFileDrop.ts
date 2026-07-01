/**
 * @file useTablatureFileDrop.ts
 * Custom hook for handling native drag-and-drop events on the tablature canvas.
 * Handles dropping modes, rhythm patterns, and chords/progressions from the UI sidebar.
 *
 * F6: During dragover, caches the payload (received via eventBus before dragover fires)
 * and computes a preview via TablatureDropService.computeDropPreview — throttled so
 * it only recomputes when the target (si, snapBeat) actually changes.
 */
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useMainStore } from '../stores/useMainStore'
import { TablatureDropService } from '../services/TablatureDropService'
import { NotificationService } from '../services/NotificationService'
import { Note } from 'tonal'
import eventBus from '../eventBus'
import { DropPayload } from '../types'
import type { ChordProgression } from '../types'
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

  // F6: cache the drag payload (set via eventBus before the first dragover fires)
  const cachedPayloadRef = useRef<ChordProgression | null>(null)
  // F6: throttle key — only recompute preview when target cell changes
  const lastPreviewKeyRef = useRef<string>('')

  useEffect(() => {
    function onProgressionDragStart(payload: ChordProgression) {
      cachedPayloadRef.current = payload
    }
    function onChordDragStart(payload: ChordProgression) {
      cachedPayloadRef.current = payload
    }
    eventBus.on('progressionDragStart', onProgressionDragStart)
    eventBus.on('chordDragStart', onChordDragStart)
    return () => {
      eventBus.off('progressionDragStart', onProgressionDragStart)
      eventBus.off('chordDragStart', onChordDragStart)
    }
  }, [])

  useEffect(() => {
    const canvas = gl.domElement

    function getWorldCoords(e: DragEvent) {
      const rect = canvas.getBoundingClientRect()
      const oc = camera as THREE.OrthographicCamera
      const ndx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndy = 1 - ((e.clientY - rect.top) / rect.height) * 2
      const worldX = (oc.position.x - LEFT_MARGIN_W) + ndx * halfWRef.current
      const worldY = oc.position.y + (oc.top + oc.bottom) / 2 + ndy * (oc.top - oc.bottom) / 2
      return { worldX, worldY }
    }

    function onDragOver(e: DragEvent) {
      if (!Array.from(e.dataTransfer?.types ?? []).includes('application/json')) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'

      const { worldX, worldY } = getWorldCoords(e)
      const si = siFromWorldY(worldY)
      const beat = Math.max(0, snapBeat(worldX / BEAT_W))
      setDragHoverSi(si)

      // F6: throttle preview computation
      const key = `${si}:${beat}`
      if (key === lastPreviewKeyRef.current) return
      lastPreviewKeyRef.current = key

      const payload = cachedPayloadRef.current
      if (!payload || !('numerals' in payload)) return

      const tuning = useTablatureStore.getState().tuning.split(',')
      const userScale = useMainStore.getState().userScale
      const scalePc = Note.pitchClass(userScale)

      const preview = TablatureDropService.computeDropPreview(payload, si, beat, tuning, scalePc)
      useMainStore.getState().setPreviewNotes(preview)
    }

    function onDragLeave() {
      setDragHoverSi(null)
      lastPreviewKeyRef.current = ''
      useMainStore.getState().setPreviewNotes(null)
    }

    function onDrop(e: DragEvent) {
      setDragHoverSi(null)
      lastPreviewKeyRef.current = ''
      cachedPayloadRef.current = null
      useMainStore.getState().setPreviewNotes(null)

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
        NotificationService.success(`Zone modale « ${payload.modeName} » ajoutée`)
      } else if ('kind' in payload && payload.kind === 'rhythm') {
        const noteUnder = state.notes.find(n =>
          n.string === si &&
          beat >= n.startBeat &&
          beat < (n.startBeat + n.duration)
        )
        if (noteUnder) {
          TablatureDropService.handleRhythmDrop(payload.pattern, noteUnder.id, payload.trackIndex)
        } else {
          NotificationService.warning('Posez le rythme sur une note, un accord ou une progression')
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
