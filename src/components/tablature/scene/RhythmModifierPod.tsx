/**
 * @file RhythmModifierPod.tsx
 * Floating header bar for rhythm modifiers that target a single note or a progression
 * (not chord — those render inline in the chord pod itself).
 *
 * The pod spans the full note/progression content range. A sticky emoji disc clamps
 * to the camera left edge so it remains visible as the user scrolls right.
 * Hover changes the header color; context-menu removes the modifier.
 */
import React from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { RhythmModifier } from '../../../types'
import { RhythmModifierDisc } from '../PodModifierUI'
import { BEAT_W, STRING_H, GAP_WU, HEADER_H, LEFT_MARGIN_W, stringY } from '../../../utils/tabUtils'
import { passWheel } from './passWheel'

const CHORD_PAD_H = 0.25
const PROG_PAD_H  = 1.20

export interface RhythmModifierPodProps {
  mod: RhythmModifier
  bounds: { beatMin: number; beatMax: number; siMin: number; siMax: number }
  invStretchX: number
  pxPerWUX: number
  getHeaderGeo: (w: number, h: number) => THREE.ShapeGeometry
  onUpdate: (patch: Partial<RhythmModifier>) => void
  onRemove: () => void
  onHover: (hovered: boolean) => void
  isHovered: boolean
}

/**
 * Renders the header bar + sticky RhythmModifierDisc for a single non-chord
 * rhythm modifier. Reads camera position from `useThree` for sticky clamping.
 */
export function RhythmModifierPod({
  mod, bounds, invStretchX, pxPerWUX, getHeaderGeo,
  onUpdate, onRemove, onHover, isHovered,
}: RhythmModifierPodProps) {
  const { camera } = useThree()
  const o = camera as THREE.OrthographicCamera
  const camL = (o.position.x - LEFT_MARGIN_W) - (o.right - o.left) / 2

  const podW = (bounds.beatMax - bounds.beatMin) * BEAT_W + CHORD_PAD_H * 2 + PROG_PAD_H * 2 + 0.2
  const podH = (bounds.siMax - bounds.siMin + 1) * STRING_H
  const podCX = (bounds.beatMin + bounds.beatMax) / 2 * BEAT_W
  const podCY = (stringY(bounds.siMin) + stringY(bounds.siMax)) / 2 + GAP_WU / 2

  const podLeftX  = bounds.beatMin * BEAT_W - CHORD_PAD_H - PROG_PAD_H
  const podRightX = bounds.beatMax * BEAT_W + CHORD_PAD_H + PROG_PAD_H
  const relHeaderY = podH / 2 - GAP_WU / 2

  const discWU    = 31.2 / pxPerWUX
  const targetX   = Math.max(podLeftX, Math.min(podRightX - discWU, camL + 0.08 * invStretchX))
  const relativeX = targetX - podCX

  const borderCol = isHovered ? '#a855f7' : '#7c3aed'

  return (
    <group position={[podCX, podCY, 0.005]}>
      <mesh position={[0, relHeaderY, 0]} geometry={getHeaderGeo(podW, HEADER_H)} renderOrder={6}>
        <meshBasicMaterial color={borderCol} />
      </mesh>

      <mesh
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onContextMenu={e => { e.stopPropagation(); onRemove() }}
      >
        <planeGeometry args={[podW, podH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Html
        position={[relativeX, relHeaderY, 0.05]}
        style={{ pointerEvents: 'auto', transform: 'translateY(-50%)' }}
        zIndexRange={[80, 80]}
        onWheel={passWheel}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '3px' }} onWheel={passWheel}>
          <RhythmModifierDisc mod={mod} onUpdate={onUpdate} onRemove={onRemove} size={26} glow={isHovered} />
        </div>
      </Html>
    </group>
  )
}
