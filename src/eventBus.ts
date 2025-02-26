// eventBus.ts
import mitt from 'mitt';

type Events = {
  noteSelected: number;
};

const emitter = mitt<Events>();

export default emitter;
