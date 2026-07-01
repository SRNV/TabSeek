import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { MODE_ZONE_MIN_LENGTH } from '../../types'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { useMainStore } from '../../stores/useMainStore'
import { getNoteDegree } from '../../hooks/useNoteHelpers'
import { TablatureDropService } from '../../services/TablatureDropService'
import { TablatureMoveService } from '../../services/TablatureMoveService'
import { getChordEmojiByName } from '../../services/ChordEmojiService'
import { FretboardHighlightService } from '../../services/FretboardHighlightService'
import { LegatoFretVisualizationService } from '../../services/LegatoFretVisualizationService'
import { RhythmModifierService } from '../../services/RhythmModifierService'
import { PodModifierService } from '../../services/PodModifierService'
import { ModeZoneService } from '../../services/ModeZoneService'
import { NoteColorService } from '../../services/NoteColorService'
import { NoteEditService } from '../../services/NoteEditService'
import { PodModifierPopover, RhythmModifierDisc } from './PodModifierUI'
import { ColorService } from '../../services/ColorService'
import { passWheel } from './scene/passWheel'
import { ModeZoneGradientMaterial } from './scene/ModeZoneGradientMaterial'
import { useShallow } from 'zustand/react/shallow'
import { useEditorSelection } from '../../hooks/useEditorSelection'
import { useEditorHover } from '../../hooks/useEditorHover'
import { usePlaybackEngine } from '../../hooks/usePlaybackEngine'
import { useTablatureDragHandler } from '../../hooks/useTablatureDragHandler'
import { useTablatureKeyboard } from '../../hooks/useTablatureKeyboard'
import { useTablatureCamera } from '../../hooks/useTablatureCamera'
import { useTablatureFileDrop } from '../../hooks/useTablatureFileDrop'
import { BEHAVIORS, BEHAVIOR_KEYS } from '../../data/legatoBehaviors'
import { ModeZoneTint } from './scene/ModeZoneTint'
import { PlaybackIndicator } from './scene/PlaybackIndicator'
import { ModePods } from './scene/ModePods'
import { RhythmModifierPods } from './scene/RhythmModifierPods'
import { SceneBackground } from './scene/SceneBackground'
import { NotePods } from './scene/NotePods'
import { ChordPods } from './scene/ChordPods'
import { GhostNotePods } from './scene/GhostNotePods'
import { ProgressionPods } from './scene/ProgressionPods'
import { Minimap } from './scene/Minimap'
import { rhythmPatterns } from '../../data/rhythmPatterns'
import type {
  RhythmPatternDef,
  LegatoBehavior, TablatureNote, ChordGroup, ProgressionGroup, RhythmModifier,
  ClipData, ClipNote, ClipGroup
} from '../../types'
import './TablatureR3F.scss'

import {
  BEAT_W, SNAP, MIN_DUR, N_STRINGS, STRING_H, LANE_H, GAP_WU, MEASURE_W,
  gridTop, gridBottom, LEFT_MARGIN_W, HEADER_H, POD_HEADER_OFF, BUBBLE_W,
  stringY, siFromWorldY, snapBeat, constrainMove, constrainRight, constrainLeft, constrainChordGroupMove,
  LARGE_W, infoLaneY, CAM_HALF_H_TOP, CAM_HALF_H_BOT, marginY, measLabelY, MODE_HEADER_OFF_Y,
  noteZone, noteZoneCompact, zoneCursor, noteInRect
} from '../../utils/tabUtils'
import type { NoteZone } from '../../utils/tabUtils'
import {
  BG_COL, LANE_COL, MARGIN_COL, BEAT_LINE_COL, MEAS_LINE_COL, OFF_COL, SEL_COL, PEND_COL, LEGATO_COL, APPLE_GREEN,
  CHORD_PAD_H, CHORD_PAD_V, CHORD_R, CHORD_BORDER_WU, CHORD_BORDER_COL, CHORD_BORDER_HOVER_COL,
  PROG_BORDER_COL, PROG_BORDER_HOVER_COL, PROG_FILL_COL, PROG_FILL_HOV, PROG_PAD_H, PROG_PAD_V,
  CHORD_DUR, MODE_BORDER_COL, MODE_BORDER_HOVER_COL, MODE_GRADIENT_RAMP, MODE_GRADIENT_OPACITY,
  SCALE_COLORS, DISC_PALETTE
} from './scene/sceneConstants'
import type { 
  AnyDragState, DragNoteState as DragNote, DragRectState as DragRect, 
  DragChordGroupState as DragChordGroup, DragProgGroupState as DragProgGroup,
  DragNewProgState as DragNewProg, DragPlaybackState as DragPlayback,
  DragModeZoneState as DragModeZone, DragRhythmState as DragRhythm
} from '../../types/drag'
import { roundedRect, buildBeatGeo, buildMeasGeo } from '../../utils/tablatureGeometry'
import { nextFretSamePc, getNoteName } from '../../utils/guitarUtils'

