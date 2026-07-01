/**
 * @file GhostNotePods.tsx
 * F6 — Renders semi-transparent ghost pods during drag-over, showing where a
 * progression would land if dropped at the current cursor position.
 * Reads `previewNotes` from useMainStore; cleared on drop or drag-leave.
 */
import React, { useMemo } from 'react'
import { useMainStore } from '../../../stores/useMainStore'
import { BEAT_W, NOTE_H, stringY } from '../../../utils/tabUtils'

export function GhostNotePods() {
  const previewNotes = useMainStore(s => s.previewNotes)

  const pods = useMemo(() => {
    if (!previewNotes || previewNotes.length === 0) return []
    return previewNotes.map((n, i) => {
      const x = n.startBeat * BEAT_W + (n.duration * BEAT_W) / 2
      const y = stringY(n.si)
      const w = n.duration * BEAT_W
      const h = NOTE_H
      return { key: `${n.si}-${n.startBeat}-${i}`, x, y, w, h, fret: n.fret }
    })
  }, [previewNotes])

  if (pods.length === 0) return null

  return (
    <>
      {pods.map(p => (
        <mesh key={p.key} position={[p.x, p.y, 0.1]}>
          <planeGeometry args={[p.w * 0.92, p.h * 0.85]} />
          <meshBasicMaterial color="#88ccff" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}
