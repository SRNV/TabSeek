<!-- TabSVGOverlay.vue -->
<template>
    <div class="overlay-container">
      <svg class="overlay-svg" :width="windowWidth" :height="windowHeight" xmlns="http://www.w3.org/2000/svg">
        <!-- Lignes entre notes -->
        <line 
          v-for="(connection, index) in connections" 
          :key="`line-${index}`" 
          :x1="connection.from.x" 
          :y1="connection.from.y" 
          :x2="connection.to.x" 
          :y2="connection.to.y"
          stroke="orange" 
          stroke-width="4" 
          stroke-opacity="0.7"
        />
        
        <!-- Cercles sur les notes -->
        <circle 
          v-for="(position, index) in notePositions" 
          :key="`circle-${index}`" 
          :cx="position.x" 
          :cy="position.y" 
          r="15" 
          fill="orange" 
          fill-opacity="0.5" 
          stroke="orange" 
          stroke-width="2"
        />
      </svg>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, onUnmounted, computed } from 'vue';
  
  interface Position {
    x: number;
    y: number;
    note: string;
  }
  
  interface Connection {
    from: Position;
    to: Position;
  }
  
  export default defineComponent({
    name: 'TabSVGOverlay',
    setup() {
      const windowWidth = ref(window.innerWidth);
      const windowHeight = ref(window.innerHeight);
      const notePositions = ref<Position[]>([]);
      const highlightedNotes = ref<string[]>(['C4', 'E4', 'G5']); // Liste des notes à mettre en évidence
      
      // Mise à jour des dimensions lors du redimensionnement de la fenêtre
      const handleResize = () => {
        windowWidth.value = window.innerWidth;
        windowHeight.value = window.innerHeight;
        updateNotePositions();
      };
      
      // Calculer les connexions entre les notes
      const connections = computed<Connection[]>(() => {
        const result: Connection[] = [];
        
        // Créer des connexions entre les notes adjacentes dans la liste
        for (let i = 0; i < notePositions.value.length - 1; i++) {
          result.push({
            from: notePositions.value[i],
            to: notePositions.value[i + 1]
          });
        }
        
        return result;
      });
      
      // Mise à jour des positions des notes
      const updateNotePositions = () => {
        const positions: Position[] = [];
        
        // Récupérer tous les éléments .noteItem
        const noteItems = document.querySelectorAll('.noteItem[note]');
        
        // Parcourir chaque élément et vérifier s'il correspond à une note à mettre en évidence
        noteItems.forEach((element) => {
          const note = element.getAttribute('note');
          
          if (note && highlightedNotes.value.includes(note)) {
            const rect = element.getBoundingClientRect();
            
            // Calculer la position centrale de l'élément
            const position: Position = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              note: note
            };
            
            // Filtrer les positions des notes dans l'ordre de la liste highlightedNotes
            const index = highlightedNotes.value.indexOf(note);
            positions[index] = position;
          }
        });
        
        // Éliminer les positions nulles (notes non trouvées dans le DOM)
        notePositions.value = positions.filter(p => p !== undefined);
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
          attributeFilter: ['note', 'class']
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
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    pointer-events: none; /* Laisse passer les événements de souris */
  }
  
  .overlay-svg {
    position: absolute;
    top: 0;
    left: 0;
  }
  </style>