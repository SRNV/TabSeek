<!-- ModeChordRecommendations.vue -->
<template>
  <div class="mode-chords-container">
    <div v-if="modeChords" class="chord-category">
      <h2 class="category-title">
        Accords recommandés pour {{ formattedModeName }}
      </h2>

      <p class="category-description">
        Ces accords sont particulièrement compatibles avec ce mode. Ils peuvent être utilisés
        pour créer des progressions harmoniques, improviser ou composer dans ce mode.
      </p>

      <div class="chords-list">
        <div v-for="(chord, index) in modeChords.recommendedChords" :key="chord.id" class="chord-item"
          :class="{ 'high-priority': chord.priority === 1 }">
          <div class="chord-header">
            <h3 class="chord-name">{{ chord.name }}</h3>
            <div class="chord-priority" :title="`Priorité: ${chord.priority}`">
              <span v-for="i in 5" :key="i" class="priority-dot" :class="{ active: i <= chord.priority }"></span>
            </div>
          </div>

          <p class="chord-description">{{ chord.description }}</p>

          <button class="select-chord-btn" @click="selectChord(chord.id)">
            <span class="select-icon">♪</span> Utiliser cet accord
          </button>
        </div>
      </div>

      <div v-if="!modeChords" class="no-chords-message">
        <p>Aucune recommandation d'accord trouvée pour ce mode.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { MODE_CHORD_ASSOCIATIONS } from '../../composables/tonalChordsMapping';
import { useMainStore } from '../../stores';

export default defineComponent({
  name: 'ModeChordRecommendations',
  setup() {
    const store = useMainStore();

    // Récupérer les accords recommandés pour le mode actuellement sélectionné dans le store
    const modeChords = computed(() => {
      const selectedMode = store.selectedMode;
      return selectedMode ? MODE_CHORD_ASSOCIATIONS[selectedMode] || null : null;
    });

    // Formatter le nom du mode pour l'affichage
    const formattedModeName = computed(() => {
      const selectedMode = store.selectedMode;
      if (!selectedMode) return "Aucun mode sélectionné";

      // Capitaliser le nom du mode
      return selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1);
    });

    // Fonction pour sélectionner un accord
    function selectChord(chordId: string) {
      store.setChordRootNote(store.userScale, chordId);
    }

    return {
      modeChords,
      formattedModeName,
      selectChord
    };
  }
});
</script>

<style scoped lang="scss">
.mode-chords-container {
  width: 100%;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding-right: 10px;

  .chord-category {
    margin-bottom: 15px;
    background-color: rgba(30, 30, 30, 0.7);
    border-radius: 8px;
    padding: 15px;

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
      margin: 0 0 15px 0;
      font-style: italic;
      line-height: 1.3;
    }

    .chords-list {
      display: flex;
      flex-direction: column;
      gap: 15px;

      .chord-item {
        background-color: #282828;
        border-radius: 6px;
        padding: 12px;
        border: 1px solid #444;
        transition: border-color 0.2s, transform 0.1s;

        &:hover {
          border-color: #666;
          transform: translateY(-2px);
        }

        &.high-priority {
          border-left: 3px solid orange;
        }

        .chord-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .chord-name {
            margin: 0;
            font-size: 1rem;
            color: #e0e0e0;
          }

          .chord-priority {
            display: flex;
            gap: 3px;

            .priority-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #444;

              &.active {
                background-color: orange;
              }
            }
          }
        }

        .chord-description {
          font-size: 0.85rem;
          color: #aaa;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .select-chord-btn {
          width: 100%;
          padding: 8px 12px;
          background-color: #3a4a5a;
          border: none;
          border-radius: 4px;
          color: #ddd;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          &:hover {
            background-color: #3a7ca5;
          }

          .select-icon {
            font-size: 1.1rem;
          }
        }
      }
    }

    .no-chords-message {
      background-color: #282828;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
      color: #aaa;
      font-style: italic;
    }
  }
}

@media (max-width: 768px) {
  .mode-chords-container {
    .chord-category {
      .chords-list {
        .chord-item {
          padding: 10px;

          .chord-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }
      }
    }
  }
}
</style>