<!-- ScaleContainer.vue avec affichage du mode actuel -->
<template>
  <div class="scale">
    
    <div class="left">
      <ModeDisplay />
      
      <!-- Affichage du mode sélectionné -->
      <CurrentModeDisplay />  
    </div>
    <div class="right">
      <ChordsTabsDisplay />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue';
import { useMainStore } from '../stores';
import ModeDisplay from './ModeDisplay.vue';
import CurrentModeDisplay from './CurrentModeDisplay.vue';
import ChordsTabsDisplay from './ChordsTabsDisplay.vue';
import { Note } from 'tonal';

export default defineComponent({
  name: 'ScaleContainer',
  components: { ChordsTabsDisplay, ModeDisplay, CurrentModeDisplay },
  setup() {
    const store = useMainStore();
    const availableScales = ref<string[]>([]);

    // Générer toutes les notes disponibles comme gammes de base
    onMounted(() => {
      const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      // Ajouter aussi les notes avec bémols
      const notesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
      
      // Combiner et dédupliquer
      availableScales.value = [...new Set([...notes, ...notesFlat])].sort();
    });

    const userScale = computed<string>({
      get: () => store.userScale,
      set: (val: string) => {
        store.setUserScale(val);
      }
    });

    function refresh() {
      store.setUserScale(userScale.value);
    }

    return {
      userScale,
      refresh,
      availableScales
    };
  }
});
</script>

<style scoped>
.scale-selector {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.scale-input {
  padding: 8px 12px;
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.scale-input:focus {
  outline: none;
  border-color: #3a7ca5;
}
.scale {
  position: fixed;
  top: 0px;
  left: 14vw;
  display: grid;
  grid-template-areas:
  "l l l l"
  "r r r r";

  .right {
    grid-area: r;
  }
  .left {
    grid-area: l;
    display: flex;
  }
}
</style>