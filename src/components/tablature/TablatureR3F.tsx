import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import type { TablatureNote, ChordGroup } from '../../stores/useTablatureR3FStore'
import type { ChordProgression } from '../../composables/progressions'
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

// Info lane — sits below low E, shows chord labels; no notes/pods overlap it
const INFO_LANE_GAP = 0.20              // gap between low E lane and info lane (WU)
const INFO_LANE_H   = LANE_H            // same height as string lanes
const infoLaneY     = gridBottom - INFO_LANE_GAP - INFO_LANE_H / 2
// Asymmetric frustum: top = symmetric, bottom extended to include info lane + margin
const CAM_HALF_H_TOP = gridTop + STRING_H * 0.35
const CAM_HALF_H_BOT = gridTop + INFO_LANE_GAP + INFO_LANE_H + 0.30

const CHORD_DUR       = BEATS_PER_MEAS   // 4 beats per chord slot when dropping a progression
const CHORD_PAD_H     = 0.25            // horizontal padding around chord pod (WU ≈ 5px)
const CHORD_PAD_V     = 0.25            // vertical padding around chord pod (WU ≈ 5px)
const CHORD_R         = 0.28            // chord pod corner radius (WU)
const CHORD_BORDER_WU = 0.10            // ~2 px border at standard zoom
const CHORD_COL       = '#404040'       // chord pod fill
const CHORD_BORDER_COL = '#4caf50'      // green border

// ── Progression / chord helpers ───────────────────────────────────────────────
function romanToDegree(roman: string): number {
  const map: Record<string, number> = {
    'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,
    'i':1,'ii':2,'iii':3,'iv':4,'v':5,'vi':6,'vii':7,
  }
  const base = roman.match(/^([IVXivx]+)/)?.[1] ?? ''
  return map[base] ?? 1
}
function numeralToChordName(numeral: string, scalePc: string): string {
  const scaleNotes = ['1P','2M','3M','4P','5P','6M','7M'].map(iv =>
    Note.pitchClass(Note.transpose(scalePc, iv))
  )
  const degree = romanToDegree(numeral)
  const root   = scaleNotes[(degree - 1) % 7]
  const base   = numeral.match(/^([IVXivx]+)/)?.[1] ?? ''
  const mods   = numeral.slice(base.length)
  const isMaj  = base === base.toUpperCase()
  let name = root
  if (mods.includes('°') || mods.includes('dim'))       name += 'dim'
  else if (mods.includes('+') || mods.includes('aug'))  name += 'aug'
  else if (mods.includes('maj7'))  name += isMaj ? 'maj7' : 'mMaj7'
  else if (mods.includes('m7b5') || mods.includes('Ø')) name += 'm7b5'
  else if (mods.includes('7'))     name += isMaj ? '7' : 'm7'
  else if (mods.includes('6'))     name += isMaj ? '6' : 'm6'
  else if (!isMaj)                 name += 'm'
  return name
}
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

