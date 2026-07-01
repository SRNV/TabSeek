import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import type { TablatureNote, ChordGroup } from '../../../types'
import { BEAT_W, NOTE_H as PODH, MEASURE_W, stringY } from '../../../utils/tabUtils'
import { RhythmModifierService } from '../../../services/RhythmModifierService'
import { ModeZoneService } from '../../../services/ModeZoneService'
import { getNoteName } from '../../../utils/guitarUtils'
import { SEL_COL, LANE_COL_HEX } from './sceneConstants'

const MAX_INSTANCES = 2048
const HALF_H   = PODH / 2
const LEFT_RY  = HALF_H          // left corner Y radius  — full semicircle
const RIGHT_RY = HALF_H * 0.7   // right corner Y radius — 0.35 × PODH (CSS border-radius feel)
const BORDER   = 0.04

// ── Body vertex shader ────────────────────────────────────────────────────────

const BODY_VERT = /* glsl */`
  attribute vec3  a_colorA;
  attribute vec3  a_colorB;
  attribute float a_podLeft;
  attribute float a_podRight;
  attribute float a_blink;
  attribute float a_gray;

  varying vec3  v_colorA;
  varying vec3  v_colorB;
  varying float v_podLeft;
  varying float v_podRight;
  varying float v_blink;
  varying float v_gray;
  varying float vWorldX;
  varying float vLocalY;   // Y relative to instance center (not world origin)

  void main() {
    v_colorA   = a_colorA;
    v_colorB   = a_colorB;
    v_podLeft  = a_podLeft;
    v_podRight = a_podRight;
    v_blink    = a_blink;
    v_gray     = a_gray;
    #ifdef USE_INSTANCING
      vec4 wp = instanceMatrix * vec4(position, 1.0);
      vLocalY  = wp.y - instanceMatrix[3][1];  // subtract instance Y translation
    #else
      vec4 wp = vec4(position, 1.0);
      vLocalY  = wp.y;
    #endif
    vWorldX     = wp.x;
    gl_Position = projectionMatrix * modelViewMatrix * wp;
  }
`

// ── Body fragment shader: gradient + asymmetric elliptic SDF ──────────────────

const BODY_FRAG = /* glsl */`
  uniform float u_gradWidth;
  uniform float u_time;
  uniform vec3  u_laneCol;
  uniform float u_halfH;
  uniform float u_leftRY;
  uniform float u_rightRY;
  uniform float u_invStretchX;

  varying vec3  v_colorA;
  varying vec3  v_colorB;
  varying float v_podLeft;
  varying float v_podRight;
  varying float v_blink;
  varying float v_gray;
  varying float vWorldX;
  varying float vLocalY;

  void main() {
    float halfW = (v_podRight - v_podLeft) * 0.5;
    float cx    = v_podLeft + halfW;
    float px    = vWorldX - cx;
    float py    = vLocalY;
    float ax    = abs(px);
    float ay    = abs(py);

    // Discard outside bounding rect
    if (ax > halfW || ay > u_halfH) discard;

    // Corner radii in world-X (corrected for camera aspect ratio)
    float lrx = u_leftRY  * u_invStretchX;
    float rrx = u_rightRY * u_invStretchX;

    if (px < 0.0) {
      // Left corners — ellipse (lrx, leftRY)
      float bx = max(0.0, halfW   - lrx);
      float by = max(0.0, u_halfH - u_leftRY);
      if (ax > bx && ay > by) {
        float dx = (ax - bx) / lrx;
        float dy = (ay - by) / u_leftRY;
        if (dx * dx + dy * dy > 1.0) discard;
      }
    } else {
      // Right corners — ellipse (rrx, rightRY)
      float bx = max(0.0, halfW   - rrx);
      float by = max(0.0, u_halfH - u_rightRY);
      if (ax > bx && ay > by) {
        float dx = (ax - bx) / rrx;
        float dy = (ay - by) / u_rightRY;
        if (dx * dx + dy * dy > 1.0) discard;
      }
    }

    // Gradient left→right
    float t   = clamp((vWorldX - v_podLeft) / u_gradWidth, 0.0, 1.0);
    vec3  col = mix(v_colorA, v_colorB, t);
    if (v_blink > 0.5) {
      float pulse = (sin(u_time * 12.5663706) + 1.0) * 0.5;
      col = col + (1.0 - col) * 0.40 * pulse;
    }
    col = mix(col, u_laneCol, v_gray);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

// ── Selection border vertex shader ────────────────────────────────────────────

const SEL_VERT = /* glsl */`
  attribute float a_selLeft;
  attribute float a_selRight;

  varying float v_selLeft;
  varying float v_selRight;
  varying float vWorldX;
  varying float vLocalY;

  void main() {
    v_selLeft  = a_selLeft;
    v_selRight = a_selRight;
    #ifdef USE_INSTANCING
      vec4 wp = instanceMatrix * vec4(position, 1.0);
      vLocalY  = wp.y - instanceMatrix[3][1];
    #else
      vec4 wp = vec4(position, 1.0);
      vLocalY  = wp.y;
    #endif
    vWorldX     = wp.x;
    gl_Position = projectionMatrix * modelViewMatrix * wp;
  }
