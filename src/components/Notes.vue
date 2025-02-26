<!-- Notes.vue amélioré -->
<script lang="ts" setup>
import { defineProps, ref, computed } from 'vue';
import { Interval, Note, Scale } from 'tonal';
import { playChord, playFullChord } from '../composables/useAudio';
import { useGuitarNotes } from '../composables/useGuitarNotes';
import { getJoinedNotes, getJoinedNotesColor, getNoteDegree } from '../composables/useNoteHelpers';
import { getReadableChordName } from '../composables/tonalChordsMapping';
import { useMainStore } from '../stores';

const props = defineProps<{
  notes: string[];
  collection: string[];
  duration?: number;
  gap?: number;
  type?: OscillatorType;
  chordType?: string;  // Nouveau: type d'accord pour l'affichage
}>();
const store = useMainStore();
const duration = props.duration ?? 0.2;
const gap = props.gap ?? 0.1;
const type = props.type ?? 'sine';
const localNotes = ref([...props.notes]);
const isPlaying = ref(false);
const selectedOctave = ref(0);
const selectedWaveform = ref<OscillatorType>('sine');

// Waveforms disponibles avec descriptions
const waveforms = [
  { id: 'sine', name: 'Sine', description: 'Doux et pur' },
  { id: 'square', name: 'Square', description: 'Riche en harmoniques' },
  { id: 'sawtooth', name: 'Sawtooth', description: 'Brillant, synthétique' },
  { id: 'triangle', name: 'Triangle', description: 'Entre sine et square' }
];

// Mettre en surbrillance la fondamentale
const rootNote = computed(() => props.notes.length > 0 ? props.notes[0] : '');

// Formater l'affichage du type d'accord s'il est fourni
const formattedChordType = computed(() => {
  if (!props.chordType) return '';
  return getReadableChordName(props.chordType, 'symbol');
});

const { GuitarNote } = useGuitarNotes();

function getDisplay(note: string): string {
  const noteData = Note.get(note);
  if (noteData.acc && noteData.acc.length > 0) {
    return `${note} ${Note.enharmonic(note)}`;
  }
  return note;
}

function getColor(note: string): string {
  return getJoinedNotesColor(note,
      0,
      Scale.get(`${store.userScale} ${store.selectedMode}`).notes,
      localNotes.value
    );
}

function getNoteRole(note: string): string {
  const pc1 = Note.get(note).pc;
  const pc2 = Note.get(rootNote.value).pc;
  
  if (pc1 === pc2) return 'Fondamentale';
  
  // Trouver l'intervalle entre la fondamentale et cette note
  const interval = Interval.distance(rootNote.value, note);
  
  switch (interval) {
    case '3M': return 'Tierce majeure';
    case '3m': return 'Tierce mineure';
    case '5P': return 'Quinte juste';
    case '5d': return 'Quinte diminuée';
    case '5A': return 'Quinte augmentée';
    case '7M': return 'Septième majeure';
    case '7m': return 'Septième mineure';
    case '9M': return 'Neuvième';
    case '11P': return 'Onzième';
    case '13M': return 'Treizième';
    default: return interval;
  }
}

async function playArpeggio() {
  if (isPlaying.value) return;
  
  isPlaying.value = true;
  await playChord(localNotes.value, duration, gap, selectedWaveform.value);
  isPlaying.value = false;
}

async function playFull() {
  if (isPlaying.value) return;
  
  isPlaying.value = true;
  await playFullChord(localNotes.value, 1, selectedWaveform.value);
  isPlaying.value = false;
}

function octave(semi: number) {
  // Stocker la valeur pour une utilisation ultérieure
  selectedOctave.value += semi === 12 ? 1 : (semi === -12 ? -1 : 0);
  
  const result: string[] = [];
  localNotes.value.forEach((n) => {
    const note = Note.transpose(n, Interval.fromSemitones(semi));
    result.push(note);
  });
  localNotes.value = result;
  playArpeggio();
}

function resetOctave() {
  if (selectedOctave.value === 0) return;
  
  const semi = -12 * selectedOctave.value;
  const result: string[] = [];
  localNotes.value.forEach((n) => {
    const note = Note.transpose(n, Interval.fromSemitones(semi));
    result.push(note);
  });
  localNotes.value = result;
  selectedOctave.value = 0;
}

