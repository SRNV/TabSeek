<!-- ProgressionDropZone.vue - Mise à jour pour une meilleure UI/UX -->
<template>
    <div 
      class="progression-drop-zone"
      @dragover.prevent
      @drop="$emit('drop', $event)"
    >
      <h3>Progression Compilée ({{ currentKeyDisplay }})</h3>
      <div 
        class="drop-area"
        :class="{ 'empty': compiledProgressions.length === 0 }"
      >
        <div v-if="compiledProgressions.length === 0" class="empty-message">
          Glissez des progressions ici pour les compiler
        </div>
        
        <div v-else class="compiled-items">
          <CompiledProgressionItem 
            v-for="(item, index) in compiledProgressions" 
            :key="index"
            :item="item"
            :index="index"
            :rootNote="userScale"
            :maxIndex="compiledProgressions.length - 1"
            :isPlaying="isPlaying && currentProgressionIndex === index"
            :currentChordIndex="currentProgressionIndex === index ? currentChordIndex : -1"
            @moveUp="$emit('moveItemUp', index)"
            @moveDown="$emit('moveItemDown', index)"
            @remove="$emit('removeItem', index)"
          />
        </div>
      </div>
      
      <!-- Les contrôles ont été déplacés en position fixe dans le composant parent -->
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import CompiledProgressionItem from './CompiledProgressionItem.vue';
  import type { ChordProgression } from '../../composables/progressions.ts';
  
  export default defineComponent({
    name: 'ProgressionDropZone',
    components: {
      CompiledProgressionItem
    },
    props: {
      compiledProgressions: {
        type: Array as PropType<ChordProgression[]>,
        required: true
      },
      currentKeyDisplay: {
        type: String,
        required: true
      },
      userScale: {
        type: String,
        required: true
      },
      tempo: {
        type: Number,
        required: true
      },
      isPlaying: {
        type: Boolean,
        required: true
      },
      currentProgressionIndex: {
        type: Number,
        required: true,
        default: -1
      },
      currentChordIndex: {
        type: Number,
        required: true,
        default: -1
      }
    },
    emits: [
      'drop', 
      'moveItemUp', 
      'moveItemDown', 
      'removeItem'
    ]
  });
  </script>
  
  <style scoped lang="scss">
  .progression-drop-zone {
    flex: 1.2;
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 180px);
    overflow: hidden;
    
    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 1.2rem;
      color: #e0e0e0;
    }
    
    .drop-area {
      flex: 1;
      border: 2px dashed #444;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      overflow-y: auto;
      
      &.empty {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .empty-message {
        color: #888;
        font-style: italic;
        text-align: center;
      }
      
      .compiled-items {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
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