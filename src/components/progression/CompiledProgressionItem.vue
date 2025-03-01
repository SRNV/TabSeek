<!-- CompiledProgressionItem.vue - Composant pour un élément de progression compilé -->
<template>
  <div class="compiled-item" :class="{ 'playing': isPlaying }">
    <div class="item-content">
      <div class="item-header">
        <span class="item-name">{{ item.name }}</span>
        <div class="item-actions">
          <button 
            class="action-btn move-up" 
            @click="$emit('moveUp')" 
            :disabled="index === 0"
            title="Déplacer vers le haut"
          >
            &#8593;
          </button>
          <button 
            class="action-btn move-down" 
            @click="$emit('moveDown')" 
            :disabled="index === maxIndex"
            title="Déplacer vers le bas"
          >
            &#8595;
          </button>
          <button 
            class="action-btn remove" 
            @click="$emit('remove')"
            title="Supprimer"
          >
            &#10005;
          </button>
        </div>
      </div>
      <div class="item-numerals">{{ item.numerals }}</div>
      
      <!-- Composant de progression avec état de lecture transmis -->
      <div class="progression-display">
        <div class="progression-bar">
          <div 
            v-for="(numeral, chordIdx) in item.numerals.split('-')" 
            :key="chordIdx"
            class="chord-box"
            :class="{ 'playing': isPlaying && currentChordIndex === chordIdx }"
          >
            <div class="chord-numeral">{{ numeral }}</div>
            <div v-if="chordNotes[chordIdx]" class="chord-note">{{ chordNotes[chordIdx] }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';
import type { ChordProgression } from '../../composables/progressions.ts';
import { Note, Scale } from 'tonal';

export default defineComponent({
  name: 'CompiledProgressionItem',
  props: {
    item: {
      type: Object as PropType<ChordProgression>,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    rootNote: {
      type: String,
      required: true
    },
    maxIndex: {
      type: Number,
      default: 100 // Valeur élevée par défaut
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    currentChordIndex: {
      type: Number,
      default: -1
    }
  },
  emits: ['moveUp', 'moveDown', 'remove'],
  
  setup(props) {
    // Fonction pour obtenir les notes d'une gamme majeure
    const getMajorScaleNotes = (rootNote: string): string[] => {
      const intervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"];
      return intervals.map(interval => Note.transpose(rootNote, interval));
    };
    
    // Convertir un chiffre romain en degré
    const romanToDegree = (roman: string): number => {
      const romanToNumber: {[key: string]: number} = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
        'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
      };
      
      // Extraire la partie romaine de base (gérer les cas comme "IIm7", "V7", etc.)
      const baseRoman = roman.match(/^([IVXivx]+)/)?.[1] || '';
      return romanToNumber[baseRoman] || 1;
    };
    
    // Générer les noms des accords en fonction des degrés
    const chordNotes = computed(() => {
      const scaleNotes = getMajorScaleNotes(props.rootNote);
      const numerals = props.item.numerals.split('-');
      
      return numerals.map(numeral => {
        // Obtenir le degré
        const degree = romanToDegree(numeral);
        
        // Obtenir la note racine de l'accord basé sur le degré
        const chordRoot = scaleNotes[(degree - 1) % 7];
        
        // Déterminer le type d'accord basé sur la casse et les modificateurs
        const isMajor = numeral[0] === numeral[0].toUpperCase();
        const hasModifier = numeral.length > 1;
        
        // Construire le nom de l'accord
        let chordName = chordRoot;
        
        // Ajouter le modificateur selon le type d'accord
        if (!isMajor) {
          chordName += 'm';
        }
        
        // Ajouter d'autres modificateurs (7, maj7, dim, etc.)
        if (hasModifier) {
          const modifiers = numeral.substring(numeral.match(/^([IVXivx]+)/)?.[1].length || 0);
          if (modifiers.includes('°') || modifiers.includes('dim')) {
            chordName = chordRoot + 'dim';
          } else if (modifiers.includes('+') || modifiers.includes('aug')) {
            chordName = chordRoot + 'aug';
          } else if (modifiers.includes('maj7')) {
            chordName = chordRoot + (isMajor ? 'maj7' : 'mMaj7');
          } else if (modifiers.includes('7')) {
            chordName = chordRoot + (isMajor ? '7' : 'm7');
          } else if (modifiers.includes('6')) {
            chordName = chordRoot + (isMajor ? '6' : 'm6');
          } else if (modifiers.includes('m7b5') || modifiers.includes('Ø')) {
            chordName = chordRoot + 'm7b5';
          } else if (modifiers.includes('m') || modifiers.includes('min')) {
            chordName = chordRoot + 'm';
          }
        }
        
        return chordName;
      });
    });
    
    return {
      chordNotes
    };
  }
});
</script>

<style scoped lang="scss">
.compiled-item {
  background-color: #333;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  border: 3px solid #333;
  // Style pour la progression en cours de lecture
  &.playing {
    border: 3px solid orange;
    padding: 9px; // Compenser la bordure pour garder la même taille
  }
  
  .item-content {
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .item-name {
        font-weight: bold;
        color: #e0e0e0;
      }
      
      .item-actions {
        display: flex;
        gap: 5px;
        
        .action-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #444;
          border: none;
          border-radius: 3px;
          color: #ccc;
          cursor: pointer;
          
          &:hover:not(:disabled) {
            background-color: #555;
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          &.remove {
            color: #ff9999;
            
            &:hover {
              background-color: #553333;
            }
          }
        }
      }
    }
    
    .item-numerals {
      font-size: 0.85rem;
      color: #aaa;
      margin-bottom: 8px;
    }
    
    .progression-display {
      margin: 10px 0;
      
      .progression-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        
        .chord-box {
          background-color: #3d3d3d;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 8px 12px;
          min-width: 60px;
          text-align: center;
          transition: all 0.3s ease;
          
          // Style pour l'accord en cours de lecture
          &.playing {
            background-color: orange;
            .chord-numeral, .chord-note {
              color: white;
            }
          }
          
          .chord-numeral {
            font-weight: bold;
            font-size: 1rem;
            color: #e0e0e0;
            margin-bottom: 4px;
          }
          
          .chord-note {
            font-size: 0.8rem;
            color: #aaa;
          }
        }
      }
    }
  }
}
</style>