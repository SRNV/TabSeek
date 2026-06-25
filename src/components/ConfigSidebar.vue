<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUIState, routePanels, type PanelId } from '../composables/useUIState'

const route = useRoute()
const { activePanel, togglePanel } = useUIState()

function availablePanels(): PanelId[] {
  return routePanels[route.path] ?? []
}
</script>

<template>
  <aside class="config-sidebar">

    <button
      v-if="availablePanels().includes('notes')"
      class="config-btn"
      :class="{ active: activePanel === 'notes' }"
      @click="togglePanel('notes')"
      title="Notes / Fondamentale"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16-8v6.18C18.69 15.07 18.36 15 18 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V7h3V5h-4z"/>
      </svg>
    </button>

    <button
      v-if="availablePanels().includes('modes')"
      class="config-btn"
      :class="{ active: activePanel === 'modes' }"
      @click="togglePanel('modes')"
      title="Modes"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M4 8h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0-12h10v2H4z"/>
      </svg>
    </button>

    <button
      v-if="availablePanels().includes('chords')"
      class="config-btn"
      :class="{ active: activePanel === 'chords' }"
      @click="togglePanel('chords')"
      title="Accords"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c1.1 0 2-.9 2-2V5h14c0-1.1-.9-2-2-2zm-2 4H7v10h2V9h3v8h2V9h3v8h2V7z"/>
      </svg>
    </button>

  </aside>
</template>

<style scoped lang="scss">
$w: 52px;
$mx: 6px;
$px: 9px;
$h: 38px;

.config-sidebar {
  position: relative;
  z-index: 1000;
  width: $w;
  min-width: $w;
  height: 100%;
  background-color: #141414;
  border-right: 1px solid #252525;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 12px;
  gap: 2px;
  flex-shrink: 0;
}

.config-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc($w - $mx * 2);
  height: $h;
  border-radius: 6px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s, color 0.15s;

  svg { flex-shrink: 0; }

  &:hover {
    background-color: #252525;
    color: #bbb;
  }

  &.active {
    background-color: rgba(56, 178, 172, 0.15);
    color: #38b2ac;
    box-shadow: inset 2px 0 0 #38b2ac;
  }
}
</style>
