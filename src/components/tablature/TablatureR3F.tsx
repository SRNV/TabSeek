import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Note } from 'tonal'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import type { TablatureNote } from '../../stores/useTablatureR3FStore'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { useMainStore } from '../../stores/useMainStore'
import { getNoteName, getNoteDegree } from '../../composables/useNoteHelpers'
import './TablatureR3F.scss'

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

const gridTop    = ((N_STRINGS - 1) / 2) * STRING_H + LANE_H / 2 + 0.12
const gridBottom = -gridTop

function stringY(si: number) { return (si - (N_STRINGS - 1) / 2) * STRING_H }
function siFromWorldY(y: number) {
  return Math.max(0, Math.min(N_STRINGS - 1, Math.round(y / STRING_H + (N_STRINGS - 1) / 2)))
}
function snapBeat(v: number) { return Math.round(v / SNAP) * SNAP }
function noteZone(lx: number, w: number): 'resize-left' | 'move' | 'resize-right' {
  if (lx < w * 0.13) return 'resize-left'
  if (lx > w * 0.87) return 'resize-right'
  return 'move'
}
function zoneCursor(z: ReturnType<typeof noteZone>) {
  return z === 'resize-left' ? 'w-resize' : z === 'resize-right' ? 'e-resize' : 'grab'
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

// ── Types ─────────────────────────────────────────────────────────────────────
type DragNote = { kind: 'note'; noteId: string; type: 'move'|'resize-left'|'resize-right'; startX: number; origBeat: number; origDur: number }
type DragRect = { kind: 'rect'; x0: number; y0: number; x1: number; y1: number }
type ClipNote = Pick<TablatureNote, 'string'|'fret'|'duration'> & { startBeat: number }

interface SceneProps { onStringYPcts: (pcts: number[]) => void }

// ── Scene ───────────────────────────────────────────────────────────────────────
function TablatureScene({ onStringYPcts }: SceneProps) {
  const { camera, gl, size, scene } = useThree()
  const { notes, addNote, updateNote, deleteNote, pushHistory, undo, redo } = useTablatureR3FStore()

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
    const o      = camera as THREE.OrthographicCamera
    const halfH  = gridTop + STRING_H * 0.35
    // Init zoom once from aspect ratio, clamped to [ZOOM_MIN, ZOOM_MAX]
    if (visibleMeasRef.current === 0) {
      const autoHalfW = halfH * (size.width / size.height)
      visibleMeasRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (autoHalfW * 2) / MEASURE_W))
    }
    const halfW = (visibleMeasRef.current * MEASURE_W) / 2
    o.top = halfH; o.bottom = -halfH; o.zoom = 1
    if (!o.position.x || o.position.x < halfW) o.position.x = halfW
    o.position.y = 0; o.position.z = 10
    applyCameraW(o, halfW)
    const pcts = Array.from({ length: N_STRINGS }, (_, si) => {
      const wy = stringY(si); return (halfH - wy) / (halfH * 2) * 100
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

  // ── Selection & edit state ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputVal,  setInputVal]  = useState('')
  const newNoteIds = useRef(new Set<string>())

  const clipboard = useRef<ClipNote[]>([])

  const [rectBox, setRectBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  const drag    = useRef<DragNote | DragRect | null>(null)
  // lanePend: tracks a lane mousedown that hasn't moved yet (click → dblclick-create; drag → rect-select)
  const lanePend = useRef<{ si: number; beat: number; startCX: number; startCY: number; startWX: number; startWY: number } | null>(null)

  // ── DOM pointer handlers ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement
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
      return o.position.y + ndc * (o.top - o.bottom) / 2
    }

    function onMove(e: PointerEvent) {
      const d = drag.current

      if (d?.kind === 'note') {
        const dB = (wx(e.clientX) - d.startX) / BEAT_W
        const n  = useTablatureR3FStore.getState().notes.find(n => n.id === d.noteId)
        if (!n) return
        if (d.type === 'move') {
          const newSi   = siFromWorldY(wy(e.clientY))
          const newBeat = constrainMove(snapBeat(d.origBeat + dB), d.origDur, newSi, d.noteId)
          updateNote(d.noteId, { startBeat: newBeat, string: newSi })
        } else if (d.type === 'resize-right') {
          updateNote(d.noteId, { duration: constrainRight(d.origBeat, snapBeat(d.origDur + dB), n.string, d.noteId) })
        } else {
          const { beat, dur } = constrainLeft(d.origBeat + d.origDur, snapBeat(d.origBeat + dB), n.string, d.noteId)
          updateNote(d.noteId, { startBeat: beat, duration: dur })
        }
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

      if (d?.kind === 'rect') {
        const hits = useTablatureR3FStore.getState().notes
          .filter(n => noteInRect(n, d.x0, d.y0, d.x1, d.y1))
          .map(n => n.id)
        setSelectedIds(new Set(hits))
        setRectBox(null)
      }
      // lanePend click-only (no drag) → create note handled in onDblClickLane (R3F)

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
        const minBeat = Math.min(...sel.map(n => n.startBeat))
        clipboard.current = sel.map(n => ({ string: n.string, fret: n.fret, duration: n.duration, startBeat: n.startBeat - minBeat }))
      }
      if (ctrl && e.key === 'v') {
        if (!clipboard.current.length) return
        e.preventDefault()
        pushHistory()
        const all     = useTablatureR3FStore.getState().notes
        const pasteAt = all.length > 0 ? Math.max(...all.map(n => n.startBeat + n.duration)) : 0
        const newIds: string[] = []
        for (const cn of clipboard.current)
          newIds.push(addNote({ ...cn, startBeat: pasteAt + cn.startBeat }))
        setSelectedIds(new Set(newIds))
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
          for (const o of toPush) updateNote(o.id, { startBeat: o.startBeat + n.duration })
          newIds.push(addNote({ string: n.string, fret: n.fret, duration: n.duration, startBeat: copyBeat }))
        }
        setSelectedIds(new Set(newIds))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingId, deleteNote, addNote, pushHistory, undo, redo])

  // ── Edit helpers ──────────────────────────────────────────────────────────────
  function confirmEdit(id: string, val: string) {
    const isNew = newNoteIds.current.has(id)
    newNoteIds.current.delete(id)
    if (val !== '') {
      const fret = parseInt(val, 10)
      if (!isNaN(fret) && fret >= 0 && fret <= 24) { pushHistory(); updateNote(id, { fret }) }
      else if (isNew) { pushHistory(); deleteNote(id) }
    } else if (isNew) { pushHistory(); deleteNote(id) }
    setEditingId(null); setInputVal('')
  }

  // ── Color — selected notes keep degree fill; border added via separate mesh ────
  function noteColor(note: TablatureNote): string {
    if (note.id === editingId) return PEND_COL
    const open = tuningArr[note.string]
    const deg  = open ? getNoteDegree(getNoteName(open, note.fret), scaleNotes) : null
    return deg ? SCALE_COLORS[deg - 1] : OFF_COL
  }

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
    pushHistory()   // one undo step per drag gesture
    setSelectedIds(new Set([note.id]))
    const w  = note.duration * BEAT_W
    const lx = e.point.x - note.startBeat * BEAT_W
    const tp = noteZone(lx, w)
    drag.current = { kind: 'note', noteId: note.id, type: tp, startX: e.point.x, origBeat: note.startBeat, origDur: note.duration }
    gl.domElement.style.cursor = tp === 'move' ? 'grabbing' : zoneCursor(tp)
  }

  // ── Visible measure range ─────────────────────────────────────────────────────
  const halfW     = halfWRef.current
  const leftMeas  = Math.max(0, Math.floor((scrollX - halfW) / MEASURE_W) - 1)
  const rightMeas = Math.min(totalMeasures - 1, Math.ceil((scrollX + halfW) / MEASURE_W) + 1)
  const measLabelY = gridTop + 0.20

  return (
    <>
      {/* Lane backgrounds */}
      {Array.from({ length: N_STRINGS }, (_, si) => (
        <mesh key={si} position={[0, stringY(si), -0.04]} geometry={laneBgGeo} material={laneBgMat}
          onPointerDown={e => onLanePointerDown(e, si)}
          onDoubleClick={e => onLaneDblClick(e, si)} />
      ))}

      {/* Grid lines */}
      <lineSegments geometry={beatGeo} material={matBeat} frustumCulled={false} />
      <lineSegments geometry={measGeo} material={matMeas} frustumCulled={false} />

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

      {/* Notes */}
      {notes.map(note => {
        const w     = note.duration * BEAT_W
        const cx    = note.startBeat * BEAT_W + w / 2
        const y     = stringY(note.string)
        const color = noteColor(note)

        return (
          <group key={note.id} position={[cx, y, 0]}>
            {/* Orange border behind body when selected (not while editing) */}
            {selectedIds.has(note.id) && note.id !== editingId && (
              <mesh geometry={getBorderGeo(w)} position={[0, 0, -0.005]}>
                <meshBasicMaterial color={SEL_COL} />
              </mesh>
            )}
            <mesh geometry={getNoteGeo(w)}>
              <meshBasicMaterial color={color} />
            </mesh>

            <mesh position={[0, 0, 0.02]}
              onPointerDown={e => onNoteDown(e, note)}
              onPointerMove={e => {
                if (drag.current) return
                gl.domElement.style.cursor = zoneCursor(noteZone(e.point.x - note.startBeat * BEAT_W, w))
              }}
              onPointerEnter={e => {
                gl.domElement.style.cursor = zoneCursor(noteZone(e.point.x - note.startBeat * BEAT_W, w))
              }}
              onPointerLeave={() => { if (!drag.current) gl.domElement.style.cursor = 'default' }}
              onDoubleClick={e => {
                e.stopPropagation()
                setEditingId(note.id); setInputVal(String(note.fret)); setSelectedIds(new Set([note.id]))
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

            {editingId === note.id ? (
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
            ) : (
              <Html center style={{ pointerEvents: 'none' }}>
                <span className="tab-r3f-fret-label">{note.fret}</span>
              </Html>
            )}
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
    </>
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
