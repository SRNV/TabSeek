/**
 * @file SubNoteBody.tsx
 * Gradient-filled Three.js mesh body for a note pod.
 * Left-to-right: degree color → disc color, transitioning over one measure's width.
 * The fundamental note of a chord pulses at 2 Hz when `isFundamental` is true.
 */
import React from 'react'
import * as THREE from 'three'
import { MEASURE_W } from '../../../utils/tabUtils'
import { PodGradientMaterial } from './PodGradientMaterial'


/**
 * Renders a `leftCircleRect` mesh with a gradient shader material.
 *
 * @param w          Width in world units.
 * @param color      Left-edge color (degree/mode color).
 * @param colorB     Right-edge color (disc background color).
 * @param isFundamental  When true the fundamental-note pulse is enabled.
 * @param getNoteGeo Geometry factory (cached by width in parent).
 * @param grayTarget 0 = full color, 1 = grayed out (LANE_COL). Eased in useFrame.
 */
export function SubNoteBody({ w, color, colorB, isFundamental, getNoteGeo, grayTarget }: {
  w: number
  color: string
  colorB: string
  isFundamental: boolean
  getNoteGeo: (w: number) => THREE.ShapeGeometry
  grayTarget: number
}) {
  return (
    <mesh geometry={getNoteGeo(w)} renderOrder={8}>
      <PodGradientMaterial
        colorA={color}
        colorB={colorB}
        halfW={w / 2}
        gradWidth={MEASURE_W}
        blink={isFundamental}
        grayTarget={grayTarget}
      />
    </mesh>
  )
}
