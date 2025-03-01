<template>
  <div class="menu">
    <!-- Chaque catégorie de modes dans un container séparé -->
    <div v-for="(modes, category) in modesByCategory" :key="category" class="chord-category">
      <h2 class="category-title">{{ category }}</h2>
      <p class="category-description" v-if="categoryDescriptions[category]">{{ categoryDescriptions[category] }}</p>
      <div class="chord-buttons">
        <button 
          v-for="mode in modes" 
          :key="mode.name"
          @click.stop="selectMode(mode)"
          :class="{ item: true, current: store.selectedMode === mode.name }">
          {{ mode.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useMainStore } from '../stores';
import { EXTRA_MODES } from '../composables/extraModes';
import type { ModeGuitar } from '../types';

export default defineComponent({
  name: 'ModesSideBar',
  setup() {
    const store = useMainStore();

    // Descriptions pour les catégories
    const categoryDescriptions = {
      "Modes Principaux": "Les sept modes de la gamme majeure, chacun avec sa propre couleur sonore et son caractère expressif.",
      "Modes mineurs mélodiques et harmoniques": "Modes dérivés des gammes mineures mélodiques et harmoniques, offrant des tensions harmoniques riches.",
      "Gammes pentatoniques": "Gammes à cinq notes, simples mais expressives, utilisées dans diverses traditions musicales.",
      "Gammes hexatoniques": "Gammes à six notes créant des couleurs sonores spécifiques et atmosphériques.",
      "Gammes octatoniques et symétriques": "Gammes à structure symétrique offrant des possibilités harmoniques modernes.",
      "Modes japonais": "Gammes traditionnelles japonaises avec leur sonorité distinctive et méditative.",
      "Gammes ethniques et folkloriques": "Gammes issues de diverses traditions musicales du monde entier.",
      "Gammes de jazz et contemporaines": "Gammes utilisées dans le jazz moderne et les musiques contemporaines.",
      "Gammes supplémentaires": "Gammes additionnelles avec des caractéristiques sonores uniques.",
      "Modes additionnels": "Autres modes intéressants qui enrichissent le vocabulaire modal."
    };

    const modesByCategory = computed(() => {
      const result: { [category: string]: ModeGuitar[] } = {};
      
      EXTRA_MODES.forEach(mode => {
        const category = mode.category || "Autres traditions";
        
        if (!result[category]) {
          result[category] = [];
        }
        
        result[category].push(mode);
      });
      
      return result;
    });

    function selectMode(mode: ModeGuitar) {
      store.setSelectedMode(mode);
      store.setModeObject(mode);
    }

    return {
      store,
      modesByCategory,
      categoryDescriptions,
      selectMode
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