`

// ── Selection border fragment shader: flat SEL_COL + same SDF ────────────────

const SEL_FRAG = /* glsl */`
  uniform float u_halfH;
  uniform float u_leftRY;
  uniform float u_rightRY;
  uniform float u_invStretchX;
  uniform vec3  u_selCol;

  varying float v_selLeft;
  varying float v_selRight;
  varying float vWorldX;
  varying float vLocalY;

  void main() {
    float halfW = (v_selRight - v_selLeft) * 0.5;
    float px    = vWorldX - (v_selLeft + halfW);
    float py    = vLocalY;
    float ax    = abs(px);
    float ay    = abs(py);

    if (ax > halfW || ay > u_halfH) discard;

    float lrx = u_leftRY  * u_invStretchX;
    float rrx = u_rightRY * u_invStretchX;

    if (px < 0.0) {
      float bx = max(0.0, halfW   - lrx);
      float by = max(0.0, u_halfH - u_leftRY);
      if (ax > bx && ay > by) {
        float dx = (ax - bx) / lrx;
        float dy = (ay - by) / u_leftRY;
        if (dx * dx + dy * dy > 1.0) discard;
      }
    } else {
      float bx = max(0.0, halfW   - rrx);
      float by = max(0.0, u_halfH - u_rightRY);
      if (ax > bx && ay > by) {
        float dx = (ax - bx) / rrx;
        float dy = (ay - by) / u_rightRY;
        if (dx * dx + dy * dy > 1.0) discard;
      }
    }

    gl_FragColor = vec4(u_selCol, 1.0);
    #include <colorspace_fragment>
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface PodItem {
  startBeat: number
  duration:  number
  note:      TablatureNote
}

export interface NotePodsInstancedProps {
  notes:          TablatureNote[]
  chordGroups:    ChordGroup[]
  selectedIds:    Set<string>
  invStretchX:    number
  totalMeasures:  number
  tuningArr:      string[]
  DISC_PALETTE:   Record<string, { fill: string; border: string; text: string }>
  getNoteColor:   (note: TablatureNote, skipDarken?: boolean, fretOverride?: number) => string
  onPointerDown:  (e: ThreeEvent<PointerEvent>, note: TablatureNote) => void
  onPointerMove?: (e: ThreeEvent<PointerEvent>, note: TablatureNote) => void
  onPointerLeave?: (e: ThreeEvent<PointerEvent>) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotePodsInstanced({
  notes, chordGroups, selectedIds, invStretchX,
  totalMeasures, tuningArr, DISC_PALETTE,
  getNoteColor, onPointerDown, onPointerMove, onPointerLeave,
}: NotePodsInstancedProps) {

  // ── Refs for the InstancedMesh objects (R3F manages lifecycle) ──
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null!)
  const selMeshRef  = useRef<THREE.InstancedMesh>(null!)

  // ── Plane geometry (unit square, shared) ──
  const planeGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  // ── Body per-instance attribute buffers ──
  const colorABuf   = useMemo(() => new Float32Array(MAX_INSTANCES * 3), [])
  const colorBBuf   = useMemo(() => new Float32Array(MAX_INSTANCES * 3), [])
  const podLeftBuf  = useMemo(() => new Float32Array(MAX_INSTANCES),     [])
  const podRightBuf = useMemo(() => new Float32Array(MAX_INSTANCES),     [])
  const blinkBuf    = useMemo(() => new Float32Array(MAX_INSTANCES),     [])
  const grayBuf     = useMemo(() => new Float32Array(MAX_INSTANCES),     [])

  const colorAAttr   = useMemo(() => new THREE.InstancedBufferAttribute(colorABuf,   3), [colorABuf])
  const colorBAttr   = useMemo(() => new THREE.InstancedBufferAttribute(colorBBuf,   3), [colorBBuf])
  const podLeftAttr  = useMemo(() => new THREE.InstancedBufferAttribute(podLeftBuf,  1), [podLeftBuf])
  const podRightAttr = useMemo(() => new THREE.InstancedBufferAttribute(podRightBuf, 1), [podRightBuf])
  const blinkAttr    = useMemo(() => new THREE.InstancedBufferAttribute(blinkBuf,    1), [blinkBuf])
  const grayAttr     = useMemo(() => new THREE.InstancedBufferAttribute(grayBuf,     1), [grayBuf])

  // ── Selection per-instance attribute buffers ──
  const selLeftBuf  = useMemo(() => new Float32Array(MAX_INSTANCES), [])
  const selRightBuf = useMemo(() => new Float32Array(MAX_INSTANCES), [])
  const selLeftAttr  = useMemo(() => new THREE.InstancedBufferAttribute(selLeftBuf,  1), [selLeftBuf])
  const selRightAttr = useMemo(() => new THREE.InstancedBufferAttribute(selRightBuf, 1), [selRightBuf])

  // ── Body geometry with attributes injected ──
  const bodyGeom = useMemo(() => {
    const g = planeGeo.clone()
    g.setAttribute('a_colorA',   colorAAttr)
    g.setAttribute('a_colorB',   colorBAttr)
    g.setAttribute('a_podLeft',  podLeftAttr)
    g.setAttribute('a_podRight', podRightAttr)
    g.setAttribute('a_blink',    blinkAttr)
    g.setAttribute('a_gray',     grayAttr)
    return g
  }, [planeGeo, colorAAttr, colorBAttr, podLeftAttr, podRightAttr, blinkAttr, grayAttr])

  // ── Selection geometry with attributes injected ──
  const selGeom = useMemo(() => {
    const g = planeGeo.clone()
    g.setAttribute('a_selLeft',  selLeftAttr)
    g.setAttribute('a_selRight', selRightAttr)
    return g
  }, [planeGeo, selLeftAttr, selRightAttr])

  // ── Materials ──
  const bodyMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   BODY_VERT,
    fragmentShader: BODY_FRAG,
    uniforms: {
      u_gradWidth:   { value: MEASURE_W },
      u_time:        { value: 0 },
      u_laneCol:     { value: new THREE.Color(LANE_COL_HEX) },
      u_halfH:       { value: HALF_H },
      u_leftRY:      { value: LEFT_RY },
      u_rightRY:     { value: RIGHT_RY },
      u_invStretchX: { value: 1 },
    },
  }), [])

  const selColVec = useMemo(() => new THREE.Color(SEL_COL), [])
  const selMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   SEL_VERT,
    fragmentShader: SEL_FRAG,
    uniforms: {
      u_halfH:       { value: HALF_H + BORDER },
      u_leftRY:      { value: LEFT_RY + BORDER },
      u_rightRY:     { value: RIGHT_RY + BORDER },
      u_invStretchX: { value: 1 },
      u_selCol:      { value: selColVec },
    },
  }), [selColVec])

  // ── Click → note mapping ──
  const instanceToNote = useRef<TablatureNote[]>([])

  // ── Reusable matrix helpers ──
  const _mat  = useMemo(() => new THREE.Matrix4(),    [])
  const _pos  = useMemo(() => new THREE.Vector3(),    [])
  const _sc   = useMemo(() => new THREE.Vector3(),    [])
  const _quat = useMemo(() => new THREE.Quaternion(), [])

  function setMat(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number) {
    _pos.set(x, y, z); _sc.set(sx, sy, 1)
    _mat.compose(_pos, _quat, _sc)
    mesh.setMatrixAt(i, _mat)
  }

  // ── Sync body instances ──
  useEffect(() => {
    const bodyMesh = bodyMeshRef.current
    if (!bodyMesh) return

    bodyMat.uniforms.u_invStretchX.value = invStretchX
    selMat.uniforms.u_invStretchX.value  = invStretchX

    const items: PodItem[] = []
    for (const note of notes) {
      const subs = RhythmModifierService.getVirtualRhythm(note)
      if (subs) {
        for (const s of subs) items.push({ startBeat: s.startBeat, duration: s.duration, note })
      } else {
        items.push({ startBeat: note.startBeat, duration: note.duration, note })
      }
    }

    const count = Math.min(items.length, MAX_INSTANCES)
    instanceToNote.current = items.slice(0, count).map(i => i.note)

    const colorTmp = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const { startBeat, duration, note } = items[i]
      const w        = duration * BEAT_W
      const y        = stringY(note.string)
      const podLeft  = startBeat * BEAT_W
      const podRight = podLeft + w

      setMat(bodyMesh, i, podLeft + w / 2, y, 0, w, PODH)
      podLeftBuf[i]  = podLeft
      podRightBuf[i] = podRight

      const effFret = ModeZoneService.getVirtualFret(note, totalMeasures) ?? note.fret
      const colorA  = getNoteColor(note, false, effFret)
      colorTmp.set(colorA)
      colorABuf[i * 3]     = colorTmp.r
      colorABuf[i * 3 + 1] = colorTmp.g
      colorABuf[i * 3 + 2] = colorTmp.b

      const colorB = (DISC_PALETTE[colorA] ?? { fill: '#333' }).fill
      colorTmp.set(colorB)
      colorBBuf[i * 3]     = colorTmp.r
      colorBBuf[i * 3 + 1] = colorTmp.g
      colorBBuf[i * 3 + 2] = colorTmp.b

      const group = chordGroups.find(g => g.noteIds.includes(note.id))
      let blink = 0
      if (group) {
        const chord  = Chord.get(group.chordName)
        const rootPc = chord.root || chord.notes[0]
        if (rootPc) {
          const noteName = getNoteName(tuningArr[note.string], effFret)
          blink = Note.pitchClass(noteName) === Note.pitchClass(rootPc) ? 1 : 0
        }
      }
      blinkBuf[i] = blink
    }

    bodyMesh.count = count
    bodyMesh.instanceMatrix.needsUpdate = true
    // InstancedMesh.raycast() caches boundingSphere forever once computed (THREE only
    // recomputes when null) — without this reset, clicks stop hitting pods after the
    // first raycast following any instance-count/position change (RGRS-02).
    bodyMesh.boundingSphere = null
    colorAAttr.needsUpdate  = true
    colorBAttr.needsUpdate  = true
    podLeftAttr.needsUpdate  = true
    podRightAttr.needsUpdate = true
    blinkAttr.needsUpdate   = true
  }, [notes, chordGroups, invStretchX, totalMeasures, tuningArr, getNoteColor, DISC_PALETTE,
      colorABuf, colorBBuf, podLeftBuf, podRightBuf, blinkBuf,
      colorAAttr, colorBAttr, podLeftAttr, podRightAttr, blinkAttr, bodyMat, selMat])

  // ── Sync selection border ──
  useEffect(() => {
    const selMesh = selMeshRef.current
    if (!selMesh) return

    const selNotes = notes.filter(n => selectedIds.has(n.id))
    const count    = Math.min(selNotes.length, MAX_INSTANCES)

    for (let i = 0; i < count; i++) {
      const note     = selNotes[i]
      const w        = note.duration * BEAT_W
      const y        = stringY(note.string)
      const selLeft  = note.startBeat * BEAT_W - BORDER
      const selRight = note.startBeat * BEAT_W + w + BORDER
      const selW     = selRight - selLeft

      setMat(selMesh, i, selLeft + selW / 2, y, -0.005, selW, PODH + 2 * BORDER)
      selLeftBuf[i]  = selLeft
      selRightBuf[i] = selRight
    }

    selMesh.count = count
    selMesh.instanceMatrix.needsUpdate = true
    selMesh.boundingSphere = null
    selLeftAttr.needsUpdate  = true
    selRightAttr.needsUpdate = true
  }, [notes, selectedIds, selLeftBuf, selRightBuf, selLeftAttr, selRightAttr])

  // ── useFrame: animate gray + time uniform ──
  const notesRef = useRef(notes)
  useEffect(() => { notesRef.current = notes }, [notes])

  useFrame((state, delta) => {
    bodyMat.uniforms.u_time.value = state.clock.getElapsedTime()

    const { isPlaying, playbackBeat } = useTablatureR3FStore.getState()
    let dirty = false
    let i = 0

    for (const note of notesRef.current) {
      const subs  = RhythmModifierService.getVirtualRhythm(note)
      const items = subs ?? [{ startBeat: note.startBeat, duration: note.duration }]
      for (const item of items) {
        if (i >= MAX_INSTANCES) break
        const isActive = isPlaying && playbackBeat >= item.startBeat && playbackBeat < item.startBeat + item.duration
        const target   = isPlaying ? (isActive ? 0 : 1) : 0
        const cur      = grayBuf[i]
        const next     = cur + (target - cur) * (1 - Math.pow(0.01, delta / 0.5))
        if (Math.abs(next - cur) > 0.0005) { grayBuf[i] = next; dirty = true }
        i++
      }
    }

    if (dirty) grayAttr.needsUpdate = true
  })

  // ── Disposal on unmount ──
  useEffect(() => () => {
    bodyGeom.dispose(); selGeom.dispose()
    bodyMat.dispose();  selMat.dispose()
  }, [bodyGeom, selGeom, bodyMat, selMat])

  // ── Pointer handlers ──
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const note = instanceToNote.current[e.instanceId ?? -1]
    if (note) onPointerDown(e, note)
  }

  const handlePointerMove = onPointerMove
    ? (e: ThreeEvent<PointerEvent>) => {
        const note = instanceToNote.current[e.instanceId ?? -1]
        if (note) onPointerMove(e, note)
      }
    : undefined

  const handlePointerLeave = onPointerLeave
    ? (e: ThreeEvent<PointerEvent>) => onPointerLeave(e)
    : undefined

  return (
    <>
      <instancedMesh
        ref={selMeshRef}
        args={[selGeom, selMat, MAX_INSTANCES]}
        frustumCulled={false}
        renderOrder={7}
      />
      <instancedMesh
        ref={bodyMeshRef}
        args={[bodyGeom, bodyMat, MAX_INSTANCES]}
        frustumCulled={false}
        renderOrder={8}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </>
  )
}
