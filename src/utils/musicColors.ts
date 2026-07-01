/**
 * Shared degree colors used by the fretboard renderer (Tab.tsx) and
 * ModeZoneService.getScaleHighlights for hover highlighting.
 * Index 0 = degree 1 (tonic), index 6 = degree 7 (leading tone).
 */
export const DEGREE_COLORS = [
  '#FFF9B1', // 1 tonic – yellow
  '#77DD77', // 2 – green
  '#AEC6CF', // 3 – steel blue
  '#CDB4DB', // 4 – lavender
  '#FFB3B3', // 5 – pink
  '#FFD1B3', // 6 – peach
  '#FFFFFF', // 7 – white
] as const
