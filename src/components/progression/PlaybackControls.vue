<!-- PlaybackControls.vue - Mis à jour pour position fixe et meilleure expérience utilisateur -->
<template>
  <div class="compilation-controls" :class="{ fixed: isFixed }">
    <div class="controls-content">
      <button class="control-btn play-btn" @click="$emit('playProgression')" :disabled="!hasContent || isPlaying">
        <span class="btn-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
        {{ isPlaying ? 'En cours...' : 'Jouer la progression' }}
      </button>

      <div class="playback-controls">
        <label class="control-label">Tempo: {{ tempo }} BPM</label>
        <input type="range" :value="tempo" @input="updateTempo" min="20" max="200" step="4" class="tempo-slider" />
        <div class="tempo-presets">
          <button v-for="presetTempo in tempoPresets" :key="presetTempo" class="tempo-preset-btn"
            :class="{ 'active': tempo === presetTempo }" @click="$emit('tempoChange', presetTempo)">
            {{ presetTempo }}
          </button>
        </div>
      </div>

      <button class="control-btn clear-btn" @click="$emit('clearCompilation')" :disabled="!hasContent">
        <span class="btn-icon">&#10006;</span>
      </button>
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
    hasContent: {
      type: Boolean,
      required: true
    },
    isFixed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['playProgression', 'clearCompilation', 'tempoChange'],
  setup(props, { emit }) {
    // Définir quelques valeurs de tempo prédéfinies
    const tempoPresets = ref([20, 40, 60, 80, 100, 120, 140, 160]);

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
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  margin-top: 15px;
  background-color: #333;
  padding: 15px;
  border-radius: 8px;
  width: 100%;
  z-index: 100;

  &.fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 0;
    border-top: 1px solid #555;
  }

  .controls-content {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    flex-wrap: wrap;
    gap: 15px;
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

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.play-btn {
      background-color: #3a7ca5;
      color: white;
      min-width: 180px;

      &:hover:not(:disabled) {
        background-color: #4a8cb5;
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
    max-width: 500px;

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
    .controls-content {
      flex-direction: column;

      .control-btn {
        width: 100%;
      }
    }
  }
}
</style>