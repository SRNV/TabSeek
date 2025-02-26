<!-- Tab.vue amélioré -->
<template>
  <div class="tab-container">
    <div class="tab-header">
      <h3 class="tab-title">
        {{ item.name }}
        <small v-if="item.aliases && item.aliases.length > 0" class="tab-aliases">
          ({{ item.aliases.join(', ') }})
        </small>
      </h3>
      
      <div class="tab-actions">
        <div class="tab-view-options">
          <button 
            v-for="view in viewOptions" 
            :key="view.id"
            :class="['view-option', { active: currentView === view.id }]"
            @click="currentView = view.id"
            :title="view.description">
            {{ view.name }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="tab-content">
      <Notes 
        :notes="item.notes" 
        :collection="item.notes" 
        :chordType="item.name"
      />
      
      <div class="tab-navigation">
        <button class="nav-btn" @click="moveLeft" :disabled="localVisibleStart === 0" title="Déplacer vers la gauche">
          <span class="nav-icon">←</span>
        </button>
        <span class="position-indicator">Position {{ localVisibleStart + 1 }}-{{ localVisibleEnd + 1 }}</span>
        <button class="nav-btn" @click="moveRight" :disabled="localVisibleEnd >= tabLength" title="Déplacer vers la droite">
          <span class="nav-icon">→</span>
        </button>
      </div>
      
      <!-- Vue fretboard -->
      <div v-if="currentView === 'fretboard'" class="fretboard-container">
        <div v-for="(cord, cIdx) in cords" :key="'cord-' + cIdx" class="fret-row">
          <div class="string-name">{{ cord }}</div>
          <GuitarNote
            class="open-string"
            :mode="item.name"
            :position="0"
            :displayName="getNoteName(cord, 0)"
            :background="getNoteColor(cord, 0, item.notes)"
            :degreeLabel="getNoteDegreeLabel(cord, 0, item.notes)"
          />
          <GuitarNote
            v-for="fret in visibleFretRange"
            :key="'fret-' + fret + 1"
            :mode="item.name"
            :position="fret + 1"
            :displayName="getNoteName(cord, fret + 1)"
            :background="getNoteColor(cord, fret + 1, item.notes)"
            :degreeLabel="getNoteDegreeLabel(cord, fret + 1, item.notes)"
          />
          <div class="fret-markers">
            <div 
              v-for="fret in visibleFretRange" 
              :key="'marker-' + fret"
              class="fret-marker"
              :class="{ 'has-marker': [2, 4, 6, 8, 11, 14, 16, 18, 21, 23].includes(fret) }">
              {{ fret + 1 }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Vue partition (si disponible) -->
      <div v-else-if="currentView === 'staff' && hasStaffView" class="staff-container">
        <p class="coming-soon">La vue partition sera disponible prochainement.</p>
      </div>
      
      <!-- Vue chord chart -->
      <div v-else-if="currentView === 'chart'" class="chord-chart-container">
        <div class="chord-diagram">
          <div class="diagram-neck">
            <div class="diagram-nut"></div>
            <div v-for="i in 5" :key="'fret-line-' + i" class="diagram-fret"></div>
            
            <div v-for="(string, idx) in 6" :key="'string-' + idx" class="diagram-string"></div>
            
            <!-- Marqueurs de frettes -->
            <div v-for="i in 5" :key="'fret-marker-' + i" class="diagram-fret-marker">{{ i + localVisibleStart }}</div>
            
            <!-- Points pour les notes -->
            <div 
              v-for="(position, stringIdx) in chordPositions" 
              :key="'dot-' + stringIdx"
              v-if="position > 0"
              class="diagram-dot"
              :style="getDotStyle(position, stringIdx)">
              <span class="diagram-finger" v-if="showFingers && fingerPositions[stringIdx]">
                {{ fingerPositions[stringIdx] }}
              </span>
            </div>
            
            <!-- Marques pour les cordes à vide/muettes -->
            <div
              v-for="(position, stringIdx) in chordPositions"
              :key="'string-mark-' + stringIdx"
              v-if="position <= 0"
              class="diagram-string-mark"
              :style="getStringMarkStyle(stringIdx, position)">
              {{ position === 0 ? 'o' : 'x' }}
            </div>
          </div>
          
          <div class="chord-info">
            <div class="chord-name">{{ formattedChordName }}</div>
            <div class="chord-position" v-if="positionNumber > 0">Position {{ positionNumber }}</div>
            <label class="show-fingers-toggle">
              <input type="checkbox" v-model="showFingers">
              <span>Doigtés</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script lang="ts" setup>
import { ref, computed, defineProps, watch } from 'vue';
import Notes from './Notes.vue';
import GuitarNote from './GuitarNote.vue';
import { getNoteName, getNoteColor, getNoteDegreeLabel } from '../composables/useNoteHelpers';
import { Note } from 'tonal';
import { getFretPositions } from '../composables/useGuitarChords.ts';
import { getReadableChordName } from '../composables/tonalChordsMapping';
  
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
}>();

const localVisibleStart = ref(props.visibleStart);
const localVisibleEnd = ref(props.visibleEnd);
const currentView = ref('fretboard'); // 'fretboard', 'chart', 'staff'
const showFingers = ref(true);
const positionNumber = ref(1);

// Options de vue
const viewOptions = [
  { id: 'fretboard', name: 'Manche', description: 'Vue du manche complet' },
  { id: 'chart', name: 'Diagramme', description: 'Diagramme d\'accord' },
  { id: 'staff', name: 'Partition', description: 'Notation musicale' }
];

// Vérifier si la vue partition est disponible
const hasStaffView = computed(() => {
  // À implémenter selon votre logique
  return false;
});

// Formatter le nom de l'accord pour l'affichage
const formattedChordName = computed(() => {
  // Extraire la note racine du nom si possible
  const chordParts = props.item.name.match(/^([A-G][#b]?)(.*)$/);
  if (chordParts) {
    const root = chordParts[1];
    const type = chordParts[2];
    if (type) {
      const readableType = getReadableChordName(type, 'symbol');
      return `${root}${readableType}`;
    }
  }
  return props.item.name;
});

// Corder standard
const cords = computed(() => {
  return props.cords ?? "E2 A2 D3 G3 B3 E4".split(" ").reverse();
});

      // Positions des doigts pour le diagramme d'accord
const chordPositions = computed(() => {
  try {
    // Extraire la note racine et le type d'accord
    const chordNameParts = props.item.name.match(/^([A-G][#b]?)(.*)$/);
    if (chordNameParts) {
      const rootNote = chordNameParts[1];
      const chordType = chordNameParts[2] || 'major';
      
      // Log pour debug
      console.log("Accord à afficher:", rootNote, chordType);
      
      try {
        // Essayer d'obtenir les positions pour cet accord
        const positions = getFretPositions(chordType, rootNote, cords.value.reverse(), positionNumber.value);
        console.log("Positions obtenues:", positions);
        
        // Ajuster les positions relatives au début visible
        return positions.map(pos => pos === -1 ? -1 : pos);
      } catch (error) {
        console.error("Erreur dans getFretPositions:", error);
        
        // Fallback si getFretPositions échoue
        return [0, 1, 0, 2, 3, 0]; // Position standard pour C majeur
      }
    }
  } catch (error) {
    console.error("Erreur lors du calcul des positions d'accord:", error);
  }
  
  // Position par défaut en cas d'échec
  return [0, 1, 0, 2, 3, 0];
});

// Obtenir les positions des doigts
const fingerPositions = computed(() => {
  // Positions par défaut (0 = pas de doigt, 1-4 = index à auriculaire)
  return [0, 1, 0, 2, 3, 0];
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

// Styles pour le diagramme d'accord
function getDotStyle(position: number, stringIdx: number) {
  // Ajuster la position pour qu'elle corresponde à l'affichage
  const fretPosition = position - localVisibleStart.value;
  if (fretPosition < 0) return { display: 'none' };
  
  // Positions des points en pixels
  const topPosition = fretPosition === 0 ? 5 : (fretPosition - 0.5) * 20 + 10;
  const leftPosition = (5 - stringIdx) * 16 + 10;
  
  // Log pour debug
  console.log(`Dot position for string ${stringIdx}, fret ${position}: top=${topPosition}px, left=${leftPosition}px`);
  
  return {
    top: `${topPosition}px`,
    left: `${leftPosition}px`,
    backgroundColor: stringIdx === 0 ? '#FF9500' : '#3a7ca5' // Racine en orange
  };
}

function getStringMarkStyle(stringIdx: number, position: number) {
  const leftPosition = (5 - stringIdx) * 16 + 10;
  
  // Log pour debug
  console.log(`String mark for string ${stringIdx}, position ${position}: left=${leftPosition}px`);
  
  return {
    top: '-15px',
    left: `${leftPosition}px`,
    color: position === 0 ? '#55aa55' : '#aa5555'
  };
}

// Surveiller les changements des props
watch(() => props.visibleStart, (newVal) => {
  localVisibleStart.value = newVal;
});

watch(() => props.visibleEnd, (newVal) => {
  localVisibleEnd.value = newVal;
});
</script>
  
<style scoped lang="scss">
.tab-container {
  width: 100%;
  padding: 1.5rem;
  background-color: #222;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
  
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #333;
    
    .tab-title {
      margin: 0;
      font-size: 1.3rem;
      color: #e0e0e0;
      
      .tab-aliases {
        color: #aaaaaa;
        font-size: 0.9rem;
        font-weight: normal;
        margin-left: 5px;
      }
    }
    
    .tab-actions {
      display: flex;
      align-items: center;
      
      .tab-view-options {
        display: flex;
        gap: 5px;
        
        .view-option {
          padding: 6px 10px;
          background-color: #333;
          border: none;
          border-radius: 4px;
          color: #bbb;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background-color: #444;
          }
          
          &.active {
            background-color: #555;
            color: #fff;
          }
        }
      }
    }
  }
  
  .tab-content {
    .tab-navigation {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin: 15px 0;
      
      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        font-size: 1rem;
        padding: 0;
        border: none;
        border-radius: 4px;
        background-color: #333;
        color: #ddd;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          background-color: #444;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .nav-icon {
          font-size: 1.2rem;
        }
      }
      
      .position-indicator {
        font-size: 0.85rem;
        color: #999;
      }
    }
    
    .fretboard-container {
      margin-top: 20px;
      
      .fret-row {
        display: flex;
        flex-wrap: nowrap;
        gap: 4px;
        margin-bottom: 10px;
        position: relative;
        align-items: center;
        
        .string-name {
          width: 24px;
          text-align: right;
          font-size: 0.75rem;
          color: #999;
          margin-right: 6px;
        }
        
        .open-string {
          border-right: 2px solid #444 !important;
          margin-right: 6px;
          position: relative;
          
          &::after {
            content: '';
            position: absolute;
            right: -2px;
            top: 0;
            height: 100%;
            width: 2px;
            background-color: #444;
          }
        }
        
        .fret-markers {
          display: flex;
          margin-left: 10px;
          gap: 4px;
          
          .fret-marker {
            width: 65px;
            height: 20px;
            text-align: center;
            font-size: 0.7rem;
            color: #777;
            position: relative;
            
            &.has-marker::before {
              content: '•';
              position: absolute;
              bottom: -15px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 12px;
              color: #666;
            }
          }
        }
      }
    }
    
    .staff-container {
      margin-top: 20px;
      min-height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #272727;
      border-radius: 4px;
      padding: 20px;
      
      .staff-placeholder {
        width: 100%;
        position: relative;
        min-height: 120px;
        
        .staff-lines {
          position: relative;
          height: 40px;
          width: 100%;
          
          .staff-line {
            position: absolute;
            height: 1px;
            width: 100%;
            background-color: #777;
            
            &:nth-child(1) { top: 0px; }
            &:nth-child(2) { top: 10px; }
            &:nth-child(3) { top: 20px; }
            &:nth-child(4) { top: 30px; }
            &:nth-child(5) { top: 40px; }
          }
        }
        
        .clef {
          position: absolute;
          top: -10px;
          left: 10px;
          font-size: 2.5rem;
          color: #999;
        }
        
        .notes-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 40px;
          
          .note-placeholder {
            position: absolute;
            top: 15px;
            font-size: 1.3rem;
            color: #777;
          }
        }
        
        .coming-soon {
          color: #888;
          font-style: italic;
          text-align: center;
          margin-top: 60px;
        }
      }
    }
    
    .chord-chart-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      
      .chord-diagram {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        
        .diagram-neck {
          position: relative;
          width: 100px;
          height: 110px;
          background-color: #2d2515;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          
          .diagram-nut {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: #bbb;
          }
          
          .diagram-fret {
            position: absolute;
            left: 0;
            width: 100%;
            height: 1px;
            background-color: #777;
          }
          
          @for $i from 1 through 5 {
            .diagram-fret:nth-child(#{$i + 1}) {
              top: #{$i * 20}px;
            }
          }
          
          .diagram-string {
            position: absolute;
            top: 0;
            width: 1px;
            height: 100%;
            background-color: #aaa;
          }
          
          @for $i from 0 through 5 {
            .diagram-string:nth-child(#{$i + 7}) {
              left: #{$i * 16 + 10}px;
            }
          }
          
          .diagram-fret-marker {
            position: absolute;
            right: -16px;
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 0.7rem;
          }
          
          @for $i from 1 through 5 {
            .diagram-fret-marker:nth-child(#{$i + 12}) {
              top: #{($i - 0.5) * 20}px;
            }
          }
          
          .diagram-dot {
            position: absolute;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: #3a7ca5;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
            
            .diagram-finger {
              font-size: 0.7rem;
              color: white;
              font-weight: bold;
            }
          }
          
          .diagram-string-mark {
            position: absolute;
            font-weight: bold;
            font-size: 0.8rem;
          }
        }
        
        .chord-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          
          .chord-name {
            font-size: 1.1rem;
            font-weight: bold;
            color: #e0e0e0;
          }
          
          .chord-position {
            font-size: 0.8rem;
            color: #aaa;
          }
          
          .show-fingers-toggle {
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.75rem;
            color: #999;
            cursor: pointer;
            
            input {
              cursor: pointer;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .tab-container {
    padding: 1rem;
    
    .tab-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      
      .tab-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
}
</style>