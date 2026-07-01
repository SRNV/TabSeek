/**
 * Barrel re-export for project-wide types.
 * Import from here rather than from individual source files when the consuming
 * module doesn't need direct access to the data or service that owns the type.
 */
export type { ModeGuitar } from '../types/mode'
export type { ChordProgression } from '../data/progressions'
export type { RhythmPatternDef } from '../data/rhythmPatterns'
export type {
  DragNoteState,
  DragChordGroupState,
  DragProgGroupState,
  DragRectState,
  DragNewProgState,
  DragPlaybackState,
  DragModeZoneState,
  AnyDragState,
} from './drag'

import type { TablatureNote } from '../stores/useTablatureR3FStore'

export type ClipNote  = Pick<TablatureNote, 'string'|'fret'|'duration'> & { startBeat: number }
export type ClipGroup = { noteIndices: number[]; chordName: string }
export type ClipData  = { notes: ClipNote[]; groups: ClipGroup[] }
