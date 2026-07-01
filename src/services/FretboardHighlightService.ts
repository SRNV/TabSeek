import { useMainStore } from '../stores/useMainStore'
import { FretHighlight } from '../types'

/**
 * Service to manage specific fretboard highlights.
 * Highlights can be transient (hover, playback) or static.
 */
export const FretboardHighlightService = {
  /**
   * Set specific fret/string pairs to highlight.
   * If an empty array is passed, it clears the highlights.
   */
  setHighlights: (highlights: FretHighlight[]) => {
    useMainStore.getState().setFretboardHighlights(highlights)
  },

  /**
   * Clears all specific highlights.
   */
  clearHighlights: () => {
    useMainStore.getState().setFretboardHighlights([])
  }
}
