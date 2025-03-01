<!-- ProgressionDropZone.vue - Composant pour la zone de dépôt des progressions -->
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
            @moveUp="$emit('moveItemUp', index)"
            @moveDown="$emit('moveItemDown', index)"
            @remove="$emit('removeItem', index)"
          />
        </div>
      </div>
      
      <PlaybackControls 
        :tempo="tempo"
        :isPlaying="isPlaying"
        :hasContent="compiledProgressions.length > 0"
        @playProgression="$emit('playProgression')"
        @clearCompilation="$emit('clearCompilation')"
        @tempoChange="$emit('tempoChange', $event)"
      />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import type { PropType } from 'vue';
  // @ts-ignore
  import CompiledProgressionItem from './CompiledProgressionItem.vue';
  // @ts-ignore
  import PlaybackControls from './PlaybackControls.vue';
  import type { ChordProgression } from '../../composables/progressions.ts';
  
  export default defineComponent({
    name: 'ProgressionDropZone',
    components: {
      CompiledProgressionItem,
      PlaybackControls
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
      }
    },
    emits: [
      'drop', 
      'moveItemUp', 
      'moveItemDown', 
      'removeItem', 
      'playProgression', 
      'clearCompilation',
      'tempoChange'
    ]
  });
  </script>
  
  <style scoped lang="scss">
  .progression-drop-zone {
    flex: 1.2;
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 15px;
    
    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 1.2rem;
      color: #e0e0e0;
    }
    
    .drop-area {
      min-height: 300px;
      border: 2px dashed #444;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      
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
    }
  }
  </style>