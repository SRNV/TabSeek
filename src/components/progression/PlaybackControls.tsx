import React from 'react'
import './PlaybackControls.scss'

interface PlaybackControlsProps {
  tempo: number
  isPlaying: boolean
  isPaused: boolean
  repeat: boolean
  hasContent: boolean
  onPlayProgression: () => void
  onPauseProgression: () => void
  onStopProgression: () => void
  onToggleRepeat: () => void
  onClearCompilation: () => void
  onTempoChange: (tempo: number) => void
}

const TEMPO_PRESETS = [60, 80, 100, 120, 140, 160]

export default function PlaybackControls({
  tempo, isPlaying, isPaused, repeat, hasContent,
  onPlayProgression, onPauseProgression, onStopProgression,
  onToggleRepeat, onClearCompilation, onTempoChange,
}: PlaybackControlsProps) {
  function handlePlayPause() {
    if (isPlaying && !isPaused) {
      onPauseProgression()
    } else {
      onPlayProgression()
    }
  }

  return (
    <div className="compilation-controls">
      <div className="playback-main-controls">
        <button
          className="control-btn play-btn"
          onClick={handlePlayPause}
          disabled={!hasContent}
          title={isPlaying && !isPaused ? 'Mettre en pause' : 'Lire la progression'}
        >
          <span className="btn-icon">{isPlaying && !isPaused ? '⏸' : '▶'}</span>
          {isPlaying && !isPaused ? 'Pause' : isPaused ? 'Reprendre' : 'Jouer'}
        </button>

        <button
          className="control-btn stop-btn"
          onClick={onStopProgression}
          disabled={!isPlaying && !isPaused}
          title="Arrêter la lecture"
        >
          <span className="btn-icon">⏹</span> Arrêter
        </button>

        <button
          className={['control-btn', 'repeat-btn', repeat ? 'active' : ''].filter(Boolean).join(' ')}
          onClick={onToggleRepeat}
          disabled={!hasContent}
          title="Répéter la progression"
        >
          <span className="btn-icon">🔁</span> {repeat ? 'Répétition activée' : 'Répéter'}
        </button>

        <button
          className="control-btn clear-btn"
          onClick={onClearCompilation}
          disabled={!hasContent}
          title="Effacer toutes les progressions"
        >
          <span className="btn-icon">&#10006;</span> Effacer
        </button>
      </div>

      <div className="playback-controls">
        <label className="control-label">Tempo: {tempo} BPM</label>
        <input
          type="range"
          value={tempo}
          onChange={e => onTempoChange(parseInt(e.target.value))}
          min="60"
          max="200"
          step="4"
          className="tempo-slider"
        />
        <div className="tempo-presets">
          {TEMPO_PRESETS.map(preset => (
            <button
              key={preset}
              className={['tempo-preset-btn', tempo === preset ? 'active' : ''].filter(Boolean).join(' ')}
              onClick={() => onTempoChange(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
