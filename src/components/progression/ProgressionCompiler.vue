<!-- ProgressionCompiler.vue - Composant principal restructuré avec lecture améliorée -->
<template>
  <div class="progression-compiler">
    <div class="compiler-container">
      <div class="main-content">
        <!-- Liste des progressions disponibles -->
        <ProgressionsList 
          :progressions="filteredProgressions"
          :categories="categories"
          v-model:searchQuery="searchQuery"
          v-model:categoryFilter="categoryFilter"
          @dragStart="dragStart"
        />
        
        <!-- Zone de dépôt pour la progression compilée -->
        <ProgressionDropZone
          :compiledProgressions="compiledProgressions"
          :currentKeyDisplay="currentKeyDisplay"
          :userScale="userScale"
          :tempo="tempo"
          :isPlaying="isPlaying"
          :currentProgressionIndex="currentProgressionIndex"
          :currentChordIndex="currentChordIndex"
          @drop="onDrop"
          @moveItemUp="moveItemUp"
          @moveItemDown="moveItemDown"
          @removeItem="removeItem"
          @playProgression="playCompiledProgression"
          @clearCompilation="clearCompilation"
          @tempoChange="tempo = $event"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useMainStore } from '../../stores';
import { chordProgressions } from '../../composables/progressions.ts';
import { playNote, playFullChord } from '../../composables/useAudio';
import { Note, Chord, Scale } from 'tonal';
import ProgressionsList from './ProgressionsList.vue';
import ProgressionDropZone from './ProgressionDropZone.vue';

