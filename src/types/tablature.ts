/**
 * @file tablature.ts
 * Core domain types for the TabSeek editor.
 * 
 * Centralizing these types here prevents circular dependencies between stores,
 * services, and components.
 */

import * as THREE from 'three'

export type LegatoBehavior =
  // ── Chromatique ─────────────────────────────────────────────────────────────
  | 'chromatique'       // tous les demi-tons
  // ── Diatoniques ─────────────────────────────────────────────────────────────
  | 'gamme'             // tous les degrés de la gamme (diatonique par secondes)
  | 'tierces'           // sauts de tierce depuis la position source dans la gamme
  | 'quartes'           // sauts de quarte diatonique
  | 'quintes'           // sauts de quinte diatonique
  | 'sixtes'            // sauts de sixte diatonique
  | 'septiemes'         // sauts de septième diatonique
  | 'octaves'           // uniquement la classe de hauteur source (octaves pures)
  // ── Approches (jazz/blues) ───────────────────────────────────────────────────
  | 'approche'          // gamme + ½ ton chromatique DU DESSOUS pour chaque degré
  | 'approche_dessus'   // gamme + ½ ton chromatique DU DESSUS pour chaque degré
  | 'encerclement'      // gamme + ½ ton dessus ET dessous → encircling bebop
  | 'double_chroma'     // gamme + deux demi-tons DU DESSOUS (Parker double chromatic)
  // ── Arpèges ──────────────────────────────────────────────────────────────────
  | 'triade'            // accord de trois sons diatonique (I,III,V)
  | 'arp7'              // arpège de septième diatonique (I,III,V,VII)
  // ── Pentatoniques ────────────────────────────────────────────────────────────
  | 'pentatonique'      // pentatonique MAJEURE degrés I,II,III,V,VI
  | 'penta_min'         // pentatonique MINEURE degrés I,b3,IV,V,b7 — rock/blues
  // ── Gammes spéciales ─────────────────────────────────────────────────────────
  | 'blues'             // gamme blues mineure (I,b3,IV,b5,V,b7)
  | 'bebop'             // gamme majeure bébop (+ b6 passing tone entre V et VI)
  | 'bebop_dominant'    // gamme bébop dominante (majeure + b7 passing tone)
  | 'harmonique'        // gamme mineure harmonique (mineure naturelle + VII maj)
  | 'melodique'         // gamme mineure mélodique jazz (1,2,b3,4,5,6,7)
  | 'altere'            // gamme altérée / super-locrienne — sur V7alt (1,b9,#9,3,b5,b13,b7)
  | 'whole-tone'        // gamme par tons entiers
  | 'diminished'        // gamme octatonique (demi-ton/ton)
  // ── Libre ────────────────────────────────────────────────────────────────────
  | 'free'              // interpolation linéaire libre

export interface TablatureNote {
  id: string
  string: number    // 0 = low E … 5 = high e
  startBeat: number
  duration: number
  fret: number
  legatoNext?: string   // ID of the destination note
  legatoPrev?: string
  legatoCount?: number  // Number of intermediate chromatic notes
  legatoBehavior?: LegatoBehavior
  intermediateNoteIds?: string[] // IDs of generated notes
  legatoRatio?: { t: number; stringT: number } // Position relative to source/dest
  legatoAuto?: boolean     // If true, moving source/dest moves intermediate notes (default true)
  legatoChain?: boolean    // If true, moving an intermediate note syncs the following ones (default false)
  legatoOvershoot?: boolean // When true, candidates extend beyond [src, dest] — amplitude is auto-computed
}

export interface ChordGroup {
  id: string
  noteIds: string[]
  chordName: string   // e.g. "Cmaj7", "Am", "G7"
}

export interface ProgressionGroup {
  id: string
  chordGroupIds: string[]
  name: string
}

export type RhythmModifierMode = 'proportional' | 'extended'

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'downup'

export interface LegatoChain {
  baseNoteId: string
  extras: string[]
  origRange: { startBeat: number; duration: number }
}

export interface RhythmModifier {
  id: string
  kind?: 'rhythm' | 'arpeggio'  // defaults to 'rhythm' when absent
  targetType: 'note' | 'chord' | 'progression'
  targetId: string      // noteId, chordGroupId, or progressionGroupId
  patternName: string   // Reference to rhythmPatterns (unused for kind='arpeggio')
  activeTracks: string[] // e.g. ["kick", "snare"]
  mode: RhythmModifierMode
  enabled: boolean
  fillGaps?: boolean    // stretch each virtual note to the next onset (no silence between notes)
  stringTrackOverrides?: Record<string, string>  // noteId -> track.part ('__all__' = merged default)
  arpeggioDirection?: ArpeggioDirection   // kind='arpeggio' only
  arpeggioNoteCount?: number              // kind='arpeggio' only
  arpeggioOrigNotes?: { string: number; fret: number; startBeat: number; duration: number }[]  // simultaneous chord notes removed by the arpeggio, restored on dematerialize
  legato?: boolean      // materialize sub-notes as real legato notes (source → intermediates → dest)
  // Single-chain fields — used for targetType='note' (one base note, one chain).
  legatoBaseNoteId?: string  // ID of the base note that was used as legato source (reliable across chord lookups)
  legatoExtras?: string[]  // IDs of materialized notes (dest + intermediates), excluding the base note
  legatoOrigRange?: { startBeat: number; duration: number }  // base note range before legato was applied
  // Multi-chain fields — used for targetType='chord': every note of the chord gets its own
  // independent materialized chain (not just the root), so the rhythm applies to the whole chord.
  legatoChains?: LegatoChain[]
}

export interface ModeZone {
  id: string
  startBeat: number
  length: number      // in measures (1 = one measure); >= 0.125
  modeName: string   // references EXTRA_MODES (data/extraModes.ts) by .name
  forceNote: boolean
  color: string       // hex chosen by the user, drives the measure-tint gradient
}

export const MODE_ZONE_MIN_LENGTH = 0.125 // 1/8 of a measure — hard floor when resizing

export interface Voicing { si: number; fret: number }

export type ClipNote  = Pick<TablatureNote, 'string'|'fret'|'duration'> & { startBeat: number }
export type ClipGroup = { noteIndices: number[]; chordName: string }
export type ClipData  = { notes: ClipNote[]; groups: ClipGroup[] }

export interface RibbonWaypoint {
  x: number
  y: number
  z?: number
  color: THREE.Color
}

export type ChordProgression = {
  name: string;
  numerals: string;
  description: string;
  compatibleModes: string[];
  examples?: string[];
  _chordType?: string;
};

export type ChordChart = {
  name: string;
  genre: string[];
  structure: string;
  description: string;
  chords: {
    majorKey?: string;
    minorKey?: string;
  };
  examples: string[];
  variations?: string[];
};

export type RhythmTrack = {
  part: string
  steps: number[]
  division: string
  tonal?: string
}

export type RhythmPatternDef = {
  name: string
  emoji?: string
  description: string
  timeSignature: string
  tempo: { min: number; max: number; typical: number }
  feel: string
  bars: number
  tracks: RhythmTrack[]
  compatibleGenres: string[]
  examples?: string[]
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

export interface ChordsCompleteDef {
  id: string;
  name: string;
  symbol: string;
  alt: string[];
  description: string;
  lickDescription: string;
  arpegeDescription: string;
  riffDescription: string;
  intervals: string[];
}
