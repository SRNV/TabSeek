<!-- ChordPopUp -->
<template>
  <div class="popup">
    <div class="popup-header">
      <h4 class="selected-note">{{ selectedNoteDisplay }}</h4>
    </div>
    <div class="popup-body">
      <ChordDisplay :baseNote="baseNote" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useMainStore } from '../../stores';
import ChordDisplay from './ChordDisplay.vue';
import { Note } from 'tonal';

const store = useMainStore();

const baseNote = computed(() => {
  return store.chordRootNote !== null ? Note.fromMidi(Note.midi(store.chordRootNote)!!) : '';
});

const selectedNoteDisplay = computed(() => {
  if (store.chordRootNote !== null) {
    const noteStr = Note.fromMidi(Note.midi(store.chordRootNote)!!);
    const noteInfo = Note.get(noteStr);
    if (noteInfo.acc && noteInfo.acc.length > 0) {
      return `${noteStr} ${Note.enharmonic(noteStr)}`;
    }
    return noteStr;
  }
  return '';
});

</script>

<style scoped>
.popup {
  height: 100%;
  background-color: #121212;
  color: #636363;
  border-left: 2px solid #333;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.popup-header {
  position: sticky;
  top: 0;
  background-color: #121212;
  color: rgb(9, 216, 227);
  padding: 1rem;
  z-index: 1010;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-note {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.popup-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #fff;
  cursor: pointer;
}
</style>