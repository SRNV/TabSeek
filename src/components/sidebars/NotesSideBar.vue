<!-- src/components/NotesSidebar.vue -->
<template>
  <div class="notes-sidebar">
    <div class="notes-grid">
      <GuitarNote v-for="(noteName, idx) in allNotes" :key="noteName" :position="0"
        :mode="`${store.userScale} ${store.selectedMode}`" :displayName="noteName" :background="getColor(noteName)"
        :degreeLabel="getDegreeLabel(noteName)" @click.stop.capture.prevent="onNoteClicked(noteName)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import GuitarNote from '../tab/GuitarNote.vue'
import { useMainStore } from '../../stores'
import { Scale } from 'tonal'
import { getNoteColor, getNoteDegreeLabel } from '../../composables/useNoteHelpers'

const NOTES = [
  'C4',
  'C#4',
  'D4',
  'D#4',
  'E4',
  'F4',
  'F#4',
  'G4',
  'G#4',
  'A4',
  'A#4',
  'B4'
]
export default defineComponent({
  name: 'NotesSidebar',
  components: { GuitarNote },
  setup() {
    const store = useMainStore()

    const allNotes = computed(() => NOTES)

    function getColor(noteName: string): string {
      return getNoteColor(noteName, 0, Scale.get(`${store.userScale} ${store.selectedMode}`).notes)
    }

    function getDegreeLabel(noteName: string): string {
      return getNoteDegreeLabel(noteName, 0, Scale.get(`${store.userScale} ${store.selectedMode}`).notes);
    }

    function onNoteClicked(noteName: string) {
      store.setUserScale(noteName)
    }

    return {
      allNotes,
      getColor,
      getDegreeLabel,
      onNoteClicked,
      store
    }
  }
})
</script>

<style scoped lang="scss">
.notes-sidebar {
  z-index: 99999;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 103px;
  background-color: #272727;
  padding: 10px;
  /* overflow-y: auto; */
  border-right: 1px solid #3a3a3a;
}

.notes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
</style>