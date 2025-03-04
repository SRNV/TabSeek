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
                            class="tab-column" :class="{
                                'active': colIndex === currentPlayingColumn,
                                'selected': isColumnSelected(colIndex)
                            }" @click="handleColumnClick(stringIndex, colIndex, $event)">
                            <select v-model="currentMeasureData[stringIndex][colIndex]"
                                @focus="currentEditingCell = { string: stringIndex, column: colIndex }"
                                @blur="currentEditingCell = null" class="fret-select"
                                :ref="(el) => { if (stringIndex === currentEditingCell?.string && colIndex === currentEditingCell?.column) focusElement = el }">
                                <option value="-">-</option>
                                <option value="x">x</option>
                                <option v-for="fret in availableFrets" :key="fret.value" :value="fret.value"
                                    :style="{ display: !fret.inScale && filterByScaleEnabled ? 'none' : '', backgroundColor: !fret.inScale && filterByScaleEnabled ? '#A53A3A33' : 'black' }">
                                    {{ fret.label }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sélection multi-colonnes et mode override -->
            <div class="multi-selection-controls">
                <div class="range-slider">
                    <input type="range" min="0" :max="columns - 1" v-model.number="selectionStart"
                        @input="updateSelection" class="range-input">
                    <div class="selected-range" :style="{
                        left: (selectionStart / (columns - 1) * 100) + '%',
                        width: (selectionWidth / (columns - 1) * 100) + '%'
                    }">
                    </div>
                </div>

                <div class="selection-actions" v-if="hasSelection">
                    <div class="mode-override">
                        <label>Mode Override:</label>
                        <select v-model="selectedModeOverride" @change="applyModeOverride">
                            <option value="">Aucun override</option>
                            <option value="major">Major</option>
                            <option value="minor">Minor</option>
                            <option value="dorian">Dorian</option>
                            <option value="phrygian">Phrygian</option>
                            <option value="lydian">Lydian</option>
                            <option value="mixolydian">Mixolydian</option>
                            <option value="locrian">Locrian</option>
                        </select>
                    </div>

                    <div class="column-actions">
                        <button @click="insertColumnLeft" class="action-btn" title="Insérer une colonne à gauche">
                            <span>◀+</span>
                        </button>
                        <button @click="insertColumnRight" class="action-btn" title="Insérer une colonne à droite">
                            <span>+▶</span>
                        </button>
                        <button @click="clearSelection" class="action-btn" title="Effacer la sélection">
                            <span>×</span>
                        </button>
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

                <div class="filter-scale-control">
                    <label class="filter-scale-label">
                        <input type="checkbox" v-model="filterByScaleEnabled">
                        Filtrer par gamme
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
import { defineComponent, ref, computed, watch, onBeforeUnmount, nextTick, PropType } from 'vue';
import { playNote } from '../../composables/useAudio';
import { Note, Interval } from 'tonal';
import { useMainStore } from '../../stores';

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
            default: 8 * 4 // Nombre de colonnes par mesure
        }
    },
    setup(props) {
        const store = useMainStore();
        const tuningArray = computed(() => props.tuning.split(',').reverse()); // Inversé pour l'affichage traditionnel
        const tuningDisplay = computed(() => tuningArray.value.slice().reverse().join(' - ')); // Affichage normal

        const tempo = ref(props.initialTempo);
        const isPlaying = ref(false);
        const currentMeasure = ref(0);
        const currentPlayingColumn = ref(-1);
        const currentEditingCell = ref<{ string: number, column: number } | null>(null);
        const focusElement = ref<HTMLElement | null>(null);
        const metronomeEnabled = ref(false);
        const filterByScaleEnabled = ref(true);

        // Sélection multi-colonnes
        const selectionStart = ref(0);
        const selectionEnd = ref(0);
        const selectedColumns = ref<number[]>([]);
        const selectedModeOverride = ref('');
        const modeOverrides = ref<Record<string, { measureIdx: number, columnIdx: number, mode: string }[]>>({});

        const selectionWidth = computed(() => {
            return selectionEnd.value - selectionStart.value;
        });

        const hasSelection = computed(() => {
            return selectedColumns.value.length > 0;
        });

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

        // Récupérer les frettes disponibles en fonction de la gamme actuelle
        const availableFrets = computed(() => {
            const frets = [];
            const values = new Set();
            const { modeNotes } = store;

            // Format pour la comparaison : convertir en MIDI modulo 12 pour comparer les classes de hauteur
            const scaleNotesSimple = modeNotes.map(note => {
                const midi = Note.midi(note);
                return midi !== null ? midi % 12 : -1;
            }).filter(midi => midi !== -1);

            console.log(modeNotes, scaleNotesSimple)
            // Ajouter les frettes standards (1-24)
            for (let stringIdx = 0; stringIdx < tuningArray.value.length; stringIdx++) {
                for (let i = 1; i <= 24; i++) {
                    // Vérifier pour chaque corde si cette frette produit une note dans la gamme
                    const stringTuning = tuningArray.value[stringIdx];

                    if (!values.has(i)) {
                        frets.push({
                            value: i.toString(),
                            label: i.toString(),
                            inScale: isNoteInScale(stringTuning, i)
                        });
                        values.add(i)
                    }
                }
            }

            // Ajouter les techniques spéciales (hammer-on, pull-off, slides)
            for (let i = 1; i <= 12; i++) {
                // Hammer-on
                frets.push({
                    value: `${i}h`,
                    label: `${i}h`,
                    inScale: true
                });

                // Pull-off
                frets.push({
                    value: `${i}p`,
                    label: `${i}p`,
                    inScale: true
                });

                // Slide
                frets.push({
                    value: `${i}/${i}`,
                    label: `${i}/${i}`,
                    inScale: true
                });
            }

            return frets;

            // Fonction pour vérifier si une note à une frette spécifique sur une corde est dans la gamme
            function isNoteInScale(stringTuning: string, fret: number): boolean {
                const noteToCheck = Note.transpose(stringTuning, Interval.fromSemitones(fret));
                const midiNote = Note.midi(noteToCheck);

                if (midiNote === null) return false;

                console.log(stringTuning, scaleNotesSimple.includes(midiNote % 12));
                // Comparer la classe de hauteur (note sans octave)
                return scaleNotesSimple.includes(midiNote % 12);
            }
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
            clearSelection();
        }

        function nextMeasure() {
            if (currentMeasure.value < measures.value.length - 1) {
                currentMeasure.value++;
            } else {
                // Si on est à la dernière mesure, en ajouter une nouvelle
                addMeasure();
            }
            clearSelection();
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

        // Gestion des sélections multiples
        function handleColumnClick(stringIndex: number, columnIndex: number, event: MouseEvent) {
            if (event.shiftKey) {
                // Sélection étendue
                const start = Math.min(selectionStart.value, columnIndex);
                const end = Math.max(selectionStart.value, columnIndex);

                selectedColumns.value = [];
                for (let i = start; i <= end; i++) {
                    selectedColumns.value.push(i);
                }

                selectionStart.value = start;
                selectionEnd.value = end;
            } else if (event.ctrlKey || event.metaKey) {
                // Ajouter/supprimer de la sélection
                const index = selectedColumns.value.indexOf(columnIndex);
                if (index === -1) {
                    selectedColumns.value.push(columnIndex);
                } else {
                    selectedColumns.value.splice(index, 1);
                }

                // Mettre à jour les bornes de sélection
                if (selectedColumns.value.length > 0) {
                    selectionStart.value = Math.min(...selectedColumns.value);
                    selectionEnd.value = Math.max(...selectedColumns.value);
                }
            } else {
                // Sélection simple ou édition
                if (selectedColumns.value.length === 1 && selectedColumns.value[0] === columnIndex) {
                    // Si déjà sélectionné, passer en mode édition
                    editCell(stringIndex, columnIndex);
                } else {
                    // Sélection simple
                    selectedColumns.value = [columnIndex];
                    selectionStart.value = columnIndex;
                    selectionEnd.value = columnIndex;
                }
            }
        }

        function updateSelection() {
            selectionEnd.value = selectionStart.value;
            selectedColumns.value = [selectionStart.value];
        }

        function clearSelection() {
            selectedColumns.value = [];
            selectedModeOverride.value = '';
        }

        function isColumnSelected(columnIndex: number) {
            return selectedColumns.value.includes(columnIndex);
        }

        // Gestion des overrides de mode
        function applyModeOverride() {
            if (!selectedModeOverride.value || selectedColumns.value.length === 0) return;

            const measureKey = `measure-${currentMeasure.value}`;
            if (!modeOverrides.value[measureKey]) {
                modeOverrides.value[measureKey] = [];
            }

            // Supprimer les overrides existants pour les colonnes sélectionnées
            modeOverrides.value[measureKey] = modeOverrides.value[measureKey].filter(
                override => !selectedColumns.value.includes(override.columnIdx)
            );

            // Ajouter les nouveaux overrides
            for (const columnIdx of selectedColumns.value) {
                modeOverrides.value[measureKey].push({
                    measureIdx: currentMeasure.value,
                    columnIdx,
                    mode: selectedModeOverride.value
                });
            }
        }

        // Insertion de colonnes
        function insertColumnLeft() {
            if (selectedColumns.value.length === 0) return;

            const insertIndex = Math.min(...selectedColumns.value);
            insertColumnAt(insertIndex);
        }

        function insertColumnRight() {
            if (selectedColumns.value.length === 0) return;

            const insertIndex = Math.max(...selectedColumns.value) + 1;
            insertColumnAt(insertIndex);
        }

        function insertColumnAt(index: number) {
            // Insérer une colonne vide à la position spécifiée
            for (let i = 0; i < tuningArray.value.length; i++) {
                currentMeasureData.value[i].splice(index, 0, '-');

                // Si la mesure dépasse le nombre de colonnes, supprimer la dernière
                if (currentMeasureData.value[i].length > props.columns) {
                    currentMeasureData.value[i].pop();
                }
            }

            // Mettre à jour les overrides
            const measureKey = `measure-${currentMeasure.value}`;
            if (modeOverrides.value[measureKey]) {
                modeOverrides.value[measureKey] = modeOverrides.value[measureKey].map(override => {
                    if (override.columnIdx >= index) {
                        return { ...override, columnIdx: override.columnIdx + 1 };
                    }
                    return override;
                });
            }

            // Mettre à jour la sélection
            clearSelection();
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
            filterByScaleEnabled,
            availableFrets,
            previousMeasure,
            nextMeasure,
            addMeasure,
            deleteMeasure,
            editCell,
            togglePlayback,
            stopPlayback,
            selectionStart,
            selectionEnd,
            selectionWidth,
            selectedColumns,
            selectedModeOverride,
            hasSelection,
            handleColumnClick,
            updateSelection,
            clearSelection,
            isColumnSelected,
            applyModeOverride,
            insertColumnLeft,
            insertColumnRight
        };
    }
});
</script>

