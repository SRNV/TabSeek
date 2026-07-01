/**
 * @file ModeZoneHighlight.test.ts
 * Tests F7 — ModeZoneService.getScaleHighlights
 *
 * La méthode retourne pour une zone donnée la liste de tous les FretHighlight
 * (si, fret, color) correspondant à chaque degré de l'échelle sur toutes les cordes.
 * La couleur de chaque highlight correspond à DEGREE_COLORS[degreeIndex].
 *
 * Tuning TabSeek = ['E2','A2','D3','G3','C4','E4']
 * C ionian (majeur) = C D E F G A B
 * C sur string 0 (E2=40) : frets 8 (C3), 20 (C4)
 * C sur string 4 (C4=60) : frets 0 (C4), 12 (C5), 24 (C6)
 */
import { describe, it, expect } from 'vitest'
import { Note } from 'tonal'
import { ModeZoneService } from '../../services/ModeZoneService'
import { DEGREE_COLORS } from '../../utils/musicColors'
import type { ModeZone } from '../../types'

const TUNING = ['E2', 'A2', 'D3', 'G3', 'C4', 'E4']

function makeZone(modeName: string): ModeZone {
  return { id: 'z1', startBeat: 0, length: 4, modeName, color: '#ff0000', forceNote: false }
}

describe('ModeZoneService.getScaleHighlights — F7', () => {

  // [F7-01] Mode inconnu → tableau vide
  it('[F7-01] mode inconnu retourne un tableau vide', () => {
    const zone = makeZone('nonexistent-mode-xyz')
    expect(ModeZoneService.getScaleHighlights(zone, TUNING, 'C4')).toEqual([])
  })

  // [F7-02] C ionian — degré 1 (C) sur string 0 (E2) : frets 8 et 20
  it('[F7-02] C ionian degré 1 apparaît sur string 0 aux frettes 8 et 20', () => {
    const zone = makeZone('ionian')
    const highlights = ModeZoneService.getScaleHighlights(zone, TUNING, 'C4')
    const str0_deg1 = highlights.filter(h => h.si === 0 && h.color === DEGREE_COLORS[0])
    expect(str0_deg1.map(h => h.fret).sort((a, b) => a - b)).toEqual([8, 20])
  })

  // [F7-03] C ionian — degré 1 sur string 4 (C4 open) : frets 0, 12, 24
  it('[F7-03] C ionian degré 1 apparaît sur string 4 aux frettes 0, 12, 24', () => {
    const zone = makeZone('ionian')
    const highlights = ModeZoneService.getScaleHighlights(zone, TUNING, 'C4')
    const str4_deg1 = highlights.filter(h => h.si === 4 && h.color === DEGREE_COLORS[0])
    expect(str4_deg1.map(h => h.fret).sort((a, b) => a - b)).toEqual([0, 12, 24])
  })

  // [F7-04] Les couleurs correspondent aux degrés : DEGREE_COLORS[0] = degré 1 = PC de C
  it('[F7-04] tous les highlights de couleur DEGREE_COLORS[0] ont le pitch class C', () => {
    const zone = makeZone('ionian')
    const highlights = ModeZoneService.getScaleHighlights(zone, TUNING, 'C4')
    const cPc = Note.pitchClass('C4') // 'C'
    const deg1Highlights = highlights.filter(h => h.color === DEGREE_COLORS[0])
    expect(deg1Highlights.length).toBeGreaterThan(0)
    for (const h of deg1Highlights) {
      const openMidi = Note.midi(TUNING[h.si] ?? 'E2') ?? 0
      const notePc = Note.pitchClass(Note.fromMidi(openMidi + h.fret))
      expect(notePc).toBe(cPc)
    }
  })

  // [F7-05] Les highlights couvrent les 6 cordes
  it('[F7-05] C ionian retourne des highlights pour chacune des 6 cordes', () => {
    const zone = makeZone('ionian')
    const highlights = ModeZoneService.getScaleHighlights(zone, TUNING, 'C4')
    const strings = new Set(highlights.map(h => h.si))
    for (let si = 0; si < 6; si++) expect(strings.has(si)).toBe(true)
  })

  // [F7-06] 7 couleurs distinctes pour les 7 degrés d'un mode heptatonique
  it('[F7-06] C ionian produit exactement 7 couleurs distinctes (une par degré)', () => {
    const zone = makeZone('ionian')
    const highlights = ModeZoneService.getScaleHighlights(zone, TUNING, 'C4')
    const colors = new Set(highlights.map(h => h.color))
    expect(colors.size).toBe(7)
  })
})
