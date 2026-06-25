import { ref } from 'vue'

export type PanelId = 'notes' | 'modes' | 'chords'

// Which panels are available per route path
export const routePanels: Record<string, PanelId[]> = {
  '/':             ['notes', 'modes', 'chords'],
  '/chords':       ['notes', 'chords'],
  '/progressions': ['notes', 'modes'],
  '/tablature':    ['notes', 'modes', 'chords'],
}

// Module-level singleton — shared across all components
const activePanel = ref<PanelId | null>(null)

export function useUIState() {
  function togglePanel(id: PanelId) {
    activePanel.value = activePanel.value === id ? null : id
  }

  function closePanelIfUnavailable(routePath: string) {
    const available = routePanels[routePath] ?? []
    if (activePanel.value && !available.includes(activePanel.value)) {
      activePanel.value = null
    }
  }

  return { activePanel, togglePanel, closePanelIfUnavailable }
}
