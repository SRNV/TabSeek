<template>
    <div class="playback-controls">
        <button class="play-btn" @click="togglePlayback" title="Lire/Pause">
            <span class="play-icon">{{ store.isPlaying ? '⏸' : '▶' }}</span>
        </button>

        <button class="stop-btn" @click="store.stopPlayback"
            :disabled="!store.isPlaying && store.currentPlayingColumn === -1" title="Arrêter">
            <span class="stop-icon">⏹</span>
        </button>

        <div class="metronome-control">
            <label class="metronome-label">
                <input type="checkbox" v-model="metronomeEnabled">
                Métronome
            </label>
        </div>

        <div class="filter-scale-control">
            <label class="filter-scale-label">
                <input type="checkbox" v-model="filterByScaleEnabled">
                Filtrer par gamme
            </label>
        </div>

        <div class="tempo-control">
            <label for="tempo-input">Tempo: {{ store.tempo }} BPM</label>
            <input id="tempo-input" type="range" v-model.number="tempo" min="40" max="240" step="4">
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { useTablatureStore } from '../../stores/tablatureStore';
import { playNote } from '../../composables/useAudio';
import { Note, Interval } from 'tonal';

const store = useTablatureStore();

// Modèles avec synchronisation bidirectionnelle
const tempo = ref(store.tempo);
const metronomeEnabled = ref(store.metronomeEnabled);
const filterByScaleEnabled = ref(store.filterByScaleEnabled);

// Synchroniser les modèles avec le store
watch(tempo, (newVal) => {
    store.setTempo(newVal);
    if (store.isPlaying) {
        // Recalculer la lecture si le tempo change
        restartPlayback();
    }
});

watch(metronomeEnabled, (newVal) => {
    store.toggleMetronome();
});

watch(filterByScaleEnabled, (newVal) => {
    store.toggleFilterByScale();
});

// Contexte audio pour le métronome
let audioContext: AudioContext | null = null;
let playbackInterval: number | null = null;

function createAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContext;
    } catch (error) {
        console.error('Erreur lors de la création du contexte audio:', error);
        // Créer un contexte factice si la création échoue
        return {
            createOscillator: () => ({
                connect: () => { },
                frequency: { value: 0 },
                start: () => { },
                stop: () => { }
            }),
            createGain: () => ({
                connect: () => { },
                gain: {
                    setValueAtTime: () => { },
                    exponentialRampToValueAtTime: () => { }
                }
            }),
            destination: {},
            currentTime: 0,
            close: () => { }
        } as unknown as AudioContext;
    }
}

