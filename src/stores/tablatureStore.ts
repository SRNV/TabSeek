import { defineStore } from 'pinia';
import { Note, Interval } from 'tonal';
import { useMainStore } from './index';

export interface ColumnOverride {
  measureIdx: number;
  columnIdx: number;
  mode: string;
}

export interface TabMeasure {
  data: string[][];
  modeOverrides: ColumnOverride[];
  indexPositions: number[];
  rhythmValues: number[];
}

// Rhythm subdivision values: 0=none(default), 1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth
export const RHYTHM_OPTIONS = [0, 1, 2, 4, 8, 16] as const;

export const useTablatureStore = defineStore('tablature', {
  state: () => ({
    measures: [] as TabMeasure[],
    currentMeasure: 0,
    currentPlayingColumn: -1,
    currentEditingCell: null as { string: number, column: number } | null,
    isPlaying: false,
    tempo: 120,
    metronomeEnabled: false,
    filterByScaleEnabled: true,
    tuning: 'E2,A2,D3,G3,C3,E4',
    columns: 8 * 4,
    selectedColumns: [] as number[],
    selectionStart: 0,
    selectionEnd: 0,
  }),

  getters: {
    tuningArray: (state) => state.tuning.split(',').reverse(),
    tuningDisplay: (state) => state.tuning.split(',').join(' - '),
    currentMeasureData: (state) => {
      if (state.currentMeasure >= state.measures.length) {
        return createEmptyMeasure(state.tuning.split(',').length, state.columns);
      }
      return state.measures[state.currentMeasure].data;
    },
    currentMeasureOverrides: (state) => {
      if (state.currentMeasure >= state.measures.length) {
        return [];
      }
      return state.measures[state.currentMeasure].modeOverrides;
    },
    currentIndexPositions: (state) => {
      if (state.currentMeasure >= state.measures.length) {
        return createDefaultIndexPositions(state.columns);
      }
      return state.measures[state.currentMeasure].indexPositions;
    },
    // Total columns across all measures
    totalColumns: (state) => state.measures.length * state.columns,
    // Flat view: get cell value at global column index
    flatCellValue: (state) => (stringIndex: number, globalCol: number): string => {
      const measureIdx = Math.floor(globalCol / state.columns);
      const localCol = globalCol % state.columns;
      if (measureIdx >= state.measures.length) return '-';
      return state.measures[measureIdx]?.data[stringIndex]?.[localCol] ?? '-';
    },
    // Flat index positions across all measures
    flatIndexPosition: (state) => (globalCol: number): number => {
      const measureIdx = Math.floor(globalCol / state.columns);
      const localCol = globalCol % state.columns;
      if (measureIdx >= state.measures.length) return 1;
      return state.measures[measureIdx]?.indexPositions[localCol] ?? 1;
    },
    // Get column mode for a global column
    flatColumnMode: (state) => (globalCol: number): string | null => {
      const measureIdx = Math.floor(globalCol / state.columns);
      const localCol = globalCol % state.columns;
      const overrides = state.measures[measureIdx]?.modeOverrides || [];
      const override = overrides.find(o => o.columnIdx === localCol);
      return override ? override.mode : null;
    },
    // Flat rhythm value across all measures
    flatRhythmValue: (state) => (globalCol: number): number => {
      const measureIdx = Math.floor(globalCol / state.columns);
      const localCol = globalCol % state.columns;
      if (measureIdx >= state.measures.length) return 0;
      return state.measures[measureIdx]?.rhythmValues[localCol] ?? 0;
    },
    // Get measure index for a global column
    measureForColumn: (state) => (globalCol: number): number => {
      return Math.floor(globalCol / state.columns);
    },
    // Is this global column the first in its measure?
    isMeasureStart: (state) => (globalCol: number): boolean => {
      return globalCol % state.columns === 0;
    },
    hasSelection: (state) => state.selectedColumns.length > 0,
    selectionWidth: (state) => state.selectionEnd - state.selectionStart,
    availableFrets: (state) => {
      const mainStore = useMainStore();
      const tuningArray = state.tuning.split(',').reverse();
      const frets = [];
      const values = new Set();
      const { modeNotes } = mainStore;

      // Format pour la comparaison : convertir en MIDI modulo 12 pour comparer les classes de hauteur
      const scaleNotesSimple = modeNotes.map(note => {
        const midi = Note.midi(note);
        return midi !== null ? midi % 12 : -1;
      }).filter(midi => midi !== -1);

      // Ajouter les frettes standards (0-24, 0 = corde à vide)
      for (let stringIdx = 0; stringIdx < tuningArray.length; stringIdx++) {
        for (let i = 0; i <= 24; i++) {
          // Vérifier pour chaque corde si cette frette produit une note dans la gamme
          const stringTuning = tuningArray[stringIdx];

          if (!values.has(i)) {
            frets.push({
              value: i.toString(),
              label: i.toString(),
              inScale: isNoteInScale(stringTuning, i, scaleNotesSimple)
            });
            values.add(i);
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
          value: `${i}/${i+1}`,
          label: `${i}/${i+1}`,
          inScale: true
        });
      }

      return frets;

      // Fonction pour vérifier si une note à une frette spécifique sur une corde est dans la gamme
      function isNoteInScale(stringTuning: string, fret: number, scaleNotesSimple: number[]): boolean {
        const noteToCheck = Note.transpose(stringTuning, Interval.fromSemitones(fret));
        const midiNote = Note.midi(noteToCheck);

        if (midiNote === null) return false;

        // Comparer la classe de hauteur (note sans octave)
        return scaleNotesSimple.includes(midiNote % 12);
      }
    },
    getColumnMode: (state) => (columnIdx: number) => {
      const overrides = state.measures[state.currentMeasure]?.modeOverrides || [];
      const override = overrides.find(o => o.columnIdx === columnIdx);
      return override ? override.mode : null;
    },
    isColumnSelected: (state) => (columnIdx: number) => {
      return state.selectedColumns.includes(columnIdx);
    }
  },

  actions: {
    initializeMeasures() {
      if (this.measures.length === 0) {
        for (let i = 0; i < 4; i++) {
          this.measures.push({
            data: createEmptyMeasure(this.tuning.split(',').length, this.columns),
            modeOverrides: [],
            indexPositions: createDefaultIndexPositions(this.columns),
            rhythmValues: createDefaultRhythmValues(this.columns)
          });
        }
      }
    },
    setTempo(newTempo: number) {
      this.tempo = newTempo;
    },
    setTuning(newTuning: string) {
      this.tuning = newTuning;
    },
    toggleMetronome() {
      this.metronomeEnabled = !this.metronomeEnabled;
    },
    setMetronomeEnabled(value: boolean) {
      this.metronomeEnabled = value;
    },
    toggleFilterByScale() {
      this.filterByScaleEnabled = !this.filterByScaleEnabled;
    },
    setFilterByScaleEnabled(value: boolean) {
      this.filterByScaleEnabled = value;
    },
    setCurrentMeasure(measureIdx: number) {
      if (measureIdx >= 0 && measureIdx < this.measures.length) {
        this.currentMeasure = measureIdx;
      }
    },
    addMeasure() {
      const emptyMeasure = createEmptyMeasure(this.tuning.split(',').length, this.columns);
      this.measures.push({
        data: emptyMeasure,
        modeOverrides: [],
        indexPositions: createDefaultIndexPositions(this.columns),
        rhythmValues: createDefaultRhythmValues(this.columns)
      });
      this.currentMeasure = this.measures.length - 1;
    },
    deleteMeasure() {
      if (this.measures.length <= 1) return;

      this.measures.splice(this.currentMeasure, 1);
      if (this.currentMeasure >= this.measures.length) {
        this.currentMeasure = this.measures.length - 1;
      }
    },
    previousMeasure() {
      if (this.currentMeasure > 0) {
        this.currentMeasure--;
      }
      this.clearSelection();
    },
    nextMeasure() {
      if (this.currentMeasure < this.measures.length - 1) {
        this.currentMeasure++;
      } else {
        this.addMeasure();
      }
      this.clearSelection();
    },
    setCurrentEditingCell(stringIndex: number, columnIndex: number) {
      this.currentEditingCell = { string: stringIndex, column: columnIndex };
    },
    clearCurrentEditingCell() {
      this.currentEditingCell = null;
    },
    updateIndexPosition(columnIndex: number, value: number) {
      if (this.measures[this.currentMeasure] && value >= 0 && value <= 24) {
        this.measures[this.currentMeasure].indexPositions[columnIndex] = value;
      }
    },
    updateCellValue(stringIndex: number, columnIndex: number, value: string) {
      if (this.measures[this.currentMeasure]) {
        this.measures[this.currentMeasure].data[stringIndex][columnIndex] = value;
      }
    },
    // Flat actions operating on global column indices
    flatUpdateCellValue(stringIndex: number, globalCol: number, value: string) {
      const measureIdx = Math.floor(globalCol / this.columns);
      const localCol = globalCol % this.columns;
      if (this.measures[measureIdx]) {
        this.measures[measureIdx].data[stringIndex][localCol] = value;
      }
    },
    flatUpdateIndexPosition(globalCol: number, value: number) {
      const measureIdx = Math.floor(globalCol / this.columns);
      const localCol = globalCol % this.columns;
      if (this.measures[measureIdx] && value >= 0 && value <= 24) {
        this.measures[measureIdx].indexPositions[localCol] = value;
      }
    },
    flatUpdateRhythmValue(globalCol: number, value: number) {
      const measureIdx = Math.floor(globalCol / this.columns);
      const localCol = globalCol % this.columns;
      if (this.measures[measureIdx]) {
        this.measures[measureIdx].rhythmValues[localCol] = value;
      }
    },
    cycleRhythmValue(globalCol: number) {
      const current = this.flatRhythmValue(globalCol);
      const options = [0, 1, 2, 4, 8, 16];
      const idx = options.indexOf(current);
      const next = options[(idx + 1) % options.length];
      this.flatUpdateRhythmValue(globalCol, next);
    },
    // Ensure a global column exists by adding measures as needed
    ensureColumn(globalCol: number) {
      const neededMeasures = Math.floor(globalCol / this.columns) + 1;
      while (this.measures.length < neededMeasures) {
        this.measures.push({
          data: createEmptyMeasure(this.tuning.split(',').length, this.columns),
          modeOverrides: [],
          indexPositions: createDefaultIndexPositions(this.columns),
          rhythmValues: createDefaultRhythmValues(this.columns)
        });
      }
    },
    togglePlayback() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying && this.currentPlayingColumn === -1) {
        this.currentPlayingColumn = 0;
      }
    },
    stopPlayback() {
      this.isPlaying = false;
      this.currentPlayingColumn = -1;
    },
    setCurrentPlayingColumn(columnIdx: number) {
      this.currentPlayingColumn = columnIdx;
    },
    incrementPlayingColumn() {
      this.currentPlayingColumn++;
      
      if (this.currentPlayingColumn >= this.columns) {
        this.currentPlayingColumn = 0;
        
        if (this.currentMeasure < this.measures.length - 1) {
          this.currentMeasure++;
        } else {
          this.currentMeasure = 0;
        }
      }
    },
    updateSelection(start: number, end: number) {
      this.selectionStart = start;
      this.selectionEnd = end;
      this.selectedColumns = [];
      
      for (let i = start; i <= end; i++) {
        this.selectedColumns.push(i);
      }
    },
    clearSelection() {
      this.selectedColumns = [];
      this.selectionStart = 0;
      this.selectionEnd = 0;
    },
    applyModeOverride(mode: string) {
      if (this.selectedColumns.length === 0) return;
      if (!this.measures[this.currentMeasure]) return;

      // Supprimer les overrides existants pour les colonnes sélectionnées
      this.measures[this.currentMeasure].modeOverrides =
        this.measures[this.currentMeasure].modeOverrides.filter(
          override => !this.selectedColumns.includes(override.columnIdx)
        );

      // Ajouter les nouveaux overrides seulement si un mode est spécifié
      if (mode) {
        for (const columnIdx of this.selectedColumns) {
          this.measures[this.currentMeasure].modeOverrides.push({
            measureIdx: this.currentMeasure,
            columnIdx,
            mode
          });
        }
      }
    },
    insertColumnAt(index: number) {
      if (!this.measures[this.currentMeasure]) return;
      
      // Insérer une colonne vide à la position spécifiée
      for (let i = 0; i < this.tuning.split(',').length; i++) {
        this.measures[this.currentMeasure].data[i].splice(index, 0, '-');

        // Si la mesure dépasse le nombre de colonnes, supprimer la dernière
        if (this.measures[this.currentMeasure].data[i].length > this.columns) {
          this.measures[this.currentMeasure].data[i].pop();
        }
      }

      // Mettre à jour les overrides
      this.measures[this.currentMeasure].modeOverrides = 
        this.measures[this.currentMeasure].modeOverrides.map(override => {
          if (override.columnIdx >= index) {
            return { ...override, columnIdx: override.columnIdx + 1 };
          }
          return override;
        });

      // Mettre à jour la sélection
      this.clearSelection();
    },
    insertColumnLeft() {
      if (this.selectedColumns.length === 0) return;
      const insertIndex = Math.min(...this.selectedColumns);
      this.insertColumnAt(insertIndex);
    },
    insertColumnRight() {
      if (this.selectedColumns.length === 0) return;
      const insertIndex = Math.max(...this.selectedColumns) + 1;
      this.insertColumnAt(insertIndex);
    },
    dropProgressionAt(progression: any[], columnIndex: number) {
      if (!progression || !Array.isArray(progression) || progression.length === 0) {
        console.error('Format de progression invalide');
        return;
      }
      
      // S'assurer que nous avons une mesure valide
      if (!this.measures[this.currentMeasure]) return;
      
      // Vérifier le type de progression (accords ou notes individuelles)
      const isChordProgression = progression.some(item => item.type === 'chord');
      
      if (isChordProgression) {
        // Traiter une progression d'accords
        this.handleChordProgression(progression, columnIndex);
      } else {
        // Traiter une progression de notes
        this.handleNoteProgression(progression, columnIndex);
      }
    },
    
    handleChordProgression(chords: any[], startColumn: number) {
      // Pour chaque accord dans la progression
      chords.forEach((chord, index) => {
        const colIndex = startColumn + index;
        
        // Vérifier si nous sommes toujours dans les limites de la mesure
        if (colIndex >= this.columns) return;
        
        // Appliquer l'override de mode si spécifié dans l'accord
        if (chord.mode) {
          // Créer un override temporaire pour cette colonne
          const tempSelection = [colIndex];
          const currentSelection = [...this.selectedColumns];
          
          // Temporairement définir la sélection à cette colonne
          this.selectedColumns = tempSelection;
          this.applyModeOverride(chord.mode);
          
          // Restaurer la sélection précédente
          this.selectedColumns = currentSelection;
        }
        
        // Placer les notes de l'accord dans la colonne
        if (chord.notes && Array.isArray(chord.notes)) {
          // Pour chaque note de l'accord, trouver la meilleure position sur le manche
          this.placeNotesInColumn(chord.notes, colIndex);
        }
      });
    },
    
    handleNoteProgression(notes: any[], startColumn: number) {
      // Pour chaque note dans la progression
      notes.forEach((note, index) => {
        const colIndex = startColumn + index;
        
        // Vérifier si nous sommes toujours dans les limites de la mesure
        if (colIndex >= this.columns) return;
        
        // Placer la note dans la colonne
        this.placeNotesInColumn([note], colIndex);
      });
    },
    
    placeNotesInColumn(notes: any[], columnIndex: number) {
      const tuningArray = this.tuning.split(',').reverse();
      
      // Pour chaque note, trouver la meilleure corde/frette
      notes.forEach((note, index) => {
        // Si nous avons dépassé le nombre de cordes, arrêter
        if (index >= tuningArray.length) return;
        
        const noteName = typeof note === 'string' ? note : note.name;
        if (!noteName) return;
        
        // Trouver la meilleure position (corde/frette) pour cette note
        const bestPosition = this.findBestPosition(noteName, tuningArray);
        
        if (bestPosition) {
          // Mettre à jour la cellule avec la frette
          this.updateCellValue(bestPosition.string, columnIndex, bestPosition.fret.toString());
        }
      });
    },
    
    findBestPosition(noteName: string, tuningArray: string[]) {
      // Convertir le nom de note en MIDI pour comparaison
      const targetMidi = Note.midi(noteName);
      if (targetMidi === null) return null;
      
      let bestPosition = null;
      let minDistance = Infinity;
      
      // Parcourir chaque corde
      tuningArray.forEach((stringNote, stringIndex) => {
        // Calculer le MIDI de la corde à vide
        const openStringMidi = Note.midi(stringNote);
        if (openStringMidi === null) return;
        
        // Chercher la frette qui donne la note la plus proche
        for (let fret = 0; fret <= 24; fret++) {
          const fretMidi = openStringMidi + fret;
          
          // Vérifier si c'est la même note (modulo 12 pour ignorer l'octave)
          if (fretMidi % 12 === targetMidi % 12) {
            // Calculer la distance en demi-tons
            const distance = Math.abs(fretMidi - targetMidi);
            
            // Si c'est la position la plus proche jusqu'à présent, l'enregistrer
            if (distance < minDistance) {
              minDistance = distance;
              bestPosition = { string: stringIndex, fret };
            }
            
            // Si la frette est entre 0 et 5, lui donner la priorité
            if (fret >= 0 && fret <= 5) {
              return { string: stringIndex, fret };
            }
          }
        }
      });
      
      return bestPosition;
    }
  }
});

// Fonction utilitaire pour créer une mesure vide
function createEmptyMeasure(stringCount: number, columnCount: number): string[][] {
  const measure: string[][] = [];

  for (let i = 0; i < stringCount; i++) {
    const row: string[] = [];
    for (let j = 0; j < columnCount; j++) {
      row.push('-');
    }
    measure.push(row);
  }

  return measure;
}

// Positions d'index par défaut (frette 1 pour chaque colonne)
function createDefaultIndexPositions(columnCount: number): number[] {
  return Array(columnCount).fill(1);
}

// Valeurs de rythme par défaut (0 = vide / noire implicite)
function createDefaultRhythmValues(columnCount: number): number[] {
  return Array(columnCount).fill(0);
}