// Returns the maximum allowed dBeat for a chord group move (no overlap with external notes)
function constrainChordGroupMove(
  origNotes: Array<{ id: string; startBeat: number; duration: number; string: number }>,
  groupIds: Set<string>,
  dBeat: number
): number {
  const all = useTablatureR3FStore.getState().notes
  let lo = -1e9, hi = 1e9
  for (const gn of origNotes) {
    for (const n of all) {
      if (groupIds.has(n.id) || n.string !== gn.string) continue
      if (n.startBeat + n.duration <= gn.startBeat)
        lo = Math.max(lo, n.startBeat + n.duration - gn.startBeat)
      else if (n.startBeat >= gn.startBeat + gn.duration)
        hi = Math.min(hi, n.startBeat - (gn.startBeat + gn.duration))
    }
  }
  return Math.max(lo, Math.min(hi, dBeat))
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
type ClipNote = Pick<TablatureNote, 'string'|'fret'|'duration'> & { startBeat: number }

interface SceneProps { onStringYPcts: (pcts: number[]) => void }

// ── Scene ───────────────────────────────────────────────────────────────────────
function TablatureScene({ onStringYPcts }: SceneProps) {
  const { camera, gl, size, scene } = useThree()
  const { notes, chordGroups, addNote, updateNote, deleteNote, addChordGroup, removeChordGroup, pushHistory, undo, redo } = useTablatureR3FStore()

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

      const { addNote: add, addChordGroup: addGrp, pushHistory: ph } = useTablatureR3FStore.getState()
      ph()
      const tuning = useTablatureStore.getState().tuning.split(',')
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
        if (addedIds.length > 0) addGrp(addedIds, chordName)
      })
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

  const clipboard = useRef<ClipNote[]>([])

  const [rectBox, setRectBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  const drag    = useRef<DragNote | DragRect | DragChordGroup | null>(null)
  const [hoveredGroupId,      setHoveredGroupId]      = useState<string | null>(null)
  const [labelHoveredGroupId, setLabelHoveredGroupId] = useState<string | null>(null)
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
      // Correct for asymmetric frustum: add frustum-center offset
      return o.position.y + (o.top + o.bottom) / 2 + ndc * (o.top - o.bottom) / 2
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
      } else if (d?.kind === 'chord-group') {
        const worldX = wx(e.clientX)
        const origW  = d.origGroupEnd - d.origGroupStart
        if (!d.didMove) { pushHistory(); (drag.current as DragChordGroup).didMove = true }
        if (d.type === 'move') {
          const rawDelta = snapBeat((worldX - d.startX) / BEAT_W)
          const groupIds = new Set(d.origNotes.map(n => n.id))
          const dBeat    = constrainChordGroupMove(d.origNotes, groupIds, rawDelta)
          for (const n of d.origNotes)
            updateNote(n.id, { startBeat: Math.max(0, n.startBeat + dBeat) })
        } else if (d.type === 'resize-right') {
          const newEnd = Math.max(d.origGroupStart + MIN_DUR * d.origNotes.length, snapBeat(worldX / BEAT_W))
          const newW   = newEnd - d.origGroupStart
          for (const n of d.origNotes) {
            const relStart = (n.startBeat - d.origGroupStart) / origW
            updateNote(n.id, { startBeat: d.origGroupStart + relStart * newW, duration: Math.max(MIN_DUR, (n.duration / origW) * newW) })
          }
        } else {
          const newStart = Math.max(0, Math.min(d.origGroupEnd - MIN_DUR, snapBeat(worldX / BEAT_W)))
          const newW     = d.origGroupEnd - newStart
          for (const n of d.origNotes) {
            const relFromRight = (d.origGroupEnd - (n.startBeat + n.duration)) / origW
            const newDur  = Math.max(MIN_DUR, (n.duration / origW) * newW)
            updateNote(n.id, { startBeat: Math.max(0, d.origGroupEnd - relFromRight * newW - newDur), duration: newDur })
          }
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

      if (d?.kind === 'chord-group' && !d.didMove) {
        // click (no move) → select all notes in the chord group
        setSelectedIds(new Set(d.origNotes.map(n => n.id)))
      } else if (d?.kind === 'rect') {
        const hits = useTablatureR3FStore.getState().notes
          .filter(n => noteInRect(n, d.x0, d.y0, d.x1, d.y1))
          .map(n => n.id)
        setSelectedIds(new Set(hits))
        setRectBox(null)
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

  // ── Chord pod geometry cache ──────────────────────────────────────────────────
  const chordPodCache = useRef(new Map<string, THREE.ShapeGeometry>())
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

      {/* Info lane — below low E, reserved for labels; no pods/notes overlap it */}
      <mesh position={[0, infoLaneY, -0.04]} geometry={laneBgGeo} material={laneBgMat} />

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
        const borderCol     = isLabelHover ? SEL_COL : CHORD_BORDER_COL
        return (
          <group key={group.id} position={[podCX, podCY, -0.03]}>
            {/* Border (back) — orange on label hover, green otherwise */}
            <mesh position={[0, 0, 0]} geometry={getChordPodGeo(podW, podH, true)}>
              <meshBasicMaterial color={borderCol} />
            </mesh>
            {/* Grey fill (front) */}
            <mesh position={[0, 0, 0.003]} geometry={getChordPodGeo(podW, podH)}>
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
            {/* Chord name in info lane — centered on pod X, hover turns pod border orange */}
            <Html center position={[0, infoLaneY - podCY, 0.1]}>
              <h2
                style={{ margin: 0, padding: 0, fontSize: '12px', fontWeight: 700,
                  color: CHORD_BORDER_COL, userSelect: 'none', whiteSpace: 'nowrap',
                  lineHeight: 1, cursor: 'default' }}
                onMouseEnter={() => setLabelHoveredGroupId(group.id)}
                onMouseLeave={() => setLabelHoveredGroupId(null)}
              >
                {group.chordName}
              </h2>
            </Html>
          </group>
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
