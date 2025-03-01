// src/composables/useAudio.ts mis à jour
import { Note, Interval } from 'tonal';
import eventBus from '../eventBus';

/**
 * Calcule la fréquence d'une note en utilisant la formule basée sur le MIDI.
 * Si la note n'est pas valide, retourne 440 Hz par défaut.
 * @param note - Le nom de la note (ex: "C4", "A#3")
 * @returns La fréquence en Hertz
 */
function getFrequency(note: string): number {
  const noteData = Note.get(note);
  if (noteData.midi != null) {
    const midi = noteData.midi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  } else {
    console.warn(`La note "${note}" est invalide. Utilisation de 440 Hz par défaut.`);
    return 440;
  }
}

/**
 * Joue un son correspondant à la note indiquée.
 * @param note - Le nom de la note (ex: "C4")
 * @param duration - Durée du son en secondes (0.5 par défaut)
 * @param type - Type d'onde (sine, square, sawtooth, triangle)
 * @param onEnd - Callback optionnel déclenché à la fin du son
 * @returns Une promesse résolue lorsque la note est terminée.
 */
export async function playNote(
  note: string,
  duration: number = 0.5,
  type: OscillatorType = 'sine',
  onEnd?: Function,
): Promise<void> {
  const noteData = Note.get(note);
  const frequency = getFrequency(note);
  
  // Émet l'événement pour signaler que cette note est jouée (si le MIDI est défini)
  if (noteData.midi != null) {
    eventBus.emit('notePlayed', noteData.midi);
  }
  
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) {
    console.warn("Le Web Audio API n'est pas supporté par ce navigateur.");
    return;
  }
  const audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  // Ajouter un gain pour contrôler le volume
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.3; // Réduire le volume pour éviter la distorsion
  gainNode.connect(audioCtx.destination);
  
  const oscillator = audioCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
  
  return new Promise((resolve) => {
    oscillator.onended = () => {
      audioCtx.close();
      if (onEnd) onEnd();
      resolve();
    };
  });
}

/**
 * Joue la quinte parfaite de la note indiquée.
 * La quinte est calculée en transposant la note de l'intervalle "P5".
 * @param note - Le nom de la note (ex: "C4")
 * @param duration - Durée du son en secondes (0.5 par défaut)
 * @param type - Type d'onde
 * @returns Une promesse résolue lorsque la quinte est jouée.
 */
export async function playFifth(
  note: string,
  duration: number = 0.5,
  type: OscillatorType = 'sine'
): Promise<void> {
  const fifthNote = Note.transpose(note, 'P5');
  return playNote(fifthNote, duration, type);
}

/**
 * Joue une séquence de notes (un accord ou une mélodie) de manière séquentielle.
 * Chaque note est jouée et on attend qu'elle soit terminée, puis on attend un gap avant de lancer la suivante.
 * @param notes - Tableau de noms de notes (ex: ["C4", "E4", "G4"])
 * @param duration - Durée du son pour chaque note (0.5 par défaut)
 * @param gap - Écart entre la fin d'une note et le début de la suivante en secondes (0.1 par défaut)
 * @param type - Type d'onde
 * @returns Une promesse résolue lorsque toutes les notes sont jouées.
 */
export async function playChord(
  notes: string[],
  duration: number = 0.5,
  gap: number = 0.1,
  type: OscillatorType = 'sine'
): Promise<void> {
  const validNotes = notes.filter(note => {
    try {
      Note.get(note); // Valider la note
      return true;
    } catch (error) {
      console.warn(`Note invalide ignorée: ${note}`);
      return false;
    }
  });
  
  for await (const note of validNotes) {
    await playNote(note, duration, type);
    // Attendre le gap avant de lancer la note suivante
    await new Promise(resolve => setTimeout(resolve, gap * 1000));
  }
}

/**
 * Joue simultanément toutes les notes d'un accord.
 * @param notes - Tableau de noms de notes (ex: ["C4", "E4", "G4"])
 * @param duration - Durée du son pour chaque note (0.5 par défaut)
 * @param type - Type d'onde
 * @returns Une promesse résolue lorsque toutes les notes sont jouées simultanément.
 */
export async function playFullChord(
  notes: string[],
  duration: number = 0.5,
  type: OscillatorType = 'sine'
): Promise<void> {
  // Filtrer les notes invalides pour éviter les erreurs
  const validNotes = notes.filter(note => {
    try {
      const noteObj = Note.get(note);
      return noteObj.midi !== null;
    } catch (error) {
      console.warn(`Note invalide ignorée: ${note}`);
      return false;
    }
  });
  
  // S'assurer que toutes les notes ont une octave
  const normalizedNotes = validNotes.map(note => {
    if (!note.match(/\d/)) {
      return `${note}4`; // Ajouter l'octave 4 par défaut si manquante
    }
    return note;
  });
  
  // Utiliser l'API AudioContext
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) {
    console.warn("Le Web Audio API n'est pas supporté par ce navigateur.");
    return Promise.resolve();
  }
  
  const audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  // Créer un nœud de gain commun pour toutes les oscillations
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.3 / Math.sqrt(normalizedNotes.length); // Réduire le volume en fonction du nombre de notes
  gainNode.connect(audioCtx.destination);
  
  // Mettre un léger fade-out pour éviter les clics
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  // Créer des oscillateurs pour chaque note
  const oscillators = normalizedNotes.map(note => {
    const frequency = getFrequency(note);
    const oscillator = audioCtx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    
    // Émettre l'événement pour la visualisation
    const noteData = Note.get(note);
    if (noteData.midi !== null) {
      eventBus.emit('notePlayed', noteData.midi);
    }
    
    return oscillator;
  });
  
  // Démarrer tous les oscillateurs
  oscillators.forEach(osc => osc.start());
  
  // Arrêter tous les oscillateurs après la durée spécifiée
  oscillators.forEach(osc => osc.stop(audioCtx.currentTime + duration));
  
  // Attendre que toutes les notes soient terminées
  return new Promise((resolve) => {
    setTimeout(() => {
      audioCtx.close();
      resolve();
    }, duration * 1000);
  });
}