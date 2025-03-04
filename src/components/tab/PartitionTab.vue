<!-- PartitionTab.vue - Composant pour créer et jouer des tablatures -->
<template>
    <div class="partition-tab-container">
        <div class="tab-header">
            <h3 class="tab-title">Tablature - Mesure {{ currentMeasure + 1 }}</h3>
            <div class="tuning-info">
                Accordage: {{ tuningDisplay }}
            </div>
        </div>

        <div class="tab-content">
            <!-- Tablature -->
            <div class="tablature">
                <div v-for="(stringTuning, stringIndex) in tuningArray" :key="`string-${stringIndex}`"
                    class="tab-string">
                    <div class="string-label">{{ stringTuning }}</div>
                    <div class="string-content">
                        <div v-for="(column, colIndex) in currentMeasureData[stringIndex]" :key="`col-${colIndex}`"
                            class="tab-column" :class="{ 'active': colIndex === currentPlayingColumn }"
                            @click="editCell(stringIndex, colIndex)">
                            <select v-model="currentMeasureData[stringIndex][colIndex]"
                                @focus="currentEditingCell = { string: stringIndex, column: colIndex }"
                                @blur="currentEditingCell = null" class="fret-select"
                                :ref="(el) => { if (stringIndex === currentEditingCell?.string && colIndex === currentEditingCell?.column) focusElement = el }">
                                <option value="-">-</option>
                                <option value="x">x</option>
                                <option v-for="i in 24" :key="i" :value="i.toString()">{{ i }}</option>
                                <option v-for="i in 12" :key="`${i}h`" :value="`${i}h`">{{ i }}h</option>
                                <option v-for="i in 12" :key="`${i}p`" :value="`${i}p`">{{ i }}p</option>
                                <option v-for="i in 12" :key="`${i}/${i}`" :value="`${i}/${i}`">{{ i }}/{{ i }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-controls">
            <div class="measure-navigation">
                <button class="nav-btn" @click="previousMeasure" :disabled="currentMeasure === 0"
                    title="Mesure précédente">
                    <span class="nav-icon">◀</span>
                </button>

                <div class="measure-indicator">
                    Mesure {{ currentMeasure + 1 }}/{{ measures.length }}
                </div>

                <button class="nav-btn" @click="nextMeasure" title="Mesure suivante">
                    <span class="nav-icon">▶</span>
                </button>

                <button class="add-measure-btn" @click="addMeasure" title="Ajouter une mesure">
                    <span class="nav-icon">+</span>
                </button>

                <button class="delete-measure-btn" @click="deleteMeasure" :disabled="measures.length <= 1"
                    title="Supprimer la mesure actuelle">
                    <span class="delete-icon">-</span>
                </button>
            </div>

            <div class="playback-controls">
                <button class="play-btn" @click="togglePlayback" title="Lire/Pause">
                    <span class="play-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
                </button>

                <button class="stop-btn" @click="stopPlayback" :disabled="!isPlaying && currentPlayingColumn === -1"
                    title="Arrêter">
                    <span class="stop-icon">⏹</span>
                </button>

                <div class="metronome-control">
                    <label class="metronome-label">
                        <input type="checkbox" v-model="metronomeEnabled">
                        Métronome
                    </label>
                </div>

                <div class="tempo-control">
                    <label for="tempo-input">Tempo: {{ tempo }} BPM</label>
                    <input id="tempo-input" type="range" v-model.number="tempo" min="40" max="240" step="4">
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { playNote } from '../../composables/useAudio';
import { Note, Interval } from 'tonal';

export default defineComponent({
    name: 'PartitionTab',
    props: {
        tuning: {
            type: String,
            default: 'E2,A2,D3,G3,B3,E4' // Accordage standard
        },
        initialTempo: {
            type: Number,
            default: 120
        },
        columns: {
            type: Number,
            default: 16 // Nombre de colonnes par mesure
        }
    },
    setup(props) {
        const tuningArray = computed(() => props.tuning.split(',').reverse()); // Inversé pour l'affichage traditionnel
        const tuningDisplay = computed(() => tuningArray.value.slice().reverse().join(' - ')); // Affichage normal

        const tempo = ref(props.initialTempo);
        const isPlaying = ref(false);
        const currentMeasure = ref(0);
        const currentPlayingColumn = ref(-1);
        const currentEditingCell = ref<{ string: number, column: number } | null>(null);
        const focusElement = ref<HTMLElement | null>(null);
        const metronomeEnabled = ref(false);

        // Initialiser une structure pour stocker les mesures
        const measures = ref<string[][][]>([]);

        // Créer une mesure vide
        function createEmptyMeasure() {
            const measure: string[][] = [];
            const stringCount = tuningArray.value.length;

            for (let i = 0; i < stringCount; i++) {
                const row: string[] = [];
                for (let j = 0; j < props.columns; j++) {
                    row.push('-');
                }
                measure.push(row);
            }

            return measure;
        }

        // Initialiser avec une mesure vide
        if (measures.value.length === 0) {
            measures.value.push(createEmptyMeasure());
        }

        // Référence à la mesure courante
        const currentMeasureData = computed(() => {
            if (currentMeasure.value >= measures.value.length) {
                return createEmptyMeasure();
            }
            return measures.value[currentMeasure.value];
        });

        // Ajouter une nouvelle mesure
        function addMeasure() {
            measures.value.push(createEmptyMeasure());
            // Passer automatiquement à la nouvelle mesure
            currentMeasure.value = measures.value.length - 1;
        }

        // Supprimer la mesure actuelle
        function deleteMeasure() {
            if (measures.value.length <= 1) return; // Toujours garder au moins une mesure

            measures.value.splice(currentMeasure.value, 1);

            // Ajuster l'index de la mesure courante si nécessaire
            if (currentMeasure.value >= measures.value.length) {
                currentMeasure.value = measures.value.length - 1;
            }
        }

        // Navigation entre les mesures
        function previousMeasure() {
            if (currentMeasure.value > 0) {
                currentMeasure.value--;
            }
        }

        function nextMeasure() {
            if (currentMeasure.value < measures.value.length - 1) {
                currentMeasure.value++;
            } else {
                // Si on est à la dernière mesure, en ajouter une nouvelle
                addMeasure();
            }
        }

        // Édition d'une cellule
        function editCell(stringIndex: number, columnIndex: number) {
            currentEditingCell.value = { string: stringIndex, column: columnIndex };

            // Attendre que Vue mette à jour le DOM, puis mettre le focus sur l'élément
            nextTick(() => {
                if (focusElement.value) {
                    focusElement.value.focus();
                }
            });
        }

        // Gestion de la lecture
        let playbackInterval: number | null = null;
        // Contexte audio pour le métronome
        let audioContext: AudioContext | null = null;

        function createAudioContext() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            return audioContext;
        }

        function playMetronomeClick(accentuated = false) {
            if (!metronomeEnabled.value) return;

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
            const quarterNoteDuration = 60 / tempo.value;

            // Supposons que chaque colonne représente une croche (1/8 de note)
            return quarterNoteDuration / 2;
        }

        function togglePlayback() {
            if (isPlaying.value) {
                pausePlayback();
            } else {
                startPlayback();
            }
        }

        function startPlayback() {
            if (isPlaying.value) return;

            isPlaying.value = true;

            // Si on était au milieu d'une lecture, on reprend là où on s'était arrêté
            if (currentPlayingColumn.value === -1) {
                currentPlayingColumn.value = 0;
            }

            // Créer le contexte audio si nécessaire
            createAudioContext();

            // Lancer la lecture
            playColumn();
        }

        function pausePlayback() {
            isPlaying.value = false;

            // Arrêter l'intervalle
            if (playbackInterval !== null) {
                window.clearTimeout(playbackInterval);
                playbackInterval = null;
            }
        }

        function stopPlayback() {
            pausePlayback();
            currentPlayingColumn.value = -1;
        }

        async function playColumn() {
            if (!isPlaying.value) return;

            const columnIndex = currentPlayingColumn.value;

            // Jouer un clic de métronome au début de chaque temps
            // Accentuer le premier temps de chaque mesure
            const isFirstBeat = columnIndex === 0 || columnIndex % 4 === 0;
            playMetronomeClick(isFirstBeat);

            // Jouer les notes de la colonne actuelle
            const playPromises = [];

            for (let stringIndex = 0; stringIndex < tuningArray.value.length; stringIndex++) {
                const cellValue = currentMeasureData.value[stringIndex][columnIndex];

                // Si la cellule n'est pas vide et n'est pas un tiret
                if (cellValue && cellValue !== '-') {
                    const stringTuning = tuningArray.value[stringIndex];

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

                        // Jouer la note
                        playPromises.push(playNote(noteToPlay, calculateNoteDuration(), 'sine'));
                    }
                }
            }

            // Attendre que toutes les notes soient jouées
            await Promise.all(playPromises);

            // Passer à la colonne suivante
            currentPlayingColumn.value++;

            // Si on atteint la fin de la mesure
            if (currentPlayingColumn.value >= props.columns) {
                currentPlayingColumn.value = 0;

                // Passer à la mesure suivante si ce n'est pas la dernière
                if (currentMeasure.value < measures.value.length - 1) {
                    currentMeasure.value++;
                } else {
                    // Ou revenir à la première mesure
                    currentMeasure.value = 0;
                }
            }

            // Programmer la lecture de la prochaine colonne
            playbackInterval = window.setTimeout(() => {
                playColumn();
            }, calculateNoteDuration() * 1000);
        }

        // Nettoyer les ressources lors de la destruction du composant
        onBeforeUnmount(() => {
            if (playbackInterval !== null) {
                window.clearTimeout(playbackInterval);
            }

            // Fermer le contexte audio
            if (audioContext) {
                audioContext.close();
            }
        });

        // Surveiller les changements de tempo pour actualiser la lecture
        watch(tempo, () => {
            if (isPlaying.value) {
                // Si on est en train de jouer, on recalcule les intervalles
                pausePlayback();
                startPlayback();
            }
        });

        return {
            tuningArray,
            tuningDisplay,
            tempo,
            isPlaying,
            currentMeasure,
            measures,
            currentMeasureData,
            currentPlayingColumn,
            currentEditingCell,
            focusElement,
            metronomeEnabled,
            previousMeasure,
            nextMeasure,
            addMeasure,
            deleteMeasure,
            editCell,
            togglePlayback,
            stopPlayback
        };
    }
});
</script>

