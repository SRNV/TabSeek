import { useMainStore } from '../stores/useMainStore'
import type { TablatureNote } from '../stores/useTablatureR3FStore'

export const LegatoFretVisualizationService = {
  show: (noteId: string, notes: TablatureNote[]) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    // Find the source note of this legato chain
    let source: TablatureNote | undefined
    if (note.legatoNext) {
      source = note
    } else if (note.legatoPrev) {
      source = notes.find(n => n.id === note.legatoPrev)
    } else {
      source = notes.find(n => n.intermediateNoteIds?.includes(noteId))
    }

    if (!source?.legatoNext) return

    const intermediates = (source.intermediateNoteIds ?? [])
      .map(id => notes.find(n => n.id === id))
      .filter((n): n is TablatureNote => !!n)
      .sort((a, b) => a.startBeat - b.startBeat)

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
