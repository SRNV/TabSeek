import React from 'react'
import './ProgressionDropZone.scss'
import CompiledProgressionItem from './CompiledProgressionItem'
import PlaybackControls from './PlaybackControls'
import type { ChordProgression } from '../../types'

interface ProgressionDropZoneProps {
  compiledProgressions: ChordProgression[]
  currentKeyDisplay: string
  userScale: string
  tempo: number
  isPlaying: boolean
  isPaused: boolean
  repeat: boolean
  currentProgressionIndex: number
  currentChordIndex: number
  onDrop: (e: React.DragEvent) => void
  onMoveItemUp: (index: number) => void
  onMoveItemDown: (index: number) => void
  onRemoveItem: (index: number) => void
  onPlayProgression: () => void
  onPauseProgression: () => void
  onStopProgression: () => void
  onToggleRepeat: () => void
  onClearCompilation: () => void
  onTempoChange: (tempo: number) => void
}

export default function ProgressionDropZone({
  compiledProgressions,
  currentKeyDisplay,
  userScale,
  tempo,
  isPlaying,
  isPaused,
  repeat,
  currentProgressionIndex,
  currentChordIndex,
  onDrop,
  onMoveItemUp,
  onMoveItemDown,
  onRemoveItem,
  onPlayProgression,
  onPauseProgression,
  onStopProgression,
  onToggleRepeat,
  onClearCompilation,
  onTempoChange,
}: ProgressionDropZoneProps) {
  return (
    <div className="progression-drop-zone">
      <h3>Progression Compilée ({currentKeyDisplay})</h3>
      <div className={['drop-area', compiledProgressions.length === 0 ? 'empty' : ''].filter(Boolean).join(' ')}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
      >
        {compiledProgressions.length === 0 ? (
          <div className="empty-message">Glissez des progressions ici pour les compiler</div>
        ) : (
          <div className="compiled-items">
            {compiledProgressions.map((item, index) => (
              <CompiledProgressionItem
                key={index}
                item={item}
                index={index}
                rootNote={userScale}
                maxIndex={compiledProgressions.length - 1}
                isPlaying={isPlaying && currentProgressionIndex === index}
                currentChordIndex={currentProgressionIndex === index ? currentChordIndex : -1}
                onMoveUp={() => onMoveItemUp(index)}
                onMoveDown={() => onMoveItemDown(index)}
                onRemove={() => onRemoveItem(index)}
              />
            ))}
          </div>
        )}
      </div>

      <PlaybackControls
        tempo={tempo}
        isPlaying={isPlaying}
        isPaused={isPaused}
        repeat={repeat}
        hasContent={compiledProgressions.length > 0}
        onPlayProgression={onPlayProgression}
        onPauseProgression={onPauseProgression}
        onStopProgression={onStopProgression}
        onToggleRepeat={onToggleRepeat}
        onClearCompilation={onClearCompilation}
        onTempoChange={onTempoChange}
      />
    </div>
  )
}
