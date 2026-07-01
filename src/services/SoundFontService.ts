import { Note } from 'tonal';
import { PreferencesService } from './PreferencesService';

// ── Types SF2 ─────────────────────────────────────────────────────────────────

interface ShdrEntry {
  start: number;
  end: number;
  startLoop: number;
  endLoop: number;
  sampleRate: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleType: number;
}

interface SmplChunk { offset: number; size: number }

interface KeyZone {
  keyLow: number;
  keyHigh: number;
  velLow: number;
  velHigh: number;
  sampleIdx: number;
  overridingRootKey: number; // sfGenOper=58 ; -1 = use shdr.originalPitch
  coarseTune: number;        // sfGenOper=51 ; semitones offset
  fineTune: number;          // sfGenOper=52 ; cents offset
}

// ── Parser SF2 complet ────────────────────────────────────────────────────────

interface ParsedSF2 {
  smpl: SmplChunk;
  shdrs: ShdrEntry[];
  presetZones: Map<string, KeyZone[]>; // "${bank}:${preset}" → zones
}

function parseSF2(buffer: ArrayBuffer): ParsedSF2 {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const fcc = (off: number) =>
    String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);

  if (fcc(0) !== 'RIFF' || fcc(8) !== 'sfbk') throw new Error('Not a valid SF2 file');

  // Chunk registry
  const chunks = new Map<string, { offset: number; size: number }>();

  function walk(start: number, end: number) {
    let pos = start;
    while (pos + 8 <= end) {
      const id = fcc(pos);
      const size = view.getUint32(pos + 4, true);
      const data = pos + 8;
      if (id === 'LIST') walk(data + 4, data + size);
      else chunks.set(id, { offset: data, size });
      pos += 8 + size + (size & 1);
    }
  }
  walk(12, buffer.byteLength);

  const req = (id: string) => {
    const c = chunks.get(id);
    if (!c) throw new Error(`SF2 missing chunk: ${id}`);
    return c;
  };

  const smplChunk = req('smpl');
  const shdrChunk = req('shdr');
  const phdrChunk = req('phdr');
  const pbagChunk = req('pbag');
  const pgenChunk = req('pgen');
  const instChunk = req('inst');
  const ibagChunk = req('ibag');
  const igenChunk = req('igen');

  // ── Parse SHDR (46 bytes) ──────────────────────────────────────────────────
  const SHDR = 46;
  const shdrCount = Math.floor(shdrChunk.size / SHDR) - 1; // skip EOS terminal
  const shdrs: ShdrEntry[] = [];
  for (let i = 0; i < shdrCount; i++) {
    const b = shdrChunk.offset + i * SHDR;
    shdrs.push({
      start:          view.getUint32(b + 20, true),
      end:            view.getUint32(b + 24, true),
      startLoop:      view.getUint32(b + 28, true),
      endLoop:        view.getUint32(b + 32, true),
      sampleRate:     view.getUint32(b + 36, true),
      originalPitch:  view.getUint8(b + 40),
      pitchCorrection: view.getInt8(b + 41),
      sampleType:     view.getUint16(b + 44, true),
    });
  }

  // ── Parse PHDR (38 bytes) ──────────────────────────────────────────────────
  const PHDR = 38;
  const phdrCount = Math.floor(phdrChunk.size / PHDR); // includes EOP terminal
  const phdrs: Array<{ preset: number; bank: number; bagNdx: number }> = [];
  for (let i = 0; i < phdrCount; i++) {
    const b = phdrChunk.offset + i * PHDR;
    phdrs.push({
      preset: view.getUint16(b + 20, true),
      bank:   view.getUint16(b + 22, true),
      bagNdx: view.getUint16(b + 24, true),
    });
  }

  // ── Parse PBAG (4 bytes) ───────────────────────────────────────────────────
  const pbagCount = Math.floor(pbagChunk.size / 4);
  const pbags: Array<{ genNdx: number }> = [];
  for (let i = 0; i < pbagCount; i++) {
    const b = pbagChunk.offset + i * 4;
    pbags.push({ genNdx: view.getUint16(b, true) });
  }

  // ── Parse PGEN (4 bytes) ───────────────────────────────────────────────────
  const pgenCount = Math.floor(pgenChunk.size / 4);
  const pgens: Array<{ oper: number; amountU16: number }> = [];
  for (let i = 0; i < pgenCount; i++) {
    const b = pgenChunk.offset + i * 4;
    pgens.push({ oper: view.getUint16(b, true), amountU16: view.getUint16(b + 2, true) });
  }

  // ── Parse INST (22 bytes) ──────────────────────────────────────────────────
  const INST = 22;
  const instCount = Math.floor(instChunk.size / INST);
  const insts: Array<{ bagNdx: number }> = [];
  for (let i = 0; i < instCount; i++) {
    const b = instChunk.offset + i * INST;
    insts.push({ bagNdx: view.getUint16(b + 20, true) });
  }

  // ── Parse IBAG (4 bytes) ───────────────────────────────────────────────────
  const ibagCount = Math.floor(ibagChunk.size / 4);
  const ibags: Array<{ genNdx: number }> = [];
  for (let i = 0; i < ibagCount; i++) {
    const b = ibagChunk.offset + i * 4;
    ibags.push({ genNdx: view.getUint16(b, true) });
  }

  // ── Parse IGEN (4 bytes) ───────────────────────────────────────────────────
  const igenCount = Math.floor(igenChunk.size / 4);
  const igens: Array<{ oper: number; low: number; high: number; amountU16: number }> = [];
  for (let i = 0; i < igenCount; i++) {
    const b = igenChunk.offset + i * 4;
    igens.push({
      oper: view.getUint16(b, true),
      low:  bytes[b + 2],
      high: bytes[b + 3],
      amountU16: view.getUint16(b + 2, true),
    });
  }

  // ── Build preset zones map ─────────────────────────────────────────────────
  const presetZones = new Map<string, KeyZone[]>();

  for (let pi = 0; pi < phdrs.length - 1; pi++) {
    const ph = phdrs[pi];
    const zones: KeyZone[] = [];

    const bagStart = ph.bagNdx;
    const bagEnd   = phdrs[pi + 1].bagNdx;

    for (let bi = bagStart; bi < bagEnd && bi + 1 < pbags.length; bi++) {
      const genStart = pbags[bi].genNdx;
      const genEnd   = pbags[bi + 1]?.genNdx ?? pgenCount;

      // Collect instrument index from PGEN (oper=41)
      for (let gi = genStart; gi < genEnd; gi++) {
        if (pgens[gi].oper !== 41) continue;
        const instIdx = pgens[gi].amountU16;
        if (instIdx >= insts.length - 1) continue;

        const ibagStart = insts[instIdx].bagNdx;
        const ibagEnd   = insts[instIdx + 1].bagNdx;

        for (let ibi = ibagStart; ibi < ibagEnd && ibi + 1 < ibags.length; ibi++) {
          const igenStart = ibags[ibi].genNdx;
          const igenEnd   = ibags[ibi + 1]?.genNdx ?? igenCount;

          let keyLow = 0, keyHigh = 127;
          let velLow = 0, velHigh = 127;
          let sampleIdx = -1;
          let overridingRootKey = -1;
          let coarseTune = 0;
          let fineTune = 0;

          for (let igi = igenStart; igi < igenEnd; igi++) {
            const ig = igens[igi];
            if      (ig.oper === 43) { keyLow = ig.low; keyHigh = ig.high; }
            else if (ig.oper === 44) { velLow = ig.low; velHigh = ig.high; }
            else if (ig.oper === 51) { coarseTune = (ig.low | (ig.high << 8)) << 16 >> 16; }
            else if (ig.oper === 52) { fineTune   = (ig.low | (ig.high << 8)) << 16 >> 16; }
            else if (ig.oper === 53) { sampleIdx = ig.amountU16; }
            else if (ig.oper === 58) { overridingRootKey = ig.low; }
          }

          if (sampleIdx >= 0 && sampleIdx < shdrs.length) {
            zones.push({ keyLow, keyHigh, velLow, velHigh, sampleIdx, overridingRootKey, coarseTune, fineTune });
          }
        }
      }
    }

    presetZones.set(`${ph.bank}:${ph.preset}`, zones);
  }

  return { smpl: smplChunk, shdrs, presetZones };
}

