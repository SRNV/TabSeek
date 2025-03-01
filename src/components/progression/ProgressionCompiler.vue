<!-- ProgressionCompiler.vue - Composant principal restructuré -->
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
import { playNote } from '../../composables/useAudio';
import { Note, Chord } from 'tonal';
  // @ts-ignore
import ProgressionsList from './ProgressionsList.vue';
  // @ts-ignore
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
    
    // Fonction de lecture de la progression
    async function playCompiledProgression() {
      if (isPlaying.value || compiledProgressions.value.length === 0) return;
      
      isPlaying.value = true;
      const rootNote = userScale.value;
      const beatDuration = 60 / tempo.value; // Durée d'un temps en secondes
      
      try {
        for (const progression of compiledProgressions.value) {
          // Conversion des chiffres romains en chiffres arabes pour indexation (I=1, IV=4, etc.)
          const chordDegrees = progression.numerals.split('-').map((numeral: string) => {
            // Convertir le chiffre romain en nombre (logique simplifiée)
            const romanToNumber: {[key: string]: number} = {
              'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
              'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
            };
            
            // Extraire la partie romaine de base (gérer les cas comme "IIm7", "V7", etc.)
            const baseRoman = numeral.match(/^([IVXivx]+)/)?.[1] || '';
            return romanToNumber[baseRoman] || 1;
          });
          
          // Jouer chaque accord de la progression
          for (const degree of chordDegrees) {
            const diatonicNotes = getMajorScaleNotes(rootNote);
            
            // Obtenir la note racine de l'accord basé sur le degré
            const chordRoot = diatonicNotes[(degree - 1) % 7];
            
            // Déterminer le type d'accord basé sur le degré (majeur/mineur/etc.)
            // Logique simplifiée: I, IV, V = majeur; ii, iii, vi = mineur; vii = diminué
            let chordType = "major";
            if ([2, 3, 6].includes(degree)) chordType = "minor";
            if (degree === 7) chordType = "diminished";
            
            // Générer les notes de l'accord
            const chord = Chord.get(`${chordRoot}${chordType}`);
            
            // Jouer les notes de l'accord en arpège
            for (const note of chord.notes) {
              await playNote(`${note}4`, beatDuration * 0.5);
              await new Promise(r => setTimeout(r, beatDuration * 0.1 * 1000));
            }
            
            // Pause entre les accords
            await new Promise(r => setTimeout(r, beatDuration * 0.5 * 1000));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la lecture:', error);
      } finally {
        isPlaying.value = false;
      }
    }
    
    // Fonction utilitaire pour obtenir les notes d'une gamme majeure
    function getMajorScaleNotes(rootNote: string): string[] {
      const intervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"];
      return intervals.map(interval => Note.transpose(rootNote, interval));
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