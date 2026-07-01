import { useEffect } from 'react'
import { Note } from 'tonal'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import type { ClipNote, ClipGroup, TablatureNote } from '../types'

interface KeyboardProps {
  editingId: string | null
  selectedIdsRef: React.MutableRefObject<Set<string>>
  selectedChordGroupIdsRef: React.MutableRefObject<Set<string>>
  legatoSourceId: string | null
  setLegatoSourceId: (id: string | null) => void
  setSelectedIds: (ids: Set<string>) => void
  setSelectedChordGroupIds: (ids: Set<string>) => void
  undo: () => void
  redo: () => void
  pushHistory: () => void
  deleteNote: (id: string, tuning: string[]) => void
  addNote: (note: Omit<TablatureNote, 'id'>) => string
  updateNote: (id: string, note: Partial<Omit<TablatureNote, 'id'>>, tuning: string[], scale: string[]) => void
  addChordGroup: (ids: string[], name: string) => void
  tuningArr: string[]
  scaleNotes: string[]
  clipboard: React.MutableRefObject<{ notes: ClipNote[], groups: ClipGroup[] }>
}

export const useTablatureKeyboard = ({
  editingId,
  selectedIdsRef,
  selectedChordGroupIdsRef,
  legatoSourceId,
  setLegatoSourceId,
  setSelectedIds,
  setSelectedChordGroupIds,
  undo,
  redo,
  pushHistory,
  deleteNote,
  addNote,
  updateNote,
  addChordGroup,
  tuningArr,
  scaleNotes,
  clipboard
}: KeyboardProps) => {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editingId) return
      const ids = selectedIdsRef.current
      const ctrl = e.ctrlKey || e.metaKey
      const state = useTablatureR3FStore.getState()

      if (e.key === 'Escape') {
        if (legatoSourceId) { setLegatoSourceId(null); e.preventDefault(); return }
        if (ids.size > 0) { setSelectedIds(new Set()); e.preventDefault(); return }
      }

      // Undo / Redo
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (ids.size === 0) return
        e.preventDefault()
        pushHistory()
        ids.forEach(id => deleteNote(id, tuningArr))
        setSelectedIds(new Set())
      }
      if (ctrl && e.key === 'a') {
        e.preventDefault()
        setSelectedIds(new Set(state.notes.map(n => n.id)))
      }
      if (ctrl && e.key === 'c') {
        const sel = state.notes.filter(n => ids.has(n.id))
        if (!sel.length) return
        e.preventDefault()
        const minBeat = Math.min(...sel.map(n => n.startBeat))
        const clipNotes: ClipNote[] = sel.map(n => ({ string: n.string, fret: n.fret, duration: n.duration, startBeat: n.startBeat - minBeat }))
        const selIds = new Set(sel.map(n => n.id))
        const clipGroups: ClipGroup[] = state.chordGroups
          .filter(g => g.noteIds.every(id => selIds.has(id)))
          .map(g => ({ chordName: g.chordName, noteIndices: g.noteIds.map(id => sel.findIndex(n => n.id === id)) }))
        clipboard.current = { notes: clipNotes, groups: clipGroups }
      }
      if (ctrl && e.key === 'v') {
        if (!clipboard.current.notes.length) return
        e.preventDefault()
        pushHistory()
        const all = state.notes
        const pasteAt = all.length > 0 ? Math.max(...all.map(n => n.startBeat + n.duration)) : 0
        const newIds: string[] = clipboard.current.notes.map(cn => addNote({ ...cn, startBeat: pasteAt + cn.startBeat }))
        for (const cg of clipboard.current.groups) {
          const groupNoteIds = cg.noteIndices.map(i => newIds[i]).filter(Boolean)
          if (groupNoteIds.length) addChordGroup(groupNoteIds, cg.chordName)
        }
        setSelectedIds(new Set(newIds))
      }

      // ↑/↓ : move selected notes one string up/down, preserving MIDI pitch.
      // For each note, the fret on the target string is recomputed so the note
      // sounds identical. The move is silently blocked for the entire selection
      // if any note hits a string bound (0/maxSi) or if its pitch cannot be
      // reached on the target string (fret outside 0-24).
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !ctrl && !e.shiftKey && ids.size > 0) {
        e.preventDefault()
        const delta = e.key === 'ArrowUp' ? 1 : -1
        const sel = state.notes.filter(n => ids.has(n.id))
        if (sel.length === 0) return
        const maxSi = tuningArr.length - 1
        const updates: { id: string; newSi: number; newFret: number }[] = []
        for (const n of sel) {
          const newSi = n.string + delta
          if (newSi < 0 || newSi > maxSi) return
          const currentMidi = (Note.midi(tuningArr[n.string] ?? 'E2') ?? 0) + n.fret
          const newFret = currentMidi - (Note.midi(tuningArr[newSi] ?? 'E2') ?? 0)
          if (newFret < 0 || newFret > 24) return
          updates.push({ id: n.id, newSi, newFret })
        }
        pushHistory()
        for (const { id, newSi, newFret } of updates) {
          updateNote(id, { string: newSi, fret: newFret }, tuningArr, scaleNotes)
        }
        return
      }

      // Ctrl+G: create progression from selected chord groups
      if (ctrl && e.key === 'g' && !e.shiftKey && selectedChordGroupIdsRef.current.size > 0) {
        e.preventDefault()
        pushHistory()
        state.addProgressionGroup([...selectedChordGroupIdsRef.current], 'Progression')
        setSelectedChordGroupIds(new Set())
        return
      }

      // Ctrl+B: duplicate to the right
      if (ctrl && e.key === 'b') {
        const sel = state.notes.filter(n => ids.has(n.id))
        if (!sel.length) return
        e.preventDefault()
        pushHistory()
        const sorted = [...sel].sort((a, b) => b.startBeat - a.startBeat)
        const newIds: string[] = []
        for (const n of sorted) {
          const copyBeat = n.startBeat + n.duration
          const toPush = state.notes.filter(
            o => o.string === n.string && o.startBeat >= copyBeat
          )
          for (const o of toPush) updateNote(o.id, { startBeat: o.startBeat + n.duration }, tuningArr, scaleNotes)
          newIds.push(addNote({ string: n.string, fret: n.fret, duration: n.duration, startBeat: copyBeat }))
        }
        setSelectedIds(new Set(newIds))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingId, deleteNote, addNote, pushHistory, undo, redo, tuningArr, scaleNotes, legatoSourceId, selectedIdsRef, selectedChordGroupIdsRef, clipboard, setLegatoSourceId, setSelectedIds, setSelectedChordGroupIds, addChordGroup, updateNote])
}
