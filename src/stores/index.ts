// Mise à jour du store pour inclure chordRootNote
import { defineStore } from 'pinia';
import type { ModeGuitar } from '../types';
import { Note } from 'tonal';
import type { ChordsCompleteDef } from '@/composables/chords';

// Définition de mode par défaut
const defaultMode: ModeGuitar = {
  name: "ionian",
  aliases: ["major", "M"],
  modeNum: 0,
  mode: 0,
  intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
  alt: [],
  triad: "major",
  seventh: "maj7",
  category: '',
};

export const useMainStore = defineStore('main', {
  state: () => ({
    userScale: 'C4',
    selectedMidi: null as number | null,
    selectedMode: defaultMode.name,
    modeObject: defaultMode,
    chordRootNote: 'C4',
    chordRootObject: null as ChordsCompleteDef | null,
    chordRootNoteType: 'major',
  }),
  
  actions: {
    setUserScale(scale: string) {
      this.userScale = scale;
    },
    
    setSelectedMidi(midi: number | null) {
      this.selectedMidi = midi;
      
      // Si un MIDI est sélectionné, mettre également à jour la note fondamentale pour les accords
      if (midi !== null) {
        const noteStr = Note.fromMidi(midi);
        if (noteStr) {
          this.setChordRootNote(noteStr);
        }
      }
    },
    
    clearSelectedMidi() {
      this.selectedMidi = null;
    },
    
    // Mise à jour de l'action pour définir le mode sélectionné
    setSelectedMode(mode: string | ModeGuitar) {
      if (typeof mode === 'string') {
        this.selectedMode = mode;
      } else {
        this.selectedMode = mode.name;
        this.modeObject = mode;
      }
    },
    
    // Définir le mode par son objet complet
    setModeObject(modeObj: ModeGuitar) {
      this.modeObject = modeObj;
      this.selectedMode = modeObj.name;
    },
    
    // Nouvelle action pour définir la fondamentale des accords
    setChordObject(obj: any) {
      this.chordRootObject = obj;
    },
    setChordRootNote(note: string, type = '') {
      this.chordRootNote = note;
    },
    setChordRootNoteType(type: string) {
      this.chordRootNoteType = type;
    }
  },
  
  getters: {
    // Récupérer les notes du mode actuel à partir des intervalles
    modeNotes: (state) => {
      return state.modeObject.intervals.map(interval => 
        Note.transpose(state.userScale, interval)
      );
    },
    
    // Récupérer l'accord triade associé au mode
    modeTriad: (state) => {
      return state.modeObject.triad;
    },
    
    // Récupérer l'accord de septième associé au mode
    modeSeventh: (state) => {
      return state.modeObject.seventh;
    }
  }
});