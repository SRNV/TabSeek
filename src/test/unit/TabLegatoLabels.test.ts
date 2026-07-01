/**
 * @file TabLegatoLabels.test.ts
 * Tests de non-régression pour la visibilité des labels (note + degré)
 * sur les cellules du manche appartenant à une chaîne legato.
 *
 * Régression ciblée : quand fretboardHighlights.length > 0 forçait isHighlighted=false
 * sur une cellule de la gamme présente dans la chaîne legato, c.color devenait DEFAULT_BG
 * mais naturalColor restait la couleur de degré. L'ink était calculé sur c.color (sombre)
 * donnant un texte blanc à ~21% d'opacité — invisible.
 */

import * as THREE from 'three'
import { ColorService } from '../../services/ColorService'

const N_STRINGS = 6
const DEFAULT_BG = '#1c1c1c'
const DEGREE_COLORS = ['#FFF9B1', '#77DD77', '#AEC6CF', '#CDB4DB', '#FFB3B3', '#FFD1B3', '#FFFFFF']

// ── Reproduit la logique de Tab.tsx ─────────────────────────────────────────

function buildLegatoVisSet(highlights: Array<{ si: number; fret: number }>): Set<string> {
  return new Set(highlights.map(h => `${N_STRINGS - 1 - h.si}:${h.fret}`))
}

interface CellLike {
  si: number
  fretSemi: number
  isHighlighted: boolean
  color: THREE.Color
  naturalColor: THREE.Color
}

function getLabelProps(cell: CellLike, legatoVisSet: Set<string>) {
  const isLegato = legatoVisSet.has(`${cell.si}:${cell.fretSemi}`)
  const effectiveColor = isLegato ? cell.naturalColor : cell.color
  const ink = ColorService.getContrastColor(`#${effectiveColor.getHexString()}`)
  const showFull = cell.isHighlighted || isLegato
  return { isLegato, ink, showFull }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Tab — labels des cellules legato', () => {
  describe('buildLegatoVisSet — conversion convention store → convention visuelle', () => {
    it('si=0 (low E, store) → visualSi=5 (index 5 dans Tab)', () => {
      const set = buildLegatoVisSet([{ si: 0, fret: 3 }])
      expect(set.has('5:3')).toBe(true)
    })

    it('si=5 (high e, store) → visualSi=0 (index 0 dans Tab)', () => {
      const set = buildLegatoVisSet([{ si: 5, fret: 0 }])
      expect(set.has('0:0')).toBe(true)
    })

    it('ne matche pas une cellule voisine (fret différente)', () => {
      const set = buildLegatoVisSet([{ si: 2, fret: 5 }])
      expect(set.has('3:5')).toBe(true)
      expect(set.has('3:4')).toBe(false)
      expect(set.has('3:6')).toBe(false)
    })
  })

  describe('getLabelProps — cellule legato, hors gamme (isHighlighted=false)', () => {
    // Cas de régression : fretboardHighlights force isHighlighted=false même si la cellule
    // est dans la gamme. c.color = DEFAULT_BG mais naturalColor = couleur de degré.
    const cell: CellLike = {
      si: 3, fretSemi: 2,
      isHighlighted: false,
      color: new THREE.Color(DEFAULT_BG),
      naturalColor: new THREE.Color(DEGREE_COLORS[0]), // tonic yellow
    }
    const legatoVisSet = buildLegatoVisSet([{ si: N_STRINGS - 1 - 3, fret: 2 }])

    it('isLegato = true', () => {
      expect(getLabelProps(cell, legatoVisSet).isLegato).toBe(true)
    })

    it('showFull = true — pas de réduction d\'opacité', () => {
      expect(getLabelProps(cell, legatoVisSet).showFull).toBe(true)
    })

    it('ink calculé sur naturalColor (degré jaune → texte noir)', () => {
      // naturalColor = #FFF9B1 (jaune clair) → brightness > 0.5 → ink noir
      expect(getLabelProps(cell, legatoVisSet).ink).toBe('#000000')
    })

    it('sans le fix : ink basé sur c.color (DEFAULT_BG sombre → texte blanc) ET showFull=false', () => {
      // Documente le comportement AVANT le fix pour qu'une régression soit détectable
      const withoutFix = {
        isLegato: false, // si isLegato n'était pas calculé
        ink: ColorService.getContrastColor(`#${cell.color.getHexString()}`),
        showFull: cell.isHighlighted,
      }
      expect(withoutFix.ink).toBe('#ffffff')   // texte blanc sur fond sombre
      expect(withoutFix.showFull).toBe(false)  // opacité réduite → texte quasi invisible
    })
  })

  describe('getLabelProps — cellule legato, dans la gamme (isHighlighted=true)', () => {
    const cell: CellLike = {
      si: 2, fretSemi: 4,
      isHighlighted: true,
      color: new THREE.Color(DEGREE_COLORS[3]),         // lavender degree 4
      naturalColor: new THREE.Color(DEGREE_COLORS[3]),  // identique
    }
    const legatoVisSet = buildLegatoVisSet([{ si: N_STRINGS - 1 - 2, fret: 4 }])

    it('showFull = true', () => {
      expect(getLabelProps(cell, legatoVisSet).showFull).toBe(true)
    })

    it('ink = texte sombre (fond lavande clair)', () => {
      expect(getLabelProps(cell, legatoVisSet).ink).toBe('#000000')
    })
  })

  describe('getLabelProps — cellule hors chaîne legato', () => {
    const legatoVisSet = buildLegatoVisSet([{ si: 0, fret: 3 }])

    it('cellule non-highlighted hors legato : showFull = false', () => {
      const cell: CellLike = {
        si: 1, fretSemi: 2,
        isHighlighted: false,
        color: new THREE.Color(DEFAULT_BG),
        naturalColor: new THREE.Color(DEFAULT_BG),
      }
      expect(getLabelProps(cell, legatoVisSet).showFull).toBe(false)
    })

    it('cellule highlighted hors legato : showFull = true', () => {
      const cell: CellLike = {
        si: 1, fretSemi: 2,
        isHighlighted: true,
        color: new THREE.Color(DEGREE_COLORS[1]),
        naturalColor: new THREE.Color(DEGREE_COLORS[1]),
      }
      expect(getLabelProps(cell, legatoVisSet).showFull).toBe(true)
    })
  })
})
