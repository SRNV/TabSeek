<!-- Tab.vue amélioré -->
<template>
    <div class="tab-container">
      <p v-if="withNotes">
        <Notes :notes="item.notes" :collection="item.notes" />
      </p>
      
      <div class="tab-navigation-container">
        <!-- Flèche de gauche -->
        <button 
          class="nav-btn nav-left" 
          @click="moveLeft" 
          :disabled="localVisibleStart === 0"
          :class="{ disabled: localVisibleStart === 0 }"
        >
          <span class="arrow-icon">←</span>
        </button>
        
        <!-- Contenu de la tablature -->
        <div class="tab-content">
          <div v-for="(cord, cIdx) in cords" :key="'cord-' + cIdx" class="fret-row">
            <GuitarNote
              class="open-string"
              :position="0"
              :displayName="getNoteName(cord, 0)"
              :background="getBackground(cord, 0)"
              :degreeLabel="getDegree(cord, 0)"
            />
            <GuitarNote
              v-for="fret in visibleFretRange"
              :key="'fret-' + fret + 1"
              :position="fret + 1"
              :displayName="getNoteName(cord, fret + 1)"
              :background="getBackground(cord, fret + 1)"
              :degreeLabel="getDegree(cord, fret + 1)"
            />
          </div>
        </div>
        
        <!-- Flèche de droite -->
        <button 
          class="nav-btn nav-right" 
          @click="moveRight" 
          :disabled="localVisibleEnd >= tabLength"
          :class="{ disabled: localVisibleEnd >= tabLength }"
        >
          <span class="arrow-icon">→</span>
        </button>
      </div>
      
      <!-- Indicateur de position -->
      <div class="position-indicator">
        Position {{ localVisibleStart + 1 }}-{{ localVisibleEnd + 1 }}
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed, onMounted, defineProps, watch } from 'vue';
  import Notes from './Notes.vue';
  import GuitarNote from './GuitarNote.vue';
  import { getNoteName, getNoteColor, getNoteDegreeLabel, getJoinedDegreeLabel, getJoinedNotesColor } from '../composables/useNoteHelpers';
import { useMainStore } from '../stores';
import { Scale } from 'tonal';
  
  interface TabItem {
    name: string;
    aliases?: string[];
    notes: string[];
  }
  
  const props = defineProps<{
    item: TabItem;
    notes: string[];
    tabLength: number;
    visibleStart: number;
    visibleEnd: number;
    cords?: string[];
    withNotes?: boolean;
    isScale?: boolean;
  }>();
  const store = useMainStore();
  const cords = computed(() => {
    return props.cords ?? "E2 A2 D3 G3 C4 E4".split(" ").reverse();
  });
  
  const withNotes = ref(props.withNotes) ?? false;
  
  const localVisibleStart = ref(props.visibleStart);
  const localVisibleEnd = ref(props.visibleEnd);
  const localScale = computed(() => {
    const result = `${store.userScale} ${store.selectedMode}`;
    return Scale.get(result);
  });

  
  const visibleFretRange = computed(() => {
    const range: number[] = [];
    for (let i = localVisibleStart.value; i <= localVisibleEnd.value; i++) {
      range.push(i);
    }
    return range;
  });
  
  function moveLeft() {
    if (localVisibleStart.value > 0) {
      localVisibleStart.value--;
      localVisibleEnd.value--;
    }
  }
  
  function moveRight() {
    if (localVisibleEnd.value < props.tabLength) {
      localVisibleStart.value++;
      localVisibleEnd.value++;
    }
  }

  function getBackground(cord: string, fret: number) {
    if (props.isScale) return getNoteColor(cord, fret, localScale.value.notes)
    return getJoinedNotesColor(cord, fret, localScale.value.notes, props.item.notes)
  }
  function getDegree(cord: string, fret: number) {
    if (props.isScale) return getNoteDegreeLabel(cord, fret, localScale.value.notes)
    return getJoinedDegreeLabel(cord, fret, localScale.value.notes, props.item.notes)
  }
  
  </script>
  
  <style scoped lang="scss">
  .tab-container {
    width: 100%;
    padding: 1rem;
    position: relative;
    
    h4 {
      margin-bottom: 1rem;
      small {
        color: #777;
        font-weight: normal;
      }
    }
  }
  
  .tab-navigation-container {
    position: relative;
    display: flex;
    align-items: stretch;
    margin: 10px 0;
  }
  
  .tab-content {
    flex: 1;
    margin: 0 10px;
  }
  
  .fret-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    margin-bottom: 10px;
  }
  
  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(50, 50, 50, 0.7);
    border: none;
    width: 40px;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    transition: background-color 0.3s ease, opacity 0.3s ease;
    border-radius: 4px;
    padding: 0;
    
    &:hover:not(.disabled) {
      background-color: rgba(70, 70, 70, 0.9);
    }
    
    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .arrow-icon {
      font-weight: bold;
    }
    
    &.nav-left {
      left: 0;
    }
    
    &.nav-right {
      right: 0;
    }
  }
  
  .position-indicator {
    text-align: center;
    font-size: 0.8rem;
    color: #777;
    margin-top: 10px;
  }
  
  .open-string {
    border-right: 2px solid rgb(114, 114, 114) !important;
    margin-right: 6px;
    filter: brightness(0.5) saturate(1.5);
    transition: 0.5s ease;
  }
  
  // Design responsive
  @media (max-width: 768px) {
    .nav-btn {
      width: 30px;
      font-size: 1.2rem;
    }
  }
  </style>