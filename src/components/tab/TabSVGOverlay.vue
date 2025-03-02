<!-- TabSVGOverlay.vue -->
<template>
  <div class="overlay-container">
    <svg class="overlay-svg" :width="windowWidth" :height="windowHeight" xmlns="http://www.w3.org/2000/svg">
      <!-- Lignes entre notes -->
      <line v-for="(connection, index) in connections" :key="`line-${index}-${connection.note}`" :x1="connection.from.x"
        :y1="connection.from.y" :x2="connection.to.x" :y2="connection.to.y" stroke="orange" stroke-width="4"
        stroke-opacity="0.7" />
      <g v-for="(positions, index) in notePositions">

        <!-- Cercles sur les notes -->
        <circle v-for="(p, index2) in positions" :key="`circle-${index2}-${p.note}`" :cx="p.x" :cy="p.y" r="15"
          :fill="p.isFirst ? 'blue' : 'orange'" fill-opacity="0.5" stroke="orange" stroke-width="2" />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useMainStore } from '../../stores';
import { Note } from 'tonal';
interface Position {
  x: number;
  y: number;
  note: string;
  isFirst: boolean;
}

interface Connection {
  from: Position;
  to: Position;
  note: string;
}

export default defineComponent({
  name: 'TabSVGOverlay',
  setup() {
    const windowWidth = ref(window.innerWidth);
    const windowHeight = ref(window.innerHeight);
    const store = useMainStore();
    const notePositions = ref<Position[][]>([]);
    const highlightedNotes = computed(() => {
      const result: number[] = [];
      if (!store.chordRootObject) return result;
      store.chordRootObject.intervals.forEach((i) => {
        console.log(i);
        const r = Note.transpose((store.chordRootNote), i);
        result.push(Note.midi(r)!! % 12);
      });
      return result;
    }); // Liste des notes à mettre en évidence

    // Mise à jour des dimensions lors du redimensionnement de la fenêtre
    const handleResize = () => {
      windowWidth.value = window.innerWidth;
      windowHeight.value = window.innerHeight;
      updateNotePositions();
    };

    // Calculer les connexions entre les notes
    const connections = computed<Connection[]>(() => {
      const result: Connection[] = [];
      notePositions.value.forEach((positions) => {
        // Créer des connexions entre les notes adjacentes dans la liste
        for (let i = 0; i < positions.length - 1; i++) {
          if (positions[i] && positions[i + 1]) {
            result.push({
              from: positions[i],
              to: positions[i + 1],
              note: positions[i].note,
            });
          }
        }
      });

      return result;
    });

    // Mise à jour des positions des notes
    const updateNotePositions = () => {
      // Vider notePositions.value
      notePositions.value.forEach((p) => p.splice(0));
      notePositions.value.splice(0);
      notePositions.value = [];

      const cords = new Set();
      let positions: Position[] = [];

      // Récupérer tous les éléments .forChordsDisplay
      // (Assurez-vous que .forChordsDisplay est un élément HTML)
      const forChordsDisplays = Array.from(document.querySelectorAll('.forChordsDisplay[note]')).reverse() as HTMLElement[];

      // Tant qu'il y a des éléments dans forChordsDisplays, on les traite
      while (forChordsDisplays.length > 0) {
        // Retire le dernier élément (pop) pour avancer dans le tableau
        const element = forChordsDisplays.pop();
        if (!element) {
          continue; // Passe au prochain tour si jamais element est undefined
        }

        const note = element.getAttribute('note');
        const cord = element.getAttribute('cord');

        // Si pas de note, on ignore l'élément
        if (!note) {
          continue;
        }

        // Si le cord existe déjà, on ignore l'élément pour éviter les doublons
        if (cord && cords.has(cord)) {
          continue;
        }

        const midi = Note.midi(note)!! % 12; // Assure que Note.midi(note) n'est pas nul
        if (highlightedNotes.value.includes(midi)) {
          const index = highlightedNotes.value.indexOf(midi);

          // Si on tombe sur la première note (index === 0),
          // on considère que c'est un nouveau "chord" qui commence
          if (index === 0) {
            // Si positions contient déjà quelque chose, on le pousse dans notePositions.value
            // avant de repartir sur un nouvel accord
            if (positions.length > 0) {
              notePositions.value.push(positions);
              positions = [];
              cords.clear();
            }
          }

          const rect = element.getBoundingClientRect();
          const position: Position = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            note: midi.toString(),
            isFirst: index === 0,
          };

          // On place la position au bon index, puis on filtre pour supprimer d’éventuels "trous"
          positions[index] = position;
          positions = positions.filter((p) => p);

          // On mémorise le cord si existant
          if (cord) {
            cords.add(cord);
          }
        }
      }

      // Après la boucle, si le dernier groupe (positions) n’a pas encore été poussé, on le fait
      if (positions.length > 0) {
        notePositions.value.push(positions);
      }

    };

    // Observer les mutations du DOM pour mettre à jour les positions quand les notes sont rendues
    const setupMutationObserver = () => {
      const observer = new MutationObserver(() => {
        updateNotePositions();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      return observer;
    };

    onMounted(() => {
      // Mettre en place les écouteurs d'événements
      window.addEventListener('resize', handleResize);

      // Initial update
      updateNotePositions();

      // Observer les changements du DOM
      const observer = setupMutationObserver();

      // Mettre à jour périodiquement au cas où des éléments sont ajoutés dynamiquement
      const intervalId = setInterval(updateNotePositions, 1000);

      // Nettoyer l'intervalle et l'observateur à la destruction du composant
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
        clearInterval(intervalId);
      });
    });
    watch(() => store.chordRootObject, () => {
      updateNotePositions();
    });

    return {
      windowWidth,
      windowHeight,
      notePositions,
      connections,
      highlightedNotes
    };
  }
});
</script>

<style scoped>
.overlay-container {
  position: fixed;
  mix-blend-mode: difference;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
  /* Laisse passer les événements de souris */
}

.overlay-svg {
  position: absolute;
  top: 0;
  left: 0;
}
</style>