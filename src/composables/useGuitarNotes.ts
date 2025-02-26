// useGuitarNotes.ts
import { Note, Key, Scale, Interval, Mode, ChordType, ScaleType } from 'tonal';
import type { ModeGuitar } from '../types';

export function useGuitarNotes() {
  class GuitarNote {
    position: number;
    mode: string;
    completeNoteMode: string;
    isForced: boolean;
    modeObject: ModeGuitar | null;
    metadata: {
      name: string;
      tonal: ReturnType<typeof Note.get>;
      minor: any;
      major: any;
      mScale: any;
      MScale: any;
      minorScale: any;
      majorScale: any;
      minorDegrees: any;
      majorDegrees: any;
      minorName: string;
      majorName: string;
    };

    static defaultColor = '#333';
    static colors = [
      '#FFF9B1', // 1
      '#77DD77', // 2
      '#AEC6CF', // 3
      '#CDB4DB', // 4
      '#FFB3B3', // 5
      '#FFD1B3', // 6
      '#FFFFFF'  // 7
    ];

    static modeColors: { [key: string]: string } = {
      ionian: 'white',
      dorian: 'orange',
      phrygian: 'red',
      lydian: 'purple',
      mixolydian: 'blue',
      aeolian: 'green',
      locrian: 'yellow'
    };

    constructor(name: string, position = 0, mode = 'minor', force = false) {
      this.position = position;
      this.mode = mode;
      this.completeNoteMode = `${name} ${this.mode}`;
      this.isForced = force;
      this.modeObject = null;

      const note = Note.get(name);
      const minorName = `${name} minor`;
      const majorName = `${name} major`;
      const minorScale = Scale.degrees(minorName);
      const majorScale = Scale.degrees(majorName);
      const degrees = Array.from(Array(8)).map((_, i) => i + 1);

      this.metadata = {
        name,
        tonal: note,
        minor: Key.minorKey(note.letter),
        major: Key.majorKey(note.letter),
        mScale: Scale.get(minorName),
        MScale: Scale.get(majorName),
        minorScale,
        majorScale,
        minorDegrees: degrees.map(() => minorScale),
        majorDegrees: degrees.map(() => majorScale),
        minorName,
        majorName
      };
    }

    setMode(mode: string = 'minor', modeObj?: ModeGuitar) {
      this.mode = mode;
      this.completeNoteMode = `${this.metadata.name} ${this.mode}`;
      if (modeObj) {
        this.modeObject = modeObj;
      } else {
        // Essayer de trouver le mode dans les modes disponibles
        let m = Mode.get(mode);
        if (!m.empty && m.intervals && m.intervals.length > 0) {
          this.modeObject = {
            name: m.name,
            aliases: m.aliases || [],
            modeNum: m.modeNum || 0,
            mode: m.modeNum || 0,
            intervals: m.intervals,
            alt: [], // À compléter si nécessaire
            triad: "", // À compléter si nécessaire
            seventh: "" // À compléter si nécessaire
          };
        } else {
          this.modeObject = null;
        }
      }
    }

    static isNoteInScale(noteName: string, scaleName: string): boolean {
      const scale = Scale.get(scaleName);
      if (scale.empty) return false;

      const note = Note.get(noteName);
      const notes = scale.intervals.map((interval: string) =>
        Note.transpose(scaleName.split(' ')[0], interval)
      );
      const isAccidented = Boolean(note.acc?.length);

      return (
        scale.notes.includes(note.pc) ||
        notes.includes(note.pc) ||
        (isAccidented && notes.includes(Note.enharmonic(note.pc))) ||
        (isAccidented && scale.notes.includes(Note.enharmonic(note.pc)))
      );
    }

    static getScaleDegree(noteName: string, scaleName: string): number | null {
      let scale = Scale.get(scaleName);
      if (scale.empty) {
        scale = Scale.get(scaleName.replace(/^(\w)\s+/gi, ''));
        if (scale.empty) return null;
      }
      const scaleNotes = scale.notes;
      const scaleMidiMod12 = scaleNotes.map((n: string) => {
        const midiVal = Note.midi(n + '4');
        return midiVal === null ? null : midiVal % 12;
      });

      const noteMidiVal = Note.midi(noteName + '4');
      if (noteMidiVal === null) return null;
      const noteMidiMod12 = noteMidiVal % 12;

      const indexInScale = scaleMidiMod12.indexOf(noteMidiMod12);
      if (indexInScale === -1) return null;
      return indexInScale + 1;
    }

    isInScale(name: string): boolean {
      if (this.modeObject) {
        // Utiliser les intervalles du mode pour vérifier l'appartenance
        const rootNote = this.completeNoteMode.split(' ')[0];
        const modeNotes = this.modeObject.intervals.map(interval => 
          Note.transpose(rootNote, interval)
        );
        const notePC = Note.get(name).pc;
        const modeNotesPC = modeNotes.map(n => Note.get(n).pc);
        return modeNotesPC.includes(notePC);
      }
      
      return (
        GuitarNote.isNoteInScale(name, this.mode) ||
        GuitarNote.isNoteInScale(name, this.completeNoteMode)
      );
    }

    getScaleDegree(name: string): number | null {
      if (this.modeObject) {
        // Utiliser les intervalles du mode pour déterminer le degré
        const rootNote = this.completeNoteMode.split(' ')[0];
        const modeNotes = this.modeObject.intervals.map(interval => 
          Note.transpose(rootNote, interval)
        );
        const notePC = Note.get(name).pc;
        const modeNotesPC = modeNotes.map(n => Note.get(n).pc);
        return modeNotesPC.indexOf(notePC) + 1 || null;
      }
      
      return (
        GuitarNote.getScaleDegree(name, this.mode) ||
        GuitarNote.getScaleDegree(name, this.completeNoteMode)
      );
    }

    getScaleColorForDegree(name: string): string {
      if (!this.isInScale(name)) return GuitarNote.defaultColor;
      const deg = this.getScaleDegree(name);
      return deg ? GuitarNote.colors[deg - 1] : GuitarNote.defaultColor;
    }
  }

  // Fonction pour convertir l'objet Mode de tonal en ModeGuitar
  function convertToModeGuitar(mode: any): ModeGuitar {
    // Déterminer le type d'accord triade selon les intervalles
    let triad = "major";
    if (mode.intervals.includes("3m")) {
      triad = "minor";
    }
    if (mode.intervals.includes("5d")) {
      triad = "diminished";
    }
    if (mode.intervals.includes("5A")) {
      triad = "augmented";
    }
    
    // Déterminer le type d'accord septième selon les intervalles
    let seventh = "maj7";
    if (mode.intervals.includes("7m")) {
      seventh = mode.intervals.includes("3M") ? "7" : "min7";
      if (mode.intervals.includes("5d")) {
        seventh = "min7b5";
      }
    }
    if (mode.intervals.includes("7d")) {
      seventh = "dim7";
    }
    
    // Déterminer les altérations par rapport au mode ionien
    const ionianIntervals = ["1P", "2M", "3M", "4P", "5P", "6M", "7M"];
    const alt: string[] = [];
    
    if (mode.intervals.includes("2m")) alt.push("b2");
    if (mode.intervals.includes("2A")) alt.push("#2");
    if (mode.intervals.includes("3m")) alt.push("b3");
    if (mode.intervals.includes("4d")) alt.push("b4");
    if (mode.intervals.includes("4A")) alt.push("#4");
    if (mode.intervals.includes("5d")) alt.push("b5");
    if (mode.intervals.includes("5A")) alt.push("#5");
    if (mode.intervals.includes("6m")) alt.push("b6");
    if (mode.intervals.includes("6A")) alt.push("#6");
    if (mode.intervals.includes("7m")) alt.push("b7");
    if (mode.intervals.includes("7d")) alt.push("bb7");
    
    return {
      name: mode.name,
      aliases: mode.aliases || [],
      modeNum: mode.modeNum || 0,
      mode: mode.modeNum || 0,
      intervals: mode.intervals,
      alt,
      triad,
      seventh
    };
  }

  // Fonction pour obtenir tous les modes au format ModeGuitar
  function getAllModes(): ModeGuitar[] {
    const tonalModes = Mode.all().filter((m: any) => !m.empty);
    return tonalModes.map(convertToModeGuitar);
  }

  return {
    GuitarNote,
    getAllModes,
    convertToModeGuitar,
    Note,
    Key,
    Scale,
    Interval,
    Mode,
    ChordType,
    ScaleType
  };
}