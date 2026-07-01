/**
 * Single access point for the runtime tuning array.
 * All services and components should use `getTuning()` instead of repeating
 * `useTablatureStore.getState().tuning.split(',')` at every call site.
 *
 * Order: index 0 = lowest string (E2), index N-1 = highest string (E4).
 * This is the order used by TablatureR3F and all R3F services.
 * (Tab.tsx's legacy `tuningArray()` reverses this — do NOT mix the two.)
 */

import { Note } from 'tonal'
import { useTablatureStore } from '../stores/useTablatureStore'

/** Returns the current tuning as a string array, low→high (si=0 = E2). */
export function getTuning(): string[] {
  return useTablatureStore.getState().tuning.split(',')
}

/** Returns the MIDI value of the open note on a given string index. */
export function getOpenMidi(si: number): number {
  const tuning = getTuning()
  return Note.midi(tuning[si] ?? 'E2') ?? 0
}
