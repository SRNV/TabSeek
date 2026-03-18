<template>
    <div class="tablature-scroll" ref="scrollContainer" @scroll="onScroll">
        <div class="tablature" @keydown="handleKeydown" tabindex="0" ref="tablatureRef"
            :style="{ minWidth: totalColumns * columnWidth + labelWidth + 'px' }">
            <!-- Ligne de rythme (hampes + ligatures) — drag pour créer des croches -->
            <div class="tab-string rhythm-row" @mouseup="onRhythmMouseup" @mouseleave="onRhythmMouseup">
                <div class="string-label rhythm-label"></div>
                <div class="string-content">
                    <div v-for="gc in totalColumns" :key="`r-${gc - 1}`" class="tab-column rhythm-column"
                        :class="{
                            'measure-start': store.isMeasureStart(gc - 1) && gc - 1 > 0,
                            [`beam-${beamPosition(gc - 1)}`]: beamPosition(gc - 1) !== null,
                            'slow-1': store.flatRhythmValue(gc - 1) === 1,
                            'slow-2': store.flatRhythmValue(gc - 1) === 2,
                            'slow-4': store.flatRhythmValue(gc - 1) === 4,
                            'has-double-beam': store.flatRhythmValue(gc - 1) >= 16,
                            'drag-preview': isInRhythmDrag(gc - 1) && rhythmDragging
                        }" :style="{ width: columnWidth + 'px', minWidth: columnWidth + 'px' }"
                        @mousedown="onRhythmMousedown(gc - 1, $event)"
                        @mouseenter="onRhythmMouseenter(gc - 1)">
                    </div>
                </div>
            </div>

            <!-- Cordes de guitare -->
            <div v-for="(stringTuning, stringIndex) in store.tuningArray" :key="`string-${stringIndex}`"
                class="tab-string">
                <div class="string-label">{{ stringTuning }}</div>
                <div class="string-content">
                    <div v-for="gc in totalColumns" :key="`c-${gc - 1}`" class="tab-column" :class="{
                        'active': gc - 1 === store.currentPlayingColumn,
                        'selected': store.isColumnSelected(gc - 1),
                        'mode-override': store.flatColumnMode(gc - 1),
                        'editing': editingCell?.string === stringIndex && editingCell?.column === gc - 1,
                        'focused': selectedCell?.string === stringIndex && selectedCell?.column === gc - 1 && !editingCell,
                        'out-of-reach': isOutOfReach(stringIndex, gc - 1),
                        'measure-start': store.isMeasureStart(gc - 1) && gc - 1 > 0
                    }" :style="[getColumnStyle(gc - 1), { width: columnWidth + 'px', minWidth: columnWidth + 'px' }]"
                        @click="selectCell(stringIndex, gc - 1, $event)"
                        @dblclick="startEditing(stringIndex, gc - 1)">

                        <div v-if="stringIndex === 0 && store.flatColumnMode(gc - 1)" class="mode-indicator">
                            {{ store.flatColumnMode(gc - 1) }}
                        </div>

                        <span
                            v-if="!(editingCell?.string === stringIndex && editingCell?.column === gc - 1)"
                            class="cell-value" :class="{
                                'has-value': store.flatCellValue(stringIndex, gc - 1) !== '-',
                                'out-of-scale': isOutOfScale(stringIndex, gc - 1)
                            }">
                            {{ store.flatCellValue(stringIndex, gc - 1) === '-' ? '' : store.flatCellValue(stringIndex, gc - 1) }}
                        </span>

                        <input v-else ref="editInput" class="cell-input" :value="editBuffer" @input="onEditInput"
                            @keydown.stop="handleEditKeydown" @blur="commitEdit" maxlength="4" />
                    </div>
                </div>
            </div>

            <!-- Ligne d'index -->
            <div class="tab-string index-row">
                <div class="string-label index-label">Idx</div>
                <div class="string-content">
                    <div v-for="gc in totalColumns" :key="`idx-${gc - 1}`" class="tab-column index-column" :class="{
                        'editing': editingIndex === gc - 1,
                        'index-change': isIndexChange(gc - 1),
                        'out-of-scale': isIndexOutOfScale(gc - 1),
                        'measure-start': store.isMeasureStart(gc - 1) && gc - 1 > 0
                    }" :style="{ width: columnWidth + 'px', minWidth: columnWidth + 'px' }"
                        @click="selectIndexCell(gc - 1)" @dblclick="startEditingIndex(gc - 1)">

                        <span v-if="editingIndex !== gc - 1" class="index-value"
                            :class="{ 'inherited': !isIndexChange(gc - 1) }">
                            {{ isIndexChange(gc - 1) ? store.flatIndexPosition(gc - 1) : '' }}
                        </span>

                        <input v-else ref="indexEditInput" class="cell-input index-input" :value="indexEditBuffer"
                            @input="onIndexEditInput" @keydown.stop="handleIndexEditKeydown"
                            @blur="commitIndexEdit" maxlength="2" />
                    </div>
                </div>
            </div>

            <!-- Ligne de mesure -->
            <div class="tab-string measure-row">
                <div class="string-label measure-label">Mes</div>
                <div class="string-content">
                    <div v-for="gc in totalColumns" :key="`m-${gc - 1}`" class="tab-column measure-column"
                        :class="{ 'measure-start': store.isMeasureStart(gc - 1) }"
                        :style="{ width: columnWidth + 'px', minWidth: columnWidth + 'px' }">
                        <span v-if="store.isMeasureStart(gc - 1)" class="measure-number">
                            {{ store.measureForColumn(gc - 1) + 1 }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useTablatureStore } from '../../stores/tablatureStore';
