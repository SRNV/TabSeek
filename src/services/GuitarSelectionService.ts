import { create } from 'zustand';
import { PreferencesService } from './PreferencesService';

export interface GuitarPreset {
  bank: number;
  preset: number;
  name: string;
  category: string;
}

const DEFAULT_PRESET: GuitarPreset = {
  bank: 0,
  preset: 0,
  name: 'FG460s Pure Gtr',
  category: 'Acoustique',
};

interface GuitarSelectionState {
  selected: GuitarPreset;
  presets: GuitarPreset[];
  presetsLoaded: boolean;
  setSelected: (preset: GuitarPreset) => void;
  loadPresets: () => Promise<void>;
}

export const useGuitarSelection = create<GuitarSelectionState>((set) => ({
  selected: PreferencesService.get<GuitarPreset>('selectedGuitar', DEFAULT_PRESET),
  presets: [],
  presetsLoaded: false,

  setSelected: (preset) => {
    PreferencesService.set('selectedGuitar', preset);
    // Lazy import to avoid circular dep at module init
    import('./SoundFontService').then(({ SoundFontService }) => {
      SoundFontService.setPreset(preset.bank, preset.preset);
    });
    set({ selected: preset });
  },

  loadPresets: async () => {
    try {
      const res = await fetch('/guitars.json');
      const presets: GuitarPreset[] = await res.json();
      set({ presets, presetsLoaded: true });
    } catch (e) {
      console.warn('[GuitarSelection] Failed to load guitars.json:', e);
    }
  },
}));
