<!-- ChordModeRecommendations.vue -->
<template>
  <div class="chord-modes-container">
    <div v-if="chordModes" class="chord-category">
      <h2 class="category-title">
        Modes recommandés pour {{ formattedChordName }}
      </h2>

      <p class="category-description">
        Ces modes sont particulièrement compatibles avec cet accord. Ils peuvent être utilisés
        pour l'improvisation, la composition ou la création de progressions harmoniques.
      </p>

      <div class="modes-list">
        <div v-for="(mode, index) in chordModes.recommendedModes" :key="mode.id" class="mode-item"
          :class="{ 'high-priority': mode.priority === 1 }">
          <div class="mode-header">
            <h3 class="mode-name">{{ mode.name }}</h3>
            <div class="mode-priority" :title="`Priorité: ${mode.priority}`">
              <span v-for="i in 3" :key="i" class="priority-dot" :class="{ active: i <= mode.priority }"></span>
            </div>
          </div>

          <p class="mode-description">{{ mode.description }}</p>

          <button class="select-mode-btn" @click="selectMode(mode.id)">
            <span class="select-icon">♪</span> Utiliser ce mode
          </button>
        </div>
      </div>

      <div v-if="!chordModes" class="no-modes-message">
        <p>Aucune recommandation de mode trouvée pour cet accord.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { CHORD_MODE_ASSOCIATIONS } from '../../composables/tonalChordsMapping';
import { getReadableChordName } from '../../composables/tonalChordsMapping';
import { useMainStore } from '../../stores';

export default defineComponent({
  name: 'ChordModeRecommendations',
  setup() {
    const store = useMainStore();

    // Récupérer les modes recommandés pour l'accord actuellement sélectionné dans le store
    const chordModes = computed(() => {
      const chordType = store.chordRootNoteType;
      return chordType ? CHORD_MODE_ASSOCIATIONS[chordType] || null : null;
    });

    // Formatter le nom de l'accord pour l'affichage
    const formattedChordName = computed(() => {
      const chordType = store.chordRootNoteType;
      if (!chordType) return "Aucun accord sélectionné";

      const formattedType = getReadableChordName(chordType, 'common');
      const displayName = formattedType || chordType;
      return displayName.charAt(0).toUpperCase() + displayName.slice(1);
    });

    // Fonction pour sélectionner un mode
    function selectMode(modeId: string) {
      store.setSelectedMode(modeId);
    }

    return {
      chordModes,
      formattedChordName,
      selectMode
    };
  }
});
</script>

<style scoped lang="scss">
.chord-modes-container {
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

    .modes-list {
      display: flex;
      flex-direction: column;
      gap: 15px;

      .mode-item {
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

        .mode-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .mode-name {
            margin: 0;
            font-size: 1rem;
            color: #e0e0e0;
          }

          .mode-priority {
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

        .mode-description {
          font-size: 0.85rem;
          color: #aaa;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .select-mode-btn {
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

    .no-modes-message {
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
  .chord-modes-container {
    .chord-category {
      .modes-list {
        .mode-item {
          padding: 10px;

          .mode-header {
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