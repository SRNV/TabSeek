/**
 * @file TablatureKeyboard.test.ts
 * Tests F5 — édition de corde au clavier (↑/↓) dans useTablatureKeyboard.
 *
 * Comportement décidé (session 14) : l'Arrow recalcule le fret pour conserver
 * le MIDI (même hauteur sur la corde cible). Si le pitch est impossible sur la
 * corde cible (fret < 0 ou > 24), le move est silencieusement bloqué.
 *
 * Tuning TabSeek = ['E2','A2','D3','G3','C4','E4']
 * MIDI open strings = [40, 45, 50, 55, 60, 64]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTablatureKeyboard } from '../../hooks/useTablatureKeyboard'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

const TUNING = ['E2', 'A2', 'D3', 'G3', 'C4', 'E4']

function makeProps(overrides: Partial<Parameters<typeof useTablatureKeyboard>[0]> = {}) {
  const selectedIdsRef          = { current: new Set<string>() }
  const selectedChordGroupIdsRef = { current: new Set<string>() }
  const clipboard               = { current: { notes: [], groups: [] } }
  return {
    editingId: null,
    selectedIdsRef,
    selectedChordGroupIdsRef,
    legatoSourceId: null,
    setLegatoSourceId: vi.fn(),
    setSelectedIds: vi.fn(),
    setSelectedChordGroupIds: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    pushHistory: vi.fn(),
    deleteNote: vi.fn(),
    addNote: vi.fn(),
    updateNote: vi.fn(),
    addChordGroup: vi.fn(),
    tuningArr: TUNING,
    scaleNotes: [],
    clipboard,
    ...overrides,
  } as Parameters<typeof useTablatureKeyboard>[0]
}

describe('useTablatureKeyboard — F5 string navigation (pitch-preserving)', () => {
  beforeEach(() => {
    const s = useTablatureR3FStore.getState()
    s.notes = []
    s.chordGroups = []
    s.rhythmModifiers = []
    s.past = []
    s.future = []
  })

  // [KB-01] ArrowUp conserve le MIDI — D3+fret5=G3(55) → G3_string fret0=55
  it('[KB-01] ArrowUp recalcule le fret pour conserver le pitch', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 2, fret: 5, startBeat: 0, duration: 1 }) // D3+5 = MIDI 55

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(pushHistory).toHaveBeenCalledOnce()
    // G3 string (MIDI 55 open) → fret 0 pour garder MIDI 55
    expect(updateNote).toHaveBeenCalledWith(id, { string: 3, fret: 0 }, TUNING, [])
  })

  // [KB-02] ArrowDown conserve le MIDI — G3+fret2=A3(57) → D3_string fret7=57
  it('[KB-02] ArrowDown recalcule le fret pour conserver le pitch', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 3, fret: 2, startBeat: 0, duration: 1 }) // G3+2 = MIDI 57

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowDown')

    expect(pushHistory).toHaveBeenCalledOnce()
    // D3 string (MIDI 50 open) → fret 7 pour garder MIDI 57
    expect(updateNote).toHaveBeenCalledWith(id, { string: 2, fret: 7 }, TUNING, [])
  })

  // [KB-03] Pitch impossible sur la corde cible → move bloqué
  // E2 string (MIDI 40) open. ArrowDown → pas de string -1. ArrowUp vers A2.
  // Note sur string 1 (A2=45), fret 0 = MIDI 45. ArrowDown : E2 string, fret = 45-40 = 5. OK.
  // Note sur string 0 (E2=40), fret 0 = MIDI 40. ArrowDown → bloqué (borne).
  // Pitch impossible : note sur string 4 (C4=60), fret 20 = MIDI 80.
  // ArrowUp → string 5 (E4=64), fret = 80-64 = 16. OK (dans 0-24).
  // Pitch vraiment impossible : string 0 (E2=40), fret 1 = MIDI 41 (F2).
  // ArrowDown → string -1 → borne bloquée. OK, la borne est déjà couverte.
  // Test pitch impossible : note très haute — string 5 (E4=64), fret 20 = MIDI 84.
  // ArrowDown vers string 4 (C4=60): fret = 84-60 = 24. OK.
  // Essayons string 5 (E4=64), fret 21 = MIDI 85. ArrowDown → C4 string fret = 85-60 = 25 > 24 → BLOQUÉ.
  it('[KB-03] ArrowDown bloqué si pitch impossible sur la corde cible (fret > 24)', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 5, fret: 21, startBeat: 0, duration: 1 }) // E4+21 = MIDI 85

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowDown')

    // C4 string: fret = 85 - 60 = 25 > 24 → impossible → bloqué
    expect(updateNote).not.toHaveBeenCalled()
    expect(pushHistory).not.toHaveBeenCalled()
  })

  // [KB-04] ArrowUp est bloqué si une note est déjà sur la corde 5 (haute)
  it('[KB-04] ArrowUp bloqué sur corde 5 (borne haute)', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 5, fret: 0, startBeat: 0, duration: 1 })

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(updateNote).not.toHaveBeenCalled()
    expect(pushHistory).not.toHaveBeenCalled()
  })

  // [KB-05] ArrowDown est bloqué si une note est déjà sur la corde 0 (basse)
  it('[KB-05] ArrowDown bloqué sur corde 0 (borne basse)', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 0, fret: 3, startBeat: 0, duration: 1 })

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowDown')

    expect(updateNote).not.toHaveBeenCalled()
    expect(pushHistory).not.toHaveBeenCalled()
  })

  // [KB-06] Sélection multiple : tout le groupe bloqué si une seule note est en limite
  it('[KB-06] ArrowUp bloque tout si une seule note du groupe est en limite', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id1 = addNote({ string: 3, fret: 0, startBeat: 0, duration: 1 })
    const id2 = addNote({ string: 5, fret: 0, startBeat: 0, duration: 1 }) // borne haute

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id1, id2])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(updateNote).not.toHaveBeenCalled()
    expect(pushHistory).not.toHaveBeenCalled()
  })

  // [KB-07] ArrowUp ignoré sans sélection active
  it('[KB-07] ArrowUp ignoré sans sélection', () => {
    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(updateNote).not.toHaveBeenCalled()
  })
})
