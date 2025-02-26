<template>
  <div class="modes-sidebar">
    <div class="modes-categories">
      <div v-for="(modes, category) in modesByCategory" :key="category" class="category-group">
        <div 
          class="category-header" 
          @click="toggleCategory(category as string)"
        >
          <small class="category-title">
            {{ category }}
            <span class="toggle-icon">
              {{ categoryCollapsed[category] ? '▼' : '▲' }}
            </span>
          </small>
        </div>
        
        <div 
          class="modes-grid" 
          v-if="!categoryCollapsed[category]"
        >
          <div 
            v-for="mode in modes" 
            :key="mode.name"
            class="mode-button"
            :class="{ active: store.selectedMode === mode.name }"
            @click="selectMode(mode)"
          >
            <div class="mode-name">{{ mode.name }}</div>
            <div class="mode-indicator"></div>
            <div class="mode-tooltip">
              <div class="tooltip-title">{{ mode.name }}</div>
              <div class="tooltip-culture" v-if="mode.culture">
                Culture: {{ mode.culture }}
              </div>
              <div class="tooltip-content">{{ mode.description }}</div>
            </div>
          </div>
        </div>
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
    const categoryCollapsed = ref<{[key: string]: boolean}>({});

    const modesByCategory = computed(() => {
      const result: { [category: string]: ModeGuitar[] } = {};
      
      EXTRA_MODES.forEach(mode => {
        const category = mode.category || "Autres traditions";
        
        if (!result[category]) {
          result[category] = [];
          categoryCollapsed.value[category] = true;
        }
        
        result[category].push(mode);
      });
      
      return result;
    });

    function toggleCategory(category: string) {
      categoryCollapsed.value[category] = !categoryCollapsed.value[category];
    }

    function selectMode(mode: ModeGuitar) {
      store.setSelectedMode(mode);
    }

    return {
      store,
      modesByCategory,
      categoryCollapsed,
      toggleCategory,
      selectMode
    };
  }
});
</script>

<style scoped lang="scss">
.modes-sidebar {
  z-index: 99999;
  position: absolute;
  left: 110px;
  top: 0;
  /* overflow-y: auto; */
  /* overflow-x: hidden; */
  bottom: 0;
  width: 120px;
  height: fit-content;
  background-color: #272727;
  padding: 10px;
  border-right: 1px solid #3a3a3a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .modes-categories {
    display: flex;
    flex-direction: column;
    gap: 15px;
    
    .culture-category {
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
      margin-bottom: 5px;
      
      .culture-title {
        font-size: 0.9rem;
        color: #ff9;
        margin: 0 0 10px 0;
        padding: 5px;
        background-color: #333;
        border-radius: 4px;
        text-align: center;
      }
    }
  }
  
  .modes-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    
    .mode-button {
      height: 60px;
      width: 100%;
      background-color: #2d2d2d;
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      transition: all 0.2s ease;
      border: 1px solid #333;
      
      &:hover {
        background-color: #353535;
        transform: translateY(-2px);
        
        .mode-tooltip {
          opacity: 1;
          transform: translateX(15px) scale(1);
          pointer-events: auto;
        }
      }
      
      &.active {
        background-color: #3a4a5a;
        border-color: #5a6a7a;
        
        .mode-indicator {
          background-color: rgb(239, 135, 17);
        }
        
        .mode-name {
          color: white;
        }
      }
      
      .mode-name {
        font-size: 0.85rem;
        text-align: center;
        color: #ddd;
        font-weight: 500;
      }
      
      .mode-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #555;
        margin-top: 8px;
      }
      
      .mode-tooltip {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateX(0) translateY(-50%) scale(0.9);
        background-color: #333;
        border-radius: 6px;
        padding: 12px;
        width: 300px;
        z-index: 100;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        
        .tooltip-title {
          font-weight: bold;
          margin-bottom: 8px;
          color: #fff;
          font-size: 0.9rem;
        }
        
        .tooltip-culture {
          font-size: 0.8rem;
          color: #ff9;
          margin-bottom: 8px;
          font-style: italic;
        }
        
        .tooltip-content {
          color: #ccc;
          font-size: 0.8rem;
          line-height: 1.4;
        }
      }
    }
  }
}

// Styles pour les utilisateurs mobiles ou écrans réduits
@media (max-width: 1200px) {
  .modes-sidebar {
    position: static;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #3a3a3a;
    height: auto;
    padding-bottom: 20px;
    max-height: none;
    
    .modes-categories {
      .culture-category {
        border-bottom: none;
        
        .culture-title {
          margin-top: 10px;
        }
      }
    }
    
    .modes-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
    
    .mode-button {
      .mode-tooltip {
        position: fixed;
        left: 50%;
        top: auto;
        bottom: 10px;
        transform: translateX(-50%) translateY(0) scale(0.9);
        
        &:hover {
          transform: translateX(-50%) translateY(0) scale(1);
        }
      }
    }
  }
}
</style>