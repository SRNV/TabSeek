import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import {
  BEAT_W, N_STRINGS, STRING_H, LANE_H, BEATS_PER_MEAS, MEASURE_W,
  gridTop, gridBottom, LEFT_MARGIN_W, stringY,
  LARGE_W, INFO_LANE_H, infoLaneY, measLabelY, marginY
} from '../../../utils/tabUtils'
import {
  LANE_COL, MARGIN_COL, BEAT_LINE_COL, MEAS_LINE_COL, PROG_BORDER_COL
} from './sceneConstants'
import { ModeZoneTint } from './ModeZoneTint'
import { passWheel } from './passWheel'

interface SceneBackgroundProps {
  scrollX: number
  halfW: number
  totalMeasures: number
  dragHoverSi: number | null
  newProgDrag: { startBeat: number; endBeat: number } | null
  beatGeo: THREE.BufferGeometry
  measGeo: THREE.BufferGeometry
  onLanePointerDown: (e: ThreeEvent<PointerEvent>, si: number) => void
  onLaneDblClick: (e: ThreeEvent<MouseEvent>, si: number) => void
  onInfoLanePointerDown: (e: ThreeEvent<PointerEvent>) => void
  onBackgroundPointerDown: () => void
}

/**
 * SceneBackground Component
 * Renders the static and interactive background elements of the tablature:
 * - Lane backgrounds
 * - Left margin
 * - Grid lines (beats and measures)
 * - Measure labels
 * - Info lane (for progression creation)
 * - Mode zone tinting
 */
export const SceneBackground: React.FC<SceneBackgroundProps> = ({
  scrollX,
  halfW,
  totalMeasures,
  dragHoverSi,
  newProgDrag,
  beatGeo,
  measGeo,
  onLanePointerDown,
  onLaneDblClick,
  onInfoLanePointerDown,
  onBackgroundPointerDown
}) => {
  const { gl } = useThree()

  const laneBgGeo = useMemo(() => new THREE.PlaneGeometry(LARGE_W, LANE_H), [])
  const laneBgMat = useMemo(() => new THREE.MeshBasicMaterial({ color: LANE_COL, depthWrite: false }), [])
  
  const marginGeo = useMemo(() => new THREE.PlaneGeometry(LEFT_MARGIN_W, (N_STRINGS - 1) * STRING_H + LANE_H), [])
  const marginMat = useMemo(() => new THREE.MeshBasicMaterial({ color: MARGIN_COL, depthWrite: false }), [])

  const matBeat = useMemo(() => new THREE.LineBasicMaterial({ color: BEAT_LINE_COL, transparent: true, opacity: 0.5 }), [])
  const matMeas = useMemo(() => new THREE.LineBasicMaterial({ color: MEAS_LINE_COL, transparent: true, opacity: 0.8 }), [])

  const leftMeas  = Math.max(0, Math.floor((scrollX - LEFT_MARGIN_W - halfW) / MEASURE_W) - 1)
  const rightMeas = Math.min(totalMeasures - 1, Math.ceil((scrollX - LEFT_MARGIN_W + halfW) / MEASURE_W) + 1)

  return (
    <group onPointerDown={onBackgroundPointerDown}>
      {/* Lane backgrounds + drag-hover highlight */}
      {Array.from({ length: N_STRINGS }, (_, si) => (
        <group key={si}>
          <mesh 
            position={[0, stringY(si), -0.04]} 
            geometry={laneBgGeo} 
            material={laneBgMat}
            onPointerDown={e => onLanePointerDown(e, si)}
            onPointerMove={e => {
               // Update cursor if needed when hovering lanes
            }}
            onDoubleClick={e => onLaneDblClick(e, si)} 
          />
          {dragHoverSi === si && (
            <mesh position={[scrollX, stringY(si), -0.03]}>
              <planeGeometry args={[LARGE_W, LANE_H]} />
              <meshBasicMaterial color="#585858" transparent opacity={0.55} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}

      {/* Left Margin */}
      <mesh position={[-LEFT_MARGIN_W / 2, marginY, -0.038]} geometry={marginGeo} material={marginMat} />

      {/* Mode Zone tint */}
      <ModeZoneTint />

      {/* Grid lines */}
      <lineSegments position={[0, 0, -0.035]} geometry={beatGeo} material={matBeat} frustumCulled={false} />
      <lineSegments position={[0, 0, -0.035]} geometry={measGeo} material={matMeas} frustumCulled={false} />

      {/* Measure labels */}
      {Array.from({ length: rightMeas - leftMeas + 1 }, (_, i) => {
        const m = leftMeas + i
        if (m < 0 || m >= totalMeasures) return null
        return (
          <Html key={m} position={[m * MEASURE_W + 0.08, measLabelY, 0.1]}
            style={{ pointerEvents: 'none' }} zIndexRange={[200, 200]}>
            <span className="tab-r3f-meas-label">{m + 1}</span>
          </Html>
        )
      })}

      {/* Info lane — drag on empty space to draw a progression range */}
      <mesh 
        position={[0, infoLaneY, -0.04]} 
        geometry={laneBgGeo} 
        material={laneBgMat}
        onPointerDown={onInfoLanePointerDown}
        onPointerEnter={() => { gl.domElement.style.cursor = 'crosshair' }}
        onPointerLeave={() => { gl.domElement.style.cursor = 'default' }}
      />

      {/* Drag preview — blue band in info lane while drawing progression range */}
      {newProgDrag && (() => {
        const beatMin = Math.min(newProgDrag.startBeat, newProgDrag.endBeat)
        const beatMax = Math.max(newProgDrag.startBeat, newProgDrag.endBeat)
        const w  = (beatMax - beatMin) * BEAT_W
        const cx = (beatMin + beatMax) / 2 * BEAT_W
        return (
          <mesh position={[cx, infoLaneY, -0.038]}>
            <planeGeometry args={[Math.max(w, 0.01), INFO_LANE_H]} />
            <meshBasicMaterial color={PROG_BORDER_COL} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        )
      })()}
    </group>
  )
}
