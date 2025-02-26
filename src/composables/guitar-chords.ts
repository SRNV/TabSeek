// src/composables/guitar-chords.ts
import { Note, Interval, ChordType } from 'tonal';
import { TONAL_CHORD_TYPES, CHORD_NAME_MAPPINGS, getTonalChordName } from './tonalChordsMapping';

// Définition des constantes pour la référence d'accordage
export const REFERENCE_TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"]; // Accordage standard
export const REFERENCE_ROOT = "C"; // Note de référence pour les positions dans CHORDS

/**
 * Calcule les positions des doigts sur les frettes en fonction du type d'accord et de la note fondamentale
 * en utilisant les noms d'accords de Tonal.js (ChordType.all())
 * @param chordType - Le type d'accord tel que défini dans Tonal.js (ex: "major", "min7", "7sus4")
 * @param rootNote - La note fondamentale de l'accord (ex: "C", "F#", "Bb")
 * @param tuning - Les notes des cordes à vide (ex: ["E2", "A2", "D3", "G3", "B3", "E4"] pour l'accordage standard)
 * @param position - Position optionnelle de l'accord (1, 2, 3...), par défaut utilise la première position
 * @param referenceRoot - Note racine de référence pour laquelle les positions sont définies, par défaut "C"
 * @returns Un tableau de positions de frettes (les valeurs négatives indiquent des cordes non jouées)
 */
export function getFretPositions(
  chordType: string, 
  rootNote: string, 
  tuning: string[] = REFERENCE_TUNING, 
  position: number = 1,
  referenceRoot: string = REFERENCE_ROOT
): number[] {
  // Récupère la structure de l'accord
  const tonalChordName = getTonalChordName(chordType);
  const chordData = CHORDS[tonalChordName];
  if (!chordData || chordData.positions.length === 0) {
    return tuning.map(() => -1); // Accord non trouvé
  }
  
  // Trouve la position demandée ou utilise la première disponible
  const posIndex = chordData.positions.findIndex(pos => pos.position === position);
  const pos = posIndex >= 0 ? chordData.positions[posIndex] : chordData.positions[0];
  
  // Récupérer la différence en demi-tons entre la note de référence et la note cible
  const rootMidi = Note.midi(${rootNote}4);
  const referenceMidi = Note.midi(${referenceRoot}4);
  
  if (rootMidi === null || referenceMidi === null) {
    console.error("Notes invalides pour le calcul de la transposition");
    return tuning.map(() => -1);
  }
  
  const semitoneShift = rootMidi - referenceMidi;
  
  // Appliquer le décalage à chaque frette
  return pos.frets.map((fret) => {
    if (fret === null) return -1; // Corde non jouée
    
    const adjustedFret = fret + semitoneShift;
    
    // S'assurer que la position ne descend pas en dessous de 0
    if (adjustedFret < 0) {
      return -1; // Ne pas jouer cette corde si la position serait négative
    }
    
    return adjustedFret;
  });
}

/**
 * Version plus précise qui calcule les positions en fonction des notes spécifiques de l'accordage
 * @param chordType - Le type d'accord (ex: "major", "m7")
 * @param rootNote - La note fondamentale (ex: "C", "F#")
 * @param tuning - L'accordage utilisé (ex: ["E2", "A2", "D3", "G3", "B3", "E4"])
 * @param position - Position de l'accord à utiliser
 * @param maxFret - Limite supérieure pour la recherche de frettes
 * @returns Positions des frettes pour jouer l'accord
 */