// ── Shared AudioContext ───────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

export function getSharedAudioCtx(): AudioContext | null {
  if (!_ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) _ctx = new AC();
  }
  return _ctx;
}

export async function resumeSharedAudioCtx(): Promise<void> {
  const ctx = getSharedAudioCtx();
  if (ctx?.state === 'suspended') await ctx.resume();
}

// ── SoundFont Service ─────────────────────────────────────────────────────────

interface SampleData {
  buffer: AudioBuffer;
  shdr: ShdrEntry;
  rootMidi: number;   // effective root — overridingRootKey ?? shdr.originalPitch (255 → 60)
  coarseTune: number; // sfGenOper=51, semitones
  fineTune: number;   // sfGenOper=52, cents
}

interface ActiveVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const SF2_PATH = '/Studio%20FG460s%20II%20Pro%20Guitar%20Pack.sf2';

class SoundFontServiceClass {
  // Raw parsed data (kept for preset switching without re-fetch)
  private rawBuffer: ArrayBuffer | null = null;
  private allShdrs: ShdrEntry[] = [];
  private smplChunk: SmplChunk | null = null;
  private presetZones = new Map<string, KeyZone[]>();
  private audioBufferCache = new Map<number, AudioBuffer>(); // sampleIdx → AudioBuffer

  // Active preset state
  private samples = new Map<number, SampleData>(); // MIDI note → sample
  private pendingPreset: { bank: number; preset: number };
  private _ready = false;
  private failed = false;
  private loadPromise: Promise<void> | null = null;
  private voices: Set<ActiveVoice> = new Set();

