// src/composables/guitar-chords.ts
import { Note, Interval, ChordType, type NoteLiteral } from 'tonal';
import { TONAL_CHORD_TYPES, CHORD_NAME_MAPPINGS, getTonalChordName } from './tonalChordsMapping';
import { CHORDS } from './chords';

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
  const posIndex = chordData.positions.findIndex((pos: { position: number; }) => pos.position === position);
  const pos = posIndex >= 0 ? chordData.positions[posIndex] : chordData.positions[0];
  
  // Récupérer la différence en demi-tons entre la note de référence et la note cible
  const rootMidi = Note.midi(`${rootNote}4`);
  const referenceMidi = Note.midi(`${referenceRoot}4`);
  
  if (rootMidi === null || referenceMidi === null) {
    console.error("Notes invalides pour le calcul de la transposition");
    return tuning.map(() => -1);
  }
  
  const semitoneShift = rootMidi - referenceMidi;
  
  // Appliquer le décalage à chaque frette
  return pos.frets.map((fret: number | null) => {
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
  const chordNotes = chordData.notes.map((intervalNotation: any) => {
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
  const chordPitchClasses = chordNotes.map((note: NoteLiteral) => Note.get(note).pc);
  
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

