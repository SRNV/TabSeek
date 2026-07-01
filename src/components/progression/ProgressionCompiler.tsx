import React, { useState, useEffect, useRef, useMemo } from 'react'
import './ProgressionCompiler.scss'
import { useMainStore } from '../../stores/useMainStore'
import { playFullChord } from '../../hooks/useAudio'
import { Chord, Note } from 'tonal'
import { romanToDegree, getMajorScaleNotes } from '../../utils/chordUtils'
import ProgressionsList from '../sidebars/ProgressionsList'
import ProgressionDropZone from './ProgressionDropZone'
import eventBus from '../../eventBus'
import type { ChordProgression } from '../../types'

export default function ProgressionCompiler() {
  const userScaleRaw = useMainStore(s => s.userScale)

  const [compiledProgressions, setCompiledProgressions] = useState<ChordProgression[]>([])
  const [tempo, setTempo] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [currentProgressionIndex, setCurrentProgressionIndex] = useState(-1)
  const [currentChordIndex, setCurrentChordIndex] = useState(-1)

  const playbackTimeoutRef = useRef<number | null>(null)

  const userScale = useMemo(() => userScaleRaw.replace(/\d+$/, ''), [userScaleRaw])
  const currentKeyDisplay = userScale

  function clearPlaybackTimeouts() {
    if (playbackTimeoutRef.current !== null) {
      window.clearTimeout(playbackTimeoutRef.current)
      playbackTimeoutRef.current = null
    }
  }

  function getChordTypeFromNumeral(numeral: string, isMajor: boolean, base: string, stripped: string): string {
    const modifiers = stripped.substring(base.length)
    if (modifiers.includes('°') || modifiers.includes('dim')) return 'dim'
    if (modifiers.includes('+') || modifiers.includes('aug')) return 'aug'
    if (modifiers.includes('maj7')) return isMajor ? 'maj7' : 'mMaj7'
    if (modifiers.includes('m7b5') || modifiers.includes('ø') || modifiers.includes('Ø')) return 'm7b5'
    if (modifiers.includes('7')) return isMajor ? '7' : 'm7'
    if (modifiers.includes('6')) return isMajor ? '6' : 'm6'
    if (!isMajor) return 'm'
    return ''
  }

  function getChordNotes(rootNote: string, chordType: string): string[] {
    try {
      const chord = Chord.get(`${rootNote}${chordType}`)
      if (chord.empty) return [`${rootNote}4`]
      return chord.notes.map(note => `${note}4`)
    } catch { return [`${rootNote}4`] }
  }

  function stopCompiledProgression() {
    clearPlaybackTimeouts()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentProgressionIndex(-1)
    setCurrentChordIndex(-1)
  }

  function pauseCompiledProgression() {
    setIsPaused(true)
    clearPlaybackTimeouts()
  }

  // Use refs for playback state to avoid stale closures
  const stateRef = useRef({ isPlaying: false, isPaused: false, compiledProgressions, tempo, currentProgressionIndex: 0, currentChordIndex: 0, userScale, repeat })
  useEffect(() => {
    stateRef.current = { isPlaying, isPaused, compiledProgressions, tempo, currentProgressionIndex, currentChordIndex, userScale, repeat }
  })

  function playNextChord(progIdx: number, chordIdx: number) {
    const s = stateRef.current
    if (!s.isPlaying || s.isPaused) return

    const beatDuration = 60 / s.tempo

    if (progIdx >= s.compiledProgressions.length) {
      if (s.repeat) {
        setCurrentProgressionIndex(0)
        setCurrentChordIndex(0)
        playNextChord(0, 0)
      } else {
        stopCompiledProgression()
      }
      return
    }

    const progression = s.compiledProgressions[progIdx]
    if (!progression) { stopCompiledProgression(); return }

    const numerals = progression.numerals.split('-')
    if (chordIdx >= numerals.length) {
      setCurrentProgressionIndex(progIdx + 1)
      setCurrentChordIndex(0)
      playNextChord(progIdx + 1, 0)
      return
    }

    setCurrentProgressionIndex(progIdx)
    setCurrentChordIndex(chordIdx)

    const numeral = numerals[chordIdx]
    const scaleNotes = getMajorScaleNotes(s.userScale)
    const { degree, isMajor, base, alteration, stripped } = romanToDegree(numeral)
    let chordRoot = scaleNotes[(degree - 1) % 7]
    if (alteration !== 0) {
      const midi = Note.midi(chordRoot + '4')
      if (midi !== null && midi !== undefined) chordRoot = Note.pitchClass(Note.fromMidi(midi + alteration))
    }
    const chordType = getChordTypeFromNumeral(numeral, isMajor, base, stripped)
    const chordNotes = getChordNotes(chordRoot, chordType)

    playFullChord(chordNotes, beatDuration, 'sine').then(() => {
      playbackTimeoutRef.current = window.setTimeout(() => {
        playNextChord(progIdx, chordIdx + 1)
      }, beatDuration * 1000)
    })
  }

  function playCompiledProgression() {
    if ((isPlaying && !isPaused) || compiledProgressions.length === 0) return
    if (isPaused) {
      setIsPaused(false)
      playNextChord(currentProgressionIndex, currentChordIndex)
      return
    }
    setIsPlaying(true)
    setIsPaused(false)
    setCurrentProgressionIndex(0)
    setCurrentChordIndex(0)
    // Use a small timeout to let state update before starting playback
    setTimeout(() => playNextChord(0, 0), 10)
  }

  function onDrop(event: React.DragEvent) {
    const data = event.dataTransfer?.getData('application/json')
    if (data) {
      try {
        const progression = JSON.parse(data)
        setCompiledProgressions(prev => [...prev, progression])
      } catch {}
    }
  }

  function moveItemUp(index: number) {
    if (index > 0) {
      setCompiledProgressions(prev => {
        const arr = [...prev]
        const temp = arr[index]
        arr[index] = arr[index - 1]
        arr[index - 1] = temp
        return arr
      })
    }
  }

  function moveItemDown(index: number) {
    setCompiledProgressions(prev => {
      if (index >= prev.length - 1) return prev
      const arr = [...prev]
      const temp = arr[index]
      arr[index] = arr[index + 1]
      arr[index + 1] = temp
      return arr
    })
  }

  function removeItem(index: number) {
    setCompiledProgressions(prev => prev.filter((_, i) => i !== index))
  }

  function clearCompilation() {
    stopCompiledProgression()
    setCompiledProgressions([])
  }

  function onPlayProgressionEvent(progression: any) {
    setCompiledProgressions([progression])
    stopCompiledProgression()
    setTimeout(() => {
      setIsPlaying(true)
      setIsPaused(false)
      setCurrentProgressionIndex(0)
      setCurrentChordIndex(0)
      setTimeout(() => playNextChord(0, 0), 20)
    }, 50)
  }

  useEffect(() => {
    eventBus.on('playProgression', onPlayProgressionEvent)
    return () => {
      clearPlaybackTimeouts()
      eventBus.off('playProgression', onPlayProgressionEvent)
    }
  }, [])

  return (
    <div className="progression-compiler">
      <div className="main-content">
        <ProgressionDropZone
          compiledProgressions={compiledProgressions}
          currentKeyDisplay={currentKeyDisplay}
          userScale={userScale}
          tempo={tempo}
          isPlaying={isPlaying}
          isPaused={isPaused}
          repeat={repeat}
          currentProgressionIndex={currentProgressionIndex}
          currentChordIndex={currentChordIndex}
          onDrop={onDrop}
          onMoveItemUp={moveItemUp}
          onMoveItemDown={moveItemDown}
          onRemoveItem={removeItem}
          onPlayProgression={playCompiledProgression}
          onPauseProgression={pauseCompiledProgression}
          onStopProgression={stopCompiledProgression}
          onToggleRepeat={() => setRepeat(r => !r)}
          onClearCompilation={clearCompilation}
          onTempoChange={setTempo}
        />
      </div>
    </div>
  )
}
