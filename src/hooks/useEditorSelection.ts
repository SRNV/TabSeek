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
import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'

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

type ClipNote  = { string: number; fret: number; duration: number; startBeat: number }
type ClipGroup = { noteIndices: number[]; chordName: string }
type ClipData  = { notes: ClipNote[]; groups: ClipGroup[] }

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
