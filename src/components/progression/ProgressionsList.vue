<!-- ProgressionsList.vue - Mis à jour pour gérer la lecture des progressions -->
<template>
    <div class="progressions-list">
      <h3>Progressions Disponibles</h3>
      <div class="search-bar">
        <input 
          type="text" 
          :value="searchQuery" 
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          placeholder="Rechercher une progression..." 
          class="search-input"
        />
        <div class="filter-options">
          <select 
            :value="categoryFilter" 
            @change="$emit('update:categoryFilter', ($event.target as HTMLSelectElement).value)"
            class="filter-select"
          >
            <option value="">Toutes catégories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="progressions-container">
        <ProgressionItem 
          v-for="progression in progressions" 
          :key="progression.name"
          :progression="progression"
          :isPlaying="currentPlayingItem === progression.name"
          @dragStart="(event: Event) => $emit('dragStart', event, progression)"
          @playProgression="playProgression"
        />
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import type { PropType } from 'vue';
  import ProgressionItem from './ProgressionItem.vue';
  import type { ChordProgression } from '../../composables/progressions.ts';
  
  export default defineComponent({
    name: 'ProgressionsList',
    components: {
      ProgressionItem
    },
    props: {
      progressions: {
        type: Array as PropType<ChordProgression[]>,
        required: true
      },
      categories: {
        type: Array as PropType<string[]>,
        required: true
      },
      searchQuery: {
        type: String,
        required: true
      },
      categoryFilter: {
        type: String,
        required: true
      }
    },
    emits: [
      'update:searchQuery',
      'update:categoryFilter',
      'dragStart',
      'playProgression'
    ],
    setup(props, { emit }) {
      const currentPlayingItem = ref('');
      
      function playProgression(progression: ChordProgression) {
        currentPlayingItem.value = progression.name;
        emit('playProgression', progression);
        
        // Réinitialiser après la fin présumée de la lecture
        setTimeout(() => {
          currentPlayingItem.value = '';
        }, 5000); // Ajuster selon le tempo moyen
      }
      
      return {
        currentPlayingItem,
        playProgression
      };
    }
  });
  </script>
  
  <style scoped lang="scss">
  .progressions-list {
    flex: 1;
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 180px);
    
    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 1.2rem;
      color: #e0e0e0;
    }
    
    .search-bar {
      margin-bottom: 15px;
      
      .search-input {
        width: 100%;
        padding: 8px 12px;
        background-color: #333;
        border: 1px solid #444;
        border-radius: 4px;
        color: #e0e0e0;
        margin-bottom: 10px;
        
        &:focus {
          outline: none;
          border-color: #3a7ca5;
        }
      }
      
      .filter-options {
        display: flex;
        gap: 10px;
        
        .filter-select {
          flex: 1;
          padding: 6px 10px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 4px;
          color: #e0e0e0;
          
          &:focus {
            outline: none;
            border-color: #3a7ca5;
          }
        }
      }
    }
    
    .progressions-container {
      flex: 1;
      overflow-y: auto;
      padding-right: 5px;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: #333;
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 3px;
      }
    }
  }
  </style>