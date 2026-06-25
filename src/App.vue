<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TabSVGOverlay from './components/tab/TabSVGOverlay.vue'
import NavSidebar from './components/NavSidebar.vue'
import ConfigSidebar from './components/ConfigSidebar.vue'
import NotesSideBar from './components/sidebars/NotesSideBar.vue'
import ModesSideBar from './components/sidebars/ModesSideBar.vue'
import ChordsDetailsSideBar from './components/sidebars/ChordsDetailsSideBar.vue'
import { useUIState } from './composables/useUIState'

const route = useRoute()
const navExpanded = ref(false)
const { activePanel, closePanelIfUnavailable } = useUIState()

watch(() => route.path, (path) => closePanelIfUnavailable(path))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') activePanel.value = null
}
</script>

<template>
  <TabSVGOverlay />

  <div class="app" @keydown.capture="onKeydown">
    <div class="nav-area">
      <NavSidebar v-model:expanded="navExpanded" />
    </div>
    <div class="config-area">
      <ConfigSidebar />
    </div>
    <div class="main">
      <RouterView />
    </div>
  </div>

  <!-- Backdrop : démarre après les deux sidebars (nav + config) -->
  <div
    v-if="activePanel"
    class="popover-backdrop"
    :style="{ left: navExpanded ? '240px' : '104px' }"
    @click="activePanel = null"
  />

  <!-- Popover fixe : taille selon contenu, slide depuis la gauche -->
  <Transition name="popover">
    <div
      v-if="activePanel"
      class="config-popover"
      :style="{ left: navExpanded ? '240px' : '104px' }"
    >
      <NotesSideBar         v-if="activePanel === 'notes'" />
      <ModesSideBar         v-if="activePanel === 'modes'" />
      <ChordsDetailsSideBar v-if="activePanel === 'chords'" />
    </div>
  </Transition>
</template>

<style scoped lang="scss">
// ── Layout principal ────────────────────────────────────────────────────────
.app {
  display: grid;
  grid-template-areas: "nav config main";
  grid-template-columns: auto auto 1fr;
  grid-template-rows: 100vh;
  height: 100vh;
  overflow: hidden;

  .nav-area    { grid-area: nav; }
  .config-area { grid-area: config; }

  .main {
    grid-area: main;
    overflow-y: auto;
    min-width: 0;
  }
}

// ── Backdrop (ferme le popover au clic extérieur) ───────────────────────────
.popover-backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  /* left est positionné dynamiquement via :style */
  z-index: 499;
}

// ── Popover flottant ────────────────────────────────────────────────────────
.config-popover {
  position: fixed;
  top: 0;
  bottom: 0;
  min-width: 160px;
  max-width: 400px;
  z-index: 500;
  background-color: #1a1a1a;
  border-right: 1px solid #2e2e2e;
  box-shadow: 6px 0 24px rgba(0, 0, 0, 0.55);
  overflow-y: auto;
  transition: left 0.22s ease;
}

// ── Animation slide gauche → droite ────────────────────────────────────────
.popover-enter-active,
.popover-leave-active {
  transition: transform 0.22s ease, opacity 0.18s ease;
}
.popover-enter-from,
.popover-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
