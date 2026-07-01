/**
 * @file RhythmModifierPods.tsx
 * Renders floating `RhythmModifierPod` headers for rhythm modifiers that target
 * a single note or a progression (chord-targeted modifiers are rendered inline by
 * ChordPods instead — see TablatureR3F §11.8.3).
 *
 * Bounds are computed per-modifier from the notes/progressionGroups in the store.
 * When legato is materialized, bounds span the full range of materialized notes.
 * Reads the store directly to avoid prop-drilling arrays.
 */
import React, { useRef } from 'react'
import * as THREE from 'three'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import type { ProgressionGroup } from '../../../stores/useTablatureR3FStore'
import { RhythmModifierService } from '../../../services/RhythmModifierService'
import { RhythmModifierPod } from './RhythmModifierPod'
import { roundedRect } from '../../../utils/tablatureGeometry'
import { BEAT_W, HEADER_H } from '../../../utils/tabUtils'
import { CHORD_R, CHORD_PAD_H, PROG_PAD_H } from './sceneConstants'

interface RhythmModifierPodsProps {
  hoveredModId: string | null
  setHoveredModId: (id: string | null) => void
  invStretchX: number
  pxPerWUX: number
  /** Bounds getter for progression groups — passed from TablatureScene to avoid re-importing its closure. */
  getProgBounds: (prog: ProgressionGroup) => { beatMin: number; beatMax: number; siMin: number; siMax: number } | null
}

function usePodGeoCache(invStretchX: number) {
  const cache = useRef(new Map<string, THREE.ShapeGeometry>())
  return (w: number, h: number): THREE.ShapeGeometry => {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}`
    let g = cache.current.get(key)
    if (!g) {
      const ry = Math.min(w / 2, h / 2, CHORD_R)
      const rx = Math.min(w / 2, ry * invStretchX)
      g = new THREE.ShapeGeometry(roundedRect(w, h, rx, ry), 4)
      cache.current.set(key, g)
    }
    return g
  }
}

/**
 * Renders one `RhythmModifierPod` per non-chord rhythm modifier whose bounds
 * can be resolved against the current notes/progressions in the store.
 */
export function RhythmModifierPods({
  hoveredModId, setHoveredModId,
  invStretchX, pxPerWUX,
  getProgBounds,
}: RhythmModifierPodsProps) {
  const notes             = useTablatureR3FStore(s => s.notes)
  const progressionGroups = useTablatureR3FStore(s => s.progressionGroups)
  const rhythmModifiers   = useTablatureR3FStore(s => s.rhythmModifiers)
  const pushHistory       = useTablatureR3FStore(s => s.pushHistory)
  const updateRhythmModifier = useTablatureR3FStore(s => s.updateRhythmModifier)

  const getHeaderGeo = usePodGeoCache(invStretchX)

  return (
    <>
      {rhythmModifiers.filter(mod => mod.targetType !== 'chord').map(mod => {
        let b: { beatMin: number; beatMax: number; siMin: number; siMax: number } | null = null

        if (mod.legato && mod.legatoOrigRange) {
          const allIds   = [mod.targetId, ...(mod.legatoExtras ?? [])]
          const matNotes = notes.filter(n => allIds.includes(n.id))
          if (matNotes.length > 0) {
            b = {
              beatMin: Math.min(...matNotes.map(n => n.startBeat)),
              beatMax: Math.max(...matNotes.map(n => n.startBeat + n.duration)),
              siMin:   Math.min(...matNotes.map(n => n.string)),
              siMax:   Math.max(...matNotes.map(n => n.string)),
            }
          }
        } else if (mod.targetType === 'note') {
          const n = notes.find(n => n.id === mod.targetId)
          if (n) b = { beatMin: n.startBeat, beatMax: n.startBeat + n.duration, siMin: n.string, siMax: n.string }
        } else if (mod.targetType === 'progression') {
          const pg = progressionGroups.find(p => p.id === mod.targetId)
          if (pg) b = getProgBounds(pg)
        }

        if (!b) return null
        return (
          <RhythmModifierPod
            key={mod.id}
            mod={mod}
            bounds={b}
            invStretchX={invStretchX}
            pxPerWUX={pxPerWUX}
            getHeaderGeo={getHeaderGeo}
            onUpdate={patch => {
              if (mod.legato) {
                RhythmModifierService.rematerializeWithPatch(mod.id, patch)
              } else {
                pushHistory()
                updateRhythmModifier(mod.id, patch)
              }
            }}
            onRemove={() => RhythmModifierService.restoreToNormal(mod.id)}
            onHover={h => setHoveredModId(h ? mod.id : null)}
            isHovered={hoveredModId === mod.id}
          />
        )
      })}
    </>
  )
}
