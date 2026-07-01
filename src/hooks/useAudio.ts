/**
 * @file useAudio.ts
 * Unified audio facade: delegates to `SoundFontService` (SF2 Web Audio) when the
 * soundfont is loaded, falls back to a simple Web Audio oscillator otherwise.
 *
 * Public API (stable regardless of audio backend):
 * - `playNote(midi, duration?)` — plays a single MIDI pitch.
 * - `playFullChord(midis, durations?)` — plays multiple pitches simultaneously.
 * - `stopAllSounds()` — stops all active audio nodes immediately.
 *
 * `SoundFontService.preload()` is triggered at module import so SF2 loading begins
 * as early as possible (before the user interacts).
 */
import { Note } from 'tonal';
import eventBus from '../eventBus';
import { SoundFontService, getSharedAudioCtx, resumeSharedAudioCtx, getMasterGainNode, setMasterGainValue, getMasterGainValue } from '../services/SoundFontService';

// Kick off SF2 loading immediately
SoundFontService.preload();

// Oscillator fallback (used until SF2 is ready)
let activeGainNodes: GainNode[] = [];

function emitMidi(note: string) {
  const { midi } = Note.get(note);
  if (midi != null) eventBus.emit('notePlayed', midi);
}

function getFrequency(note: string): number {
  const { midi } = Note.get(note);
  return midi != null ? 440 * Math.pow(2, (midi - 69) / 12) : 440;
}

function playOscillator(note: string, duration: number): void {
  const ctx = getSharedAudioCtx();
  if (!ctx) return;

  const gain = ctx.createGain();
  gain.gain.value = 0.3;
  gain.connect(getMasterGainNode() ?? ctx.destination);
  activeGainNodes.push(gain);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = getFrequency(note);
  osc.connect(gain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
  osc.onended = () => {
    const i = activeGainNodes.indexOf(gain);
    if (i !== -1) activeGainNodes.splice(i, 1);
  };
}

export function stopAllSounds() {
  SoundFontService.stopAll();

  const ctx = getSharedAudioCtx();
  const now = ctx?.currentTime ?? 0;
  activeGainNodes.forEach(g => {
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    } catch {}
  });
  activeGainNodes = [];
}

export function setMasterVolume(v: number): void { setMasterGainValue(v); }
export function getMasterVolume(): number { return getMasterGainValue(); }

export async function playNote(
  note: string,
  duration = 0.5,
  _type?: OscillatorType,
  onEnd?: Function,
): Promise<void> {
  emitMidi(note);

  if (SoundFontService.isReady) {
    await SoundFontService.playNote(note, duration);
  } else {
    await resumeSharedAudioCtx();
    playOscillator(note, duration);
  }

  if (onEnd) setTimeout(() => onEnd(), duration * 1000);
}

export async function playChord(
  notes: string[],
  duration = 0.5,
  gap = 0.1,
  _type?: OscillatorType,
): Promise<void> {
  for (const note of notes) {
    await playNote(note, duration);
    await new Promise(r => setTimeout(r, gap * 1000));
  }
}

export async function playFullChord(
  notes: string[],
  duration: number | number[] = 0.5,
  _type?: OscillatorType,
): Promise<void> {
  const noteObjects = notes.map((n, i) => ({
    note: n.match(/\d/) ? n : `${n}4`,
    dur: Array.isArray(duration) ? (duration[i] ?? duration[0] ?? 0.5) : duration
  })).filter(obj => Note.get(obj.note).midi != null);

  if (noteObjects.length === 0) return;

  noteObjects.forEach(obj => emitMidi(obj.note));

  if (SoundFontService.isReady) {
    const validNotes = noteObjects.map(o => o.note);
    const validDurs = noteObjects.map(o => o.dur);
    await SoundFontService.playFullChord(validNotes, validDurs);
    return;
  }

  // Oscillator fallback
  await resumeSharedAudioCtx();
  const ctx = getSharedAudioCtx();
  if (!ctx) return;

  const gVal = 0.3 / Math.sqrt(Math.max(noteObjects.length, 1));

  noteObjects.forEach((obj) => {
    const gain = ctx.createGain();
    gain.gain.value = gVal;
    gain.connect(getMasterGainNode() ?? ctx.destination);
    activeGainNodes.push(gain);

    gain.gain.setValueAtTime(gVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + obj.dur);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = getFrequency(obj.note);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + obj.dur);

    osc.onended = () => {
      const idx = activeGainNodes.indexOf(gain);
      if (idx !== -1) activeGainNodes.splice(idx, 1);
    };
  });
}
