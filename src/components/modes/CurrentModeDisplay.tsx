import React, { useMemo } from 'react'
import './CurrentModeDisplay.scss'
import { useMainStore } from '../../stores/useMainStore'

const modeDescriptions: Record<string, string> = {
  'ionian': `Le mode ionien, ou gamme majeure classique, est caractérisé par sa sonorité lumineuse et joyeuse.`,
  'dorian': `Le mode dorien est une gamme mineure avec une sixte majeure distinctive.`,
  'phrygian': `Le mode phrygien se distingue immédiatement par sa seconde mineure.`,
  'lydian': `Le mode lydien, avec sa caractéristique quarte augmentée, crée une atmosphère aérienne.`,
  'mixolydian': `Le mode mixolydien, essentiellement une gamme majeure avec une septième mineure, est omniprésent dans le rock.`,
  'aeolian': `Le mode éolien, ou gamme mineure naturelle, est fondamental pour exprimer la mélancolie.`,
  'locrian': `Le mode locrien, le plus dissonant des modes diatoniques, se distingue par sa quinte diminuée.`
}

export default function CurrentModeDisplay() {
  const selectedMode = useMainStore(s => s.selectedMode)
  const modeObject = useMainStore(s => s.modeObject)
  const userScale = useMainStore(s => s.userScale)
  const getModeNotes = useMainStore(s => s.getModeNotes)

  const modeNotes = useMemo(() => getModeNotes(), [selectedMode, userScale, modeObject])

  const currentMode = {
    name: selectedMode,
    aliases: modeObject.aliases || [],
    modeNum: modeObject.modeNum || 0,
    mode: modeObject.mode || 0,
    intervals: modeObject.intervals || [],
    alt: modeObject.alt || [],
    triad: modeObject.triad || '',
    seventh: modeObject.seventh || '',
    description: modeObject.description,
    culture: modeObject.culture,
    category: modeObject.category || '',
  }

  const modeDescription = modeDescriptions[currentMode.name] ||
    `Le mode ${currentMode.name} est défini par les intervalles ${currentMode.intervals.join(', ')}.`

  return (
    <div className="chord-category">
      <h2 className="category-title">
        {currentMode.name}
        <span className="mode-scale">{userScale}</span>
      </h2>

      {currentMode.culture && (
        <div className="mode-culture">
          <span className="culture-label">Culture:</span> {currentMode.culture}
        </div>
      )}

      {(currentMode.description || modeDescription) && (
        <p className="category-description">
          {currentMode.description || modeDescription}
        </p>
      )}

      <div className="mode-details-container">
        <div className="mode-intervals details-block">
          <h3 className="details-title">Intervalles:</h3>
          <div className="interval-list">
            {currentMode.intervals.map((interval, idx) => (
              <span key={idx} className="interval-chip">{interval}</span>
            ))}
          </div>
        </div>

        <div className="mode-chords details-block">
          <h3 className="details-title">Accords:</h3>
          <div className="chords-list">
            <div className="chord-type">
              <span className="chord-label">Triade:</span>
              <span className="chord-value">{currentMode.triad}</span>
            </div>
            <div className="chord-type">
              <span className="chord-label">Septième:</span>
              <span className="chord-value">{currentMode.seventh}</span>
            </div>
          </div>
        </div>

        {modeNotes.length > 0 && (
          <div className="mode-notes details-block">
            <h3 className="details-title">Notes:</h3>
            <div className="notes-list">
              {modeNotes.map((note, idx) => (
                <span key={idx} className="note-chip">{note}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
