import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore, MODE_ZONE_MIN_LENGTH } from '../../stores/useTablatureR3FStore'
import type { TablatureNote, ChordGroup, ProgressionGroup, LegatoBehavior, RhythmModifier } from '../../stores/useTablatureR3FStore'
import type { ChordProgression } from '../../data/progressions'
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
import { PodModifierDisc, PodModifierPopover, RhythmModifierDisc, ChordPopoverButtons, ModePopoverButtons, InstrumentTrackDisc } from './PodModifierUI'
import { playNote, playFullChord, stopAllSounds } from '../../hooks/useAudio'
import { ColorService } from '../../services/ColorService'
import { LegatoLine } from './scene/LegatoLine'
import { NoteDisc } from './scene/NoteDisc'
import { SubNoteBody } from './scene/SubNoteBody'
import { passWheel } from './scene/passWheel'
import { ModeZoneGradientMaterial } from './scene/ModeZoneGradientMaterial'
import { useShallow } from 'zustand/react/shallow'
import { useEditorSelection } from '../../hooks/useEditorSelection'
import { useEditorHover } from '../../hooks/useEditorHover'
import { ModeZoneTint } from './scene/ModeZoneTint'
import { PlaybackIndicator } from './scene/PlaybackIndicator'
import { ModePods } from './scene/ModePods'
import { RhythmModifierPods } from './scene/RhythmModifierPods'
import { rhythmPatterns, type RhythmPatternDef } from '../../data/rhythmPatterns'
import './TablatureR3F.scss'

const BEHAVIORS: Record<LegatoBehavior, { name: string, icon: string }> = {
  // ── Chromatique ───────────────────────────────────────────────────────────
  'chromatique':     { name: 'Chromatique',    icon: 'linear_scale' },
  // ── Diatoniques par intervalles ───────────────────────────────────────────
  'gamme':           { name: 'Gamme',          icon: 'music_note' },
  'tierces':         { name: 'Tierces',        icon: 'counter_3' },
  'quartes':         { name: 'Quartes',        icon: 'counter_4' },
  'quintes':         { name: 'Quintes',        icon: 'counter_5' },
  'sixtes':          { name: 'Sixtes',         icon: 'counter_6' },
  'septiemes':       { name: 'Septièmes',      icon: 'counter_7' },
  'octaves':         { name: 'Octaves',        icon: 'all_inclusive' },
  // ── Approches chromatiques ────────────────────────────────────────────────
  'approche':        { name: 'Approche ↑',     icon: 'trending_up' },
  'approche_dessus': { name: 'Approche ↓',     icon: 'trending_down' },
  'encerclement':    { name: 'Encerclement',   icon: 'adjust' },
  'double_chroma':   { name: 'Double Chroma',  icon: 'double_arrow' },
  // ── Arpèges ───────────────────────────────────────────────────────────────
  'triade':          { name: 'Triade',         icon: 'change_history' },
  'arp7':            { name: 'Arpège 7',       icon: 'star_half' },
  // ── Pentatoniques ─────────────────────────────────────────────────────────
  'pentatonique':    { name: 'Penta Maj',      icon: 'filter_5' },
  'penta_min':       { name: 'Penta Min',      icon: 'looks_5' },
  // ── Gammes spéciales / blues / bebop ─────────────────────────────────────
  'blues':           { name: 'Blues',          icon: 'water_drop' },
  'bebop':           { name: 'Bébop Maj',      icon: 'piano' },
  'bebop_dominant':  { name: 'Bébop Dom',      icon: 'piano_off' },
  'harmonique':      { name: 'Harmonique',     icon: 'auto_awesome' },
  'melodique':       { name: 'Mélodique',      icon: 'waves' },
  'altere':          { name: 'Altérée',        icon: 'warning' },
  // ── Gammes symétriques ────────────────────────────────────────────────────
  'whole-tone':      { name: 'Par Tons',       icon: 'texture' },
  'diminished':      { name: 'Diminuée',       icon: 'grid_view' },
  // ── Libre ─────────────────────────────────────────────────────────────────
  'free':            { name: 'Free',           icon: 'gesture' },
}
const BEHAVIOR_KEYS = Object.keys(BEHAVIORS) as LegatoBehavior[]

import {
  BEAT_W, SNAP, MIN_DUR, N_STRINGS, STRING_H, LANE_H, GAP_WU, BEATS_PER_MEAS, MEASURE_W,
  gridTop, gridBottom, LEFT_MARGIN_W, HEADER_H, POD_HEADER_OFF, BUBBLE_W,
  NoteZone, noteZone, noteZoneCompact, zoneCursor, noteInRect,
  stringY, siFromWorldY, snapBeat, constrainMove, constrainRight, constrainLeft, constrainChordGroupMove
} from '../../utils/tabUtils'
import { roundedRect, leftCircleRect, buildBeatGeo, buildMeasGeo } from '../../utils/tablatureGeometry'
import { findFretForNote, findFretForPc, nextFretSamePc, getNoteName } from '../../utils/guitarUtils'

const INITIAL_MEASURES = 1000
const TRIGGER_FRAC     = 0.85
const EXTEND_FRAC      = 0.5
const SCROLL_SPEED     = BEAT_W / 50
const LARGE_W          = 4_000_000
const RECT_DRAG_PX     = 5

const SCALE_COLORS = ['#FFF9B1','#77DD77','#AEC6CF','#CDB4DB','#FFB3B3','#FFD1B3','#FFFFFF']

function darkenHex(hex: string, pct: number): string {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, hsl.s, hsl.l * (1 - pct))
  return '#' + c.getHexString()
}
function desaturateHex(hex: string, pct: number): string {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL(hsl.h, hsl.s * (1 - pct), hsl.l)
  return '#' + c.getHexString()
}

// Note disc palette — fill is 33% darker + 35% less saturated than the degree color, border
// is a further 33% darker than the fill (saturation already reduced, so it carries over),
// text uses ColorService's contrast function against the fill. Only 7 possible degree colors,
// so this is precomputed once at module load instead of per-render.
const DISC_PALETTE: Record<string, { fill: string; border: string; text: string }> = (() => {
  const map: Record<string, { fill: string; border: string; text: string }> = {}
  for (const deg of SCALE_COLORS) {
    const fill = desaturateHex(darkenHex(deg, 0.33), 0.15)
    map[deg] = { fill, border: darkenHex(fill, 0.33), text: ColorService.getContrastColor(fill) }
  }
  return map
})()

const BG_COL        = '#3a3a3a'
const LANE_COL      = '#2e2e2e'
const MARGIN_COL    = darkenHex(LANE_COL, 0.33)
const BEAT_LINE_COL = '#111111'
const MEAS_LINE_COL = '#505050'
const OFF_COL       = '#606060'
const SEL_COL       = '#FF9500'
const PEND_COL      = '#3d8de0'
const LEGATO_COL    = '#FFD700'   // gold for legato bubbles
const APPLE_GREEN   = '#88FF00'

// Info lane — chord labels
const INFO_LANE_GAP = 0.20
const INFO_LANE_H   = LANE_H
const infoLaneY     = gridBottom - INFO_LANE_GAP - INFO_LANE_H / 2

// Asymmetric frustum: bottom for info lane, top to show pods inside top gap
const CAM_HALF_H_TOP = gridTop + 0.50
const CAM_HALF_H_BOT = gridTop + INFO_LANE_GAP + INFO_LANE_H + 0.30

// Progression pod style
const PROG_BORDER_COL      = '#5B8EE8'
const PROG_BORDER_HOVER_COL = '#8fb3f0' // lighter shade of its own theme on hover — not the generic SEL_COL
const PROG_FILL_COL   = BG_COL
const PROG_FILL_HOV   = '#4a4a4a'
const PROG_PAD_H      = 1.20   // extra padding beyond chord pod edges on each side
const PROG_PAD_V      = 0.55

const CHORD_DUR       = BEATS_PER_MEAS   // 4 beats per chord slot when dropping a progression
const CHORD_PAD_H     = 0.25            // horizontal padding around chord pod (WU ≈ 5px)
const CHORD_PAD_V     = 0.25            // vertical padding around chord pod (WU ≈ 5px)
const CHORD_R         = 0.28            // chord pod corner radius (WU)
const CHORD_BORDER_WU = 0.10            // ~2 px border at standard zoom
const CHORD_BORDER_COL       = '#4caf50' // green border
const CHORD_BORDER_HOVER_COL = '#7be08c' // lighter shade of its own theme on hover — not the generic SEL_COL

// Mode pod style — not anchored to a specific string row (influences the whole grid), but its
// header still sits in the inter-string gap above the topmost string ("e"), exactly like a
// Chord/Progression pod whose bounds.siMax is that same topmost string — not above the measure
// number labels, which stay further up still (gridTop+0.20).
const MODE_BORDER_COL       = '#cc0000'
const MODE_BORDER_HOVER_COL = '#ff4d4d'
const MODE_HEADER_OFF       = stringY(N_STRINGS - 1) + POD_HEADER_OFF
const MODE_GRADIENT_RAMP    = 0.2
const MODE_GRADIENT_OPACITY = 0.35

