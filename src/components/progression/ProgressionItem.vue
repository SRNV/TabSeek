<!-- ProgressionItem.vue - Composant pour un élément de progression individuel -->
<template>
    <div 
      class="progression-item"
      draggable="true"
      @dragstart="$emit('dragStart', $event)"
    >
      <div class="progression-header">
        <span class="progression-name">{{ progression.name }}</span>
        <span class="progression-category">{{ progression.numerals }}</span>
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
      }
    },
    emits: ['dragStart'],
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
      }
      
      .progression-category {
        font-size: 0.85rem;
        color: #aaa;
        background-color: #444;
        padding: 2px 6px;
        border-radius: 3px;
      }
    }
    
    .progression-description {
      font-size: 0.85rem;
      color: #bbb;
      line-height: 1.4;
    }
  }
  </style>