<!-- ProgressionCompiler.vue - Composant principal restructuré avec lecture améliorée -->
<template>
  <PartitionTab />
  <div class="progression-compiler">
    <div class="compiler-container">
      <div class="main-content">
        <!-- Liste des progressions disponibles -->
        <ProgressionsList v-model:searchQuery="searchQuery" v-model:categoryFilter="categoryFilter"
          @dragStart="dragStart" />

        <!-- Zone de dépôt pour la progression compilée -->
        <ProgressionDropZone :compiledProgressions="compiledProgressions" :currentKeyDisplay="currentKeyDisplay"
          :userScale="userScale" :tempo="tempo" :isPlaying="isPlaying" :isPaused="isPaused" :repeat="repeat"
          :currentProgressionIndex="currentProgressionIndex" :currentChordIndex="currentChordIndex" @drop="onDrop"
          @moveItemUp="moveItemUp" @moveItemDown="moveItemDown" @removeItem="removeItem"
          @playProgression="playCompiledProgression" @pauseProgression="pauseCompiledProgression"
          @stopProgression="stopCompiledProgression" @toggleRepeat="toggleRepeat" @clearCompilation="clearCompilation"
          @tempoChange="tempo = $event" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onBeforeUnmount } from 'vue';
import { useMainStore } from '../../stores';
import { chordProgressions } from '../../composables/progressions.ts';
import { playNote, playFullChord } from '../../composables/useAudio';
import { Note, Chord, Scale } from 'tonal';
import ProgressionsList from '../sidebars/ProgressionsList.vue';
import ProgressionDropZone from './ProgressionDropZone.vue';
import PartitionTab from '../tab/PartitionTab.vue';

export default defineComponent({
  name: 'ProgressionCompiler',
  components: {
    ProgressionsList,
    ProgressionDropZone,
    PartitionTab
  },
  setup() {
    const store = useMainStore();
    const searchQuery = ref('');
    const categoryFilter = ref('');
    const compiledProgressions = ref<any[]>([]);
    const tempo = ref(100);
    const isPlaying = ref(false);
    const isPaused = ref(false);
    const repeat = ref(false);

    // Pour la gestion de la pause/reprise
    let playbackTimeout: number | null = null;

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
      // Arrêter la lecture si elle est en cours
      stopCompiledProgression();
      compiledProgressions.value = [];
    }

    // Fonction pour obtenir les notes d'une gamme majeure
    function getMajorScaleNotes(rootNote: string): string[] {
      const intervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"];
      return intervals.map(interval => Note.transpose(rootNote, interval));
    }

    // Fonction pour convertir un chiffre romain en degré numérique
    function romanToDegree(roman: string): number {
      const romanToNumber: { [key: string]: number } = {
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
      const defaultChordTypes: { [key: number]: string } = {
        1: "major", 2: "minor", 3: "minor", 4: "major", 5: "major", 6: "minor", 7: "diminished"
      };

      // Appliquer les modificateurs
      if (modifiers.includes('°') || modifiers.includes('dim')) return 'diminished';
      if (modifiers.includes('+') || modifiers.includes('aug')) return 'augmented';
      if (modifiers.includes('maj7')) return isMajor ? 'maj7' : 'minMaj7';
      if (modifiers.includes('7')) return isMajor ? '7' : 'min7';
      if (modifiers.includes('6')) return isMajor ? '6' : 'min6';
      if (modifiers.includes('m7b5') || modifiers.includes('Ø')) return 'min7b5';

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

    // Fonction pour arrêter tous les timeouts en cours
    function clearPlaybackTimeouts() {
      if (playbackTimeout !== null) {
        window.clearTimeout(playbackTimeout);
        playbackTimeout = null;
      }
    }

    // Fonction pour mettre en pause la lecture
    function pauseCompiledProgression() {
      if (isPlaying.value && !isPaused.value) {
        isPaused.value = true;
        clearPlaybackTimeouts();
      }
    }

    // Fonction pour arrêter complètement la lecture
    function stopCompiledProgression() {
      clearPlaybackTimeouts();
      isPlaying.value = false;
      isPaused.value = false;
      currentProgressionIndex.value = -1;
      currentChordIndex.value = -1;
    }

    // Fonction pour activer/désactiver la répétition
    function toggleRepeat() {
      repeat.value = !repeat.value;
    }

    // Fonction de lecture améliorée de la progression
    async function playCompiledProgression() {
      if ((isPlaying.value && !isPaused.value) || compiledProgressions.value.length === 0) return;

      // Si on reprend après une pause
      if (isPaused.value) {
        isPaused.value = false;
        playNextChord();
        return;
      }

      // Sinon, commencer une nouvelle lecture
      isPlaying.value = true;
      isPaused.value = false;
      currentProgressionIndex.value = 0;
      currentChordIndex.value = 0;

      // Lancer la lecture
      playNextChord();
    }

    // Fonction pour jouer l'accord suivant
    function playNextChord() {
      if (!isPlaying.value || isPaused.value) return;

      const rootNote = userScale.value;
      const beatDuration = 60 / tempo.value; // Durée d'un temps en secondes

      // Vérifier si nous avons atteint la fin de la liste
      if (currentProgressionIndex.value >= compiledProgressions.value.length) {
        if (repeat.value) {
          // Recommencer depuis le début si la répétition est activée
          currentProgressionIndex.value = 0;
          currentChordIndex.value = 0;
        } else {
          // Arrêter la lecture
          stopCompiledProgression();
          return;
        }
      }

      // Récupérer la progression actuelle
      const progression = compiledProgressions.value[currentProgressionIndex.value];
      if (!progression) {
        stopCompiledProgression();
        return;
      }

      // Récupérer les numéraux de la progression
      const numerals = progression.numerals.split('-');

      // Vérifier si nous avons atteint la fin de la progression
      if (currentChordIndex.value >= numerals.length) {
        // Passer à la progression suivante
        currentProgressionIndex.value++;
        currentChordIndex.value = 0;
        playNextChord();
        return;
      }

      const numeral = numerals[currentChordIndex.value];

      // Obtenir les notes de la gamme majeure pour cette tonalité
      const scaleNotes = getMajorScaleNotes(rootNote);

      // Convertir le chiffre romain en degré numérique
      const degree = romanToDegree(numeral);

      // Obtenir la note racine de l'accord basé sur le degré
      const chordRoot = scaleNotes[(degree - 1) % 7];

      // Déterminer le type d'accord basé sur le degré et les modificateurs
      const chordType = getChordTypeFromNumeral(numeral, degree);

      // Générer les notes de l'accord
      const chordNotes = getChordNotes(chordRoot, chordType);

      // Jouer l'accord
      playFullChord(chordNotes, beatDuration, 'sine').then(() => {
        // Préparer le prochain accord
        currentChordIndex.value++;

        // Planifier le prochain accord après une durée d'accord
        playbackTimeout = window.setTimeout(() => {
          playNextChord();
        }, beatDuration * 1000);
      });
    }

    // Nettoyer les timeouts avant de détruire le composant
    onBeforeUnmount(() => {
      clearPlaybackTimeouts();
    });

    return {
      searchQuery,
      categoryFilter,
      compiledProgressions,
      tempo,
      isPlaying,
      isPaused,
      repeat,
      currentKeyDisplay,
      userScale,
      currentProgressionIndex,
      currentChordIndex,
      dragStart,
      onDrop,
      moveItemUp,
      moveItemDown,
      removeItem,
      clearCompilation,
      playCompiledProgression,
      pauseCompiledProgression,
      stopCompiledProgression,
      toggleRepeat
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