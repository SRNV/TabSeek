import { create } from 'zustand'
import type { PanelId, UIState } from '../types/ui'

export const routePanels: Record<string, PanelId[]> = {
  '/':             ['notes', 'modes', 'chords', 'guitar'],
  '/chords':       ['notes', 'chords', 'guitar'],
  '/progressions': ['notes', 'modes', 'guitar'],
  '/tablature':    ['notes', 'modes', 'chords', 'guitar'],
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
