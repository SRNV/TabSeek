import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { createRibbonMaterial, buildRibbonGeoCatmullRom } from '../../services/RibbonLineService'
import * as THREE from 'three'
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import type { TablatureNote, ChordGroup, ProgressionGroup, LegatoBehavior } from '../../stores/useTablatureR3FStore'
import type { ChordProgression } from '../../composables/progressions'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { useMainStore } from '../../stores/useMainStore'
import { getNoteDegree } from '../../composables/useNoteHelpers'
import { TablatureDropService } from '../../services/TablatureDropService'
import { TablatureMoveService } from '../../services/TablatureMoveService'
import { ChordEmojiBox } from '../../services/ChordEmojiService'
import { FretboardHighlightService } from '../../services/FretboardHighlightService'
import { LegatoFretVisualizationService } from '../../services/LegatoFretVisualizationService'
import { playNote, playFullChord, stopAllSounds } from '../../composables/useAudio'
import { ColorService } from '../../services/ColorService'
import './TablatureR3F.scss'

const BEHAVIORS: Record<LegatoBehavior, { name: string, icon: string }> = {
  'chromatique':  { name: 'Chromatique',  icon: 'linear_scale' },
  'secondes':     { name: 'Secondes',     icon: 'counter_2' },
  'tierces':      { name: 'Tierces',      icon: 'counter_3' },
  'quartes':      { name: 'Quartes',      icon: 'counter_4' },
  'quintes':      { name: 'Quintes',      icon: 'counter_5' },
  'sixtes':       { name: 'Sixtes',       icon: 'counter_6' },
  'septiemes':    { name: 'Septièmes',    icon: 'counter_7' },
  'octaves':      { name: 'Octaves',      icon: 'counter_8' },
  'gamme':        { name: 'Gamme',        icon: 'music_note' },
  'pentatonique': { name: 'Pentatonique', icon: 'filter_5' },
  'triade':       { name: 'Triade',       icon: 'change_history' },
  'arp7':         { name: 'Arpège 7',     icon: 'star_half' },
  'blues':        { name: 'Blues',        icon: 'water_drop' },
  'whole-tone':   { name: 'Par Tons',     icon: 'texture' },
  'diminished':   { name: 'Diminué',      icon: 'grid_view' },
  'free':         { name: 'Free',         icon: 'gesture' },
}
const BEHAVIOR_KEYS = Object.keys(BEHAVIORS) as LegatoBehavior[]

import { 
  BEAT_W, SNAP, MIN_DUR, N_STRINGS, STRING_H, LANE_H, NOTE_H, GAP_WU, BEATS_PER_MEAS, MEASURE_W,
  stringY, siFromWorldY, snapBeat, constrainMove, constrainRight, constrainLeft, constrainChordGroupMove
} from '../../utils/tabUtils'
import { findFretForNote, findFretForPc, nextFretSamePc, getNoteName } from '../../utils/guitarUtils'

const INITIAL_MEASURES = 1000
const TRIGGER_FRAC     = 0.85
const EXTEND_FRAC      = 0.5
const SCROLL_SPEED     = BEAT_W / 50
const LARGE_W          = 4_000_000
const RECT_DRAG_PX     = 5

const SCALE_COLORS = ['#FFF9B1','#77DD77','#AEC6CF','#CDB4DB','#FFB3B3','#FFD1B3','#FFFFFF']

const BG_COL        = '#3a3a3a'
const LANE_COL      = '#2e2e2e'
const BEAT_LINE_COL = '#111111'
const MEAS_LINE_COL = '#505050'
const OFF_COL       = '#606060'
const SEL_COL       = '#FF9500'
const PEND_COL      = '#3d8de0'
const LEGATO_COL    = '#FFD700'   // gold for legato bubbles
const APPLE_GREEN   = '#88FF00'

const gridTop    = ((N_STRINGS - 1) / 2) * STRING_H + LANE_H / 2 + 0.12
const gridBottom = -gridTop

// Info lane — chord labels
const INFO_LANE_GAP = 0.20
const INFO_LANE_H   = LANE_H
const infoLaneY     = gridBottom - INFO_LANE_GAP - INFO_LANE_H / 2
// Asymmetric frustum: top = symmetric, bottom extended to include info lane + margin
const CAM_HALF_H_TOP = gridTop + STRING_H * 0.35
const CAM_HALF_H_BOT = gridTop + INFO_LANE_GAP + INFO_LANE_H + 0.30

// Progression pod style
const PROG_BORDER_COL = '#5B8EE8'
const PROG_FILL_COL   = BG_COL
const PROG_FILL_HOV   = '#4a4a4a'
const PROG_PAD_H      = 1.20   // extra padding beyond chord pod edges on each side
const PROG_PAD_V      = 0.55

const CHORD_DUR       = BEATS_PER_MEAS   // 4 beats per chord slot when dropping a progression
const CHORD_PAD_H     = 0.25            // horizontal padding around chord pod (WU ≈ 5px)
const CHORD_PAD_V     = 0.25            // vertical padding around chord pod (WU ≈ 5px)
const CHORD_R         = 0.28            // chord pod corner radius (WU)
const CHORD_BORDER_WU = 0.10            // ~2 px border at standard zoom
const CHORD_COL       = '#404040'       // chord pod fill
const CHORD_BORDER_COL = '#4caf50'      // green border

