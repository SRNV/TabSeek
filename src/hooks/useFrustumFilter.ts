import { useCallback } from 'react'
import { BEAT_W } from '../utils/tabUtils'

/**
 * Phase A — HTML frustum culling.
 * Returns an `isPodVisible(startBeat, duration)` predicate that checks whether
 * a pod's X range overlaps the current camera viewport.
 * Call result is stable as long as scrollX/halfW don't change.
 */
export function useFrustumFilter(scrollX: number, halfW: number) {
  return useCallback((startBeat: number, duration: number): boolean => {
    const left  = startBeat * BEAT_W
    const right = left + duration * BEAT_W
    return right > scrollX - halfW && left < scrollX + halfW
  }, [scrollX, halfW])
}
