import React from 'react'
import './ProgressionItem.scss'
import type { ChordProgression } from '../../types'

interface ProgressionItemProps {
  progression: ChordProgression
  isPlaying?: boolean
  onDragStart: (e: React.DragEvent) => void
  onPlayProgression: () => void
}

export default function ProgressionItem({
  progression,
  isPlaying = false,
  onDragStart,
  onPlayProgression,
}: ProgressionItemProps) {
  const maxLength = 80
  const truncatedDescription = progression.description.length <= maxLength
    ? progression.description
    : progression.description.substring(0, maxLength) + '...'

  return (
    <div
      className="progression-item"
      draggable
      onDragStart={onDragStart}
    >
      <div className="progression-header">
        <span className="progression-name">{progression.name}</span>
        <div className="progression-actions">
          <button
            className="play-btn"
            onClick={(e) => { e.stopPropagation(); onPlayProgression() }}
            disabled={isPlaying}
          >
            <span className="material-symbols-outlined play-icon">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <span className="progression-category">{progression.numerals}</span>
        </div>
      </div>
      <div className="progression-description">{truncatedDescription}</div>
    </div>
  )
}
