// eventBus.ts - Système d'événements amélioré
import mitt from 'mitt';

type Events = {
  noteSelected: number;
  notePlayed: number;
  midiSelected: number[];
  showTooltip: { title: string, content: string, x: number, y: number };
  hideTooltip: void;
  playProgression: any;
  progressionDragStart: any;
};

const emitter = mitt<Events>();

export default emitter;