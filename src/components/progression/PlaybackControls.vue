<!-- PlaybackControls.vue - Composant pour les contrôles de lecture - version améliorée -->
<template>
  <div class="compilation-controls">
    <div class="playback-main-controls">
      <button class="control-btn play-btn"
        @click="$emit(isPlaying && !isPaused ? 'pauseProgression' : 'playProgression')" :disabled="!hasContent"
        :title="isPlaying && !isPaused ? 'Mettre en pause' : 'Lire la progression'">
        <span class="btn-icon">{{ isPlaying && !isPaused ? '⏸' : '▶' }}</span>
        {{ isPlaying && !isPaused ? 'Pause' : (isPaused ? 'Reprendre' : 'Jouer') }}
      </button>

      <button class="control-btn stop-btn" @click="$emit('stopProgression')" :disabled="!isPlaying && !isPaused"
        title="Arrêter la lecture">
        <span class="btn-icon">⏹</span> Arrêter
      </button>

      <button class="control-btn repeat-btn" @click="$emit('toggleRepeat')" :class="{ 'active': repeat }"
        :disabled="!hasContent" title="Répéter la progression">
        <span class="btn-icon">🔁</span> {{ repeat ? 'Répétition activée' : 'Répéter' }}
      </button>

      <button class="control-btn clear-btn" @click="$emit('clearCompilation')" :disabled="!hasContent"
        title="Effacer toutes les progressions">
        <span class="btn-icon">&#10006;</span> Effacer
      </button>
    </div>

    <div class="playback-controls">
      <label class="control-label">Tempo: {{ tempo }} BPM</label>
      <input type="range" :value="tempo" @input="updateTempo" min="60" max="200" step="4" class="tempo-slider" />
      <div class="tempo-presets">
        <button v-for="presetTempo in tempoPresets" :key="presetTempo" class="tempo-preset-btn"
          :class="{ 'active': tempo === presetTempo }" @click="$emit('tempoChange', presetTempo)">
          {{ presetTempo }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'PlaybackControls',
  props: {
    tempo: {
      type: Number,
      required: true
    },
    isPlaying: {
      type: Boolean,
      required: true
    },
    isPaused: {
      type: Boolean,
      required: true
    },
    repeat: {
      type: Boolean,
      required: true
    },
    hasContent: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    'playProgression',
    'pauseProgression',
    'stopProgression',
    'toggleRepeat',
    'clearCompilation',
    'tempoChange'
  ],
  setup(props, { emit }) {
    // Définir quelques valeurs de tempo prédéfinies
    const tempoPresets = ref([60, 80, 100, 120, 140, 160]);

    function updateTempo(event: Event) {
      const target = event.target as HTMLInputElement;
      emit('tempoChange', parseInt(target.value));
    }

    return {
      updateTempo,
      tempoPresets
    };
  }
});
</script>

<style scoped lang="scss">
.compilation-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
  background-color: #333;
  padding: 15px;
  border-radius: 8px;

  .playback-main-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-between;
  }

  .control-btn {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    min-width: 120px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.play-btn {
      background-color: #3a7ca5;
      color: white;

      &:hover:not(:disabled) {
        background-color: #4a8cb5;
      }
    }

    &.stop-btn {
      background-color: #a53a3a;
      color: white;

      &:hover:not(:disabled) {
        background-color: #b54a4a;
      }
    }

    &.repeat-btn {
      background-color: #555;
      color: #eee;

      &.active {
        background-color: #8c6b3a;
        color: white;
      }

      &:hover:not(:disabled) {
        background-color: #666;

        &.active {
          background-color: #a57c3a;
        }
      }
    }

    &.clear-btn {
      background-color: #555;
      color: #eee;

      &:hover:not(:disabled) {
        background-color: #666;
      }
    }

    .btn-icon {
      font-size: 1.1rem;
    }
  }

  .playback-controls {
    flex: 1;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .control-label {
      font-size: 0.85rem;
      color: #aaa;
    }

    .tempo-slider {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: #444;
      outline: none;
      border-radius: 3px;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3a7ca5;
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3a7ca5;
        cursor: pointer;
        border: none;
      }
    }

    .tempo-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 5px;

      .tempo-preset-btn {
        padding: 4px 8px;
        background-color: #444;
        border: none;
        border-radius: 3px;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #555;
        }

        &.active {
          background-color: #3a7ca5;
          color: white;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .compilation-controls {
    .playback-main-controls {
      flex-direction: column;

      .control-btn {
        width: 100%;
      }
    }
  }
}
</style>