// src/composables/useAudio.ts
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
  const oscillator = audioCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(audioCtx.destination);
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
  const fifthNote = Interval.transpose(note, 'P5');
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
  for await (const note of notes) {
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
  const promises = notes.map(note => playNote(note, duration, type));
  await Promise.all(promises);
}