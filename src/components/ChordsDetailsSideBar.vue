<!-- src/components/ChordsDetailsSideBar.vue -->
<template>
  <div class="menu">
    <!-- Chaque catégorie d'accords dans un container séparé -->
    <div v-for="(categoryData, category) in categorizedChords" :key="category" class="chord-category">
      <h2 class="category-title">{{ category }}</h2>
      <p class="category-description" v-if="categoryData.description">{{ categoryData.description }}</p>
      <div class="chord-buttons">
        <button 
          v-for="chord in categoryData.chords" 
          :key="chord.name"
          @click.stop="selectChord(chord)"
          :class="chordClass(chord)">
          {{ chord.id }} ({{ chord.intervals.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from 'vue';
import type { PropType } from 'vue';
import { useMainStore } from '../stores';
import { useGuitarNotes } from '../composables/useGuitarNotes';
import { CHORD_TYPES_BY_CATEGORY } from '../composables/tonalChordsMapping';
import { Note } from 'tonal';
import { useMidiUtils } from '../composables/useMidiUtils';

export default defineComponent({
name: 'ChordsDetailsSideBar',
props: {
  baseNote: {
    type: String as PropType<string>,
    default: undefined
  }
},
setup(props) {
  const store = useMainStore();
  const userScale = computed(() => store.userScale);
  const { ChordType } = useGuitarNotes();
  const { notesToMidi } = useMidiUtils();

  console.log(store);
  function chordClass(chord: any) {
    return { item: true, current: store.chordRootNoteType === chord.id };
  }


  // Organiser les accords par catégories
  const categorizedChords = computed(() => {
    const result: { [category: string]: { description?: string, chords: any[] } } = {};
    
    // Initialiser les catégories avec leurs descriptions
    Object.keys(CHORD_TYPES_BY_CATEGORY).forEach(category => {
      const categoryData = CHORD_TYPES_BY_CATEGORY[category];
      result[category] = {
        description: categoryData.description,
        chords: categoryData.chords
      };
    });
    
    // Une catégorie pour les accords non classés (devrait être beaucoup plus petit maintenant)
    result['Autres'] = {
      description: "Accords spéciaux ou moins courants qui ne rentrent pas dans les catégories standard.",
      chords: []
    };
    /*
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
    */
    
    // Supprimer les catégories vides
    Object.keys(result).forEach(category => {
      if (result[category].chords.length === 0) {
        delete result[category];
      }
    });
    
    return result;
  });

  function selectChord(chord: any) {
    store.setChordObject(chord)
    store.setChordRootNoteType(chord.id)
  }

  // Réagir aux changements de note sélectionnée
  watch(() => store.selectedMidi, () => {
    // Cela déclenchera la réévaluation de selectedChordTypeMidiList
    // et mettra à jour automatiquement le Tab
  });

  return {
    categorizedChords,
    chordClass,
    selectChord
  };
}
});
</script>

<style scoped lang="scss">
.menu {
grid-area: m;
gap: 10px;
max-height: 90vh;
padding-right: 10px;

.chord-category {
  margin-bottom: 15px;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  padding: 10px;
  
  .category-title {
    font-size: 1.2rem;
    margin: 0 0 5px 0;
    color: #f0f0f0;
    padding-bottom: 5px;
    border-bottom: 1px solid #555;
  }
  
  .category-description {
    font-size: 0.8rem;
    color: #bbb;
    margin: 0 0 10px 0;
    font-style: italic;
    line-height: 1.3;
  }
  
  .chord-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 5px;
    
    button.item {
      height: 47px;
      width: 100%;
      font-size: x-small;
      background-color: #444;
      color: #999;
      cursor: pointer;
      border: 1px solid #555;
      border-radius: 4px;
      transition: background-color 0.2s, transform 0.1s;
      
      &:hover {
        background-color: #555;
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &.current {
        background-color: orange;
        color: white;
        border-color: darkorange;
      }
    }
  }
}
}
</style>