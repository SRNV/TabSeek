<!-- ProgressionItem.vue - Mis à jour avec bouton de lecture -->
<template>
    <div 
      class="progression-item"
      draggable="true"
      @dragstart="$emit('dragStart', $event)"
    >
      <div class="progression-header">
        <span class="progression-name">{{ progression.name }}</span>
        <div class="progression-actions">
          <button class="play-btn" @click.stop="$emit('playProgression', progression)" :disabled="isPlaying">
            <span class="play-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
          </button>
          <span class="progression-category">{{ progression.numerals }}</span>
        </div>
      </div>
      <div class="progression-description">{{ truncatedDescription }}</div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed } from 'vue';
  import type { PropType } from 'vue';
  import type { ChordProgression } from '../../composables/progressions.ts';
  
  export default defineComponent({
    name: 'ProgressionItem',
    props: {
      progression: {
        type: Object as PropType<ChordProgression>,
        required: true
      },
      isPlaying: {
        type: Boolean,
        default: false
      }
    },
    emits: ['dragStart', 'playProgression'],
    setup(props) {
      // Tronquer la description pour l'affichage
      const truncatedDescription = computed(() => {
        const maxLength = 80;
        const description = props.progression.description;
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength) + '...';
      });
  
      return {
        truncatedDescription
      };
    }
  });
  </script>
  
  <style scoped lang="scss">
  .progression-item {
    background-color: #333;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
    cursor: move;
    transition: background-color 0.2s, transform 0.1s;
    
    &:hover {
      background-color: #3a3a3a;
      transform: translateY(-2px);
    }
    
    &:active {
      transform: scale(0.98);
    }
    
    .progression-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .progression-name {
        font-weight: bold;
        color: #e0e0e0;
        flex: 1;
      }
      
      .progression-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .play-btn {
          background-color: #3a7ca5;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          
          &:hover:not(:disabled) {
            background-color: #4a8cb5;
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .play-icon {
            font-size: 0.8rem;
            line-height: 1;
          }
        }
        
        .progression-category {
          font-size: 0.85rem;
          color: #aaa;
          background-color: #444;
          padding: 2px 6px;
          border-radius: 3px;
        }
      }
    }
    
    .progression-description {
      font-size: 0.85rem;
      color: #bbb;
      line-height: 1.4;
    }
  }
  </style>