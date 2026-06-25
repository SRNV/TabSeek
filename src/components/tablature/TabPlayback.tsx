import React, { useState, useEffect, useRef } from 'react'
import './TabPlayback.scss'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { playNote } from '../../composables/useAudio'
import { Note, Interval } from 'tonal'

export default function TabPlayback() {
  const store = useTablatureStore()
  const [tempo, setTempoLocal] = useState(store.tempo)
  const [metronomeEnabled, setMetronomeEnabled] = useState(store.metronomeEnabled)
  const [filterByScaleEnabled, setFilterByScaleEnabled] = useState(store.filterByScaleEnabled)

  const audioContextRef = useRef<AudioContext | null>(null)
  const playbackIntervalRef = useRef<number | null>(null)

  useEffect(() => { store.setTempo(tempo) }, [tempo])
  useEffect(() => { store.setMetronomeEnabled(metronomeEnabled) }, [metronomeEnabled])
  useEffect(() => { store.setFilterByScaleEnabled(filterByScaleEnabled) }, [filterByScaleEnabled])

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current !== null) {
        window.clearTimeout(playbackIntervalRef.current)
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close() } catch {}
        audioContextRef.current = null
      }
    }
  }, [])

  function createAudioContext() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      return audioContextRef.current
    } catch {
      return null
    }
  }

  function playMetronomeClick(accentuated = false) {
    if (!store.metronomeEnabled) return
    const context = createAudioContext()
    if (!context) return
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    oscillator.type = accentuated ? 'triangle' : 'sine'
    oscillator.frequency.value = accentuated ? 1200 : 800
    gainNode.gain.setValueAtTime(0.001, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1)
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.1)
  }

  function calculateNoteDuration(rhythmValue?: number) {
    const wholeNoteDuration = 4 * (60 / store.tempo)
    const subdivision = (rhythmValue && rhythmValue > 0) ? rhythmValue : 4
    return wholeNoteDuration / subdivision
  }

  async function playColumn() {
    if (!store.isPlaying) return

    const globalCol = store.currentPlayingColumn
    const tuningArray = store.tuningArray()
    const rhythmValue = store.flatRhythmValue(globalCol)
    const noteDuration = calculateNoteDuration(rhythmValue)

    if (globalCol >= store.totalColumns()) {
      store.stopPlayback()
      return
    }

    const isFirstBeat = store.isMeasureStart(globalCol)
    playMetronomeClick(isFirstBeat)

    const playPromises: Promise<void>[] = []

    for (let stringIndex = 0; stringIndex < tuningArray.length; stringIndex++) {
      const cellValue = store.flatCellValue(stringIndex, globalCol)
      if (cellValue && cellValue !== '-') {
        const stringTuning = tuningArray[stringIndex]
        if (cellValue === 'x' || cellValue === 'X') continue

        let fretNumber: number
        let oscillatorType = 'sine'

        if (cellValue.includes('h')) {
          fretNumber = parseInt(cellValue.replace('h', ''), 10)
          oscillatorType = 'triangle'
        } else if (cellValue.includes('p')) {
          fretNumber = parseInt(cellValue.replace('p', ''), 10)
          oscillatorType = 'triangle'
        } else if (cellValue.includes('/')) {
          fretNumber = parseInt(cellValue.split('/')[0], 10)
          oscillatorType = 'sawtooth'
        } else {
          fretNumber = parseInt(cellValue, 10)
        }

        if (isNaN(fretNumber)) continue

        const noteToPlay = Note.transpose(stringTuning, Interval.fromSemitones(fretNumber))
        playPromises.push(playNote(noteToPlay, noteDuration, oscillatorType as OscillatorType))
      }
    }

    await Promise.all(playPromises)

    useTablatureStore.setState(s => ({ currentPlayingColumn: s.currentPlayingColumn + 1 }))

    playbackIntervalRef.current = window.setTimeout(() => {
      playColumn()
    }, noteDuration * 1000)
  }

  function togglePlayback() {
    if (store.isPlaying) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }

  function startPlayback() {
    if (store.isPlaying) return
    store.togglePlayback()
    createAudioContext()
    playColumn()
  }

  function pausePlayback() {
    store.togglePlayback()
    if (playbackIntervalRef.current !== null) {
      window.clearTimeout(playbackIntervalRef.current)
      playbackIntervalRef.current = null
    }
  }

  return (
    <div className="playback-controls">
      <button className="play-btn" onClick={togglePlayback} title="Lire/Pause">
        <span className="play-icon">{store.isPlaying ? '⏸' : '▶'}</span>
      </button>

      <button
        className="stop-btn"
        onClick={() => store.stopPlayback()}
        disabled={!store.isPlaying && store.currentPlayingColumn === -1}
        title="Arrêter"
      >
        <span className="stop-icon">⏹</span>
      </button>

      <div className="metronome-control">
        <label className="metronome-label">
          <input
            type="checkbox"
            checked={metronomeEnabled}
            onChange={e => setMetronomeEnabled(e.target.checked)}
          />
          Métronome
        </label>
      </div>

      <div className="filter-scale-control">
        <label className="filter-scale-label">
          <input
            type="checkbox"
            checked={filterByScaleEnabled}
            onChange={e => setFilterByScaleEnabled(e.target.checked)}
          />
          Filtrer par gamme
        </label>
      </div>

      <div className="tempo-control">
        <label htmlFor="tempo-input">Tempo: {tempo} BPM</label>
        <input
          id="tempo-input"
          type="range"
          value={tempo}
          onChange={e => setTempoLocal(Number(e.target.value))}
          min="40"
          max="240"
          step="4"
        />
      </div>
    </div>
  )
}
