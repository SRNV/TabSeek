import { useMainStore } from '../stores/useMainStore'
import type { TablatureNote } from '../types'

export const LegatoFretVisualizationService = {
  show: (noteId: string, notes: TablatureNote[]) => {
    const note = notes.find((n: TablatureNote) => n.id === noteId)
    if (!note) return

    // Find the source note of this legato chain
    let source: TablatureNote | undefined
    if (note.legatoNext) {
      source = note
    } else if (note.legatoPrev) {
      source = notes.find((n: TablatureNote) => n.id === note.legatoPrev)
    } else {
      source = notes.find((n: TablatureNote) => n.intermediateNoteIds?.includes(noteId))
    }

    if (!source?.legatoNext) return

    const intermediates = (source.intermediateNoteIds ?? [])
      .map((id: string) => notes.find((n: TablatureNote) => n.id === id))
      .filter((n): n is TablatureNote => !!n)
      .sort((a: TablatureNote, b: TablatureNote) => a.startBeat - b.startBeat)

    const destination = notes.find(n => n.id === source!.legatoNext)

    const chain: TablatureNote[] = [source, ...intermediates, ...(destination ? [destination] : [])]
    useMainStore.getState().setLegatoFretHighlights(
      chain.map(n => ({ si: n.string, fret: n.fret }))
    )
  },

  clear: () => {
    useMainStore.getState().setLegatoFretHighlights([])
  },
}
