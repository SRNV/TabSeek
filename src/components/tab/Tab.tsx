import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Note } from 'tonal'
import { useMainStore } from '../../stores/useMainStore'
import { getNoteName } from '../../composables/useNoteHelpers'
import { playNote } from '../../composables/useAudio'
import eventBus from '../../eventBus'
import './Tab.scss'

// ── Layout constants ───────────────────────────────────────────────────────────

const CELL_W  = 1.4
const CELL_H  = 1.1
const PLANE_W = 1.28
const PLANE_H = 1.0
const N_STRINGS = 6
const MAX_INS = N_STRINGS * 32

const DEGREE_COLORS = [
  '#FFF9B1', // 1 tonic – yellow
  '#77DD77', // 2 – green
  '#AEC6CF', // 3 – steel blue
  '#CDB4DB', // 4 – lavender
  '#FFB3B3', // 5 – pink
  '#FFD1B3', // 6 – peach
  '#FFFFFF', // 7 – white
] as const

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

function advanceSemitone(note: string): string {
  const n = Note.get(note)
  if (n.midi == null || n.oct == null) return note
  const nextPc = (n.midi % 12 + 1) % 12  // wraps B→C within same octave
  return `${CHROMATIC[nextPc]}${n.oct}`
}

const DEFAULT_BG      = '#1c1c1c'
const OUTLINE_EXTRA   = 0.07
const CHORD_ORANGE    = '#FF9500'
const CHORD_ROOT_BLUE = '#3355FF'
const OPEN_DIM        = 0.38

// ── Octave brightness ─────────────────────────────────────────────────────────
// 25% total delta: ×0.875 at oct 2, ×1.125 at oct 5 (multiplicative on base lightness)