export function getOptimalFretPositions(
  chordType: string,
  rootNote: string,
  tuning: string[] = REFERENCE_TUNING,
  position: number = 1,
  maxFret: number = 15
): number[] {
  // Récupère la structure de l'accord
  const tonalChordName = getTonalChordName(chordType);
  const chordData = CHORDS[tonalChordName];
  if (!chordData || chordData.positions.length === 0) {
    return tuning.map(() => -1);
  }
  
  // Construire l'ensemble des notes de l'accord
  const chordNotes = chordData.notes.map(intervalNotation => {
    // Convertir la notation de l'intervalle vers une notation que tonal peut comprendre
    let interval = intervalNotation;
    
    // Conversion des notations spéciales (1, b3, #5, etc.) en notation standard pour Tonal
    if (interval === "1") interval = "1P";
    else if (interval === "2") interval = "2M";
    else if (interval === "3") interval = "3M";
    else if (interval === "4") interval = "4P";
    else if (interval === "5") interval = "5P";
    else if (interval === "6") interval = "6M";
    else if (interval === "7") interval = "7M";
    else if (interval === "b2") interval = "2m";
    else if (interval === "b3") interval = "3m";
    else if (interval === "#4" || interval === "b5") interval = interval === "#4" ? "4A" : "5d";
    else if (interval === "#5" || interval === "b6") interval = interval === "#5" ? "5A" : "6m";
    else if (interval === "b7") interval = "7m";
    else if (interval === "bb7") interval = "7d";
    else if (interval === "9") interval = "9M";
    else if (interval === "b9") interval = "9m";
    else if (interval === "#9") interval = "9A";
    else if (interval === "11") interval = "11P";
    else if (interval === "#11") interval = "11A";
    else if (interval === "13") interval = "13M";
    else if (interval === "b13") interval = "13m";
    
    return Note.transpose(rootNote, interval);
  });
  
  // Ensemble des notes de l'accord (uniquement les classes de notes, sans l'octave)
  const chordPitchClasses = chordNotes.map(note => Note.get(note).pc);
  
  // Pour chaque corde, trouver la meilleure position
  const fretPositions = tuning.map((openStringNote, stringIndex) => {
    // Vérifier d'abord si la corde à vide est dans l'accord
    const openNotePC = Note.get(openStringNote).pc;
    if (chordPitchClasses.includes(openNotePC)) {
      return 0; // La corde à vide fait partie de l'accord
    }
    
    // Sinon, chercher la première frette qui produit une note de l'accord
    for (let fret = 1; fret <= maxFret; fret++) {
      const noteAtFret = Note.transpose(openStringNote, Interval.fromSemitones(fret));
      const notePC = Note.get(noteAtFret).pc;
      
      if (chordPitchClasses.includes(notePC)) {
        return fret;
      }
    }
    
    return -1; // Ne pas jouer cette corde si aucune position ne convient
  });
  
  // Si on a une position spécifique en esprit, ajuster pour qu'elle soit jouable dans cette zone
  if (position > 1) {
    // Calculer la position moyenne des frettes (en excluant les cordes non jouées)
    const playedFrets = fretPositions.filter(fret => fret > 0);
    if (playedFrets.length === 0) return fretPositions;
    
    const avgPosition = playedFrets.reduce((sum, fret) => sum + fret, 0) / playedFrets.length;
    const targetPosition = position * 4; // Position approximative sur le manche
    
    // Si la position actuelle est trop éloignée de la cible, décaler
    if (Math.abs(avgPosition - targetPosition) > 3) {
      // Chercher des alternatives plus hautes sur le manche
      return tuning.map((openStringNote, stringIndex) => {
        if (fretPositions[stringIndex] <= 0) return -1;
        
        // Chercher la prochaine occurrence de cette note plus haut sur le manche
        const currentNote = Note.transpose(
          openStringNote, 
          Interval.fromSemitones(fretPositions[stringIndex])
        );
        const notePC = Note.get(currentNote).pc;
        
        for (let fret = targetPosition - 2; fret <= targetPosition + 6; fret++) {
          const noteAtFret = Note.transpose(openStringNote, Interval.fromSemitones(fret));
          if (Note.get(noteAtFret).pc === notePC) {
            return fret;
          }
        }
        
        return fretPositions[stringIndex]; // Garde la position originale si aucune alternative
      });
    }
  }
  
  return fretPositions;
}

/**
 * Détecte dynamiquement les voicings d'accord possibles pour un accord donné
 * @param chordType - Type d'accord Tonal.js (ex: "maj7", "min7")
 * @param rootNote - La note fondamentale (ex: "C", "F#")
 * @param tuning - L'accordage de la guitare
 * @returns Tous les voicings possibles pour cet accord
 */
