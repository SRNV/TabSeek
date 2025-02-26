// useNoteHelpers.ts mis à jour
import { Note, Interval } from 'tonal';
import { useGuitarNotes } from './useGuitarNotes';

export function getNoteName(cord: string, fret: number): string {
  return Note.transpose(cord, Interval.fromSemitones(fret));
}

export function getNoteDegree(noteName: string, collection: string[]): number | null {
  const noteData = Note.get(noteName);
  const midi = noteData.midi;
  if (midi == null) return null;
  const notePc = midi % 12;
  const scaleNotes = collection.map(n => {
    const m = Note.get(n).midi;
    return m != null ? m % 12 : null;
  });
  const index = scaleNotes.indexOf(notePc);
  return index === -1 ? null : index + 1;
}

export function getNoteColor(cord: string, fret: number, collection: string[]): string {
  const { GuitarNote } = useGuitarNotes();
  const noteName = getNoteName(cord, fret);
  const degree = getNoteDegree(noteName, collection);
  return degree ? GuitarNote.colors[degree - 1] : GuitarNote.defaultColor;
}

export function getNoteDegreeLabel(cord: string, fret: number, collection: string[]): string {
  const noteName = getNoteName(cord, fret);
  const degree = getNoteDegree(noteName, collection);
  return degree ? `${degree}°` : '';
}

/**
 * Combine une gamme et un accord en une seule collection de notes
 * @param scale - Tableau de notes de la gamme
 * @param chord - Tableau de notes de l'accord
 * @returns Tableau combiné contenant toutes les notes uniques
 */
export function getJoinedNotes(scale: string[], chord: string[]): string[] {
  // Fonction auxiliaire pour normaliser les notes (retirer l'octave et obtenir uniquement la classe de hauteur)
  const normalizeNotes = (notes: string[]) => notes.map(n => Note.get(n).pc || '');
  
  // Normaliser les notes pour pouvoir les comparer
  const scaleNotes = normalizeNotes(scale);
  const chordNotes = normalizeNotes(chord);
  
  // Créer un ensemble unique de notes
  const uniqueNotes = new Set([...scale]);
  
  // Ajouter les notes de l'accord qui ne sont pas déjà dans la gamme
  for (let i = 0; i < chord.length; i++) {
    const chordNote = chord[i];
    const chordNotePC = Note.get(chordNote).pc;
    
    // Vérifier si la note existe déjà dans la gamme (en comparant les classes de hauteur)
    if (chordNotePC && !scaleNotes.includes(chordNotePC)) {
      uniqueNotes.add(chordNote);
    }
  }
  
  return Array.from(uniqueNotes);
}

/**
 * Obtient la couleur d'une note en tenant compte de l'appartenance à la gamme ou à l'accord
 * @param cord - Corde de la guitare
 * @param fret - Frette de la guitare
 * @param scale - Tableau de notes de la gamme
 * @param chord - Tableau de notes de l'accord
 * @returns Couleur à utiliser pour la note
 */
export function getJoinedNotesColor(cord: string, fret: number, scale: string[], chord: string[]): string {
  const { GuitarNote } = useGuitarNotes();
  const noteName = getNoteName(cord, fret);
  const notePC = Note.get(noteName).pc;
  
  if (!notePC) return GuitarNote.defaultColor;
  
  // Vérifier si la note est dans la gamme
  const scaleNotesPCs = scale.map(n => Note.get(n).pc);
  const inScale = scaleNotesPCs.includes(notePC);
  
  // Vérifier si la note est dans l'accord
  const chordNotesPCs = chord.map(n => Note.get(n).pc);
  const inChord = chordNotesPCs.includes(notePC);
  
  // Si la note est dans l'accord mais pas dans la gamme, retourner orange
  if (inChord && !inScale) {
    return [
      "#A65858", // Rouge terne
      "#B87A52", // Orange terne
      "#C2A86B", // Jaune terne
      "#8AAB7A", // Vert terne
      "#6A9096", // Bleu-vert terne
      "#EEEEEE", // Bleu terne
      "#7C6A96", // Indigo terne
      "#936A96"  // Violet terne
    ][chordNotesPCs.indexOf(notePC)]; // Orange
  }
  if (!inScale && !inChord) return GuitarNote.defaultColor;
  if (inScale && !inChord) return GuitarNote.defaultColor;
  // Sinon, utiliser la couleur normale basée sur le degré dans la gamme
  const degree = getNoteDegree(noteName, scale);
  return degree ? GuitarNote.colors[degree - 1] : GuitarNote.defaultColor;
}
/**
 * Détermine le libellé du degré d'une note en tenant compte de son appartenance
 * à la gamme, à l'accord, ou à aucun des deux
 * @param noteName - Nom de la note
 * @param scale - Tableau de notes de la gamme
 * @param chord - Tableau de notes de l'accord
 * @returns Le degré dans la gamme, l'intervalle dans l'accord ou une chaîne vide
 */
export function getJoinedDegree(noteName: string, scale: string[], chord: string[]): string {
  // Normaliser la note pour comparaison (obtenir la classe de hauteur sans octave)
  const notePC = Note.get(noteName).pc;
  if (!notePC) return '';
  
  // Normaliser les notes de gamme et d'accord pour la comparaison
  const scalePCs = scale.map(n => Note.get(n).pc);
  const chordPCs = chord.map(n => Note.get(n).pc);
  
  // Vérifier si la note est dans la gamme
  if (scalePCs.includes(notePC)) {
    // Si la note est dans la gamme, renvoyer son degré
    const degree = getNoteDegree(noteName, scale);
    return degree ? `${degree}°` : '';
  }
  
  // Vérifier si la note est dans l'accord
  if (chordPCs.includes(notePC)) {
    // Si la note est dans l'accord mais pas dans la gamme, renvoyer son intervalle
    // par rapport à la fondamentale de l'accord
    try {
      // Trouver la fondamentale de l'accord (première note)
      const root = chord[0];
      if (!root) return '';
      
      // Calculer l'intervalle
      const interval = Interval.distance(root, noteName);
      return interval;
    } catch (error) {
      console.error("Erreur lors du calcul de l'intervalle:", error);
      return '';
    }
  }
  
  // Si la note n'est ni dans la gamme ni dans l'accord, renvoyer une chaîne vide
  return '';
}

/**
 * Version adaptée pour la guitare - prend la corde et la frette en paramètres
 * @param cord - Corde de la guitare
 * @param fret - Frette de la guitare
 * @param scale - Tableau de notes de la gamme
 * @param chord - Tableau de notes de l'accord
 * @returns Le degré, l'intervalle ou une chaîne vide
 */
export function getJoinedDegreeLabel(cord: string, fret: number, scale: string[], chord: string[]): string {
  const noteName = getNoteName(cord, fret);
  return getJoinedDegree(noteName, scale, chord);
}
