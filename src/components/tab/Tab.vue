<!-- Tab.vue simplifié - Matching MIDI -->
<template>
  <div class="tab-container">
    <div class="tab-navigation-container">
      <!-- Flèche de gauche -->
      <button class="nav-btn nav-left" @click="moveLeft" :disabled="localVisibleStart === 0"
        :class="{ disabled: localVisibleStart === 0 }">
        <span class="arrow-icon">◀</span>
      </button>

      <!-- Contenu de la tablature -->
      <div class="tab-content">
        <div v-for="(cord, cIdx) in cords" :key="'cord-' + cIdx" class="fret-row">
          <GuitarNote class="open-string" :position="0" :cord="cIdx" :displayName="getNoteName(cord, 0)"
            :background="getNoteBackground(cord, 0)" :degreeLabel="getDegreeLabel(cord, 0)"
            :forChordsDisplay="localVisibleStart === 0" />
          <GuitarNote v-for="fret in visibleFretRange" :key="'fret-' + fret + 1" :position="fret + 1" :cord="cIdx"
            :displayName="getNoteName(cord, fret + 1)" :background="getNoteBackground(cord, fret + 1)"
            :degreeLabel="getDegreeLabel(cord, fret + 1)" :forChordsDisplay="true" />
        </div>
      </div>

      <!-- Flèche de droite -->
      <button class="nav-btn nav-right" @click="moveRight" :disabled="localVisibleEnd >= tabLength"
        :class="{ disabled: localVisibleEnd >= tabLength }">
        <span class="arrow-icon">▶</span>
      </button>
    </div>

    <!-- Indicateur de position -->
    <div class="position-indicator">
      Position {{ localVisibleStart + 1 }}-{{ localVisibleEnd + 1 }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps } from 'vue';
import GuitarNote from './GuitarNote.vue';
import { getNoteName } from '../../composables/useNoteHelpers';
import { Note } from 'tonal';
import { useMainStore } from '../../stores';

const props = defineProps<{
  midiList: number[]; // Liste des notes MIDI à mettre en évidence
  matchType: 'one' | 'multiple'; // Type de matching: 'one' pour exact, 'multiple' pour modulo 12
  tabLength: number;
  visibleStart: number;
  visibleEnd: number;
  forChordsDisplay?: boolean;
  cords?: string[];
}>();

const store = useMainStore();
const localVisibleStart = ref(props.visibleStart);
const localVisibleEnd = ref(props.visibleEnd);

// Couleurs
const DEFAULT_COLOR = '#333';
const HIGHLIGHT_COLOR = '#FF9500'; // Orange pour les notes qui matchent

// Accordage standard
const cords = computed(() => {
  return props.cords ?? ["E2", "A2", "D3", "G3", "C3", "E4"].reverse();
});

const visibleFretRange = computed(() => {
  const range: number[] = [];
  for (let i = localVisibleStart.value; i <= localVisibleEnd.value; i++) {
    range.push(i);
  }
  return range;
});

// Fonction pour déterminer la couleur de fond d'une note
function getNoteBackground(cord: string, fret: number): string {
  const noteName = getNoteName(cord, fret);
  const noteMidi = Note.midi(noteName);

  if (noteMidi === null) return DEFAULT_COLOR;

  // Vérifier si la note correspond à une des notes de la liste
  if (props.matchType === 'one') {
    // Matching exact du MIDI - colorer en orange si exact, sinon couleur par défaut
    return props.midiList.map((m) => m % 12).includes(noteMidi % 12) ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
  } else {
    // Matching modulo 12 (classe de hauteur) - toujours colorer selon le degré dans la gamme
    return getScaleColor(noteName);
  }
}

// Fonction pour déterminer le degré/label d'une note
function getDegreeLabel(cord: string, fret: number): string {
  const noteName = getNoteName(cord, fret);
  const noteMidi = Note.midi(noteName);

  if (noteMidi === null) return '';

  if (props.matchType === 'one') {
    // Pour le type 'one', afficher un indicateur seulement pour les correspondances exactes
    return props.midiList.includes(noteMidi) ? '●' : '';
  } else {
    // Pour le type 'multiple', toujours afficher le degré dans la gamme
    return getScaleDegree(noteName);
  }
}

// Fonction pour obtenir la couleur basée sur le degré dans la gamme actuelle
function getScaleColor(noteName: string): string {
  const { GuitarNote } = useGuitarNotes();
  const scaleNotes = store.modeNotes;
  const degree = getNoteDegree(noteName, scaleNotes);
  return degree ? GuitarNote.colors[degree - 1] : DEFAULT_COLOR;
}

// Fonction pour obtenir le degré dans la gamme
function getScaleDegree(noteName: string): string {
  const scaleNotes = store.modeNotes;
  const degree = getNoteDegree(noteName, scaleNotes);
  return degree ? `${degree}°` : '';
}

// Fonction pour déterminer le degré d'une note dans une collection
function getNoteDegree(noteName: string, collection: string[]): number | null {
  const noteData = Note.get(noteName);
  const midi = noteData.midi;
  if (midi == null) return null;
  const notePc = midi % 12;
  const scaleNotes = collection.map(n => {
    const m = Note.midi(n);
    return m != null ? m % 12 : null;
  });
  const index = scaleNotes.indexOf(notePc);
  return index === -1 ? null : index + 1;
}

// Import pour les couleurs de GuitarNote
import { useGuitarNotes } from '../../composables/useGuitarNotes';

function moveLeft() {
  if (localVisibleStart.value > 0) {
    localVisibleStart.value--;
    localVisibleEnd.value--;
  }
}

function moveRight() {
  if (localVisibleEnd.value < props.tabLength) {
    localVisibleStart.value++;
    localVisibleEnd.value++;
  }
}
</script>

<style scoped lang="scss">
.tab-container {
  width: 100%;
  padding: 1rem;
  position: relative;
}

.tab-navigation-container {
  position: relative;
  display: flex;
  align-items: stretch;
  margin: 10px 0;
}

.tab-content {
  flex: 1;
  margin: 0 10px;
}

.fret-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-bottom: 10px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(50, 50, 50, 0.7);
  border: none;
  width: 40px;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;
  border-radius: 4px;
  padding: 0;

  &:hover:not(.disabled) {
    background-color: rgba(70, 70, 70, 0.9);
  }

  &.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .arrow-icon {
    font-weight: bold;
  }

  &.nav-left {
    left: 0;
  }

  &.nav-right {
    right: 0;
  }
}

.position-indicator {
  text-align: center;
  font-size: 0.8rem;
  color: #777;
  margin-top: 10px;
}

.open-string {
  border-right: 2px solid rgb(114, 114, 114) !important;
  margin-right: 6px;
  filter: brightness(0.5) saturate(1.5);
  transition: 0.5s ease;
}

// Design responsive
@media (max-width: 768px) {
  .nav-btn {
    width: 30px;
    font-size: 1.2rem;
  }
}
</style>