import { useMainStore } from '../../stores';
import { Note, Interval } from 'tonal';

const store = useTablatureStore();
const mainStore = useMainStore();

const tablatureRef = ref<HTMLElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);
const editInput = ref<HTMLInputElement[] | null>(null);
const indexEditInput = ref<HTMLInputElement[] | null>(null);

const columnWidth = 32;
const labelWidth = 40;

const selectedCell = ref<{ string: number, column: number } | null>(null);
const editingCell = ref<{ string: number, column: number } | null>(null);
const editBuffer = ref('');
const editingIndex = ref<number | null>(null);
const indexEditBuffer = ref('');

const totalColumns = computed(() => store.totalColumns);

// --- Rhythm drag ---
const rhythmDragStart = ref<number | null>(null);
const rhythmDragEnd = ref<number | null>(null);
const rhythmDragging = ref(false);

function rhythmDragRange(): [number, number] | null {
    if (rhythmDragStart.value === null || rhythmDragEnd.value === null) return null;
    return [Math.min(rhythmDragStart.value, rhythmDragEnd.value), Math.max(rhythmDragStart.value, rhythmDragEnd.value)];
}

function isInRhythmDrag(gc: number): boolean {
    const range = rhythmDragRange();
    if (!range) return false;
    return gc >= range[0] && gc <= range[1];
}

function onRhythmMousedown(gc: number, event: MouseEvent) {
    event.preventDefault();
    // Si déjà une croche/double-croche, clic simple = effacer
    if (store.flatRhythmValue(gc) >= 8 && !event.shiftKey) {
        store.flatUpdateRhythmValue(gc, 0);
        return;
    }
    rhythmDragStart.value = gc;
    rhythmDragEnd.value = gc;
    rhythmDragging.value = true;
}

function onRhythmMouseenter(gc: number) {
    if (!rhythmDragging.value) return;
    rhythmDragEnd.value = gc;
}

function onRhythmMouseup() {
    if (!rhythmDragging.value) return;
    const range = rhythmDragRange();
    if (range) {
        const [start, end] = range;
        if (start === end) {
            // Clic sans drag : cycler les rythmes lents (0 → 1 → 2 → 4 → 0)
            const current = store.flatRhythmValue(start);
            const slow = [0, 1, 2, 4];
            const idx = slow.indexOf(current);
            store.flatUpdateRhythmValue(start, slow[(idx + 1) % slow.length]);
        } else {
            // Drag : appliquer croche (8) ou double-croche (16 avec shift)
            const value = 8;
            for (let i = start; i <= end; i++) {
                store.flatUpdateRhythmValue(i, value);
            }
        }
    }
    rhythmDragStart.value = null;
    rhythmDragEnd.value = null;
    rhythmDragging.value = false;
}

// --- Infinite scroll ---
function onScroll() {
    if (!scrollContainer.value) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
    // Quand on approche du bord droit, ajouter une mesure
    if (scrollWidth - scrollLeft - clientWidth < 200) {
        store.addMeasure();
    }
}