export function detectChordVoicings(
  chordType: string,
  rootNote: string,
  tuning: string[] = REFERENCE_TUNING
): { position: number, frets: number[], difficulty: number }[] {
  // Convertir le nom d'accord vers le format Tonal.js
  const tonalChordName = getTonalChordName(chordType);
  
  // Récupérer l'information de l'accord depuis Tonal.js
  const chord = ChordType.get(tonalChordName);
  if (chord.empty) return [];
  
  // Obtenir les intervalles de l'accord
  const intervals = chord.intervals;
  
  // Calculer toutes les notes de l'accord
  const chordNotes = intervals.map(interval => Note.transpose(rootNote, interval));
  
  // Classes de hauteur (pitch classes) de ces notes, sans l'octave
  const notePCs = chordNotes.map(note => Note.get(note).pc);
  
  const voicings: { position: number, frets: number[], difficulty: number }[] = [];
  
  // Détecter tous les voicings possibles en parcourant les positions
  for (let basePosition = 0; basePosition <= 15; basePosition++) {
    const frets: number[] = [];
    let hasRoot = false;
    let hasThird = false;
    let hasFifth = false;
    let hasSeventh = false;
    let reachDifficulty = 0;
    let totalFretDistance = 0;
    let lastFret = -1;
    
    // Pour chaque corde, trouver la meilleure note au sein de 4 frettes de la position de base
    for (let string = 0; string < tuning.length; string++) {
      const openString = tuning[string];
      
      // Chercher les notes possibles pour cette corde
      let bestFret = -1;
      let bestNote = "";
      
      for (let fret = Math.max(0, basePosition - 1); fret <= basePosition + 4; fret++) {
        const note = Note.transpose(openString, Interval.fromSemitones(fret));
        const notePC = Note.get(note).pc;
        
        if (notePCs.includes(notePC)) {
          // Vérifier si cette note améliore l'accord (priorité à la fondamentale, tierce, quinte)
          const noteIndex = notePCs.indexOf(notePC);
          const isFundamental = noteIndex === 0; // Première note = fondamentale
          const isThird = noteIndex === 1 || noteIndex === 2; // Seconde note = tierce
          const isFifth = noteIndex === 2 || noteIndex === 3; // Troisième note = quinte généralement
          
          if (isFundamental && !hasRoot) {
            bestFret = fret;
            bestNote = note;
            hasRoot = true;
          } else if (isThird && !hasThird && bestFret === -1) {
            bestFret = fret;
            bestNote = note;
            hasThird = true;
          } else if (isFifth && !hasFifth && bestFret === -1) {
            bestFret = fret;
            bestNote = note;
            hasFifth = true;
          } else if (bestFret === -1) {
            bestFret = fret;
            bestNote = note;
            if (noteIndex >= 3) hasSeventh = true;
          }
        }
      }
      
      // Ajouter la meilleure frette trouvée pour cette corde
      frets.push(bestFret);
      
      // Calculer la difficulté de stretch
      if (lastFret !== -1 && bestFret !== -1) {
        const distance = Math.abs(bestFret - lastFret);
        totalFretDistance += distance;
        if (distance > 4) reachDifficulty += distance - 4;
      }
      
      if (bestFret !== -1) lastFret = bestFret;
    }
    
    // Ne garder que les voicings qui contiennent au moins 3 notes différentes
    // et au moins la fondamentale
    const uniqueNotes = new Set(frets.filter(f => f !== -1).map(fret => {
      const stringIdx = frets.indexOf(fret);
      const note = Note.transpose(tuning[stringIdx], Interval.fromSemitones(fret));
      return Note.get(note).pc;
    }));
    
    if (uniqueNotes.size >= 3 && hasRoot) {
      // Calculer la difficulté globale du voicing
      const hasAllEssentialNotes = hasRoot && hasThird && hasFifth;
      const numberOfSkippedStrings = frets.filter(f => f === -1).length;
      const averageFretDistance = totalFretDistance / (frets.filter(f => f !== -1).length - 1 || 1);
      
      let difficulty = reachDifficulty;
      if (!hasAllEssentialNotes) difficulty += 2;
      difficulty += numberOfSkippedStrings * 0.5;
      difficulty += averageFretDistance;
      
      // Ajouter ce voicing avec sa difficulté
      voicings.push({
        position: basePosition,
        frets: [...frets],
        difficulty: Math.round(difficulty * 10) / 10
      });
    }
  }
  
  // Trier les voicings par difficulté croissante
  return voicings.sort((a, b) => a.difficulty - b.difficulty);
}

export interface ChordPosition {
  position: number;
  frets: (number | null)[];
  fingers: (number | null)[];
  barres: number[];
}

export interface ChordTypeDef {
  notes: string[];
  positions: ChordPosition[];
  category?: string;
  description?: string;
  intervals: string[];
}

export interface Chords {
  [key: string]: ChordTypeDef;
}

