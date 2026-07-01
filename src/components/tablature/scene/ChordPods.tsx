import React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { ThreeEvent } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import type { ChordGroup } from '../../../types'
import { 
  BEAT_W, POD_HEADER_OFF, stringY, zoneCursor, noteZone, INFO_LANE_H, infoLaneY
} from '../../../utils/tabUtils'
import {
  CHORD_PAD_H, CHORD_BORDER_COL, CHORD_BORDER_HOVER_COL
} from './sceneConstants'
import { PodHeaderTemplate } from './PodHeaderTemplate'
import { PodModifierDisc, PodModifierPopover, RhythmModifierDisc, ChordPopoverButtons } from '../PodModifierUI'
import { PodModifierService } from '../../../services/PodModifierService'
import { FretboardHighlightService } from '../../../services/FretboardHighlightService'
import { RhythmModifierService } from '../../../services/RhythmModifierService'
import { getChordEmojiByName } from '../../../services/ChordEmojiService'

interface ChordPodsProps {
  invStretchX: number
  pxPerWUX: number
  scrollX: number
  halfW: number
  camL: number
  tuningArr: string[]
  selectedChordGroupIds: Set<string>
  labelHoveredGroupId: string | null
  setHoveredGroupId: (id: string | null) => void
  setLabelHoveredGroupId: (id: string | null) => void
  onChordPodDown: (e: ThreeEvent<PointerEvent>, group: ChordGroup, podLeft: number, podW: number) => void
  onNewProgDown: (e: ThreeEvent<PointerEvent>, groupId: string) => void
  getGroupBounds: (g: ChordGroup) => any
  getChordPodGeo: (w: number, h: number) => THREE.ShapeGeometry
  pushHistory: () => void
}

export const ChordPods: React.FC<ChordPodsProps> = ({
  invStretchX, pxPerWUX, scrollX, halfW, camL, tuningArr,
  selectedChordGroupIds, labelHoveredGroupId,
  setHoveredGroupId, setLabelHoveredGroupId,
  onChordPodDown, onNewProgDown,
  getGroupBounds, getChordPodGeo, pushHistory
}) => {
  const { gl } = useThree()
  const { 
    chordGroups, notes, rhythmModifiers, updateRhythmModifier, deleteNote
  } = useTablatureR3FStore(useShallow(s => ({
    chordGroups: s.chordGroups,
    notes: s.notes,
    rhythmModifiers: s.rhythmModifiers,
    updateRhythmModifier: s.updateRhythmModifier,
    deleteNote: s.deleteNote
  })))

  return (
    <group>
      {chordGroups.map(group => {
        const b = getGroupBounds(group)
        if (!b) return null
        const headerW  = (b.beatMax - b.beatMin) * BEAT_W + CHORD_PAD_H * 2
        const headerX  = (b.beatMin + b.beatMax) / 2 * BEAT_W
        const headerCY = stringY(b.siMax) + POD_HEADER_OFF
        const podLeft  = b.beatMin * BEAT_W - CHORD_PAD_H
        const podRight = podLeft + headerW
        const isLabelHover = labelHoveredGroupId === group.id
        const isSelForProg = selectedChordGroupIds.has(group.id)
        const borderCol    = isLabelHover ? CHORD_BORDER_HOVER_COL : isSelForProg ? '#7BA7E8' : CHORD_BORDER_COL
        
        const chordRhythmMod = rhythmModifiers.find(m => m.targetType === 'chord' && m.targetId === group.id && m.kind !== 'arpeggio')
        const arpeggioMod    = PodModifierService.getArpeggioForChord(group.id)
        
        const extraDiscWU = chordRhythmMod ? 26.4 / pxPerWUX : 0
        const discWU     = 30 / pxPerWUX + extraDiscWU
        const stickyX    = Math.max(podLeft, Math.min(podRight - discWU, camL + 0.06 * invStretchX))
        const stickyRelX = stickyX - headerX

        return (
          <group key={group.id}>
            <PodHeaderTemplate
              x={headerX} y={headerCY} z={0.001} width={headerW} color={borderCol}
              stickyRelX={stickyRelX}
              getPodGeo={getChordPodGeo}
              onPointerDown={e => onChordPodDown(e, group, podLeft, headerW)}
              onPointerEnter={() => {
                setHoveredGroupId(group.id)
                gl.domElement.style.cursor = 'grab'
                const groupNotes = notes.filter(n => group.noteIds.includes(n.id))
                FretboardHighlightService.setHighlights(groupNotes.map(n => ({ si: n.string, fret: n.fret })))
              }}
              onPointerLeave={() => {
                setHoveredGroupId(null)
                gl.domElement.style.cursor = 'default'
                FretboardHighlightService.clearHighlights()
              }}
              onPointerMove={e => {
                const lx = e.point.x - podLeft
                gl.domElement.style.cursor = zoneCursor(noteZone(lx, headerW, invStretchX))
              }}
              onContextMenu={e => {
                e.stopPropagation()
                pushHistory()
                group.noteIds.forEach(id => deleteNote(id, tuningArr))
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                onMouseEnter={() => setLabelHoveredGroupId(group.id)}
                onMouseLeave={() => setLabelHoveredGroupId(null)}
              >
                <PodModifierDisc
                  emojiStr={getChordEmojiByName(group.chordName)}
                  size={25} discBg="#1a1a1a" borderCol={arpeggioMod ? '#f5a623' : CHORD_BORDER_COL}
                  glow={!!arpeggioMod} title={group.chordName}
                  popoverContent={close => (
                    <PodModifierPopover
                      nav={PodModifierService.getChordTypeNav(group)}
                      emojiStr={getChordEmojiByName(group.chordName)}
                      onClose={close} className="chord-popover"
                    >
                      <ChordPopoverButtons group={group} />
                    </PodModifierPopover>
                  )}
                />
                {chordRhythmMod && (
                  <RhythmModifierDisc
                    mod={chordRhythmMod} size={22}
                    onUpdate={patch => {
                      if (chordRhythmMod.legato) RhythmModifierService.rematerializeWithPatch(chordRhythmMod.id, patch)
                      else { pushHistory(); updateRhythmModifier(chordRhythmMod.id, patch) }
                    }}
                    onRemove={() => RhythmModifierService.restoreToNormal(chordRhythmMod.id)}
                  />
                )}
              </div>
            </PodHeaderTemplate>

            {/* Info lane hit area */}
            <mesh
              position={[headerX, infoLaneY, 0.005]}
              onPointerDown={e => onNewProgDown(e, group.id)}
              onPointerEnter={() => {
                setLabelHoveredGroupId(group.id)
                gl.domElement.style.cursor = 'crosshair'
                const groupNotes = notes.filter(n => group.noteIds.includes(n.id))
                FretboardHighlightService.setHighlights(groupNotes.map(n => ({ si: n.string, fret: n.fret })))
              }}
              onPointerLeave={() => {
                setLabelHoveredGroupId(null)
                gl.domElement.style.cursor = 'default'
                FretboardHighlightService.clearHighlights()
              }}
            >
              <planeGeometry args={[headerW, INFO_LANE_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