// Scroll pour rendre une colonne globale visible
function scrollToColumn(gc: number) {
    if (!scrollContainer.value) return;
    const targetX = gc * columnWidth;
    const { scrollLeft, clientWidth } = scrollContainer.value;
    if (targetX < scrollLeft + labelWidth) {
        scrollContainer.value.scrollLeft = targetX - labelWidth;
    } else if (targetX + columnWidth > scrollLeft + clientWidth) {
        scrollContainer.value.scrollLeft = targetX + columnWidth - clientWidth + 20;
    }
}

// --- Mode colors ---
const modeColors: Record<string, string> = {
    'major': '#3a7ca5', 'minor': '#a53a3a', 'dorian': '#3aa56e',
    'phrygian': '#a53a99', 'lydian': '#a59d3a', 'mixolydian': '#a5623a', 'locrian': '#7a3aa5'
};

function getScaleNotes(globalCol: number): number[] {
    const mode = store.flatColumnMode(globalCol);
    if (mode) {
        const intervals = getModeIntervals(mode);
        if (!intervals) return [];
        const modeNotes = intervals.map(interval => Note.transpose(mainStore.userScale, interval));
        return modeNotes.map(n => { const m = Note.midi(n); return m !== null ? m % 12 : -1; }).filter(m => m !== -1);
    }
    return mainStore.modeNotes.map((n: string) => { const m = Note.midi(n); return m !== null ? m % 12 : -1; }).filter((m: number) => m !== -1);
}

function isOutOfScale(stringIndex: number, gc: number): boolean {
    const cellValue = store.flatCellValue(stringIndex, gc);
    if (!cellValue || cellValue === '-' || cellValue === 'x' || cellValue === 'X') return false;
    const fretMatch = cellValue.match(/^(\d{1,2})/);
    if (!fretMatch) return false;
    const fretNumber = parseInt(fretMatch[1]);
    if (isNaN(fretNumber)) return false;
    const stringTuning = store.tuningArray[stringIndex];
    if (!stringTuning) return false;
    const noteToCheck = Note.transpose(stringTuning, Interval.fromSemitones(fretNumber));
    const midiNote = Note.midi(noteToCheck);
    if (midiNote === null) return false;
    return !getScaleNotes(gc).includes(midiNote % 12);
}

function isIndexOutOfScale(gc: number): boolean {
    const indexPos = store.flatIndexPosition(gc);
    if (indexPos === 0) return false;
    const scaleNotes = getScaleNotes(gc);
    if (scaleNotes.length === 0) return false;
    return store.tuningArray.every(stringTuning => {
        const noteAtFret = Note.transpose(stringTuning, Interval.fromSemitones(indexPos));
        const midi = Note.midi(noteAtFret);
        return midi === null || !scaleNotes.includes(midi % 12);
    });
}

function isOutOfReach(stringIndex: number, gc: number): boolean {
    const cellValue = store.flatCellValue(stringIndex, gc);
    if (!cellValue || cellValue === '-' || cellValue === 'x' || cellValue === 'X') return false;
    const fretMatch = cellValue.match(/^(\d{1,2})/);
    if (!fretMatch) return false;
    const fret = parseInt(fretMatch[1]);
    if (isNaN(fret) || fret === 0) return false;
    const indexPos = store.flatIndexPosition(gc);
    return fret < indexPos || fret > indexPos + 3;
}

// Beam grouping: determine position within a beam group
// Returns 'single' | 'first' | 'middle' | 'last' | null
function beamPosition(gc: number): string | null {
    const rv = store.flatRhythmValue(gc);
    if (rv < 8) return null; // no beam for quarter and slower

    const prevBeamed = gc > 0 && store.flatRhythmValue(gc - 1) >= 8;
    const nextBeamed = gc < store.totalColumns - 1 && store.flatRhythmValue(gc + 1) >= 8;

    if (!prevBeamed && !nextBeamed) return 'single';
    if (!prevBeamed && nextBeamed) return 'first';
    if (prevBeamed && nextBeamed) return 'middle';
    return 'last'; // prevBeamed && !nextBeamed
}

function isIndexChange(gc: number): boolean {
    if (gc === 0) return true;
    // Aussi marquer le début de chaque mesure
    if (store.isMeasureStart(gc)) return true;
    return store.flatIndexPosition(gc) !== store.flatIndexPosition(gc - 1);
}

