import { Note } from 'tonal';
import eventBus from '../eventBus';
import { SoundFontService, getSharedAudioCtx, resumeSharedAudioCtx } from '../services/SoundFontService';

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
  gain.connect(ctx.destination);
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
  duration = 0.5,
  _type?: OscillatorType,
): Promise<void> {
  const valid = notes
    .filter(n => Note.get(n).midi != null)
    .map(n => (n.match(/\d/) ? n : `${n}4`));

  valid.forEach(emitMidi);

  if (SoundFontService.isReady) {
    await SoundFontService.playFullChord(valid, duration);
    return;
  }

  // Oscillator fallback
  await resumeSharedAudioCtx();
  const ctx = getSharedAudioCtx();
  if (!ctx) return;

  const gain = ctx.createGain();
  gain.gain.value = 0.3 / Math.sqrt(Math.max(valid.length, 1));
  gain.connect(ctx.destination);
  activeGainNodes.push(gain);

  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  valid.forEach(n => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = getFrequency(n);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  });

  setTimeout(() => {
    const i = activeGainNodes.indexOf(gain);
    if (i !== -1) activeGainNodes.splice(i, 1);
  }, duration * 1000);
}
