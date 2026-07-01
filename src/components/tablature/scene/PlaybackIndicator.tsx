/**
 * @file PlaybackIndicator.tsx
 * The green playback cursor: a vertical bar + downward-pointing triangle (arrow head).
 *
 * Position is driven **imperatively** each frame via `playbackCursorGroupRef` in
 * TablatureScene's `useFrame` — not via React state — so this component never
 * re-renders during playback (only on mount and when `playbackBeat` changes structurally).
 *
 * The component is wrapped in `React.forwardRef` so TablatureScene can attach its
 * `playbackCursorGroupRef` to the inner THREE.Group and update `position.x` each frame.
 *
 * Hit area: an invisible plane scaled with `invStretchX` keeps the click target a
 * constant screen-pixel width at any zoom level, making the cursor draggable from
 * anywhere on the line (not just the arrow head).
 */
import React from 'react'
import * as THREE from 'three'
import { BEAT_W, gridTop, gridBottom } from '../../../utils/tabUtils'
import { APPLE_GREEN } from './sceneConstants'
import type { ThreeEvent } from '@react-three/fiber'

interface PlaybackIndicatorProps {
  playbackBeat: number
  invStretchX: number
  /** Called on pointer-down anywhere on the hit area — caller sets drag state + cursor. */
  onDragStart: (e: ThreeEvent<PointerEvent>) => void
  onHoverEnter: () => void
  onHoverLeave: () => void
}

/**
 * Renders the green playback cursor group. Forward the ref to a `THREE.Group` so that
 * `TablatureScene.useFrame` can set `ref.current.position.x` each frame without
 * triggering a React re-render.
 */
export const PlaybackIndicator = React.forwardRef<THREE.Group, PlaybackIndicatorProps>(
  function PlaybackIndicator({ playbackBeat, invStretchX, onDragStart, onHoverEnter, onHoverLeave }, ref) {
    const gridH   = gridTop - gridBottom
    const midY    = (gridTop + gridBottom) / 2

    return (
      <group
        ref={ref}
        position={[playbackBeat * BEAT_W, 0, 0.2]}
        renderOrder={10}
        onPointerDown={onDragStart}
        onPointerEnter={onHoverEnter}
        onPointerLeave={onHoverLeave}
      >
        {/* Invisible hit area — wider than the bar, scaled with zoom */}
        <mesh scale={[invStretchX, 1, 1]}>
          <planeGeometry args={[0.5, gridH + 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Vertical bar — subtle additive glow strip */}
        <mesh position={[0, midY, 0]} scale={[invStretchX, 1, 1]}>
          <planeGeometry args={[3 / 100, gridH + 0.5]} />
          <meshBasicMaterial color={APPLE_GREEN} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Arrow head — triangle pointing down from gridTop */}
        <mesh position={[0, gridTop - 0.15, 0.1]} rotation={[0, 0, Math.PI]} scale={[invStretchX, 1, 1]}>
          <coneGeometry args={[0.2, 0.3, 3]} />
          <meshBasicMaterial color={APPLE_GREEN} />
        </mesh>
      </group>
    )
  }
)
