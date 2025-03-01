<!-- CompiledProgressionItem.vue - Composant pour un élément de progression compilé -->
<template>
    <div class="compiled-item">
      <div class="item-content">
        <div class="item-header">
          <span class="item-name">{{ item.name }}</span>
          <div class="item-actions">
            <button 
              class="action-btn move-up" 
              @click="$emit('moveUp')" 
              :disabled="index === 0"
              title="Déplacer vers le haut"
            >
              &#8593;
            </button>
            <button 
              class="action-btn move-down" 
              @click="$emit('moveDown')" 
              :disabled="index === maxIndex"
              title="Déplacer vers le bas"
            >
              &#8595;
            </button>
            <button 
              class="action-btn remove" 
              @click="$emit('remove')"
              title="Supprimer"
            >
              &#10005;
            </button>
          </div>
        </div>
        <div class="item-numerals">{{ item.numerals }}</div>
        <ProgressionDisplay 
          :progression="item" 
          :rootNote="rootNote" 
          :displayChords="true"
        />
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import type { PropType } from 'vue';
  // @ts-ignore
  import ProgressionDisplay from './ProgressionDisplay.vue';
  import type { ChordProgression } from '../../composables/progressions.ts';
  
  export default defineComponent({
    name: 'CompiledProgressionItem',
    components: {
      ProgressionDisplay
    },
    props: {
      item: {
        type: Object as PropType<ChordProgression>,
        required: true
      },
      index: {
        type: Number,
        required: true
      },
      rootNote: {
        type: String,
        required: true
      },
      maxIndex: {
        type: Number,
        default: 100 // Valeur élevée par défaut
      }
    },
    emits: ['moveUp', 'moveDown', 'remove']
  });
  </script>
  
  <style scoped lang="scss">
  .compiled-item {
    background-color: #333;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
    
    .item-content {
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        
        .item-name {
          font-weight: bold;
          color: #e0e0e0;
        }
        
        .item-actions {
          display: flex;
          gap: 5px;
          
          .action-btn {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #444;
            border: none;
            border-radius: 3px;
            color: #ccc;
            cursor: pointer;
            
            &:hover:not(:disabled) {
              background-color: #555;
            }
            
            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            
            &.remove {
              color: #ff9999;
              
              &:hover {
                background-color: #553333;
              }
            }
          }
        }
      }
      
      .item-numerals {
        font-size: 0.85rem;
        color: #aaa;
        margin-bottom: 8px;
      }
    }
  }
  </style>