<!-- ChordTab.vue - Composant pour afficher un accord individuel -->
<template>
    <div class="chord-tab-container">
      <div class="chord-header">
        <h3 class="chord-title">
          {{ formattedChordName }}
          <small v-if="aliases && aliases.length > 0" class="chord-aliases">
            ({{ aliases.join(', ') }})
          </small>
        </h3>
      </div>
      
      <div class="chord-description" v-if="chordData.description">
        {{ truncatedDescription }}
        <button v-if="isDescriptionTruncated" @click="showFullDescription = !showFullDescription" class="show-more-btn">
          {{ showFullDescription ? 'Voir moins' : 'Voir plus' }}
        </button>
        <div v-if="showFullDescription" class="full-description">
          {{ chordData.description }}
        </div>
      </div>
      
      <div class="chord-content">
        <!-- Utilisation de Notes.vue pour afficher et jouer les notes -->
        <Notes 
          :notes="chordNotes" 
          :collection="modeNotes" 
          :chordType="chordType" 
        />
        
        <!-- Utilisation de Tab.vue pour afficher l'accord sur le manche -->
        <div class="tab-wrapper">
          <Tab 
            :midiList="chordMidiList"
            matchType="one"
            :tabLength="tabLength" 
            :visibleStart="visibleStart" 
            :visibleEnd="visibleEnd"
          />
        </div>
        
        <!-- Affichage des intervalles de l'accord -->
        <div class="chord-intervals" v-if="chordData.intervals && chordData.intervals.length > 0">
          <h4>Intervalles:</h4>
          <div class="intervals-list">
            <span 
              v-for="(interval, index) in chordData.intervals" 
              :key="interval" 
              class="interval-chip"
              :class="{ 'outside-mode': !isIntervalInMode(interval) }"
            >
              {{ interval }}
              <span class="interval-note">{{ getIntervalNote(rootNote, interval) }}</span>
            </span>
          </div>
        </div>
        
        <!-- Affichage des doigts -->
        <div class="chord-fingering" v-if="chordData.positions && chordData.positions.length > 0">
          <h4>Positions des doigts:</h4>
          <div class="fingering-list">
            <div 
              v-for="(position, posIndex) in chordData.positions.slice(0, 1)" 
              :key="posIndex" 
              class="position-card"
            >
              <div class="position-number">Position {{ position.position || posIndex + 1 }}</div>
              <div class="position-frets">
                <span 
                  v-for="(fret, fretIndex) in position.frets" 
                  :key="fretIndex" 
                  class="fret-value"
                  :class="{ 'muted': fret === null }"
                >
                  {{ fret === null ? 'x' : fret }}
                  <small v-if="position.fingers && position.fingers[fretIndex] !== null" class="finger-indicator">
                    {{ position.fingers[fretIndex] }}
                  </small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed, watch } from 'vue';
  import { Note } from 'tonal';
  import { useMainStore } from '../stores';
  import { getReadableChordName } from '../composables/tonalChordsMapping';
  import Tab from './Tab.vue';
  import Notes from './Notes.vue';
  import { useMidiUtils } from '../composables/useMidiUtils';
  
  interface ChordTabProps {
    chordType: string;
    chordData: any;
    rootNote?: string;
    scale?: number;
  }
  
  const props = withDefaults(defineProps<ChordTabProps>(), {
    rootNote: undefined,
    scale: 1
  });
  
  const store = useMainStore();
  const showFullDescription = ref(false);
  const { notesToMidi } = useMidiUtils();
  
  // Paramètres pour Tab.vue
  const tabLength = 24;
  const visibleStart = 0;
  const visibleEnd = 10;
  
  // Récupérer la note fondamentale (soit celle fournie, soit celle du store)
  const rootNote = computed(() => {
    // Si un MIDI est sélectionné, l'utiliser comme note fondamentale
    if (store.selectedMidi !== null) {
      return Note.fromMidi(store.selectedMidi);
    }
    
    // Sinon, utiliser la note fournie en prop ou celle du store
    return props.rootNote || store.chordRootNote || store.userScale;
  });
  
  // Notes du mode actuel pour la comparaison
  const modeNotes = computed(() => store.modeNotes);
  
  // Notes de l'accord
  const chordNotes = computed(() => {
    if (!props.chordData.intervals) return [];
    return props.chordData.intervals.map((interval: string) => 
      Note.transpose(rootNote.value, interval)
    );
  });
  
  // Convertir les notes de l'accord en MIDI pour Tab.vue
  const chordMidiList = computed(() => {
    return notesToMidi(chordNotes.value);
  });
  
  // Nom formaté de l'accord
  const formattedChordName = computed(() => {
    const type = getReadableChordName(props.chordType, 'symbol');
    return `${rootNote.value}${type}`;
  });
  
  // Alias de l'accord
  const aliases = computed(() => props.chordData.aliases || []);
  
  // Gestion de la description (tronquée ou complète)
  const MAX_DESCRIPTION_LENGTH = 100;
  const truncatedDescription = computed(() => {
    if (!props.chordData.description) return '';
    if (props.chordData.description.length <= MAX_DESCRIPTION_LENGTH) return props.chordData.description;
    return props.chordData.description.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
  });
  
  const isDescriptionTruncated = computed(() => {
    return props.chordData.description && props.chordData.description.length > MAX_DESCRIPTION_LENGTH;
  });
  
  // Fonction pour vérifier si un intervalle est dans le mode actuel
  function isIntervalInMode(interval: string): boolean {
    const modeIntervals = store.modeObject.intervals;
    return modeIntervals.includes(interval);
  }
  
  // Fonction pour obtenir la note correspondant à un intervalle
  function getIntervalNote(root: string, interval: string): string {
    try {
      const note = Note.transpose(root, interval);
      return note;
    } catch (error) {
      console.error(`Erreur lors du calcul de la note pour l'intervalle ${interval}:`, error);
      return '?';
    }
  }
  
  // Réagir aux changements de note sélectionnée
  watch(() => store.selectedMidi, () => {
    // Cela déclenchera la réévaluation de chordMidiList
    // et mettra à jour automatiquement le Tab
  });
  </script>
  
  <style scoped lang="scss">
  .chord-tab-container {
    border: 1px solid #333;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 16px;
    background-color: #282828;
    
    .chord-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #444;
      padding-bottom: 6px;
      
      .chord-title {
        margin: 0;
        font-size: 1.1rem;
        color: #e0e0e0;
        
        .chord-aliases {
          color: #999;
          font-size: 0.8rem;
          font-weight: normal;
        }
      }
    }
    
    .chord-description {
      margin-bottom: 10px;
      color: #aaa;
      font-size: 0.85rem;
      line-height: 1.3;
      position: relative;
      
      .show-more-btn {
        background: none;
        border: none;
        color: #3a7ca5;
        cursor: pointer;
        font-size: 0.75rem;
        padding: 2px;
        margin-left: 4px;
      }
      
      .full-description {
        margin-top: 6px;
        padding: 6px;
        background-color: #333;
        border-radius: 4px;
        border-left: 2px solid #3a7ca5;
        font-size: 0.8rem;
      }
    }
    
    .chord-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .tab-wrapper {
        overflow: hidden;
        margin-bottom: 10px;
      }
    }
    
    .chord-intervals {
      margin-top: 10px;
      
      h4 {
        margin: 0 0 6px 0;
        font-size: 0.9rem;
        color: #ddd;
      }
      
      .intervals-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        
        .interval-chip {
          display: inline-flex;
          align-items: center;
          background-color: #3a4a5a;
          color: #fff;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 0.8rem;
          
          &.outside-mode {
            background-color: #5a3a3a;
            border: 1px solid #7a4a4a;
          }
          
          .interval-note {
            margin-left: 4px;
            font-weight: bold;
            color: #ff9;
            font-size: 0.75rem;
          }
        }
      }
    }
    
    .chord-fingering {
      margin-top: 10px;
      
      h4 {
        margin: 0 0 6px 0;
        font-size: 0.9rem;
        color: #ddd;
      }
      
      .fingering-list {
        display: flex;
        justify-content: center;
        
        .position-card {
          background-color: #333;
          border-radius: 4px;
          padding: 8px;
          width: 100%;
          
          .position-number {
            font-size: 0.75rem;
            color: #aaa;
            margin-bottom: 6px;
            text-align: center;
          }
          
          .position-frets {
            display: flex;
            justify-content: space-around;
            align-items: center;
            
            .fret-value {
              display: flex;
              flex-direction: column;
              align-items: center;
              min-width: 16px;
              font-size: 0.9rem;
              font-weight: bold;
              color: #ddd;
              
              &.muted {
                color: #777;
              }
              
              .finger-indicator {
                margin-top: 3px;
                font-size: 0.65rem;
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background-color: #555;
                color: #eee;
              }
            }
          }
        }
      }
    }
  }
  </style>