const BUBBLE_W = 0.25

type NoteZone = 'resize-left' | 'bubble-prev' | 'fret' | 'name' | 'move' | 'bubble-next' | 'resize-right'

function noteZone(lx: number, w: number, invStretchX: number): NoteZone {
  const rx = 0.15 * invStretchX // resize zone
  const bx = 0.50 * invStretchX // bubble zone
  const fx = 1.20 * invStretchX // fret zone
  const nx = 2.40 * invStretchX // name zone
  
  if (lx < rx) return 'resize-left'
  if (lx < bx) return 'bubble-prev'
  if (lx < fx) return 'fret'
  if (lx < nx) return 'name'
  
  if (lx > w - rx) return 'resize-right'
  if (lx > w - bx) return 'bubble-next'
  
  return 'move'
}

function zoneCursor(z: NoteZone) {
  if (z === 'resize-left' || z === 'resize-right') return z === 'resize-left' ? 'w-resize' : 'e-resize'
  if (z === 'bubble-prev' || z === 'bubble-next')  return 'crosshair'
  if (z === 'fret' || z === 'name') return 'text'
  return 'grab'
}

function noteInRect(n: TablatureNote, x0: number, y0: number, x1: number, y1: number) {
  const rx0 = Math.min(x0, x1), rx1 = Math.max(x0, x1)
  const ry0 = Math.min(y0, y1), ry1 = Math.max(y0, y1)
  const nx0 = n.startBeat * BEAT_W
  const nx1 = nx0 + n.duration * BEAT_W
  const ny  = stringY(n.string)
  return nx0 < rx1 && nx1 > rx0 && (ny - LANE_H / 2) < ry1 && (ny + LANE_H / 2) > ry0
}

function roundedRect(w: number, h: number, rx: number, ry: number) {
  const s = new THREE.Shape(), hw = w / 2, hh = h / 2
  s.moveTo(-hw + rx, -hh); s.lineTo(hw - rx, -hh)
  s.quadraticCurveTo(hw, -hh, hw, -hh + ry); s.lineTo(hw, hh - ry)
  s.quadraticCurveTo(hw, hh, hw - rx, hh); s.lineTo(-hw + rx, hh)
  s.quadraticCurveTo(-hw, hh, -hw, hh - ry); s.lineTo(-hw, -hh + ry)
  s.quadraticCurveTo(-hw, -hh, -hw + rx, -hh)
  return s
}
function buildBeatGeo(n: number) {
  const pts = new Float32Array((n * BEATS_PER_MEAS + 1) * 6)
  for (let b = 0; b <= n * BEATS_PER_MEAS; b++) {
    const x = b * BEAT_W; pts.set([x, gridBottom, 0, x, gridTop, 0], b * 6)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3)); return g
}
function buildMeasGeo(n: number) {
  const pts = new Float32Array((n + 1) * 6)
  for (let m = 0; m <= n; m++) {
    const x = m * MEASURE_W; pts.set([x, gridBottom, 0, x, gridTop, 0], m * 6)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3)); return g
}


function LegatoLine({ sourceId, destId, noteColor, legatoSourceId, invStretchX }: { 
  sourceId: string; 
  destId: string;
  noteColor: (n: TablatureNote) => string;
  legatoSourceId: string | null;
  invStretchX: number;
}) {
  const notes = useTablatureR3FStore(s => s.notes)
  const source = notes.find(n => n.id === sourceId)
  const dest = notes.find(n => n.id === destId)
  const meshRef = useRef<THREE.Mesh>(null!)
  const mat = useMemo(() => createRibbonMaterial(), [])

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.getElapsedTime()
    mat.uniforms.uInvStretchX.value = invStretchX
  })

  const geo = useMemo(() => {
    if (!source || !dest) return null

    const chain: THREE.Vector3[] = []
    const chainColors: THREE.Color[] = []
    const getC = (n: TablatureNote) => new THREE.Color(noteColor(n))
    const getOff = (n: TablatureNote) => Math.min(n.duration * BEAT_W * 0.45, 0.3 * invStretchX)

    const addPoint = (p: THREE.Vector3, col: THREE.Color) => {
      const last = chain[chain.length - 1]
      if (!last || last.distanceTo(p) > 0.05) {
        chain.push(p)
        chainColors.push(col)
      }
    }

    addPoint(new THREE.Vector3((source.startBeat + source.duration) * BEAT_W - getOff(source), stringY(source.string), 0), getC(source))

    if (source.intermediateNoteIds) {
      const sortedInt = source.intermediateNoteIds
        .map(id => notes.find(x => x.id === id))
        .filter(Boolean)
        .sort((a, b) => a!.startBeat - b!.startBeat)

      for (const n of sortedInt) {
        const nw = n!.duration * BEAT_W
        const ncx = n!.startBeat * BEAT_W + nw / 2
        const ny = stringY(n!.string)
        const col = getC(n!)
        const off = getOff(n!)
        addPoint(new THREE.Vector3(ncx - nw/2 + off, ny, 0), col)
        addPoint(new THREE.Vector3(ncx + nw/2 - off, ny, 0), col)
      }
    }

    const dw = dest.duration * BEAT_W
    const dcx = dest.startBeat * BEAT_W + dw / 2
    addPoint(new THREE.Vector3(dcx - dw/2 + getOff(dest), stringY(dest.string), 0), getC(dest))

    return buildRibbonGeoCatmullRom(chain, chainColors, 0.12, Math.max(40, chain.length * 10), -0.02)
  }, [source, dest, notes, legatoSourceId, noteColor])

  if (!geo) return null

  return (
    <mesh ref={meshRef} geometry={geo} material={mat} renderOrder={6} />
  )
}

