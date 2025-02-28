<!-- ChordDisplay.vue -->
<template>
  <div class="container">
    <div class="liste">
      <div v-if="selectedChord" :key="selectedChord.name">
        <Tab
          :key="selectedChord.name"
          :midiList="selectedChordMidiList"
          matchType="one"
          :tabLength="tabLength"
          :visibleStart="visibleStart"
          :visibleEnd="visibleEnd"
          :withNotes="true"
        />
      </div>
    </div>
  </div>
</template>
  
<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useMainStore } from '../stores';
import { useGuitarNotes } from '../composables/useGuitarNotes';
import { CHORD_TYPES_BY_CATEGORY } from '../composables/tonalChordsMapping';
import Tab from './Tab.vue';
import { Note } from 'tonal';
import { useMidiUtils } from '../composables/useMidiUtils';

interface ChordDisplayProps {
  baseNote?: string;
}
const props = defineProps<ChordDisplayProps>();

const store = useMainStore();
const userScale = computed(() => store.userScale);
const { ChordType } = useGuitarNotes();
const { notesToMidi } = useMidiUtils();
const selectedChord = ref(null as any);

function chordClass(chord: any) {
  return { item: true, current: selectedChord.value?.name === chord.name };
}

const tabLength = 24;
const visibleStart = 0;
const visibleEnd = 7;

// Convertir les notes de l'accord sélectionné en MIDI
const selectedChordMidiList = computed(() => {
  if (!selectedChord.value) return [];
  return notesToMidi(selectedChord.value.notes);
});

// Récupérer tous les accords depuis Tonal.js
const allChords = computed(() => {
  // Si un MIDI est sélectionné, utiliser cette note comme base
  const base = store.selectedMidi !== null 
    ? Note.fromMidi(store.selectedMidi) 
    : (props.baseNote || userScale.value);
    
  return ChordType.all().map((chordDesc: any) => {
    const name = chordDesc.name || (chordDesc.aliases ? chordDesc.aliases[0] : 'Unknown');
    chordDesc.name = name;
    chordDesc.notes = chordDesc.intervals.map((interval: any) =>
      Note.transpose(base, interval)
    );
    return chordDesc;
  }).sort((a, b) => a.notes.length - b.notes.length);
});


// Organiser les accords par catégories
const categorizedChords = computed(() => {
  const result: { [category: string]: { description?: string, chords: any[] } } = {};
  
  // Initialiser les catégories avec leurs descriptions
  Object.keys(CHORD_TYPES_BY_CATEGORY).forEach(category => {
    const categoryData = CHORD_TYPES_BY_CATEGORY[category];
    result[category] = {
      description: categoryData.description,
      chords: []
    };
  });
  
  // Une catégorie pour les accords non classés (devrait être beaucoup plus petit maintenant)
  result['Autres'] = {
    description: "Accords spéciaux ou moins courants qui ne rentrent pas dans les catégories standard.",
    chords: []
  };
  
  // Parcourir tous les accords et les classer par catégorie
  allChords.value.forEach(chord => {
    let assigned = false;
    
    // Chercher dans quelle catégorie l'accord s'inscrit
    for (const category in CHORD_TYPES_BY_CATEGORY) {
      const categoryChords = CHORD_TYPES_BY_CATEGORY[category].chords;
      const ind = CHORD_TYPES_BY_CATEGORY[category].indice || [];
      const matchingChordType = categoryChords.find(
        (ct :any) => ct.id === chord.name
          || chord.aliases.includes(ct.id)
          || ct.alt.includes(chord.name)
          || ind.find((i: string) => chord.name.includes(i))
      );
      
      if (matchingChordType) {
        result[category].chords.push(chord);
        assigned = true;
        break;
      }
    }
    
    // Si l'accord n'est classé dans aucune catégorie, le mettre dans "Autres"
    if (!assigned) {
      result['Autres'].chords.push(chord);
    }
  });
  
  // Supprimer les catégories vides
  Object.keys(result).forEach(category => {
    if (result[category].chords.length === 0) {
      delete result[category];
    }
  });
  
  return result;
});

function selectChord(chord: any) {
  selectedChord.value = chord;
}

onMounted(() => {
  // Sélectionner le premier accord disponible
  for (const category in categorizedChords.value) {
    if (categorizedChords.value[category].chords.length > 0) {
      selectedChord.value = categorizedChords.value[category].chords[0];
      break;
    }
  }
});

// Réagir aux changements de note sélectionnée
watch(() => store.selectedMidi, () => {
  // Cela déclenchera la réévaluation de selectedChordMidiList
  // et mettra à jour automatiquement le Tab
});
</script>

<style lang="scss" scoped>
.container {
  display: grid;
  grid-template-areas: 
    "t t t"  
    "l l l"
    "l l l"
    "l l l";
  grid-template-columns: auto auto 420px;
  gap: 10px;
  
  .liste {
    grid-area: l;
    top: 124px;
  }
  
  .title {
    grid-area: t;
  }
}
</style>