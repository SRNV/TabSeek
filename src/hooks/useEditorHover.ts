/**
 * @file useEditorHover.ts
 * Custom hook encapsulating all hover state for the tablature scene pods.
 *
 * Extracted from `TablatureScene` (P2-2). Each hover state is a nullable string
 * ID — only one entity of each type can be hovered at a time. Pointer enter/leave
 * handlers in TablatureScene call the setters; the values drive border-color
 * changes on chord/progression/rhythm/mode pods.
 *
 * `dragHoverSi` is the string index under the cursor during a drag-and-drop from
 * the left panel (chord/rhythm/progression drop). It is included here rather than
 * in the drag state because it is purely a visual indicator (lane highlight).
 *
 * The fretboard chord-name sync effect is co-located here because it reads
 * `hoveredGroupId` and `labelHoveredGroupId` — both owned by this hook.
 */
import { useState, useEffect } from 'react'
import type { ChordGroup } from '../stores/useTablatureR3FStore'
import { useMainStore } from '../stores/useMainStore'

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

/**
 * Returns hover state for all pod types and the drag-lane indicator.
 * Also drives the fretboard's `tabHoveredChordName` whenever a chord pod is hovered.
 *
 * @param chordGroups  Live chord groups from the R3F store — used to look up the
 *                     hovered chord's name for the fretboard highlight.
 */
export function useEditorHover(chordGroups: ChordGroup[]): EditorHoverState {
  const [hoveredGroupId, setHoveredGroupId]           = useState<string | null>(null)
  const [labelHoveredGroupId, setLabelHoveredGroupId] = useState<string | null>(null)
  const [hoveredProgId, setHoveredProgId]             = useState<string | null>(null)
  const [hoveredModId, setHoveredModId]               = useState<string | null>(null)
  const [hoveredModeZoneId, setHoveredModeZoneId]     = useState<string | null>(null)
  const [dragHoverSi, setDragHoverSi]                 = useState<number | null>(null)

  // Sync fretboard chord-name: show the hovered chord's notes on the fretboard.
  useEffect(() => {
    const activeId = hoveredGroupId ?? labelHoveredGroupId
    const group    = activeId ? chordGroups.find(g => g.id === activeId) : null
    useMainStore.getState().setTabHoveredChordName(group?.chordName ?? null)
  }, [hoveredGroupId, labelHoveredGroupId, chordGroups])

  return {
    hoveredGroupId, setHoveredGroupId,
    labelHoveredGroupId, setLabelHoveredGroupId,
    hoveredProgId, setHoveredProgId,
    hoveredModId, setHoveredModId,
    hoveredModeZoneId, setHoveredModeZoneId,
    dragHoverSi, setDragHoverSi,
  }
}
