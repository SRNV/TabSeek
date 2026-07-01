import React, { useState, useMemo } from 'react'
import './ProgressionsList.scss'
import { chordProgressions } from '../../data/progressions'
import ProgressionItem from '../progression/ProgressionItem'
import eventBus from '../../eventBus'

export default function ProgressionsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const categories = useMemo(() => {
    const cats = new Set(chordProgressions.map(p => p.compatibleModes[0]))
    return Array.from(cats).sort()
  }, [])

  const filteredProgressions = useMemo(() => {
    return chordProgressions
      .filter(progression => {
        const matchesSearch =
          progression.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          progression.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory =
          categoryFilter === '' ||
          progression.compatibleModes.includes(categoryFilter)
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => a.numerals.split('-').length - b.numerals.split('-').length)
  }, [searchQuery, categoryFilter])

  function dragStart(event: React.DragEvent, progression: any) {
    event.dataTransfer.setData('application/json', JSON.stringify(progression))
    event.dataTransfer.effectAllowed = 'copy'
    eventBus.emit('progressionDragStart', progression)
  }

  function playProgression(progression: any) {
    eventBus.emit('playProgression', progression)
  }

  return (
    <div className="progressions-list">
      <div className="progressions-container">
        {filteredProgressions.map(progression => (
          <ProgressionItem
            key={progression.name}
            progression={progression}
            onDragStart={(e: React.DragEvent) => dragStart(e, progression)}
            onPlayProgression={() => playProgression(progression)}
          />
        ))}
      </div>
      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher une progression..."
          className="search-input"
        />
        <div className="filter-options">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
