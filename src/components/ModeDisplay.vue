<!-- ModeDisplay.vue avec la sélection de mode -->
<template>
    <div>
      <div>
        <Tab
          v-if="currentMode"
          isScale
          :key="currentMode.name"
          :midiList="modeMidiNotes"
          matchType="multiple"
          :tabLength="tabLength"
          :visibleStart="visibleStart"
          :visibleEnd="visibleEnd"
          @click="selectMode(currentMode)"
        />
      </div>
    </div>
  </template>
    
  <script lang="ts" setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { useMainStore } from '../stores';
  import { Note } from 'tonal';
  import Tab from './Tab.vue';
  import { EXTRA_MODES } from '../composables/extraModes';
  import type { ModeGuitar } from '../types';
  import { useMidiUtils } from '../composables/useMidiUtils';
    
  const store = useMainStore();
  const { notesToMidi } = useMidiUtils();
    
  const tabLength = 24;
  const visibleStart = 0;
  const visibleEnd = 10;
    
  const modes = ref<ModeGuitar[]>([]);
  const currentMode = ref<ModeGuitar | null>(null);
  
  // Liste des modes principaux avec l'interface ModeGuitar
  const MAIN_MODES: ModeGuitar[] = [
    {
      name: "ionian",
      aliases: ["major", "M"],
      modeNum: 0,
      mode: 0,
      intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
      alt: [],
      triad: "major",
      seventh: "maj7",
      description: "Le mode ionien est la gamme majeure traditionnelle, caractérisé par sa sonorité lumineuse et équilibrée. Il exprime la joie, la stabilité et l'affirmation, formant la base de la musique occidentale classique et populaire. Sa structure d'intervalles crée une résolution harmonique naturelle qui procure un sentiment de complétude. Omniprésent dans les hymnes, chansons enfantines et compositions classiques, il est idéal pour transmettre des émotions positives et claires. Cette tonalité majeure constitue le point de référence pour tous les autres modes diatoniques.",
      culture: "Occidentale classique",
      category: "Modes Principaux"
    },
    // ... autres modes déclarés dans votre code original
  ];
  
  // Calculer les notes MIDI du mode actuel
  const modeMidiNotes = computed(() => {
    if (!currentMode.value) return [];
    const modeNotes = getModeNotes(currentMode.value);
    return notesToMidi(modeNotes);
  });
  
  function getModeNotes(mode: ModeGuitar): string[] {
    return mode.intervals.map(interval => 
      Note.transpose(store.userScale, interval)
    );
  }
  
  function selectMode(mode: ModeGuitar) {
    // Mettre à jour le mode dans le store avec l'objet complet
    store.setModeObject(mode);
    currentMode.value = mode;
  }
    
  function refresh() {
    // Combiner les modes principaux avec les modes additionnels
    const allModes = [...MAIN_MODES, ...EXTRA_MODES];
    modes.value = allModes;
    
    // Trouver le mode correspondant au mode sélectionné dans le store
    const selected = allModes.find((mode) => mode.name === store.selectedMode);
    
    if (selected) {
      currentMode.value = selected;
      // Mise à jour de l'objet mode dans le store si nécessaire
      store.setModeObject(selected);
    } else if (allModes.length > 0) {
      // Si le mode sélectionné n'est pas disponible, choisir le premier mode
      selectMode(allModes[0]);
    }
  }
    
  onMounted(() => {
    refresh();
  });
    
  watch(() => store.userScale, () => {
    refresh();
  });
  watch(() => store.selectedMode, () => {
    refresh();
  });
  </script>
    
  <style scoped lang="scss">
  .mode-selection {
    margin-bottom: 15px;
    
    .mode-selector {
      padding: 8px 12px;
      background-color: #333;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 0.9rem;
      width: 100%;
      max-width: 300px;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: #3a7ca5;
      }
      
      option {
        background-color: #222;
        color: #ddd;
      }
    }
  }
  
  .selected-mode {
    border-left: 4px solid #3a7ca5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  </style>