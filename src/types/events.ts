import type { ChordProgression } from './tablature'

export type Events = {
  noteSelected: number
  notePlayed: number
  midiSelected: number[]
  showTooltip: { title: string; content: string; x: number; y: number }
  hideTooltip: void
  playProgression: ChordProgression
  progressionDragStart: ChordProgression
}
