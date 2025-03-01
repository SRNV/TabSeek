<!-- ProgressionDisplay.vue - Composant pour afficher une progression d'accords -->
<template>
    <div class="progression-display">
      <div class="progression-bar">
        <div 
          v-for="(chord, index) in progressionChords" 
          :key="index"
          class="chord-box"
        >
          <div class="chord-numeral">{{ getNumeral(chord.numeral) }}</div>
          <div v-if="displayChords" class="chord-note">{{ chord.chordName }}</div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed } from 'vue';
  import type { PropType } from 'vue';
  import { Note, Scale, Chord } from 'tonal';
  
  // Interface pour représenter les progressions
  interface ChordProgression {
    name: string;
    numerals: string;
    description: string;
    compatibleModes: string[];
    examples?: string[];
  }
  
  export default defineComponent({
    name: 'ProgressionDisplay',
    props: {
      progression: {
        type: Object as PropType<ChordProgression>,
        required: true
      },
      rootNote: {
        type: String,
        required: true
      },
      displayChords: {
        type: Boolean,
        default: true
      }
    },
    setup(props) {
      // Calculer les chiffres romains et les accords correspondants
      const progressionChords = computed(() => {
        // Séparer les chiffres romains (I-IV-V-I, etc.)
        const numerals = props.progression.numerals.split('-');
        
        // Obtenir les notes de la gamme majeure à partir de la tonalité
        const scaleNotes = getMajorScaleNotes(props.rootNote);
        
        return numerals.map(numeral => {
          // Déterminer le degré et le type d'accord
          const { degree, chordType } = parseNumeral(numeral);
          
          // Obtenir la note racine de l'accord basé sur le degré
          const chordRoot = scaleNotes[(degree - 1) % 7];
          
          // Construire le nom de l'accord
          const chordName = `${chordRoot}${formatChordType(chordType)}`;
          
          return {
            numeral,
            degree,
            chordType,
            chordRoot,
            chordName
          };
        });
      });
      
      // Fonction pour analyser un chiffre romain et extraire le degré et le type d'accord
      function parseNumeral(numeral: string): { degree: number, chordType: string } {
        // Mapper les chiffres romains aux nombres
        const romanToNumber: {[key: string]: number} = {
          'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
          'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
        };
        
        // Identifier le chiffre romain de base et les modificateurs
        const baseRoman = numeral.match(/^([IVXivx]+)/)?.[1] || '';
        const modifiers = numeral.substring(baseRoman.length);
        
        // Déterminer le degré
        const degree = romanToNumber[baseRoman] || 1;
        
        // Déterminer le type d'accord basé sur la casse et les modificateurs
        let chordType = '';
        
        // Majuscule = Majeur, minuscule = mineur
        const isMajor = baseRoman === baseRoman.toUpperCase();
        
        if (!isMajor) {
          chordType = 'm';
        }
        
        // Ajouter les modificateurs (7, maj7, dim, etc.)
        if (modifiers.includes('°') || modifiers.includes('dim')) {
          chordType = 'dim';
        } else if (modifiers.includes('+') || modifiers.includes('aug')) {
          chordType = 'aug';
        } else if (modifiers.includes('maj7')) {
          chordType += 'maj7';
        } else if (modifiers.includes('7')) {
          chordType += '7';
        } else if (modifiers.includes('6')) {
          chordType += '6';
        } else if (modifiers.includes('9')) {
          chordType += isMajor ? 'maj9' : 'm9';
        }
        
        // Cas spécial pour le diminué avec 7
        if (modifiers.includes('°7')) {
          chordType = 'dim7';
        }
        
        // Cas du IIm7b5, iiØ, etc.
        if (modifiers.includes('m7b5') || modifiers.includes('Ø')) {
          chordType = 'm7b5';
        }
        
        return { degree, chordType };
      }
      
      // Formater le type d'accord pour l'affichage
      function formatChordType(chordType: string): string {
        // Cette fonction peut être étendue pour formater l'affichage des types d'accord
        return chordType;
      }
      
      // Fonction pour obtenir les notes d'une gamme majeure
      function getMajorScaleNotes(rootNote: string): string[] {
        const intervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"];
        return intervals.map(interval => Note.transpose(rootNote, interval));
      }
      
      // Fonction pour mettre en forme les numéraux (pour l'affichage)
      function getNumeral(numeral: string): string {
        return numeral;
      }
      
      return {
        progressionChords,
        getNumeral
      };
    }
  });
  </script>
  
  <style scoped lang="scss">
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
  </style>