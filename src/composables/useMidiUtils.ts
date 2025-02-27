// src/composables/useMidiUtils.ts
import { Note } from 'tonal';

export function useMidiUtils() {
  /**
   * Convertit un tableau de noms de notes en tableau de valeurs MIDI
   * @param notes Tableau de noms de notes (ex: ["C4", "E4", "G4"])
   * @returns Tableau de valeurs MIDI, en filtrant les valeurs null
   */
  function notesToMidi(notes: string[]): number[] {
    return notes
      .map(note => Note.midi(note))
      .filter((midi): midi is number => midi !== null);
  }

  /**
   * Convertit un tableau de notes en tableau de classes de hauteur (pitch classes)
   * @param notes Tableau de noms de notes
   * @returns Tableau de classes de hauteur (0-11)
   */
  function notesToPitchClasses(notes: string[]): number[] {
    return notesToMidi(notes).map(midi => midi % 12);
  }

  /**
   * Vérifie si un MIDI spécifique correspond à l'un des MIDI de la liste,
   * soit exactement, soit par classe de hauteur selon le type de matching
   * @param midi Valeur MIDI à vérifier
   * @param midiList Liste de valeurs MIDI de référence
   * @param matchType Type de matching ('one' pour exact, 'multiple' pour modulo 12)
   * @returns true si une correspondance est trouvée
   */
  function midiMatches(midi: number, midiList: number[], matchType: 'one' | 'multiple'): boolean {
    if (matchType === 'one') {
      return midiList.includes(midi);
    } else {
      return midiList.some(m => m % 12 === midi % 12);
    }
  }

  /**
   * Génère une liste de valeurs MIDI à partir d'un nom d'accord ou d'une gamme
   * @param root Note fondamentale (ex: "C")
   * @param type Type d'accord ou de gamme (ex: "major", "minor", "m7")
   * @param isScale true si c'est une gamme, false si c'est un accord
   * @returns Liste de valeurs MIDI
   */
  function generateMidiFromChordOrScale(root: string, type: string, isScale: boolean = false): number[] {
    // Cette fonction pourrait être étendue pour utiliser les fonctionnalités de Tonal.js
    // afin de générer des listes MIDI pour différents types d'accords ou gammes
    
    // Exemple simplifié pour l'accord majeur
    if (type === "major" && !isScale) {
      const baseNote = root.includes('4') ? root : `${root}4`;
      const notes = [`${baseNote}`, Note.transpose(baseNote, '3M'), Note.transpose(baseNote, '5P')];
      return notesToMidi(notes);
    }
    
    // Exemple simplifié pour l'accord mineur
    if (type === "minor" && !isScale) {
      const baseNote = root.includes('4') ? root : `${root}4`;
      const notes = [`${baseNote}`, Note.transpose(baseNote, '3m'), Note.transpose(baseNote, '5P')];
      return notesToMidi(notes);
    }
    
    // Gamme majeure
    if (type === "major" && isScale) {
      const baseNote = root.includes('4') ? root : `${root}4`;
      const intervals = ['1P', '2M', '3M', '4P', '5P', '6M', '7M'];
      const notes = intervals.map(interval => Note.transpose(baseNote, interval));
      return notesToMidi(notes);
    }
    
    // Par défaut, renvoyer juste la fondamentale
    const baseNote = root.includes('4') ? root : `${root}4`;
    return [Note.midi(baseNote)].filter((midi): midi is number => midi !== null);
  }

  return {
    notesToMidi,
    notesToPitchClasses,
    midiMatches,
    generateMidiFromChordOrScale
  };
}