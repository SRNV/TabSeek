import React from 'react'
import { create } from '@react-three/test-renderer'
import { NotePods } from '../../components/tablature/scene/NotePods'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'

vi.mock('../../stores/useTablatureR3FStore', () => {
  const mockStore = vi.fn()
  Object.assign(mockStore, {
    getState: vi.fn()
  })
  return {
    useTablatureR3FStore: mockStore
  }
})

describe('NotePods', () => {
  const mockNotes = [
    { id: 'n1', string: 0, fret: 5, startBeat: 0, duration: 1 }
  ]

  beforeEach(() => {
    vi.mocked(useTablatureR3FStore).mockReturnValue({
      notes: mockNotes,
      chordGroups: [],
      rhythmModifiers: [],
      modeZones: [],
      updateNote: vi.fn(),
      setLegato: vi.fn(),
      syncLegato: vi.fn(),
      setLegatoBehavior: vi.fn(),
      setLegatoAuto: vi.fn(),
      setLegatoChain: vi.fn(),
      renderLegato: vi.fn(),
    } as any)
    vi.mocked(useTablatureR3FStore.getState).mockReturnValue({
      notes: mockNotes,
      chordGroups: [],
      rhythmModifiers: [],
      modeZones: [],
      isPlaying: false,
      playbackBeat: 0,
    } as any)
  })

  it('should render notes from the store', async () => {
    const renderer = await create(
      <NotePods
        scrollX={0} halfW={10} invStretchX={1} pxPerWUX={100} pxPerWUY={100}
        totalMeasures={4} tuningArr={['E2']} scaleNotes={[]}
        BEHAVIORS={{} as any} BEHAVIOR_KEYS={[]} DISC_PALETTE={{}}
        selectedIds={new Set()} setSelectedIds={vi.fn()}
        editingId={null} setEditingId={vi.fn()}
        inputVal="" setInputVal={vi.fn()}
        newNoteIds={{ current: new Set() } as any}
        legatoSourceId={null} setLegatoSourceId={vi.fn()}
        getNoteColor={() => '#ff0000'}
        confirmEdit={vi.fn()}
        onNoteDown={vi.fn()}
        pushHistory={vi.fn()}
      />
    )

    const noteGroups = renderer.scene.findAllByType('Group')
    expect(noteGroups.length).toBeGreaterThan(0)
  })
})
