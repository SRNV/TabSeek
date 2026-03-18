<template>
  <div class="tablature-page">
    <!-- Barre d'icônes -->
    <div class="icon-bar">
      <button class="icon-btn" :class="{ active: activePanel === 'modes' }"
        @click="togglePanel('modes')" title="Modes">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M4 8h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0-12h10v2H4z"/>
        </svg>
      </button>
      <button class="icon-btn" :class="{ active: activePanel === 'chords' }"
        @click="togglePanel('chords')" title="Accords">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c1.1 0 2-.9 2-2V5h14c0-1.1-.9-2-2-2zm-2 4H7v10h2V9h3v8h2V9h3v8h2V7z"/>
        </svg>
      </button>
    </div>

    <!-- Panneau coulissant -->
    <Transition name="slide">
      <div v-if="activePanel" class="side-panel" @click.self="activePanel = null">
        <div class="panel-content">
          <button class="panel-close" @click="activePanel = null">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <ModesSideBar v-if="activePanel === 'modes'" class="embedded-sidebar" />
          <ChordsDetailsSideBar v-if="activePanel === 'chords'" class="embedded-sidebar" />
        </div>
      </div>
    </Transition>

    <!-- Tablature pleine largeur -->
    <div class="tablature-content">
      <TablatureMain />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TablatureMain from './TablatureMain.vue';
import ModesSideBar from '../sidebars/ModesSideBar.vue';
import ChordsDetailsSideBar from '../sidebars/ChordsDetailsSideBar.vue';

type PanelType = 'modes' | 'chords' | null;
const activePanel = ref<PanelType>(null);

function togglePanel(panel: PanelType) {
  activePanel.value = activePanel.value === panel ? null : panel;
}
</script>

<style scoped lang="scss">
// La NotesSideBar est fixed à gauche, 103px de large, z-index 99999
$notes-sidebar-width: 103px;

.tablature-page {
  width: 100%;
  padding: 10px;
  position: relative;
  display: flex;
  gap: 0;
  overflow: hidden;
}

.icon-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background-color: #1e1e1e;
  border-radius: 8px;
  margin-right: 10px;
  align-self: flex-start;
  position: sticky;
  top: 20px;
  z-index: 100001;

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 6px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: #444;
      color: #ccc;
    }

    &.active {
      background-color: orange;
      color: white;
      border-color: darkorange;
    }
  }
}

.side-panel {
  position: fixed;
  top: 0;
  left: $notes-sidebar-width;
  width: calc(100% - #{$notes-sidebar-width});
  height: 100%;
  z-index: 100000;
  background-color: rgba(0, 0, 0, 0.4);

  .panel-content {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 340px;
    background-color: #1e1e1e;
    border-right: 1px solid #3a3a3a;
    overflow-y: auto;
    padding: 12px;
    padding-top: 40px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #1e1e1e;
    }

    &::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 3px;
    }
  }

  .panel-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 4px;
    color: #999;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 1;

    &:hover {
      background-color: #555;
      color: #fff;
    }
  }
}

.tablature-content {
  flex: 1;
  min-width: 0;
}

// Transition slide
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease;

  .panel-content {
    transition: transform 0.25s ease;
  }
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;

  .panel-content {
    transform: translateX(-100%);
  }
}
</style>