function changeWaveform(waveform: OscillatorType) {
  selectedWaveform.value = waveform;
}
</script>

<template>
  <div class="notes-container">
    <div class="notes-header" v-if="formattedChordType">
      <span class="chord-type">{{ formattedChordType }}</span>
    </div>
    
    <div class="notes-grid" @click.stop="playArpeggio">
      <div
        class="note-square octave-btn"
        :class="{ disabled: selectedOctave <= -2 }"
        @click.stop="octave(-12)"
      >
        <span>-</span>
      </div>
      
      <div
        v-for="(note, index) in localNotes"
        :key="index"
        class="note-square"
        :style="{ backgroundColor: getColor(note) }"
        :title="getNoteRole(note)"
      >
        <span>{{ getDisplay(note) }}</span>
      </div>
      
      <div
        class="note-square octave-btn"
        :class="{ disabled: selectedOctave >= 2 }"
        @click.stop="octave(12)"
      >
        <span>+</span>
      </div>
      
      <div
        class="note-square reset-btn"
        @click.stop="resetOctave">
        <span>Reset</span>
      </div>
    </div>
    
    <div class="controls-container">
      <div class="play-btns">
        <button class="play-btn arpeggio" :class="{ active: isPlaying }" @click.stop="playArpeggio">
          <span class="play-icon">♫</span> Arpège
        </button>
        <button class="play-btn chord" :class="{ active: isPlaying }" @click.stop="playFull">
          <span class="play-icon">♪</span> Accord
        </button>
      </div>
      
      <div class="waveform-selector">
        <span class="waveform-label">Timbre:</span>
        <div class="waveform-buttons">
          <button 
            v-for="wf in waveforms" 
            :key="wf.id"
            class="waveform-btn"
            :class="{ active: selectedWaveform === wf.id }"
            :title="wf.description"
            @click.stop="changeWaveform(wf.id as OscillatorType)">
            {{ wf.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<style scoped lang="scss">
.notes-container {
  display: flex;
  flex-direction: column;
  width: fit-content;
  cursor: pointer;
  user-select: none;
  padding: 15px;
  border: 1px solid rgba(118, 118, 118, 0.5);
  border-radius: 10px;
  background-color: #2d2d2d;
  margin-bottom: 15px;
  margin-top: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(118, 118, 118, 0.8);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  .notes-header {
    margin-bottom: 10px;
    text-align: center;
    
    .chord-type {
      font-size: 1.2rem;
      font-weight: bold;
      color: #e0e0e0;
    }
  }
  
  .notes-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .note-square {
    border-radius: 8px;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #444;
    font-weight: bold;
    font-size: 0.75rem;
    color: #2c2c2c;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    
    &.octave-btn {
      background-color: #555;
      font-size: 1.2rem;
      
      &:hover {
        background-color: #666;
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
    }
    
    &.reset-btn {
      background-color: #664;
      font-size: 0.7rem;
      
      &:hover {
        background-color: #775;
      }
    }
  }
  
  .controls-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    
    .play-btns {
      display: flex;
      gap: 10px;
      margin-bottom: 5px;
    }
    
    .play-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      
      .play-icon {
        font-size: 1.1rem;
      }
      
      &.arpeggio {
        background-color: #3a7ca5;
        color: white;
        
        &:hover {
          background-color: #4a8cb5;
        }
      }
      
      &.chord {
        background-color: #6a7a8a;
        color: white;
        
        &:hover {
          background-color: #7a8a9a;
        }
      }
      
      &.active {
        background-color: #9a8a7a;
      }
    }
    
    .waveform-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .waveform-label {
        font-size: 0.8rem;
        color: #aaa;
        min-width: 50px;
      }
      
      .waveform-buttons {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      
      .waveform-btn {
        padding: 4px 8px;
        background-color: #444;
        border: none;
        border-radius: 4px;
        font-size: 0.7rem;
        color: #ddd;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: #555;
        }
        
        &.active {
          background-color: #665;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .notes-container {
    padding: 10px;
    
    .note-square {
      width: 40px;
      height: 40px;
      font-size: 0.7rem;
    }
    
    .play-btn {
      padding: 6px 10px;
      font-size: 0.8rem;
    }
  }
}
</style>