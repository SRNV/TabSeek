/**
 * Visual constants for the tablature scene.
 * Geometry constants (BEAT_W, STRING_H, etc.) remain in src/utils/tabUtils.ts;
 * this file holds colors, pod sizing, and camera bounds that are only relevant to rendering.
 */
import * as THREE from 'three'
import { ColorService } from '../../../services/ColorService'
import { MEASURE_W, LANE_H, GAP_WU, STRING_H, N_STRINGS } from '../../../utils/tabUtils'

function darkenHex(hex: string, pct: number): string {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, hsl.s, hsl.l * (1 - pct))
  return '#' + c.getHexString()
}
function desaturateHex(hex: string, pct: number): string {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, hsl.s * (1 - pct), hsl.l)
  return '#' + c.getHexString()
}

// ── Colors ───────────────────────────────────────────────────────────────────
export const SCALE_COLORS = ['#FFF9B1','#77DD77','#AEC6CF','#CDB4DB','#FFB3B3','#FFD1B3','#FFFFFF']

// Note disc palette — fill is 33% darker + 35% less saturated than the degree color, border
// is a further 33% darker than the fill (saturation already reduced, so it carries over),
// text uses ColorService's contrast function against the fill. Only 7 possible degree colors,
// so this is precomputed once at module load instead of per-render.
export const DISC_PALETTE: Record<string, { fill: string; border: string; text: string }> = (() => {
  const map: Record<string, { fill: string; border: string; text: string }> = {}
  for (const deg of SCALE_COLORS) {
    const fill = desaturateHex(darkenHex(deg, 0.33), 0.15)
    map[deg] = { fill, border: darkenHex(fill, 0.33), text: ColorService.getContrastColor(fill) }
  }
  return map
})()

export const BG_COL          = '#3a3a3a'
export const LANE_COL        = '#2e2e2e'
export const LANE_COL_HEX    = LANE_COL // Alias for shaders
export const MARGIN_COL      = '#1f1f1f'
export const BEAT_LINE_COL   = '#111111'
export const MEAS_LINE_COL   = '#505050'
export const OFF_COL         = '#606060'
export const SEL_COL         = '#FF9500'
export const PEND_COL        = '#3d8de0'
export const LEGATO_COL      = '#FFD700'
export const APPLE_GREEN     = '#88FF00'

// ── Chord pod ────────────────────────────────────────────────────────────────
export const CHORD_DUR            = 4           // beats per chord slot in a progression drop
export const CHORD_PAD_H          = 0.25
export const CHORD_PAD_V          = 0.25
export const CHORD_R              = 0.28
export const CHORD_BORDER_WU      = 0.10
export const CHORD_BORDER_COL     = '#4caf50'
export const CHORD_BORDER_HOVER_COL = '#7be08c'

// ── Progression pod ──────────────────────────────────────────────────────────
export const PROG_BORDER_COL      = '#5B8EE8'
export const PROG_BORDER_HOVER_COL = '#8fb3f0'
export const PROG_FILL_COL        = BG_COL
export const PROG_FILL_HOV        = '#4a4a4a'
export const PROG_PAD_H           = 1.20
export const PROG_PAD_V           = 0.55

// ── Mode pod ─────────────────────────────────────────────────────────────────
export const MODE_BORDER_COL        = '#cc0000'
export const MODE_BORDER_HOVER_COL  = '#ff4d4d'
export const MODE_GRADIENT_RAMP     = 0.2
export const MODE_GRADIENT_OPACITY  = 0.35

// ── Scene geometry (derived from tabUtils constants) ─────────────────────────
export const INFO_LANE_GAP  = 0.20
export const INFO_LANE_H    = LANE_H
export const CAM_HALF_H_TOP_OFF = 0.50
export const CAM_HALF_H_BOT_OFF = 0.30
