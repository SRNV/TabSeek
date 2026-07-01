/**
 * @file useEditorSelection.ts
 * Custom hook encapsulating all note/chord selection and inline-edit state for the
 * tablature scene.
 *
 * Extracted from `TablatureScene` (P2-2) to reduce the 21-useState footprint of
 * that component. The hook has no R3F dependencies so it can be tested in isolation.
 *
 * `selectedIdsRef` and `selectedChordGroupIdsRef` mirror the Set state in refs so
 * that event handlers in `useEffect` closures (which capture a stale copy of state)
 * can still read the current selection without depending on the reactive value.
 */
import { useState, useRef, useEffect } from 'react'
import type { SelectionState } from '../types/editor'
import type { ClipData } from '../types/tablature'

/**
 * Returns all selection and inline-edit state needed by `TablatureScene`.
 * Caller is responsible for `useEffect` side-effects that depend on this state
 * (e.g. fretboard chord-name highlight is tied to hover, not selection — see `useEditorHover`).
 */
export function useEditorSelection(): SelectionState {
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(new Set())
  const selectedIdsRef                            = useRef<Set<string>>(new Set())
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

  const [editingId, setEditingId]                 = useState<string | null>(null)
  const [inputVal, setInputVal]                   = useState('')
  const newNoteIds                                = useRef(new Set<string>())
  const clipboard                                 = useRef<ClipData>({ notes: [], groups: [] })
  const [rectBox, setRectBox]                     = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  const [selectedChordGroupIds, setSelectedChordGroupIds] = useState<Set<string>>(new Set())
  const selectedChordGroupIdsRef                  = useRef<Set<string>>(new Set())
  useEffect(() => { selectedChordGroupIdsRef.current = selectedChordGroupIds }, [selectedChordGroupIds])

  const [editingProgId, setEditingProgId]         = useState<string | null>(null)
  const [editingProgName, setEditingProgName]     = useState('')

  return {
    selectedIds, setSelectedIds, selectedIdsRef,
    editingId, setEditingId,
    inputVal, setInputVal,
    newNoteIds,
    clipboard,
    rectBox, setRectBox,
    selectedChordGroupIds, setSelectedChordGroupIds, selectedChordGroupIdsRef,
    editingProgId, setEditingProgId,
    editingProgName, setEditingProgName,
  }
}