// ── Legato Action Button (shared by behavior + render) ────────────────────────
function LegatoActionBtn({ color, icon, onClick }: { color: string; icon: string; onClick: () => void }) {
  const ink = ColorService.getContrastColor(color)
  return (
    <button
      type="button"
      className="legato-action-btn"
      style={{ backgroundColor: color }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <span className="material-symbols-outlined" style={{ color: ink }}>
        {icon}
      </span>
    </button>
  )
}

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

// ── BlinkMaterial: 0.5 Hz pulse, imperative ShaderMaterial to avoid colorspace issues ──
const BLINK_VERT = `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const BLINK_FRAG = `
  uniform float u_time;
  uniform vec3  u_base;
  void main(){
    // lighten by blending 40% white in linear space — 2 Hz sine
    float t=(sin(u_time*12.5663706)+1.0)*0.5;
    gl_FragColor=vec4(u_base+(1.0-u_base)*0.40*t,1.0);
    #include <colorspace_fragment>
  }
`
function BlinkMaterial({ color }: { color: string }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { u_time: { value: 0 }, u_base: { value: new THREE.Color(color) } },
    vertexShader:   BLINK_VERT,
    fragmentShader: BLINK_FRAG,
  }), [color])

  useFrame((state) => {
    const clock = (state as any).clock
    const time = (typeof clock?.getElapsedTime === 'function') ? clock.getElapsedTime() : (state as any).elapsedTime
    material.uniforms.u_time.value = time
  })

  return <primitive object={material} attach="material" />
}

interface SceneProps { onStringYPcts: (pcts: number[]) => void }

// ── Scene ───────────────────────────────────────────────────────────────────────
function TablatureScene({ onStringYPcts }: SceneProps) {
  const { camera, gl, size, scene } = useThree()
  const o = camera as THREE.OrthographicCamera
  const pxPerWUX = size.width / (o.right - o.left)
  const pxPerWUY = size.height / (o.top - o.bottom)
  const invStretchX = pxPerWUY / pxPerWUX
  const { 
    notes, chordGroups, progressionGroups, 
    addNote, updateNote, deleteNote, 
    addChordGroup, removeChordGroup, 
    addProgressionGroup, updateProgressionGroup, 
    removeProgressionGroup, 
    setLegato, setLegatoBehavior, addLegatoIntermediate, syncLegato,
    setLegatoAuto, setLegatoChain, renderLegato,
    pushHistory, undo, redo,
    isPlaying, playbackBeat, setPlaybackBeat, tempo, isLooping, setLooping, togglePlayback
  } = useTablatureR3FStore()

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

    canvas.addEventListener('pointerdown',  onPointerDown,  { capture: true })
    canvas.addEventListener('pointermove',  onPointerMove,  { capture: true })
    canvas.addEventListener('pointerup',    onPointerUp,    { capture: true })
    canvas.addEventListener('pointerleave', onPointerLeave)
    return () => {
      canvas.removeEventListener('pointerdown',  onPointerDown,  { capture: true })
      canvas.removeEventListener('pointermove',  onPointerMove,  { capture: true })
      canvas.removeEventListener('pointerup',    onPointerUp,    { capture: true })
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [gl, minimapCam])

  // ── Playback Logic ──────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (isPlaying) {
      const beatsPerSecond = tempo / 60
      let newBeat = playbackBeat + delta * beatsPerSecond
      
      // Highlighting logic: Find notes currently being played
      const activeNotes = notes.filter(n => 
        newBeat >= n.startBeat && 
        newBeat < n.startBeat + n.duration
      )
      const activeIds = activeNotes.map(n => n.id).sort().join(',')
      if (activeIds !== lastActiveIdsRef.current) {
        lastActiveIdsRef.current = activeIds
        FretboardHighlightService.setHighlights(activeNotes.map(n => ({ si: n.string, fret: n.fret })))
        const legatoNote = activeNotes.find(n => n.legatoNext || n.legatoPrev || n.legatoRatio)
        if (legatoNote) {
          LegatoFretVisualizationService.show(legatoNote.id, notes)
        } else {
          LegatoFretVisualizationService.clear()
        }
      }

      // Auto-reset / Loop check
      const maxBeat = notes.length > 0 
        ? Math.max(...notes.map(n => n.startBeat + n.duration)) 
        : 0

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
        const toPlay = notes.filter(n => n.startBeat >= start && n.startBeat < end)
        
        if (toPlay.length > 0) {
          const groups = new Map<number, TablatureNote[]>()
          toPlay.forEach(n => {
            const list = groups.get(n.startBeat) || []
            list.push(n)
            groups.set(n.startBeat, list)
          })

          groups.forEach((noteList) => {
            const pitches = noteList.map(n => {
              const openNote = tuningArr[n.string] ?? 'E2'
              return getNoteName(openNote, n.fret)
            })
            const durSec = Math.max(0.1, noteList[0].duration * (60 / tempo))
            if (pitches.length > 1) {
              playFullChord(pitches, durSec)
            } else {
              playNote(pitches[0], durSec)
            }
          })
        }
      }

      lastBeatRef.current = newBeat
      setPlaybackBeat(newBeat)
    } else {
      lastBeatRef.current = playbackBeat
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
    const viewRight  = (o.position.x + halfWRef.current) / MEASURE_W
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
      const vl = o.position.x - halfWRef.current
      const vr = o.position.x + halfWRef.current
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
  const [popoverLegatoId, setPopoverLegatoId] = useState<string | null>(null)
  const [popoverVisible, setPopoverVisible] = useState(false)

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
    o.left = -halfW; o.right = halfW
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
    
    // Asymmetric frustum: extra space at bottom for info lane
    o.top    = CAM_HALF_H_TOP
    o.bottom = -CAM_HALF_H_BOT
    o.left   = -halfW
    o.right  = +halfW
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
      }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [camera, gl])

  // ── Progression drag-and-drop ─────────────────────────────────────────────────
  const [dragHoverSi, setDragHoverSi] = useState<number | null>(null)

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
      let prog: ChordProgression
      try { prog = JSON.parse(data) } catch { return }

      const o    = camera as THREE.OrthographicCamera
      const rect = canvas.getBoundingClientRect()
      const ndx  = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndy  = 1 - ((e.clientY - rect.top)  / rect.height) * 2
      const worldX = o.position.x + ndx * halfWRef.current
      const worldY = o.position.y + (o.top + o.bottom) / 2 + ndy * (o.top - o.bottom) / 2
      const si     = siFromWorldY(worldY)
      const beat   = Math.max(0, snapBeat(worldX / BEAT_W))

      TablatureDropService.handleDrop(prog, si, beat, scaleNotes)
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

  // ── Selection & edit state ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputVal,  setInputVal]  = useState('')
  const newNoteIds = useRef(new Set<string>())

  const clipboard = useRef<ClipData>({ notes: [], groups: [] })

  const [rectBox, setRectBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  const drag    = useRef<DragNote | DragRect | DragChordGroup | DragProgGroup | DragNewProg | DragPlayback | null>(null)
  const [newProgDrag, setNewProgDrag] = useState<{ startBeat: number; endBeat: number } | null>(null)
  const [hoveredGroupId,      setHoveredGroupId]      = useState<string | null>(null)
  const [labelHoveredGroupId, setLabelHoveredGroupId] = useState<string | null>(null)
  const [hoveredProgId,       setHoveredProgId]       = useState<string | null>(null)
  const [labelHoveredProgId,  setLabelHoveredProgId]  = useState<string | null>(null)
  const [selectedChordGroupIds, setSelectedChordGroupIds] = useState<Set<string>>(new Set())
  const [editingProgId,   setEditingProgId]   = useState<string | null>(null)
  const [editingProgName, setEditingProgName] = useState('')
  const selectedChordGroupIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => { selectedChordGroupIdsRef.current = selectedChordGroupIds }, [selectedChordGroupIds])

  // Sync fretboard highlight: when any chord pod is hovered, show its notes in the fretboard
  useEffect(() => {
    const activeId = hoveredGroupId ?? labelHoveredGroupId
    const group = activeId ? chordGroups.find(g => g.id === activeId) : null
    useMainStore.getState().setTabHoveredChordName(group?.chordName ?? null)
  }, [hoveredGroupId, labelHoveredGroupId, chordGroups])

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
      return o.position.x + ndc * (o.right - o.left) / 2
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
  const getNoteColor = React.useCallback((note: TablatureNote, skipDarken = false): string => {
    let hex = OFF_COL
    if (legatoSourceId) {
      if (legatoSourceId === note.id) hex = LEGATO_COL
      else hex = OFF_COL
    } else if (note.id === editingId) {
      hex = PEND_COL
    } else {
      const open = tuningArr[note.string]
      const deg  = open ? getNoteDegree(getNoteName(open, note.fret), scaleNotes) : null
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
  }, [legatoSourceId, editingId, tuningArr, scaleNotes, intermediateIds])

  // ── Geometry caches ───────────────────────────────────────────────────────────
  const NOTE_R_MAX  = NOTE_H * 0.35           // max corner radius (capped by half-width below)
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
      g = new THREE.ShapeGeometry(roundedRect(w, NOTE_H, rx, ry), 4)
      geoCache.current.set(key, g)
    }
    return g
  }
  function getBorderGeo(w: number) {
    const key = `${w.toFixed(2)}`
    let g = borderCache.current.get(key)
    if (!g) {
      const bw = w + SEL_PAD * 2
      const bh = NOTE_H + SEL_PAD * 2
      const ry = Math.min(bh / 2, NOTE_R_MAX + SEL_PAD)
      const rx = Math.min(bw / 2, ry * invStretchX)
      g = new THREE.ShapeGeometry(roundedRect(bw, bh, rx, ry), 4)
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
  }, [notes, chordGroups, tuningArr])

  const laneBgGeo = useMemo(() => new THREE.PlaneGeometry(LARGE_W, LANE_H), [])
  const laneBgMat = useMemo(() => new THREE.MeshBasicMaterial({ color: LANE_COL }), [])
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
    const tp = noteZone(lx, w, invStretchX)

    // Legato Click-to-Click logic
    if (legatoSourceId) {
      if (legatoSourceId !== note.id) {
        addLegato(legatoSourceId, note.id)
      }
      setLegatoSourceId(null)
      return
    }

    if (tp === 'bubble-prev' || tp === 'bubble-next') {
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
  const leftMeas  = Math.max(0, Math.floor((scrollX - halfW) / MEASURE_W) - 1)
  const rightMeas = Math.min(totalMeasures - 1, Math.ceil((scrollX + halfW) / MEASURE_W) + 1)
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

      {/* Grid lines */}
      <lineSegments position={[0, 0, -0.035]} geometry={beatGeo} material={matBeat} frustumCulled={false} />
      <lineSegments position={[0, 0, -0.035]} geometry={measGeo} material={matMeas} frustumCulled={false} />

      {/* Measure labels */}
      {Array.from({ length: rightMeas - leftMeas + 1 }, (_, i) => {
        const m = leftMeas + i
        if (m < 0 || m >= totalMeasures) return null
        return (
          <Html key={m} center position={[m * MEASURE_W + MEASURE_W / 2, measLabelY, 0.1]}
            style={{ pointerEvents: 'none' }}>
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

      {/* Progression pods — sit behind chord pods in the grid */}
      {progressionGroups.map(prog => {
        const b = getProgBounds(prog)
        if (!b) return null
        const podW  = (b.beatMax - b.beatMin) * BEAT_W + CHORD_PAD_H * 2 + PROG_PAD_H * 2
        const podH  = (b.siMax - b.siMin + 1) * STRING_H - GAP_WU + (CHORD_PAD_V + PROG_PAD_V) * 2
        const podCX = (b.beatMin + b.beatMax) / 2 * BEAT_W
        const podCY = (stringY(b.siMin) + stringY(b.siMax)) / 2
        const isHov = hoveredProgId === prog.id || labelHoveredProgId === prog.id
        const bCol  = isHov ? SEL_COL : PROG_BORDER_COL
        return (
          <group key={prog.id} position={[podCX, podCY, -0.034]}>
            {/* Border (back) */}
            <mesh geometry={getChordPodGeo(podW, podH, true)} renderOrder={2}>
              <meshBasicMaterial color={bCol} />
            </mesh>
            {/* Fill (front) — using BG_COL as requested */}
            <mesh position={[0, 0, 0.001]} geometry={getChordPodGeo(podW, podH)} renderOrder={3}>
              <meshBasicMaterial color={isHov ? PROG_FILL_HOV : BG_COL} />
            </mesh>
            {/* Hit area */}
            <mesh position={[0, 0, 0.009]}
              onPointerDown={e => onProgPodDown(e, prog, podW)}
              onPointerEnter={() => { setHoveredProgId(prog.id); if (!drag.current) gl.domElement.style.cursor = 'grab' }}
              onPointerLeave={() => { setHoveredProgId(null); if (!drag.current) gl.domElement.style.cursor = 'default' }}
              onPointerMove={e => {
                if (drag.current) return
                const lx = e.point.x - (b.beatMin * BEAT_W - CHORD_PAD_H - PROG_PAD_H)
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, podW, invStretchX))
              }}
              onContextMenu={e => { e.stopPropagation(); pushHistory(); removeProgressionGroup(prog.id) }}
            >
              <planeGeometry args={[podW, podH]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Label in info lane */}
            <Html center position={[0, infoLaneY - podCY, 0.1]} style={{ pointerEvents: editingProgId === prog.id ? 'auto' : 'none', cursor: 'inherit' }}>
              {editingProgId === prog.id ? (
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
              ) : (
                <div style={{ width: `${Math.max(0, podW * pxPerWUX - 4)}px`, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                  <span
                    style={{ fontSize: '11px', fontWeight: 800, color: PROG_BORDER_COL,
                      userSelect: 'none', whiteSpace: 'nowrap', cursor: 'inherit',
                      background: 'rgba(20,20,20,0.7)', padding: '2px 6px', borderRadius: '4px' }}
                    onMouseEnter={() => setLabelHoveredProgId(prog.id)}
                    onMouseLeave={() => setLabelHoveredProgId(null)}
                    onDoubleClick={() => { setEditingId(prog.id); setEditingProgName(prog.name) }}
                  >
                    {prog.name}
                  </span>
                </div>
              )}
            </Html>
          </group>
        )
      })}

      {/* Chord pods — rendered behind notes */}
      {chordGroups.map(group => {
        const b = getGroupBounds(group)
        if (!b) return null
        const podW  = (b.beatMax - b.beatMin) * BEAT_W + CHORD_PAD_H * 2
        const podH  = (b.siMax - b.siMin + 1) * STRING_H - GAP_WU + CHORD_PAD_V * 2
        const podCX = (b.beatMin + b.beatMax) / 2 * BEAT_W
        const podCY = (stringY(b.siMin) + stringY(b.siMax)) / 2
        const podLeft = b.beatMin * BEAT_W - CHORD_PAD_H
        const isHovered     = hoveredGroupId === group.id
        const isLabelHover  = labelHoveredGroupId === group.id
        const isSelForProg  = selectedChordGroupIds.has(group.id)
        const borderCol     = isLabelHover ? SEL_COL : isSelForProg ? '#7BA7E8' : CHORD_BORDER_COL
        return (
          <group key={group.id} position={[podCX, podCY, -0.03]}>
            {/* Border (back) */}
            <mesh position={[0, 0, 0]} geometry={getChordPodGeo(podW, podH, true)} renderOrder={4}>
              <meshBasicMaterial color={borderCol} />
            </mesh>
            {/* Grey fill (front) */}
            <mesh position={[0, 0, 0.003]} geometry={getChordPodGeo(podW, podH)} renderOrder={5}>
              <meshBasicMaterial color={isHovered ? '#4a4a4a' : CHORD_COL} />
            </mesh>
            {/* Hit area */}
            <mesh position={[0, 0, 0.01]}
              onPointerDown={e => onChordPodDown(e, group, podLeft, podW)}
              onPointerEnter={() => { setHoveredGroupId(group.id); if (!drag.current) gl.domElement.style.cursor = 'grab' }}
              onPointerLeave={() => { setHoveredGroupId(null); if (!drag.current) gl.domElement.style.cursor = 'default' }}
              onPointerMove={e => {
                if (drag.current) return
                const lx = e.point.x - podLeft
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, podW, invStretchX))
              }}
              onContextMenu={e => {
                e.stopPropagation()
                pushHistory()
                group.noteIds.forEach(id => deleteNote(id, tuningArr))
              }}
            >
              <planeGeometry args={[podW, podH]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Emoji disc — top-left corner of the chord pod */}
            <Html center position={[-podW / 2, podH / 2, 0.05]} style={{ pointerEvents: 'auto', transform: 'translate(-50%, -50%)' }} zIndexRange={[70, 70]}>
              <div
                onMouseEnter={() => setLabelHoveredGroupId(group.id)}
                onMouseLeave={() => setLabelHoveredGroupId(null)}
              >
                <ChordEmojiBox
                  chordName={group.chordName}
                  size={25}
                  disc={{ bgColor: (isHovered || isLabelHover) ? '#4a4a4a' : CHORD_COL, borderColor: borderCol }}
                />
              </div>
            </Html>
            {/* Chord name in info lane */}
            <Html center position={[0, infoLaneY - podCY, 0.1]} style={{ pointerEvents: 'none', cursor: 'inherit' }}>
              <div style={{ width: `${Math.max(0, podW * pxPerWUX - 4)}px`, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                <h2
                  style={{ margin: 0, padding: 0, fontSize: '12px', fontWeight: 700,
                    color: CHORD_BORDER_COL, userSelect: 'none', whiteSpace: 'nowrap',
                    lineHeight: 1, cursor: 'inherit' }}
                >
                  {group.chordName}
                </h2>
              </div>
            </Html>
            {/* Info lane Three.js hit area — handles hover + click-to-select + drag-to-create-progression */}
            <mesh
              position={[0, infoLaneY - podCY, 0.005]}
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
              <planeGeometry args={[podW, INFO_LANE_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}

      {/* Notes */}
      {notes.map(note => {
        const w          = note.duration * BEAT_W
        const cx         = note.startBeat * BEAT_W + w / 2
        const color      = getNoteColor(note)
        const noteLeftX  = note.startBeat * BEAT_W
        const noteRightX = noteLeftX + w
        const camLeft    = scrollX - halfW
        const camRight   = scrollX + halfW
        const labelVisible   = noteRightX > camLeft && noteLeftX < camRight
        
        // Check if intermediate note of a legato
        const isIntermediate = intermediateIds.has(note.id)
        const sourceNote = isIntermediate ? notes.find(n => n.intermediateNoteIds?.includes(note.id)) : null

        const podWidthPx     = w / (2 * halfW) * gl.domElement.clientWidth
        const showFretLabel  = podWidthPx >= 12
        const showNoteName   = podWidthPx >= 45
        const showBubbles    = !isIntermediate && podWidthPx >= 35
        const bubbleOff      = Math.min(w * 0.45, 0.3 * invStretchX)
        
        // Label position: centered for short pods, left-aligned for long ones
        const labelLX = (w < 1.6 * invStretchX) ? 0 : (-w/2 + 0.8 * invStretchX)
        const nameLX  = (w < 2.8 * invStretchX) ? 0 : (-w/2 + 1.8 * invStretchX)
        const clipW   = Math.max(2, w - 0.4 * invStretchX)
        
        const isFundamental = (() => {
          const group = chordGroups.find(g => g.noteIds.includes(note.id))
          if (!group) return false
          const chord = Chord.get(group.chordName)
          const rootPc = chord.root || chord.notes[0]
          if (!rootPc) return false
          const noteName = getNoteName(tuningArr[note.string], note.fret)
          return Note.pitchClass(noteName) === Note.pitchClass(rootPc)
        })()
        
        const y = stringY(note.string)

        const isEditing = editingId === note.id
        const isSelected = selectedIds.has(note.id)
        const isLegatoSource = legatoSourceId === note.id

        const labelColor = ColorService.getContrastColor(color)

        return (
          <group key={note.id} renderOrder={8}>
            {note.legatoNext && (
              <LegatoLine sourceId={note.id} destId={note.legatoNext} noteColor={(n) => getNoteColor(n, true)} legatoSourceId={legatoSourceId} invStretchX={invStretchX} />
            )}
            <group position={[cx, y, 0]}>
              {/* Selection Border */}
              {isSelected && !isEditing && (
                <mesh geometry={getBorderGeo(w)} position={[0, 0, -0.005]}>
                  <meshBasicMaterial color={SEL_COL} />
                </mesh>
              )}

              {/* Main Body mesh (covers entire width for background) */}
              <mesh geometry={getNoteGeo(w)} renderOrder={8}>
                {isFundamental ? <BlinkMaterial color={color} /> : <meshBasicMaterial color={color} />}
              </mesh>

              {/* Anatomy Elements */}
              {showBubbles && (
                <>
                  {/* Bubble Prev */}
                  <mesh 
                    position={[-w/2 + bubbleOff, 0, 0.01]} 
                    geometry={bubbleGeo}
                    scale={[invStretchX, 1, 1]}
                    renderOrder={9}
                  >
                    <meshBasicMaterial color={isLegatoSource ? SEL_COL : labelColor} transparent opacity={0.9} />
                  </mesh>

                  {/* Bubble Next */}
                  <mesh 
                    position={[w/2 - bubbleOff, 0, 0.01]} 
                    geometry={bubbleGeo}
                    scale={[invStretchX, 1, 1]}
                    renderOrder={9}
                  >
                    <meshBasicMaterial color={isLegatoSource ? SEL_COL : labelColor} transparent opacity={0.9} />
                  </mesh>

                  {/* Render + Behavior buttons */}
                  {note.legatoNext && (() => {
                    const btnW = (28 * 2 + 4) * (1 / pxPerWUX) // Total width of 2 buttons + gap in WU
                    const camL = scrollX - halfW
                    const camR = scrollX + halfW
                    const podL = note.startBeat * BEAT_W
                    const podR = podL + w
                    
                    // Stick to camera left but stay within pod bounds
                    // We want the buttons to stay visible if any part of the pod is visible
                    const targetX = Math.max(podL, Math.min(podR - btnW, camL + 0.1 * invStretchX))
                    const relativeX = targetX - cx

                    return (
                      <group position={[relativeX, 0, 0.1]}>
                        <Html 
                          position={[0, 0.7, 0]} 
                          style={{ 
                            pointerEvents: 'auto',
                            transform: 'none', // Use standard alignment
                            display: 'flex',
                            width: 'max-content'
                          }} 
                          zIndexRange={[90, 90]}
                        >
                          <div 
                            style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
                            onPointerDown={e => e.stopPropagation()} // Block R3F pointer events
                          >
                            <LegatoActionBtn
                              color={color}
                              icon="merge"
                              onClick={() => { pushHistory(); renderLegato(note.id) }}
                            />
                            <LegatoActionBtn
                              color={color}
                              icon={BEHAVIORS[note.legatoBehavior || 'chromatique'].icon}
                              onClick={() => {
                                setPopoverLegatoId(note.id)
                                setPopoverVisible(true)
                              }}
                            />
                          </div>
                        </Html>
                      </group>
                    )
                  })()}
                </>
              )}

              {/* Fret Label */}
              {showFretLabel && (
                <Html position={[labelLX, 0, 0.02]} center style={{ pointerEvents: 'none', cursor: 'inherit' }}>
                  <div style={{ width: `${clipW * pxPerWUX}px`, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                    <span className="tab-r3f-fret-label" style={{ color: labelColor }}>{note.fret}</span>
                  </div>
                </Html>
              )}

              {/* Note Name */}
              {showNoteName && (
                <Html position={[nameLX, 0, 0.02]} center style={{ pointerEvents: 'none', cursor: 'inherit' }}>
                  <div style={{ width: `${clipW * pxPerWUX}px`, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                    <span className="tab-r3f-fret-label" style={{ color: labelColor, opacity: 0.6 }}>
                      {Note.pitchClass(getNoteName(tuningArr[note.string], note.fret))}
                    </span>
                  </div>
                </Html>
              )}

              {/* Interaction Overlay */}
              <mesh position={[0, 0, 0.05]}
                onPointerDown={e => onNoteDown(e, note)}
                onPointerMove={e => {
                  if (drag.current) return
                  const lx = e.point.x - note.startBeat * BEAT_W
                  gl.domElement.style.cursor = zoneCursor(noteZone(lx, w, invStretchX))
                }}
                onPointerEnter={e => {
                  const lx = e.point.x - note.startBeat * BEAT_W
                  gl.domElement.style.cursor = zoneCursor(noteZone(lx, w, invStretchX))
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
                  if (isIntermediate && sourceNote) {
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
                <Html center style={{ pointerEvents: 'auto' }}>
                  <input className="tab-r3f-fret-input" value={inputVal} autoFocus maxLength={3}
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

      {/* Playback Indicator */}
      <group position={[playbackBeat * BEAT_W, 0, 0.2]} 
        renderOrder={10}
        onPointerDown={(e) => {
          e.stopPropagation()
          // Start dragging playback beat
          drag.current = { kind: 'playback-beat' }
          // @ts-ignore
          gl.domElement.setPointerCapture(e.pointerId)
        }}
        onPointerEnter={() => { if (!drag.current) gl.domElement.style.cursor = 'pointer' }}
        onPointerLeave={() => { if (!drag.current) gl.domElement.style.cursor = 'default' }}
      >
        {/* Hit area (invisible) */}
        <mesh>
          <planeGeometry args={[0.6, gridTop - gridBottom + 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        
        {/* Vertical Bar */}
        <mesh position={[0, (gridTop + gridBottom) / 2, -0.1]} scale={[invStretchX, 1, 1]}>
          <planeGeometry args={[3 / 100, gridTop - gridBottom + 0.5]} />
          <meshBasicMaterial color={APPLE_GREEN} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Playback Arrow (Triangle pointing down) */}
        <mesh position={[0, gridTop - 0.15, 0.1]} rotation={[0, 0, Math.PI]} scale={[invStretchX, 1, 1]}>
          <coneGeometry args={[0.2, 0.3, 3]} />
          <meshBasicMaterial color={APPLE_GREEN} />
        </mesh>
      </group>

      {/* Legato Behavior Popover */}
      {popoverVisible && popoverLegatoId && (() => {
        const note = notes.find(n => n.id === popoverLegatoId)
        if (!note) return null
        const behavior = note.legatoBehavior || 'chromatique'
        const curIdx = BEHAVIOR_KEYS.indexOf(behavior)
        const y = stringY(note.string)
        const x = note.startBeat * BEAT_W
        
        return (
          <Html position={[x, y + 0.7, 0.2]} center style={{ pointerEvents: 'auto' }} zIndexRange={[100, 100]}>
             <div 
               className="legato-popover visible"
               onMouseLeave={() => setPopoverVisible(false)}
               onPointerDown={e => e.stopPropagation()}
             >
               <button className="pop-nav" onClick={() => {
                 const nextIdx = (curIdx - 1 + BEHAVIOR_KEYS.length) % BEHAVIOR_KEYS.length
                 setLegatoBehavior(note.id, BEHAVIOR_KEYS[nextIdx], tuningArr, scaleNotes)
               }}>
                 <span className="material-symbols-outlined">chevron_left</span>
               </button>
               <div className="pop-behavior-info">
                  <span className="material-symbols-outlined pop-icon">{BEHAVIORS[behavior].icon}</span>
                  <span className="pop-name">{BEHAVIORS[behavior].name}</span>
               </div>
               <button className="pop-nav" onClick={() => {
                 const nextIdx = (curIdx + 1) % BEHAVIOR_KEYS.length
                 setLegatoBehavior(note.id, BEHAVIOR_KEYS[nextIdx], tuningArr, scaleNotes)
               }}>
                 <span className="material-symbols-outlined">chevron_right</span>
               </button>

               <div className="pop-divider" />
               
               <button 
                 className={`pop-toggle${note.legatoAuto !== false ? ' active' : ''}`}
                 onClick={() => setLegatoAuto(note.id, note.legatoAuto === false)}
                 title="Mode Auto"
               >
                 <span className="material-symbols-outlined">sync</span>
               </button>
               <button 
                 className={`pop-toggle${note.legatoChain ? ' active' : ''}`}
                 onClick={() => setLegatoChain(note.id, !note.legatoChain)}
                 title="Mode Chain"
               >
                 <span className="material-symbols-outlined">link</span>
               </button>
             </div>
          </Html>
        )
      })()}

      {/* Viewport rect — layer 1, visible only to minimapCam */}
      <lineLoop ref={viewportRectRef} geometry={viewportRectGeo} frustumCulled={false}>
        <lineBasicMaterial color="#FF9500" />
      </lineLoop>

      {/* Minimap playback cursor — layer 1, wide enough to be visible at minimap scale */}
      <mesh
        ref={minimapCursorRef}
        position={[playbackBeat * BEAT_W, (CAM_HALF_H_TOP - CAM_HALF_H_BOT) / 2, 0.6]}
        frustumCulled={false}
      >
        <planeGeometry args={[1.5, CAM_HALF_H_TOP + CAM_HALF_H_BOT]} />
        <meshBasicMaterial color={APPLE_GREEN} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  )
}

function stringLabel(tuningArr: string[], si: number): string {
  const pc = Note.get(tuningArr[si] ?? '').pc ?? tuningArr[si] ?? '?'
  return si === N_STRINGS - 1 && pc === 'E' ? 'e' : pc
}

export default function TablatureR3F() {
  const [stringYPcts, setStringYPcts] = useState<number[]>([])
  const tuning    = useTablatureStore(s => s.tuning)
  const tuningArr = useMemo(() => tuning.split(','), [tuning])

  const { 
    notes,
    isPlaying, playbackBeat, togglePlayback, setPlaybackBeat, tempo, setTempo, 
    isLooping, setLooping 
  } = useTablatureR3FStore()

  const maxBeat = notes.length > 0 
    ? Math.max(...notes.map(n => n.startBeat + n.duration)) 
    : 0

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
