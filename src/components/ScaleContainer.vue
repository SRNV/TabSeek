<template>
  <div class="scale">
    <ModeDisplay />
    <CurrentModeDisplay />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ModeDisplay from './modes/ModeDisplay.vue';
import CurrentModeDisplay from './modes/CurrentModeDisplay.vue';

export default defineComponent({
  name: 'ScaleContainer',
  components: { ModeDisplay, CurrentModeDisplay },
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
  display: flex;
  width: min-content;
  flex-direction: column;
  justify-content: space-between;
}
</style>