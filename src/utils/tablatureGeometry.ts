/**
 * @file tablatureGeometry.ts
 * Pure Three.js geometry builders shared by TablatureR3F and its extracted
 * scene sub-components. No store access, no React — only Three.js Shape/BufferGeometry.
 *
 * All functions are allocation-heavy by design (create new BufferGeometry or Shape
 * objects each call). Callers are responsible for caching (see `geoCache` / `chordPodCache`
 * refs in TablatureR3F) and for calling `.dispose()` when the geometry is no longer needed.
 */
import * as THREE from 'three'
import { BEAT_W, BEATS_PER_MEAS, MEASURE_W, gridTop, gridBottom } from './tabUtils'

// ── Pod header geometries ─────────────────────────────────────────────────────

/**
 * Returns a `THREE.Shape` for a uniformly rounded rectangle.
 * Used for chord, progression, mode, and rhythm modifier pod headers.
 *
 * @param rx  Corner radius on the X axis (world units). Typically `Math.min(w/2, ry * invStretchX)`.
 * @param ry  Corner radius on the Y axis (world units). Typically `Math.min(h/2, CHORD_R)`.
 */
export function roundedRect(w: number, h: number, rx: number, ry: number): THREE.Shape {
  const s = new THREE.Shape(), hw = w / 2, hh = h / 2
  s.moveTo(-hw + rx, -hh); s.lineTo(hw - rx, -hh)
  s.quadraticCurveTo(hw, -hh, hw, -hh + ry); s.lineTo(hw, hh - ry)
  s.quadraticCurveTo(hw, hh, hw - rx, hh); s.lineTo(-hw + rx, hh)
  s.quadraticCurveTo(-hw, hh, -hw, hh - ry); s.lineTo(-hw, -hh + ry)
  s.quadraticCurveTo(-hw, -hh, -hw + rx, -hh)
  return s
}

/**
 * Returns a `THREE.Shape` for a rectangle whose left edge is a full semicircle.
 * Used for note pod bodies so the left cap visually merges with the circular fret disc.
 *
 * @param invStretchX  `pxPerWUY / pxPerWUX` — the horizontal-to-vertical pixel ratio.
 *                     Compensates for non-square orthographic frustum under zoom.
 */
export function leftCircleRect(
  w: number, h: number,
  rxRight: number, ryRight: number,
  invStretchX: number
): THREE.Shape {
  const s = new THREE.Shape(), hw = w / 2, hh = h / 2
  const ryLeft = Math.min(hh, hw)
  const rxLeft = Math.min(ryLeft * invStretchX, hw)
  s.moveTo(-hw + rxLeft, -hh); s.lineTo(hw - rxRight, -hh)
  s.quadraticCurveTo(hw, -hh, hw, -hh + ryRight); s.lineTo(hw, hh - ryRight)
  s.quadraticCurveTo(hw, hh, hw - rxRight, hh); s.lineTo(-hw + rxLeft, hh)
  s.quadraticCurveTo(-hw, hh, -hw, hh - ryLeft); s.lineTo(-hw, -hh + ryLeft)
  s.quadraticCurveTo(-hw, -hh, -hw + rxLeft, -hh)
  return s
}

// ── Grid line geometries ──────────────────────────────────────────────────────

/**
 * Returns a `THREE.BufferGeometry` of vertical line segments for every beat across
 * `n` measures. Vertices run from `gridBottom` to `gridTop`.
 */
export function buildBeatGeo(n: number): THREE.BufferGeometry {
  const pts = new Float32Array((n * BEATS_PER_MEAS + 1) * 6)
  for (let b = 0; b <= n * BEATS_PER_MEAS; b++) {
    const x = b * BEAT_W
    pts.set([x, gridBottom, 0, x, gridTop, 0], b * 6)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3))
  return g
}

/**
 * Returns a `THREE.BufferGeometry` of vertical line segments for every measure
 * boundary across `n` measures. Vertices run from `gridBottom` to `gridTop`.
 */
export function buildMeasGeo(n: number): THREE.BufferGeometry {
  const pts = new Float32Array((n + 1) * 6)
  for (let m = 0; m <= n; m++) {
    const x = m * MEASURE_W
    pts.set([x, gridBottom, 0, x, gridTop, 0], m * 6)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3))
  return g
}