<style scoped lang="scss">
.partition-tab-container {
    max-height: 500px; // Augmenté pour accommoder les nouvelles fonctionnalités
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
        max-height: 350px; // Augmenté pour accommoder le slider

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

                        &.selected {
                            background-color: rgba(246, 173, 59, 0.3);
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

        .multi-selection-controls {
            margin-top: 20px;
            padding: 10px;
            background-color: #1e1e1e;
            border-radius: 4px;

            .range-slider {
                width: 100%;
                position: relative;
                height: 20px;
                margin-bottom: 15px;

                .range-input {
                    width: 100%;
                    -webkit-appearance: none;
                    height: 4px;
                    background: #555;
                    border-radius: 2px;
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);

                    &::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: #f6ad3b;
                        cursor: pointer;
                        z-index: 10;
                        position: relative;
                    }

                    &::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: #f6ad3b;
                        cursor: pointer;
                        border: none;
                        z-index: 10;
                        position: relative;
                    }
                }

                .selected-range {
                    position: absolute;
                    height: 6px;
                    background-color: rgba(246, 173, 59, 0.5);
                    top: 50%;
                    transform: translateY(-50%);
                    border-radius: 3px;
                    pointer-events: none;
                }
            }

            .selection-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;

                .mode-override {
                    display: flex;
                    align-items: center;
                    gap: 5px;

                    label {
                        font-size: 0.9rem;
                        color: #aaa;
                    }

                    select {
                        background-color: #444;
                        color: #e0e0e0;
                        border: none;
                        padding: 5px;
                        border-radius: 4px;
                        font-size: 0.9rem;

                        &:focus {
                            outline: none;
                            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
                        }

                        option {
                            background-color: #333;
                            color: #e0e0e0;
                        }
                    }
                }

                .column-actions {
                    display: flex;
                    gap: 5px;

                    .action-btn {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 32px;
                        height: 32px;
                        background-color: #444;
                        color: #fff;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.2s;

                        &:hover {
                            background-color: #555;
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