<style scoped lang="scss">
.partition-tab-container {
    max-height: 400px;
    display: flex;
    flex-direction: column;
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: #e0e0e0;

    .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .tab-title {
            margin: 0;
            font-size: 1.2rem;
        }

        .tuning-info {
            font-size: 0.9rem;
            color: #aaa;
            font-family: monospace;
        }
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        background-color: #333;
        border-radius: 4px;
        padding: 10px;
        max-height: 250px;

        .tablature {
            display: flex;
            flex-direction: column;
            gap: 5px;

            .tab-string {
                display: flex;
                align-items: center;
                height: 30px;

                .string-label {
                    width: 40px;
                    text-align: center;
                    font-family: monospace;
                    font-weight: bold;
                }

                .string-content {
                    flex: 1;
                    display: flex;
                    background-color: #1e1e1e;
                    height: 100%;

                    .tab-column {
                        flex: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border-right: 1px solid #444;
                        position: relative;

                        &.active {
                            background-color: rgba(59, 130, 246, 0.3);
                        }

                        .fret-select {
                            width: 100%;
                            height: 100%;
                            appearance: none;
                            background: transparent;
                            border: none;
                            text-align: center;
                            color: #e0e0e0;
                            font-family: monospace;
                            font-size: 1rem;
                            cursor: pointer;
                            padding: 0 2px;

                            &:focus {
                                outline: none;
                                background-color: rgba(59, 130, 246, 0.2);
                            }

                            option {
                                background-color: #333;
                                color: #e0e0e0;
                            }
                        }
                    }
                }
            }
        }
    }

    .tab-controls {
        margin-top: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .measure-navigation,
        .playback-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .nav-btn,
        .play-btn,
        .stop-btn,
        .add-measure-btn,
        .delete-measure-btn {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 36px;
            height: 36px;
            background-color: #444;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover:not(:disabled) {
                background-color: #555;
            }

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

        .delete-measure-btn {
            background-color: #a53a3a;

            &:hover:not(:disabled) {
                background-color: #b54a4a;
            }
        }

        .measure-indicator {
            flex: 1;
            text-align: center;
            font-size: 0.9rem;
            color: #aaa;
        }

        .metronome-control {
            display: flex;
            align-items: center;

            .metronome-label {
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
}

@media (min-width: 768px) {
    .tab-controls {
        flex-direction: row !important;
        justify-content: space-between;

        .measure-navigation,
        .playback-controls {
            flex: 1;
        }

        .tempo-control {
            max-width: 200px;
        }
    }
}
</style>