function getColumnStyle(gc: number) {
    const mode = store.flatColumnMode(gc);
    if (mode && modeColors[mode]) return { backgroundColor: `${modeColors[mode]}88` };
    return {};
}

// --- Cell selection & editing ---
function selectCell(stringIndex: number, gc: number, event: MouseEvent) {
    if (event.shiftKey) {
        store.updateSelection(Math.min(store.selectionStart, gc), Math.max(store.selectionStart, gc));
        return;
    }
    if (event.ctrlKey || event.metaKey) {
        const index = store.selectedColumns.indexOf(gc);
        if (index === -1) { store.selectedColumns.push(gc); } else { store.selectedColumns.splice(index, 1); }
        if (store.selectedColumns.length > 0) {
            store.selectionStart = Math.min(...store.selectedColumns);
            store.selectionEnd = Math.max(...store.selectedColumns);
        }
        return;
    }
    if (selectedCell.value?.string === stringIndex && selectedCell.value?.column === gc) {
        startEditing(stringIndex, gc);
    } else {
        commitEdit();
        selectedCell.value = { string: stringIndex, column: gc };
        store.updateSelection(gc, gc);
        store.setCurrentEditingCell(stringIndex, gc);
        nextTick(() => tablatureRef.value?.focus());
    }
}

function startEditing(stringIndex: number, gc: number) {
    const currentValue = store.flatCellValue(stringIndex, gc);
    editBuffer.value = currentValue === '-' ? '' : currentValue;
    editingCell.value = { string: stringIndex, column: gc };
    nextTick(() => {
        if (editInput.value && editInput.value.length > 0) {
            editInput.value[0].focus();
            editInput.value[0].select();
        }
    });
}

function onEditInput(event: Event) { editBuffer.value = (event.target as HTMLInputElement).value; }

function commitEdit() {
    if (!editingCell.value) return;
    const { string: s, column: gc } = editingCell.value;
    const value = editBuffer.value.trim();
    if (value === '' || value === '-') {
        store.flatUpdateCellValue(s, gc, '-');
    } else if (isValidFretValue(value)) {
        store.flatUpdateCellValue(s, gc, value);
    }
    editingCell.value = null;
    editBuffer.value = '';
}

function isValidFretValue(value: string): boolean {
    if (/^\d{1,2}$/.test(value)) { const num = parseInt(value); return num >= 0 && num <= 24; }
    if (value === 'x' || value === 'X') return true;
    if (/^\d{1,2}h$/.test(value)) return true;
    if (/^\d{1,2}p$/.test(value)) return true;
    if (/^\d{1,2}\/\d{1,2}$/.test(value)) return true;
    return false;
}

// --- Navigation ---
function moveTo(s: number, gc: number) {
    // Auto-extend if needed
    store.ensureColumn(gc);
    selectedCell.value = { string: s, column: gc };
    store.updateSelection(gc, gc);
    store.setCurrentEditingCell(s, gc);
    // Track current measure
    store.currentMeasure = store.measureForColumn(gc);
    nextTick(() => scrollToColumn(gc));
}

function handleKeydown(event: KeyboardEvent) {
    if (editingCell.value) return;
    if (!selectedCell.value) {
        if (/^(Arrow|Enter|[0-9xX])/.test(event.key)) moveTo(0, 0);
        return;
    }
    const { string: s, column: c } = selectedCell.value;
    const maxString = store.tuningArray.length - 1;

    switch (event.key) {
        case 'ArrowUp': event.preventDefault(); if (s > 0) moveTo(s - 1, c); break;
        case 'ArrowDown': event.preventDefault(); if (s < maxString) moveTo(s + 1, c); break;
        case 'ArrowLeft': event.preventDefault(); if (c > 0) moveTo(s, c - 1); break;
        case 'ArrowRight':
            event.preventDefault();
            moveTo(s, c + 1); // infinite: always works, adds measure if needed
            break;
        case 'Delete': case 'Backspace':
            event.preventDefault();
            store.flatUpdateCellValue(s, c, '-');
            break;
        case 'Enter': event.preventDefault(); startEditing(s, c); break;
        default:
            if (/^[0-9xX]$/.test(event.key)) {
                event.preventDefault();
                editBuffer.value = event.key;
                editingCell.value = { string: s, column: c };
                nextTick(() => {
                    if (editInput.value && editInput.value.length > 0) {
                        editInput.value[0].focus();
                        const input = editInput.value[0];
                        input.setSelectionRange(input.value.length, input.value.length);
                    }
                });
            }
            break;
    }
}

