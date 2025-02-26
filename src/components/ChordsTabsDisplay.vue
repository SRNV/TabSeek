<!-- ChordsTabDisplay.vue - Composant parent pour sélectionner et afficher un seul accord -->
<template>
    <div class="chords-display-container">
      <div class="chord-display" v-if="selectedChordType">
        <ChordTab 
          :chordType="selectedChordType" 
          :chordData="selectedChordData" 
          :scale="0.6"
        />
      </div>
      <div class="chords-selector">
        <h3 class="title">Accords</h3>
        
        <div class="categories-list">
          <details v-for="category in uniqueCategories" :key="category" class="category-group">
            <summary class="category-title">{{ category }}</summary>
            <div class="chord-buttons">
              <button 
                v-for="(chord, type) in getChordsByCategory(category)" 
                :key="type" 
                @click="selectChord(type, chord)"
                class="chord-button"
                :class="{ active: selectedChordType === type }"
              >
                {{ type }}
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed, watch } from 'vue';
  import { CHORDS } from '../composables/chords';
  import { useMainStore } from '../stores';
  import ChordTab from './ChordTab.vue';
  
  const store = useMainStore();
  const selectedChordType = ref('');
  const selectedChordData = ref(null);
  
  // Récupération des catégories uniques
  const uniqueCategories = computed(() => {
    const categories = Object.values(CHORDS)
      .map(chord => chord.category || 'Autres')
      .filter((value, index, self) => self.indexOf(value) === index);
    return categories.sort();
  });
  
  // Récupérer les accords par catégorie
  function getChordsByCategory(category: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    Object.entries(CHORDS).forEach(([type, chord]) => {
      if (chord.category === category) {
        result[type] = chord;
      }
    });
    
    return result;
  }
  
  // Sélectionner un accord
  function selectChord(type: string, chord: any) {
    selectedChordType.value = type;
    selectedChordData.value = chord;
  }
  
  // Observer les changements de la note fondamentale dans le store
  watch(() => store.chordRootNote, (newRootNote) => {
    // Réactualiser l'accord sélectionné si nécessaire pour mettre à jour les notes
    if (selectedChordType.value && selectedChordData.value) {
      // Force une réactualisation du composant enfant
      const currentType = selectedChordType.value;
      const currentData = selectedChordData.value;
      selectedChordType.value = '';
      selectedChordData.value = null;
      
      setTimeout(() => {
        selectedChordType.value = currentType;
        selectedChordData.value = currentData;
      }, 0);
    }
  });
  </script>
  
  <style scoped lang="scss">
  .chords-display-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    background-color: #222;
    border-left: 1px solid #333;
    
    .chords-selector {
      padding: 12px;
      overflow-y: auto;
      max-height: 50vh;
      
      .title {
        margin: 0 0 12px 0;
        color: #e0e0e0;
        font-size: 1.2rem;
        border-bottom: 1px solid #444;
        padding-bottom: 8px;
      }
      
      .categories-list {
        .category-group {
          margin-bottom: 10px;
          
          .category-title {
            font-size: 0.9rem;
            color: #aaa;
            cursor: pointer;
            padding: 5px;
            background-color: #333;
            border-radius: 4px;
            
            &:hover {
              background-color: #444;
            }
          }
          
          .chord-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 5px;
            margin-top: 8px;
            padding: 5px;
            background-color: #2a2a2a;
            border-radius: 4px;
            
            .chord-button {
              padding: 6px 4px;
              font-size: 0.8rem;
              background-color: #444;
              border: none;
              border-radius: 3px;
              color: #ccc;
              cursor: pointer;
              transition: all 0.2s ease;
              
              &:hover {
                background-color: #555;
              }
              
              &.active {
                background-color: #3a7ca5;
                color: white;
              }
            }
          }
        }
      }
    }
    
    .chord-display {
      padding: 12px;
      overflow-y: auto;
      flex: 1;
      max-height: 50vh;
    }
  }
  </style>