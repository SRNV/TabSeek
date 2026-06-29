import React, { useRef, useEffect } from 'react'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { minimapBridge } from './minimapBridge'
import {
  BEAT_W, N_STRINGS, STRING_H, MEASURE_W, BEATS_PER_MEAS, NOTE_H, stringY,
} from '../../utils/tabUtils'

const SCALE_COLORS = ['#FFF9B1', '#77DD77', '#AEC6CF', '#CDB4DB', '#FFB3B3', '#FFD1B3', '#FFFFFF']
const BG_COLOR       = '#1a1a1a'
const MEAS_COLOR     = 'rgba(255,255,255,0.06)'
const VIEWPORT_FILL  = 'rgba(255,149,0,0.08)'
const VIEWPORT_STROKE = '#FF9500'

// World Y extent covering all 6 strings
const WORLD_TOP    = stringY(N_STRINGS - 1) + STRING_H / 2
const WORLD_BOTTOM = stringY(0) - STRING_H / 2
const WORLD_H      = WORLD_TOP - WORLD_BOTTOM

function displayMeasures(notes: ReturnType<typeof useTablatureR3FStore.getState>['notes']): number {
  const usedBeats   = notes.length > 0 ? Math.max(...notes.map(n => n.startBeat + n.duration)) : 0
  const usedMeas    = Math.ceil(usedBeats / BEATS_PER_MEAS)
  const { scrollX, halfW } = minimapBridge
  const viewRight   = Math.ceil((scrollX + halfW) / MEASURE_W)
  return Math.max(usedMeas + 8, viewRight + 4, 20)
}

export function TablatureMinimap() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)
  const notes        = useTablatureR3FStore(s => s.notes)

  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let rafId: number
    let prevW = 0

    function draw() {
      rafId = requestAnimationFrame(draw)

      const cssW = container!.clientWidth
      const dpr  = window.devicePixelRatio || 1

      if (cssW !== prevW) {
        canvas!.width        = cssW * dpr
        canvas!.height       = 56 * dpr
        canvas!.style.width  = `${cssW}px`
        canvas!.style.height = '56px'
        prevW = cssW
      }

      const cw  = canvas!.width
      const ch  = canvas!.height
      const ctx = canvas!.getContext('2d')!

      const { scrollX, halfW } = minimapBridge
      const dispMeas  = displayMeasures(notes)
      const totalW    = dispMeas * MEASURE_W
      const scaleX    = cw / totalW
      const scaleY    = ch / WORLD_H

      // Background
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, cw, ch)

      // Measure lines
      ctx.strokeStyle = MEAS_COLOR
      ctx.lineWidth   = 1
      for (let m = 1; m < dispMeas; m++) {
        const px = Math.round(m * MEASURE_W * scaleX) + 0.5
        ctx.beginPath()
        ctx.moveTo(px, 0)
        ctx.lineTo(px, ch)
        ctx.stroke()
      }

      // Note pods
      for (const note of notes) {
        const x  = note.startBeat * BEAT_W * scaleX
        const w  = Math.max(1, note.duration * BEAT_W * scaleX)
        const y  = (WORLD_TOP - (stringY(note.string) + NOTE_H / 2)) * scaleY
        const h  = Math.max(1, NOTE_H * scaleY)
        ctx.globalAlpha = note.legatoRatio ? 0.45 : 0.85
        ctx.fillStyle   = SCALE_COLORS[note.string % SCALE_COLORS.length]
        ctx.fillRect(x, y, w, h)
      }
      ctx.globalAlpha = 1

      // Viewport rectangle
      const vl = (scrollX - halfW) * scaleX
      const vw = halfW * 2 * scaleX
      ctx.fillStyle = VIEWPORT_FILL
      ctx.fillRect(vl, 0, vw, ch)
      ctx.strokeStyle = VIEWPORT_STROKE
      ctx.lineWidth   = 1.5 * dpr
      ctx.strokeRect(vl + 0.5, 0.5, Math.max(0, vw - 1), ch - 1)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [notes])

  function worldXAt(clientX: number): number {
    const rect     = canvasRef.current!.getBoundingClientRect()
    const frac     = (clientX - rect.left) / rect.width
    const dispMeas = displayMeasures(notes)
    return frac * dispMeas * MEASURE_W
  }

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    minimapBridge.targetScrollX = worldXAt(e.clientX)
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return
    minimapBridge.targetScrollX = worldXAt(e.clientX)
  }
  function onMouseUp()    { isDragging.current = false }
  function onMouseLeave() { isDragging.current = false }

  return (
    <div
      ref={containerRef}
      className="tab-minimap-strip"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <canvas ref={canvasRef} />
    </div>
  )
}