function handleEditKeydown(event: KeyboardEvent) {
    if (!selectedCell.value) return;
    const { string: s, column: c } = selectedCell.value;
    switch (event.key) {
        case 'Enter':
            event.preventDefault(); commitEdit(); moveTo(s, c + 1);
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'Escape':
            event.preventDefault(); editingCell.value = null; editBuffer.value = '';
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'Tab':
            event.preventDefault(); commitEdit();
            moveTo(s, c + (event.shiftKey ? -1 : 1));
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'ArrowUp':
            event.preventDefault(); commitEdit(); if (s > 0) moveTo(s - 1, c);
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'ArrowDown':
            event.preventDefault(); commitEdit(); if (s < store.tuningArray.length - 1) moveTo(s + 1, c);
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'ArrowLeft':
            event.preventDefault(); commitEdit(); if (c > 0) moveTo(s, c - 1);
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'ArrowRight':
            event.preventDefault(); commitEdit(); moveTo(s, c + 1);
            nextTick(() => tablatureRef.value?.focus()); break;
        case ' ':
            event.preventDefault(); commitEdit(); moveTo(s, c + 1);
            nextTick(() => tablatureRef.value?.focus()); break;
    }
}

// --- Index row ---
function selectIndexCell(gc: number) { startEditingIndex(gc); }

function startEditingIndex(gc: number) {
    commitEdit();
    indexEditBuffer.value = String(store.flatIndexPosition(gc));
    editingIndex.value = gc;
    nextTick(() => {
        if (indexEditInput.value && indexEditInput.value.length > 0) {
            indexEditInput.value[0].focus();
            indexEditInput.value[0].select();
        }
    });
}

function onIndexEditInput(event: Event) { indexEditBuffer.value = (event.target as HTMLInputElement).value; }

function commitIndexEdit() {
    if (editingIndex.value === null) return;
    const gc = editingIndex.value;
    const value = parseInt(indexEditBuffer.value);
    if (!isNaN(value) && value >= 0 && value <= 24) {
        const oldValue = store.flatIndexPosition(gc);
        store.flatUpdateIndexPosition(gc, value);
        // Propagate forward within same measure
        const measureIdx = store.measureForColumn(gc);
        const measureEnd = (measureIdx + 1) * store.columns;
        for (let i = gc + 1; i < measureEnd; i++) {
            if (store.flatIndexPosition(i) === oldValue) {
                store.flatUpdateIndexPosition(i, value);
            } else { break; }
        }
    }
    editingIndex.value = null;
    indexEditBuffer.value = '';
}

function handleIndexEditKeydown(event: KeyboardEvent) {
    const col = editingIndex.value;
    if (col === null) return;
    switch (event.key) {
        case 'Enter':
            event.preventDefault(); commitIndexEdit();
            if (col + 1 < store.totalColumns) startEditingIndex(col + 1);
            else nextTick(() => tablatureRef.value?.focus());
            break;
        case 'Escape':
            event.preventDefault(); editingIndex.value = null; indexEditBuffer.value = '';
            nextTick(() => tablatureRef.value?.focus()); break;
        case 'Tab':
            event.preventDefault(); commitIndexEdit();
            { const next = col + (event.shiftKey ? -1 : 1);
              if (next >= 0 && next < store.totalColumns) startEditingIndex(next); }
            break;
        case 'ArrowLeft':
            event.preventDefault(); commitIndexEdit(); if (col > 0) startEditingIndex(col - 1); break;
        case 'ArrowRight':
            event.preventDefault(); commitIndexEdit();
            if (col < store.totalColumns - 1) startEditingIndex(col + 1); break;
    }
}

function getModeIntervals(modeName: string) {
    const modes: Record<string, string[]> = {
        'major': ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
        'minor': ["1P", "2M", "3m", "4P", "5P", "6m", "7m"],
        'dorian': ["1P", "2M", "3m", "4P", "5P", "6M", "7m"],
        'phrygian': ["1P", "2m", "3m", "4P", "5P", "6m", "7m"],
        'lydian': ["1P", "2M", "3M", "4A", "5P", "6M", "7M"],
        'mixolydian': ["1P", "2M", "3M", "4P", "5P", "6M", "7m"],
        'locrian': ["1P", "2m", "3m", "4P", "5d", "6m", "7m"]
    };
    return modes[modeName];
}

