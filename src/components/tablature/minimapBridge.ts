// Shared mutable singleton — written by TablatureScene (useFrame), read by TablatureMinimap (RAF)
// Avoids React re-renders and works across the R3F Canvas boundary.
export const minimapBridge = {
  scrollX:       0,
  halfW:         24,
  totalMeasures: 1000,
  // Written by TablatureMinimap on click/drag; cleared by TablatureScene after applying
  targetScrollX: null as number | null,
}
