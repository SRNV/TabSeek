import { create } from 'zustand'

export type PanelId = 'notes' | 'modes' | 'chords'

export const routePanels: Record<string, PanelId[]> = {
  '/':             ['notes', 'modes', 'chords'],
  '/chords':       ['notes', 'chords'],
  '/progressions': ['notes', 'modes'],
  '/tablature':    ['notes', 'modes', 'chords'],
}

interface UIState {
  activePanel: PanelId | null
  togglePanel: (id: PanelId) => void
  closePanel: () => void
  closePanelIfUnavailable: (routePath: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  activePanel: null,
  togglePanel: (id) => set(s => ({ activePanel: s.activePanel === id ? null : id })),
  closePanel: () => set({ activePanel: null }),
  closePanelIfUnavailable: (routePath) => {
    const available = routePanels[routePath] ?? []
    const { activePanel } = get()
    if (activePanel && !available.includes(activePanel)) {
      set({ activePanel: null })
    }
  },
}))
