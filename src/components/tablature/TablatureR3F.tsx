import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame, extend } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html, Line, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Note, Chord } from 'tonal'
import { numeralToChordName } from '../../utils/chordUtils'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import type { TablatureNote, ChordGroup, ProgressionGroup } from '../../stores/useTablatureR3FStore'
import type { ChordProgression } from '../../composables/progressions'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { useMainStore } from '../../stores/useMainStore'
import { getNoteName, getNoteDegree } from '../../composables/useNoteHelpers'
import './TablatureR3F.scss'

const BEHAVIORS: Record<LegatoBehavior, { name: string, icon: string }> = {
  'demi-tons': { name: 'Demi-tons', icon: '🎹' },
  'tierces':   { name: 'Tierces',   icon: '3️⃣' },
  'quintes':   { name: 'Quintes',   icon: '5️⃣' },
  'septiemes': { name: 'Septièmes', icon: '7️⃣' },
  'octaves':   { name: 'Octaves',   icon: '8️⃣' },
  'free':      { name: 'Free',      icon: '➰' },
  'gamme':     { name: 'Gamme',     icon: '🎼' },
}
const BEHAVIOR_KEYS = Object.keys(BEHAVIORS) as LegatoBehavior[]

// ── Constants ──────────────────────────────────────────────────────────────────
const N_STRINGS      = 6
const STRING_H       = 1.2
const GAP_WU         = 0.05
const LANE_H         = STRING_H - GAP_WU
const NOTE_H         = LANE_H * 0.87
const BEAT_W         = 3.0
const SNAP           = 0.25
const MIN_DUR        = 0.25
const BEATS_PER_MEAS = 4
const MEASURE_W      = BEATS_PER_MEAS * BEAT_W

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

// ── Progression / chord helpers ───────────────────────────────────────────────
function findFretForPc(openNote: string, targetPc: string): number {
  for (let f = 0; f <= 24; f++)
    if (Note.pitchClass(getNoteName(openNote, f)) === targetPc) return f
  return 0
}

