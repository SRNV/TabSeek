/**
 * Discriminated union types for the drag state in TablatureR3F.tsx.
 * Extracted here so TablatureMoveService can use proper types instead of `any`.
 */

export type NoteZone =
  | 'resize-left'
  | 'bubble-prev'
  | 'fret'
  | 'name'
  | 'move'
  | 'bubble-next'
  | 'resize-right'

export type DragNoteState = {
  kind: 'note'
  noteId: string
  type: NoteZone
  startX: number
  origBeat: number
  origDur: number
  origSi: number
  origFret: number
}

export type DragChordGroupState = {
  kind: 'chord-group'
  type: NoteZone
  groupId: string
  startX: number
  origGroupStart: number
  origGroupEnd: number
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>
  didMove: boolean
}

export type DragProgGroupState = {
  kind: 'prog-group'
  type: NoteZone
  progId: string
  startX: number
  origProgStart: number
  origProgEnd: number
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>
  didMove: boolean
}

export type DragRectState = { kind: 'rect'; x0: number; y0: number; x1: number; y1: number }
export type DragNewProgState = { kind: 'new-prog'; startBeat: number; endBeat: number; fromGroupId?: string; ctrlKey?: boolean }
export type DragPlaybackState = { kind: 'playback-beat' }
export type DragModeZoneState = { kind: 'mode-zone'; type: 'move' | 'resize-right'; zoneId: string; startX: number; origStartBeat: number; origLength: number }

export type AnyDragState =
  | DragNoteState
  | DragChordGroupState
  | DragProgGroupState
  | DragRectState
  | DragNewProgState
  | DragPlaybackState
  | DragModeZoneState
  | null
