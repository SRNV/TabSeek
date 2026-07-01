import React, { useMemo } from 'react'
import './ModesSideBar.scss'
import { useMainStore } from '../../stores/useMainStore'
import { EXTRA_MODES } from '../../data/extraModes'
import type { ModeGuitar } from '../../types/mode'

const categoryDescriptions: Record<string, string> = {
  "Modes Principaux": "Les sept modes de la gamme majeure, chacun avec sa propre couleur sonore.",
  "Modes mineurs mélodiques et harmoniques": "Modes dérivés des gammes mineures mélodiques et harmoniques.",
  "Gammes pentatoniques": "Gammes à cinq notes, simples mais expressives.",
  "Gammes hexatoniques": "Gammes à six notes créant des couleurs sonores spécifiques.",
  "Gammes octatoniques et symétriques": "Gammes à structure symétrique offrant des possibilités harmoniques modernes.",
  "Modes japonais": "Gammes traditionnelles japonaises avec leur sonorité distinctive.",
  "Gammes ethniques et folkloriques": "Gammes issues de diverses traditions musicales du monde entier.",
  "Gammes de jazz et contemporaines": "Gammes utilisées dans le jazz moderne et les musiques contemporaines.",
  "Gammes supplémentaires": "Gammes additionnelles avec des caractéristiques sonores uniques.",
  "Modes additionnels": "Autres modes intéressants qui enrichissent le vocabulaire modal."
}

export default function ModesSideBar() {
  const selectedMode = useMainStore(s => s.selectedMode)
  const setSelectedMode = useMainStore(s => s.setSelectedMode)
  const setModeObject = useMainStore(s => s.setModeObject)

  const modesByCategory = useMemo(() => {
    const result: Record<string, ModeGuitar[]> = {}
    EXTRA_MODES.forEach(mode => {
      const category = mode.category || 'Autres traditions'
      if (!result[category]) result[category] = []
      result[category].push(mode)
    })
    return result
  }, [])

  function selectMode(mode: ModeGuitar) {
    setSelectedMode(mode)
    setModeObject(mode)
  }

  return (
    <div className="menu">
      {Object.entries(modesByCategory).map(([category, modes]) => (
        <div key={category} className="chord-category">
          <h2 className="category-title">{category}</h2>
          {categoryDescriptions[category] && (
            <p className="category-description">{categoryDescriptions[category]}</p>
          )}
          <div className="chord-buttons">
            {modes.map(mode => (
              <button
                key={mode.name}
                className={['item', selectedMode === mode.name ? 'current' : ''].filter(Boolean).join(' ')}
                onClick={(e) => { e.stopPropagation(); selectMode(mode) }}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