onMounted(() => { tablatureRef.value?.focus(); });
</script>

<style scoped lang="scss">
.tablature-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;

    &::-webkit-scrollbar {
        height: 8px;
    }
    &::-webkit-scrollbar-track {
        background: #1e1e1e;
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
    }
}

.tablature {
    display: flex;
    flex-direction: column;
    gap: 2px;
    outline: none;

    .tab-string {
        display: flex;
        align-items: center;
        height: 28px;

        .string-label {
            width: 40px;
            min-width: 40px;
            text-align: center;
            font-family: monospace;
            font-weight: bold;
            position: sticky;
            left: 0;
            z-index: 5;
            background-color: #2a2a2a;
        }

        .string-content {
            display: flex;
            background-color: #1e1e1e;
            height: 100%;

            .tab-column {
                display: flex;
                justify-content: center;
                align-items: center;
                border-right: 1px solid #333;
                position: relative;
                cursor: pointer;
                transition: background-color 0.1s;
                flex-shrink: 0;

                &.measure-start {
                    border-left: 2px solid #666;
                }

                &:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                }

                &.active {
                    background-color: rgba(59, 130, 246, 0.3);
                }

                &.selected {
                    background-color: rgba(246, 173, 59, 0.3);
                }

                &.focused {
                    box-shadow: inset 0 0 0 2px #3b82f6;
                }

                &.editing {
                    background-color: rgba(59, 130, 246, 0.25);
                    box-shadow: inset 0 0 0 1px #3b82f6;
                }

                .mode-indicator {
                    position: absolute;
                    top: -18px;
                    left: 0;
                    width: 100%;
                    background-color: inherit;
                    color: white;
                    font-size: 0.6rem;
                    text-align: center;
                    padding: 1px 0;
                    border-radius: 2px 2px 0 0;
                    z-index: 10;
                    text-transform: capitalize;
                }

                .cell-value {
                    font-family: monospace;
                    font-size: 0.9rem;
                    color: #555;
                    user-select: none;

                    &.has-value { color: #e0e0e0; }
                    &.out-of-scale { color: #e05555; }
                }

                &.out-of-reach {
                    box-shadow: inset 0 0 0 2px rgba(255, 165, 0, 0.5);
                }

                .cell-input {
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    text-align: center;
                    color: #e0e0e0;
                    font-family: monospace;
                    font-size: 0.9rem;
                    outline: none;
                    padding: 0;
                    caret-color: #3b82f6;
                }
            }
        }

        // Rhythm row — hampes + ligatures avec groupement
        &.rhythm-row {
            height: 20px;
            margin-bottom: 0;

            .rhythm-label {
                color: #666;
                font-size: 0.6rem;
            }

            .string-content {
                background-color: transparent;

                .rhythm-column {
                    background-color: transparent;
                    border-right: none;
                    cursor: pointer;
                    position: relative;

                    &:hover { background-color: rgba(255, 255, 255, 0.03); }

                    // Drag preview
                    &.drag-preview {
                        background-color: rgba(204, 204, 204, 0.1);
                        &::after {
                            content: '';
                            position: absolute;
                            top: 2px;
                            left: 0;
                            right: 0;
                            height: 2.5px;
                            background-color: rgba(204, 204, 204, 0.4);
                        }
                    }

                    // --- Rythmes lents (pas de ligature) ---
                    // Ronde: trait horizontal court
                    &.slow-1::after {
                        content: '';
                        position: absolute;
                        bottom: 2px;
                        left: 25%;
                        right: 25%;
                        height: 1.5px;
                        background-color: #999;
                    }

                    // Blanche: hampe + cercle ouvert
                    &.slow-2::before {
                        content: '';
                        position: absolute;
                        left: 50%;
                        top: 2px;
                        bottom: 6px;
                        width: 1.5px;
                        background-color: #999;
                        transform: translateX(-50%);
                    }
                    &.slow-2::after {
                        content: '';
                        position: absolute;
                        bottom: 2px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 6px;
                        height: 5px;
                        border: 1.5px solid #999;
                        border-radius: 50%;
                    }

                    // Noire: hampe + point plein
                    &.slow-4::before {
                        content: '';
                        position: absolute;
                        left: 50%;
                        top: 2px;
                        bottom: 6px;
                        width: 1.5px;
                        background-color: #999;
                        transform: translateX(-50%);
                    }
                    &.slow-4::after {
                        content: '';
                        position: absolute;
                        bottom: 2px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 5px;
                        height: 5px;
                        background-color: #999;
                        border-radius: 50%;
                    }

                    // --- Ligatures (croches / doubles-croches) ---
                    // Première du groupe: hampe gauche ┌──
                    &.beam-first::before {
                        content: '';
                        position: absolute;
                        left: 50%;
                        top: 2px;
                        bottom: 0;
                        width: 1.5px;
                        background-color: #ccc;
                        transform: translateX(-50%);
                    }
                    &.beam-first::after {
                        content: '';
                        position: absolute;
                        top: 2px;
                        left: 50%;
                        right: 0;
                        height: 2.5px;
                        background-color: #ccc;
                    }

                    // Milieu du groupe: juste la barre ───
                    &.beam-middle::after {
                        content: '';
                        position: absolute;
                        top: 2px;
                        left: 0;
                        right: 0;
                        height: 2.5px;
                        background-color: #ccc;
                    }

                    // Dernière du groupe: ──┐ hampe droite
                    &.beam-last::before {
                        content: '';
                        position: absolute;
                        left: 50%;
                        top: 2px;
                        bottom: 0;
                        width: 1.5px;
                        background-color: #ccc;
                        transform: translateX(-50%);
                    }
                    &.beam-last::after {
                        content: '';
                        position: absolute;
                        top: 2px;
                        left: 0;
                        right: 50%;
                        height: 2.5px;
                        background-color: #ccc;
                    }

                    // Note isolée: ┌┐ hampe + petite barre
                    &.beam-single::before {
                        content: '';
                        position: absolute;
                        left: 50%;
                        top: 2px;
                        bottom: 0;
                        width: 1.5px;
                        background-color: #ccc;
                        transform: translateX(-50%);
                    }
                    &.beam-single::after {
                        content: '';
                        position: absolute;
                        top: 2px;
                        left: 35%;
                        right: 35%;
                        height: 2.5px;
                        background-color: #ccc;
                    }

                    // Double-croche: 2e ligature via box-shadow
                    &.has-double-beam.beam-first::after {
                        box-shadow: 0 5px 0 0 #ccc;
                    }
                    &.has-double-beam.beam-middle::after {
                        box-shadow: 0 5px 0 0 #ccc;
                    }
                    &.has-double-beam.beam-last::after {
                        box-shadow: 0 5px 0 0 #ccc;
                    }
                    &.has-double-beam.beam-single::after {
                        box-shadow: 0 5px 0 0 #ccc;
                    }
                }
            }
        }

        // Index row
        &.index-row {
            margin-top: 2px;
            height: 22px;
            border-top: 1px solid #444;

            .index-label {
                color: #7a6a3a;
                font-size: 0.7rem;
                font-weight: bold;
            }

            .string-content {
                background-color: #1a1a1a;

                .index-column {
                    background-color: #2a2518;
                    border-right: 1px solid #3a3520;

                    &:hover { background-color: #3a3220; }
                    &.editing { background-color: #4a4228; box-shadow: inset 0 0 0 1px #b8962a; }
                    &.index-change { border-left: 2px solid #b8962a; }
                    &.out-of-scale .index-value { color: #e05555; }

                    .index-value {
                        font-family: monospace;
                        font-size: 0.75rem;
                        color: #b8962a;
                        user-select: none;
                        font-weight: bold;

                        &.inherited { color: transparent; }
                    }

                    .index-input {
                        color: #d4b84a;
                        caret-color: #d4b84a;
                        font-size: 0.75rem;
                    }
                }
            }
        }

        // Measure row
        &.measure-row {
            height: 20px;

            .measure-label {
                color: #5a5a5a;
                font-size: 0.7rem;
                font-weight: bold;
            }

            .string-content {
                background-color: transparent;

                .measure-column {
                    border-right: 1px solid transparent;
                    cursor: default;

                    &.measure-start {
                        border-left: 2px solid #666;
                    }

                    .measure-number {
                        font-family: monospace;
                        font-size: 0.7rem;
                        color: #666;
                        user-select: none;
                    }
                }
            }
        }
    }
}
</style>