function stringY(si: number) { return (si - (N_STRINGS - 1) / 2) * STRING_H }
function siFromWorldY(y: number) {
  return Math.max(0, Math.min(N_STRINGS - 1, Math.round(y / STRING_H + (N_STRINGS - 1) / 2)))
}
function snapBeat(v: number) { return Math.round(v / SNAP) * SNAP }
const BUBBLE_W = 0.25
function noteZone(lx: number, w: number): 'resize-left' | 'bubble-prev' | 'fret' | 'name' | 'move' | 'bubble-next' | 'resize-right' {
  const p = lx / w
  if (p < 0.05) return 'resize-left'
  if (p < 0.10) return 'bubble-prev'
  if (p < 0.20) return 'fret'
  if (p < 0.30) return 'name'
  if (p > 0.95) return 'resize-right'
  if (p > 0.90) return 'bubble-next'
  return 'move'
}
function zoneCursor(z: ReturnType<typeof noteZone>) {
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

// ── Collision helpers ──────────────────────────────────────────────────────────
function constrainMove(wantedBeat: number, dur: number, si: number, id: string) {
  const center = wantedBeat + dur / 2
  let lo = 0, hi = 1e9
  for (const o of useTablatureR3FStore.getState().notes) {
    if (o.id === id || o.string !== si) continue
    if (o.startBeat + o.duration / 2 < center) lo = Math.max(lo, o.startBeat + o.duration)
    else                                         hi = Math.min(hi, o.startBeat - dur)
  }
  return Math.max(lo, Math.min(hi, wantedBeat))
}
function constrainRight(beat: number, wantedDur: number, si: number, id: string) {
  let max = 1e9
  for (const o of useTablatureR3FStore.getState().notes)
    if (o.id !== id && o.string === si && o.startBeat >= beat)
      max = Math.min(max, o.startBeat - beat)
  return Math.max(MIN_DUR, Math.min(max, wantedDur))
}
function constrainLeft(rightEdge: number, wantedBeat: number, si: number, id: string) {
  let min = 0
  for (const o of useTablatureR3FStore.getState().notes)
    if (o.id !== id && o.string === si && o.startBeat + o.duration <= rightEdge)
      min = Math.max(min, o.startBeat + o.duration)
  const beat = Math.max(min, Math.min(rightEdge - MIN_DUR, wantedBeat))
  return { beat, dur: rightEdge - beat }
}

// Returns the fret on openNote string that gives the exact same MIDI pitch, or null if out of range (0-24)
function findFretForNote(openNote: string, targetNote: string): number | null {
  const targetMidi = Note.midi(targetNote)
  if (targetMidi === null) return null
  for (let f = 0; f <= 24; f++)
    if (Note.midi(getNoteName(openNote, f)) === targetMidi) return f
  return null
}

// Cycles to the next fret (0-24) on the same string that shares the same pitch class
function nextFretSamePc(openNote: string, currentFret: number): number {
  const targetPc = Note.pitchClass(getNoteName(openNote, currentFret))
  const matches: number[] = []
  for (let f = 0; f <= 24; f++)
    if (Note.pitchClass(getNoteName(openNote, f)) === targetPc) matches.push(f)
  if (matches.length <= 1) return currentFret
  return matches[(matches.indexOf(currentFret) + 1) % matches.length]
}

// Returns the maximum allowed dBeat for a chord group move (no overlap with external notes or other groups)
function constrainChordGroupMove(
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>,
  movingNoteIds: Set<string>,
  dBeat: number
): number {
  const state  = useTablatureR3FStore.getState()
  const all    = state.notes
  const groups = state.chordGroups
  let lo = -1e9, hi = 1e9

  const gMin = Math.min(...origNotes.map(n => n.startBeat))
  const gMax = Math.max(...origNotes.map(n => n.startBeat + n.duration))

  // 1. Per-string collision (standard piano roll)
  for (const gn of origNotes) {
    for (const n of all) {
      if (movingNoteIds.has(n.id) || n.string !== gn.string) continue
      if (n.startBeat + n.duration <= gn.startBeat)
        lo = Math.max(lo, n.startBeat + n.duration - gn.startBeat)
      else if (n.startBeat >= gn.startBeat + gn.duration)
        hi = Math.min(hi, n.startBeat - (gn.startBeat + gn.duration))
    }
  }

  // 2. Monolithic chord-chord collision (chords block each other as units)
  for (const other of groups) {
    if (other.noteIds.some(id => movingNoteIds.has(id))) continue
    const otherNotes = all.filter(n => other.noteIds.includes(n.id))
    if (!otherNotes.length) continue
    const oMin = Math.min(...otherNotes.map(n => n.startBeat))
    const oMax = Math.max(...otherNotes.map(n => n.startBeat + n.duration))

    if (oMax <= gMin) lo = Math.max(lo, oMax - gMin)
    else if (oMin >= gMax) hi = Math.min(hi, oMin - gMax)
  }

  return Math.max(lo, Math.min(hi, dBeat))
}

// Returns a darkened, slightly-more-saturated version of a hex color for text on that pod
function darkenPodColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (delta !== 0) {
    if (max === r)      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / delta + 2) / 6
    else                h = ((r - g) / delta + 4) / 6
  }
  const newL = Math.max(0.16, l * 0.30)
  const newS = Math.min(1, s + 0.15)
  return `hsl(${Math.round(h * 360)},${Math.round(newS * 100)}%,${Math.round(newL * 100)}%)`
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), hw = w / 2, hh = h / 2
  s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh)
  s.quadraticCurveTo(hw, -hh, hw, -hh + r); s.lineTo(hw, hh - r)
  s.quadraticCurveTo(hw, hh, hw - r, hh); s.lineTo(-hw + r, hh)
  s.quadraticCurveTo(-hw, hh, -hw, hh - r); s.lineTo(-hw, -hh + r)
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
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

