import React, { useMemo } from 'react'
import './CompiledProgressionItem.scss'
import type { ChordProgression } from '../../composables/progressions'
import { numeralToChordName } from '../../utils/chordUtils'

interface CompiledProgressionItemProps {
  item: ChordProgression
  index: number
  rootNote: string
  maxIndex?: number
  isPlaying?: boolean
  currentChordIndex?: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

export default function CompiledProgressionItem({
  item,
  index,
  rootNote,
  maxIndex = 100,
  isPlaying = false,
  currentChordIndex = -1,
  onMoveUp,
  onMoveDown,
  onRemove,
}: CompiledProgressionItemProps) {
  const chordNotes = useMemo(() => {
    const numerals = item.numerals.split('-')
    return numerals.map(numeral => numeralToChordName(numeral, rootNote))
  }, [item, rootNote])

  return (
    <div className={['compiled-item', isPlaying ? 'playing' : ''].filter(Boolean).join(' ')}>
      <div className="item-content">
        <div className="item-header">
          <span className="item-name">{item.name}</span>
          <div className="item-actions">
            <button className="action-btn move-up" onClick={onMoveUp} disabled={index === 0} title="Déplacer vers le haut">
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
            <button className="action-btn move-down" onClick={onMoveDown} disabled={index === maxIndex} title="Déplacer vers le bas">
              <span className="material-symbols-outlined">arrow_downward</span>
            </button>
            <button className="action-btn remove" onClick={onRemove} title="Supprimer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="item-numerals">{item.numerals}</div>
        <div className="progression-display">
          <div className="progression-bar">
            {item.numerals.split('-').map((numeral, chordIdx) => (
              <div
                key={chordIdx}
                className={[
                  'chord-box',
                  isPlaying && currentChordIndex === chordIdx ? 'playing' : '',
                  isPlaying ? 'highlight' : ''
                ].filter(Boolean).join(' ')}
              >
                <div className="chord-numeral">{numeral}</div>
                {chordNotes[chordIdx] && (
                  <div className="chord-note">{chordNotes[chordIdx]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
