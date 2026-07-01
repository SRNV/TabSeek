/**
 * @file DropPreview.test.ts
 * Tests F6 — TablatureDropService.computeDropPreview
 *
 * computeDropPreview est une fonction pure (zéro side-effect, ne touche pas le store)
 * qui calcule les positions (si, fret, startBeat, duration) que les notes occuperaient
 * si le drag était relâché à (si, beat). Utilisée pour le rendu ghost avant le drop.
 *
 * Tuning TabSeek = ['E2','A2','D3','G3','C4','E4']
 */
import { describe, it, expect } from 'vitest'
import { TablatureDropService } from '../../services/TablatureDropService'

const TUNING = ['E2', 'A2', 'D3', 'G3', 'C4', 'E4']
const BEAT = 0
const SI = 0

describe('TablatureDropService.computeDropPreview — F6', () => {

  // [F6-01] Accord unique (_chordType) → retourne des notes sur les bonnes cordes
  it('[F6-01] accord unique retourne au moins 3 notes avec fret valide (0-24)', () => {
    const payload = { name: 'C major', numerals: 'I', compatibleModes: [], _chordType: 'major' }
    const notes = TablatureDropService.computeDropPreview(payload as any, SI, BEAT, TUNING, 'C')
    expect(notes.length).toBeGreaterThanOrEqual(3)
    for (const n of notes) {
      expect(n.si).toBeGreaterThanOrEqual(0)
      expect(n.si).toBeLessThanOrEqual(5)
      expect(n.fret).toBeGreaterThanOrEqual(0)
      expect(n.fret).toBeLessThanOrEqual(24)
    }
  })

  // [F6-02] Progression I-IV-V → 3 groupes de notes à des startBeat décalés
  it('[F6-02] progression I-IV-V produit des notes décalées dans le temps', () => {
    const payload = { name: 'I-IV-V', numerals: 'I-IV-V', compatibleModes: [] }
    const notes = TablatureDropService.computeDropPreview(payload as any, SI, BEAT, TUNING, 'C')
    // 3 accords → 3 startBeat distincts
    const beats = new Set(notes.map(n => n.startBeat))
    expect(beats.size).toBe(3)
  })

  // [F6-03] Pas de doublons de corde par startBeat
  it('[F6-03] pas deux notes sur la même corde au même startBeat', () => {
    const payload = { name: 'I-IV', numerals: 'I-IV', compatibleModes: [] }
    const notes = TablatureDropService.computeDropPreview(payload as any, SI, BEAT, TUNING, 'C')
    const groups = new Map<number, Set<number>>()
    for (const n of notes) {
      if (!groups.has(n.startBeat)) groups.set(n.startBeat, new Set())
      expect(groups.get(n.startBeat)!.has(n.si)).toBe(false)
      groups.get(n.startBeat)!.add(n.si)
    }
  })

  // [F6-04] Payload inconnu (_chordType non reconnu) → retourne [] sans crash
  it('[F6-04] payload avec chordType inconnu retourne tableau vide sans crash', () => {
    const payload = { name: 'x', numerals: 'I', compatibleModes: [], _chordType: 'nonexistent-chord-xyz' }
    const notes = TablatureDropService.computeDropPreview(payload as any, SI, BEAT, TUNING, 'C')
    expect(notes).toEqual([])
  })

  // [F6-05] Les startBeat correspondent à beat + ci * CHORD_DUR (4 beats par accord)
  it('[F6-05] les startBeat sont correctement décalés de 4 beats par accord', () => {
    const payload = { name: 'I-V', numerals: 'I-V', compatibleModes: [] }
    const notes = TablatureDropService.computeDropPreview(payload as any, SI, 8, TUNING, 'C')
    const beats = [...new Set(notes.map(n => n.startBeat))].sort((a, b) => a - b)
    expect(beats[0]).toBe(8)   // accord I à beat 8
    expect(beats[1]).toBe(12)  // accord V à beat 8+4=12
  })
})
