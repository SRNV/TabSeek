import React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { ThreeEvent } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import type { ProgressionGroup, ChordGroup } from '../../../stores/useTablatureR3FStore'
import { 
  BEAT_W, POD_HEADER_OFF, stringY, zoneCursor, noteZone
} from '../../../utils/tabUtils'
import {
  CHORD_PAD_H, PROG_BORDER_COL, PROG_BORDER_HOVER_COL, PROG_PAD_H
} from './sceneConstants'
import { PodHeaderTemplate } from './PodHeaderTemplate'
import { PodModifierDisc, PodModifierPopover } from '../PodModifierUI'
import { PodModifierService } from '../../../services/PodModifierService'
import { FretboardHighlightService } from '../../../services/FretboardHighlightService'
import { Html } from '@react-three/drei'

interface ProgressionPodsProps {
  invStretchX: number
  pxPerWUX: number
  camL: number
  hoveredProgId: string | null
  editingProgId: string | null
  editingProgName: string
  setHoveredProgId: (id: string | null) => void
  setEditingId: (id: string | null) => void
  setEditingProgId: (id: string | null) => void
  setEditingProgName: (val: string) => void
  onProgPodDown: (e: ThreeEvent<PointerEvent>, prog: ProgressionGroup, podW: number) => void
  getProgBounds: (p: ProgressionGroup) => any
  getChordPodGeo: (w: number, h: number) => THREE.ShapeGeometry
  pushHistory: () => void
}

export const ProgressionPods: React.FC<ProgressionPodsProps> = ({
  invStretchX, pxPerWUX, camL,
  hoveredProgId, editingProgId, editingProgName,
  setHoveredProgId, setEditingId, setEditingProgId, setEditingProgName,
  onProgPodDown, getProgBounds, getChordPodGeo, pushHistory
}) => {
  const { gl } = useThree()
  const { 
    progressionGroups, chordGroups, notes, removeProgressionGroup, updateProgressionGroup
  } = useTablatureR3FStore(useShallow(s => ({
    progressionGroups: s.progressionGroups,
    chordGroups: s.chordGroups,
    notes: s.notes,
    removeProgressionGroup: s.removeProgressionGroup,
    updateProgressionGroup: s.updateProgressionGroup
  })))

  return (
    <group>
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
        
        const progDiscWU = 26.4 / pxPerWUX
        const stickyX   = Math.max(podLeft, Math.min(podRight - progDiscWU, camL + 0.06 * invStretchX))
        const stickyRelX = stickyX - headerX

        return (
          <PodHeaderTemplate
            key={prog.id}
            x={headerX} y={headerCY} z={0.003} width={headerW} color={bCol}
            stickyRelX={stickyRelX} renderOrder={3} zIndex={80}
            getPodGeo={getChordPodGeo}
            onPointerDown={e => onProgPodDown(e, prog, headerW)}
            onPointerEnter={() => {
              setHoveredProgId(prog.id)
              gl.domElement.style.cursor = 'grab'
              const progNotes = prog.chordGroupIds.flatMap(cgId => {
                const cg = chordGroups.find(g => g.id === cgId)
                return cg ? notes.filter(n => cg.noteIds.includes(n.id)) : []
              })
              FretboardHighlightService.setHighlights(progNotes.map(n => ({ si: n.string, fret: n.fret })))
            }}
            onPointerLeave={() => {
              setHoveredProgId(null)
              gl.domElement.style.cursor = 'default'
              FretboardHighlightService.clearHighlights()
            }}
            onPointerMove={e => {
              const lx = e.point.x - podLeft
              gl.domElement.style.cursor = zoneCursor(noteZone(lx, headerW, invStretchX))
            }}
            onContextMenu={e => { e.stopPropagation(); pushHistory(); removeProgressionGroup(prog.id) }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <PodModifierDisc
                emojiStr=":musical_score:" size={22} discBg="#1a1a2a" borderCol={PROG_BORDER_COL}
                title={prog.name} onDoubleClick={() => { setEditingId(prog.id); setEditingProgId(prog.id); setEditingProgName(prog.name) }}
                popoverContent={close => (
                  <PodModifierPopover
                    nav={PodModifierService.getProgressionTemplateNav(prog)}
                    emojiStr=":musical_score:" onClose={close} className="progression-popover"
                  />
                )}
              />
              {editingProgId === prog.id && (
                <input
                  className="tab-r3f-fret-input"
                  style={{ width: '90px', color: PROG_BORDER_COL, borderColor: PROG_BORDER_COL, background: 'rgba(0,0,0,0.85)' }}
                  value={editingProgName} autoFocus
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
          </PodHeaderTemplate>
        )
      })}
    </group>
  )
}
