<template>
    <div class="multi-selection-controls">
        <div class="range-slider">
            <input type="range" min="0" :max="store.columns - 1" v-model.number="selectionStartModel"
                @input="updateSelectionStart" class="range-input start-range">

            <input type="range" min="0" :max="store.columns - 1" v-model.number="selectionEndModel"
                @input="updateSelectionEnd" class="range-input end-range">

            <div class="selected-range" :style="{
                left: (Math.min(selectionStartModel, selectionEndModel) / (store.columns - 1) * 100) + '%',
                width: (Math.abs(selectionEndModel - selectionStartModel) / (store.columns - 1) * 100) + '%'
            }"></div>
        </div>

        <div class="selection-actions" v-if="store.hasSelection">
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
                <button @click="store.insertColumnLeft" class="action-btn" title="Insérer une colonne à gauche">
                    <span>◀+</span>
                </button>
                <button @click="store.insertColumnRight" class="action-btn" title="Insérer une colonne à droite">
                    <span>+▶</span>
                </button>
                <button @click="store.clearSelection" class="action-btn" title="Effacer la sélection">
                    <span>×</span>
                </button>
            </div>
        </div>

        <div class="drop-zone" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
            <div class="drop-zone-text">
                Déposez ici une progression d'accords ou de notes
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useTablatureStore } from '../../stores/tablatureStore';

const store = useTablatureStore();

// Modèles pour les sliders de sélection avec synchronisation bidirectionnelle
const selectionStartModel = ref(store.selectionStart);
const selectionEndModel = ref(store.selectionEnd);
const selectedModeOverride = ref('');
const isDragOver = ref(false);

// Initialisation des valeurs du modèle
onMounted(() => {
    selectionStartModel.value = store.selectionStart;
    selectionEndModel.value = store.selectionEnd;
});

// Synchroniser les sliders avec l'état du store
watch(() => store.selectionStart, (newVal) => {
    selectionStartModel.value = newVal;
});

watch(() => store.selectionEnd, (newVal) => {
    selectionEndModel.value = newVal;
});

// Mettre à jour la sélection dans le store quand les sliders changent
function updateSelectionStart() {
    store.updateSelection(selectionStartModel.value, selectionEndModel.value);
}

function updateSelectionEnd() {
    store.updateSelection(selectionStartModel.value, selectionEndModel.value);
}

// Appliquer un override de mode
function applyModeOverride() {
    store.applyModeOverride(selectedModeOverride.value);
    // Réinitialiser la sélection du mode après application
    if (selectedModeOverride.value) {
        setTimeout(() => {
            selectedModeOverride.value = '';
        }, 100);
    }
}

// Gestion des opérations de glisser-déposer
function onDragOver(event: DragEvent) {
    isDragOver.value = true;
    // Vérifier si les données traînées sont compatibles
    if (event.dataTransfer?.types.includes('text/plain')) {
        event.dataTransfer.dropEffect = 'copy';
    }
}

function onDragLeave() {
    isDragOver.value = false;
}

function onDrop(event: DragEvent) {
    isDragOver.value = false;
    const data = event.dataTransfer?.getData('text/plain');
    if (!data) return;

    try {
        // Essayer de parser les données comme JSON
        const progression = JSON.parse(data);

        // Calculer la position de dépôt en fonction de l'emplacement du curseur
        const dropZone = event.currentTarget as HTMLElement;
        const rect = dropZone.getBoundingClientRect();
        const relativeX = event.clientX - rect.left;
        const columnWidth = rect.width / store.columns;
        const columnIndex = Math.floor(relativeX / columnWidth);

        // Utiliser l'action du store pour traiter la progression
        store.dropProgressionAt(progression, columnIndex);
    } catch (e) {
        console.error('Format de progression invalide:', e);
    }
}
</script>

<style scoped lang="scss">
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
            pointer-events: all;
            z-index: 10;

            &::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 20;
                position: relative;
            }

            &::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                border: none;
                z-index: 20;
                position: relative;
            }

            &.start-range {
                top: 70%;

                &::-webkit-slider-thumb {
                    background: #f6ad3b;
                }

                &::-moz-range-thumb {
                    background: #f6ad3b;
                }
            }

            &.end-range {
                &::-webkit-slider-thumb {
                    background: #3b82f6;
                }

                &::-moz-range-thumb {
                    background: #3b82f6;
                }
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
        margin-bottom: 15px;

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

    .drop-zone {
        height: 50px;
        border: 2px dashed #555;
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease;

        &.drag-over {
            border-color: #3b82f6;
            background-color: rgba(59, 130, 246, 0.1);
        }

        .drop-zone-text {
            color: #888;
            font-size: 0.9rem;
        }
    }
}
</style>