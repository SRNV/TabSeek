import { Dispatch, SetStateAction } from 'react'
import type { ClipData } from './tablature'

/** All note/chord IDs currently selected (orange border). */
export type SelectionState = {
  selectedIds: Set<string>
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>
  selectedIdsRef: React.MutableRefObject<Set<string>>

  editingId: string | null
  setEditingId: Dispatch<SetStateAction<string | null>>
  inputVal: string
  setInputVal: Dispatch<SetStateAction<string>>

  /** Tracks note IDs created in the current gesture — used to auto-open fret editor. */
  newNoteIds: React.MutableRefObject<Set<string>>
  /** Copy/paste clipboard data. */
  clipboard: React.MutableRefObject<ClipData>

  /** Rectangle selection box (world coords). Null when inactive. */
  rectBox: { x0: number; y0: number; x1: number; y1: number } | null
  setRectBox: Dispatch<SetStateAction<{ x0: number; y0: number; x1: number; y1: number } | null>>

  selectedChordGroupIds: Set<string>
  setSelectedChordGroupIds: Dispatch<SetStateAction<Set<string>>>
  selectedChordGroupIdsRef: React.MutableRefObject<Set<string>>

  editingProgId: string | null
  setEditingProgId: Dispatch<SetStateAction<string | null>>
  editingProgName: string
  setEditingProgName: Dispatch<SetStateAction<string>>
}

export type EditorHoverState = {
  hoveredGroupId: string | null
  setHoveredGroupId: (id: string | null) => void

  labelHoveredGroupId: string | null
  setLabelHoveredGroupId: (id: string | null) => void

  hoveredProgId: string | null
  setHoveredProgId: (id: string | null) => void

  hoveredModId: string | null
  setHoveredModId: (id: string | null) => void

  hoveredModeZoneId: string | null
  setHoveredModeZoneId: (id: string | null) => void

  /** String index (0 = low E) highlighted while dragging a chord/rhythm over the canvas. */
  dragHoverSi: number | null
  setDragHoverSi: (si: number | null) => void
}
