import React, { useMemo } from 'react'
import './CompiledProgressionItem.scss'
import { Note } from 'tonal'
import type { ChordProgression } from '../../composables/progressions'

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

function getMajorScaleNotes(rootNote: string): string[] {
  const intervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"]
  return intervals.map(interval => Note.transpose(rootNote, interval))
}

function romanToDegree(roman: string): number {
  const map: Record<string, number> = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
  }
  const baseRoman = roman.match(/^([IVXivx]+)/)?.[1] || ''
  return map[baseRoman] || 1
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
    const scaleNotes = getMajorScaleNotes(rootNote)
    const numerals = item.numerals.split('-')
    return numerals.map(numeral => {
      const degree = romanToDegree(numeral)
      const chordRoot = scaleNotes[(degree - 1) % 7]
      const isMajor = numeral[0] === numeral[0].toUpperCase()
      const baseRoman = numeral.match(/^([IVXivx]+)/)?.[1] || ''
      const modifiers = numeral.substring(baseRoman.length)
      let chordName = chordRoot
      if (modifiers.includes('°') || modifiers.includes('dim')) chordName = chordRoot + 'dim'
      else if (modifiers.includes('+') || modifiers.includes('aug')) chordName = chordRoot + 'aug'
      else if (modifiers.includes('maj7')) chordName = chordRoot + (isMajor ? 'maj7' : 'mMaj7')
      else if (modifiers.includes('7')) chordName = chordRoot + (isMajor ? '7' : 'm7')
      else if (modifiers.includes('6')) chordName = chordRoot + (isMajor ? '6' : 'm6')
      else if (modifiers.includes('m7b5') || modifiers.includes('Ø')) chordName = chordRoot + 'm7b5'
      else if (!isMajor) chordName = chordRoot + 'm'
      return chordName
    })
  }, [item, rootNote])

  return (
    <div className={['compiled-item', isPlaying ? 'playing' : ''].filter(Boolean).join(' ')}>
      <div className="item-content">
        <div className="item-header">
          <span className="item-name">{item.name}</span>
          <div className="item-actions">
            <button className="action-btn move-up" onClick={onMoveUp} disabled={index === 0} title="Déplacer vers le haut">&#8593;</button>
            <button className="action-btn move-down" onClick={onMoveDown} disabled={index === maxIndex} title="Déplacer vers le bas">&#8595;</button>
            <button className="action-btn remove" onClick={onRemove} title="Supprimer">&#10005;</button>
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
