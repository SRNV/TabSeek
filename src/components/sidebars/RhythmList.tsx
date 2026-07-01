import React, { useState } from 'react'
import * as nodeEmoji from 'node-emoji'
import './RhythmList.scss'
import { rhythmPatterns } from '../../data/rhythmPatterns'
import type { RhythmPatternDef } from '../../types'
import { useMainStore } from '../../stores/useMainStore'

function getPatternEmoji(pattern: RhythmPatternDef): string {
  if (!pattern.emoji) return '🎵'
  const name = pattern.emoji.replace(/:/g, '')
  const r = nodeEmoji.get(name)
  return r && !r.startsWith(':') ? r : '🎵'
}

export default function RhythmList() {
  const selectedRhythm = useMainStore(s => s.selectedRhythm)
  const setSelectedRhythm = useMainStore(s => s.setSelectedRhythm)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const groupedPatterns = React.useMemo(() => {
    const groups: Record<string, RhythmPatternDef[]> = {}
    rhythmPatterns.forEach(p => {
      const feel = p.feel.charAt(0).toUpperCase() + p.feel.slice(1)
      if (!groups[feel]) groups[feel] = []
      groups[feel].push(p)
    })
    // Sort patterns within each group and sort groups alphabetically
    const sortedGroups: Record<string, RhythmPatternDef[]> = {}
    Object.keys(groups).sort().forEach(feel => {
      sortedGroups[feel] = groups[feel].sort((a, b) => a.name.localeCompare(b.name))
    })
    return sortedGroups
  }, [])

  function selectRhythm(rhythm: RhythmPatternDef) {
    setSelectedRhythm(rhythm)
  }

  function toggleCategory(feel: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(feel)) next.delete(feel)
      else next.add(feel)
      return next
    })
  }

  function onDragStart(e: React.DragEvent, rhythm: RhythmPatternDef, trackIndex?: number) {
    const payload = {
      kind: 'rhythm',
      pattern: rhythm,
      trackIndex: trackIndex ?? -1 // -1 means use default logic if no track specified
    }
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Visual feedback for dragging a specific track
    if (trackIndex !== undefined) {
      const target = e.currentTarget as HTMLElement
      target.classList.add('dragging-child')
      setTimeout(() => target.classList.remove('dragging-child'), 0)
    }
  }

  return (
    <div className="rhythm-list">
      {Object.entries(groupedPatterns).map(([feel, patterns]) => (
        <div key={feel} className={`rhythm-list__category ${!expandedCategories.has(feel) ? 'collapsed' : ''}`}>
          <div className="rhythm-list__category-header" onClick={() => toggleCategory(feel)}>
            <div className="rhythm-list__category-title">{feel} ({patterns.length})</div>
            <span className="material-symbols-outlined expand-icon">
              {expandedCategories.has(feel) ? 'expand_less' : 'expand_more'}
            </span>
          </div>
          
          {expandedCategories.has(feel) && (
            <div className="rhythm-list__category-content">
              {patterns.map((pattern) => (
                <div
                  key={pattern.name}
                  className={['rhythm-list__item', selectedRhythm?.name === pattern.name ? 'active' : ''].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={e => onDragStart(e, pattern)}
                  onClick={() => selectRhythm(pattern)}
                >
                  <div className="rhythm-list__header">
                    <span className="rhythm-list__emoji">{getPatternEmoji(pattern)}</span>
                    <div className="rhythm-list__info">
                      <span className="rhythm-list__name">{pattern.name}</span>
                      <span className="rhythm-list__meta">
                        {pattern.timeSignature} · {pattern.feel} · {pattern.bars} mesure(s)
                      </span>
                    </div>
                  </div>
                  {pattern.description && (
                    <p className="rhythm-list__description">
                      {pattern.description.length <= 100
                        ? pattern.description
                        : pattern.description.substring(0, 100) + '…'}
                    </p>
                  )}

                  <div className="rhythm-list__tracks">
                    <div 
                      className="rhythm-list__track-pill all"
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onDragStart(e, pattern, -2); // -2 means merge all tracks
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="track-name">All</span>
                    </div>
                    {pattern.tracks.map((track, idx) => (
                      <div 
                        key={track.part}
                        className="rhythm-list__track-pill"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          onDragStart(e, pattern, idx);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="track-name">{track.part}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rhythm-list__genres">
                    {pattern.compatibleGenres.map(genre => (
                      <span key={genre} className="rhythm-list__genre-tag">{genre}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