// ── Legato Material ──────────────────────────────────────────────────────────
const LegatoMaterial = shaderMaterial(
  { uTime: 0 },
  // Vertex Shader
  `
  attribute vec3 aCenterPos;
  attribute vec3 aPerp;
  attribute vec3 aColor;
  attribute float aGlobalU;
  uniform float uTime;
  varying float vV;
  varying float vGlobalU;
  varying vec3 vColor;
  void main() {
    vV = uv.y;
    vGlobalU = aGlobalU;
    vColor = aColor;
    // Traveling wave traveling from start→end at 0.8 Hz (matching Fretboard)
    float wavePos = fract(uTime * 0.8);
    float dist    = abs(aGlobalU - wavePos);
    float bell    = max(0.0, 1.0 - dist * 6.0);  // non-zero over ~1/6 of path
    float wScale  = 1.0 + 0.9 * bell * bell;     // 1.0 → 1.9 at wave peak
    gl_Position = projectionMatrix * modelViewMatrix * vec4(aCenterPos + aPerp * wScale, 1.0);
  }
  `,
  // Fragment Shader
  `
  varying float vV;
  varying vec3 vColor;
  void main() {
    float edge = abs(vV - 0.5) * 2.0;        // 0 = centre, 1 = outer edge
    // Orange border matching Fretboard style
    float borderT = smoothstep(0.55, 0.80, edge);
    vec3  orange  = vec3(1.0, 0.584, 0.0);      // #FF9500
    vec3  color   = mix(vColor, orange, borderT);
    // Glow effect: stronger in the middle, fades at edges
    float alpha   = (1.0 - smoothstep(0.82, 1.0, edge)) * 0.92;
    gl_FragColor  = vec4(color, alpha);
  }
  `
)
extend({ LegatoMaterial })

