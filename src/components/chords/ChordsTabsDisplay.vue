<!-- ChordsTabDisplay.vue - Composant parent pour sélectionner et afficher un seul accord -->
<template>
  <div class="chords-display-container">
    <div class="chord-display">
      <ChordTab v-if="store.chordRootObject" :chordData="store.chordRootObject" :chordType="store.chordRootNoteType" />
    </div>
    <div>
      <RouterView name="details1"></RouterView>
      <RouterView name="details2"></RouterView>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { CHORDS } from '../../composables/chords';
import { useMainStore } from '../../stores';
import ChordTab from './ChordTab.vue';
import { useMidiUtils } from '../../composables/useMidiUtils';

const store = useMainStore();
const selectedChordType = computed(() => {
  return store.chordRootNoteType
});
const selectedChordData = ref(null);
const { notesToMidi } = useMidiUtils();

</script>

<style scoped lang="scss">
.chords-display-container {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  background-color: #222;
  border-left: 1px solid #333;

  .chords-selector {
    padding: 12px;
    overflow-y: auto;
    max-height: 50vh;

    .title {
      margin: 0 0 12px 0;
      color: #e0e0e0;
      font-size: 1.2rem;
      border-bottom: 1px solid #444;
      padding-bottom: 8px;
    }

    .categories-list {
      .category-group {
        margin-bottom: 10px;

        .category-title {
          font-size: 0.9rem;
          color: #aaa;
          cursor: pointer;
          padding: 5px;
          background-color: #333;
          border-radius: 4px;

          &:hover {
            background-color: #444;
          }
        }

        .chord-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 5px;
          margin-top: 8px;
          padding: 5px;
          background-color: #2a2a2a;
          border-radius: 4px;

          .chord-button {
            padding: 6px 4px;
            font-size: 0.8rem;
            background-color: #444;
            border: none;
            border-radius: 3px;
            color: #ccc;
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
  }

  .chord-display {
    flex: 1;
  }
}
</style>