import mitt from 'mitt'
import type { ChordProgression } from './data/progressions'

type Events = {
  noteSelected: number
  notePlayed: number
  midiSelected: number[]
  showTooltip: { title: string; content: string; x: number; y: number }
  hideTooltip: void
  playProgression: ChordProgression
  progressionDragStart: ChordProgression
}

const emitter = mitt<Events>()

export default emitter
