import type { LegatoBehavior } from '../types'

export const BEHAVIORS: Record<LegatoBehavior, { name: string, icon: string }> = {
  // ── Chromatique ───────────────────────────────────────────────────────────
  'chromatique':     { name: 'Chromatique',    icon: 'linear_scale' },
  // ── Diatoniques par intervalles ───────────────────────────────────────────
  'gamme':           { name: 'Gamme',          icon: 'music_note' },
  'tierces':         { name: 'Tierces',        icon: 'counter_3' },
  'quartes':         { name: 'Quartes',        icon: 'counter_4' },
  'quintes':         { name: 'Quintes',        icon: 'counter_5' },
  'sixtes':          { name: 'Sixtes',         icon: 'counter_6' },
  'septiemes':       { name: 'Septièmes',      icon: 'counter_7' },
  'octaves':         { name: 'Octaves',        icon: 'all_inclusive' },
  // ── Approches chromatiques ────────────────────────────────────────────────
  'approche':        { name: 'Approche ↑',     icon: 'trending_up' },
  'approche_dessus': { name: 'Approche ↓',     icon: 'trending_down' },
  'encerclement':    { name: 'Encerclement',   icon: 'adjust' },
  'double_chroma':   { name: 'Double Chroma',  icon: 'double_arrow' },
  // ── Arpèges ───────────────────────────────────────────────────────────────
  'triade':          { name: 'Triade',         icon: 'change_history' },
  'arp7':            { name: 'Arpège 7',       icon: 'star_half' },
  // ── Pentatoniques ─────────────────────────────────────────────────────────
  'pentatonique':    { name: 'Penta Maj',      icon: 'filter_5' },
  'penta_min':       { name: 'Penta Min',      icon: 'looks_5' },
  // ── Gammes spéciales / blues / bebop ─────────────────────────────────────
  'blues':           { name: 'Blues',          icon: 'water_drop' },
  'bebop':           { name: 'Bébop Maj',      icon: 'piano' },
  'bebop_dominant':  { name: 'Bébop Dom',      icon: 'piano_off' },
  'harmonique':      { name: 'Harmonique',     icon: 'auto_awesome' },
  'melodique':       { name: 'Mélodique',      icon: 'waves' },
  'altere':          { name: 'Altérée',        icon: 'warning' },
  // ── Gammes symétriques ────────────────────────────────────────────────────
  'whole-tone':      { name: 'Par Tons',       icon: 'texture' },
  'diminished':      { name: 'Diminuée',       icon: 'grid_view' },
  // ── Libre ─────────────────────────────────────────────────────────────────
  'free':            { name: 'Free',           icon: 'gesture' },
}

export const BEHAVIOR_KEYS = Object.keys(BEHAVIORS) as LegatoBehavior[]
