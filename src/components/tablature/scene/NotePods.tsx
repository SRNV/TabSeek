import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import type { TablatureNote, LegatoBehavior } from '../../../types'
import { 
  BEAT_W, N_STRINGS, LANE_H, NOTE_H as PODH,
  stringY, zoneCursor, noteZoneCompact, POD_HEADER_OFF
} from '../../../utils/tabUtils'
import {
  SEL_COL, PEND_COL, LEGATO_COL
} from './sceneConstants'
import { findFretForNote, findFretForPc, nextFretSamePc, getNoteName } from '../../../utils/guitarUtils'
import { RhythmModifierService } from '../../../services/RhythmModifierService'
import { ModeZoneService } from '../../../services/ModeZoneService'
import { PodModifierService } from '../../../services/PodModifierService'
import { FretboardHighlightService } from '../../../services/FretboardHighlightService'
import { LegatoFretVisualizationService } from '../../../services/LegatoFretVisualizationService'
import { ColorService } from '../../../services/ColorService'
import { LegatoLine } from './LegatoLine'
import { NoteDisc } from './NoteDisc'
import { SubNoteBody } from './SubNoteBody'
import { PodModifierDisc, PodModifierPopover, InstrumentTrackDisc } from '../PodModifierUI'
import { passWheel } from './passWheel'
import { useShallow } from 'zustand/react/shallow'

interface NotePodsProps {
  scrollX: number
  halfW: number
  invStretchX: number
  pxPerWUX: number
  pxPerWUY: number
  totalMeasures: number
  tuningArr: string[]
  scaleNotes: string[]
  BEHAVIORS: Record<LegatoBehavior, { name: string, icon: string }>
  BEHAVIOR_KEYS: LegatoBehavior[]
  DISC_PALETTE: Record<string, { fill: string; border: string; text: string }>
  
  // Selection/Hover state from hooks
  selectedIds: Set<string>
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
  inputVal: string
  setInputVal: (val: string) => void
  newNoteIds: React.MutableRefObject<Set<string>>
  
  legatoSourceId: string | null
  setLegatoSourceId: (id: string | null) => void

  // Helpers/Handlers
  getNoteColor: (note: TablatureNote, skipDarken?: boolean, fretOverride?: number) => string
  getNoteGeo: (w: number) => THREE.ShapeGeometry
  getBorderGeo: (w: number) => THREE.ShapeGeometry
  confirmEdit: (id: string, val: string) => void
  onNoteDown: (e: ThreeEvent<PointerEvent>, note: TablatureNote) => void
  pushHistory: () => void
}

/**
 * NotePods Component
 * Renders individual notes on the tablature:
 * - Legato lines
 * - Instrument track bubbles
 * - Note bodies (with rhythm materialization)
 * - Note discs (fret and name)
 * - Interaction overlays
 * - Inline fret editor
 */
