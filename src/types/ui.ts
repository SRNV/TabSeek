export type PanelId = 'notes' | 'modes' | 'chords' | 'guitar'

export interface FretHighlight {
  si: number
  fret: number
  color?: string
}

export interface GuitarPreset {
  bank: number;
  preset: number;
  name: string;
  category: string;
}

export interface UIState {
  activePanel: PanelId | null
  togglePanel: (id: PanelId) => void
  closePanel: () => void
  closePanelIfUnavailable: (routePath: string) => void
}
