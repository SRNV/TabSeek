/**
 * @file ModePods.tsx
 * Renders the header bars and sticky discs for all Mode zone pods.
 *
 * Mode pods are not anchored to a specific string — they float above the entire grid
 * at `MODE_HEADER_OFF`. Their influence zone `[startBeat, startBeat + length * BEATS_PER_MEAS)`
 * is computed by `ModeZoneService.getZoneBounds`.
 *
 * Reads `modeZones` directly from the Zustand store to avoid prop-drilling the full
 * list. Interactive state (`hoveredModeZoneId`) and drag state (`drag`) are passed as
 * props from TablatureScene since they are shared with other pod types.
 */
import React, { useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import { useTablatureStore } from '../../../stores/useTablatureStore'
import { useMainStore } from '../../../stores/useMainStore'
import { ModeZoneService } from '../../../services/ModeZoneService'
import { FretboardHighlightService } from '../../../services/FretboardHighlightService'
import { PodModifierDisc, PodModifierPopover, ModePopoverButtons } from '../PodModifierUI'
import { roundedRect } from '../../../utils/tablatureGeometry'
import { BEAT_W, HEADER_H, POD_HEADER_OFF, N_STRINGS, stringY, LEFT_MARGIN_W, MODE_HEADER_OFF_Y } from '../../../utils/tabUtils'
import {
  MODE_BORDER_COL, MODE_BORDER_HOVER_COL, CHORD_R, CHORD_BORDER_WU, CHORD_PAD_H
} from './sceneConstants'
import { passWheel } from './passWheel'
import type { DragModeZoneState } from '../../../types/drag'

interface ModePodsProps {
  hoveredModeZoneId: string | null
  setHoveredModeZoneId: (id: string | null) => void
  drag: React.MutableRefObject<unknown>
  invStretchX: number
  pxPerWUX: number
}

/** Builds a rounded-rect `ShapeGeometry` for pod headers, cached by key. */
function usePodGeoCache(invStretchX: number) {
  const cache = useRef(new Map<string, THREE.ShapeGeometry>())
  return (w: number, h: number): THREE.ShapeGeometry => {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}`
    let g = cache.current.get(key)
    if (!g) {
      const ry = Math.min(w / 2, h / 2, CHORD_R)
      const rx = Math.min(w / 2, ry * invStretchX)
      g = new THREE.ShapeGeometry(roundedRect(w, h, rx, ry), 4)
      cache.current.set(key, g)
    }
    return g
  }
}

/**
 * Renders header bar + sticky popover disc for every Mode zone in the store.
 */
export function ModePods({ hoveredModeZoneId, setHoveredModeZoneId, drag, invStretchX, pxPerWUX }: ModePodsProps) {
  const { gl, camera } = useThree()
  const o    = camera as THREE.OrthographicCamera
  const camL = (o.position.x - LEFT_MARGIN_W) - (o.right - o.left) / 2

  const modeZones       = useTablatureR3FStore(s => s.modeZones)
  const pushHistory     = useTablatureR3FStore(s => s.pushHistory)
  const removeModeZone  = useTablatureR3FStore(s => s.removeModeZone)

  const getHeaderGeo = usePodGeoCache(invStretchX)
  const resizeZoneWU = 0.15 * invStretchX

  return (
    <>
      {modeZones.map(zone => {
        const { startBeat, endBeat } = ModeZoneService.getZoneBounds(zone)
        const headerW    = (endBeat - startBeat) * BEAT_W + CHORD_PAD_H * 2
        const headerX    = (startBeat + endBeat) / 2 * BEAT_W
        const podLeft    = startBeat * BEAT_W - CHORD_PAD_H
        const podRight   = podLeft + headerW
        const isHov      = hoveredModeZoneId === zone.id
        const borderCol  = isHov ? MODE_BORDER_HOVER_COL : MODE_BORDER_COL
        const discWU     = 30 / pxPerWUX
        const stickyX    = Math.max(podLeft, Math.min(podRight - discWU, camL + 0.06 * invStretchX))
        const stickyRelX = stickyX - headerX

        return (
          <group key={zone.id} position={[headerX, MODE_HEADER_OFF_Y, 0.002]}>
            <mesh geometry={getHeaderGeo(headerW, HEADER_H)} renderOrder={5}>
              <meshBasicMaterial color={borderCol} />
            </mesh>

            <mesh
              position={[0, 0, 0.01]}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                if (e.button !== 0) return
                e.stopPropagation()
                pushHistory()
                const lx = e.point.x - podLeft
                const isResize = lx > headerW - resizeZoneWU
                ;(drag as React.MutableRefObject<DragModeZoneState | null>).current = {
                  kind: 'mode-zone',
                  type: isResize ? 'resize-right' : 'move',
                  zoneId: zone.id, startX: e.point.x,
                  origStartBeat: zone.startBeat, origLength: zone.length,
                }
                gl.domElement.style.cursor = isResize ? 'e-resize' : 'grabbing'
              }}
              onPointerEnter={() => {
                setHoveredModeZoneId(zone.id)
                if (!drag.current) gl.domElement.style.cursor = 'grab'
                const tuning = useTablatureStore.getState().tuning.split(',')
                const userScale = useMainStore.getState().userScale
                FretboardHighlightService.setHighlights(
                  ModeZoneService.getScaleHighlights(zone, tuning, userScale)
                )
              }}
              onPointerLeave={() => {
                setHoveredModeZoneId(null)
                if (!drag.current) gl.domElement.style.cursor = 'default'
                FretboardHighlightService.clearHighlights()
              }}
              onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                if (drag.current) return
                const lx = e.point.x - podLeft
                gl.domElement.style.cursor = lx > headerW - resizeZoneWU ? 'e-resize' : 'grab'
              }}
              onContextMenu={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation()
                pushHistory()
                removeModeZone(zone.id)
              }}
            >
              <planeGeometry args={[headerW, HEADER_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <Html
              position={[stickyRelX, 0, 0.05]}
              style={{ pointerEvents: 'auto', transform: 'translateY(-50%)' }}
              zIndexRange={[70, 70]}
              onWheel={passWheel}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                onPointerDown={e => e.stopPropagation()}
                onWheel={passWheel}
              >
                <PodModifierDisc
                  emojiStr=":compass:"
                  size={22}
                  discBg="#330000"
                  borderCol={MODE_BORDER_COL}
                  title={zone.modeName}
                  popoverContent={close => (
                    <PodModifierPopover
                      nav={ModeZoneService.getModeNav(zone)}
                      emojiStr=":compass:"
                      onRemove={() => removeModeZone(zone.id)}
                      onClose={close}
                      className="mode-popover"
                    >
                      <ModePopoverButtons zone={zone} />
                    </PodModifierPopover>
                  )}
                />
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}