  constructor() {
    const stored = PreferencesService.get<{ bank: number; preset: number }>(
      'selectedGuitar',
      { bank: 0, preset: 0 },
    );
    this.pendingPreset = { bank: stored.bank ?? 0, preset: stored.preset ?? 0 };
  }

  get isReady() { return this._ready; }

  preload(): void {
    if (!this.loadPromise && !this.failed) this.loadPromise = this._load();
  }

  setPreset(bank: number, preset: number): void {
    this.pendingPreset = { bank, preset };
    if (this.rawBuffer) {
      this.stopAll();
      this._buildSamplesForPreset(bank, preset);
    }
    // If not loaded yet, pendingPreset will be applied when _load() completes
  }

  private async _load(): Promise<void> {
    try {
      const res = await fetch(SF2_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.rawBuffer = await res.arrayBuffer();

      const parsed = parseSF2(this.rawBuffer);
      this.allShdrs = parsed.shdrs;
      this.smplChunk = parsed.smpl;
      this.presetZones = parsed.presetZones;

      this._buildSamplesForPreset(this.pendingPreset.bank, this.pendingPreset.preset);
      console.log(`[SF2] Loaded — ${parsed.presetZones.size} presets parsed`);
    } catch (e) {
      console.warn('[SF2] Load failed, using oscillator fallback:', e);
      this.failed = true;
    }
  }

  private getOrCreateAudioBuffer(sampleIdx: number): AudioBuffer | null {
    if (this.audioBufferCache.has(sampleIdx)) return this.audioBufferCache.get(sampleIdx)!;

    const ctx = getSharedAudioCtx();
    const shdr = this.allShdrs[sampleIdx];
    const smpl = this.smplChunk;
    if (!ctx || !shdr || !smpl || !this.rawBuffer) return null;

    const len = shdr.end - shdr.start;
    if (len <= 0 || len > 44100 * 20) return null;

    const view = new DataView(this.rawBuffer);
    const ab = ctx.createBuffer(1, len, shdr.sampleRate);
    const ch = ab.getChannelData(0);
    const base = smpl.offset + shdr.start * 2;
    for (let i = 0; i < len; i++) ch[i] = view.getInt16(base + i * 2, true) / 32768;

    this.audioBufferCache.set(sampleIdx, ab);
    return ab;
  }

  private _buildSamplesForPreset(bank: number, preset: number): void {
    const key = `${bank}:${preset}`;
    const zones = this.presetZones.get(key);

    if (!zones || zones.length === 0) {
      // Fallback: use originalPitch from all shdrs (guitar range)
      this._buildFallbackSamples();
      return;
    }

    // For each MIDI note 21–108, find the best zone (prefer highest velHigh → loudest layer)
    const newSamples = new Map<number, SampleData>();

    for (let midi = 21; midi <= 108; midi++) {
      let bestZone: KeyZone | null = null;
      let bestVelHigh = -1;
      for (const z of zones) {
        if (midi >= z.keyLow && midi <= z.keyHigh && z.velHigh > bestVelHigh) {
          bestVelHigh = z.velHigh;
          bestZone = z;
        }
      }
      if (!bestZone) continue;

      const buf = this.getOrCreateAudioBuffer(bestZone.sampleIdx);
      if (buf) {
        const shdr = this.allShdrs[bestZone.sampleIdx];
        const rootMidi =
          bestZone.overridingRootKey >= 0 ? bestZone.overridingRootKey :
          shdr.originalPitch < 128       ? shdr.originalPitch : 60;
        newSamples.set(midi, { buffer: buf, shdr, rootMidi, coarseTune: bestZone.coarseTune, fineTune: bestZone.fineTune });
      }
    }

    // Fill gaps: any uncovered MIDI note gets the closest covered neighbor
    for (let midi = 21; midi <= 108; midi++) {
      if (newSamples.has(midi)) continue;
      let best: SampleData | null = null;
      let bestDist = Infinity;
      for (const [m, d] of newSamples) {
        const dist = Math.abs(m - midi);
        if (dist < bestDist) { bestDist = dist; best = d; }
      }
      if (best) newSamples.set(midi, best);
    }

    this.samples = newSamples;
    this._ready = true;
    console.log(`[SF2] Preset ${key} → ${newSamples.size} notes, ${zones.length} zones`);
  }

  // Used when preset zones are empty (shouldn't normally happen)
  private _buildFallbackSamples(): void {
    const byPitch = new Map<number, number>(); // originalPitch → sampleIdx
    for (let i = 0; i < this.allShdrs.length; i++) {
      const s = this.allShdrs[i];
      if (s.originalPitch < 36 || s.originalPitch > 96) continue;
      if (!byPitch.has(s.originalPitch) || s.sampleType === 1) byPitch.set(s.originalPitch, i);
    }

    const newSamples = new Map<number, SampleData>();
    for (const [pitch, idx] of byPitch) {
      const buf = this.getOrCreateAudioBuffer(idx);
      const shdr = this.allShdrs[idx];
      if (buf) newSamples.set(pitch, { buffer: buf, shdr, rootMidi: pitch, coarseTune: 0, fineTune: 0 });
    }
    this.samples = newSamples;
    this._ready = newSamples.size > 0;
  }

  private findSample(midi: number): SampleData | null {
    // Direct lookup first (zone-based map has entry per note)
    const direct = this.samples.get(midi);
    if (direct) return direct;
    // Fallback: find closest
    let best: SampleData | null = null;
    let bestD = Infinity;
    for (const [m, d] of this.samples) {
      const dist = Math.abs(m - midi);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  private trigger(midi: number, duration: number, gainVal: number): void {
    const ctx = getSharedAudioCtx();
    if (!ctx) return;
    const data = this.findSample(midi);
    if (!data) return;

    const { buffer, shdr, rootMidi, coarseTune, fineTune } = data;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.connect(ctx.destination);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = Math.pow(
      2,
      (midi - rootMidi + coarseTune) / 12 + (shdr.pitchCorrection + fineTune) / 1200,
    );

    if (shdr.endLoop > shdr.startLoop + 32) {
      src.loop = true;
      src.loopStart = (shdr.startLoop - shdr.start) / shdr.sampleRate;
      src.loopEnd   = (shdr.endLoop   - shdr.start) / shdr.sampleRate;
    }

    src.connect(gain);
    src.start(ctx.currentTime);

    const rel = Math.min(duration * 0.3, 0.5);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration + rel);
    src.stop(ctx.currentTime + duration + rel + 0.05);

    const voice: ActiveVoice = { source: src, gain };
    this.voices.add(voice);
    src.onended = () => this.voices.delete(voice);
  }

  async playNote(note: string, duration = 0.5): Promise<void> {
    await resumeSharedAudioCtx();
    const { midi } = Note.get(note);
    if (midi == null) return;
    this.trigger(midi, duration, 0.8);
  }

  async playFullChord(notes: string[], duration: number | number[] = 0.5): Promise<void> {
    await resumeSharedAudioCtx();
    const g = 0.8 / Math.sqrt(Math.max(notes.length, 1));
    notes.forEach((note, i) => {
      const { midi } = Note.get(note);
      const dur = Array.isArray(duration) ? (duration[i] ?? duration[0] ?? 0.5) : duration;
      if (midi != null) this.trigger(midi, dur, g);
    });
  }

  stopAll(): void {
    const ctx = getSharedAudioCtx();
    const now = ctx?.currentTime ?? 0;
    for (const v of this.voices) {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(v.gain.gain.value, now);
        v.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        v.source.stop(now + 0.05);
      } catch {}
    }
    this.voices.clear();
  }
}

export const SoundFontService = new SoundFontServiceClass();