function playMetronomeClick(accentuated = false) {
    if (!store.metronomeEnabled) return;

    const context = createAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Réglages pour le son du métronome
    oscillator.type = accentuated ? 'triangle' : 'sine';
    oscillator.frequency.value = accentuated ? 1200 : 800;

    gainNode.gain.setValueAtTime(0.001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
}

function calculateNoteDuration() {
    // Calculer la durée d'une noire en secondes
    const quarterNoteDuration = 60 / store.tempo;

    // Supposons que chaque colonne représente une croche (1/8 de note)
    return quarterNoteDuration / 2;
}

function togglePlayback() {
    if (store.isPlaying) {
        pausePlayback();
    } else {
        startPlayback();
    }
}

function startPlayback() {
    if (store.isPlaying) return;

    store.togglePlayback();
    // Créer le contexte audio si nécessaire
    createAudioContext();
    // Lancer la lecture
    playColumn();
}

function pausePlayback() {
    store.togglePlayback();
    // Arrêter l'intervalle
    if (playbackInterval !== null) {
        window.clearTimeout(playbackInterval);
        playbackInterval = null;
    }
}

function restartPlayback() {
    pausePlayback();
    startPlayback();
}

async function playColumn() {
    if (!store.isPlaying) return;

    const columnIndex = store.currentPlayingColumn;
    const currentMeasureData = store.currentMeasureData;
    const tuningArray = store.tuningArray;

    // Jouer un clic de métronome au début de chaque temps
    // Accentuer le premier temps de chaque mesure
    const isFirstBeat = columnIndex === 0 || columnIndex % 4 === 0;
    playMetronomeClick(isFirstBeat);

    // Jouer les notes de la colonne actuelle
    const playPromises = [];

    for (let stringIndex = 0; stringIndex < tuningArray.length; stringIndex++) {
        const cellValue = currentMeasureData[stringIndex][columnIndex];

        // Si la cellule n'est pas vide et n'est pas un tiret
        if (cellValue && cellValue !== '-') {
            const stringTuning = tuningArray[stringIndex];

            // Gérer les cas spéciaux comme 'x' (corde étouffée)
            if (cellValue === 'x' || cellValue === 'X') {
                // Pour une corde étouffée, on pourrait jouer un son percussif ou ne rien jouer
                continue;
            } else {
                // Gestion des différents types de notes (hammer-on, pull-off, etc.)
                let fretNumber: number;
                let technique = '';

                if (cellValue.includes('h')) {
                    // Hammer-on
                    fretNumber = parseInt(cellValue.replace('h', ''), 10);
                    technique = 'hammer-on';
                } else if (cellValue.includes('p')) {
                    // Pull-off
                    fretNumber = parseInt(cellValue.replace('p', ''), 10);
                    technique = 'pull-off';
                } else if (cellValue.includes('/')) {
                    // Slide
                    fretNumber = parseInt(cellValue.split('/')[0], 10);
                    technique = 'slide';
                } else {
                    // Note normale
                    fretNumber = parseInt(cellValue, 10);
                }

                if (isNaN(fretNumber)) continue;

                // Calculer la note à jouer
                const noteToPlay = Note.transpose(stringTuning, Interval.fromSemitones(fretNumber));

                // Jouer la note avec le type d'oscillateur approprié selon la technique
                let oscillatorType = 'sine';
                if (technique === 'hammer-on' || technique === 'pull-off') {
                    oscillatorType = 'triangle';
                } else if (technique === 'slide') {
                    oscillatorType = 'sawtooth';
                }

                playPromises.push(playNote(noteToPlay, calculateNoteDuration(), oscillatorType));
            }
        }
    }

    // Attendre que toutes les notes soient jouées
    await Promise.all(playPromises);

    // Passer à la colonne suivante
    store.incrementPlayingColumn();

    // Programmer la lecture de la prochaine colonne
    playbackInterval = window.setTimeout(() => {
        playColumn();
    }, calculateNoteDuration() * 1000);
}

// Nettoyer les ressources lors de la destruction du composant
onBeforeUnmount(() => {
    if (playbackInterval !== null) {
        window.clearTimeout(playbackInterval);
        playbackInterval = null;
    }

    // Fermer le contexte audio
    if (audioContext) {
        try {
            audioContext.close();
        } catch (error) {
            console.error('Erreur lors de la fermeture du contexte audio:', error);
        }
        audioContext = null;
    }
});
</script>

<style scoped lang="scss">
.playback-controls {
    display: flex;
    align-items: center;
    gap: 10px;

    .play-btn,
    .stop-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 36px;
        height: 36px;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    .play-btn {
        background-color: #3a7ca5;

        &:hover:not(:disabled) {
            background-color: #4a8cb5;
        }
    }

    .stop-btn {
        background-color: #a53a3a;

        &:hover:not(:disabled) {
            background-color: #b54a4a;
        }
    }

    .metronome-control,
    .filter-scale-control {
        display: flex;
        align-items: center;

        .metronome-label,
        .filter-scale-label {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9rem;
            color: #aaa;
            cursor: pointer;

            input[type="checkbox"] {
                cursor: pointer;
            }
        }
    }

    .tempo-control {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 5px;

        label {
            font-size: 0.9rem;
            color: #aaa;
        }

        input[type="range"] {
            width: 100%;
            -webkit-appearance: none;
            height: 4px;
            background: #555;
            border-radius: 2px;

            &::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3a7ca5;
                cursor: pointer;
            }

            &::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3a7ca5;
                cursor: pointer;
                border: none;
            }
        }
    }
}

@media (min-width: 768px) {
    .tempo-control {
        max-width: 200px;
    }
}
</style>