const RECT_DRAG_PX     = 5

interface SceneProps { onStringYPcts: (pcts: number[]) => void }

function chordEmojiStr(chordName: string): string {
  return getChordEmojiByName(chordName)
}

// ── Scene ───────────────────────────────────────────────────────────────────────
function TablatureScene({ onStringYPcts }: SceneProps) {
  const { camera, gl, size, scene } = useThree()
  const o = camera as THREE.OrthographicCamera
  const pxPerWUX = size.width / (o.right - o.left)
  const pxPerWUY = size.height / (o.top - o.bottom)
  const invStretchX = pxPerWUY / pxPerWUX
  const camL = (o.position.x - LEFT_MARGIN_W) - (o.right - o.left) / 2
  // useShallow: TablatureScene only re-renders when one of these specific values actually
  // changes (shallow equality), not on every store mutation (P5-1 fix).
  const {
    notes, chordGroups, progressionGroups, rhythmModifiers, modeZones,
    addNote, updateNote, deleteNote,
    addChordGroup, removeChordGroup,
    addProgressionGroup, updateProgressionGroup,
    removeProgressionGroup,
    updateRhythmModifier, removeRhythmModifier,
    updateModeZone, removeModeZone,
    setLegato, setLegatoBehavior, addLegatoIntermediate, syncLegato,
    setLegatoAuto, setLegatoChain, renderLegato,
    pushHistory, undo, redo,
    isPlaying, playbackBeat, setPlaybackBeat, tempo, isLooping, setLooping, togglePlayback,
    isFollowing, setFollowing
  } = useTablatureR3FStore(useShallow(s => ({
    notes: s.notes, chordGroups: s.chordGroups, progressionGroups: s.progressionGroups,
    rhythmModifiers: s.rhythmModifiers, modeZones: s.modeZones,
    addNote: s.addNote, updateNote: s.updateNote, deleteNote: s.deleteNote,
    addChordGroup: s.addChordGroup, removeChordGroup: s.removeChordGroup,
    addProgressionGroup: s.addProgressionGroup, updateProgressionGroup: s.updateProgressionGroup,
    removeProgressionGroup: s.removeProgressionGroup,
    updateRhythmModifier: s.updateRhythmModifier, removeRhythmModifier: s.removeRhythmModifier,
    updateModeZone: s.updateModeZone, removeModeZone: s.removeModeZone,
    setLegato: s.setLegato, setLegatoBehavior: s.setLegatoBehavior,
    addLegatoIntermediate: s.addLegatoIntermediate, syncLegato: s.syncLegato,
    setLegatoAuto: s.setLegatoAuto, setLegatoChain: s.setLegatoChain, renderLegato: s.renderLegato,
    pushHistory: s.pushHistory, undo: s.undo, redo: s.redo,
    isPlaying: s.isPlaying, playbackBeat: s.playbackBeat, setPlaybackBeat: s.setPlaybackBeat,
    tempo: s.tempo, isLooping: s.isLooping, setLooping: s.setLooping, togglePlayback: s.togglePlayback,
    isFollowing: s.isFollowing, setFollowing: s.setFollowing,
  })))

  const userScale  = useMainStore(s => s.userScale)
  const modeObject = useMainStore(s => s.modeObject)
  const tuning     = useTablatureStore(s => s.tuning)

  const tuningArr  = useMemo(() => tuning.split(','), [tuning])
  const scaleNotes = useMemo(
    () => (modeObject.intervals as string[]).map(iv => Note.transpose(userScale, iv)),
    [userScale, modeObject]
  )

  const playbackBeatRef = useRef(playbackBeat)
  const playbackCursorGroupRef = useRef<THREE.Group>(null)

  // ── Playback Engine ────────────────────────────────────────────────────────
  usePlaybackEngine({
    notes,
    tuningArr,
    totalMeasures: 1000, // will be updated if needed
    tempo,
    isPlaying,
    isLooping,
    togglePlayback,
    setPlaybackBeat,
    playbackBeatRef,
    playbackCursorGroupRef
  })

  const legatoSourceId = useTablatureR3FStore(s => s.legatoSourceId)
  const setLegatoSourceId = useTablatureR3FStore(s => s.setLegatoSourceId)

  // Clear legatoSourceId if it's no longer in the notes list (prevent global grey-out)
  useEffect(() => {
    if (legatoSourceId && !notes.some(n => n.id === legatoSourceId)) {
      setLegatoSourceId(null)
    }
  }, [notes, legatoSourceId, setLegatoSourceId])

  function addLegato(sourceId: string, destId: string) {
    pushHistory()
    setLegato(sourceId, destId, 2, tuningArr)
    // Immediately sync with behavior (default 'chromatique')
    syncLegato(sourceId, tuningArr, scaleNotes)
    setLegatoSourceId(null)
  }

  useEffect(() => {
    scene.background = new THREE.Color(BG_COL)
    return () => { scene.background = null }
  }, [scene])

  const {
    totalMeasures, scrollX, halfWRef, setTotalMeasures, totalMeasRef, scrollTo, applyCameraW
  } = useTablatureCamera({ tuningArr, onStringYPcts })

  const beatGeo = useMemo(() => buildBeatGeo(totalMeasures), [totalMeasures])
  const measGeo = useMemo(() => buildMeasGeo(totalMeasures), [totalMeasures])

  // ── Hover state (P2-2: extracted to useEditorHover) ─────────────────────────
  const {
    hoveredGroupId, setHoveredGroupId,
    labelHoveredGroupId, setLabelHoveredGroupId,
    hoveredProgId, setHoveredProgId,
    hoveredModId, setHoveredModId,
    hoveredModeZoneId, setHoveredModeZoneId,
    dragHoverSi, setDragHoverSi,
  } = useEditorHover(chordGroups)

  // ── Selection & edit state (P2-2: extracted to useEditorSelection) ──────────────
  const {
    selectedIds, setSelectedIds, selectedIdsRef,
    editingId, setEditingId,
    inputVal, setInputVal,
    newNoteIds,
    clipboard,
    rectBox, setRectBox,
    selectedChordGroupIds, setSelectedChordGroupIds, selectedChordGroupIdsRef,
    editingProgId, setEditingProgId,
    editingProgName, setEditingProgName,
  } = useEditorSelection()

  const drag = useRef<AnyDragState>(null)
  const [newProgDrag, setNewProgDrag] = useState<{ startBeat: number; endBeat: number } | null>(null)

  // ── Native drag-and-drop ───────────────────────────────────────────────────
  useTablatureFileDrop({ halfWRef, scaleNotes, setDragHoverSi })

  // lanePend: tracks a lane mousedown that hasn't moved yet (click → dblclick-create; drag → rect-select)
  const lanePend = useRef<{ si: number; beat: number; startCX: number; startCY: number; startWX: number; startWY: number } | null>(null)

  // ── Drag & Drop Engine ─────────────────────────────────────────────────────
  const { onMove, onUp } = useTablatureDragHandler({
    drag,
    lanePend,
    halfWRef,
    totalMeasures,
    tuningArr,
    scaleNotes,
    setPlaybackBeat,
    setRectBox,
    setNewProgDrag,
    setSelectedIds,
    setSelectedChordGroupIds,
    siFromWorldY
  })

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup',   onUp)
    return () => {
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup',   onUp)
    }
  }, [gl, onMove, onUp])

  // ── Keyboard Engine ───────────────────────────────────────────────────────
  useTablatureKeyboard({
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
  })

  // ── Edit helpers ──────────────────────────────────────────────────────────────
  function confirmEdit(id: string, val: string) {
    const isNew = newNoteIds.current.has(id)
    newNoteIds.current.delete(id)
    if (val !== '') {
      const note = notes.find(n => n.id === id)
      const fret = note ? NoteEditService.parseFret(val, note, tuningArr) : null
      if (fret !== null) {
        pushHistory()
        updateNote(id, { fret }, tuningArr, scaleNotes)
      } else if (isNew) {
        pushHistory()
        deleteNote(id, tuningArr)
      }
    } else if (isNew) {
      pushHistory()
      deleteNote(id, tuningArr)
    }
    setEditingId(null)
    setInputVal('')
  }

  const intermediateIds = useMemo(() => {
    const s = new Set<string>()
    for (const n of notes) {
      if (n.intermediateNoteIds) {
        for (const id of n.intermediateNoteIds) s.add(id)
      }
    }
    return s
  }, [notes])

  // ── Color — selected notes keep degree fill; border added via separate mesh ────
  const getNoteColor = useCallback((note: TablatureNote, skipDarken = false, fretOverride?: number): string => {
    return NoteColorService.getNoteColor(note, {
      legatoSourceId, editingId, tuningArr, intermediateIds, totalMeasures, scaleNotes, skipDarken, fretOverride
    })
  }, [legatoSourceId, editingId, tuningArr, intermediateIds, totalMeasures, scaleNotes])

  // ── Chord pod geometry cache ──────────────────────────────────────────────────
  const chordPodCache = useRef(new Map<string, THREE.ShapeGeometry>())
  const bubbleGeo     = useMemo(() => new THREE.CircleGeometry(0.12, 16), [])
  const invXKey = invStretchX.toFixed(2)
  useEffect(() => {
    chordPodCache.current.forEach(g => g.dispose()); chordPodCache.current.clear()
  }, [invXKey])
  useEffect(() => () => { chordPodCache.current.forEach(g => g.dispose()) }, [])
  function getChordPodGeo(w: number, h: number, border = false) {
    const key = `${border?'b':'f'}_${w.toFixed(2)}_${h.toFixed(2)}`
    let g = chordPodCache.current.get(key)
    if (!g) {
      const bw = border ? w + CHORD_BORDER_WU * 2 : w
      const bh = border ? h + CHORD_BORDER_WU * 2 : h
      const ry = Math.min(bw / 2, bh / 2, CHORD_R + (border ? CHORD_BORDER_WU : 0))
      const rx = Math.min(bw / 2, ry * invStretchX)
      g = new THREE.ShapeGeometry(roundedRect(bw, bh, rx, ry), 4)
      chordPodCache.current.set(key, g)
    }
    return g
  }

  // ── Chord group bounds (derived from current note positions) ──────────────────
  function getGroupBounds(group: ChordGroup) {
    const gn = notes.filter(n => group.noteIds.includes(n.id))
    if (!gn.length) return null
    return {
      siMin:   Math.min(...gn.map(n => n.string)),
      siMax:   Math.max(...gn.map(n => n.string)),
      beatMin: Math.min(...gn.map(n => n.startBeat)),
      beatMax: Math.max(...gn.map(n => n.startBeat + n.duration)),
    }
  }

  // ── Progression group bounds ─────────────────────────────────────────────────
  function getProgBounds(prog: ProgressionGroup) {
    const allNotes: TablatureNote[] = []
    for (const cgId of prog.chordGroupIds) {
      const cg = chordGroups.find(g => g.id === cgId)
      if (!cg) continue
      for (const nId of cg.noteIds) {
        const n = notes.find(n => n.id === nId)
        if (n) allNotes.push(n)
      }
    }
    if (!allNotes.length) return null
    return {
      beatMin: Math.min(...allNotes.map(n => n.startBeat)),
      beatMax: Math.max(...allNotes.map(n => n.startBeat + n.duration)),
      siMin:   Math.min(...allNotes.map(n => n.string)),
      siMax:   Math.max(...allNotes.map(n => n.string)),
    }
  }

  // ── Progression pod pointer-down ──────────────────────────────────────────────
  function onProgPodDown(e: ThreeEvent<PointerEvent>, prog: ProgressionGroup, podW: number) {
    if (e.button !== 0) return
    e.stopPropagation()
    const bounds = getProgBounds(prog)
    if (!bounds) return
    const podLeft = bounds.beatMin * BEAT_W - CHORD_PAD_H - PROG_PAD_H
    const lx = e.point.x - podLeft
    const type = noteZone(lx, podW, invStretchX)

    const origNotes = prog.chordGroupIds.flatMap(cgId => {
      const cg = useTablatureR3FStore.getState().chordGroups.find(g => g.id === cgId)
      if (!cg) return []
      return useTablatureR3FStore.getState().notes
        .filter(n => cg.noteIds.includes(n.id))
        .map(n => ({ id: n.id, startBeat: n.startBeat, duration: n.duration, string: n.string }))
    })
    drag.current = {
      kind: 'prog-group', type, progId: prog.id, startX: e.point.x,
      origProgStart: bounds.beatMin, origProgEnd: bounds.beatMax,
      origNotes, didMove: false
    }
    gl.domElement.style.cursor = type === 'move' ? 'grabbing' : zoneCursor(type)
  }

  // ── Chord pod pointer-down ────────────────────────────────────────────────────
  function onChordPodDown(e: ThreeEvent<PointerEvent>, group: ChordGroup, podLeft: number, podW: number) {
    if (e.button !== 0) return
    e.stopPropagation()
    const lx   = e.point.x - podLeft
    const type = noteZone(lx, podW, invStretchX)   // reuse same edge-zone logic
    const origNotes = useTablatureR3FStore.getState().notes
      .filter(n => group.noteIds.includes(n.id))
      .map(n => ({ id: n.id, startBeat: n.startBeat, duration: n.duration, string: n.string }))
    const bounds = getGroupBounds(group)
    drag.current = {
      kind: 'chord-group', type, groupId: group.id,
      startX: e.point.x,
      origGroupStart: bounds?.beatMin ?? 0,
      origGroupEnd:   bounds?.beatMax ?? 1,
      origNotes,
      didMove: false,
    }
    gl.domElement.style.cursor = type === 'move' ? 'grabbing' : zoneCursor(type)
  }



  // Which notes are the root (tonic) of their chord group — used for blink overlay
  const rootNoteIds = useMemo(() => {
    const ids = new Set<string>()
    for (const group of chordGroups) {
      const tonic = Chord.get(group.chordName).tonic
      if (!tonic) continue
      for (const noteId of group.noteIds) {
        const n = notes.find(n => n.id === noteId)
        if (!n || !tuningArr[n.string]) continue
        if (Note.pitchClass(getNoteName(tuningArr[n.string], n.fret)) === tonic) ids.add(noteId)
      }
    }
    return ids
  // Fine-grained dep: only re-compute when note pitch (fret/string) or chord membership changes,
  // not on startBeat/duration-only updates (P5-2: avoids unnecessary O(n) recompute).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chordGroups.map(g => g.chordName + g.noteIds.join(',')).join('|'),
    notes.map(n => `${n.id}:${n.string}:${n.fret}`).join('|'),
    tuningArr.join(','),
  ])

  const laneBgGeo = useMemo(() => new THREE.PlaneGeometry(LARGE_W, LANE_H), [])
  const laneBgMat = useMemo(() => new THREE.MeshBasicMaterial({ color: LANE_COL }), [])
  const marginMat = useMemo(() => new THREE.MeshBasicMaterial({ color: MARGIN_COL }), [])

  const marginGeo = useMemo(() => {
    const h = CAM_HALF_H_TOP + CAM_HALF_H_BOT
    return new THREE.PlaneGeometry(LEFT_MARGIN_W, h)
  }, [])
  const marginY   = (CAM_HALF_H_TOP - CAM_HALF_H_BOT) / 2
  const matBeat   = useMemo(() => new THREE.LineBasicMaterial({ color: BEAT_LINE_COL }), [])
  const matMeas   = useMemo(() => new THREE.LineBasicMaterial({ color: MEAS_LINE_COL }), [])

  // ── Lane interactions ─────────────────────────────────────────────────────────
  // Single click: start potential rect-select or pan (handled in DOM handler)
  function onLanePointerDown(e: ThreeEvent<PointerEvent>, si: number) {
    if (e.button !== 0) return
    e.stopPropagation()
    if (editingId) { confirmEdit(editingId, inputVal); return }
    setSelectedIds(new Set())
    setSelectedChordGroupIds(new Set())
    const beat = Math.max(0, snapBeat(e.point.x / BEAT_W))
    lanePend.current = { si, beat, startCX: e.clientX, startCY: e.clientY, startWX: e.point.x, startWY: e.point.y }
  }

  // Double-click on empty lane → create note + open fret editor
  function onLaneDblClick(e: ThreeEvent<MouseEvent>, si: number) {
    e.stopPropagation()
    if (editingId) { confirmEdit(editingId, inputVal) }
    const beat = Math.max(0, snapBeat(e.point.x / BEAT_W))
    const conflict = useTablatureR3FStore.getState().notes.find(
      n => n.string === si && n.startBeat <= beat && beat < n.startBeat + n.duration
    )
    if (conflict) return
    pushHistory()
    const id = addNote({ string: si, startBeat: beat, duration: 1, fret: 0 })
    newNoteIds.current.add(id)
    setEditingId(id); setInputVal(''); setSelectedIds(new Set([id]))
  }

  // ── Note pointer down → start drag ───────────────────────────────────────────
  function onNoteDown(e: ThreeEvent<PointerEvent>, note: TablatureNote) {
    if (e.button !== 0) return
    e.stopPropagation()
    lanePend.current = null
    if (editingId && editingId !== note.id) confirmEdit(editingId, inputVal)

    const w  = note.duration * BEAT_W
    const lx = e.point.x - note.startBeat * BEAT_W
    // Fret/name now live in the disc overlay (DOM, not raycast) — only resize/move/bubble zones remain
    const hasVirtual = !!RhythmModifierService.getVirtualRhythm(note)
    const showBubble = !hasVirtual && !intermediateIds.has(note.id) && !note.legatoPrev && (w * pxPerWUX) >= 35
    // Rhythm-legato locked notes can only change string — always treat as 'move', no resize
    const tp = RhythmModifierService.isLegatoLocked(note.id) ? 'move' : noteZoneCompact(lx, w, invStretchX, showBubble)

    // Legato Click-to-Click logic
    if (legatoSourceId) {
      if (legatoSourceId !== note.id) {
        addLegato(legatoSourceId, note.id)
      }
      setLegatoSourceId(null)
      return
    }

    if (tp === 'bubble-next') {
      setLegatoSourceId(note.id)
      return
    }

    pushHistory()   // one undo step per drag gesture
    setSelectedIds(new Set([note.id]))
    drag.current = { kind: 'note', noteId: note.id, type: tp, startX: e.point.x, origBeat: note.startBeat, origDur: note.duration, origSi: note.string, origFret: note.fret }
    gl.domElement.style.cursor = tp === 'move' ? 'grabbing' : zoneCursor(tp)
  }

  const halfW = halfWRef.current

  return (
    <>
      <SceneBackground
        scrollX={scrollX}
        halfW={halfW}
        totalMeasures={totalMeasures}
        dragHoverSi={dragHoverSi}
        newProgDrag={newProgDrag}
        beatGeo={beatGeo}
        measGeo={measGeo}
        onLanePointerDown={onLanePointerDown}
        onLaneDblClick={onLaneDblClick}
        onInfoLanePointerDown={e => {
          if (e.button !== 0) return
          e.stopPropagation()
          if (legatoSourceId) setLegatoSourceId(null)
          const startBeat = e.point.x / BEAT_W
          drag.current = { kind: 'new-prog', startBeat, endBeat: startBeat }
          setNewProgDrag({ startBeat, endBeat: startBeat })
          gl.domElement.style.cursor = 'crosshair'
        }}
        onBackgroundPointerDown={() => { if (legatoSourceId) setLegatoSourceId(null) }}
      />

      {/* Progression pods — extracted to ProgressionPods (P2-1) */}
      <ProgressionPods
        invStretchX={invStretchX}
        pxPerWUX={pxPerWUX}
        camL={camL}
        hoveredProgId={hoveredProgId}
        editingProgId={editingProgId}
        editingProgName={editingProgName}
        setHoveredProgId={setHoveredProgId}
        setEditingId={setEditingId}
        setEditingProgId={setEditingProgId}
        setEditingProgName={setEditingProgName}
        onProgPodDown={onProgPodDown}
        getProgBounds={getProgBounds}
        getChordPodGeo={getChordPodGeo}
        pushHistory={pushHistory}
      />

      {/* Mode pods — extracted to ModePods (P2-1) */}
      <ModePods
        hoveredModeZoneId={hoveredModeZoneId}
        setHoveredModeZoneId={setHoveredModeZoneId}
        drag={drag}
        invStretchX={invStretchX}
        pxPerWUX={pxPerWUX}
      />

      {/* Rhythm Modifiers — extracted to RhythmModifierPods (P2-1) */}
      <RhythmModifierPods
        hoveredModId={hoveredModId}
        setHoveredModId={setHoveredModId}
        invStretchX={invStretchX}
        pxPerWUX={pxPerWUX}
        getProgBounds={getProgBounds}
      />

      {/* Chord pods — extracted to ChordPods (P2-1) */}
      <ChordPods
        invStretchX={invStretchX}
        pxPerWUX={pxPerWUX}
        scrollX={scrollX}
        halfW={halfW}
        camL={camL}
        tuningArr={tuningArr}
        selectedChordGroupIds={selectedChordGroupIds}
        labelHoveredGroupId={labelHoveredGroupId}
        setHoveredGroupId={setHoveredGroupId}
        setLabelHoveredGroupId={setLabelHoveredGroupId}
        onChordPodDown={onChordPodDown}
        onNewProgDown={(e, groupId) => {
          if (e.button !== 0) return
          e.stopPropagation()
          const startBeat = e.point.x / BEAT_W
          drag.current = { kind: 'new-prog', startBeat, endBeat: startBeat, fromGroupId: groupId, ctrlKey: e.ctrlKey || e.metaKey }
          setNewProgDrag({ startBeat, endBeat: startBeat })
          gl.domElement.style.cursor = 'crosshair'
        }}
        getGroupBounds={getGroupBounds}
        getChordPodGeo={getChordPodGeo}
        pushHistory={pushHistory}
      />

      <NotePods
        scrollX={scrollX}
        halfW={halfW}
        invStretchX={invStretchX}
        pxPerWUX={pxPerWUX}
        pxPerWUY={pxPerWUY}
        totalMeasures={totalMeasures}
        tuningArr={tuningArr}
        scaleNotes={scaleNotes}
        BEHAVIORS={BEHAVIORS}
        BEHAVIOR_KEYS={BEHAVIOR_KEYS}
        DISC_PALETTE={DISC_PALETTE}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editingId={editingId}
        setEditingId={setEditingId}
        inputVal={inputVal}
        setInputVal={setInputVal}
        newNoteIds={newNoteIds}
        legatoSourceId={legatoSourceId}
        setLegatoSourceId={setLegatoSourceId}
        getNoteColor={getNoteColor}
        confirmEdit={confirmEdit}
        onNoteDown={onNoteDown}
        pushHistory={pushHistory}
      />





      {/* Rectangle selection overlay */}
      {rectBox && (() => {
        const rw = Math.max(0.001, Math.abs(rectBox.x1 - rectBox.x0))
        const rh = Math.max(0.001, Math.abs(rectBox.y1 - rectBox.y0))
        const cx = (rectBox.x0 + rectBox.x1) / 2
        const cy = (rectBox.y0 + rectBox.y1) / 2
        return (
          <group position={[cx, cy, 0.09]}>
            <mesh>
              <planeGeometry args={[rw, rh]} />
              <meshBasicMaterial color={SEL_COL} transparent opacity={0.15} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[rw, rh]} />
              <meshBasicMaterial color={SEL_COL} transparent opacity={0.55} depthWrite={false} wireframe />
            </mesh>
          </group>
        )
      })()}

      {/* F6 — Ghost pods preview during drag-over */}
      <GhostNotePods />

      {/* Playback Indicator — extracted to PlaybackIndicator (P2-1) */}
      <PlaybackIndicator
        ref={playbackCursorGroupRef}
        playbackBeat={playbackBeat}
        invStretchX={invStretchX}
        onDragStart={e => {
          e.stopPropagation()
          drag.current = { kind: 'playback-beat' }
          ;(e.nativeEvent.target as Element).setPointerCapture(e.pointerId)
          gl.domElement.style.cursor = 'ew-resize'
        }}
        onHoverEnter={() => { if (!drag.current) gl.domElement.style.cursor = 'ew-resize' }}
        onHoverLeave={() => { if (!drag.current) gl.domElement.style.cursor = 'default' }}
      />

      <Minimap
        notes={notes}
        totalMeasures={totalMeasures}
        halfWRef={halfWRef}
        playbackBeatRef={playbackBeatRef}
        scrollTo={scrollTo}
        applyCameraW={applyCameraW}
      />
    </>
  )
}

function stringLabel(tuningArr: string[], si: number): string {
  const note = Note.get(tuningArr[si] ?? '')
  if (note.empty) return tuningArr[si] ?? '?'
  const name = note.name // e.g. "E2", "G3", "B3"
  // Topmost string (high e): guitar convention uses lowercase 'e'
  if (si === N_STRINGS - 1 && note.pc === 'E') return `e${note.oct ?? ''}`
  return name
}

export default function TablatureR3F() {
  const [stringYPcts, setStringYPcts] = useState<number[]>([])
  const tuning    = useTablatureStore(s => s.tuning)
  const tuningArr = useMemo(() => tuning.split(','), [tuning])

  return (
    <div className="tab-r3f-main-container">
      <div className="tab-r3f-top-content">
        <div className="tab-r3f-sidebar">
          {tuningArr.map((_, si) => (
            <span key={si} className="tab-r3f-string-label"
              style={{ top: `${stringYPcts[si] ?? (si + 1) / (N_STRINGS + 1) * 100}%` }}>
              {stringLabel(tuningArr, si)}
            </span>
          ))}
        </div>
        <div className="tab-r3f-canvas-area">
          <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 10] }} gl={{ antialias: true }}>
            <TablatureScene onStringYPcts={setStringYPcts} />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
