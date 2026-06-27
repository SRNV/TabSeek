// src/composables/useAudio.ts mis à jour
import { Note, Interval } from 'tonal';
import eventBus from '../eventBus';

let sharedAudioCtx: AudioContext | null = null;
let activeGainNodes: GainNode[] = [];

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  return sharedAudioCtx;
}

export function stopAllSounds() {
  if (sharedAudioCtx) {
    const now = sharedAudioCtx.currentTime;
    activeGainNodes.forEach(gainNode => {
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      } catch (e) {}
    });
  }
  activeGainNodes = [];
}

/**
 * Calcule la fréquence d'une note en utilisant la formule basée sur le MIDI.
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
 */
export async function playNote(
  note: string,
  duration: number = 0.5,
  type: OscillatorType = 'sine',
  onEnd?: Function,
): Promise<void> {
  const noteData = Note.get(note);
  const frequency = getFrequency(note);
  
  if (noteData.midi != null) {
    eventBus.emit('notePlayed', noteData.midi);
  }
  
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.3; 
  gainNode.connect(audioCtx.destination);
  activeGainNodes.push(gainNode);
  
  const oscillator = audioCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
  
  oscillator.onended = () => {
    const idx = activeGainNodes.indexOf(gainNode);
    if (idx !== -1) activeGainNodes.splice(idx, 1);
    if (onEnd) onEnd();
  };
}

/**
 * Joue une séquence de notes (un accord ou une mélodie) de manière séquentielle.
 */
export async function playChord(
  notes: string[],
  duration: number = 0.5,
  gap: number = 0.1,
  type: OscillatorType = 'sine'
): Promise<void> {
  const validNotes = notes.filter(note => {
    try {
      Note.get(note);
      return true;
    } catch (error) {
      return false;
    }
  });
  
  for (const note of validNotes) {
    playNote(note, duration, type);
    await new Promise(resolve => setTimeout(resolve, gap * 1000));
  }
}

/**
 * Joue simultanément toutes les notes d'un accord.
 */
export async function playFullChord(
  notes: string[],
  duration: number = 0.5,
  type: OscillatorType = 'sine'
): Promise<void> {
  const validNotes = notes.filter(note => {
    try {
      const noteObj = Note.get(note);
      return noteObj.midi !== null;
    } catch (error) {
      return false;
    }
  });
  
  const normalizedNotes = validNotes.map(note => {
    if (!note.match(/\d/)) {
      return `${note}4`;
    }
    return note;
  });
  
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.3 / Math.sqrt(normalizedNotes.length); 
  gainNode.connect(audioCtx.destination);
  activeGainNodes.push(gainNode);
  
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  normalizedNotes.forEach(note => {
    const frequency = getFrequency(note);
    const oscillator = audioCtx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    
    const noteData = Note.get(note);
    if (noteData.midi !== null) {
      eventBus.emit('notePlayed', noteData.midi);
    }
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  });
  
  setTimeout(() => {
    const idx = activeGainNodes.indexOf(gainNode);
    if (idx !== -1) activeGainNodes.splice(idx, 1);
  }, duration * 1000);
}
