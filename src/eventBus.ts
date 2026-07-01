import mitt from 'mitt'
import type { Events } from './types/events'

const emitter = mitt<Events>()

export default emitter