export default defineComponent({
  name: 'ProgressionCompiler',
  components: {
    ProgressionsList,
    ProgressionDropZone
  },
  setup() {
    const store = useMainStore();
    const searchQuery = ref('');
    const categoryFilter = ref('');
    const compiledProgressions = ref<any[]>([]);
    const tempo = ref(100);
    const isPlaying = ref(false);
    
    // Indices pour suivre la progression et l'accord actuellement joués
    const currentProgressionIndex = ref(-1);
    const currentChordIndex = ref(-1);
    
    // Calculer la valeur d'affichage de la tonalité actuelle
    const currentKeyDisplay = computed(() => {
      const rootNote = store.userScale.replace(/\d+$/, ''); // Supprimer le numéro d'octave
      return rootNote;
    });
    
    // Récupérer l'échelle utilisateur du store
    const userScale = computed(() => store.userScale.replace(/\d+$/, ''));
    
    // Extraire toutes les catégories uniques des progressions
    const categories = computed(() => {
      const categoriesSet = new Set(chordProgressions.map(prog => prog.compatibleModes[0]));
      return Array.from(categoriesSet).sort();
    });
    
    // Filtrer les progressions en fonction de la recherche et de la catégorie
    const filteredProgressions = computed(() => {
      return chordProgressions.filter(progression => {
        const matchesSearch = 
          progression.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          progression.description.toLowerCase().includes(searchQuery.value.toLowerCase());
        
        const matchesCategory = 
          categoryFilter.value === '' || 
          progression.compatibleModes.includes(categoryFilter.value);
        
        return matchesSearch && matchesCategory;
      });
    });
    
    // Gestion du drag and drop
    function dragStart(event: DragEvent, progression: any) {
      if (event.dataTransfer) {
        event.dataTransfer.setData('application/json', JSON.stringify(progression));
        event.dataTransfer.effectAllowed = 'copy';
      }
    }
    
    function onDrop(event: DragEvent) {
      if (event.dataTransfer) {
        const data = event.dataTransfer.getData('application/json');
        if (data) {
          try {
            const progression = JSON.parse(data);
            compiledProgressions.value.push(progression);
          } catch (error) {
            console.error('Erreur lors de l\'analyse des données:', error);
          }
        }
      }
    }
    
    // Fonctions de gestion de la liste compilée
    function moveItemUp(index: number) {
      if (index > 0) {
        const temp = compiledProgressions.value[index];
        compiledProgressions.value[index] = compiledProgressions.value[index - 1];
        compiledProgressions.value[index - 1] = temp;
      }
    }
    
    function moveItemDown(index: number) {
      if (index < compiledProgressions.value.length - 1) {
        const temp = compiledProgressions.value[index];
        compiledProgressions.value[index] = compiledProgressions.value[index + 1];
        compiledProgressions.value[index + 1] = temp;
      }
    }
    
    function removeItem(index: number) {
      compiledProgressions.value.splice(index, 1);
    }
    
    function clearCompilation() {
      compiledProgressions.value = [];
    }
    
    // Fonction pour obtenir les notes d'une gamme majeure
    function getMajorScaleNotes(rootNote: string): string[] {
      const intervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"];
      return intervals.map(interval => Note.transpose(rootNote, interval));
    }
    
    // Fonction pour convertir un chiffre romain en degré numérique
    function romanToDegree(roman: string): number {
      const romanToNumber: {[key: string]: number} = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
        'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
      };
      
      // Extraire la partie romaine de base (gérer les cas comme "IIm7", "V7", etc.)
      const baseRoman = roman.match(/^([IVXivx]+)/)?.[1] || '';
      return romanToNumber[baseRoman] || 1;
    }
    
    // Fonction pour obtenir le type d'accord basé sur le degré et d'éventuels modificateurs
    function getChordTypeFromNumeral(numeral: string, degree: number): string {
      // Extraire la partie romaine et les modificateurs
      const baseRoman = numeral.match(/^([IVXivx]+)/)?.[1] || '';
      const modifiers = numeral.substring(baseRoman.length);
      
      // Vérifier si l'accord est majeur ou mineur en fonction de la casse
      const isMajor = baseRoman === baseRoman.toUpperCase();
      
      // Accords par défaut selon le degré dans une gamme majeure
      const defaultChordTypes: {[key: number]: string} = {
        1: "major", 2: "minor", 3: "minor", 4: "major", 5: "major", 6: "minor", 7: "diminished"
      };
      
      // Appliquer les modificateurs
      if (modifiers.includes('°') || modifiers.includes('dim')) return 'diminished';
      if (modifiers.includes('+') || modifiers.includes('aug')) return 'augmented';
      if (modifiers.includes('maj7')) return isMajor ? 'maj7' : 'minMaj7';
      if (modifiers.includes('7')) return isMajor ? '7' : 'min7';
      if (modifiers.includes('6')) return isMajor ? '6' : 'min6';
      if (modifiers.includes('m7b5') || modifiers.includes('Ø')) return 'min7b5';
      if (modifiers.includes('m') || modifiers.includes('min')) return 'minor';
      
      // Si pas de modificateur, utiliser le type par défaut selon le degré
      if (!isMajor) return 'minor';
      return defaultChordTypes[degree] || 'major';
    }
    
    // Fonction pour générer les notes d'un accord à partir de sa fondamentale et son type
    function getChordNotes(rootNote: string, chordType: string): string[] {
      try {
        // Utiliser Tonal.js pour obtenir les intervalles de l'accord
        const chord = Chord.get(`${rootNote}${chordType}`);
        if (chord.empty) return [rootNote];
        
        // Générer les notes à partir des intervalles
        return chord.notes.map(note => `${note}4`); // Ajouter l'octave 4 pour la lecture
      } catch (error) {
        console.error('Erreur lors de la génération des notes d\'accord:', error);
        return [rootNote];
      }
    }
    
    // Fonction de lecture améliorée de la progression
    async function playCompiledProgression() {
      if (isPlaying.value || compiledProgressions.value.length === 0) return;
      
      isPlaying.value = true;
      const rootNote = userScale.value;
      const beatDuration = 60 / tempo.value; // Durée d'un temps en secondes
      
      try {
        // Parcourir chaque progression
        for (let progIndex = 0; progIndex < compiledProgressions.value.length; progIndex++) {
          currentProgressionIndex.value = progIndex;
          const progression = compiledProgressions.value[progIndex];
          
          // Conversion des chiffres romains
          const numerals = progression.numerals.split('-');
          
          // Obtenir les notes de la gamme majeure pour cette tonalité
          const scaleNotes = getMajorScaleNotes(rootNote);
          
          // Jouer chaque accord de la progression
          for (let chordIndex = 0; chordIndex < numerals.length; chordIndex++) {
            // Si la lecture a été interrompue, sortir de la boucle
            if (!isPlaying.value) break;
            
            currentChordIndex.value = chordIndex;
            const numeral = numerals[chordIndex];
            
            // Convertir le chiffre romain en degré numérique
            const degree = romanToDegree(numeral);
            
            // Obtenir la note racine de l'accord basé sur le degré
            const chordRoot = scaleNotes[(degree - 1) % 7];
            
            // Déterminer le type d'accord basé sur le degré et les modificateurs
            const chordType = getChordTypeFromNumeral(numeral, degree);
            
            // Générer les notes de l'accord
            const chordNotes = getChordNotes(chordRoot, chordType);
            
            // Jouer toutes les notes de l'accord simultanément
            await playFullChord(chordNotes, beatDuration, 'sine');
            
            // Pause entre les accords
            await new Promise(r => setTimeout(r, beatDuration * 0.5 * 1000));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la lecture:', error);
      } finally {
        isPlaying.value = false;
        currentProgressionIndex.value = -1;
        currentChordIndex.value = -1;
      }
    }
    
    return {
      searchQuery,
      categoryFilter,
      compiledProgressions,
      tempo,
      isPlaying,
      currentKeyDisplay,
      userScale,
      categories,
      filteredProgressions,
      currentProgressionIndex,
      currentChordIndex,
      dragStart,
      onDrop,
      moveItemUp,
      moveItemDown,
      removeItem,
      clearCompilation,
      playCompiledProgression
    };
  }
});
</script>

<style scoped lang="scss">
.progression-compiler {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  .section-title {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: #e0e0e0;
    text-align: center;
  }
  
  .main-content {
    display: flex;
    gap: 20px;
    
    @media (max-width: 768px) {
      flex-direction: column;
    }
  }
}
</style>