export const CHORDS: Chords = {
  // Triades de base
  "major": {
    notes: ["1", "3", "5"],
    intervals: ["1P", "3M", "5P"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 0, 2, 3, 0],
        fingers: [0, 1, 0, 2, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 3, 5, 5, 5, 3],
        fingers: [1, 1, 3, 4, 2, 1],
        barres: [3]
      }
    ],
    category: "Triades de base",
    description:
      "L’accord majeur est la triade la plus répandue dans la musique occidentale. Il dégage une stabilité et une clarté ... (etc.)"
  },
  "minor": {
    notes: ["1", "b3", "5"],
    intervals: ["1P", "3m", "5P"],
    positions: [
      {
        position: 1,
        frets: [3, 4, 5, 5, 3, 3],
        fingers: [1, 2, 4, 3, 1, 1],
        barres: [3]
      },
      {
        position: 2,
        frets: [8, 8, 8, 10, 10, 8],
        fingers: [1, 1, 1, 4, 3, 1],
        barres: [8]
      }
    ],
    category: "Triades de base",
    description:
      "L’accord mineur se distingue par sa tierce mineure, créant une atmosphère plus sombre ... (etc.)"
  },
  "diminished": {
    notes: ["1", "b3", "b5"],
    intervals: ["1P", "3m", "5d"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 4, 5, 4, null],
        fingers: [0, 1, 2, 4, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, null, 10, 8, 10, null],
        fingers: [1, 0, 3, 1, 4, 0],
        barres: []
      }
    ],
    category: "Triades de base",
    description:
      "L’accord diminué se caractérise par ... (etc.)"
  },
  "augmented": {
    notes: ["1", "3", "#5"],
    intervals: ["1P", "3M", "5A"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 2, 1, 1, null],
        fingers: [0, 3, 2, 1, 1, 0],
        barres: [1]
      },
      {
        position: 2,
        frets: [4, 3, 2, 1, null, null],
        fingers: [4, 3, 2, 1, 0, 0],
        barres: []
      }
    ],
    category: "Triades de base",
    description:
      "L’accord augmenté, composé de deux tierces majeures empilées, crée un effet de ... (etc.)"
  },

  // Accords de septième
  "7": {
    notes: ["1", "3", "5", "b7"],
    intervals: ["1P", "3M", "5P", "7m"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 3, 2, 3, 0],
        fingers: [0, 1, 4, 2, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 3, 5, 3, 5, 3],
        fingers: [1, 1, 3, 1, 4, 1],
        barres: [3]
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord de septième de dominante est l’un des piliers de la musique tonale ... (etc.)"
  },
  "maj7": {
    notes: ["1", "3", "5", "7"],
    intervals: ["1P", "3M", "5P", "7M"],
    positions: [
      {
        position: 1,
        frets: [0, 0, 0, 2, 3, 0],
        fingers: [0, 0, 0, 2, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 3, 4, 5, 5, 3],
        fingers: [1, 1, 2, 4, 3, 1],
        barres: [3]
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord majeur 7 est réputé pour son caractère doux ... (etc.)"
  },
  "min7": {
    notes: ["1", "b3", "5", "b7"],
    intervals: ["1P", "3m", "5P", "7m"],
    positions: [
      {
        position: 1,
        frets: [3, 4, 3, 5, 3, 3],
        fingers: [1, 2, 1, 3, 1, 1],
        barres: [3]
      },
      {
        position: 2,
        frets: [8, 8, 8, 8, 10, 8],
        fingers: [1, 1, 1, 1, 3, 1],
        barres: [8]
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord mineur 7 conjugue la chaleur du mineur et la souplesse de la septième mineure ... (etc.)"
  },
  "min7b5": {
    notes: ["1", "b3", "b5", "b7"],
    intervals: ["1P", "3m", "5d", "7m"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 4, 3, 4, null],
        fingers: [0, 1, 3, 2, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, null, 8, 8, 7, null],
        fingers: [2, 0, 3, 4, 1, 0],
        barres: []
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord mineur 7 bémol 5, aussi appelé demi-diminué ... (etc.)"
  },
  "dim7": {
    notes: ["1", "b3", "b5", "bb7"],
    intervals: ["1P", "3m", "5d", "7d"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 4, 2, 4, null],
        fingers: [0, 2, 3, 1, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, null, 7, 8, 7, null],
        fingers: [2, 0, 1, 3, 1, 0],
        barres: [7]
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord dim7, formé exclusivement de tierces mineures successives ... (etc.)"
  },
  "minMaj7": {
    notes: ["1", "b3", "5", "7"],
    intervals: ["1P", "3m", "5P", "7M"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 4, 4, 4, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, 8, 8, 9, 10, 8],
        fingers: [1, 1, 1, 2, 3, 1],
        barres: [8]
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord mineur majeur 7 (minMaj7) se distingue par ... (etc.)"
  },
  "7b5": {
    notes: ["1", "3", "b5", "b7"],
    intervals: ["1P", "3M", "5d", "7m"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 2, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [null, 9, 8, 9, 7, null],
        fingers: [0, 3, 2, 4, 1, 0],
        barres: []
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord 7 bémol 5 introduit une tension notable ... (etc.)"
  },
  "aug7": {
    notes: ["1", "3", "#5", "b7"],
    intervals: ["1P", "3M", "5A", "7m"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 4, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, 7, 8, 7, null, null],
        fingers: [3, 1, 4, 2, 0, 0],
        barres: []
      }
    ],
    category: "Accords de septième",
    description:
      "L’accord 7 augmenté fusionne la tension de la septième mineure avec ... (etc.)"
  },

  // Accords suspendus
  "sus2": {
    notes: ["1", "2", "5"],
    intervals: ["1P", "2M", "5P"],
    positions: [
      {
        position: 1,
        frets: [0, 3, 5, 5, 3, 0],
        fingers: [0, 1, 4, 3, 1, 0],
        barres: [3]
      },
      {
        position: 2,
        frets: [3, 0, 0, 0, 3, 3],
        fingers: [2, 0, 0, 0, 3, 4],
        barres: []
      }
    ],
    category: "Accords suspendus",
    description:
      "L’accord sus2 remplace la tierce par une seconde majeure ... (etc.)"
  },
  "sus4": {
    notes: ["1", "4", "5"],
    intervals: ["1P", "4P", "5P"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 3, 3, 3, 0],
        fingers: [0, 1, 4, 3, 2, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 3, 5, 5, 6, 3],
        fingers: [1, 1, 3, 2, 4, 1],
        barres: [3]
      }
    ],
    category: "Accords suspendus",
    description:
      "L’accord sus4 substitue la tierce par une quarte, créant une tension douce ... (etc.)"
  },
  "7sus4": {
    notes: ["1", "4", "5", "b7"],
    intervals: ["1P", "4P", "5P", "7m"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 3, 3, 6, 3],
        fingers: [0, 1, 1, 1, 4, 1],
        barres: [3]
      },
      {
        position: 2,
        frets: [8, 8, 10, 8, 11, 8],
        fingers: [1, 1, 3, 1, 4, 1],
        barres: [8]
      }
    ],
    category: "Accords suspendus",
    description:
      "L’accord 7sus4 reprend la structure du 7 tout en remplaçant la tierce ... (etc.)"
  },

  // Accords avec neuvième
  "9": {
    notes: ["1", "3", "5", "b7", "9"],
    intervals: ["1P", "3M", "5P", "7m", "9M"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 0, 2, 1, 3],
        fingers: [0, 1, 0, 3, 2, 4],
        barres: []
      },
      {
        position: 2,
        frets: [3, 5, 3, 5, 3, 5],
        fingers: [1, 3, 1, 3, 1, 4],
        barres: [3, 5]
      }
    ],
    category: "Accords avec neuvième",
    description:
      "L’accord 9 ajoute une neuvième majeure à la triade de base ... (etc.)"
  },
  "maj9": {
    notes: ["1", "3", "5", "7", "9"],
    intervals: ["1P", "3M", "5P", "7M", "9M"],
    positions: [
      {
        position: 1,
        frets: [0, 0, 0, 2, 2, 0],
        fingers: [0, 0, 0, 2, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 5, 4, 5, 3, 5],
        fingers: [1, 3, 2, 4, 1, 3],
        barres: [3, 5]
      }
    ],
    category: "Accords avec neuvième",
    description:
      "L’accord maj9 associe la douceur du maj7 et la subtilité de la neuvième ... (etc.)"
  },
  "min9": {
    notes: ["1", "b3", "5", "b7", "9"],
    intervals: ["1P", "3m", "5P", "7m", "9M"],
    positions: [
      {
        position: 1,
        frets: [3, 1, 3, 1, 3, 3],
        fingers: [2, 1, 3, 1, 4, 3],
        barres: [1]
      },
      {
        position: 2,
        frets: [8, 10, 8, 10, 8, 10],
        fingers: [1, 3, 1, 4, 1, 2],
        barres: [8]
      }
    ],
    category: "Accords avec neuvième",
    description:
      "L’accord min9 marie la couleur mineure à la douceur de la neuvième, créant ... (etc.)"
  },
  "minMaj9": {
    notes: ["1", "b3", "5", "7", "9"],
    intervals: ["1P", "3m", "5P", "7M", "9M"],
    positions: [
      {
        position: 1,
        frets: [3, 1, 3, 2, 3, 3],
        fingers: [2, 1, 3, 1, 4, 3],
        barres: [1]
      }
    ],
    category: "Accords avec neuvième",
    description:
      "L’accord minMaj9 prolonge l’idée du minMaj7 en ajoutant une neuvième ... (etc.)"
  },
  "7b9": {
    notes: ["1", "3", "5", "b7", "b9"],
    intervals: ["1P", "3M", "5P", "7m", "9m"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 3, 2, 2, null],
        fingers: [0, 1, 4, 2, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, 9, 8, 9, 8, 9],
        fingers: [1, 2, 1, 3, 1, 4],
        barres: [8]
      }
    ],
    category: "Accords avec neuvième",
    description:
      "L’accord 7b9 introduit une seconde mineure au-dessus de la fondamentale, renforçant grandement la tension ... (etc.)"
  },
  "7#9": {
    notes: ["1", "3", "5", "b7", "#9"],
    intervals: ["1P", "3M", "5P", "7m", "9A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 3, 2, 4, null],
        fingers: [0, 1, 3, 2, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, 7, 8, 7, 8, null],
        fingers: [3, 1, 4, 2, 3, 0],
        barres: [8]
      }
    ],
    category: "Accords avec neuvième",
    description:
      "L’accord 7#9 est célèbre pour son rôle dans le rock et le funk, souvent associé à la fameuse « Hendrix chord ». ... (etc.)"
  },

  // Accords avec 11 et 13
  "11": {
    notes: ["1", "3", "5", "b7", "9", "11"],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 1, 1, 3, 0],
        fingers: [0, 1, 1, 1, 3, 0],
        barres: [1]
      },
      {
        position: 2,
        frets: [5, 5, 5, 6, 8, 8],
        fingers: [1, 1, 1, 2, 4, 3],
        barres: [5]
      }
    ],
    category: "Accords avec 11 et 13",
    description:
      "L’accord 11 étend l’accord de dominante (7) jusqu’à la onzième, offrant une sonorité ... (etc.)"
  },
  "13": {
    notes: ["1", "3", "5", "b7", "9", "11", "13"],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P", "13M"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 3, 2, 3, 5],
        fingers: [0, 1, 3, 2, 3, 4],
        barres: [3]
      },
      {
        position: 2,
        frets: [8, 10, 8, 9, 10, 10],
        fingers: [1, 3, 1, 2, 4, 4],
        barres: [8, 10]
      }
    ],
    category: "Accords avec 11 et 13",
    description:
      "L’accord 13 représente l’extension maximale d’une dominante en incluant la treizième ... (etc.)"
  },
  "maj13": {
    notes: ["1", "3", "5", "7", "9", "11", "13"],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11P", "13M"],
    positions: [
      {
        position: 1,
        frets: [null, 0, 2, 1, 2, 2],
        fingers: [0, 0, 4, 1, 2, 3],
        barres: []
      }
    ],
    category: "Accords avec 11 et 13",
    description:
      "L’accord maj13 est la forme étendue de l’accord majeur, réunissant toutes les tensions diatoniques ... (etc.)"
  },
  "min13": {
    notes: ["1", "b3", "5", "b7", "9", "11", "13"],
    intervals: ["1P", "3m", "5P", "7m", "9M", "11P", "13M"],
    positions: [
      {
        position: 1,
        frets: [8, 8, 8, 8, 10, 10],
        fingers: [1, 1, 1, 1, 3, 4],
        barres: [8]
      }
    ],
    category: "Accords avec 11 et 13",
    description:
      "L’accord min13 ajoute l’ensemble des extensions disponibles au mineur 7, offrant une sonorité complète ... (etc.)"
  },

  // Accords avec 6
  "6": {
    notes: ["1", "3", "5", "6"],
    intervals: ["1P", "3M", "5P", "6M"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 2, 2, 3, 0],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 5, 5, 5, 5, 3],
        fingers: [1, 3, 3, 3, 3, 1],
        barres: [3, 5]
      }
    ],
    category: "Accords avec 6",
    description:
      "L’accord 6, ou accord majeur 6, ajoute la sixte majeure à la triade ... (etc.)"
  },
  "min6": {
    notes: ["1", "b3", "5", "6"],
    intervals: ["1P", "3m", "5P", "6M"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 1, 3, null],
        fingers: [0, 1, 2, 1, 3, 0],
        barres: [1]
      },
      {
        position: 2,
        frets: [8, 10, 10, 8, 10, 8],
        fingers: [1, 3, 3, 1, 4, 1],
        barres: [8, 10]
      }
    ],
    category: "Accords avec 6",
    description:
      "L’accord mineur 6 associe la tierce mineure et la sixte majeure, créant une sonorité douce-amère ... (etc.)"
  },

  // Accords avec add
  "add9": {
    notes: ["1", "3", "5", "9"],
    intervals: ["1P", "3M", "5P", "9M"],
    positions: [
      {
        position: 1,
        frets: [0, 3, 0, 2, 3, 0],
        fingers: [0, 2, 0, 1, 3, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 0, 0, 0, 3, 0],
        fingers: [2, 0, 0, 0, 3, 0],
        barres: []
      }
    ],
    category: "Accords avec add",
    description:
      "L’accord add9 garde la structure d’un accord majeur tout en y ajoutant une neuvième ... (etc.)"
  },
  "madd9": {
    notes: ["1", "b3", "5", "9"],
    intervals: ["1P", "3m", "5P", "9M"],
    positions: [
      {
        position: 1,
        frets: [3, 1, 0, 2, 3, 3],
        fingers: [3, 1, 0, 2, 4, 3],
        barres: []
      },
      {
        position: 2,
        frets: [8, 10, 10, 8, 8, 8],
        fingers: [1, 3, 4, 1, 1, 1],
        barres: [8]
      }
    ],
    category: "Accords avec add",
    description:
      "L’accord madd9 fusionne la couleur mineure et la fraîcheur de la neuvième ... (etc.)"
  },

  // Accords 6/9
  "69": {
    notes: ["1", "3", "5", "6", "9"],
    intervals: ["1P", "3M", "5P", "6M", "9M"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 0, 2, 0, 0],
        fingers: [0, 1, 0, 2, 0, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 5, 3, 5, 5, 3],
        fingers: [1, 2, 1, 3, 4, 1],
        barres: [3]
      }
    ],
    category: "Accords 6/9",
    description:
      "L’accord 6/9 associe la sixte et la neuvième à la triade majeure, créant une teinte brillante ... (etc.)"
  },
  "m69": {
    notes: ["1", "b3", "5", "6", "9"],
    intervals: ["1P", "3m", "5P", "6M", "9M"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 1, 2, 3, 3],
        fingers: [0, 2, 1, 3, 4, 4],
        barres: [3]
      }
    ],
    category: "Accords 6/9",
    description:
      "L’accord m6/9 combine les sonorités mineures, la sixte majeure et la neuvième ... (etc.)"
  },

  // Accords altérés et de tension
  "7#11": {
    notes: ["1", "3", "5", "b7", "#11"],
    intervals: ["1P", "3M", "5P", "7m", "11A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 1, 3, null],
        fingers: [0, 1, 2, 1, 3, 0],
        barres: [1]
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L’accord 7#11 est une forme altérée de l’accord 7, ajoutant une quarte augmentée ... (etc.)"
  },
  "7b13": {
    notes: ["1", "3", "5", "b7", "b13"],
    intervals: ["1P", "3M", "5P", "7m", "13m"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 3, 2, 4, 4],
        fingers: [0, 1, 3, 2, 4, 4],
        barres: [4]
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L’accord 7b13 ajoute une treizième mineure à l’accord de dominante ... (etc.)"
  },
  "7#9#11": {
    notes: ["1", "3", "5", "b7", "#9", "#11"],
    intervals: ["1P", "3M", "5P", "7m", "9A", "11A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 4, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L’accord 7#9#11 cumule deux altérations, la neuvième augmentée et la quarte augmentée, pour un maximum de tension ... (etc.)"
  },
  "7#9b13": {
    notes: ["1", "3", "5", "b7", "#9", "b13"],
    intervals: ["1P", "3M", "5P", "7m", "9A", "13m"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 3, 2, 4, 4],
        fingers: [0, 1, 3, 2, 4, 4],
        barres: [4]
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L’accord 7#9b13 associe la tension de la neuvième augmentée à celle de la treizième mineure ... (etc.)"
  },
  "7b9#11": {
    notes: ["1", "3", "5", "b7", "b9", "#11"],
    intervals: ["1P", "3M", "5P", "7m", "9m", "11A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 1, 2, null],
        fingers: [0, 1, 3, 2, 4, 0],
        barres: []
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L’accord 7b9#11 combine la dissonance de la neuvième mineure et de la quarte augmentée ... (etc.)"
  },
  "7b9b13": {
    notes: ["1", "3", "5", "b7", "b9", "b13"],
    intervals: ["1P", "3M", "5P", "7m", "9m", "13m"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 3, 1, 2, 4],
        fingers: [0, 1, 3, 1, 2, 4],
        barres: [1]
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L’accord 7b9b13 superpose la tension de la neuvième mineure et de la treizième mineure ... (etc.)"
  },

  // Accords majeurs spécifiques
  "maj7#5": {
    notes: ["1", "3", "#5", "7"],
    intervals: ["1P", "3M", "5A", "7M"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 0, 2, 4, null],
        fingers: [0, 1, 0, 2, 4, 0],
        barres: []
      }
    ],
    category: "Accords majeurs spécifiques",
    description:
      "L’accord maj7#5, parfois appelé maj7(♯5), propose un son lumineux et légèrement décalé ... (etc.)"
  },
  "maj7b5": {
    notes: ["1", "3", "b5", "7"],
    intervals: ["1P", "3M", "5d", "7M"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 3, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      }
    ],
    category: "Accords majeurs spécifiques",
    description:
      "L’accord maj7b5 introduit une quinte diminuée dans l’accord majeur 7, créant une ambivalence subtile ... (etc.)"
  },
  "maj7#11": {
    notes: ["1", "3", "5", "7", "#11"],
    intervals: ["1P", "3M", "5P", "7M", "11A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 3, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      }
    ],
    category: "Accords majeurs spécifiques",
    description:
      "L’accord maj7#11 insère une quarte augmentée dans un accord majeur 7 ... (etc.)"
  },
  "maj13#11": {
    notes: ["1", "3", "5", "7", "9", "#11", "13"],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11A", "13M"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 0, 2, 2, 2],
        fingers: [0, 1, 0, 2, 3, 4],
        barres: []
      }
    ],
    category: "Accords majeurs spécifiques",
    description:
      "L’accord maj13#11 représente l’extension ultime d’un accord majeur, en y intégrant la #11 ... (etc.)"
  },

  // Autres accords spécifiques
  "5": {
    notes: ["1", "5"],
    intervals: ["1P", "5P"],
    positions: [
      {
        position: 1,
        frets: [null, 3, 5, 5, null, null],
        fingers: [0, 1, 3, 2, 0, 0],
        barres: []
      },
      {
        position: 2,
        frets: [8, 10, 10, null, null, null],
        fingers: [1, 3, 2, 0, 0, 0],
        barres: []
      }
    ],
    category: "Autres accords spécifiques",
    description:
      "L’accord 5, souvent appelé « power chord », se compose uniquement de la fondamentale et de la quinte ... (etc.)"
  },
  "m#5": {
    notes: ["1", "b3", "#5"],
    intervals: ["1P", "3m", "5A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 1, 2, null],
        fingers: [0, 1, 3, 2, 4, 0],
        barres: []
      }
    ],
    category: "Autres accords spécifiques",
    description:
      "L’accord m#5 marie la tierce mineure et la quinte augmentée ... (etc.)"
  },
  "sus24": {
    notes: ["1", "2", "4", "5"],
    intervals: ["1P", "2M", "4P", "5P"],
    positions: [
      {
        position: 1,
        frets: [0, 0, 0, 2, 3, 0],
        fingers: [0, 0, 0, 2, 3, 0],
        barres: []
      }
    ],
    category: "Autres accords spécifiques",
    description:
      "L’accord sus24 cumule la seconde et la quarte, produisant une structure sans tierce ni sixte ... (etc.)"
  },
  "9sus4": {
    notes: ["1", "4", "5", "b7", "9"],
    intervals: ["1P", "4P", "5P", "7m", "9M"],
    positions: [
      {
        position: 1,
        frets: [0, 1, 0, 1, 1, 3],
        fingers: [0, 1, 0, 2, 2, 4],
        barres: [1]
      }
    ],
    category: "Autres accords spécifiques",
    description:
      "L’accord 9sus4 combine la suspension de la quarte avec la neuvième, tout en conservant la septième mineure ... (etc.)"
  }
};