export const NotePods: React.FC<NotePodsProps> = ({
  scrollX, halfW, invStretchX, pxPerWUX, pxPerWUY, totalMeasures, tuningArr, scaleNotes,
  BEHAVIORS, BEHAVIOR_KEYS, DISC_PALETTE,
  selectedIds, setSelectedIds, editingId, setEditingId, inputVal, setInputVal, newNoteIds,
  legatoSourceId, setLegatoSourceId,
  getNoteColor, getNoteGeo, getBorderGeo, confirmEdit, onNoteDown, pushHistory
}) => {
  const { gl } = useThree()
  const { 
    notes, chordGroups, rhythmModifiers,
    updateNote, deleteNote, setLegato, addLegatoIntermediate, syncLegato,
    setLegatoBehavior, setLegatoAuto, setLegatoChain, renderLegato,
    playbackBeat, isPlaying
  } = useTablatureR3FStore(useShallow(s => ({
    notes: s.notes,
    chordGroups: s.chordGroups,
    rhythmModifiers: s.rhythmModifiers,
    updateNote: s.updateNote,
    deleteNote: s.deleteNote,
    setLegato: s.setLegato,
    addLegatoIntermediate: s.addLegatoIntermediate,
    syncLegato: s.syncLegato,
    setLegatoBehavior: s.setLegatoBehavior,
    setLegatoAuto: s.setLegatoAuto,
    setLegatoChain: s.setLegatoChain,
    renderLegato: s.renderLegato,
    playbackBeat: s.playbackBeat,
    isPlaying: s.isPlaying
  })))

  const intermediateIds = useMemo(() => {
    const s = new Set<string>()
    for (const n of notes) {
      if (n.intermediateNoteIds) {
        for (const id of n.intermediateNoteIds) s.add(id)
      }
    }
    return s
  }, [notes])

  const bubbleGeo = useMemo(() => new THREE.CircleGeometry(0.12, 16), [])

  const LEFT_MARGIN_W = 0.85 // Local constant for offset matching TablatureR3F

  return (
    <group>
      {notes.map(note => {
        const subNotes = RhythmModifierService.getVirtualRhythm(note)
        const items = subNotes || [{
          startBeat: note.startBeat,
          duration: note.duration,
          id: note.id
        }]

        const isSelected     = selectedIds.has(note.id)
        const isEditing      = editingId === note.id
        const isLegatoSource = legatoSourceId === note.id
        const isIntermediate = intermediateIds.has(note.id)
        const y              = stringY(note.string)
        const wOriginal      = note.duration * BEAT_W

        const noteChordGroup = chordGroups.find(g => g.noteIds.includes(note.id))
        const noteChordRhythmMod = (noteChordGroup && !isIntermediate && !note.legatoPrev)
          ? rhythmModifiers.find(m => m.targetType === 'chord' && m.targetId === noteChordGroup.id && m.kind !== 'arpeggio')
          : undefined
        
        const instrBubblePx     = 22
        const instrBubbleRadius = (instrBubblePx * 1.2 / 2) / pxPerWUX
        const instrGapWU        = 5 / pxPerWUX
        const instrPodL         = note.startBeat * BEAT_W
        const instrPodR         = instrPodL + note.duration * BEAT_W
        const instrCamL         = scrollX - halfW
        const podStickyLeftX    = Math.max(instrPodL, Math.min(instrPodR, instrCamL + 0.05 * invStretchX))
        const instrBubbleX      = podStickyLeftX - instrGapWU - instrBubbleRadius

        const effFret = ModeZoneService.getVirtualFret(note, totalMeasures) ?? note.fret

        return (
          <group key={note.id} renderOrder={8}>
            {note.legatoNext && (
              <LegatoLine sourceId={note.id} destId={note.legatoNext} noteColor={(n) => getNoteColor(n, true)} legatoSourceId={legatoSourceId} invStretchX={invStretchX} />
            )}

            {noteChordRhythmMod && (
              <Html position={[instrBubbleX, y, 0.07]} center zIndexRange={[71, 71]} style={{ pointerEvents: 'auto' }} onWheel={passWheel}>
                <InstrumentTrackDisc mod={noteChordRhythmMod} noteId={note.id} size={instrBubblePx} />
              </Html>
            )}

            {items.map((item, idx) => {
              const w          = item.duration * BEAT_W
              const cx         = item.startBeat * BEAT_W + w / 2
              const color      = getNoteColor(note, false, effFret)
              const podWidthPx = w / (2 * halfW) * gl.domElement.clientWidth

              const discTargetPx = PODH * 0.87 * pxPerWUY
              const discPx       = Math.min(discTargetPx, podWidthPx * 0.92)
              const discRadius   = (discPx / 2) / pxPerWUX
              const showDisc     = podWidthPx >= 16
              const podL         = cx - w / 2
              const podR         = cx + w / 2
              const camL         = scrollX - LEFT_MARGIN_W - halfW
              const discCenterWorldX = Math.max(podL + discRadius, Math.min(podR - discRadius, camL + discRadius + 0.05 * invStretchX))
              const discX        = discCenterWorldX - cx

              const locked = RhythmModifierService.isLegatoLocked(note.id)
              const showLegatoBubble  = idx === 0 && !isIntermediate && !subNotes && podWidthPx >= 35 && !legatoSourceId && !locked
              const showLegatoActions = idx === 0 && !isIntermediate && !subNotes && podWidthPx >= 35 && !!note.legatoNext
              const bubbleOff         = Math.min(w * 0.45, 0.3 * invStretchX)

              const isFundamental = (() => {
                const group = chordGroups.find(g => g.noteIds.includes(note.id))
                if (!group) return false
                const chord = Chord.get(group.chordName)
                const rootPc = chord.root || chord.notes[0]
                if (!rootPc) return false
                const noteName = getNoteName(tuningArr[note.string], effFret)
                return Note.pitchClass(noteName) === Note.pitchClass(rootPc)
              })()

              const labelColor = ColorService.getContrastColor(color)
              const noteNamePc = Note.pitchClass(getNoteName(tuningArr[note.string], effFret))
              const discColors = DISC_PALETTE[color] || { fill: '#333', border: '#000', text: '#fff' }

              const isActive   = isPlaying && playbackBeat >= item.startBeat && playbackBeat < item.startBeat + item.duration
              const grayTarget = isPlaying ? (isActive ? 0 : 1) : 0

              return (
                <group key={item.id} position={[cx, y, 0]}>
                  {isSelected && !isEditing && idx === 0 && (
                    <mesh geometry={getBorderGeo(wOriginal)} position={[wOriginal/2 - w/2, 0, -0.005]}>
                      <meshBasicMaterial color={SEL_COL} />
                    </mesh>
                  )}

                  <SubNoteBody w={w} color={color} colorB={discColors.fill} isFundamental={isFundamental} getNoteGeo={getNoteGeo} grayTarget={grayTarget} />

                  {showLegatoBubble && (
                    <mesh position={[w/2 - bubbleOff, 0, 0.01]} geometry={bubbleGeo} scale={[invStretchX, 1, 1]} renderOrder={9}>
                      <meshBasicMaterial color={isLegatoSource ? SEL_COL : labelColor} transparent opacity={0.9} />
                    </mesh>
                  )}

                  {showLegatoActions && (() => {
                    const discWU    = 26 / pxPerWUX
                    const gapWU     = 5 / pxPerWUX
                    const camL      = scrollX - LEFT_MARGIN_W - halfW
                    const camR      = camL + 2 * halfW
                    const podL      = note.startBeat * BEAT_W
                    if (podL + w <= camL || podL >= camR) return null
                    const targetX   = Math.max(camL + 0.06 * invStretchX, podL - discWU - gapWU)
                    const relativeX = targetX - cx
                    const behavior  = note.legatoBehavior || 'chromatique'
                    const curIdx    = BEHAVIOR_KEYS.indexOf(behavior)
                    const popLocked = RhythmModifierService.isLegatoLocked(note.id)
                    const count     = note.legatoCount ?? (note.intermediateNoteIds?.length ?? 2)

                    return (
                      <group position={[relativeX, 0, 0.1]}>
                        <Html position={[discWU / 2, 0, 0]} center style={{ pointerEvents: 'auto', transform: 'none' }} zIndexRange={[90, 90]} onWheel={passWheel}>
                          <div onPointerDown={e => e.stopPropagation()} onWheel={passWheel}>
                            <PodModifierDisc
                              emojiStr=":link:" size={26} discBg="#1a0800" borderCol="#FF9500" title={`Legato — ${BEHAVIORS[behavior].name}`}
                              popoverContent={close => (
                                <PodModifierPopover
                                  nav={!popLocked ? {
                                    label: BEHAVIORS[behavior].name,
                                    prev: () => setLegatoBehavior(note.id, BEHAVIOR_KEYS[(curIdx - 1 + BEHAVIOR_KEYS.length) % BEHAVIOR_KEYS.length], tuningArr, scaleNotes),
                                    next: () => setLegatoBehavior(note.id, BEHAVIOR_KEYS[(curIdx + 1) % BEHAVIOR_KEYS.length], tuningArr, scaleNotes),
                                  } : undefined}
                                  emojiStr=":link:" onClose={close} className="legato-popover"
                                >
                                  {!popLocked && note.legatoNext && (
                                    <div className="arpeggio-popover__count" style={{ marginBottom: 0 }}>
                                      <button className="pop-nav" onClick={() => { const next = Math.max(1, count - 1); pushHistory(); setLegato(note.id, note.legatoNext!, next, tuningArr); syncLegato(note.id, tuningArr, scaleNotes) }}>
                                        <span className="material-symbols-outlined">remove</span>
                                      </button>
                                      <span className="arpeggio-popover__count-value">{count}</span>
                                      <button className="pop-nav" onClick={() => { const next = Math.min(32, count + 1); pushHistory(); setLegato(note.id, note.legatoNext!, next, tuningArr); syncLegato(note.id, tuningArr, scaleNotes) }}>
                                        <span className="material-symbols-outlined">add</span>
                                      </button>
                                    </div>
                                  )}
                                  <div className="pop-divider" />
                                  {!locked && (
                                    <button className="pop-toggle" onClick={() => { pushHistory(); renderLegato(note.id); close() }} title="Figer">
                                      <span className="material-symbols-outlined">merge</span>
                                    </button>
                                  )}
                                  {!popLocked && (
                                    <>
                                      <button className={`pop-toggle${note.legatoAuto !== false ? ' active' : ''}`} onClick={() => setLegatoAuto(note.id, note.legatoAuto === false)} title="Sync Auto"><span className="material-symbols-outlined">sync</span></button>
                                      <button className={`pop-toggle${note.legatoChain ? ' active' : ''}`} onClick={() => setLegatoChain(note.id, !note.legatoChain)} title="Mode Chaîne"><span className="material-symbols-outlined">mediation</span></button>
                                      <button className={`pop-toggle${note.legatoOvershoot ? ' active' : ''}`} onClick={() => { updateNote(note.id, { legatoOvershoot: !note.legatoOvershoot }, tuningArr, scaleNotes); syncLegato(note.id, tuningArr, scaleNotes) }} title="Dépassement"><span className="material-symbols-outlined">expand</span></button>
                                    </>
                                  )}
                                </PodModifierPopover>
                              )}
                            />
                          </div>
                        </Html>
                      </group>
                    )
                  })()}

                  {showDisc && !isEditing && (
                    <NoteDisc
                      discX={discX} discPx={discPx} fill={discColors.fill} border={discColors.border} text={discColors.text} fret={effFret} noteName={noteNamePc} locked={locked}
                      onClick={e => {
                        e.stopPropagation()
                        if (legatoSourceId) {
                          if (legatoSourceId !== note.id) setLegato(legatoSourceId, note.id)
                          setLegatoSourceId(null)
                          return
                        }
                        setEditingId(note.id); setInputVal(String(note.fret)); setSelectedIds(new Set([note.id]))
                      }}
                      onMouseEnter={() => {
                        FretboardHighlightService.setHighlights([{ si: note.string, fret: note.fret }])
                        if (note.legatoNext || note.legatoPrev || note.legatoRatio) LegatoFretVisualizationService.show(note.id, notes)
                      }}
                      onMouseLeave={() => { FretboardHighlightService.clearHighlights(); LegatoFretVisualizationService.clear() }}
                    />
                  )}

                  <mesh position={[0, 0, 0.05]}
                    onPointerDown={e => {
                      if (e.button !== 0) return
                      e.stopPropagation()
                      if (editingId && editingId !== note.id) confirmEdit(editingId, inputVal)
                      const wPod  = note.duration * BEAT_W
                      const lxPod = e.point.x - note.startBeat * BEAT_W
                      const hasV = !!RhythmModifierService.getVirtualRhythm(note)
                      const showB = !hasV && !intermediateIds.has(note.id) && (wPod * pxPerWUX) >= 35
                      const tp = RhythmModifierService.isLegatoLocked(note.id) ? 'move' : noteZoneCompact(lxPod, wPod, invStretchX, showB)
                      
                      if (legatoSourceId) {
                        if (legatoSourceId !== note.id) setLegato(legatoSourceId, note.id)
                        setLegatoSourceId(null)
                        return
                      }
                      if (tp === 'bubble-next') { setLegatoSourceId(note.id); return }

                      pushHistory()
                      setSelectedIds(new Set([note.id]))
                      // Note: drag.current management remains in TablatureScene for now as it coordinates multiple pod types
                      // But the event info is passed via props or a shared ref if needed.
                      onNoteDown(e, note)
                    }}
                    onPointerMove={e => {
                      // Cursor handling
                    }}
                  >
                    <planeGeometry args={[w, LANE_H]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                  </mesh>

                  {isEditing && (
                    <Html position={[discX, 0, 0]} center style={{ pointerEvents: 'auto' }} onWheel={passWheel}>
                      <input className="tab-r3f-fret-input" value={inputVal} autoFocus maxLength={3}
                        onWheel={passWheel}
                        onChange={ev => {
                          const raw = ev.target.value
                          if (/^[A-Ga-g]/.test(raw)) setInputVal(raw.replace(/[^A-Ga-g#b0-9]/g, '').slice(0, 3))
                          else setInputVal(raw.replace(/\D/g, '').slice(0, 2))
                        }}
                        onKeyDown={ev => {
                          ev.stopPropagation()
                          if (ev.key === 'Enter')  confirmEdit(note.id, inputVal)
                          if (ev.key === 'Escape') { setEditingId(null); setInputVal('') }
                        }}
                        onBlur={() => confirmEdit(note.id, inputVal)} />
                    </Html>
                  )}
                </group>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

// Temporary placeholder for onNoteDown if not passed as prop
const onNoteDown = () => {}