function withOctaveBrightness(hex: string, octave: number, isOpen: boolean): THREE.Color {
  const c = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  const t = Math.max(0, Math.min(1, (octave - 2) / 3))
  const factor = 0.875 + t * 0.25
  const l = Math.max(0.06, Math.min(0.97, hsl.l * factor))
  c.setHSL(hsl.h, hsl.s, l)
  if (isOpen) c.multiplyScalar(OPEN_DIM)
  return c
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TabProps {
  midiList: number[]
  matchType: 'one' | 'multiple'
  tabLength: number
  visibleStart: number
  visibleEnd: number
  forChordsDisplay?: boolean
  cords?: string[]
}

interface CellData {
  si: number
  fretSemi: number
  slotIdx: number
  noteName: string
  midi: number | null
  octave: number
  isOpen: boolean
  isHighlighted: boolean
  color: THREE.Color
  posX: number
  posY: number
  label: string
  degreeLabel: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function stringY(si: number): number {
  return ((N_STRINGS - 1) / 2 - si) * CELL_H
}

function slotX(slotIdx: number): number {
  return slotIdx * CELL_W
}

function noteDegree(noteName: string, collection: string[]): number | null {
  const midi = Note.get(noteName).midi
  if (midi == null) return null
  const pc12 = midi % 12
  for (let i = 0; i < collection.length; i++) {
    const m = Note.get(collection[i]).midi
    if (m != null && m % 12 === pc12) return i + 1
  }
  return null
}

// ── Rounded rectangle geometry ────────────────────────────────────────────────

function roundedRectGeo(w: number, h: number, r: number, segs = 6): THREE.ShapeGeometry {
  const s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -h / 2)
  s.lineTo( w / 2 - r, -h / 2)
  s.quadraticCurveTo( w / 2, -h / 2,  w / 2, -h / 2 + r)
  s.lineTo( w / 2,  h / 2 - r)
  s.quadraticCurveTo( w / 2,  h / 2,  w / 2 - r,  h / 2)
  s.lineTo(-w / 2 + r,  h / 2)
  s.quadraticCurveTo(-w / 2,  h / 2, -w / 2,  h / 2 - r)
  s.lineTo(-w / 2, -h / 2 + r)
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  s.closePath()
  return new THREE.ShapeGeometry(s, segs)
}

// ── Three.js scene ────────────────────────────────────────────────────────────

interface SceneProps {
  cells: CellData[]
  nSlots: number
  matchType: 'one' | 'multiple'
  chordPos: Array<{ si: number; posX: number; posY: number; isRoot: boolean }>
  onCellClick: (cell: CellData) => void
}

function FretboardScene({ cells, nSlots, matchType, chordPos, onCellClick }: SceneProps) {
  const { camera } = useThree()

  // ── Camera: frustum covers content exactly → fills canvas edge-to-edge ────
  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera
    const hw = ((nSlots - 1) * CELL_W + PLANE_W) / 2
    const hh = ((N_STRINGS - 1) * CELL_H + PLANE_H) / 2
    ortho.left   = -hw
    ortho.right  = +hw
    ortho.top    = +hh
    ortho.bottom = -hh
    ortho.zoom   = 1
    ortho.position.set((nSlots - 1) / 2 * CELL_W, 0, 10)
    ortho.updateProjectionMatrix()
  }, [nSlots, camera])

  // ── Stable geometry + material refs ──────────────────────────────────────
  // NOTE: no vertexColors:true — PlaneGeometry has no color attribute and would
  // multiply instanceColor by black. color:white lets instanceColor show directly.
  const cellGeo = useMemo(() => roundedRectGeo(PLANE_W, PLANE_H, PLANE_H * 0.15), [])
  const cellMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), [])
  const strGeo  = useMemo(() => new THREE.BoxGeometry(1, 0.055, 0.01), [])
  const strMat  = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3a3a3a' }), [])
  const dotGeo     = useMemo(() => new THREE.CircleGeometry(0.30, 24), [])
  const dotMat     = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, side: THREE.DoubleSide }), [])
  const outlineGeo = useMemo(() => roundedRectGeo(PLANE_W + OUTLINE_EXTRA, PLANE_H + OUTLINE_EXTRA, PLANE_H * 0.15 + OUTLINE_EXTRA / 2), [])
  const outlineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#e57c00', side: THREE.DoubleSide }), [])

  const tmpM  = useMemo(() => new THREE.Matrix4(), [])
  const animM = useMemo(() => new THREE.Matrix4(), [])
  const tmpC  = useMemo(() => new THREE.Color(), [])
  const offM  = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), [])

  // ── Animation refs ────────────────────────────────────────────────────────
  const currentColors  = useRef<THREE.Color[]>([])
  const targetColors   = useRef<THREE.Color[]>([])
  const originalColors = useRef<THREE.Color[]>([])
  const basePosRef     = useRef<Array<[number, number]>>([])
  const playAnims      = useRef<Array<{ idx: number; t: number; pc: number }>>([])
  const playingPCs     = useRef(new Set<number>())
  const pendingTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredCell      = useRef<number | null>(null)
  const hoverScales      = useRef(new Map<number, number>())
  const colorNeedsUpdate = useRef(false)
  const outlineRef       = useRef<THREE.InstancedMesh>(null!)
  const dimColor         = useMemo(() => new THREE.Color(DEFAULT_BG), [])

  // ── Cells ─────────────────────────────────────────────────────────────────
  const cellsRef = useRef<THREE.InstancedMesh>(null!)

  useEffect(() => {
    const mesh = cellsRef.current
    if (!mesh) return

    hoveredCell.current = null
    hoverScales.current.clear()
    basePosRef.current = cells.map(c => [c.posX, c.posY] as [number, number])

    cells.forEach((c, i) => {
      tmpM.setPosition(c.posX, c.posY, 0)
      mesh.setMatrixAt(i, tmpM)
    })
    for (let i = cells.length; i < MAX_INS; i++) mesh.setMatrixAt(i, offM)
    mesh.instanceMatrix.needsUpdate = true

    // Reset all outlines to hidden — outline only appears on hover (driven by useFrame)
    const outMesh = outlineRef.current
    if (outMesh) {
      for (let i = 0; i < MAX_INS; i++) outMesh.setMatrixAt(i, offM)
      outMesh.instanceMatrix.needsUpdate = true
    }

    const newTargets = cells.map(c => c.color.clone())
    originalColors.current = newTargets.map(c => c.clone())
    targetColors.current = newTargets

    if (currentColors.current.length !== cells.length) {
      currentColors.current = newTargets.map(c => c.clone())
      cells.forEach((_, i) => mesh.setColorAt(i, currentColors.current[i]))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    } else {
      colorNeedsUpdate.current = true
    }
  }, [cells, tmpM, offM])

  // ── Play animation: scale pulse + color dimming on note events ───────────
  useEffect(() => {
    playAnims.current = []

    function applyPlayDim(pcs: Set<number>) {
      playingPCs.current = new Set(pcs)
      cells.forEach((c, i) => {
        const isPlaying = c.midi !== null && pcs.has(c.midi % 12)
        targetColors.current[i] = isPlaying
          ? originalColors.current[i]
          : originalColors.current[i].clone().lerp(dimColor, 0.78)
      })
      colorNeedsUpdate.current = true
    }

    // pending set collects PCs that fired within the same JS tick (chord)
    // and replaces on sequential notes (arpège) via the 5ms debounce
    const pending = new Set<number>()

    function onNote(midi: number) {
      const pc = midi % 12
      cells.forEach((c, i) => {
        if (c.midi !== null && c.midi % 12 === pc) {
          playAnims.current = playAnims.current.filter(a => a.idx !== i)
          playAnims.current.push({ idx: i, t: 0, pc })
        }
      })
      pending.add(pc)
      if (pendingTimer.current !== null) clearTimeout(pendingTimer.current)
      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null
        applyPlayDim(new Set(pending))
        pending.clear()
      }, 5)
    }

    eventBus.on('noteSelected', onNote)
    eventBus.on('notePlayed', onNote)
    return () => {
      eventBus.off('noteSelected', onNote)
      eventBus.off('notePlayed', onNote)
      if (pendingTimer.current !== null) clearTimeout(pendingTimer.current)
    }
  }, [cells, dimColor])

  // ── Per-frame: color lerp + scale animation ───────────────────────────────
  useFrame((_, delta) => {
    const mesh    = cellsRef.current
    const outMesh = outlineRef.current
    if (!mesh || currentColors.current.length === 0) return

    // Color transition — only runs while pending (mode change triggers it)
    if (colorNeedsUpdate.current) {
      const lerpFactor = 1 - Math.exp(-8 * delta)
      let colorChanged = false
      currentColors.current.forEach((c, i) => {
        const target = targetColors.current[i]
        if (!target) return
        const r0 = c.r, g0 = c.g, b0 = c.b
        c.lerp(target, lerpFactor)
        if (Math.abs(c.r - r0) + Math.abs(c.g - g0) + Math.abs(c.b - b0) > 0.004) colorChanged = true
        mesh.setColorAt(i, c)
      })
      if (colorChanged && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      if (!colorChanged) colorNeedsUpdate.current = false
    }

    // Hover scale (ease-out cubic, 1.0 → 1.2) + outline follow
    const HOVER_SPEED = 10
    let matrixChanged = false

    if (hoveredCell.current !== null && !hoverScales.current.has(hoveredCell.current)) {
      hoverScales.current.set(hoveredCell.current, 0)
    }

    if (hoverScales.current.size > 0) {
      matrixChanged = true
      const done: number[] = []
      for (const [idx, t] of hoverScales.current) {
        const isHovered = idx === hoveredCell.current
        const next = isHovered
          ? Math.min(1, t + delta * HOVER_SPEED)
          : Math.max(0, t - delta * HOVER_SPEED)
        if (!isHovered && next === 0) done.push(idx)
        else hoverScales.current.set(idx, next)
        const eased = 1 - Math.pow(1 - next, 3)
        const scale = 1.0 + eased * 0.2
        const pos = basePosRef.current[idx]
        if (pos) {
          // Hovered cell at z=0.02 (front), scaling peers at z=0
          const z = isHovered ? 0.02 : 0
          animM.makeScale(scale, scale, 1)
          animM.setPosition(pos[0], pos[1], z)
          mesh.setMatrixAt(idx, animM)
          if (outMesh) {
            // Outline at z=0.01: in front of all cells (z=0), behind hovered cell (z=0.02)
            animM.makeScale(scale, scale, 1)
            animM.setPosition(pos[0], pos[1], 0.01)
            outMesh.setMatrixAt(idx, animM)
          }
        }
      }
      done.forEach(idx => {
        hoverScales.current.delete(idx)
        // Reset cell back to z=0 (normal layer)
        const pos = basePosRef.current[idx]
        if (pos) {
          animM.makeScale(1, 1, 1)
          animM.setPosition(pos[0], pos[1], 0)
          mesh.setMatrixAt(idx, animM)
        }
        if (outMesh) outMesh.setMatrixAt(idx, offM)
      })
    }

    // Scale pulse on note play (0→110%→100% over 500ms), overrides hover
    if (playAnims.current.length > 0) {
      matrixChanged = true
      playAnims.current.forEach(anim => {
        anim.t = Math.min(1, anim.t + delta * 2)
        const t = anim.t
        const scale = t < 0.3
          ? 1.0 + (t / 0.3) * 0.1
          : 1.1 - ((t - 0.3) / 0.7) * 0.1
        const pos = basePosRef.current[anim.idx]
        if (pos) {
          animM.makeScale(scale, scale, 1)
          animM.setPosition(pos[0], pos[1], 0)
          mesh.setMatrixAt(anim.idx, animM)
        }
      })
      const prev = playAnims.current.length
      playAnims.current = playAnims.current.filter(a => a.t < 1)
      // All animations done — restore colors (hover re-applies if still active)
      if (prev > 0 && playAnims.current.length === 0 && pendingTimer.current === null) {
        playingPCs.current.clear()
        for (let i = 0; i < originalColors.current.length; i++) {
          targetColors.current[i] = originalColors.current[i]
        }
        colorNeedsUpdate.current = true
      }
    }

    if (matrixChanged) {
      mesh.instanceMatrix.needsUpdate = true
      if (outMesh) outMesh.instanceMatrix.needsUpdate = true
    }
  })

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const id = e.instanceId
    if (id !== undefined && cells[id]) onCellClick(cells[id])
  }, [cells, onCellClick])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const id = e.instanceId
    if (id !== undefined && id < cells.length) {
      hoveredCell.current = id
      document.body.style.cursor = 'pointer'
      cells.forEach((_, i) => {
        targetColors.current[i] = i === id
          ? originalColors.current[i]
          : originalColors.current[i].clone().lerp(dimColor, 0.78)
      })
      colorNeedsUpdate.current = true
      useMainStore.getState().setHoveredRootNote(cells[id].label)
    }
  }, [cells, dimColor])

  const handlePointerOut = useCallback((_e: ThreeEvent<PointerEvent>) => {
    hoveredCell.current = null
    document.body.style.cursor = ''
    cells.forEach((_, i) => {
      targetColors.current[i] = originalColors.current[i]
    })
    colorNeedsUpdate.current = true
    useMainStore.getState().setHoveredRootNote('')
  }, [cells])

  // ── Strings ───────────────────────────────────────────────────────────────
  const stringsRef = useRef<THREE.InstancedMesh>(null!)
  const totalW  = (nSlots - 1) * CELL_W + PLANE_W
  const centerX = (nSlots - 1) / 2 * CELL_W

  useEffect(() => {
    const mesh = stringsRef.current
    if (!mesh) return
    for (let si = 0; si < N_STRINGS; si++) {
      const y = stringY(si)
      const m = new THREE.Matrix4().makeScale(totalW, 1, 1)
      m.setPosition(centerX, y, -0.01)
      mesh.setMatrixAt(si, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [nSlots, totalW, centerX])

  // ── Chord overlay dots ────────────────────────────────────────────────────
  const dotsRef = useRef<THREE.InstancedMesh>(null!)

  useEffect(() => {
    const mesh = dotsRef.current
    if (!mesh) return
    chordPos.forEach((cp, i) => {
      tmpM.setPosition(cp.posX, cp.posY, 0.02)
      mesh.setMatrixAt(i, tmpM)
      mesh.setColorAt(i, tmpC.set(cp.isRoot ? CHORD_ROOT_BLUE : CHORD_ORANGE))
    })
    for (let i = chordPos.length; i < MAX_INS; i++) mesh.setMatrixAt(i, offM)
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [chordPos, tmpM, tmpC, offM])

  // ── Chord connection lines ────────────────────────────────────────────────
  const chordLines = useMemo(() => {
    if (matchType !== 'one' || chordPos.length < 2) return []
    const sorted = [...chordPos].sort((a, b) => a.si - b.si)
    return sorted.slice(0, -1).map((a, i) => {
      const b = sorted[i + 1]
      return {
        key: `${a.si}-${b.si}`,
        pts: [
          new THREE.Vector3(a.posX, a.posY, 0.04),
          new THREE.Vector3(b.posX, b.posY, 0.04),
        ] as THREE.Vector3[],
      }
    })
  }, [chordPos, matchType])

  const nutX = CELL_W - PLANE_W / 2 - 0.04

  return (
    <>
      <instancedMesh ref={outlineRef} args={[outlineGeo, outlineMat, MAX_INS]} raycast={() => undefined} />
      <instancedMesh ref={cellsRef} args={[cellGeo, cellMat, MAX_INS]} onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} />
      <instancedMesh ref={stringsRef} args={[strGeo, strMat, N_STRINGS]} />

      <mesh position={[nutX, 0, 0.01]}>
        <boxGeometry args={[0.07, N_STRINGS * CELL_H + 0.18, 0.01]} />
        <meshBasicMaterial color="#777777" />
      </mesh>

      <instancedMesh ref={dotsRef} args={[dotGeo, dotMat, MAX_INS]} />

      {chordLines.map(l => (
        <Line key={l.key} points={l.pts} color="orange" lineWidth={2.5} transparent opacity={0.65} />
      ))}

      {cells.map(c => {
        const hsl = { h: 0, s: 0, l: 0 }
        c.color.getHSL(hsl)
        const ink = hsl.l > 0.45 ? '#111' : '#f0f0f0'
        return (
          <Html
            key={`${c.si}-${c.slotIdx}`}
            position={[c.posX, c.posY, 0.12]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div className={`fret-label${c.isHighlighted ? ' hl' : ''}`} style={c.isHighlighted ? undefined : { opacity: 0.35 }}>
              <span className="fret-note" style={{ color: ink }}>{c.label}</span>
              {c.degreeLabel && (
                <span className="fret-degree" style={{ color: ink }}>{c.degreeLabel}</span>
              )}
            </div>
          </Html>
        )
      })}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Tab({
  midiList,
  matchType,
  tabLength,
  visibleStart,
  visibleEnd,
  cords: cordsProp,
}: TabProps) {
  const [localStart, setLocalStart] = useState(visibleStart)
  const [localEnd,   setLocalEnd]   = useState(visibleEnd)

  const userScale       = useMainStore(s => s.userScale)
  const modeObject      = useMainStore(s => s.modeObject)
  const chordRootNote   = useMainStore(s => s.chordRootNote)
  const chordRootObject = useMainStore(s => s.chordRootObject)

  const [tuning, setTuning] = useState<string[]>(() => cordsProp ?? ['E2', 'A2', 'D3', 'G3', 'C3', 'E4'])

  const strings = useMemo(() => tuning.slice().reverse(), [tuning])

  const modeNotes = useMemo(
    () => modeObject.intervals.map(iv => Note.transpose(userScale, iv)),
    [userScale, modeObject]
  )

  const midiSet12 = useMemo(
    () => new Set(midiList.map(m => m % 12)),
    [midiList]
  )

  const chordMidi12 = useMemo((): number[] => {
    if (!chordRootObject) return []
    return (chordRootObject.intervals as string[])
      .map(iv => {
        const m = Note.midi(Note.transpose(chordRootNote, iv))
        return m !== null ? m % 12 : -1
      })
      .filter(m => m >= 0)
  }, [chordRootNote, chordRootObject])

  const displayFrets = useMemo((): number[] => {
    const f = [0]
    for (let v = localStart; v <= localEnd; v++) f.push(v + 1)
    return f
  }, [localStart, localEnd])

  const nSlots = displayFrets.length

  const cells = useMemo((): CellData[] => {
    const result: CellData[] = []
    strings.forEach((str, si) => {
      displayFrets.forEach((fretSemi, slotIdx) => {
        const noteName = getNoteName(str, fretSemi)
        const nd       = Note.get(noteName)
        const midi     = nd.midi ?? null
        const octave   = nd.oct  ?? 4
        const isOpen   = fretSemi === 0

        let isHighlighted = false
        let colorHex      = DEFAULT_BG
        let degreeLabel   = ''

        if (matchType === 'one') {
          if (midi !== null && midiSet12.has(midi % 12)) {
            isHighlighted = true
            colorHex = CHORD_ORANGE
          }
        } else {
          const deg = noteDegree(noteName, modeNotes)
          if (deg !== null) {
            isHighlighted = true
            colorHex  = DEGREE_COLORS[deg - 1]
            degreeLabel = `${deg}°`
          }
        }

        const color = isHighlighted
          ? withOctaveBrightness(colorHex, octave, isOpen)
          : new THREE.Color(DEFAULT_BG)

        result.push({
          si, fretSemi, slotIdx,
          noteName, midi, octave,
          isOpen, isHighlighted, color,
          posX: slotX(slotIdx),
          posY: stringY(si),
          label: nd.pc ?? noteName,
          degreeLabel,
        })
      })
    })
    return result
  }, [strings, displayFrets, matchType, modeNotes, midiSet12])

  const chordPos = useMemo(() => {
    if (matchType !== 'one') return []
    const byStr = new Map<number, { si: number; posX: number; posY: number; isRoot: boolean }>()
    for (const c of cells) {
      if (!c.isHighlighted || c.midi === null || byStr.has(c.si)) continue
      byStr.set(c.si, {
        si: c.si,
        posX: c.posX,
        posY: c.posY,
        isRoot: chordMidi12.length > 0 && c.midi % 12 === chordMidi12[0],
      })
    }
    return Array.from(byStr.values())
  }, [cells, matchType, chordMidi12])

  const handleCellClick = useCallback((cell: CellData) => {
    if (cell.isOpen) {
      setTuning(prev => {
        const next = [...prev]
        const tuningIdx = prev.length - 1 - cell.si
        next[tuningIdx] = advanceSemitone(prev[tuningIdx])
        return next
      })
      return
    }
    playNote(cell.noteName)
    if (cell.midi !== null) {
      eventBus.emit('noteSelected', cell.midi)
      useMainStore.getState().setChordRootNote(cell.noteName)
    }
  }, [setTuning])

  const canLeft  = localStart > 0
  const canRight = localEnd < tabLength

  return (
    <div className="tab-container">
      <div className="tab-navigation-container">
        <button
          className={`nav-btn nav-left${!canLeft ? ' disabled' : ''}`}
          onClick={() => { if (canLeft) { setLocalStart(s => s - 1); setLocalEnd(e => e - 1) } }}
          disabled={!canLeft}
        >
          <span className="arrow-icon">◀</span>
        </button>

        <div className="tab-gl-wrap">
          <Canvas
            orthographic
            camera={{ position: [0, 0, 10], near: 0.1, far: 1100 }}
            gl={{ antialias: true, alpha: false }}
          >
            <FretboardScene
              cells={cells}
              nSlots={nSlots}
              matchType={matchType}
              chordPos={chordPos}
              onCellClick={handleCellClick}
            />
          </Canvas>
        </div>

        <button
          className={`nav-btn nav-right${!canRight ? ' disabled' : ''}`}
          onClick={() => { if (canRight) { setLocalStart(s => s + 1); setLocalEnd(e => e + 1) } }}
          disabled={!canRight}
        >
          <span className="arrow-icon">▶</span>
        </button>
      </div>

      <div className="position-indicator">
        Position {localStart + 1}–{localEnd + 1}
      </div>
    </div>
  )
}
