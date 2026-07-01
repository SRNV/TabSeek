/**
 * @file TablatureKeyboard.test.ts
 * Tests F5 — édition de corde au clavier (↑/↓) dans useTablatureKeyboard.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTablatureKeyboard } from '../../hooks/useTablatureKeyboard'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { useRef } from 'react'

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

function makeProps(overrides: Partial<Parameters<typeof useTablatureKeyboard>[0]> = {}) {
  const selectedIdsRef         = { current: new Set<string>() }
  const selectedChordGroupIdsRef = { current: new Set<string>() }
  const clipboard              = { current: { notes: [], groups: [] } }
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
    tuningArr: ['E2', 'A2', 'D3', 'G3', 'C4', 'e4'],
    scaleNotes: [],
    clipboard,
    ...overrides,
  } as Parameters<typeof useTablatureKeyboard>[0]
}

describe('useTablatureKeyboard — F5 string navigation', () => {
  beforeEach(() => {
    const s = useTablatureR3FStore.getState()
    s.notes = []
    s.chordGroups = []
    s.rhythmModifiers = []
    s.past = []
    s.future = []
  })

  it('ArrowUp déplace la note sélectionnée d\'une corde vers le haut', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 2, fret: 5, startBeat: 0, duration: 1 })

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(pushHistory).toHaveBeenCalledOnce()
    expect(updateNote).toHaveBeenCalledWith(id, { string: 3 }, props.tuningArr, props.scaleNotes)
  })

  it('ArrowDown déplace la note sélectionnée d\'une corde vers le bas', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id = addNote({ string: 3, fret: 2, startBeat: 0, duration: 1 })

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowDown')

    expect(pushHistory).toHaveBeenCalledOnce()
    expect(updateNote).toHaveBeenCalledWith(id, { string: 2 }, props.tuningArr, props.scaleNotes)
  })

  it('ArrowUp est bloqué si une note est déjà sur la corde 5 (haute)', () => {
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

  it('ArrowDown est bloqué si une note est déjà sur la corde 0 (basse)', () => {
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

  it('ArrowUp bloque tout si une seule note du groupe est en limite', () => {
    const { addNote } = useTablatureR3FStore.getState()
    const id1 = addNote({ string: 3, fret: 0, startBeat: 0, duration: 1 })
    const id2 = addNote({ string: 5, fret: 0, startBeat: 0, duration: 1 }) // déjà à la limite

    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })
    props.selectedIdsRef.current = new Set([id1, id2])

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(updateNote).not.toHaveBeenCalled()
    expect(pushHistory).not.toHaveBeenCalled()
  })

  it('ArrowUp est ignoré sans sélection', () => {
    const updateNote = vi.fn()
    const pushHistory = vi.fn()
    const props = makeProps({ updateNote, pushHistory })

    renderHook(() => useTablatureKeyboard(props))
    fireKey('ArrowUp')

    expect(updateNote).not.toHaveBeenCalled()
  })
})
