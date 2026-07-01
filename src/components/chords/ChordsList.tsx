import React, { useState } from 'react'
import './ChordsList.scss'
import { CHORD_TYPES_BY_CATEGORY } from '../../data/tonalChordsMapping'
import { useMainStore } from '../../stores/useMainStore'
import { ChordEmojiBox } from '../../services/ChordEmojiService'

export default function ChordsList() {
  const chordRootObject      = useMainStore(s => s.chordRootObject)
  const setChordObject       = useMainStore(s => s.setChordObject)
  const setChordRootNoteType = useMainStore(s => s.setChordRootNoteType)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  function selectChord(chord: any) {
    setChordObject(chord)
    setChordRootNoteType(chord.id)
  }

  function toggleCategory(category: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function onDragStart(e: React.DragEvent, chord: any) {
    const payload = {
      name: chord.name,
      numerals: 'I',
      description: chord.description ?? '',
      compatibleModes: [],
      _chordType: chord.id,
    }
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="chords-list">
      {Object.entries(CHORD_TYPES_BY_CATEGORY).map(([category, group]) => (
        <div key={category} className={`chords-list__category ${!expandedCategories.has(category) ? 'collapsed' : ''}`}>
          <div className="chords-list__category-header" onClick={() => toggleCategory(category)}>
            <div className="chords-list__category-title">{category} ({(group as any).chords.length})</div>
            <span className="material-symbols-outlined expand-icon">
              {expandedCategories.has(category) ? 'expand_less' : 'expand_more'}
            </span>
          </div>
          
          {expandedCategories.has(category) && (
            <div className="chords-list__category-content">
              {(group as any).description && (
                <div className="chords-list__category-description">{(group as any).description}</div>
              )}
              {(group as any).chords.map((chord: any) => (
                <div
                  key={chord.id}
                  className={['chords-list__item', chordRootObject?.id === chord.id ? 'active' : ''].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={e => onDragStart(e, chord)}
                  onClick={() => selectChord(chord)}
                >
                  <div className="chords-list__header">
                    <ChordEmojiBox chordId={chord.id} size={50} />
                    <span className="chords-list__name">
                      {chord.name}
                      {chord.symbol ? <span className="chords-list__symbol"> {chord.symbol}</span> : null}
                    </span>
                    <span className="chords-list__intervals">{chord.intervals.join(' · ')}</span>
                  </div>
                  {chord.description && (
                    <p className="chords-list__description">
                      {chord.description.length <= 80
                        ? chord.description
                        : chord.description.substring(0, 80) + '…'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
