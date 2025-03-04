<!-- ProgressionsList.vue - Composant agnostique sans props -->
<template>
  <div class="progressions-list">
    <h3>Progressions Disponibles</h3>
    <div class="search-bar">
      <input type="text" v-model="searchQuery" placeholder="Rechercher une progression..." class="search-input" />
      <div class="filter-options">
        <select v-model="categoryFilter" class="filter-select">
          <option value="">Toutes catégories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <div class="progressions-container">
      <ProgressionItem v-for="progression in filteredProgressions" :key="progression.name" :progression="progression"
        @dragStart="dragStart($event, progression)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { chordProgressions } from '../../composables/progressions.ts';
import ProgressionItem from '../progression/ProgressionItem.vue';
import eventBus from '../../eventBus';
import { useMainStore } from '../../stores';

export default defineComponent({
  name: 'ProgressionsList',
  components: {
    ProgressionItem
  },
  setup() {
    const store = useMainStore();
    const searchQuery = ref('');
    const categoryFilter = ref('');

    // Extraire toutes les catégories uniques des progressions
    const categories = computed(() => {
      const categoriesSet = new Set(chordProgressions.map(prog => prog.compatibleModes[0]));
      return Array.from(categoriesSet).sort();
    });

    // Filtrer les progressions en fonction de la recherche et de la catégorie
    const filteredProgressions = computed(() => {
      return chordProgressions.filter(progression => {
        const matchesSearch =
          progression.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          progression.description.toLowerCase().includes(searchQuery.value.toLowerCase());

        const matchesCategory =
          categoryFilter.value === '' ||
          progression.compatibleModes.includes(categoryFilter.value);

        return matchesSearch && matchesCategory;
      });
    });

    // Gestion du drag and drop
    function dragStart(event: DragEvent, progression: any) {
      if (event.dataTransfer) {
        event.dataTransfer.setData('application/json', JSON.stringify(progression));
        event.dataTransfer.effectAllowed = 'copy';

        // Émission d'événement via l'eventBus pour informer les autres composants
        eventBus.emit('progressionDragStart', progression);
      }
    }

    return {
      searchQuery,
      categoryFilter,
      categories,
      filteredProgressions,
      dragStart
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
    max-height: 550px;
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