// ── Types ─────────────────────────────────────────────────────────────────────
type DragNote = { kind: 'note'; noteId: string; type: NoteZone; startX: number; origBeat: number; origDur: number; origSi: number; origFret: number }
type DragRect = { kind: 'rect'; x0: number; y0: number; x1: number; y1: number }
type DragChordGroup = {
  kind: 'chord-group'
  type: NoteZone
  groupId: string
  startX: number
  origGroupStart: number
  origGroupEnd: number
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>
  didMove: boolean
}
type ClipNote  = Pick<TablatureNote, 'string'|'fret'|'duration'> & { startBeat: number }
type ClipGroup = { noteIndices: number[]; chordName: string }
type ClipData  = { notes: ClipNote[]; groups: ClipGroup[] }
type DragProgGroup = {
  kind: 'prog-group'
  type: NoteZone
  progId: string
  startX: number
  origProgStart: number
  origProgEnd: number
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>
  didMove: boolean
}
type DragNewProg = {
  kind: 'new-prog'
  startBeat: number
  endBeat: number
  fromGroupId?: string
  ctrlKey?: boolean
}
type DragPlayback = { kind: 'playback-beat' }
type DragRhythm = { kind: 'rhythm'; pattern: RhythmPatternDef }
type DragModeZone = { kind: 'mode-zone'; type: 'move' | 'resize-right'; zoneId: string; startX: number; origStartBeat: number; origLength: number }

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

  const lastBeatRef = useRef(playbackBeat)
  const lastActiveIdsRef = useRef<string>('')
  // High-frequency playback ref — updated every frame in useFrame, never triggers re-renders.
  // Zustand's playbackBeat is updated at most once every 6 frames (~10 FPS) to keep external
  // consumers (playback footer, note isActive gating) responsive without flooding Zustand.
  const playbackBeatRef = useRef(playbackBeat)
  const playbackFrameCount = useRef(0)
  // Cursor group updated imperatively every frame — no React re-render needed for position.
  const playbackCursorGroupRef = useRef<THREE.Group>(null)

  // ── Minimap ───────────────────────────────────────────────────────────────────
  const MINIMAP_PX = 56

  const minimapCam = useMemo(() => {
    const cam = new THREE.OrthographicCamera()
    cam.position.set(0, 0, 10)
    cam.near = 0.1
    cam.far  = 100
    cam.layers.enable(1) // sees layer 0 (scene) + layer 1 (viewport rect)
    return cam
  }, [])

  const viewportRectRef = useRef<THREE.LineLoop>(null)
  const minimapCursorRef  = useRef<THREE.Mesh>(null)
  const minimapTargetXRef = useRef<number | null>(null)

  const viewportRectGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
    return geo
  }, [])

  useEffect(() => {
    if (viewportRectRef.current) viewportRectRef.current.layers.set(1)
    if (minimapCursorRef.current)  minimapCursorRef.current.layers.set(1)
  }, [])

  // Minimap drag — intercept pointer events in the bottom MINIMAP_PX strip
  useEffect(() => {
    const canvas = gl.domElement
    let dragging = false

    function isInMinimap(e: PointerEvent): boolean {
      const rect = canvas.getBoundingClientRect()
      return (e.clientY - rect.top) > (rect.height - MINIMAP_PX)
    }

    function pointerToWorldX(e: PointerEvent): number {
      const rect      = canvas.getBoundingClientRect()
      const frac      = (e.clientX - rect.left) / rect.width
      const worldLeft  = minimapCam.position.x + minimapCam.left
      const worldRight = minimapCam.position.x + minimapCam.right
      return worldLeft + frac * (worldRight - worldLeft)
    }

    function onPointerDown(e: PointerEvent) {
      if (!isInMinimap(e)) return
      e.stopPropagation()
      dragging = true
      minimapTargetXRef.current = pointerToWorldX(e)
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }
    function onPointerMove(e: PointerEvent) {
      if (dragging) {
        e.stopPropagation()
        minimapTargetXRef.current = pointerToWorldX(e)
        canvas.style.cursor = 'grabbing'
      } else if (isInMinimap(e)) {
        canvas.style.cursor = 'pointer'
      }
    }
    function onPointerUp(e: PointerEvent) {
      if (!dragging) return
      dragging = false
      e.stopPropagation()
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
      canvas.style.cursor = isInMinimap(e) ? 'pointer' : 'default'
    }
    function onPointerLeave() {
      if (!dragging) canvas.style.cursor = 'default'
    }
    function onDblClick(e: MouseEvent) {
      if (!isInMinimap(e as any)) return
      e.stopPropagation()
      const worldX = pointerToWorldX(e as any)
      const beat = worldX / BEAT_W
      setPlaybackBeat(Math.max(0, beat))
    }

    canvas.addEventListener('pointerdown',  onPointerDown,  { capture: true })
    canvas.addEventListener('pointermove',  onPointerMove,  { capture: true })
    canvas.addEventListener('pointerup',    onPointerUp,    { capture: true })
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('dblclick',     onDblClick,     { capture: true })
    return () => {
      canvas.removeEventListener('pointerdown',  onPointerDown,  { capture: true })
      canvas.removeEventListener('pointermove',  onPointerMove,  { capture: true })
      canvas.removeEventListener('pointerup',    onPointerUp,    { capture: true })
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('dblclick',     onDblClick,     { capture: true })
    }
  }, [gl, minimapCam, setPlaybackBeat])

  // ── Playback Logic ──────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (isPlaying) {
      const beatsPerSecond = tempo / 60
      // Use the ref (updated every frame) not the Zustand subscription (throttled to ~10 FPS).
      // Bug found by Bryan: using stale playbackBeat caused beat to advance at 1/6 speed.
      let newBeat = playbackBeatRef.current + delta * beatsPerSecond
      
      // Highlighting logic: Find notes currently being played (including virtual sub-notes)
      const activeNotes: TablatureNote[] = []
      const activeHighlights: Array<{ si: number; fret: number }> = []
      notes.forEach(n => {
        const subNotes = RhythmModifierService.getVirtualRhythm(n)
        const vFret = ModeZoneService.getVirtualFret(n, totalMeasures) ?? n.fret
        if (subNotes) {
          const activeSub = subNotes.find(sn => newBeat >= sn.startBeat && newBeat < sn.startBeat + sn.duration)
          if (activeSub) {
            activeNotes.push(n)
            activeHighlights.push({ si: n.string, fret: vFret })
          }
        } else {
          if (newBeat >= n.startBeat && newBeat < n.startBeat + n.duration) {
            activeNotes.push(n)
            activeHighlights.push({ si: n.string, fret: vFret })
          }
        }
      })
      const activeIds = activeNotes.map(n => n.id).sort().join(',')
      if (activeIds !== lastActiveIdsRef.current) {
        lastActiveIdsRef.current = activeIds
        FretboardHighlightService.setHighlights(activeHighlights)
        const legatoNote = activeNotes.find(n => n.legatoNext || n.legatoPrev || n.legatoRatio)
        if (legatoNote) {
          LegatoFretVisualizationService.show(legatoNote.id, notes)
        } else {
          LegatoFretVisualizationService.clear()
        }
      }

      // Auto-reset / Loop check — include virtual rhythm sub-note ends (extended mode)
      const rawMaxBeat = notes.length > 0
        ? Math.max(...notes.flatMap(n => {
            const virtual = RhythmModifierService.getVirtualRhythm(n)
            if (virtual && virtual.length > 0) return virtual.map(sn => sn.startBeat + sn.duration)
            return [n.startBeat + n.duration]
          }))
        : 0
      const maxBeat = Math.ceil(rawMaxBeat / BEATS_PER_MEAS) * BEATS_PER_MEAS

      if (notes.length > 0 && newBeat >= maxBeat) {
        if (isLooping) {
          newBeat = 0
          lastBeatRef.current = 0
        } else {
          newBeat = 0 // Auto-reset to start when reaching the end
          togglePlayback()
          stopAllSounds()
        }
      }

      // Sound triggering
      const start = lastBeatRef.current
      const end = newBeat
      
      if (end >= start) {
        const toPlay: Array<{ note: TablatureNote, startBeat: number, duration: number }> = []

        notes.forEach(n => {
          const subNotes = RhythmModifierService.getVirtualRhythm(n)
          if (subNotes) {
            subNotes.forEach(sn => {
              if (sn.startBeat >= start && sn.startBeat < end) {
                toPlay.push({ note: n, startBeat: sn.startBeat, duration: sn.duration })
              }
            })
          } else {
            if (n.startBeat >= start && n.startBeat < end) {
              toPlay.push({ note: n, startBeat: n.startBeat, duration: n.duration })
            }
          }
        })

        if (toPlay.length > 0) {
          const groups = new Map<number, typeof toPlay>()
          toPlay.forEach(item => {
            const list = groups.get(item.startBeat) || []
            list.push(item)
            groups.set(item.startBeat, list)
          })

          groups.forEach((items) => {
            const pitches = items.map(it => {
              const openNote = tuningArr[it.note.string] ?? 'E2'
              const fret = ModeZoneService.getVirtualFret(it.note, totalMeasures) ?? it.note.fret
              return getNoteName(openNote, fret)
            })
            const durations = items.map(it => Math.max(0.1, it.duration * (60 / tempo)))
            if (pitches.length > 1) {
              playFullChord(pitches, durations)
            } else {
              playNote(pitches[0], durations[0])
            }
          })
        }
      }

      lastBeatRef.current = newBeat
      playbackBeatRef.current = newBeat
      // Cursor: update imperatively every frame (smooth 60 FPS movement, no React re-render)
      if (playbackCursorGroupRef.current) {
        playbackCursorGroupRef.current.position.x = newBeat * BEAT_W
      }
      // Zustand: update every frame for isActive gating (note color) and external consumers.
      // The heavy rendering cost (re-render) is acceptable because grayTarget easing is done in
      // PodGradientMaterial's own useFrame — the main scene doesn't do expensive work per-update.
      // The true win of playbackBeatRef is that the cursor is now driven imperatively, not via JSX.
      setPlaybackBeat(newBeat)
    } else {
      lastBeatRef.current = playbackBeatRef.current
      if (lastActiveIdsRef.current !== '') {
        lastActiveIdsRef.current = ''
        FretboardHighlightService.clearHighlights()
        LegatoFretVisualizationService.clear()
      }
    }
  })

  // ── Multi-camera render (priority=1 → R3F skips its own auto-render) ─────────
  useFrame(({ gl, scene, size }) => {
    const o = camera as THREE.OrthographicCamera

    // Update minimap camera frustum to show all used content
    const usedBeats  = notes.length > 0 ? Math.max(...notes.map(n => n.startBeat + n.duration)) : 0
    const usedMeas   = Math.ceil(usedBeats / BEATS_PER_MEAS)
    const viewRight  = (o.position.x - LEFT_MARGIN_W + halfWRef.current) / MEASURE_W
    const dispMeas   = Math.max(usedMeas + 8, viewRight + 4, 20)
    const totalWorldW = dispMeas * MEASURE_W

    minimapCam.position.x = totalWorldW / 2
    minimapCam.left   = -totalWorldW / 2
    minimapCam.right  = +totalWorldW / 2
    minimapCam.top    = CAM_HALF_H_TOP
    minimapCam.bottom = -CAM_HALF_H_BOT
    minimapCam.updateProjectionMatrix()

    // Update viewport rect geometry (layer 1 — only visible to minimapCam)
    if (viewportRectRef.current) {
      const pos = viewportRectRef.current.geometry.attributes.position as THREE.BufferAttribute
      const vl = o.position.x - LEFT_MARGIN_W - halfWRef.current
      const vr = o.position.x - LEFT_MARGIN_W + halfWRef.current
      pos.setXYZ(0, vl, CAM_HALF_H_TOP,    0.5)
      pos.setXYZ(1, vr, CAM_HALF_H_TOP,    0.5)
      pos.setXYZ(2, vr, -CAM_HALF_H_BOT,   0.5)
      pos.setXYZ(3, vl, -CAM_HALF_H_BOT,   0.5)
      pos.needsUpdate = true
    }

    // Apply minimap drag: move main camera to clicked world X
    if (minimapTargetXRef.current !== null) {
      const targetX = minimapTargetXRef.current
      minimapTargetXRef.current = null
      const halfW = halfWRef.current
      const maxX  = totalMeasRef.current * MEASURE_W + halfW
      o.position.x = Math.max(halfW, Math.min(maxX, targetX))
      o.updateProjectionMatrix()
      setScrollX(o.position.x)
      if (isFollowing) setFollowing(false)
    } else if (isFollowing) {
      const halfW = halfWRef.current
      const cursorX = playbackBeatRef.current * BEAT_W
      
      // usedBeats for the end of the song
      const usedBeats = notes.length > 0 ? Math.max(...notes.map(n => n.startBeat + n.duration)) : 0
      const usedMeas = Math.ceil(usedBeats / BEATS_PER_MEAS)
      const lastMeasStart = Math.max(0, (usedMeas - 1) * MEASURE_W)
      
      // Only follow if not in the last measure
      if (cursorX < lastMeasStart) {
        let targetX = cursorX - (MEASURE_W / 2) + halfW
        const maxX = usedMeas * MEASURE_W - halfW
        o.position.x = Math.max(halfW, Math.min(maxX, targetX))
        o.updateProjectionMatrix()
        setScrollX(o.position.x)
      }
    }

    // Update minimap cursor position to track playback beat
    if (minimapCursorRef.current) {
      minimapCursorRef.current.position.x = useTablatureR3FStore.getState().playbackBeat * BEAT_W
    }

    gl.autoClear = false

    // 1. Main camera — full canvas (viewport unchanged → <Html> elements stay correctly positioned)
    gl.setScissorTest(false)
    gl.clearColor()
    gl.clearDepth()
    gl.render(scene, o)

    // 2. Minimap camera — overwrites bottom strip
    gl.setScissorTest(true)
    gl.setViewport(0, 0, size.width, MINIMAP_PX)
    gl.setScissor(0, 0, size.width, MINIMAP_PX)
    gl.clearColor()
    gl.clearDepth()
    gl.render(scene, minimapCam)

    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
    gl.autoClear = true
  }, 1)

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

  // ── Measures / scroll / zoom ──────────────────────────────────────────────────
  const [totalMeasures, setTotalMeasures] = useState(INITIAL_MEASURES)
  const totalMeasRef   = useRef(INITIAL_MEASURES)
  const [scrollX, setScrollX] = useState(0)
  const halfWRef       = useRef(50)
  const visibleMeasRef = useRef(0)          // 0 = uninitialised; set from aspect on first mount

  const ZOOM_MIN = 1
  const ZOOM_MAX = 10

  const beatGeo = useMemo(() => buildBeatGeo(totalMeasures), [totalMeasures])
  const measGeo = useMemo(() => buildMeasGeo(totalMeasures), [totalMeasures])

  // Shared helper: apply halfW to camera and sync state
  function applyCameraW(o: THREE.OrthographicCamera, halfW: number) {
    halfWRef.current  = halfW
    // Asymmetric frustum: left side includes margin, right side is reduced by same amount to keep total width = 2*halfW
    o.left = -halfW - LEFT_MARGIN_W; o.right = halfW - LEFT_MARGIN_W
    const maxX = totalMeasRef.current * MEASURE_W + halfW
    o.position.x = Math.max(halfW, Math.min(maxX, o.position.x))
    o.updateProjectionMatrix()
    setScrollX(o.position.x)
  }

  useEffect(() => {
    const o = camera as THREE.OrthographicCamera
    const aspect = size.width / size.height
    const camH   = CAM_HALF_H_TOP + CAM_HALF_H_BOT

    // Initial horizontal zoom if not set
    if (visibleMeasRef.current === 0) {
      const autoHalfW = (camH * aspect) / 2
      visibleMeasRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (autoHalfW * 2) / MEASURE_W))
    }
    
    const halfW = (visibleMeasRef.current * MEASURE_W) / 2
    
    // Asymmetric frustum: extra space at bottom for info lane, extra space at left for margin
    o.top    = CAM_HALF_H_TOP
    o.bottom = -CAM_HALF_H_BOT
    o.left   = -halfW - LEFT_MARGIN_W
    o.right  = +halfW - LEFT_MARGIN_W
    o.zoom   = 1
    
    // Vertical center to align world y=0 correctly
    o.position.y = 0
    if (!o.position.x || o.position.x < halfW) o.position.x = halfW
    o.position.z = 10
    
    o.updateProjectionMatrix()
    setScrollX(o.position.x)
    halfWRef.current = halfW

    // Screen % from top: (camTop - worldY) / totalCamH
    const pcts = Array.from({ length: N_STRINGS }, (_, si) => {
      const wy = stringY(si); return (o.top - wy) / camH * 100
    })
    onStringYPcts(pcts)
  }, [camera, size, onStringYPcts, tuningArr])

  useEffect(() => {
    const canvas = gl.domElement
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const o = camera as THREE.OrthographicCamera
      const state = useTablatureR3FStore.getState()

      if (e.ctrlKey || e.metaKey) {
        // ── Zoom toward cursor ──────────────────────────────────────────────
        const norm     = e.deltaMode === 0 ? e.deltaY / 100 : e.deltaY
        const oldHalfW = halfWRef.current
        visibleMeasRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, visibleMeasRef.current + norm * 0.5))
        const newHalfW = (visibleMeasRef.current * MEASURE_W) / 2
        // NDC x of mouse: -1 (left edge) … +1 (right edge)
        const rect = canvas.getBoundingClientRect()
        const ndx  = ((e.clientX - rect.left) / rect.width) * 2 - 1
        // Shift camera so the world point under the cursor stays fixed
        o.position.x += ndx * (oldHalfW - newHalfW)
        applyCameraW(o, newHalfW)
        if (state.isFollowing) state.setFollowing(false)
      } else {
        // ── Scroll ──────────────────────────────────────────────────────────
        const dX   = e.deltaX !== 0 ? e.deltaX : e.deltaY
        const halfW = halfWRef.current
        const maxX  = totalMeasRef.current * MEASURE_W + halfW
        o.position.x = Math.max(halfW, Math.min(maxX, o.position.x + dX * SCROLL_SPEED))
        o.updateProjectionMatrix()
        setScrollX(o.position.x)
        const prog = (o.position.x - halfW) / (totalMeasRef.current * MEASURE_W)
        if (prog >= TRIGGER_FRAC) {
          const next = Math.ceil(totalMeasRef.current * (1 + EXTEND_FRAC))
          if (next > totalMeasRef.current) { totalMeasRef.current = next; setTotalMeasures(next) }
        }
        if (state.isFollowing) state.setFollowing(false)
      }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [camera, gl])

  // ── Progression drag-and-drop ─────────────────────────────────────────────────
  // dragHoverSi / setDragHoverSi come from useEditorHover above

  useEffect(() => {
    const canvas = gl.domElement

    function onDragOver(e: DragEvent) {
      if (!Array.from(e.dataTransfer?.types ?? []).includes('application/json')) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      const rect = canvas.getBoundingClientRect()
      const ndy  = 1 - ((e.clientY - rect.top) / rect.height) * 2
      const oc   = camera as THREE.OrthographicCamera
      const worldY = oc.position.y + (oc.top + oc.bottom) / 2 + ndy * (oc.top - oc.bottom) / 2
      setDragHoverSi(siFromWorldY(worldY))
    }
    function onDragLeave() { setDragHoverSi(null) }
    function onDrop(e: DragEvent) {
      setDragHoverSi(null)
      const data = e.dataTransfer?.getData('application/json')
      if (!data) return
      e.preventDefault()
      let payload: any
      try { payload = JSON.parse(data) } catch { return }

      const o    = camera as THREE.OrthographicCamera
      const rect = canvas.getBoundingClientRect()
      const ndx  = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndy  = 1 - ((e.clientY - rect.top)  / rect.height) * 2
      const worldX = (o.position.x - LEFT_MARGIN_W) + ndx * halfWRef.current
      const worldY = o.position.y + (o.top + o.bottom) / 2 + ndy * (o.top - o.bottom) / 2
      const si     = siFromWorldY(worldY)
      const beat   = Math.max(0, snapBeat(worldX / BEAT_W))

      if (payload.kind === 'mode') {
        // Mode pods aren't anchored to a string — just a beat position
        useTablatureR3FStore.getState().pushHistory()
        useTablatureR3FStore.getState().addModeZone(beat, payload.modeName)
      } else if (payload.kind === 'rhythm') {
        // Find the note under the drop
        const noteUnder = useTablatureR3FStore.getState().notes.find(n =>
          n.string === si &&
          beat >= n.startBeat &&
          beat < (n.startBeat + n.duration)
        )
        if (noteUnder) {
          TablatureDropService.handleRhythmDrop(payload.pattern, noteUnder.id, payload.trackIndex)
        }
      } else {
        TablatureDropService.handleDrop(payload, si, beat, scaleNotes)
      }
    }

    canvas.addEventListener('dragover',  onDragOver)
    canvas.addEventListener('dragleave', onDragLeave)
    canvas.addEventListener('drop',      onDrop)
    return () => {
      canvas.removeEventListener('dragover',  onDragOver)
      canvas.removeEventListener('dragleave', onDragLeave)
      canvas.removeEventListener('drop',      onDrop)
    }
  }, [camera, gl, userScale])

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

  const drag = useRef<DragNote | DragRect | DragChordGroup | DragProgGroup | DragNewProg | DragPlayback | DragModeZone | null>(null)
  const [newProgDrag, setNewProgDrag] = useState<{ startBeat: number; endBeat: number } | null>(null)

  // ── Hover state (P2-2: extracted to useEditorHover) ─────────────────────────
  const {
    hoveredGroupId, setHoveredGroupId,
    labelHoveredGroupId, setLabelHoveredGroupId,
    hoveredProgId, setHoveredProgId,
    hoveredModId, setHoveredModId,
    hoveredModeZoneId, setHoveredModeZoneId,
    dragHoverSi, setDragHoverSi,
  } = useEditorHover(chordGroups)

  // lanePend: tracks a lane mousedown that hasn't moved yet (click → dblclick-create; drag → rect-select)
  const lanePend = useRef<{ si: number; beat: number; startCX: number; startCY: number; startWX: number; startWY: number } | null>(null)

  // ── DOM pointer handlers ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement
    const state = useTablatureR3FStore.getState()
    const { addNote, updateNote, deleteNote, setLegato, pushHistory } = state

    function wx(cx: number) {
      const rect = canvas.getBoundingClientRect()
      const ndc = ((cx - rect.left) / rect.width) * 2 - 1
      const o   = camera as THREE.OrthographicCamera
      // Use (o.position.x - LEFT_MARGIN_W) as the center of the frustum in world space
      return (o.position.x - LEFT_MARGIN_W) + ndc * (o.right - o.left) / 2
    }
    function wy(cy: number) {
      const rect = canvas.getBoundingClientRect()
      const ndc = -((cy - rect.top) / rect.height) * 2 + 1
      const o   = camera as THREE.OrthographicCamera
      return o.position.y + (o.top + o.bottom) / 2 + ndc * (o.top - o.bottom) / 2
    }

    function onMove(e: PointerEvent) {
      const d = drag.current

      if (d?.kind === 'playback-beat') {
        const beat = wx(e.clientX) / BEAT_W
        setPlaybackBeat(Math.max(0, Math.min(totalMeasures * BEATS_PER_MEAS, beat)))
      } else if (d?.kind === 'note') {
        TablatureMoveService.handleNoteMove(d, e.clientX, e.clientY, wx, wy, siFromWorldY, tuningArr, scaleNotes)
      } else if (d?.kind === 'chord-group') {
        TablatureMoveService.handleChordGroupMove(d, e.clientX, wx, tuningArr, scaleNotes)
      } else if (d?.kind === 'prog-group') {
        TablatureMoveService.handleProgGroupMove(d, e.clientX, wx, tuningArr, scaleNotes)
      } else if (d?.kind === 'mode-zone') {
        const dBeat = snapBeat((wx(e.clientX) - d.startX) / BEAT_W)
        if (d.type === 'resize-right') {
          const newLength = Math.max(MODE_ZONE_MIN_LENGTH, d.origLength + dBeat / BEATS_PER_MEAS)
          useTablatureR3FStore.getState().updateModeZone(d.zoneId, { length: newLength })
        } else {
          useTablatureR3FStore.getState().updateModeZone(d.zoneId, { startBeat: Math.max(0, d.origStartBeat + dBeat) })
        }
      } else if (d?.kind === 'new-prog') {
        const endBeat = wx(e.clientX) / BEAT_W
        ;(drag.current as DragNewProg).endBeat = endBeat
        setNewProgDrag({ startBeat: d.startBeat, endBeat })
      } else if (d?.kind === 'rect') {
        const upd = { ...d, x1: wx(e.clientX), y1: wy(e.clientY) }
        drag.current = upd
        setRectBox(upd)
      } else if (lanePend.current) {
        const p  = lanePend.current
        const dx = e.clientX - p.startCX
        const dy = e.clientY - p.startCY
        if (Math.sqrt(dx * dx + dy * dy) > RECT_DRAG_PX) {
          const r: DragRect = { kind: 'rect', x0: p.startWX, y0: p.startWY, x1: wx(e.clientX), y1: wy(e.clientY) }
          drag.current = r
          lanePend.current = null
          setRectBox(r)
          canvas.style.cursor = 'crosshair'
        }
      }
    }

    function onUp() {
      const d = drag.current

      if (d?.kind === 'chord-group' && !d.didMove) {
        // click (no move) → select all notes in the chord group
        setSelectedIds(new Set(d.origNotes.map(n => n.id)))
      } else if (d?.kind === 'rect') {
        const hits = useTablatureR3FStore.getState().notes
          .filter(n => noteInRect(n, d.x0, d.y0, d.x1, d.y1))
          .map(n => n.id)
        setSelectedIds(new Set(hits))
        setRectBox(null)
      } else if (d?.kind === 'new-prog') {
        setNewProgDrag(null)
        const beatMin = Math.min(d.startBeat, d.endBeat)
        const beatMax = Math.max(d.startBeat, d.endBeat)
        if (beatMax - beatMin > 0.1) {
          const state = useTablatureR3FStore.getState()
          const matching = state.chordGroups.filter(g => {
            const gNotes = state.notes.filter(n => g.noteIds.includes(n.id))
            if (!gNotes.length) return false
            const gMin = Math.min(...gNotes.map(n => n.startBeat))
            const gMax = Math.max(...gNotes.map(n => n.startBeat + n.duration))
            return gMin < beatMax && gMax > beatMin
          })
          if (matching.length > 0) {
            pushHistory()
            state.addProgressionGroup(matching.map(g => g.id), 'Progression')
          }
        } else if (d.fromGroupId) {
          const gId = d.fromGroupId
          setSelectedChordGroupIds(prev => {
            if (d.ctrlKey) {
              const s = new Set(prev)
              s.has(gId) ? s.delete(gId) : s.add(gId)
              return s
            }
            return new Set([gId])
          })
        }
      }
      // lanePend click-only → create note handled in onDblClickLane (R3F)

      drag.current = null
      lanePend.current = null
      canvas.style.cursor = 'default'
    }

    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup',   onUp)
    return () => { canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp) }
  }, [camera, gl, updateNote, totalMeasures, setPlaybackBeat, pushHistory, addProgressionGroup, deleteNote, undo, redo, tuningArr, scaleNotes, notes, chordGroups, progressionGroups])

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editingId) return
      const ids  = selectedIdsRef.current
      const ctrl = e.ctrlKey || e.metaKey

      if (e.key === 'Escape') {
        if (legatoSourceId) { setLegatoSourceId(null); e.preventDefault(); return }
        if (selectedIds.size > 0) { setSelectedIds(new Set()); e.preventDefault(); return }
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
        setSelectedIds(new Set(useTablatureR3FStore.getState().notes.map(n => n.id)))
      }
      if (ctrl && e.key === 'c') {
        const sel = useTablatureR3FStore.getState().notes.filter(n => ids.has(n.id))
        if (!sel.length) return
        e.preventDefault()
        const minBeat  = Math.min(...sel.map(n => n.startBeat))
        const clipNotes: ClipNote[] = sel.map(n => ({ string: n.string, fret: n.fret, duration: n.duration, startBeat: n.startBeat - minBeat }))
        const selIds   = new Set(sel.map(n => n.id))
        const clipGroups: ClipGroup[] = useTablatureR3FStore.getState().chordGroups
          .filter(g => g.noteIds.every(id => selIds.has(id)))
          .map(g => ({ chordName: g.chordName, noteIndices: g.noteIds.map(id => sel.findIndex(n => n.id === id)) }))
        clipboard.current = { notes: clipNotes, groups: clipGroups }
      }
      if (ctrl && e.key === 'v') {
        if (!clipboard.current.notes.length) return
        e.preventDefault()
        pushHistory()
        const all     = useTablatureR3FStore.getState().notes
        const pasteAt = all.length > 0 ? Math.max(...all.map(n => n.startBeat + n.duration)) : 0
        const newIds: string[] = clipboard.current.notes.map(cn => addNote({ ...cn, startBeat: pasteAt + cn.startBeat }))
        for (const cg of clipboard.current.groups) {
          const groupNoteIds = cg.noteIndices.map(i => newIds[i]).filter(Boolean)
          if (groupNoteIds.length) addChordGroup(groupNoteIds, cg.chordName)
        }
        setSelectedIds(new Set(newIds))
      }

      // Ctrl+G: create progression from selected chord groups → open inline name editor
      if (ctrl && e.key === 'g' && !e.shiftKey && selectedChordGroupIdsRef.current.size > 0) {
        e.preventDefault()
        pushHistory()
        useTablatureR3FStore.getState().addProgressionGroup([...selectedChordGroupIdsRef.current], 'Progression')
        setSelectedChordGroupIds(new Set())
        return
      }

      // Ctrl+B: duplicate to the right, pushing collisions
      if (ctrl && e.key === 'b') {
        const sel = useTablatureR3FStore.getState().notes.filter(n => ids.has(n.id))
        if (!sel.length) return
        e.preventDefault()
        pushHistory()
        const sorted = [...sel].sort((a, b) => b.startBeat - a.startBeat)
        const newIds: string[] = []
        for (const n of sorted) {
          const copyBeat = n.startBeat + n.duration
          const toPush   = useTablatureR3FStore.getState().notes.filter(
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
  }, [editingId, deleteNote, addNote, pushHistory, undo, redo, tuningArr, scaleNotes, legatoSourceId])

  // ── Edit helpers ──────────────────────────────────────────────────────────────
  function confirmEdit(id: string, val: string) {
    const isNew = newNoteIds.current.has(id)
    newNoteIds.current.delete(id)
    if (val !== '') {
      let fret: number | null = null
      if (/^[A-Ga-g][#b]?(\d?)$/.test(val)) {
        const note = notes.find(n => n.id === id)
        if (note) {
          const openNote = tuningArr[note.string]
          const hasOctave = /\d$/.test(val)
          if (hasOctave) {
            fret = findFretForNote(openNote, val)
          } else {
            const pc = Note.pitchClass(val)
            if (pc) fret = findFretForPc(openNote, pc)
          }
        }
      } else {
        const n = parseInt(val, 10)
        if (!isNaN(n) && n >= 0 && n <= 24) fret = n
      }
      if (fret !== null && fret >= 0 && fret <= 24) { pushHistory(); updateNote(id, { fret }, tuningArr, scaleNotes) }
      else if (isNew) { pushHistory(); deleteNote(id, tuningArr) }
    } else if (isNew) { pushHistory(); deleteNote(id, tuningArr) }
    setEditingId(null); setInputVal('')
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
  const getNoteColor = React.useCallback((note: TablatureNote, skipDarken = false, fretOverride?: number): string => {
    let hex = OFF_COL
    if (legatoSourceId) {
      if (legatoSourceId === note.id) hex = LEGATO_COL
      else hex = OFF_COL
    } else if (note.id === editingId) {
      hex = PEND_COL
    } else {
      // No more app-wide "current mode" (legacy, removed) — a note's color comes purely from
      // whichever Mode Zone covers its own position on the tablature, if any. Outside every
      // zone, there's no scale to compare against (off-scale/neutral).
      const open = tuningArr[note.string]
      // Zone scale takes priority; fall back to the global scaleNotes when no zone covers this
      // beat — ensures notes remain colored even without any Mode Zone placed (UX: the global
      // mode selector in the sidebar still drives default coloring).
      const zoneScale = ModeZoneService.getScaleForBeat(note.startBeat, totalMeasures)
      const activeScale = zoneScale ?? scaleNotes
      const deg = open ? getNoteDegree(getNoteName(open, fretOverride ?? note.fret), activeScale) : null
      hex = deg ? SCALE_COLORS[deg - 1] : OFF_COL
    }

    // Generated (intermediate) notes are 50% darker and 30% desaturated
    if (!skipDarken && intermediateIds.has(note.id) && hex !== LEGATO_COL && hex !== PEND_COL) {
      const c = new THREE.Color(hex)
      const hsl = { h: 0, s: 0, l: 0 }
      c.getHSL(hsl)
      c.setHSL(hsl.h, hsl.s * 0.7, hsl.l * 0.5)
      return '#' + c.getHexString()
    }

    return hex
  }, [legatoSourceId, editingId, tuningArr, intermediateIds, modeZones, totalMeasures, scaleNotes])

  // ── Geometry caches ───────────────────────────────────────────────────────────
  // Pod anatomy: the note disc's diameter is capped at the string's lane height (never
  // overflows into a neighboring string), and the body rectangle height matches it 1:1.
  const PODH        = LANE_H                  // disc diameter (world units)
  const PODBODY_H   = PODH                    // note body rectangle height = disc diameter
  const NOTE_R_MAX  = PODBODY_H * 0.35        // max corner radius (capped by half-width below)
  const SEL_PAD     = 0.10                    // selection border thickness in world units
  const geoCache    = useRef(new Map<string, THREE.ShapeGeometry>())
  const borderCache = useRef(new Map<string, THREE.ShapeGeometry>())

  const invXKey = invStretchX.toFixed(2)
  useEffect(() => {
    geoCache.current.forEach(g => g.dispose()); geoCache.current.clear()
    borderCache.current.forEach(g => g.dispose()); borderCache.current.clear()
    chordPodCache.current.forEach(g => g.dispose()); chordPodCache.current.clear()
  }, [invXKey])

  useEffect(() => () => {
    geoCache.current.forEach(g => g.dispose())
    borderCache.current.forEach(g => g.dispose())
  }, [])

  // r = min(half-width, NOTE_R_MAX) → same visual ratio on all note widths
  function noteR(w: number) { return Math.min(w / 2, NOTE_R_MAX) }

  function getNoteGeo(w: number) {
    const key = `${w.toFixed(2)}`
    let g = geoCache.current.get(key)
    if (!g) {
      const ry = noteR(w)
      const rx = Math.min(w / 2, ry * invStretchX)
      g = new THREE.ShapeGeometry(leftCircleRect(w, PODBODY_H, rx, ry, invStretchX), 4)
      geoCache.current.set(key, g)
    }
    return g
  }
  function getBorderGeo(w: number) {
    const key = `${w.toFixed(2)}`
    let g = borderCache.current.get(key)
    if (!g) {
      const bw = w + SEL_PAD * 2
      const bh = PODBODY_H + SEL_PAD * 2
      const ry = Math.min(bh / 2, NOTE_R_MAX + SEL_PAD)
      const rx = Math.min(bw / 2, ry * invStretchX)
      g = new THREE.ShapeGeometry(leftCircleRect(bw, bh, rx, ry, invStretchX), 4)
      borderCache.current.set(key, g)
    }
    return g
  }

  // ── Chord pod geometry cache ──────────────────────────────────────────────────
  const chordPodCache = useRef(new Map<string, THREE.ShapeGeometry>())
  const bubbleGeo     = useMemo(() => new THREE.CircleGeometry(0.12, 16), [])
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
    const showBubble = !hasVirtual && !intermediateIds.has(note.id) && (w * pxPerWUX) >= 35
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

  // ── Visible measure range ─────────────────────────────────────────────────────
  const halfW     = halfWRef.current
  const leftMeas  = Math.max(0, Math.floor((scrollX - LEFT_MARGIN_W - halfW) / MEASURE_W) - 1)
  const rightMeas = Math.min(totalMeasures - 1, Math.ceil((scrollX - LEFT_MARGIN_W + halfW) / MEASURE_W) + 1)
  const measLabelY = gridTop + 0.20

  return (
    <group onPointerDown={() => { if (legatoSourceId) setLegatoSourceId(null) }}>
      {/* Lane backgrounds + drag-hover highlight */}
      {Array.from({ length: N_STRINGS }, (_, si) => (
        <group key={si}>
          <mesh position={[0, stringY(si), -0.04]} geometry={laneBgGeo} material={laneBgMat}
            onPointerDown={e => onLanePointerDown(e, si)}
            onDoubleClick={e => onLaneDblClick(e, si)} />
          {dragHoverSi === si && (
            <mesh position={[scrollX, stringY(si), -0.03]}>
              <planeGeometry args={[LARGE_W, LANE_H]} />
              <meshBasicMaterial color="#585858" transparent opacity={0.55} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}

      {/* Left Margin */}
      <mesh position={[-LEFT_MARGIN_W / 2, marginY, -0.038]} geometry={marginGeo} material={marginMat} />

      {/* Mode Zone tint — extracted to ModeZoneTint (P2-1) */}
      <ModeZoneTint />

      {/* Grid lines */}
      <lineSegments position={[0, 0, -0.035]} geometry={beatGeo} material={matBeat} frustumCulled={false} />
      <lineSegments position={[0, 0, -0.035]} geometry={measGeo} material={matMeas} frustumCulled={false} />

      {/* Measure labels */}
      {Array.from({ length: rightMeas - leftMeas + 1 }, (_, i) => {
        const m = leftMeas + i
        if (m < 0 || m >= totalMeasures) return null
        return (
          <Html key={m} position={[m * MEASURE_W + 0.08, measLabelY, 0.1]}
            style={{ pointerEvents: 'none' }} zIndexRange={[200, 200]}>
            <span className="tab-r3f-meas-label">{m + 1}</span>
          </Html>
        )
      })}

      {/* Info lane — drag on empty space to draw a progression range */}
      <mesh position={[0, infoLaneY, -0.04]} geometry={laneBgGeo} material={laneBgMat}
        onPointerDown={e => {
          if (e.button !== 0) return
          e.stopPropagation()
          if (legatoSourceId) setLegatoSourceId(null)
          const startBeat = e.point.x / BEAT_W
          drag.current = { kind: 'new-prog', startBeat, endBeat: startBeat }
          setNewProgDrag({ startBeat, endBeat: startBeat })
          gl.domElement.style.cursor = 'crosshair'
        }}
        onPointerEnter={() => { if (!drag.current) gl.domElement.style.cursor = 'crosshair' }}
        onPointerLeave={() => { if (!drag.current) gl.domElement.style.cursor = 'default' }}
      />

      {/* Drag preview — blue band in info lane while drawing progression range */}
      {newProgDrag && (() => {
        const beatMin = Math.min(newProgDrag.startBeat, newProgDrag.endBeat)
        const beatMax = Math.max(newProgDrag.startBeat, newProgDrag.endBeat)
        const w  = (beatMax - beatMin) * BEAT_W
        const cx = (beatMin + beatMax) / 2 * BEAT_W
        return (
          <mesh position={[cx, infoLaneY, -0.038]}>
            <planeGeometry args={[Math.max(w, 0.01), INFO_LANE_H]} />
            <meshBasicMaterial color={PROG_BORDER_COL} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        )
      })()}

      {/* Progression pods — header bar above contained chord pods */}
      {progressionGroups.map(prog => {
        const b = getProgBounds(prog)
        if (!b) return null
        const headerW  = (b.beatMax - b.beatMin) * BEAT_W + CHORD_PAD_H * 2 + PROG_PAD_H * 2
        const headerX  = (b.beatMin + b.beatMax) / 2 * BEAT_W
        const headerCY = stringY(b.siMax) + POD_HEADER_OFF
        const podLeft  = b.beatMin * BEAT_W - CHORD_PAD_H - PROG_PAD_H
        const podRight = podLeft + headerW
        const isHov   = hoveredProgId === prog.id
        const bCol    = isHov ? PROG_BORDER_HOVER_COL : PROG_BORDER_COL
        const fillCol = isHov ? PROG_FILL_HOV : '#252535'
        // Sticky disc: clamp to camera left while pod is on screen
        const progDiscWU = 26.4 / pxPerWUX  // 22px disc × 1.2
        const stickyX   = Math.max(podLeft, Math.min(podRight - progDiscWU, camL + 0.06 * invStretchX))
        const stickyRelX = stickyX - headerX
        return (
          <group key={prog.id} position={[headerX, headerCY, 0.003]}>
            {/* Header fill — solid color, no outline */}
            <mesh geometry={getChordPodGeo(headerW, HEADER_H)} renderOrder={3}>
              <meshBasicMaterial color={bCol} />
            </mesh>
            {/* Hit area */}
            <mesh position={[0, 0, 0.009]}
              onPointerDown={e => onProgPodDown(e, prog, headerW)}
              onPointerEnter={() => {
                setHoveredProgId(prog.id)
                if (!drag.current) {
                  gl.domElement.style.cursor = 'grab'
                  const progNotes = prog.chordGroupIds.flatMap(cgId => {
                    const cg = chordGroups.find(g => g.id === cgId)
                    return cg ? notes.filter(n => cg.noteIds.includes(n.id)) : []
                  })
                  FretboardHighlightService.setHighlights(progNotes.map(n => ({ si: n.string, fret: n.fret })))
                }
              }}
              onPointerLeave={() => {
                setHoveredProgId(null)
                if (!drag.current) {
                  gl.domElement.style.cursor = 'default'
                  FretboardHighlightService.clearHighlights()
                }
              }}
              onPointerMove={e => {
                if (drag.current) return
                const lx = e.point.x - podLeft
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, headerW, invStretchX))
              }}
              onContextMenu={e => { e.stopPropagation(); pushHistory(); removeProgressionGroup(prog.id) }}
            >
              <planeGeometry args={[headerW, HEADER_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Sticky disc (template nav popover) — name shown as a tooltip on hover, double-click to rename */}
            <Html position={[stickyRelX, 0, 0.1]} style={{ pointerEvents: 'auto', transform: 'translateY(-50%)' }} zIndexRange={[80, 80]} onWheel={passWheel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} onPointerDown={e => e.stopPropagation()} onWheel={passWheel}>
                <PodModifierDisc
                  emojiStr=":musical_score:"
                  size={22}
                  discBg="#1a1a2a"
                  borderCol={PROG_BORDER_COL}
                  title={prog.name}
                  onDoubleClick={() => { setEditingId(prog.id); setEditingProgName(prog.name) }}
                  popoverContent={close => (
                    <PodModifierPopover
                      nav={PodModifierService.getProgressionTemplateNav(prog)}
                      emojiStr=":musical_score:"
                      onClose={close}
                      className="progression-popover"
                    />
                  )}
                />
                {editingProgId === prog.id && (
                  <input
                    className="tab-r3f-fret-input"
                    style={{ width: '90px', color: PROG_BORDER_COL, borderColor: PROG_BORDER_COL, background: 'rgba(0,0,0,0.85)' }}
                    value={editingProgName}
                    autoFocus
                    onChange={ev => setEditingProgName(ev.target.value)}
                    onKeyDown={ev => {
                      ev.stopPropagation()
                      if (ev.key === 'Enter' || ev.key === 'Escape') {
                        if (ev.key === 'Enter') updateProgressionGroup(prog.id, { name: editingProgName.trim() || 'Progression' })
                        setEditingProgId(null)
                      }
                    }}
                    onBlur={() => {
                      updateProgressionGroup(prog.id, { name: editingProgName.trim() || 'Progression' })
                      setEditingProgId(null)
                    }}
                  />
                )}
              </div>
            </Html>
          </group>
        )
      })}

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

      {/* Chord pods — header bar above contained notes */}
      {chordGroups.map(group => {
        const b = getGroupBounds(group)
        if (!b) return null
        const headerW  = (b.beatMax - b.beatMin) * BEAT_W + CHORD_PAD_H * 2
        const headerX  = (b.beatMin + b.beatMax) / 2 * BEAT_W
        const headerCY = stringY(b.siMax) + POD_HEADER_OFF
        const podLeft  = b.beatMin * BEAT_W - CHORD_PAD_H
        const podRight = podLeft + headerW
        const isLabelHover = labelHoveredGroupId === group.id
        const isSelForProg = selectedChordGroupIds.has(group.id)
        const borderCol    = isLabelHover ? CHORD_BORDER_HOVER_COL : isSelForProg ? '#7BA7E8' : CHORD_BORDER_COL
        // A rhythm modifier may impose a rhythm on this chord — its disc renders right after
        // the chord's own disc instead of as a separate floating pod (see RhythmModifierPod).
        const chordRhythmMod = rhythmModifiers.find(m => m.targetType === 'chord' && m.targetId === group.id && m.kind !== 'arpeggio')
        const arpeggioMod    = PodModifierService.getArpeggioForChord(group.id)
        // Sticky disc: stays visible at left edge while pod is in camera view
        const extraDiscWU = chordRhythmMod ? 26.4 / pxPerWUX : 0  // 22px disc × 1.2 + gap
        const discWU     = 30 / pxPerWUX + extraDiscWU  // 25px disc × 1.2
        const stickyX    = Math.max(podLeft, Math.min(podRight - discWU, camL + 0.06 * invStretchX))
        const stickyRelX = stickyX - headerX
        return (
          <group key={group.id} position={[headerX, headerCY, 0.001]}>
            {/* Header fill — solid color, no outline */}
            <mesh geometry={getChordPodGeo(headerW, HEADER_H)} renderOrder={5}>
              <meshBasicMaterial color={borderCol} />
            </mesh>
            {/* Hit area on header */}
            <mesh position={[0, 0, 0.01]}
              onPointerDown={e => onChordPodDown(e, group, podLeft, headerW)}
              onPointerEnter={() => {
                setHoveredGroupId(group.id)
                if (!drag.current) {
                  gl.domElement.style.cursor = 'grab'
                  const groupNotes = notes.filter(n => group.noteIds.includes(n.id))
                  FretboardHighlightService.setHighlights(groupNotes.map(n => ({ si: n.string, fret: n.fret })))
                }
              }}
              onPointerLeave={() => {
                setHoveredGroupId(null)
                if (!drag.current) {
                  gl.domElement.style.cursor = 'default'
                  FretboardHighlightService.clearHighlights()
                }
              }}
              onPointerMove={e => {
                if (drag.current) return
                const lx = e.point.x - podLeft
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, headerW, invStretchX))
              }}
              onContextMenu={e => {
                e.stopPropagation()
                pushHistory()
                group.noteIds.forEach(id => deleteNote(id, tuningArr))
              }}
            >
              <planeGeometry args={[headerW, HEADER_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Sticky emoji disc + chord name (+ rhythm disc when a rhythm modifier targets this chord) */}
            <Html position={[stickyRelX, 0, 0.05]} style={{ pointerEvents: 'auto', transform: 'translateY(-50%)' }} zIndexRange={[70, 70]} onWheel={passWheel}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                onMouseEnter={() => setLabelHoveredGroupId(group.id)}
                onMouseLeave={() => setLabelHoveredGroupId(null)}
                onPointerDown={e => e.stopPropagation()}
                onWheel={passWheel}
              >
                <PodModifierDisc
                  emojiStr={chordEmojiStr(group.chordName)}
                  size={25}
                  discBg="#1a1a1a"
                  borderCol={arpeggioMod ? '#f5a623' : CHORD_BORDER_COL}
                  glow={!!arpeggioMod}
                  title={group.chordName}
                  popoverContent={close => (
                    <PodModifierPopover
                      nav={PodModifierService.getChordTypeNav(group)}
                      emojiStr={chordEmojiStr(group.chordName)}
                      onClose={close}
                      className="chord-popover"
                    >
                      <ChordPopoverButtons group={group} />
                    </PodModifierPopover>
                  )}
                />
                {chordRhythmMod && (
                  <RhythmModifierDisc
                    mod={chordRhythmMod}
                    size={22}
                    onUpdate={patch => {
                      if (chordRhythmMod.legato) RhythmModifierService.rematerializeWithPatch(chordRhythmMod.id, patch)
                      else { pushHistory(); updateRhythmModifier(chordRhythmMod.id, patch) }
                    }}
                    onRemove={() => RhythmModifierService.restoreToNormal(chordRhythmMod.id)}
                  />
                )}
              </div>
            </Html>
            {/* Info lane hit area — drag-to-create-progression (no visual label) */}
            <mesh
              position={[0, infoLaneY - headerCY, 0.005]}
              onPointerDown={e => {
                if (e.button !== 0) return
                e.stopPropagation()
                const startBeat = e.point.x / BEAT_W
                drag.current = { kind: 'new-prog', startBeat, endBeat: startBeat, fromGroupId: group.id, ctrlKey: e.ctrlKey || e.metaKey }
                setNewProgDrag({ startBeat, endBeat: startBeat })
              }}
              onPointerEnter={() => {
                setLabelHoveredGroupId(group.id)
                if (!drag.current) {
                  gl.domElement.style.cursor = 'crosshair'
                  const groupNotes = notes.filter(n => group.noteIds.includes(n.id))
                  FretboardHighlightService.setHighlights(groupNotes.map(n => ({ si: n.string, fret: n.fret })))
                }
              }}
              onPointerLeave={() => {
                setLabelHoveredGroupId(null)
                if (!drag.current) {
                  gl.domElement.style.cursor = 'default'
                  FretboardHighlightService.clearHighlights()
                }
              }}
            >
              <planeGeometry args={[headerW, INFO_LANE_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}

      {/* Notes */}
      {notes.map(note => {
        const subNotes = RhythmModifierService.getVirtualRhythm(note)
        const items = subNotes || [{
          startBeat: note.startBeat,
          duration: note.duration,
          id: note.id
        }]

        const wOriginal = note.duration * BEAT_W
        const y = stringY(note.string)
        const isEditing = editingId === note.id
        const isSelected = selectedIds.has(note.id)
        const isLegatoSource = legatoSourceId === note.id
        const isIntermediate = intermediateIds.has(note.id)
        const sourceNote = isIntermediate ? notes.find(n => n.intermediateNoteIds?.includes(note.id)) : null

        // Per-string instrument assignment disc — only for notes whose chord has an
        // active rhythm modifier (not the locked-arpeggio kind, which has no instruments).
        // Independent of the sub-note pods: sticky-clamped within the note's full span
        // (not any single rhythm-step pod), so it never depends on a sub-pod being wide
        // enough to show its own disc — it stays visible regardless of zoom/subdivision width.
        //
        // One bubble per STRING, not per materialized note: when the rhythm is legato-
        // materialized (11.6.1/11.8.3), each string's chain produces many real notes (anchor +
        // intermediates + destination), all belonging to the same chord group — without this
        // guard every single one of them would render its own bubble. Only the chain's anchor
        // (no legatoPrev, not an intermediate) represents "this string"'s instrument assignment.
        const noteChordGroup = chordGroups.find(g => g.noteIds.includes(note.id))
        const noteChordRhythmMod = (noteChordGroup && !isIntermediate && !note.legatoPrev)
          ? rhythmModifiers.find(m => m.targetType === 'chord' && m.targetId === noteChordGroup.id && m.kind !== 'arpeggio')
          : undefined
        const instrBubblePx     = 22  // same size as the rhythm modifier disc embedded in the Chord pod
        const instrBubbleRadius = (instrBubblePx * 1.2 / 2) / pxPerWUX
        const instrGapWU = 5 / pxPerWUX  // 5px gap kept between the bubble and the note pod it follows
        const instrPodL = note.startBeat * BEAT_W
        const instrPodR = instrPodL + note.duration * BEAT_W
        const instrCamL = scrollX - halfW
        // The pod's own sticky-clamped left edge (same pattern as NoteDisc, over the full note
        // span) — the bubble sits immediately to its left, with a constant 5px gap, so it always
        // "follows" the pod regardless of zoom/scroll without ever overlapping it.
        const podStickyLeftX = Math.max(instrPodL, Math.min(instrPodR, instrCamL + 0.05 * invStretchX))
        const instrBubbleX = podStickyLeftX - instrGapWU - instrBubbleRadius

        // Mode pod "force note" — non-destructive: never written to the note's own
        // string/fret, just an effective fret used for display/color/playback while the
        // note falls inside an active force-note Mode zone (same string, nearest fret
        // matching the target scale degree's pitch class in the zone's mode). Reverts
        // automatically the instant the zone is moved/deleted/toggled off — nothing to undo.
        const effFret = ModeZoneService.getVirtualFret(note, totalMeasures) ?? note.fret

        return (
          <group key={note.id} renderOrder={8}>
            {note.legatoNext && (
              <LegatoLine sourceId={note.id} destId={note.legatoNext} noteColor={(n) => getNoteColor(n, true)} legatoSourceId={legatoSourceId} invStretchX={invStretchX} />
            )}

            {noteChordRhythmMod && (
              <Html position={[instrBubbleX, y, 0.07]} center zIndexRange={[71, 71]} style={{ pointerEvents: 'auto' }} onWheel={passWheel}>
                <InstrumentTrackDisc mod={noteChordRhythmMod} noteId={note.id} size={instrBubblePx} />
              </Html>
            )}

            {items.map((item, idx) => {
              const w          = item.duration * BEAT_W
              const cx         = item.startBeat * BEAT_W + w / 2
              const color      = getNoteColor(note, false, effFret)
              const noteLeftX  = item.startBeat * BEAT_W

              const podWidthPx = w / (2 * halfW) * gl.domElement.clientWidth

              // Disc: diameter capped at the string's lane height (PODH), 13% smaller for margin.
              // Sized from pxPerWUY (not pxPerWUX): horizontal zoom only changes pxPerWUX, and
              // the disc's diameter is rooted in the lane's vertical proportion, so deriving it
              // from the X ratio would make it visibly grow/shrink while zooming horizontally.
              // The px size is then converted back to X world-units only for positioning.
              // Sticky: clamped to the visible camera region so it stays on screen as long as
              // any part of the pod's body is in view (same pattern as the chord/modifier discs).
              const discTargetPx = PODH * 0.87 * pxPerWUY
              const discPx       = Math.min(discTargetPx, podWidthPx * 0.92)
              const discRadius   = (discPx / 2) / pxPerWUX
              const showDisc     = podWidthPx >= 16
              const podL         = cx - w / 2
              const podR         = cx + w / 2
              const camL         = scrollX - LEFT_MARGIN_W - halfW
              const discCenterWorldX = Math.max(podL + discRadius, Math.min(podR - discRadius, camL + discRadius + 0.05 * invStretchX))
              const discX        = discCenterWorldX - cx

              // Rhythm-legato materialized notes: horizontal move/resize locked, string change still allowed
              const locked = RhythmModifierService.isLegatoLocked(note.id)

              // Legato bubble (start a chain) — right edge only; hidden while picking a destination
              // or on a rhythm-locked note (starting a new manual legato would corrupt the chain)
              const showLegatoBubble  = idx === 0 && !isIntermediate && !subNotes && podWidthPx >= 35 && !legatoSourceId && !locked
              const showLegatoActions = idx === 0 && !isIntermediate && !subNotes && podWidthPx >= 35 && !!note.legatoNext
              const bubbleOff         = Math.min(w * 0.45, 0.3 * invStretchX)

              const isFundamental = (() => {
                const group = chordGroups.find(g => g.noteIds.includes(note.id))
                if (!group) return false
                const chord = Chord.get(group.chordName)
                const rootPc = chord.root || chord.notes[0]
                if (!rootPc) return false
                const noteName = getNoteName(tuningArr[note.string], effFret)
                return Note.pitchClass(noteName) === Note.pitchClass(rootPc)
              })()

              const labelColor = ColorService.getContrastColor(color)
              const noteNamePc = Note.pitchClass(getNoteName(tuningArr[note.string], effFret))
              const discColors = DISC_PALETTE[color] ?? (() => {
                const fill = desaturateHex(darkenHex(color, 0.33), 0.35)
                return { fill, border: darkenHex(fill, 0.33), text: ColorService.getContrastColor(fill) }
              })()

              // During playback, only the pod currently under the cursor stays colored —
              // the rest fade to LANE_COL (eased over ~0.5s in PodGradientMaterial)
              const isActive   = isPlaying && playbackBeat >= item.startBeat && playbackBeat < item.startBeat + item.duration
              const grayTarget = isPlaying ? (isActive ? 0 : 1) : 0

              return (
                <group key={item.id} position={[cx, y, 0]}>
                  {/* Selection Border - only if selected and it's the first segment or original note */}
                  {isSelected && !isEditing && idx === 0 && (
                    <mesh geometry={getBorderGeo(wOriginal)} position={[wOriginal/2 - w/2, 0, -0.005]}>
                      <meshBasicMaterial color={SEL_COL} />
                    </mesh>
                  )}

                  {/* SubNote body */}
                  <SubNoteBody w={w} color={color} colorB={discColors.fill} isFundamental={isFundamental} getNoteGeo={getNoteGeo} grayTarget={grayTarget} />

                  {/* Legato bubble — right edge only, starts a new legato chain */}
                  {showLegatoBubble && (
                    <mesh position={[w/2 - bubbleOff, 0, 0.01]} geometry={bubbleGeo} scale={[invStretchX, 1, 1]} renderOrder={9}>
                      <meshBasicMaterial color={isLegatoSource ? SEL_COL : labelColor} transparent opacity={0.9} />
                    </mesh>
                  )}

                  {/* Legato action buttons (merge / behavior) — manages an existing chain */}
                  {/* Legato modifier disc — replaces the old two-button UX (P2 refactor).
                      Orange PodModifierDisc that opens a PodModifierPopover with:
                      behavior nav, count selector, merge button, auto/chain toggles. */}
                  {showLegatoActions && (() => {
                    const discWU    = 26 / pxPerWUX
                    const gapWU     = 5 / pxPerWUX      // 5px gap between disc right edge and pod left edge
                    const camL      = scrollX - LEFT_MARGIN_W - halfW
                    const camR      = camL + 2 * halfW
                    const podL      = note.startBeat * BEAT_W
                    // Hide disc when source pod is entirely off-screen (no sticky when invisible)
                    if (podL + w <= camL || podL >= camR) return null
                    // Disc sits to the LEFT of the pod; sticky-clamp at camera left edge
                    const targetX   = Math.max(camL + 0.06 * invStretchX, podL - discWU - gapWU)
                    const relativeX = targetX - cx
                    const behavior  = note.legatoBehavior || 'chromatique'
                    const curIdx    = BEHAVIOR_KEYS.indexOf(behavior)
                    const popLocked = RhythmModifierService.isLegatoLocked(note.id)
                    const count     = note.legatoCount ?? (note.intermediateNoteIds?.length ?? 2)

                    return (
                      <group position={[relativeX, 0, 0.1]}>
                        <Html
                          position={[discWU / 2, 0, 0]}
                          center
                          style={{ pointerEvents: 'auto', transform: 'none' }}
                          zIndexRange={[90, 90]}
                          onWheel={passWheel}
                        >
                          <div onPointerDown={e => e.stopPropagation()} onWheel={passWheel}>
                            <PodModifierDisc
                              emojiStr=":link:"
                              size={26}
                              discBg="#1a0800"
                              borderCol="#FF9500"
                              glow={false}
                              title={`Legato — ${BEHAVIORS[behavior].name}`}
                              popoverContent={close => (
                                <PodModifierPopover
                                  nav={!popLocked ? {
                                    label: BEHAVIORS[behavior].name,
                                    prev: () => setLegatoBehavior(note.id, BEHAVIOR_KEYS[(curIdx - 1 + BEHAVIOR_KEYS.length) % BEHAVIOR_KEYS.length], tuningArr, scaleNotes),
                                    next: () => setLegatoBehavior(note.id, BEHAVIOR_KEYS[(curIdx + 1) % BEHAVIOR_KEYS.length], tuningArr, scaleNotes),
                                  } : undefined}
                                  emojiStr=":link:"
                                  onClose={close}
                                  className="legato-popover"
                                >
                                  {/* Nombre de pods intermédiaires */}
                                  {!popLocked && note.legatoNext && (
                                    <div className="arpeggio-popover__count" style={{ marginBottom: 0 }}>
                                      <button className="pop-nav"
                                        onClick={() => {
                                          const next = Math.max(1, count - 1)
                                          pushHistory()
                                          // setLegato recrée les notes intermédiaires avec le nouveau count
                                          setLegato(note.id, note.legatoNext!, next, tuningArr)
                                          syncLegato(note.id, tuningArr, scaleNotes)
                                        }}
                                      >
                                        <span className="material-symbols-outlined">remove</span>
                                      </button>
                                      <span className="arpeggio-popover__count-value" title="Nombre de notes intermédiaires">{count}</span>
                                      <button className="pop-nav"
                                        onClick={() => {
                                          const next = Math.min(32, count + 1)
                                          pushHistory()
                                          setLegato(note.id, note.legatoNext!, next, tuningArr)
                                          syncLegato(note.id, tuningArr, scaleNotes)
                                        }}
                                      >
                                        <span className="material-symbols-outlined">add</span>
                                      </button>
                                    </div>
                                  )}

                                  <div className="pop-divider" />

                                  {/* Figer le legato en notes indépendantes */}
                                  {!locked && (
                                    <button
                                      className="pop-toggle"
                                      onClick={() => { pushHistory(); renderLegato(note.id); close() }}
                                      title="Figer — convertit le legato en notes indépendantes"
                                    >
                                      <span className="material-symbols-outlined">merge</span>
                                    </button>
                                  )}

                                  {/* Sync Auto / Mode Chaîne / Dépassement */}
                                  {!popLocked && (
                                    <>
                                      <button
                                        className={`pop-toggle${note.legatoAuto !== false ? ' active' : ''}`}
                                        onClick={() => setLegatoAuto(note.id, note.legatoAuto === false)}
                                        title="Sync Auto — recalcule toute la chaîne quand source ou destination bougent"
                                      >
                                        <span className="material-symbols-outlined">sync</span>
                                      </button>
                                      <button
                                        className={`pop-toggle${note.legatoChain ? ' active' : ''}`}
                                        onClick={() => setLegatoChain(note.id, !note.legatoChain)}
                                        title="Mode Chaîne — ne recalcule qu'à partir de la note déplacée"
                                      >
                                        <span className="material-symbols-outlined">mediation</span>
                                      </button>
                                      <button
                                        className={`pop-toggle${note.legatoOvershoot ? ' active' : ''}`}
                                        onClick={() => {
                                          updateNote(note.id, { legatoOvershoot: !note.legatoOvershoot }, tuningArr, scaleNotes)
                                          syncLegato(note.id, tuningArr, scaleNotes)
                                        }}
                                        title="Dépassement — les notes générées peuvent dépasser la hauteur de la source et de la destination (amplitude auto)"
                                      >
                                        <span className="material-symbols-outlined">expand</span>
                                      </button>
                                    </>
                                  )}
                                </PodModifierPopover>
                              )}
                            />
                          </div>
                        </Html>
                      </group>
                    )
                  })()}

                  {/* Note disc — fret (big) + note name (small, bottom-right), pinned to the pod's start */}
                  {showDisc && !isEditing && (
                    <NoteDisc
                      discX={discX}
                      discPx={discPx}
                      fill={discColors.fill}
                      border={discColors.border}
                      text={discColors.text}
                      fret={effFret}
                      noteName={noteNamePc}
                      locked={locked}
                      onClick={e => {
                        e.stopPropagation()
                        if (legatoSourceId) {
                          // Legato creation mode: clicking the disc resolves the chain (instead of editing)
                          if (legatoSourceId !== note.id) addLegato(legatoSourceId, note.id)
                          setLegatoSourceId(null)
                          return
                        }
                        setEditingId(note.id); setInputVal(String(note.fret)); setSelectedIds(new Set([note.id]))
                      }}
                      onMouseEnter={() => {
                        FretboardHighlightService.setHighlights([{ si: note.string, fret: note.fret }])
                        if (note.legatoNext || note.legatoPrev || note.legatoRatio)
                          LegatoFretVisualizationService.show(note.id, notes)
                      }}
                      onMouseLeave={() => {
                        FretboardHighlightService.clearHighlights()
                        LegatoFretVisualizationService.clear()
                      }}
                    />
                  )}

                  {/* Interaction Overlay — everything outside the disc moves or resizes the pod */}
                  <mesh position={[0, 0, 0.05]}
                    onPointerDown={e => onNoteDown(e, note)}
                    onPointerMove={e => {
                      if (drag.current) return
                      const lx = e.point.x - item.startBeat * BEAT_W
                      gl.domElement.style.cursor = locked ? 'ns-resize' : zoneCursor(noteZoneCompact(lx, w, invStretchX, showLegatoBubble))
                    }}
                    onPointerEnter={e => {
                      const lx = e.point.x - item.startBeat * BEAT_W
                      gl.domElement.style.cursor = locked ? 'ns-resize' : zoneCursor(noteZoneCompact(lx, w, invStretchX, showLegatoBubble))
                      FretboardHighlightService.setHighlights([{ si: note.string, fret: note.fret }])
                      if (note.legatoNext || note.legatoPrev || note.legatoRatio)
                        LegatoFretVisualizationService.show(note.id, notes)
                    }}
                    onPointerLeave={() => {
                      if (!drag.current) gl.domElement.style.cursor = 'default'
                      FretboardHighlightService.clearHighlights()
                      LegatoFretVisualizationService.clear()
                    }}
                    onDoubleClick={e => {
                      e.stopPropagation()
                      if (isIntermediate && sourceNote && !locked) {
                        pushHistory()
                        addLegatoIntermediate(note.id, tuningArr, scaleNotes)
                        return
                      }
                      const inGroup = chordGroups.some(g => g.noteIds.includes(note.id))
                      if (inGroup) {
                        const newFret = nextFretSamePc(tuningArr[note.string], note.fret)
                        if (newFret !== note.fret) { pushHistory(); updateNote(note.id, { fret: newFret }, tuningArr, scaleNotes) }
                      } else {
                        setEditingId(note.id); setInputVal(String(note.fret)); setSelectedIds(new Set([note.id]))
                      }
                    }}
                    onContextMenu={e => {
                      e.stopPropagation()
                      if (editingId === note.id) { setEditingId(null); setInputVal('') }
                      pushHistory()
                      deleteNote(note.id, tuningArr)
                      setSelectedIds(prev => { const s = new Set(prev); s.delete(note.id); return s })
                    }}
                  >
                    <planeGeometry args={[w, LANE_H]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                  </mesh>

                  {isEditing && (
                    <Html position={[discX, 0, 0]} center style={{ pointerEvents: 'auto' }} onWheel={passWheel}>
                      <input className="tab-r3f-fret-input" value={inputVal} autoFocus maxLength={3}
                        onWheel={passWheel}
                        onChange={ev => {
                          const raw = ev.target.value
                          if (/^[A-Ga-g]/.test(raw)) {
                            setInputVal(raw.replace(/[^A-Ga-g#b0-9]/g, '').slice(0, 3))
                          } else {
                            setInputVal(raw.replace(/\D/g, '').slice(0, 2))
                          }
                        }}
                        onKeyDown={ev => {
                          ev.stopPropagation()
                          if (ev.key === 'Enter')  confirmEdit(note.id, inputVal)
                          if (ev.key === 'Escape') { setEditingId(null); setInputVal('') }
                        }}
                        onBlur={() => confirmEdit(note.id, inputVal)} />
                    </Html>
                  )}
                </group>
              )
            })}
          </group>
        )
      })}

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

      {/* Legato popover is now handled by PodModifierDisc (orange disc above the source note) */}

      {/* Viewport rect — layer 1, visible only to minimapCam */}
      <lineLoop ref={viewportRectRef} geometry={viewportRectGeo} frustumCulled={false}>
        <lineBasicMaterial color="#FF9500" />
      </lineLoop>

      {/* Minimap playback cursor — position driven imperatively in useFrame via minimapCursorRef */}
      <mesh
        ref={minimapCursorRef}
        position={[0, (CAM_HALF_H_TOP - CAM_HALF_H_BOT) / 2, 0.6]}
        frustumCulled={false}
      >
        <planeGeometry args={[1.5, CAM_HALF_H_TOP + CAM_HALF_H_BOT]} />
        <meshBasicMaterial color={APPLE_GREEN} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
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

  const { 
    notes,
    isPlaying, playbackBeat, togglePlayback, setPlaybackBeat, tempo, setTempo, 
    isLooping, setLooping, isFollowing, setFollowing
  } = useTablatureR3FStore()

  const rawMaxBeat = notes.length > 0 
    ? Math.max(...notes.map(n => n.startBeat + n.duration)) 
    : 0
  const maxBeat = Math.ceil(rawMaxBeat / BEATS_PER_MEAS) * BEATS_PER_MEAS

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

      {/* Playback Controls Footer */}
      <div className="tab-playback-footer">
        <div className="playback-btns">
          <button className="ctrl-btn play-btn" onClick={() => {
            if (isPlaying) {
              stopAllSounds()
            } else {
              // If we are at the end, restart from 0
              if (playbackBeat >= maxBeat - 0.01) {
                setPlaybackBeat(0)
              }
            }
            togglePlayback()
          }}>
            <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          <button className="ctrl-btn stop-btn" onClick={() => {
            if (isPlaying) togglePlayback()
            stopAllSounds()
            setPlaybackBeat(0)
          }}>
            <span className="material-symbols-outlined">stop</span>
          </button>
          <button 
            className={`ctrl-btn loop-btn${isLooping ? ' active' : ''}`} 
            onClick={() => setLooping(!isLooping)}
            title="Loop"
          >
            <span className="material-symbols-outlined">repeat</span>
          </button>
          <button 
            className={`ctrl-btn follow-btn${isFollowing ? ' active' : ''}`} 
            onClick={() => setFollowing(!isFollowing)}
            title="Follow Playback"
          >
            <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
          </button>
        </div>

        <div className="tempo-section">
          <input 
            type="number" 
            className="tempo-input" 
            value={tempo} 
            onChange={e => setTempo(Math.max(1, parseInt(e.target.value) || 1))} 
          />
          <span className="bpm-label">BPM</span>
        </div>
      </div>
    </div>
  )
}
