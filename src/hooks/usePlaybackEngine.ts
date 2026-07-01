import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import type { TablatureNote } from '../types'
import { RhythmModifierService } from '../services/RhythmModifierService'
import { ModeZoneService } from '../services/ModeZoneService'
import { FretboardHighlightService } from '../services/FretboardHighlightService'
import { LegatoFretVisualizationService } from '../services/LegatoFretVisualizationService'
import { BEATS_PER_MEAS, BEAT_W } from '../utils/tabUtils'
import { getNoteName } from '../utils/guitarUtils'
import { playNote, playFullChord, stopAllSounds } from './useAudio'

interface PlaybackEngineProps {
  notes: TablatureNote[]
  tuningArr: string[]
  totalMeasures: number
  tempo: number
  isPlaying: boolean
  isLooping: boolean
  togglePlayback: () => void
  setPlaybackBeat: (beat: number) => void
  playbackBeatRef: React.MutableRefObject<number>
  playbackCursorGroupRef: React.MutableRefObject<THREE.Group | null>
}

export const usePlaybackEngine = ({
  notes,
  tuningArr,
  totalMeasures,
  tempo,
  isPlaying,
  isLooping,
  togglePlayback,
  setPlaybackBeat,
  playbackBeatRef,
  playbackCursorGroupRef
}: PlaybackEngineProps) => {
  const lastBeatRef = useRef(playbackBeatRef.current)
  const lastActiveIdsRef = useRef<string>('')

  useFrame((_, delta) => {
    if (isPlaying) {
      const beatsPerSecond = tempo / 60
      let newBeat = playbackBeatRef.current + delta * beatsPerSecond
      
      // Highlighting logic
      const activeNotes: TablatureNote[] = []
      const activeHighlights: Array<{ si: number; fret: number }> = []
      notes.forEach(n => {
        const subNotes = RhythmModifierService.getVirtualRhythm(n)
        const vFret = ModeZoneService.getVirtualFret(n, totalMeasures) ?? n.fret
        if (subNotes) {
          const activeSub = subNotes.find(sn => newBeat >= sn.startBeat && newBeat < sn.startBeat + sn.duration)
          if (activeSub) {
            activeNotes.push(n)
            activeHighlights.push({ si: n.string, fret: vFret })
          }
        } else {
          if (newBeat >= n.startBeat && newBeat < n.startBeat + n.duration) {
            activeNotes.push(n)
            activeHighlights.push({ si: n.string, fret: vFret })
          }
        }
      })

      const activeIds = activeNotes.map(n => n.id).sort().join(',')
      if (activeIds !== lastActiveIdsRef.current) {
        lastActiveIdsRef.current = activeIds
        FretboardHighlightService.setHighlights(activeHighlights)
        const legatoNote = activeNotes.find(n => n.legatoNext || n.legatoPrev || n.legatoRatio)
        if (legatoNote) {
          LegatoFretVisualizationService.show(legatoNote.id, notes)
        } else {
          LegatoFretVisualizationService.clear()
        }
      }

      // Auto-reset / Loop check
      const rawMaxBeat = notes.length > 0
        ? Math.max(...notes.flatMap(n => {
            const virtual = RhythmModifierService.getVirtualRhythm(n)
            if (virtual && virtual.length > 0) return virtual.map(sn => sn.startBeat + sn.duration)
            return [n.startBeat + n.duration]
          }))
        : 0
      const maxBeat = Math.ceil(rawMaxBeat / BEATS_PER_MEAS) * BEATS_PER_MEAS

      if (notes.length > 0 && newBeat >= maxBeat) {
        if (isLooping) {
          newBeat = 0
          lastBeatRef.current = 0
        } else {
          newBeat = 0
          togglePlayback()
          stopAllSounds()
        }
      }

      // Sound triggering
      const start = lastBeatRef.current
      const end = newBeat
      
      if (end >= start) {
        const toPlay: Array<{ note: TablatureNote, startBeat: number, duration: number }> = []

        notes.forEach(n => {
          const subNotes = RhythmModifierService.getVirtualRhythm(n)
          if (subNotes) {
            subNotes.forEach(sn => {
              if (sn.startBeat >= start && sn.startBeat < end) {
                toPlay.push({ note: n, startBeat: sn.startBeat, duration: sn.duration })
              }
            })
          } else {
            if (n.startBeat >= start && n.startBeat < end) {
              toPlay.push({ note: n, startBeat: n.startBeat, duration: n.duration })
            }
          }
        })

        if (toPlay.length > 0) {
          const groups = new Map<number, typeof toPlay>()
          toPlay.forEach(item => {
            const list = groups.get(item.startBeat) || []
            list.push(item)
            groups.set(item.startBeat, list)
          })

          groups.forEach((items) => {
            const pitches = items.map(it => {
              const openNote = tuningArr[it.note.string] ?? 'E2'
              const fret = ModeZoneService.getVirtualFret(it.note, totalMeasures) ?? it.note.fret
              return getNoteName(openNote, fret)
            })
            const durations = items.map(it => Math.max(0.1, it.duration * (60 / tempo)))
            if (pitches.length > 1) {
              playFullChord(pitches, durations)
            } else {
              playNote(pitches[0], durations[0])
            }
          })
        }
      }

      lastBeatRef.current = newBeat
      playbackBeatRef.current = newBeat
      if (playbackCursorGroupRef.current) {
        playbackCursorGroupRef.current.position.x = newBeat * BEAT_W
      }
      setPlaybackBeat(newBeat)
    } else {
      lastBeatRef.current = playbackBeatRef.current
      if (lastActiveIdsRef.current !== '') {
        lastActiveIdsRef.current = ''
        FretboardHighlightService.clearHighlights()
        LegatoFretVisualizationService.clear()
      }
    }
  })
}
