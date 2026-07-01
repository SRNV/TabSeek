/**
 * @file ModeZoneTint.tsx
 * Renders the translucent gradient wash behind each active Mode pod's influence
 * zone on the tablature grid.
 *
 * Reads `modeZones` directly from the R3F store so that TablatureScene does not
 * need to pass it as a prop — the tint is entirely data-driven and has no
 * interactive handlers. This makes it the safest first sub-component to extract
 * from the God Component (P2-1 plan, Dr. Kenji Ota).
 *
 * Visual spec:
 * - Sits at Z = -0.039, between lane backgrounds (−0.04) and grid lines (−0.035).
 * - Color = zone.color darkened 10%, desaturated 12% (subtle tint, not a block fill).
 * - Ramps to transparent over the last 20% of the zone width (MODE_GRADIENT_RAMP).
 */
import React from 'react'
import * as THREE from 'three'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import { ModeZoneService } from '../../../services/ModeZoneService'
import { ModeZoneGradientMaterial } from './ModeZoneGradientMaterial'
import { BEAT_W, gridTop, gridBottom } from '../../../utils/tabUtils'

const MODE_GRADIENT_RAMP    = 0.2
const MODE_GRADIENT_OPACITY = 0.35

function darkenHex(hex: string, pct: number): string {
  const c = new THREE.Color(hex), hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, hsl.l * (1 - pct))
  return '#' + c.getHexString()
}
function desaturateHex(hex: string, pct: number): string {
  const c = new THREE.Color(hex), hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl); c.setHSL(hsl.h, hsl.s * (1 - pct), hsl.l)
  return '#' + c.getHexString()
}

const gridMidY  = (gridTop + gridBottom) / 2
const gridHeight = gridTop - gridBottom

/**
 * Renders one translucent `<mesh>` per active Mode zone.
 * No props needed — reads from the Zustand store directly.
 */
export function ModeZoneTint() {
  const modeZones = useTablatureR3FStore(s => s.modeZones)

  return (
    <>
      {modeZones.map(zone => {
        const { startBeat, endBeat } = ModeZoneService.getZoneBounds(zone)
        const w = (endBeat - startBeat) * BEAT_W
        if (w <= 0) return null
        const cx = startBeat * BEAT_W + w / 2
        const tintColor = desaturateHex(darkenHex(zone.color, 0.10), 0.12)
        return (
          <mesh key={zone.id} position={[cx, gridMidY, -0.039]}>
            <planeGeometry args={[w, gridHeight]} />
            <ModeZoneGradientMaterial color={tintColor} width={w} ramp={MODE_GRADIENT_RAMP} opacity={MODE_GRADIENT_OPACITY} />
          </mesh>
        )
      })}
    </>
  )
}
