<!-- Mise à jour de GuitarNote.vue pour mettre à jour chordRootNote lors du clic -->
<template>
  <li :note="displayName" :cord="cord" class="noteItem" :class="{ playing, forChordsDisplay }"
    :style="{ backgroundColor: background }" @click="handleClick">

    <div class="description">
      <div class="position">{{ position }}</div>
      <div class="name">{{ finalName }}</div>
      <div class="degree">{{ degreeLabel }}</div>
    </div>
    <div class="intervals">
      <div v-for="(inter, i) in intervals" :key="i" class="child"
        :style="{ backgroundColor: gtNc(inter, 0, modeIntervals) }" @mouseenter="showIntervalTooltip(inter, $event)"
        @mouseleave="hideTooltip" :title="`${inter}`">___</div>
    </div>
  </li>
</template>

<script lang="ts">
import { Note, Scale } from 'tonal';
import { defineComponent, ref, onMounted, onUnmounted, computed } from 'vue';
import eventBus from '../../eventBus';
import { playNote } from '../../composables/useAudio';
import { getNoteColor } from '../../composables/useNoteHelpers';
import { useMainStore } from '../../stores';


export default defineComponent({
  name: 'GuitarNote',
  props: {
    child: {
      type: Boolean,
      default: false,
    },
    forChordsDisplay: {
      type: Boolean,
      default: false,
    },
    mode: {
      required: false, // Maintenant optionnel, car nous utiliserons le mode global par défaut
      type: String,
    },
    position: {
      type: Number,
      default: 0,
    },
    cord: {
      type: Number,
      default: '',
    },
    displayName: {
      type: String,
      default: '',
    },
    background: {
      type: String,
      default: '#fff',
    },
    degreeLabel: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const order = [3, 5, 7, 2, 4, 6];
    const store = useMainStore();
    const playing = ref(false);

    // Utiliser le mode fourni en prop, sinon utiliser le mode global du store
    const currentMode = computed(() => {
      return `${store.userScale} ${store.selectedMode}`;
    });

    const intervals = computed(() => {
      const m = `${props.displayName} ${store.selectedMode}`;
      const minor = `${props.displayName} minor`;
      const sc = Scale.get(m);
      const value = order.map(Scale.degrees(!sc.empty ? m : minor));
      return value.filter((n) => n.length);
    });

    const modeIntervals = computed(() => {
      const value = order.map(Scale.degrees(currentMode.value));
      return value.filter((n) => n.length);
    });

    const finalName = computed(() => {
      const note = Note.get(props.displayName);
      const isAccidented = Boolean(note.acc?.length);
      return isAccidented
        ? `${props.displayName} ${Note.enharmonic(props.displayName)}`
        : props.displayName;
    });

    function handleClick() {
      const midi = Note.get(props.displayName).midi;
      playNote(props.displayName);
      if (midi != null) {
        eventBus.emit('noteSelected', midi);

        // Mettre à jour également la note fondamentale pour les accords
        store.setChordRootNote(props.displayName);
      }
    }

    function onNotePlayed(midiPlayed: number) {
      const midiThis = Note.get(props.displayName).midi;
      if (midiThis != null && midiPlayed === midiThis) {
        playing.value = true;
        setTimeout(() => {
          playing.value = false;
        }, 700);
      }
    }

    // Nouvelles fonctions pour gérer les tooltips
    function showIntervalTooltip(interval: string, event: MouseEvent) {
      try {
        // Calculer la note correspondant à cet intervalle
        const intervalNote = Note.distance(props.displayName, interval);
        // Créer les données du tooltip
        const tooltipData = {
          title: `${props.displayName} : Degré ${interval} (${intervalNote})`,
          content: `Note: ${intervalNote}`,
          x: event.clientX,
          y: event.clientY
        };

        // Émettre l'événement pour afficher le tooltip
        eventBus.emit('showTooltip', tooltipData);
      } catch (error) {
        console.error("Erreur lors du calcul de la note d'intervalle:", error);
      }
    }

    function hideTooltip() {
      eventBus.emit('hideTooltip');
    }

    const gtNc = getNoteColor;

    onMounted(() => {
      eventBus.on('notePlayed', onNotePlayed);
    });

    onUnmounted(() => {
      eventBus.off('notePlayed', onNotePlayed);
    });

    return {
      order,
      modeIntervals,
      gtNc,
      intervals,
      playing,
      finalName,
      handleClick,
      showIntervalTooltip,
      hideTooltip
    };
  },
});
</script>

<style scoped lang="scss">
.noteItem {
  display: table-cell;
  width: 65px;
  height: 65px;
  border: 1px solid #333;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  list-style-type: none;
  cursor: pointer;
  transition: filter 0.3s ease;

  &:hover {
    filter: brightness(1.2);
    background-color: rgb(0, 255, 251);
  }

  &.playing {
    filter: brightness(2);
    border: 1px solid rgb(27, 239, 232);
    color: rgb(255, 145, 0);
  }
}

.child {
  max-width: 8px;
  max-height: 8px;
  font-size: xx-small;
  border: 1px solid #797979;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.5);
    z-index: 10;
    box-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
  }
}

.description {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.8rem;
}

.name {
  font-weight: bold;
}

.position {
  font-size: 0.7rem;
  color: #888;
}

.degree {
  color: rgb(55, 69, 24);
}

.intervals {
  display: inline-flex;
  position: relative;
  gap: 2px;
  top: -6px;
}
</style>