function LegatoLine({ sourceId, destId, noteColor, legatoSourceId }: { 
  sourceId: string; 
  destId: string;
  noteColor: (n: TablatureNote) => string;
  legatoSourceId: string | null;
}) {
  const notes = useTablatureR3FStore(s => s.notes)
  const source = notes.find(n => n.id === sourceId)
  const dest = notes.find(n => n.id === destId)
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current?.material) {
      (meshRef.current.material as any).uTime = state.clock.getElapsedTime()
    }
  })

  const geo = useMemo(() => {
    if (!source || !dest) return null
    
    // Collect all waypoints and their colors
    const chain: THREE.Vector3[] = []
    const chainColors: THREE.Color[] = []
    const getC = (n: TablatureNote) => new THREE.Color(noteColor(n))

    const addPoint = (p: THREE.Vector3, col: THREE.Color) => {
      const last = chain[chain.length - 1]
      if (!last || last.distanceTo(p) > 0.05) {
        chain.push(p)
        chainColors.push(col)
      }
    }

    // 1. Source Bubble Next
    addPoint(new THREE.Vector3((source.startBeat + source.duration * 0.925) * BEAT_W, stringY(source.string), 0), getC(source))
    
    // 2. Intermediate notes
    if (source.intermediateNoteIds) {
      // Ensure sorted order for the line
      const sortedInt = source.intermediateNoteIds
        .map(id => notes.find(x => x.id === id))
        .filter(Boolean)
        .sort((a, b) => a!.startBeat - b!.startBeat)

      for (const n of sortedInt) {
        const nw = n!.duration * BEAT_W
        const ncx = n!.startBeat * BEAT_W + nw / 2
        const ny = stringY(n!.string)
        const col = getC(n!)
        addPoint(new THREE.Vector3(ncx - nw/2 + 0.075 * nw, ny, 0), col)
        addPoint(new THREE.Vector3(ncx + nw/2 - 0.075 * nw, ny, 0), col)
      }
    }
    
    // 3. Destination Bubble Prev
    const dw = dest.duration * BEAT_W
    const dcx = dest.startBeat * BEAT_W + dw / 2
    addPoint(new THREE.Vector3(dcx - dw/2 + 0.075 * dw, stringY(dest.string), 0), getC(dest))
    
    if (chain.length < 2) return null
    const curve = new THREE.CatmullRomCurve3(chain, false, 'centripetal')
    const SUBDIVISIONS = Math.max(40, chain.length * 10)
    const nV = (SUBDIVISIONS + 1) * 2
    const geometry = new THREE.BufferGeometry()
    
    const pos = new Float32Array(nV * 3)
    const centerPos = new Float32Array(nV * 3)
    const perp = new Float32Array(nV * 3)
    const colorAttr = new Float32Array(nV * 3)
    const globalU = new Float32Array(nV)
    const uvs = new Float32Array(nV * 2)
    const indices: number[] = []
    
    const halfW = 0.12
    const tmpCol = new THREE.Color()

    for (let i = 0; i <= SUBDIVISIONS; i++) {
      const t = i / SUBDIVISIONS
      const p = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      
      // Color interpolation along the chain
      const colorT = t * (chainColors.length - 1)
      const cIdx = Math.min(chainColors.length - 2, Math.floor(colorT))
      const cFrac = colorT - cIdx
      tmpCol.copy(chainColors[cIdx]).lerp(chainColors[cIdx + 1], cFrac)

      const ux = -tangent.y
      const uy = tangent.x

      const base = i * 2
      for (let j = 0; j < 2; j++) {
        const side = j === 0 ? -1 : 1
        const vIdx = base + j
        pos.set([p.x + ux * halfW * side, p.y + uy * halfW * side, -0.02], vIdx * 3)
        centerPos.set([p.x, p.y, -0.02], vIdx * 3)
        perp.set([ux * halfW * side, uy * halfW * side, 0], vIdx * 3)
        colorAttr.set([tmpCol.r, tmpCol.g, tmpCol.b], vIdx * 3)
        globalU[vIdx] = t
        uvs.set([t, j], vIdx * 2)
      }
    }

    for (let i = 0; i < SUBDIVISIONS; i++) {
      const b = i * 2
      indices.push(b, b+1, b+2, b+2, b+1, b+3)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aCenterPos', new THREE.BufferAttribute(centerPos, 3))
    geometry.setAttribute('aPerp', new THREE.BufferAttribute(perp, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colorAttr, 3))
    geometry.setAttribute('aGlobalU', new THREE.BufferAttribute(globalU, 1))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    return geometry
  }, [source, dest, notes, legatoSourceId, noteColor])

  if (!geo) return null

  return (
    <mesh ref={meshRef} geometry={geo} renderOrder={6}>
      {/* @ts-ignore */}
      <legatoMaterial transparent depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Legato Behavior Bubble with Pulse ─────────────────────────────────────────
function LegatoBehaviorBubble({ color, onClick }: { color: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <Html position={[0, 0.7, 0]} center>
      <div 
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: color,
          border: '1.5px solid #888',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
          transform: hovered ? 'scale(1.44)' : 'scale(1.2)', // 1.2 base scale, 1.2 * 1.2 = 1.44 on hover
          boxShadow: hovered ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
          pointerEvents: 'auto'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      />
    </Html>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type DragNote = { kind: 'note'; noteId: string; type: ReturnType<typeof noteZone>; startX: number; origBeat: number; origDur: number; origSi: number; origFret: number }
type DragRect = { kind: 'rect'; x0: number; y0: number; x1: number; y1: number }
type DragChordGroup = {
  kind: 'chord-group'
  type: 'move'|'resize-left'|'resize-right'
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
  type: 'move'|'resize-left'|'resize-right'
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

  useFrame(({ clock }) => { material.uniforms.u_time.value = clock.getElapsedTime() })

  return <primitive object={material} attach="material" />
}

interface SceneProps { onStringYPcts: (pcts: number[]) => void }

// ── Scene ───────────────────────────────────────────────────────────────────────
function TablatureScene({ onStringYPcts }: SceneProps) {
  const { camera, gl, size, scene } = useThree()
  const { 
    notes, chordGroups, progressionGroups, 
    addNote, updateNote, deleteNote, 
    addChordGroup, removeChordGroup, 
    addProgressionGroup, updateProgressionGroup, 
    removeProgressionGroup, 
    setLegato, setLegatoBehavior, addLegatoIntermediate, pushHistory, undo, redo 
  } = useTablatureR3FStore()

  const [legatoSourceId, setLegatoSourceId] = useState<string | null>(null)
  const [popoverLegatoId, setPopoverLegatoId] = useState<string | null>(null)
  const [popoverVisible, setPopoverVisible] = useState(false)

  function addLegato(sourceId: string, destId: string) {
    pushHistory()
    setLegato(sourceId, destId, 2, tuningArr)
    // Immediately sync with behavior (default 'demi-tons')
    syncLegato(sourceId, tuningArr, scaleNotes)
  }

  const userScale  = useMainStore(s => s.userScale)
  const modeObject = useMainStore(s => s.modeObject)
  const tuning     = useTablatureStore(s => s.tuning)

  const tuningArr  = useMemo(() => tuning.split(','), [tuning])
  const scaleNotes = useMemo(
    () => (modeObject.intervals as string[]).map(iv => Note.transpose(userScale, iv)),
    [userScale, modeObject]
  )

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
    // Init zoom once from aspect ratio, clamped to [ZOOM_MIN, ZOOM_MAX]
    if (visibleMeasRef.current === 0) {
      const avgHalfH = (CAM_HALF_H_TOP + CAM_HALF_H_BOT) / 2
      const autoHalfW = avgHalfH * (size.width / size.height)
      visibleMeasRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (autoHalfW * 2) / MEASURE_W))
    }
    const halfW = (visibleMeasRef.current * MEASURE_W) / 2
    // Asymmetric frustum: extra space at bottom for info lane
    o.top = CAM_HALF_H_TOP; o.bottom = -CAM_HALF_H_BOT; o.zoom = 1
    if (!o.position.x || o.position.x < halfW) o.position.x = halfW
    o.position.y = 0; o.position.z = 10
    applyCameraW(o, halfW)
    // Screen % from top: (camTop - worldY) / totalCamH
    const camH = CAM_HALF_H_TOP + CAM_HALF_H_BOT
    const pcts = Array.from({ length: N_STRINGS }, (_, si) => {
      const wy = stringY(si); return (CAM_HALF_H_TOP - wy) / camH * 100
    })
    onStringYPcts(pcts)
  }, [camera, size, onStringYPcts])

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
      const scalePc = Note.pitchClass(userScale)

      const { addNote: add, addChordGroup: addGrp, addProgressionGroup: addProg, pushHistory: ph } = useTablatureR3FStore.getState()
      ph()
      const tuning = useTablatureStore.getState().tuning.split(',')
      const addedGroupIds: string[] = []

      prog.numerals.split('-').forEach((numeral, ci) => {
        const startBeat = beat + ci * CHORD_DUR
        const chordName = numeralToChordName(numeral, scalePc)
        const notesPc   = Chord.get(chordName).notes
        const addedIds: string[] = []
        notesPc.forEach((pc, j) => {
          const targetSi = si + j
          if (targetSi >= N_STRINGS) return
          const fret = findFretForPc(tuning[targetSi], pc)
          addedIds.push(add({ string: targetSi, startBeat, duration: CHORD_DUR, fret }))
        })
        if (addedIds.length > 0) {
          const gId = addGrp(addedIds, chordName)
          addedGroupIds.push(gId)
        }
      })

      if (addedGroupIds.length > 0) {
        addProg(addedGroupIds, prog.name || 'Progression')
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

  // ── Selection & edit state ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputVal,  setInputVal]  = useState('')
  const newNoteIds = useRef(new Set<string>())

  const clipboard = useRef<ClipData>({ notes: [], groups: [] })

  const [rectBox, setRectBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  const drag    = useRef<DragNote | DragRect | DragChordGroup | DragProgGroup | DragNewProg | null>(null)
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
      if (!d) return

      if (d.kind === 'note') {
        if (d.type === 'bubble-next' || d.type === 'bubble-prev') return
        const dB = (wx(e.clientX) - d.startX) / BEAT_W
        const n  = useTablatureR3FStore.getState().notes.find(n => n.id === d.noteId)
        if (!n) return
        if (d.type === 'move') {
          const newSi   = siFromWorldY(wy(e.clientY))
          const newBeat = constrainMove(snapBeat(d.origBeat + dB), d.origDur, newSi, d.noteId)
          // Pitch-preserving fret when changing string inside a chord group
          let newFret: number | undefined
          if (newSi !== n.string) {
            const inGroup = useTablatureR3FStore.getState().chordGroups.some(g => g.noteIds.includes(d.noteId))
            if (inGroup) {
              const tun    = useTablatureStore.getState().tuning.split(',')
              const pitch  = getNoteName(tun[d.origSi], d.origFret)
              const found  = newSi === d.origSi ? d.origFret : findFretForNote(tun[newSi], pitch)
              newFret = found !== null ? found : d.origFret
            }
          }
          updateNote(d.noteId, { startBeat: newBeat, string: newSi, ...(newFret !== undefined && { fret: newFret }) }, tuningArr, scaleNotes)
        } else if (d.type === 'resize-right') {
          updateNote(d.noteId, { duration: constrainRight(d.origBeat, snapBeat(d.origDur + dB), n.string, d.noteId) }, tuningArr, scaleNotes)
        } else {
          const { beat, dur } = constrainLeft(d.origBeat + d.origDur, snapBeat(d.origBeat + dB), n.string, d.noteId)
          updateNote(d.noteId, { startBeat: beat, duration: dur }, tuningArr, scaleNotes)
        }
      } else if (d?.kind === 'chord-group') {
        const worldX = wx(e.clientX)
        const origW  = d.origGroupEnd - d.origGroupStart
        if (!d.didMove) { pushHistory(); (drag.current as DragChordGroup).didMove = true }
        if (d.type === 'move') {
          const rawDelta = snapBeat((worldX - d.startX) / BEAT_W)
          const groupIds = new Set(d.origNotes.map(n => n.id))
          const dBeat    = constrainChordGroupMove(d.origNotes, groupIds, rawDelta)
          for (const n of d.origNotes)
            updateNote(n.id, { startBeat: Math.max(0, n.startBeat + dBeat) }, tuningArr, scaleNotes)
        } else if (d.type === 'resize-right') {
          const newEnd = Math.max(d.origGroupStart + MIN_DUR * d.origNotes.length, snapBeat(worldX / BEAT_W))
          const newW   = newEnd - d.origGroupStart
          for (const n of d.origNotes) {
            const relStart = (n.startBeat - d.origGroupStart) / origW
            updateNote(n.id, { startBeat: d.origGroupStart + relStart * newW, duration: Math.max(MIN_DUR, (n.duration / origW) * newW) }, tuningArr, scaleNotes)
          }
        } else {
          const newStart = Math.max(0, Math.min(d.origGroupEnd - MIN_DUR, snapBeat(worldX / BEAT_W)))
          const newW     = d.origGroupEnd - newStart
          for (const n of d.origNotes) {
            const relFromRight = (d.origGroupEnd - (n.startBeat + n.duration)) / origW
            const newDur  = Math.max(MIN_DUR, (n.duration / origW) * newW)
            updateNote(n.id, { startBeat: Math.max(0, d.origGroupEnd - relFromRight * newW - newDur), duration: newDur }, tuningArr, scaleNotes)
          }
        }
      } else if (d?.kind === 'prog-group') {
        const worldX = wx(e.clientX)
        const origW  = d.origProgEnd - d.origProgStart
        if (!d.didMove) { pushHistory(); (drag.current as DragProgGroup).didMove = true }
        if (d.type === 'move') {
          const rawDelta = snapBeat((worldX - d.startX) / BEAT_W)
          const groupNoteIds = new Set(d.origNotes.map(n => n.id))
          const dBeat = constrainChordGroupMove(d.origNotes, groupNoteIds, rawDelta)
          for (const n of d.origNotes)
            updateNote(n.id, { startBeat: Math.max(0, n.startBeat + dBeat) }, tuningArr, scaleNotes)
        } else if (d.type === 'resize-right') {
          const newEnd = Math.max(d.origProgStart + MIN_DUR, snapBeat(worldX / BEAT_W))
          const newW   = newEnd - d.origProgStart
          for (const n of d.origNotes) {
            const relStart = (n.startBeat - d.origProgStart) / origW
            updateNote(n.id, { startBeat: d.origProgStart + relStart * newW, duration: Math.max(MIN_DUR, (n.duration / origW) * newW) }, tuningArr, scaleNotes)
          }
        } else {
          const newStart = Math.max(0, Math.min(d.origProgEnd - MIN_DUR, snapBeat(worldX / BEAT_W)))
          const newW     = d.origProgEnd - newStart
          for (const n of d.origNotes) {
            const relFromRight = (d.origProgEnd - (n.startBeat + n.duration)) / origW
            const newDur  = Math.max(MIN_DUR, (n.duration / origW) * newW)
            updateNote(n.id, { startBeat: Math.max(0, d.origProgEnd - relFromRight * newW - newDur), duration: newDur }, tuningArr, scaleNotes)
          }
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
  }, [camera, gl, updateNote])

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
        ids.forEach(id => deleteNote(id))
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
      const fret = parseInt(val, 10)
      if (!isNaN(fret) && fret >= 0 && fret <= 24) { pushHistory(); updateNote(id, { fret }, tuningArr, scaleNotes) }
      else if (isNew) { pushHistory(); deleteNote(id) }
    } else if (isNew) { pushHistory(); deleteNote(id) }
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
  const geoCache    = useRef(new Map<number, THREE.ShapeGeometry>())
  const borderCache = useRef(new Map<number, THREE.ShapeGeometry>())
  useEffect(() => () => {
    geoCache.current.forEach(g => g.dispose())
    borderCache.current.forEach(g => g.dispose())
  }, [])
  // r = min(half-width, NOTE_R_MAX) → same visual ratio on all note widths
  function noteR(w: number) { return Math.min(w / 2, NOTE_R_MAX) }
  function getNoteGeo(w: number) {
    let g = geoCache.current.get(w)
    if (!g) { g = new THREE.ShapeGeometry(roundedRect(w, NOTE_H, noteR(w)), 4); geoCache.current.set(w, g) }
    return g
  }
  function getBorderGeo(w: number) {
    let g = borderCache.current.get(w)
    if (!g) {
      const bw = w + SEL_PAD * 2
      g = new THREE.ShapeGeometry(roundedRect(bw, NOTE_H + SEL_PAD * 2, Math.min(bw / 2, NOTE_R_MAX + SEL_PAD)), 4)
      borderCache.current.set(w, g)
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
      const r  = Math.min(CHORD_R + (border ? CHORD_BORDER_WU : 0), bw / 2, bh / 2)
      g = new THREE.ShapeGeometry(roundedRect(bw, bh, r), 4)
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
    const type = noteZone(lx, podW)

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
    const type = noteZone(lx, podW)   // reuse same edge-zone logic
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
    const tp = noteZone(lx, w)

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
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, podW))
              }}
              onContextMenu={e => { e.stopPropagation(); pushHistory(); removeProgressionGroup(prog.id) }}
            >
              <planeGeometry args={[podW, podH]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Label in info lane */}
            <Html center position={[0, infoLaneY - podCY, 0.1]} style={{ pointerEvents: 'auto' }}>
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
                <span
                  style={{ fontSize: '11px', fontWeight: 800, color: PROG_BORDER_COL,
                    userSelect: 'none', whiteSpace: 'nowrap', cursor: 'default',
                    background: 'rgba(20,20,20,0.7)', padding: '2px 6px', borderRadius: '4px' }}
                  onMouseEnter={() => setLabelHoveredProgId(prog.id)}
                  onMouseLeave={() => setLabelHoveredProgId(null)}
                  onDoubleClick={() => { setEditingProgId(prog.id); setEditingProgName(prog.name) }}
                >
                  {prog.name}
                </span>
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
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, podW))
              }}
              onContextMenu={e => {
                e.stopPropagation()
                pushHistory()
                group.noteIds.forEach(id => deleteNote(id))
              }}
            >
              <planeGeometry args={[podW, podH]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Chord name in info lane — display only; interactions handled by Three.js hit area below */}
            <Html center position={[0, infoLaneY - podCY, 0.1]} style={{ pointerEvents: 'none' }}>
              <h2
                style={{ margin: 0, padding: 0, fontSize: '12px', fontWeight: 700,
                  color: CHORD_BORDER_COL, userSelect: 'none', whiteSpace: 'nowrap',
                  lineHeight: 1, cursor: 'default' }}
              >
                {group.chordName}
              </h2>
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
              onPointerEnter={() => { setLabelHoveredGroupId(group.id); if (!drag.current) gl.domElement.style.cursor = 'crosshair' }}
              onPointerLeave={() => { setLabelHoveredGroupId(null); if (!drag.current) gl.domElement.style.cursor = 'default' }}
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
        const podWidthPx     = w / (2 * halfW) * gl.domElement.clientWidth
        const showNoteName   = podWidthPx >= 60
        
        // Check if intermediate note of a legato
        const isIntermediate = intermediateIds.has(note.id)
        const sourceNote = isIntermediate ? notes.find(n => n.intermediateNoteIds?.includes(note.id)) : null
        
        const y = stringY(note.string)

        const isEditing = editingId === note.id
        const isSelected = selectedIds.has(note.id)
        const isLegatoSource = legatoSourceId === note.id

        const labelColor = darkenPodColor(color)

        return (
          <group key={note.id} renderOrder={8}>
            {note.legatoNext && (
              <LegatoLine sourceId={note.id} destId={note.legatoNext} noteColor={(n) => getNoteColor(n, true)} legatoSourceId={legatoSourceId} />
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
                <meshBasicMaterial color={color} />
              </mesh>

              {/* Anatomy Elements */}
              {!isIntermediate && (
                <>
                  {/* Bubble Prev */}
                  <mesh 
                    position={[-w/2 + 0.075 * w, 0, 0.01]} 
                    geometry={bubbleGeo}
                    renderOrder={9}
                  >
                    <meshBasicMaterial color={isLegatoSource ? SEL_COL : labelColor} transparent opacity={0.9} />
                  </mesh>

                  {/* Bubble Next */}
                  <mesh 
                    position={[w/2 - 0.075 * w, 0, 0.01]} 
                    geometry={bubbleGeo}
                    renderOrder={9}
                  >
                    <meshBasicMaterial color={isLegatoSource ? SEL_COL : labelColor} transparent opacity={0.9} />
                  </mesh>

                  {/* Stem and Top Bubble for choosing Behavior */}
                  {note.legatoNext && (
                    <group position={[w/2 - 0.075 * w, 0, 0.01]}>
                      {/* Stem hidden as requested */}
                      <LegatoBehaviorBubble 
                        color={color} 
                        onClick={() => {
                          setPopoverLegatoId(note.id)
                          setPopoverVisible(true)
                        }}
                      />
                    </group>
                  )}
                </>
              )}

              {/* Fret Label */}
              <Html position={[-w/2 + 0.15 * w, 0, 0.02]} center style={{ pointerEvents: 'none' }}>
                <span className="tab-r3f-fret-label" style={{ color: labelColor }}>{note.fret}</span>
              </Html>

              {/* Note Name */}
              {showNoteName && (
                <Html position={[-w/2 + 0.25 * w, 0, 0.02]} center style={{ pointerEvents: 'none' }}>
                  <span className="tab-r3f-fret-label" style={{ color: labelColor, opacity: 0.6 }}>
                    {Note.pitchClass(getNoteName(tuningArr[note.string], note.fret))}
                  </span>
                </Html>
              )}

              {/* Interaction Overlay */}
              <mesh position={[0, 0, 0.05]}
                onPointerDown={e => onNoteDown(e, note)}
                onPointerMove={e => {
                  if (drag.current) return
                  const lx = e.point.x - note.startBeat * BEAT_W
                  gl.domElement.style.cursor = zoneCursor(noteZone(lx, w))
                }}
                onPointerEnter={e => {
                  const lx = e.point.x - note.startBeat * BEAT_W
                  gl.domElement.style.cursor = zoneCursor(noteZone(lx, w))
                }}
                onPointerLeave={() => { if (!drag.current) gl.domElement.style.cursor = 'default' }}
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
                  deleteNote(note.id)
                  setSelectedIds(prev => { const s = new Set(prev); s.delete(note.id); return s })
                }}
              >
                <planeGeometry args={[w, LANE_H]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>

              {isEditing && (
                <Html center style={{ pointerEvents: 'auto' }}>
                  <input className="tab-r3f-fret-input" value={inputVal} autoFocus maxLength={2}
                    onChange={ev => setInputVal(ev.target.value.replace(/\D/g, ''))}
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

      {/* Legato Behavior Popover */}
      {popoverLegatoId && (() => {
        const note = notes.find(n => n.id === popoverLegatoId)
        if (!note) return null
        const behavior = note.legatoBehavior || 'demi-tons'
        const curIdx = BEHAVIOR_KEYS.indexOf(behavior)
        const y = stringY(note.string)
        const x = (note.startBeat + note.duration * (1 - 0.075)) * BEAT_W
        
        return (
          <Html position={[x, y + 0.7, 0.2]} center style={{ pointerEvents: 'none' }}>
             <div 
               className={`legato-popover${popoverVisible ? ' visible' : ''}`}
               style={{ pointerEvents: popoverVisible ? 'auto' : 'none' }}
               onMouseLeave={() => setPopoverVisible(false)}
             >
               <button className="pop-nav" onClick={() => {
                 const nextIdx = (curIdx - 1 + BEHAVIOR_KEYS.length) % BEHAVIOR_KEYS.length
                 setLegatoBehavior(note.id, BEHAVIOR_KEYS[nextIdx], tuningArr, scaleNotes)
               }}>◀</button>
               <div className="pop-behavior-info">
                  <span className="pop-icon">{BEHAVIORS[behavior].icon}</span>
                  <span className="pop-name">{BEHAVIORS[behavior].name}</span>
               </div>
               <button className="pop-nav" onClick={() => {
                 const nextIdx = (curIdx + 1) % BEHAVIOR_KEYS.length
                 setLegatoBehavior(note.id, BEHAVIOR_KEYS[nextIdx], tuningArr, scaleNotes)
               }}>▶</button>
             </div>
          </Html>
        )
      })()}
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

  return (
    <div className="tab-r3f-wrap">
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
  )
}
