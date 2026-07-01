/**
 * Barrel re-export for project-wide types.
 * Import from here rather than from individual source files when the consuming
 * module doesn't need direct access to the data or service that owns the type.
 */
export type { ModeGuitar } from '../types/mode'
export type {
  LegatoBehavior,
  TablatureNote,
  ChordGroup,
  ProgressionGroup,
  RhythmModifierMode,
  ArpeggioDirection,
  LegatoChain,
  RhythmModifier,
  ModeZone,
  Voicing,
  ClipNote,
  ClipGroup,
  ClipData,
  RibbonWaypoint,
  ChordProgression,
  ChordChart,
  RhythmTrack,
  RhythmPatternDef,
  ChordPosition,
  ChordTypeDef,
  Chords,
  ChordsCompleteDef,
} from './tablature'
export { MODE_ZONE_MIN_LENGTH } from './tablature'
export type {
  DragNoteState,
  DragChordGroupState,
  DragProgGroupState,
  DragRectState,
  DragNewProgState,
  DragPlaybackState,
  DragModeZoneState,
  AnyDragState,
  DropPayload,
} from './drag'
export type { PanelId, UIState, FretHighlight, GuitarPreset } from './ui'
export type { SelectionState, EditorHoverState } from './editor'
export type { Events } from './events'
