/**
 * @file LegatoLine.tsx
 * Animated Catmull-Rom ribbon connecting a legato source note to its destination
 * through any intermediate notes.
 *
 * Subscribes to the full `notes` array rather than a derived slice.  A targeted
 * selector using an object literal would trigger infinite re-renders (Zustand sees
 * a new reference on every call), and `useShallow` cannot help here because
 * `Array.prototype.filter` always returns a new array instance — `Object.is([], [])`
 * is `false` — so the shallow comparison always fails.  The `notes` array itself
 * IS a stable reference when un-mutated (Zustand replaces it atomically), so the
 * full-array subscription is both correct and efficient enough for this component.
 */
import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createRibbonMaterial, buildRibbonGeoCatmullRom } from '../../../services/RibbonLineService'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import type { TablatureNote } from '../../../stores/useTablatureR3FStore'
import { ColorService } from '../../../services/ColorService'
import { BEAT_W, stringY } from '../../../utils/tabUtils'

/**
 * Renders a Catmull-Rom ribbon between a legato source note and its destination,
 * passing through any intermediate notes in `source.intermediateNoteIds`.
 */
export function LegatoLine({ sourceId, destId, noteColor, legatoSourceId, invStretchX }: {
  sourceId: string
  destId: string
  /** Returns the degree/mode hex color for a given note. */
  noteColor: (n: TablatureNote) => string
  legatoSourceId: string | null
  invStretchX: number
}) {
  const notes = useTablatureR3FStore(s => s.notes)
  const source = notes.find(n => n.id === sourceId)
  const dest   = notes.find(n => n.id === destId)
  const intermediates = source?.intermediateNoteIds
    ? notes.filter(n => source.intermediateNoteIds!.includes(n.id))
    : []

  const meshRef = useRef<THREE.Mesh>(null!)
  const mat     = useMemo(() => createRibbonMaterial(), [])

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.getElapsedTime()
    mat.uniforms.uInvStretchX.value = invStretchX
  })

  const geo = useMemo(() => {
    if (!source || !dest) return null

    const chain: THREE.Vector3[] = []
    const chainColors: THREE.Color[] = []
    const getC   = (n: TablatureNote) => new THREE.Color(noteColor(n))
    const getOff = (n: TablatureNote) => Math.min(n.duration * BEAT_W * 0.45, 0.3 * invStretchX)

    const addPoint = (p: THREE.Vector3, col: THREE.Color) => {
      const last = chain[chain.length - 1]
      if (!last || last.distanceTo(p) > 0.05) { chain.push(p); chainColors.push(col) }
    }

    addPoint(
      new THREE.Vector3((source.startBeat + source.duration) * BEAT_W - getOff(source), stringY(source.string), 0),
      getC(source)
    )

    for (const n of [...intermediates].sort((a, b) => a.startBeat - b.startBeat)) {
      const nw = n.duration * BEAT_W, ncx = n.startBeat * BEAT_W + nw / 2
      const ny = stringY(n.string), off = getOff(n), col = getC(n)
      addPoint(new THREE.Vector3(ncx - nw / 2 + off, ny, 0), col)
      addPoint(new THREE.Vector3(ncx + nw / 2 - off, ny, 0), col)
    }

    const dw = dest.duration * BEAT_W, dcx = dest.startBeat * BEAT_W + dw / 2
    addPoint(new THREE.Vector3(dcx - dw / 2 + getOff(dest), stringY(dest.string), 0), getC(dest))

    return buildRibbonGeoCatmullRom(chain, chainColors, 0.12, Math.max(40, chain.length * 10), -0.02)
  // Include `notes` so the ribbon updates when any intermediate moves,
  // and `legatoSourceId` to refresh visuals on chain start/end.
  }, [source, dest, notes, legatoSourceId, noteColor])

  if (!geo) return null
  return <mesh ref={meshRef} geometry={geo} material={mat} renderOrder={6} />
}
