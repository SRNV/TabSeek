<template>
    <div class="tablature">
        <div v-for="(stringTuning, stringIndex) in store.tuningArray" :key="`string-${stringIndex}`" class="tab-string">
            <div class="string-label">{{ stringTuning }}</div>
            <div class="string-content">
                <div v-for="(column, colIndex) in store.currentMeasureData[stringIndex]" :key="`col-${colIndex}`"
                    class="tab-column" :class="{
                        'active': colIndex === store.currentPlayingColumn,
                        'selected': store.isColumnSelected(colIndex),
                        'mode-override': getColumnModeDisplay(colIndex)
                    }" :style="getColumnStyle(colIndex)" @click="handleColumnClick(stringIndex, colIndex, $event)">

                    <!-- Indicateur de mode overridé -->
                    <div v-if="stringIndex === 0 && getColumnModeDisplay(colIndex)" class="mode-indicator">
                        {{ getColumnModeDisplay(colIndex) }}
                    </div>

                    <select :value="store.currentMeasureData[stringIndex][colIndex]"
                        @change="e => store.updateCellValue(stringIndex, colIndex, e.target.value)"
                        @focus="store.setCurrentEditingCell(stringIndex, colIndex)"
                        @blur="store.clearCurrentEditingCell" class="fret-select"
                        :ref="el => { if (stringIndex === store.currentEditingCell?.string && colIndex === store.currentEditingCell?.column) focusElement = el }">
                        <option value="-">-</option>
                        <option value="x">x</option>
                        <option v-for="fret in filteredFrets(colIndex)" :key="fret.value" :value="fret.value" :style="{
                            display: !fret.inScale && store.filterByScaleEnabled ? 'none' : '',
                            backgroundColor: !fret.inScale && store.filterByScaleEnabled ? '#A53A3A33' : 'black'
                        }">
                            {{ fret.label }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import { useTablatureStore } from '../../stores/tablatureStore';
import { useMainStore } from '../../stores';
import { Note, Interval } from 'tonal';

const store = useTablatureStore();
const mainStore = useMainStore();

const focusElement = ref<HTMLElement | null>(null);

// Référence locale modifiable du tableau de données
// Utilisons directement le store sans ref locale

// Couleurs pour les modes
const modeColors = {
    'major': '#3a7ca5',
    'minor': '#a53a3a',
    'dorian': '#3aa56e',
    'phrygian': '#a53a99',
    'lydian': '#a59d3a',
    'mixolydian': '#a5623a',
    'locrian': '#7a3aa5'
};

// Fonction pour obtenir le style CSS en fonction du mode de la colonne
function getColumnStyle(colIndex: number) {
    const mode = store.getColumnMode(colIndex);
    if (mode && modeColors[mode as keyof typeof modeColors]) {
        return {
            backgroundColor: `${modeColors[mode as keyof typeof modeColors]}88` // Ajout de transparence
        };
    }
    return {};
}

// Fonction pour obtenir le nom du mode à afficher
function getColumnModeDisplay(colIndex: number) {
    return store.getColumnMode(colIndex);
}

// Filtrer les frettes disponibles en fonction du mode actif pour la colonne
function filteredFrets(colIndex: number) {
    const mode = store.getColumnMode(colIndex);
    if (!mode || mode === mainStore.selectedMode) {
        return store.availableFrets;
    }

    // Si un mode override est actif pour cette colonne, filtrer les notes
    // en fonction des notes disponibles dans ce mode
    const modeIntervals = getModeIntervals(mode);
    if (!modeIntervals) return store.availableFrets;

    const modeNotes = modeIntervals.map(interval =>
        Note.transpose(mainStore.userScale, interval)
    );

    const scaleNotesSimple = modeNotes.map(note => {
        const midi = Note.midi(note);
        return midi !== null ? midi % 12 : -1;
    }).filter(midi => midi !== -1);

    return store.availableFrets.map(fret => {
        if (fret.value.includes('h') || fret.value.includes('p') || fret.value.includes('/')) {
            return fret; // Garder les techniques spéciales telles quelles
        }

        const fretNumber = parseInt(fret.value);
        if (isNaN(fretNumber)) return { ...fret, inScale: true };

        // Vérifier si la note est dans le mode overridé
        const inScale = store.tuningArray.some(stringTuning => {
            const noteToCheck = Note.transpose(stringTuning, Interval.fromSemitones(fretNumber));
            const midiNote = Note.midi(noteToCheck);
            return midiNote !== null && scaleNotesSimple.includes(midiNote % 12);
        });

        return { ...fret, inScale };
    });
}

// Gestion des clics sur les colonnes
function handleColumnClick(stringIndex: number, columnIndex: number, event: MouseEvent) {
    if (event.shiftKey) {
        // Sélection étendue
        const start = Math.min(store.selectionStart, columnIndex);
        const end = Math.max(store.selectionStart, columnIndex);
        store.updateSelection(start, end);
    } else if (event.ctrlKey || event.metaKey) {
        // Ajouter/supprimer de la sélection
        const index = store.selectedColumns.indexOf(columnIndex);
        if (index === -1) {
            store.selectedColumns.push(columnIndex);
            if (store.selectedColumns.length === 1) {
                store.selectionStart = columnIndex;
                store.selectionEnd = columnIndex;
            } else {
                store.selectionStart = Math.min(...store.selectedColumns);
                store.selectionEnd = Math.max(...store.selectedColumns);
            }
        } else {
            store.selectedColumns.splice(index, 1);
            if (store.selectedColumns.length > 0) {
                store.selectionStart = Math.min(...store.selectedColumns);
                store.selectionEnd = Math.max(...store.selectedColumns);
            }
        }
    } else {
        // Sélection simple ou édition
        if (store.selectedColumns.length === 1 && store.selectedColumns[0] === columnIndex) {
            // Si déjà sélectionné, passer en mode édition
            store.setCurrentEditingCell(stringIndex, columnIndex);
            nextTick(() => {
                if (focusElement.value) {
                    focusElement.value.focus();
                }
            });
        } else {
            // Sélection simple
            store.updateSelection(columnIndex, columnIndex);
        }
    }
}

// Fonction helper pour obtenir les intervalles d'un mode
function getModeIntervals(modeName: string) {
    const modes = {
        'major': ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
        'minor': ["1P", "2M", "3m", "4P", "5P", "6m", "7m"],
        'dorian': ["1P", "2M", "3m", "4P", "5P", "6M", "7m"],
        'phrygian': ["1P", "2m", "3m", "4P", "5P", "6m", "7m"],
        'lydian': ["1P", "2M", "3M", "4A", "5P", "6M", "7M"],
        'mixolydian': ["1P", "2M", "3M", "4P", "5P", "6M", "7m"],
        'locrian': ["1P", "2m", "3m", "4P", "5d", "6m", "7m"]
    };

    return modes[modeName as keyof typeof modes];
}
</script>

<style scoped lang="scss">
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

                &.mode-override {
                    // Le style spécifique est appliqué dynamiquement via getColumnStyle
                }

                .mode-indicator {
                    position: absolute;
                    top: -20px;
                    left: 0;
                    width: 100%;
                    background-color: inherit;
                    color: white;
                    font-size: 0.7rem;
                    text-align: center;
                    padding: 2px 0;
                    border-radius: 2px 2px 0 0;
                    z-index: 10;
                    text-transform: capitalize;
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
</style>