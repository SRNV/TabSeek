// src/data/rhythmPatterns.ts
//
// Patterns rythmiques définis via l'API Tonal.js :
//   RhythmPattern.euclid(n, k)  → rythme euclidien : n steps, k onsets
//   RhythmPattern.hex(str)      → pattern depuis représentation hexadécimale
//   RhythmPattern.binary(num)   → pattern depuis représentation binaire
//   RhythmPattern.rotate(p, n)  → rotation circulaire du pattern
//   DurationValue.get(name)     → valeur académique d'une durée
//   TimeSignature.get(name)     → métadonnées d'une signature rythmique

import { RhythmPattern, DurationValue, TimeSignature } from 'tonal'
import type { RhythmTrack, RhythmPatternDef } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/** Applique des vélocités sur un pattern 0/1 de Tonal. */
function withVelocity(pattern: number[], velocity = 0.8): number[] {
  return pattern.map(hit => hit * velocity)
}

/** Accents forts sur les hits du pattern, plus doux sur les autres. */
function withAccents(pattern: number[], accentIndices: number[], accentVel = 1.0, normalVel = 0.7): number[] {
  return pattern.map((hit, i) => hit === 0 ? 0 : accentIndices.includes(i) ? accentVel : normalVel)
}

/**
 * Retourne les événements d'un track sous forme d'objets {stepIndex, velocity}
 * pour faciliter la lecture en dehors de Tonal.
 */
export function getOnsets(pattern: RhythmPatternDef, partName: string): { step: number; velocity: number }[] {
  const track = pattern.tracks.find(t => t.part === partName)
  if (!track) return []
  return track.steps
    .map((vel, i) => vel > 0 ? { step: i, velocity: vel } : null)
    .filter((e): e is { step: number; velocity: number } => e !== null)
}

/**
 * Retourne les silences d'un track.
 */
export function getRests(pattern: RhythmPatternDef, partName: string): number[] {
  const track = pattern.tracks.find(t => t.part === partName)
  if (!track) return []
  return track.steps.reduce<number[]>((acc, vel, i) => { if (vel === 0) acc.push(i); return acc }, [])
}

/**
 * Retourne les métadonnées Tonal de la signature rythmique.
 * Ex: { type: 'simple', upper: 4, lower: 4 }
 */
export function getTimeSignatureInfo(pattern: RhythmPatternDef) {
  return TimeSignature.get(pattern.timeSignature)
}

/**
 * Retourne les métadonnées Tonal de la durée d'un step.
 * Ex: { fraction: [1,8], value: 0.125, shorthand: 'e' }
 */
export function getStepDurationInfo(pattern: RhythmPatternDef, partName: string) {
  const track = pattern.tracks.find(t => t.part === partName)
  if (!track) return null
  return DurationValue.get(
    track.division === 'e' ? 'eighth' :
    track.division === 's' ? 'sixteenth' :
    track.division === 'q' ? 'quarter' :
    track.division === 't' ? 'thirty-second' : 'eighth'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Patterns
// ─────────────────────────────────────────────────────────────────────────────

export const rhythmPatterns: RhythmPatternDef[] = [

  // ═══════════════════════════════════════════════════════
  // ROCK / POP
  // ═══════════════════════════════════════════════════════

  {
    name: "Basic Rock",
    emoji: ':guitar:',
    description: "Le beat rock fondamental. Grosse caisse sur 1 et 3 (euclid 2/8), caisse claire sur 2 et 4 (rotation de 2), charleston en croches continues. Omniprésent depuis les années 50.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 200, typical: 120 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // euclid(8, 2) = [1,0,0,0,1,0,0,0] — 2 onsets sur 8 croches
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2)"
      },
      {
        part: 'snare',
        // rotate(euclid(8,2), 2) = [0,0,1,0,0,0,1,0] — croches 2 et 4
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)"
      },
      {
        part: 'hihat',
        // euclid(8, 8) = toutes les croches
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8)"
      },
    ],
    compatibleGenres: ["Rock", "Pop", "Punk", "Alternative"],
    examples: ["Johnny B. Goode (Chuck Berry)", "Smells Like Teen Spirit (Nirvana)"],
  },

  {
    name: "Hard Rock",
    emoji: ':metal:',
    description: "Beat rock puissant avec doubles frappes de grosse caisse en double-croches. Snare sur 2 et 4. Charleston fermé sur les doubles-croches.",
    timeSignature: '4/4',
    tempo: { min: 110, max: 200, typical: 140 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // hex 'A8' = 1010 1000 = doubles sur beat 1, puis beat 3
        steps: withAccents(RhythmPattern.hex('A8'), [0, 4], 1.0, 0.7),
        division: 's',
        tonal: "RhythmPattern.hex('A8') // 10101000 — doubles croches 1, 1e, 3, 3e"
      },
      {
        part: 'snare',
        // euclid(8,2) rotate 2 → [0,0,1,0,0,0,1,0] en croches = [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] en DC
        steps: [0,0,0,0, 1.0,0,0,0, 0,0,0,0, 1.0,0,0,0],
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(16, 8), 0.7), // croches en DC
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8)"
      },
    ],
    compatibleGenres: ["Hard Rock", "Metal", "Punk"],
    examples: ["Back in Black (AC/DC)", "Enter Sandman (Metallica)"],
  },

  {
    name: "Half-Time",
    emoji: ':drum:',
    description: "La caisse claire tombe uniquement sur le temps 3 (euclid 16/1 rotate 8), donnant une sensation de demi-vitesse. Signature du hip-hop et du rock alternatif contemporain.",
    timeSignature: '4/4',
    tempo: { min: 70, max: 140, typical: 90 },
    feel: 'half-time',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents([1,0,0,0, 0,0,0.7,0, 0,0,0,0, 0.7,0,0,0], [0], 1.0, 0.7),
        division: 's',
        tonal: "// Kick syncopé : onsets 1, 7, 13 sur 16 DC"
      },
      {
        part: 'snare',
        // euclid(16,1) rotate 8 = [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8), 1.0),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8)"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(16, 8), 0.7),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8)"
      },
    ],
    compatibleGenres: ["Hip-Hop", "R&B", "Alternative Rock", "Trap"],
    examples: ["When Doves Cry (Prince)", "Kashmir (Led Zeppelin)"],
  },

  {
    name: "Shuffle Blues",
    emoji: ':musical_note:',
    description: "Le shuffle blues utilise des croches triplées. Grosse caisse sur 1 et 3, snare sur 2 et 4, charleston en ternaire (croche longue + croche courte). Feeling triplet.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 160, typical: 100 },
    feel: 'shuffle',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // 12 steps = 3 triplets × 4 temps. Kick sur step 0 et 6.
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 0), 1.0),
        division: 'e', // interprété comme croche de triolet ('e' triplet)
        tonal: "RhythmPattern.euclid(12, 2) // 2 onsets sur 12 triolets de croches"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3)"
      },
      {
        part: 'hihat',
        // shuffle : hit fort + repos + hit doux sur chaque temps (croche longue–croche courte)
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 0.9, 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) // 8 hits sur 12 triolets"
      },
    ],
    compatibleGenres: ["Blues", "Boogie Woogie", "Country", "Rock'n'Roll"],
    examples: ["Pride and Joy (Stevie Ray Vaughan)", "Sweet Home Chicago"],
  },

  {
    name: "Punk Rock",
    emoji: ':zap:',
    description: "Beat punk rapide et brut. Croches continues au charleston, kick sur 1 et 3, snare sur 2 et 4. Pas de nuances — énergie maximale. De Ramones aux Sex Pistols en passant par le hardcore.",
    timeSignature: '4/4',
    tempo: { min: 150, max: 240, typical: 180 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // temps 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) // toutes les croches — énergie maximale"
      },
    ],
    compatibleGenres: ["Punk", "Hardcore", "Pop-Punk", "Skate Punk"],
    examples: ["Blitzkrieg Bop (Ramones)", "Anarchy in the U.K. (Sex Pistols)"],
  },

  {
    name: "Disco",
    emoji: ':sparkles:',
    description: "Beat disco des années 70. Four-on-floor (euclid(8,4)), snare/clap sur 2 et 4, charleston avec accents sur les off-beats. Précurseur direct de la house. Tout en croches.",
    timeSignature: '4/4',
    tempo: { min: 110, max: 130, typical: 120 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // four-on-floor en croches"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // clap 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(8, 8), [1,3,5,7], 0.9, 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) avec accents sur off-beats — hi-hat ouvert disco"
      },
    ],
    compatibleGenres: ["Disco", "Funk", "Pop des années 70", "Nu-Disco"],
    examples: ["Stayin' Alive (Bee Gees)", "Good Times (Chic)"],
  },

  {
    name: "Prog Rock 7/4",
    emoji: ':cyclone:',
    description: "Rock progressif en 7/4, découpé en groupes 4+3 croches. Kick sur les débuts de groupe, snare en euclid(14,5), hihat continu sur les 14 croches. Cadence asymétrique typique du genre.",
    timeSignature: '7/4',
    tempo: { min: 100, max: 160, typical: 132 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([1,0, 1,0, 1,0,0, 1,0, 0,0, 0,0,0], 1.0),
        division: 'e',
        tonal: "// Kick 7/4 : groupement 4+3 — positions 0, 2, 4, 7 sur 14 croches"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(14, 5), [2,6,10], 1.0, 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(14, 5) // distribution snare sur 14 pas"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(14, 14), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(14, 14) // toutes les croches en 7/4"
      },
    ],
    compatibleGenres: ["Prog Rock", "Art Rock", "Math Rock", "Jazz Prog"],
    examples: ["Schism (Tool — 5/8 et 7/8)", "Solsbury Hill (Peter Gabriel)"],
  },

  {
    name: "New Wave",
    emoji: ':ocean:',
    description: "Beat new wave / post-punk. Croches mécaniques et froides. Kick sur 1 et 3, snare sur 2 et 4, charleston accentué sur les off-beats. Feeling précis et minimaliste inspiré de Joy Division et The Cure.",
    timeSignature: '4/4',
    tempo: { min: 110, max: 160, typical: 135 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.95),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // temps 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(8, 8), [1,3,5,7], 0.85, 0.6),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) avec off-beats accentués — feel mécanique"
      },
    ],
    compatibleGenres: ["New Wave", "Post-Punk", "Synth-Pop", "Cold Wave"],
    examples: ["She's Lost Control (Joy Division)", "Just Like Heaven (The Cure)"],
  },

  {
    name: "Rockabilly",
    emoji: ':microphone:',
    description: "Rockabilly des années 50. Shuffle en triolets de croches, snare 'slap' sur 2 et 4 (euclid(12,2) rotate 3), kick sur 1 et 3. Feeling très rebondissant et propulsif.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 200, typical: 160 },
    feel: 'shuffle',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(12, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 2) // kick sur 1 et 3 (grille triolets)"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3) // slap 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 0.8, 0.45),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) // shuffle en triolets"
      },
    ],
    compatibleGenres: ["Rockabilly", "Rock'n'Roll", "Psychobilly"],
    examples: ["Rock Around the Clock (Bill Haley)", "Blue Suede Shoes (Elvis)"],
  },

  // ═══════════════════════════════════════════════════════
  // BLUES
  // ═══════════════════════════════════════════════════════

  {
    name: "Slow Blues",
    emoji: ':saxophone:',
    description: "Blues lent en 12/8. Grosse caisse sur les 4 grands temps (euclid(12,4)), snare sur 2 et 4, hihat en shuffle (euclid(12,8)) avec accents sur les temps forts. Feeling soul profond.",
    timeSignature: '12/8',
    tempo: { min: 40, max: 70, typical: 55 },
    feel: 'shuffle',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(12, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 4) // quatre grands temps du 12/8"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3) // beats 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 0.85, 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) // shuffle : croche longue + croche courte"
      },
    ],
    compatibleGenres: ["Blues lent", "Delta Blues", "Texas Blues", "Soul Blues"],
    examples: ["The Thrill Is Gone (B.B. King)", "Red House (Jimi Hendrix)"],
  },

  {
    name: "Boogie Woogie",
    emoji: ':musical_keyboard:',
    description: "Boogie-woogie en 12 triolets de croches. Kick sur les 4 temps, snare sur 2 et 4, basse en ostinato de 8 croches de triolet, hihat en paires par temps. Feeling swing festif et propulsif.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 200, typical: 160 },
    feel: 'shuffle',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(12, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 4) // kick sur les 4 temps"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 0.95),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3) // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(12, 6), [0,2,4,6,8,10], 0.85, 0.45),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 6) // 2 croches par temps — feel boogie"
      },
      {
        part: 'bass',
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 0.9, 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) // ostinato boogie : 8 croches de triolet"
      },
    ],
    compatibleGenres: ["Boogie Woogie", "Rock'n'Roll", "Blues", "Jump Blues"],
    examples: ["Pine Top's Boogie Woogie (Pine Top Smith)", "Roll 'Em Pete (Pete Johnson)"],
  },

  // ═══════════════════════════════════════════════════════
  // FUNK / SOUL / R&B
  // ═══════════════════════════════════════════════════════

  {
    name: "Funk Classic",
    emoji: ':fire:',
    description: "Groove funk en double-croches avec notes fantômes à la snare (velocity 0.4). Grosse caisse syncopée, charleston fermé sur toutes les DC. Inspiré de James Brown.",
    timeSignature: '4/4',
    tempo: { min: 85, max: 130, typical: 105 },
    feel: 'funk',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // hex 'A4' = 1010 0100 = DC 1, 3, 6 sur 8 (croches) → converti en 16 DC
        steps: [1.0,0,0,0.7, 0,0,0,0, 1.0,0,0,0, 0,0.7,0,0],
        division: 's',
        tonal: "// Pattern funk syncopé — RhythmPattern.hex('84A0') approximatif"
      },
      {
        part: 'snare',
        // Snare on 2+4 avec ghosts. euclid(16,8) donne 8 hits; accents sur beats 2 et 4
        steps: withAccents(RhythmPattern.euclid(16, 8), [4,12], 1.0, 0.4),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) avec accents sur beats 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(16, 16), 0.75),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) // toutes les DC"
      },
    ],
    compatibleGenres: ["Funk", "Soul", "R&B", "Jazz-Funk"],
    examples: ["Give It Up or Turnit a Loose (James Brown)", "Thank You (Sly & The Family Stone)"],
  },

  {
    name: "Motown",
    emoji: ':star:',
    description: "Beat soul régulier et propulsif. Grosse caisse sur les 4 temps, snare sur 2 et 4. Charleston en croches continues. Fondation de la soul de Detroit.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 140, typical: 115 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // 4 noires sur 8 croches"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8)"
      },
    ],
    compatibleGenres: ["Soul", "Motown", "R&B"],
    examples: ["I Can't Help Myself (Four Tops)", "My Girl (Temptations)"],
  },

  {
    name: "Neo-Soul",
    emoji: ':rose:',
    description: "Groove néo-soul avec notes fantômes à la snare. Snare euclid(16,8) avec accents sur 2 et 4 et ghosts entre. Kick syncopé sur 2 mesures. Inspiré de D'Angelo et Erykah Badu.",
    timeSignature: '4/4',
    tempo: { min: 65, max: 95, typical: 80 },
    feel: 'swing',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: [1.0,0,0,0, 0.7,0,0,0, 0,0,1.0,0, 0,0,0.6,0,
                1.0,0,0,0, 0,0.7,0,0, 0,0,0,1.0, 0,0,0,0],
        division: 's',
        tonal: "// Kick néo-soul syncopé sur 2 mesures — variante euclid(16, 5)"
      },
      {
        part: 'snare',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 8)],
          [4, 12, 20, 28], 1.0, 0.35
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) × 2 — snare avec notes fantômes, accents 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 12), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 12), 2)],
          [0,4,8,12,16,20,24,28], 0.8, 0.5
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 12) — hi-hat syncopé néo-soul"
      },
    ],
    compatibleGenres: ["Neo-Soul", "R&B", "Soul", "Jazz-Soul"],
    examples: ["Untitled (How Does It Feel) (D'Angelo)", "Bag Lady (Erykah Badu)"],
  },

  {
    name: "New Jack Swing",
    emoji: ':notes:',
    description: "R&B des années 90 swingué sur les DC. Hi-hat en triolets de croches (euclid(12,8)), kick syncopé sur 1 et 3, snare sur 2 et 4. Style inventé par Teddy Riley.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 120, typical: 105 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: [1,0,0,0, 0,0,0.7,0, 0,0,1.0,0, 0,0,0,0],
        division: 's',
        tonal: "// Kick NJS : beats 1 et 3 avec syncope anticipée au step 7"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4), 1.0),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) // beats 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 0.85, 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) // hi-hat triolets swingués"
      },
    ],
    compatibleGenres: ["New Jack Swing", "R&B", "Pop des années 90"],
    examples: ["No Diggity (Blackstreet)", "I Want Her (Keith Sweat)"],
  },

  // ═══════════════════════════════════════════════════════
  // JAZZ
  // ═══════════════════════════════════════════════════════

  {
    name: "Jazz Swing",
    emoji: ':trumpet:',
    description: "Beat jazz standard en triolets. Ride : noire + croche du triolet (ding-ding-a-ding). Charleston sur 2 et 4. Grosse caisse 'feathered'. Représenté sur grille de 12 triolets de croches.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 320, typical: 140 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'ride',
        // 12 triolets de croches, ride sur beats 1,2,3,4 + upbeats (positions 0,2,3,5,6,8,9,11)
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 1.0, 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) avec accents sur temps forts — grille triolets"
      },
      {
        part: 'hihat',
        // Charleston sur temps 2 et 4 → positions 3 et 9 dans grille 12
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3)"
      },
      {
        part: 'kick',
        // Feathered kick : léger sur les 4 temps
        steps: withVelocity(RhythmPattern.euclid(12, 4), 0.35),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 4) // feathered — vélocité très douce"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 0.85),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3)"
      },
    ],
    compatibleGenres: ["Jazz", "Bebop", "Swing", "Big Band"],
    examples: ["Autumn Leaves", "So What (Miles Davis)", "All the Things You Are"],
  },

  {
    name: "Jazz Waltz",
    emoji: ':musical_score:',
    description: "Swing en 3/4. Ride sur les trois temps avec upbeats de triolets. Hihat de pied sur le temps 3. Grosse caisse légère sur le 1.",
    timeSignature: '3/4',
    tempo: { min: 60, max: 240, typical: 140 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'ride',
        // 9 triolets (3 par temps × 3 temps). Ride sur positions 0,2,3,5,6,8
        steps: withAccents(RhythmPattern.euclid(9, 6), [0,3,6], 1.0, 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(9, 6) sur grille 3/4 triolets"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(9, 1), 6), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(9, 1), 6) // pied sur temps 3"
      },
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(9, 1), 0), 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(9, 1) // léger sur temps 1"
      },
    ],
    compatibleGenres: ["Jazz"],
    examples: ["Waltz for Debby (Bill Evans)", "Someday My Prince Will Come"],
  },

  {
    name: "Jazz 5/4",
    emoji: ':jigsaw:',
    description: "Jazz en 5/4, découpé en groupes 3+2 temps. Ride sur 15 triolets de croches (euclid(15,10)) avec accents sur les 5 temps forts. Hihat de pied sur 2 et 4, grosse caisse feathered.",
    timeSignature: '5/4',
    tempo: { min: 120, max: 220, typical: 174 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'ride',
        // 15 triolets = 3 par temps × 5 temps. Accents sur positions 0,3,6,9,12
        steps: withAccents(RhythmPattern.euclid(15, 10), [0,3,6,9,12], 1.0, 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(15, 10) // jazz ride 5/4 sur grille triolets"
      },
      {
        part: 'hihat',
        // Hihat de pied sur temps 2 et 4 → positions 3 et 9 sur 15 triolets
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(15, 2), 3), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(15, 2), 3) // pied sur temps 2 et 4"
      },
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(15, 5), 0.4),
        division: 'e',
        tonal: "RhythmPattern.euclid(15, 5) // feathered kick sur les 5 temps"
      },
    ],
    compatibleGenres: ["Jazz", "Jazz modal", "Prog Jazz"],
    examples: ["Take Five (Dave Brubeck)", "Unsquare Dance (Dave Brubeck)"],
  },

  {
    name: "Bebop",
    emoji: ':saxophone:',
    description: "Jazz rapide des années 40-50. Ride en triolets continus (euclid(12,12)) avec accents sur les temps forts, hihat de pied sur 2 et 4. Kick en 'bombs' sporadiques — très peu quantifié.",
    timeSignature: '4/4',
    tempo: { min: 180, max: 320, typical: 240 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'ride',
        steps: withAccents(RhythmPattern.euclid(12, 12), [0,3,6,9], 1.0, 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 12) // ride continu avec accents sur temps forts"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3) // pied 2 et 4"
      },
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 3), 1), 0.6),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 3), 1) // bombs sporadiques"
      },
    ],
    compatibleGenres: ["Bebop", "Jazz moderne", "Hard Bop"],
    examples: ["Ko Ko (Charlie Parker)", "Donna Lee (Charlie Parker)"],
  },

  {
    name: "Jazz Fusion",
    emoji: ':twisted_rightwards_arrows:',
    description: "Croisement rock/jazz en 4/4 straight. Grosse caisse syncopée (euclid(16,5)), snare avec ghosts sur euclid(16,8), hihat en DC continues. Inspiré de Miles Davis électrique et Weather Report.",
    timeSignature: '4/4',
    tempo: { min: 100, max: 180, typical: 140 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 2)],
          [0, 16], 1.0, 0.75
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // kick fusion syncopé"
      },
      {
        part: 'snare',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 8)],
          [4, 12, 20, 28], 1.0, 0.4
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) × 2 — snare avec ghosts, accents 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 16), ...RhythmPattern.euclid(16, 16)],
          0.7
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) × 2 // DC continues"
      },
    ],
    compatibleGenres: ["Jazz Fusion", "Jazz-Rock", "Fusion", "Progressive Jazz"],
    examples: ["Birdland (Weather Report)", "The Dance of Maya (Mahavishnu Orchestra)"],
  },

  {
    name: "Dixieland",
    emoji: ':performing_arts:',
    description: "Jazz de la Nouvelle-Orléans. Grosse caisse sur les 4 temps (euclid(8,4)), snare avec accents sur 2 et 4 et remplissages entre, ride en shuffle. Feeling de marche festive et polyphonique.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 180, typical: 150 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 4), 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // grosse caisse sur les 4 temps"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(12, 8), [3,9], 1.0, 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) avec accents sur 2 et 4 — feeling dixieland"
      },
      {
        part: 'ride',
        steps: withAccents(RhythmPattern.euclid(12, 8), [0,3,6,9], 0.9, 0.6),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 8) // ride en swing triolets"
      },
    ],
    compatibleGenres: ["Dixieland", "Jazz Nouvelle-Orléans", "Ragtime", "Traditional Jazz"],
    examples: ["When the Saints Go Marching In", "St. James Infirmary"],
  },

  {
    name: "Jazz Manouche",
    emoji: ':violin:',
    description: "Jazz manouche, style Django Reinhardt. La 'pompe' (guitare rythmique) joue une noire légère + une croche forte sur chaque temps, accentuant les temps faibles. Contrebasse sur 1 et 3.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 280, typical: 200 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'bass',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // contrebasse sur 1 et 3"
      },
      {
        part: 'chord',
        // La Pompe : noire (léger) + croche (fort) sur chaque temps
        steps: withAccents([0.5,0, 0.9,0, 0.5,0, 0.9,0], [2,6], 1.0, 0.5),
        division: 'e',
        tonal: "// La Pompe : noire tempo + croche accentuée — pattern manouche"
      },
    ],
    compatibleGenres: ["Jazz Manouche", "Gypsy Jazz", "Jazz Swing"],
    examples: ["Minor Swing (Django Reinhardt)", "Les Yeux Noirs (Quintette du Hot Club)"],
  },

  // ═══════════════════════════════════════════════════════
  // LATIN / AFRO-CUBAIN
  // ═══════════════════════════════════════════════════════

  {
    name: "Son Clave 3-2",
    emoji: ':drum:',
    description: "Clave son 3-2 sur 2 mesures en croches. Barre 1 : X..X..X. (tresillo). Barre 2 : ..X.X... Fondement rythmique de la salsa, du mambo et du son cubain. Représentation hex : '9228'.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 200, typical: 150 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'clave',
        // '9228' → [1,0,0,1,0,0,1,0] + [0,0,1,0,1,0,0,0]
        steps: withVelocity(RhythmPattern.hex('9228'), 1.0),
        division: 'e',
        tonal: "RhythmPattern.hex('9228') // 0x92=10010010, 0x28=00101000"
      },
    ],
    compatibleGenres: ["Salsa", "Son Cubain", "Mambo", "Cha-cha-cha"],
    examples: ["Guantanamera", "Chan Chan (Compay Segundo)"],
  },

  {
    name: "Son Clave 2-3",
    emoji: ':drum:',
    description: "Clave son inversée : 2 frappes en barre 1, 3 en barre 2. Hex '2892' — rotation de la clave 3-2.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 200, typical: 150 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'clave',
        steps: withVelocity(RhythmPattern.hex('2892'), 1.0),
        division: 'e',
        tonal: "RhythmPattern.hex('2892') // = rotate(son clave 3-2, 4)"
      },
    ],
    compatibleGenres: ["Salsa", "Son Cubain"],
  },

  {
    name: "Rumba Clave 3-2",
    emoji: ':dancer:',
    description: "Clave rumba 3-2 sur 2 mesures en double-croches. Plus syncopée que la clave son : la 3e frappe de la barre 1 tombe une DC plus tard. Hex : 'A450'.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 140, typical: 90 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'clave',
        steps: withVelocity(RhythmPattern.hex('A450'), 1.0),
        division: 's',
        tonal: "RhythmPattern.hex('A450') // 1010 0100 0101 0000 — rumba 3-2"
      },
    ],
    compatibleGenres: ["Rumba Cubaine", "Salsa"],
    examples: ["Rumba Yambu", "Rumba Columbia"],
  },

  {
    name: "Tresillo",
    emoji: ':musical_note:',
    description: "Le tresillo est le pattern euclidien fondamental de la musique africaine et cubaine : 3 onsets distribués sur 8 croches (3-3-2). C'est aussi la barre 1 de la clave son.",
    timeSignature: '4/4',
    tempo: { min: 80, max: 200, typical: 130 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        // euclid(8, 3) = [1,0,0,1,0,0,1,0] — distribution de Bjorklund
        steps: withVelocity(RhythmPattern.euclid(8, 3), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 3) // rythme euclidien E(3,8)"
      },
    ],
    compatibleGenres: ["Salsa", "Reggaeton", "Afrobeat", "Cumbia"],
    examples: ["Pattern de basse régaeton", "Habanera"],
  },

  {
    name: "Cinquillo",
    emoji: ':notes:',
    description: "Pattern cubain à 5 onsets sur 8 croches. Euclidien E(5,8). Utilisé dans la habanera, la contradanse et le danzón.",
    timeSignature: '4/4',
    tempo: { min: 80, max: 160, typical: 110 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        // euclid(8, 5) = [1,0,1,0,1,1,0,1]
        steps: withVelocity(RhythmPattern.euclid(8, 5), 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 5) // rythme euclidien E(5,8)"
      },
    ],
    compatibleGenres: ["Danzón", "Habanera", "Contradanse cubaine"],
    examples: ["Habanera (Bizet — influence cubaine)", "El Manisero"],
  },

  {
    name: "Bossa Nova",
    emoji: ':palm_tree:',
    description: "Clave brésilienne sur 2 mesures en croches. Hex 'A4A8' = 1010 0100 1010 1000. Guitare rythmique en syncopes, basse sur les forts.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 120, typical: 85 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'clave',
        steps: withVelocity(RhythmPattern.hex('A4A8'), 1.0),
        division: 'e',
        tonal: "RhythmPattern.hex('A4A8') // clave brésilienne sur 2 mesures"
      },
      {
        part: 'kick',
        // basse sur temps 1 de chaque mesure
        steps: withVelocity([1,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0], 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 1) répété 2× — grosse caisse sur temps 1"
      },
      {
        part: 'hihat',
        steps: withVelocity([...RhythmPattern.euclid(8, 8), ...RhythmPattern.euclid(8, 8)], 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) × 2 bars — hi-hat continu léger"
      },
    ],
    compatibleGenres: ["Bossa Nova", "MPB", "Jazz brésilien"],
    examples: ["The Girl from Ipanema (Jobim)", "Desafinado"],
  },

  {
    name: "Samba",
    emoji: ':sparkles:',
    description: "Rythme de carnaval brésilien en 2/4. Surdo sur le temps 1, caixa sur 2, pandeiro/chocalho en continu. Euclidien E(3,16) pour la surdo.",
    timeSignature: '2/4',
    tempo: { min: 180, max: 260, typical: 220 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',   // surdo (basse)
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // surdo : temps 1 et 2 de la mesure 2/4"
      },
      {
        part: 'snare',  // caixa (caisse claire)
        steps: withAccents(RhythmPattern.euclid(8, 5), [1,3,5,7], 0.9, 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 5) // caixa avec accents sur contretemps"
      },
      {
        part: 'perc',   // chocalho / pandeiro
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.6),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) // continu"
      },
    ],
    compatibleGenres: ["Samba", "Carnaval brésilien", "Pagode"],
    examples: ["Aquarela do Brasil (Barroso)", "Tico Tico no Fubá"],
  },

  {
    name: "Afrobeat",
    emoji: ':earth_africa:',
    description: "Groove africain de Fela Kuti en 4/4. Grosse caisse sur les 4 temps (four-on-floor), snare avec ghosts, hihat continu en DC. Patterns polymétriques imbriqués.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 130, typical: 110 },
    feel: 'funk',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 4), ...RhythmPattern.euclid(8, 4)], 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) × 2 bars // four-on-floor"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(32, 14), [4,12,20,28], 1.0, 0.4),
        division: 's',
        tonal: "RhythmPattern.euclid(32, 14) avec accents sur beats 2 et 4 — ghosts entre"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(32, 32), 0.7),
        division: 's',
        tonal: "RhythmPattern.euclid(32, 32) // toutes les DC sur 2 mesures"
      },
    ],
    compatibleGenres: ["Afrobeat", "Funk africain", "Highlife"],
    examples: ["Zombie (Fela Kuti)", "Lady (Fela Kuti)"],
  },

  {
    name: "Reggae",
    emoji: ':herb:',
    description: "Accent sur les temps faibles (off-beats). Le 'skank' de guitare sur les contretemps, la basse très présente sur les forts. Le repos sur le temps 1 est la signature du reggae.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 100, typical: 80 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(RhythmPattern.euclid(8, 2), [0], 1.0, 0.8),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // temps 2 et 4"
      },
      {
        part: 'hihat',  // skank sur contretemps
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.85),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // off-beats"
      },
      {
        part: 'chord',  // skank guitare
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // upstrokes"
      },
    ],
    compatibleGenres: ["Reggae", "Dub", "Dancehall"],
    examples: ["No Woman No Cry (Bob Marley)", "The Harder They Come (Jimmy Cliff)"],
  },

  {
    name: "Cumbia",
    emoji: ':musical_keyboard:',
    description: "Rythme colombien fondamental. La caja frappe sur les contretemps (euclid(8,3) rotate 1), la tambora/basse sur les temps 1 et 3, la maracas en croche continue. Base de nombreux rythmes latino-américains.",
    timeSignature: '4/4',
    tempo: { min: 85, max: 130, typical: 110 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 3), 1), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 3), 1) // caja sur contretemps"
      },
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // tambora sur temps 1 et 3"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) // maracas continue"
      },
    ],
    compatibleGenres: ["Cumbia", "Vallenato", "Champeta", "Cumbia mexicaine"],
    examples: ["La Pollera Colorá (Wilson Choperena)", "Colombia Tierra Querida"],
  },

  {
    name: "Merengue",
    emoji: ':hot_pepper:',
    description: "Rythme dominicain en 2/4. La tambora frappe sur les deux temps (euclid(8,2) en DC), la güira joue des DC continues. Tempo très rapide, caractère festif et entraînant.",
    timeSignature: '2/4',
    tempo: { min: 140, max: 200, typical: 170 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 2) // tambora sur les deux temps du 2/4"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.75),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // rebonds tambora"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.7),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 8) // güira en DC continue"
      },
    ],
    compatibleGenres: ["Merengue", "Bachata", "Musique dominicaine"],
    examples: ["La Bilirrubina (Juan Luis Guerra)", "Suavemente (Elvis Crespo)"],
  },

  {
    name: "Reggaeton / Dembow",
    emoji: ':loud_sound:',
    description: "Pattern dembow jamaïcain popularisé par le reggaeton. Kick sur DC 1 et anticipation DC 3, snare sur DC 5 et 13 (beats 2 et 4). Shaker continu en DC. Typique du perreo latino.",
    timeSignature: '4/4',
    tempo: { min: 80, max: 105, typical: 95 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: [1.0,0,0.7,0, 0,0,0,0, 0,0,0,0, 0.9,0,0,0],
        division: 's',
        tonal: "// Dembow kick : DC 1, 3 (anticipation), 13 — pattern caractéristique"
      },
      {
        part: 'snare',
        steps: [0,0,0,0, 1.0,0,0,0, 0,0,0,0, 1.0,0,0,0],
        division: 's',
        tonal: "// Snare dembow : DC 5 et 13 — beats 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(16, 16), 0.65),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) // shaker continu"
      },
    ],
    compatibleGenres: ["Reggaeton", "Dembow", "Latin Pop", "Perreo"],
    examples: ["Gasolina (Daddy Yankee)", "Danza Kuduro (Don Omar)"],
  },

  {
    name: "Cha-cha-cha",
    emoji: ':high_heel:',
    description: "Danse cubaine des années 50. Timbales sur 2 et 4, basse sur 1 et 3, güiro continu. Le 'cha-cha-cha' correspond aux DC 9-10-11 (contretemps du 4). Euclidien E(8,2) pour la basse.",
    timeSignature: '4/4',
    tempo: { min: 110, max: 140, typical: 125 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // basse sur 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // timbale 2 et 4"
      },
      {
        part: 'perc',
        // Cha-cha-cha : DC 1, DC 3e (off-beat du 2), DC 4, DC 4e → positions 0, 4, 6, 8 sur 16 DC
        steps: withAccents([1,0,0,0, 1,0,1,0, 1,0,0,0, 0,0,0,0], [0], 1.0, 0.85),
        division: 's',
        tonal: "// Clave cha-cha : pattern cowbell sur DC — 1, 3e, 4, 4e"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) // güiro continu"
      },
    ],
    compatibleGenres: ["Cha-cha-cha", "Mambo", "Salsa", "Danse de salon"],
    examples: ["Cherry Pink and Apple Blossom White (Perez Prado)", "Oye Como Va (Tito Puente)"],
  },

  {
    name: "Mambo",
    emoji: ':trumpet:',
    description: "Mambo de Perez Prado. Cloche (mambo bell) sur les 4 contretemps de croche, timbales sur 2 et 4, basse syncopée. Ancêtre direct de la salsa. Hex pour la basse : pattern en DC.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 200, typical: 165 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents([1,0,0,0, 0.7,0,0,0, 1,0,0,0, 0,0.7,0,0], [0,8], 1.0, 0.7),
        division: 's',
        tonal: "// Basse mambo syncopée : temps 1 et 3 avec anticipations"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.95),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // timbale 2 et 4"
      },
      {
        part: 'perc',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.85),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // mambo bell sur off-beats"
      },
    ],
    compatibleGenres: ["Mambo", "Salsa", "Latin Jazz", "Son cubain"],
    examples: ["Mambo No. 5 (Perez Prado)", "Ran Kan Kan (Tito Puente)"],
  },

  {
    name: "Tango Argentin",
    emoji: ':rose:',
    description: "Tango argentin en 4/4. Grosse caisse sur les 4 temps (marcato), snare syncopée en euclid(16,3) sur 2 mesures. Bandonéon marque 1 et 3. Phrasé 'long-long-court-court-long'.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 100, typical: 75 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(4, 4), ...RhythmPattern.euclid(4, 4)],
          [0, 2, 4, 6], 1.0, 0.8
        ),
        division: 'q',
        tonal: "RhythmPattern.euclid(4, 4) × 2 // marcato : 4 noires par mesure"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 3), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 3), 3)],
          0.85
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 3) + rotation // syncopes tango sur 2 mesures"
      },
    ],
    compatibleGenres: ["Tango argentin", "Tango orchestral", "Milonga"],
    examples: ["La Cumparsita (Rodríguez)", "Por Una Cabeza (Gardel)"],
  },

  {
    name: "Baião",
    emoji: ':musical_keyboard:',
    description: "Rythme nordiste brésilien de Luiz Gonzaga. Zabumba (basse) en euclid(8,5) sur 2/4 avec accents forts, triangle en DC continue, caixa syncopée en euclid(8,3). Fondement du forró.",
    timeSignature: '2/4',
    tempo: { min: 100, max: 160, typical: 130 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(RhythmPattern.euclid(8, 5), [0, 4], 1.0, 0.55),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 5) // zabumba — E(5,8) avec accents sur 1 et 2"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.6),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 8) // triângulo continu"
      },
      {
        part: 'perc',
        steps: withAccents(RhythmPattern.rotate(RhythmPattern.euclid(8, 3), 1), [1,4,7], 0.9, 0.5),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 3), 1) // caixa syncopée"
      },
    ],
    compatibleGenres: ["Baião", "Forró", "Xote", "MPB nordiste"],
    examples: ["Asa Branca (Luiz Gonzaga)", "Baião (Luiz Gonzaga)"],
  },

  {
    name: "Milonga",
    emoji: ':dancer:',
    description: "Milonga argentine, entre le tango et la habanera. Rythme binaire en 2/4 avec le tresillo comme pattern de base (euclid(8,3)). Plus rapide et léger que le tango. Base des premières formes de tango.",
    timeSignature: '2/4',
    tempo: { min: 90, max: 140, typical: 115 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 3), 1.0),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 3) // tresillo milonga E(3,8)"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.85),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // contretemps milonga"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.6),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 8) // charleston continu"
      },
    ],
    compatibleGenres: ["Milonga", "Tango argentin", "Folklore argentin"],
    examples: ["Don Juan (milonga de Piazzolla)", "La Cumparsita (version milonga)"],
  },

  {
    name: "Bolero Lento",
    emoji: ':crescent_moon:',
    description: "Boléro cubain lent, distinct du Boléro de Ravel. Rythme en croches très lent sur 4/4. Basse sur 1 et 3, clave boléro (hex 'A4A8') sur 2 mesures, guitare en accord doux.",
    timeSignature: '4/4',
    tempo: { min: 50, max: 80, typical: 65 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)], 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 // basse sur 1 et 3"
      },
      {
        part: 'perc',
        steps: withVelocity(RhythmPattern.hex('A4A8'), 0.85),
        division: 'e',
        tonal: "RhythmPattern.hex('A4A8') // clave boléro sur 2 mesures"
      },
      {
        part: 'hihat',
        steps: withVelocity([...RhythmPattern.euclid(8, 8), ...RhythmPattern.euclid(8, 8)], 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) × 2 // charleston discret"
      },
    ],
    compatibleGenres: ["Bolero cubain", "Trova", "Feeling cubain", "Latin Ballad"],
    examples: ["Bésame Mucho (Consuelo Velázquez)", "Sabor a Mí (Álvaro Carrillo)"],
  },

  {
    name: "Flamenco Bulería",
    emoji: ':dancer:',
    description: "Cycle de 12 pulsations en croches. Accents flamenco sur les positions 3, 6, 8, 10, 12 (index base-0 : 2, 5, 7, 9, 11). Le rythme le plus rapide et complexe du flamenco.",
    timeSignature: '12/8',
    tempo: { min: 180, max: 280, typical: 220 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        // Pattern binaire : 001001011011 = accents sur 2,5,7,9,11
        steps: withAccents(
          RhythmPattern.binary(0b001001011011),
          [2, 5, 7, 9, 11],
          1.0, 0.6
        ),
        division: 'e',
        tonal: "RhythmPattern.binary(0b001001011011) // accents bulería 3-6-8-10-12"
      },
    ],
    compatibleGenres: ["Flamenco"],
    examples: ["Bulería de Jerez (traditionnel)", "En el nombre del padre (Paco de Lucía)"],
  },

  {
    name: "Flamenco Soleá",
    emoji: ':rose:',
    description: "Même cycle de 12 que la bulería mais plus lent et expressif. Accents identiques sur 3, 6, 8, 10, 12. Base de nombreux styles du flamenco (soleá, alegrías, guajiras).",
    timeSignature: '12/8',
    tempo: { min: 50, max: 100, typical: 65 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        steps: withAccents(
          RhythmPattern.binary(0b001001011011),
          [2, 5, 7, 9, 11],
          1.0, 0.6
        ),
        division: 'e',
        tonal: "RhythmPattern.binary(0b001001011011)"
      },
    ],
    compatibleGenres: ["Flamenco"],
    examples: ["Soleá (Paco de Lucía)", "Alegrías (Camarón de la Isla)"],
  },

  // ═══════════════════════════════════════════════════════
  // JAMAÏQUE / SKA
  // ═══════════════════════════════════════════════════════

  {
    name: "Ska",
    emoji: ':checkered_flag:',
    description: "Ska jamaïcain des années 60. Kick sur 1 et 3, snare sur 2 et 4, charleston en croches continues. Le skank (guitare/cuivres) joue les 4 contretemps. Ancêtre du reggae. Tempo vif.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 200, typical: 160 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // temps 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.75),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) // toutes les croches"
      },
      {
        part: 'chord',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.95),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // skank sur off-beats"
      },
    ],
    compatibleGenres: ["Ska", "Ska-Punk", "Third Wave Ska"],
    examples: ["A Message to You Rudy (Toots and the Maytals)", "Pressure Drop (Toots and the Maytals)"],
  },

  {
    name: "Rocksteady",
    emoji: ':guitar:',
    description: "Rocksteady jamaïcain, intermédiaire entre ska et reggae. Tempo plus lent, kick sur 1 et 3, snare sur 2 et 4, charleston sur les contretemps uniquement. Basse très en avant.",
    timeSignature: '4/4',
    tempo: { min: 65, max: 90, typical: 75 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.95),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // temps 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.8),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // off-beats seulement"
      },
    ],
    compatibleGenres: ["Rocksteady", "Early Reggae", "Jamaïque années 60"],
    examples: ["The Tide Is High (John Holt)", "Hold Me Tight (Johnny Nash)"],
  },

  {
    name: "Dancehall",
    emoji: ':speaker:',
    description: "Dancehall jamaïcain numérique. Kick syncopé sur 2 mesures, snare half-time sur beat 3, hi-hat DC en euclid(16,7) avec variation. Héritier numérique du reggae avec influence trap.",
    timeSignature: '4/4',
    tempo: { min: 70, max: 100, typical: 85 },
    feel: 'half-time',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: [1.0,0,0,0, 0,0.7,0,0, 0,0,1.0,0, 0,0,0,0.6,
                1.0,0,0,0, 0,0,0,0.7, 0,0.6,0,0, 0,0,0,0],
        division: 's',
        tonal: "// Kick dancehall syncopé — pattern digital caractéristique"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8) × 2 // snare half-time"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 7), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 5)],
          [1,5,9,13,17,21,25,29], 0.8, 0.4
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 7) — hi-hat digital dancehall"
      },
    ],
    compatibleGenres: ["Dancehall", "Reggaeton", "Afrobeats", "Jamaïque moderne"],
    examples: ["Temperature (Sean Paul)", "Informer (Snow)"],
  },

  // ═══════════════════════════════════════════════════════
  // CARAÏBES
  // ═══════════════════════════════════════════════════════

  {
    name: "Zouk",
    emoji: ':hibiscus:',
    description: "Zouk des Antilles françaises né avec Kassav'. Kick syncopé euclid(16,5) sur 2 mesures, snare sur 2 et 4, hi-hat DC asymétrique euclid(16,9). Caractère romantique et chaloupé.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 85, typical: 72 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 2)],
          [0, 16], 1.0, 0.7
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // basse zouk syncopée"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)],
          0.9
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) × 2 // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 9), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 9), 3)],
          [1,5,9,13,17,21,25,29], 0.8, 0.45
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) — hi-hat zouk balancé"
      },
    ],
    compatibleGenres: ["Zouk", "Zouk Love", "Antilles françaises", "Kompa"],
    examples: ["Zouk la sé sèl médikaman nou ni (Kassav')", "Anita (Kassav')"],
  },

  {
    name: "Soca",
    emoji: ':tropical_drink:',
    description: "Soca de Trinidad, descendant du calypso. Four-on-floor rapide, snare forte sur 2 et 4, hi-hat en DC continues, cowbell sur le tresillo (euclid(8,3)). Caractère festif de carnaval.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 165, typical: 145 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // four-on-floor"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // snare puissante 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(16, 16), 0.8),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) // hi-hat DC énergique"
      },
      {
        part: 'perc',
        steps: withVelocity(RhythmPattern.euclid(8, 3), 0.85),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 3) // cowbell soca — tresillo"
      },
    ],
    compatibleGenres: ["Soca", "Calypso", "Carnaval trinidadien", "Chutney Soca"],
    examples: ["Dollar Wine (Colin Lucas)", "Differentology (Bunji Garlin)"],
  },

  // ═══════════════════════════════════════════════════════
  // ÉLECTRONIQUE / DANCE
  // ═══════════════════════════════════════════════════════

  {
    name: "Four on the Floor",
    emoji: ':house:',
    description: "Grosse caisse sur chaque noire. Euclidien E(4,4) — le cas trivial de la distribution maximale. Fondement de la house, techno, disco. Le nom vient des 4 kicks sur le plancher.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 145, typical: 128 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(4, 4), 1.0),
        division: 'q',
        tonal: "RhythmPattern.euclid(4, 4) // E(4,4) = [1,1,1,1]"
      },
      {
        part: 'clap',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1), 1.0),
        division: 'q',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1) // 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1), 0.8),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) // off-beats croches"
      },
    ],
    compatibleGenres: ["House", "Techno", "Disco", "EDM"],
    examples: ["Around the World (Daft Punk)", "Blue Monday (New Order)"],
  },

  {
    name: "Boom Bap",
    emoji: ':microphone:',
    description: "Hip-hop classique des années 90. Grosse caisse lourde sur 1 et 3 avec syncopes, snare sur 2 et 4. Feeling légèrement swingué sur les DC.",
    timeSignature: '4/4',
    tempo: { min: 75, max: 105, typical: 90 },
    feel: 'swing',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.hex('A0'), 0,0,0,0,0,0,0,0, ...RhythmPattern.hex('90'), 0,0,0,0,0,0,0,0],
          [0, 16],
          1.0, 0.7
        ),
        division: 's',
        tonal: "RhythmPattern.hex('A090...') // kick syncopé sur 2 mesures"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) × 2"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 8)],
          [0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30],
          0.7, 0.45
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) × 2 // croches avec ghosts entre"
      },
    ],
    compatibleGenres: ["Hip-Hop", "Rap", "East Coast"],
    examples: ["N.Y. State of Mind (Nas)", "C.R.E.A.M. (Wu-Tang Clan)"],
  },

  {
    name: "Trap",
    emoji: ':chains:',
    description: "Hi-hat en triples rapides (DC continues), grosse caisse syncopée, snare espacé (half-time). Style dominant du hip-hop depuis 2010. Euclid(16,7) pour la variété de hihat.",
    timeSignature: '4/4',
    tempo: { min: 65, max: 90, typical: 75 },
    feel: 'half-time',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: [1.0,0,0,0, 0,0.7,0,0, 0,0,1.0,0, 0,0,0,0.6,
                1.0,0,0,0, 0,0,0.7,0, 0,0.6,0,0, 0,0,0,0],
        division: 's',
        tonal: "// Kick trap syncopé — variante RhythmPattern.euclid(16, 5)"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8) × 2 // snare sur beat 3 seulement"
      },
      {
        part: 'hihat',
        // euclid(16, 9) = pattern asymétrique caractéristique du trap
        steps: withAccents(
          [...RhythmPattern.euclid(16, 9), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 9), 3)],
          [0,4,8,12,16,20,24,28],
          0.9, 0.45
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) et rotation // hi-hat trap irrégulier"
      },
    ],
    compatibleGenres: ["Trap", "Hip-Hop", "Atlanta"],
    examples: ["HUMBLE. (Kendrick Lamar)", "Bad and Boujee (Migos)"],
  },

  {
    name: "Drum & Bass",
    emoji: ':loud_sound:',
    description: "Pattern breakbeat type 'Amen' simplifié. Snare syncopée rapide, kick sur des positions inattendues. Euclidien E(7,16) pour la snare donne le feeling DnB caractéristique.",
    timeSignature: '4/4',
    tempo: { min: 155, max: 185, typical: 170 },
    feel: 'breakbeat',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 3), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 4), 3)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 3) + rotate(euclid(16,4), 3)"
      },
      {
        part: 'snare',
        // euclid(16, 7) = [1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0] — feeling breakbeat
        steps: withAccents(
          [...RhythmPattern.euclid(16, 7), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 5)],
          [4,12,20,28],
          1.0, 0.65
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 7) — distribution euclidienne de la snare"
      },
    ],
    compatibleGenres: ["Drum & Bass", "Jungle", "Breakbeat"],
    examples: ["Inner City Life (Goldie)", "Watercolour (Pendulum)"],
  },

  {
    name: "Deep House",
    emoji: ':headphones:',
    description: "House profonde à 120-126 BPM. Four-on-floor avec clap sur 2 et 4, hi-hat asymétrique euclid(16,9) sur 2 mesures avec variation en rotation. Basse syncopée euclid(16,5). Feeling chaud et organique.",
    timeSignature: '4/4',
    tempo: { min: 118, max: 126, typical: 122 },
    feel: 'swing',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 4), ...RhythmPattern.euclid(8, 4)], 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) × 2 // four-on-floor"
      },
      {
        part: 'clap',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)],
          0.9
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) × 2 // clap 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 9), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 9), 3)],
          [1,5,9,13,17,21,25,29], 0.85, 0.4
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) + rotation — hi-hat deep house swingué"
      },
      {
        part: 'bass',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 2)],
          0.9
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) — basse syncopée"
      },
    ],
    compatibleGenres: ["Deep House", "House", "Garage", "Soulful House"],
    examples: ["Strings of Life (Rhythim Is Rhythim)", "Finally (CeCe Peniston)"],
  },

  {
    name: "UK Garage 2-Step",
    emoji: ':red_car:',
    description: "Groove en deux pas londonien. Le kick évite les temps forts grâce à euclid(16,5) rotate 1, clap sur 2 et 4, hi-hat DC asymétrique (euclid(16,9)). Style britannique 1997-2001.",
    timeSignature: '4/4',
    tempo: { min: 128, max: 142, typical: 135 },
    feel: 'swing',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 1), 1.0),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 1) // kick 2-step décalé"
      },
      {
        part: 'clap',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4), 1.0),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) // clap 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(16, 9), [1,5,9,13], 0.8, 0.45),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) // hi-hat asymétrique"
      },
    ],
    compatibleGenres: ["UK Garage", "2-Step", "Grime", "Speed Garage"],
    examples: ["Re-Rewind (Artful Dodger)", "Flowers (Sweet Female Attitude)"],
  },

  {
    name: "Techno",
    emoji: ':gear:',
    description: "Techno de Detroit, 130-145 BPM. Four-on-floor dominant, hihat en DC asymétrique (euclid(16,7)) avec off-beats accentués, clap sur 2 et 4. La grosse caisse impose la pulsation.",
    timeSignature: '4/4',
    tempo: { min: 130, max: 145, typical: 138 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // four-on-floor"
      },
      {
        part: 'clap',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.85),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // clap 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(16, 7), [1,5,9,13], 0.8, 0.45),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 7) // hihat techno asymétrique"
      },
    ],
    compatibleGenres: ["Techno", "Techno de Detroit", "Acid Techno", "Industrial"],
    examples: ["Nude Photo (Model 500)", "Jaguar (Model 500)"],
  },

  {
    name: "Dubstep",
    emoji: ':boom:',
    description: "Dubstep britannique à 140 BPM, feeling half-time. Snare massive sur beat 3 uniquement (half-time), kick sporadique, hihat DC irrégulier sur 2 mesures. Le drop alterne sections vides et saturées.",
    timeSignature: '4/4',
    tempo: { min: 138, max: 145, typical: 140 },
    feel: 'half-time',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 3), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 3), 5)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 3) + rotation // kick dubstep sporadique"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 1), 8) × 2 // snare beat 3 only"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 9), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 9), 4)],
          [1,5,9,13,17,21,25,29], 0.75, 0.35
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) — hihat dubstep irrégulier"
      },
    ],
    compatibleGenres: ["Dubstep", "Brostep", "Grime", "Bass Music"],
    examples: ["Scary Monsters and Nice Sprites (Skrillex)", "Bass Cannon (Flux Pavilion)"],
  },

  {
    name: "Afrobeats",
    emoji: ':earth_africa:',
    description: "Afrobeats moderne nigérian (≠ Afrobeat de Fela Kuti). Kick syncopé sur 2 mesures, snare sur 2 et 4, hi-hat DC dense euclid(16,9). Groove propulsif, influence de la pop mondiale. Artistes: Burna Boy, Wizkid.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 115, typical: 100 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 4)],
          [0, 16], 1.0, 0.75
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // kick afrobeats syncopé"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)],
          0.95
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) × 2 // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 9), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 9), 5)],
          [1,5,9,13,17,21,25,29], 0.8, 0.45
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) — hihat afrobeats dense"
      },
    ],
    compatibleGenres: ["Afrobeats", "Afropop", "Alte", "Musique nigériane contemporaine"],
    examples: ["Essence (Wizkid ft. Tems)", "Last Last (Burna Boy)"],
  },

  {
    name: "Amapiano",
    emoji: ':musical_keyboard:',
    description: "Amapiano sud-africain né à Johannesburg vers 2012. Log drum (basse synthétique) en euclid(16,5), hi-hat DC très dense euclid(16,11), kick four-on-floor léger. Mélange house, jazz et kwaito.",
    timeSignature: '4/4',
    tempo: { min: 100, max: 115, typical: 108 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 4), ...RhythmPattern.euclid(8, 4)], 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) × 2 // four-on-floor doux"
      },
      {
        part: 'bass',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 3)],
          [0,16], 1.0, 0.75
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // log drum syncopé"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 11), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 11), 2)],
          [0,4,8,12,16,20,24,28], 0.85, 0.5
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 11) — hihat amapiano très dense"
      },
    ],
    compatibleGenres: ["Amapiano", "Afrohouse", "Gqom", "House sud-africain"],
    examples: ["Ke Star (Reece Madlisa)", "Love Language (Kabza De Small)"],
  },

  {
    name: "Footwork",
    emoji: ':athletic_shoe:',
    description: "Footwork / juke de Chicago. 160 BPM avec kick hypnotique en euclid(16,7) sur 2 mesures, hi-hat DC continu, snare sporadique euclid(16,3). Pattern dense issu des battle crews de Chicago.",
    timeSignature: '4/4',
    tempo: { min: 155, max: 165, typical: 160 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 7), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 3)],
          [0,4,8,12,16,20,24,28], 1.0, 0.7
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 7) + rotation // kick footwork hypnotique"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 16), ...RhythmPattern.euclid(16, 16)],
          0.7
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) × 2 // hi-hat continu 160 BPM"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 3), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 3), 5)],
          0.9
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 3) + rotation // snare footwork sporadique"
      },
    ],
    compatibleGenres: ["Footwork", "Juke", "Ghetto House", "Chicago Electronic"],
    examples: ["Teklife Volume 1 (DJ Rashad)", "RP Boo — Turbo Speed"],
  },

  {
    name: "Jungle",
    emoji: ':leaves:',
    description: "Jungle / hardcore rave britannique (1992-1995). Breakbeat 'Amen' fragmenté plus complexe que le DnB, basse reggae profonde. Euclid(16,9) pour la snare et euclid(16,5) pour le kick sur 2 mesures.",
    timeSignature: '4/4',
    tempo: { min: 155, max: 175, typical: 165 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 7)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // kick jungle fragmenté"
      },
      {
        part: 'snare',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 9), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 9), 3)],
          [4,12,20,28], 1.0, 0.6
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 9) — snare jungle complexe"
      },
    ],
    compatibleGenres: ["Jungle", "Hardcore Rave", "Breakbeat", "UK Rave"],
    examples: ["Original Nuttah (Shy FX & UK Apache)", "Incredible (General Levy & M-Beat)"],
  },

  // ═══════════════════════════════════════════════════════
  // VALSE / MESURES COMPOSÉES
  // ═══════════════════════════════════════════════════════

  {
    name: "Valse",
    emoji: ':dancer:',
    description: "Rythme en 3/4, accent sur le premier temps. E(3,3) = [1,1,1] pour le hihat. Grosse caisse sur 1, snare sur 2 et 3 avec différentiation dynamique.",
    timeSignature: '3/4',
    tempo: { min: 80, max: 200, typical: 140 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(3, 1), 1.0),
        division: 'q',
        tonal: "RhythmPattern.euclid(3, 1) = [1,0,0] — noire sur temps 1"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.rotate(RhythmPattern.euclid(3, 2), 1), [], 0.9, 0.7),
        division: 'q',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(3, 2), 1) = [0,1,1]"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(3, 3), 0.7),
        division: 'q',
        tonal: "RhythmPattern.euclid(3, 3) = [1,1,1]"
      },
    ],
    compatibleGenres: ["Valse", "Musette", "Classique", "Country"],
    examples: ["Le Beau Danube Bleu (Strauss)", "À Paris (Joe Dassin)"],
  },

  {
    name: "6/8 Ballad",
    emoji: ':cherry_blossom:',
    description: "6/8 lent avec deux groupes de 3 croches. Les grands temps tombent sur les croches 1 et 4. Euclidien E(2,6) pour le kick. Typique des ballades et du gospel.",
    timeSignature: '6/8',
    tempo: { min: 40, max: 100, typical: 65 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // euclid(6, 2) = [1,0,0,1,0,0] — temps 1 et 4 de la mesure 6/8
        steps: withVelocity(RhythmPattern.euclid(6, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 2) // E(2,6) — temps forts 6/8"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.rotate(RhythmPattern.euclid(6, 2), 2), [], 1.0, 0.7),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(6, 2), 2)"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(6, 6), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 6) // toutes les croches"
      },
    ],
    compatibleGenres: ["Ballad", "Folk irlandais", "Gospel", "Power Ballad"],
    examples: ["House of the Rising Sun (Animals)", "We Are the World"],
  },

  {
    name: "Rythme Balkanique 7/8",
    emoji: ':violin:',
    description: "Rythme bulgare en 7/8, découpé en groupes 2+2+3 croches. Typique du folk balkanique et du jazz progressif. Kick sur les débuts de groupe, snare en euclid(7,4), hihat sur toutes les croches.",
    timeSignature: '7/8',
    tempo: { min: 120, max: 200, typical: 160 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([1,0, 1,0, 1,0,0], 1.0),
        division: 'e',
        tonal: "// Kick 7/8 : groupement 2+2+3 — positions 0, 2, 4"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(7, 4), [0,2,4], 1.0, 0.6),
        division: 'e',
        tonal: "RhythmPattern.euclid(7, 4) // distribution euclidienne sur 7 pas"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(7, 7), 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(7, 7) // toutes les croches du 7/8"
      },
    ],
    compatibleGenres: ["Folk bulgare", "Musique balkanique", "World", "Prog Rock"],
    examples: ["Eleno Mome (traditionnel bulgare)", "Money (Pink Floyd — 7/4)"],
  },

  {
    name: "Gospel 12/8",
    emoji: ':pray:',
    description: "Gospel américain en 12/8. Kick sur les 4 grands temps (euclid(12,4)), snare sur les beats 2 et 4 (rotate euclid(12,2), 3), hihat sur toutes les croches triolet avec accents sur les forts.",
    timeSignature: '12/8',
    tempo: { min: 55, max: 100, typical: 72 },
    feel: 'shuffle',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(12, 4), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 4) // quatre grands temps du 12/8"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(12, 2), 3) // beats 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(12, 12), [0,3,6,9], 0.9, 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 12) // croches triolet avec accents sur forts"
      },
    ],
    compatibleGenres: ["Gospel", "Southern Gospel", "Blues Gospel", "Soul Gospel"],
    examples: ["Oh Happy Day (Edwin Hawkins Singers)", "Amazing Grace (Mahalia Jackson)"],
  },

  // ═══════════════════════════════════════════════════════
  // METAL
  // ═══════════════════════════════════════════════════════

  {
    name: "Double Bass Straight",
    emoji: ':hammer:',
    description: "Double grosse caisse en DC continues : euclid(16,16). Snare sur 2 et 4, hihat en croches. Fondement du thrash et power metal.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 240, typical: 180 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(16, 16), 0.9),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) // double bass sur toutes les DC"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4), 1.0),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(16, 8), 0.7),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8)"
      },
    ],
    compatibleGenres: ["Thrash Metal", "Death Metal", "Power Metal"],
    examples: ["Painkiller (Judas Priest)", "Master of Puppets (Metallica)"],
  },

  {
    name: "Blast Beat",
    emoji: ':skull:',
    description: "Kick et snare qui alternent sur toutes les DC : pattern binaire 10101010... Exclusif au metal extrême. Euclid(16,8) pour kick, rotate 1 pour snare.",
    timeSignature: '4/4',
    tempo: { min: 160, max: 280, typical: 220 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(16, 8), 1.0),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) = [1,0,1,0,1,0,1,0,...]"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 8), 1), 1.0),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 8), 1) // alternance kick/snare"
      },
    ],
    compatibleGenres: ["Death Metal", "Grindcore", "Black Metal"],
    examples: ["Hammer Smashed Face (Cannibal Corpse)", "Chapel of Ghouls (Morbid Angel)"],
  },

  {
    name: "Groove Metal",
    emoji: ':metal:',
    description: "Metal mid-tempo syncopé. Kick en euclid(16,5) sur 2 mesures avec décalage, snare puissante sur 2 et 4, hihat en croches. Le groove naît des silences entre les kicks. Inspiré de Pantera.",
    timeSignature: '4/4',
    tempo: { min: 95, max: 145, typical: 115 },
    feel: 'half-time',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 3)],
          [0, 16], 1.0, 0.8
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotate(euclid(16,5), 3) // kick groove syncopé"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)],
          1.0
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) × 2 // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 8)],
          0.75
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) × 2 // croches"
      },
    ],
    compatibleGenres: ["Groove Metal", "Heavy Metal", "Nu-Metal", "Southern Metal"],
    examples: ["Walk (Pantera)", "Drag the Waters (Pantera)"],
  },

  {
    name: "Metalcore",
    emoji: ':zap:',
    description: "Metalcore avec section de breakdown. Couplet : double grosse caisse en euclid(16,8). Breakdown : half-time lourd, kick sur noires 1 et 3, snare unique sur beat 3. Sur 2 mesures.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 200, typical: 168 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: [
          ...withVelocity(RhythmPattern.euclid(16, 8), 0.95),
          1.0,0,0,0, 0,0,0,0, 0,0,0,0, 1.0,0,0,0
        ],
        division: 's',
        tonal: "euclid(16,8) verse + pattern half-time breakdown"
      },
      {
        part: 'snare',
        steps: [
          ...withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4), 1.0),
          0,0,0,0, 0,0,0,0, 1.0,0,0,0, 0,0,0,0
        ],
        division: 's',
        tonal: "snare 2/4 (verse) + snare beat 3 seulement (breakdown)"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 4)],
          0.75
        ),
        division: 's',
        tonal: "euclid(16,8) verse + euclid(16,4) breakdown lourd"
      },
    ],
    compatibleGenres: ["Metalcore", "Deathcore", "Post-Hardcore"],
    examples: ["My Curse (Killswitch Engage)", "Alone I Stand (Trivium)"],
  },

  {
    name: "Doom Metal",
    emoji: ':new_moon:',
    description: "Doom metal très lent et lourd. Kick et snare en noires sur 2 mesures (euclid(4,2)), hihat très espacé en euclid(8,2). Le silence est aussi important que les frappes. Inspiré de Black Sabbath.",
    timeSignature: '4/4',
    tempo: { min: 40, max: 80, typical: 60 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(4, 2), ...RhythmPattern.euclid(4, 2)],
          [0, 4], 1.0, 0.85
        ),
        division: 'q',
        tonal: "RhythmPattern.euclid(4, 2) × 2 // kick sur noires 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1),
           ...RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1)],
          1.0
        ),
        division: 'q',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1) × 2 // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)],
          0.7
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 // hihat très espacé"
      },
    ],
    compatibleGenres: ["Doom Metal", "Stoner Rock", "Sludge Metal", "Heavy Metal"],
    examples: ["Black Sabbath (Black Sabbath)", "Electric Funeral (Black Sabbath)"],
  },

  // ═══════════════════════════════════════════════════════
  // COUNTRY / FOLK
  // ═══════════════════════════════════════════════════════

  {
    name: "Country Train Beat",
    emoji: ':steam_locomotive:',
    description: "Imite le rythme d'un train. Kick et snare alternés sur chaque noire, hihat continu. Euclidien E(2,4) pour kick (temps 1 et 3), rotate 1 pour snare (2 et 4).",
    timeSignature: '4/4',
    tempo: { min: 120, max: 200, typical: 160 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(8, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // temps 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8)"
      },
    ],
    compatibleGenres: ["Country", "Rockabilly", "Americana"],
    examples: ["Folsom Prison Blues (Johnny Cash)", "Mystery Train (Elvis)"],
  },

  {
    name: "Texas Two-Step",
    emoji: ':cowboy_hat_face:',
    description: "Danse texane en 4/4. Kick sur les noires 1 et 3 (euclid(4,2)), snare sur 2 et 4, charleston en croches accentuées sur les noires pour donner l'élan caractéristique du two-step.",
    timeSignature: '4/4',
    tempo: { min: 130, max: 180, typical: 155 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(4, 2), 1.0),
        division: 'q',
        tonal: "RhythmPattern.euclid(4, 2) // kick sur noires 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1), 0.9),
        division: 'q',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(4, 2), 1) // snare sur 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(RhythmPattern.euclid(8, 4), [0,2,4,6], 0.85, 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // noires accentuées"
      },
    ],
    compatibleGenres: ["Country", "Western Swing", "Texas Country", "Country Dance"],
    examples: ["Boot Scootin' Boogie (Brooks & Dunn)", "Achy Breaky Heart (Billy Ray Cyrus)"],
  },

  {
    name: "Polka",
    emoji: ':beer:',
    description: "Danse bohémienne en 2/4. Pattern om-pah : kick sur le temps 1 (euclid(4,1)), snare sur le temps 2 (rotate 2), charleston en DC rapides. Tempo vif et caractère festif.",
    timeSignature: '2/4',
    tempo: { min: 120, max: 180, typical: 150 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(4, 1), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(4, 1) // grosse caisse sur temps 1"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(4, 1), 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(4, 1), 2) // snare sur temps 2"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.65),
        division: 's',
        tonal: "RhythmPattern.euclid(8, 8) // charleston en DC continues"
      },
    ],
    compatibleGenres: ["Polka", "Folk européen", "Musique bohémienne", "Oktoberfest"],
    examples: ["Škoda Lásky (Jaromir Vejvoda)", "Pennsylvania Polka"],
  },

  {
    name: "Gigue Irlandaise",
    emoji: ':shamrock:',
    description: "Gigue irlandaise en 6/8 rapide. Deux groupes de 3 croches. Grosse caisse sur les temps forts 1 et 4 (euclid(6,2)), snare sur la 3ème croche de chaque groupe, hihat continu.",
    timeSignature: '6/8',
    tempo: { min: 200, max: 320, typical: 260 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(6, 2), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 2) // temps 1 et 4 du 6/8"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(6, 2), 2), 0.85),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(6, 2), 2) // 3ème croche de chaque groupe"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(6, 6), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 6) // toutes les croches du 6/8"
      },
    ],
    compatibleGenres: ["Folk irlandais", "Celtic", "Gigue", "Musique traditionnelle"],
    examples: ["The Irish Washerwoman (traditionnel)", "Morrison's Jig"],
  },

  {
    name: "Reel Celtique",
    emoji: ':shamrock:',
    description: "Reel irlandais/celtique en 4/4 rapide. Deux paires de croches par temps, accent sur les temps 1 et 3. Binaire et droit, distinct de la gigue (6/8). Euclid(8,4) pour le kick.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 180, typical: 150 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(RhythmPattern.euclid(8, 4), [0,4], 1.0, 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) // kick sur les 4 temps, accents 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), 0.9),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) // toutes les croches"
      },
    ],
    compatibleGenres: ["Reel irlandais", "Celtic", "Folk écossais", "Musique traditionnelle"],
    examples: ["The Morning Dew (traditionnel)", "The Silver Spear"],
  },

  {
    name: "Tarantella",
    emoji: ':spider:',
    description: "Danse folklorique du sud de l'Italie en 6/8 rapide. Accent fort sur le temps 1, faible sur le temps 4. Tambourin (tamburello) en continu. Euclid(6,2) pour les temps forts.",
    timeSignature: '6/8',
    tempo: { min: 180, max: 300, typical: 240 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(RhythmPattern.euclid(6, 2), [0], 1.0, 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 2) // temps 1 et 4 — fort sur 1"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(6, 4), [0,3], 0.8, 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 4) // snare sur les temps intérieurs"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(6, 6), 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 6) // tamburello continu"
      },
    ],
    compatibleGenres: ["Tarantella", "Folk italien", "Folk napolitain", "Pizzica"],
    examples: ["Tarantella Napoletana (traditionnel)", "Pizzica di San Vito"],
  },

  // ═══════════════════════════════════════════════════════
  // MUSIQUES DU MONDE
  // ═══════════════════════════════════════════════════════

  {
    name: "Maqsum / Baladi",
    emoji: ':crescent_moon:',
    description: "Rythme égyptien le plus répandu en musique arabe. Doumbek : Dum sur croches 1 et 5, Tek fort sur 3 et 7, Ka léger sur 4. Pattern 8 croches : D..TKD.T. Binary 0b10011010.",
    timeSignature: '4/4',
    tempo: { min: 80, max: 160, typical: 120 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([1.0,0,0,0, 1.0,0,0,0], 1.0),
        division: 'e',
        tonal: "// Dum maqsum : croches 1 et 5 — sons graves du doumbek"
      },
      {
        part: 'snare',
        steps: withAccents([0,0,1.0,0.6, 0,0,1.0,0], [2,6], 1.0, 0.6),
        division: 'e',
        tonal: "// Tek fort (3 et 7), Ka léger (4) — RhythmPattern.binary(0b00110010)"
      },
    ],
    compatibleGenres: ["Musique arabe", "Raï", "Baladi égyptien", "Danse orientale"],
    examples: ["Inta Omri (Oum Kalthoum)", "Habibi Ya Nour El Ain (Amr Diab)"],
  },

  {
    name: "Bhangra",
    emoji: ':drum:',
    description: "Rythme punjabi au dhol. Dagga (peau grave) en euclid(16,5) avec accents, thili (peau aiguë) en euclid(16,7) décalé. Pattern imbriqué et propulsif, base du bhangra moderne et UK bhangra.",
    timeSignature: '4/4',
    tempo: { min: 100, max: 160, typical: 130 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(RhythmPattern.euclid(16, 5), [0,6,10], 1.0, 0.75),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) // dagga — sons graves du dhol"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 2), [4,12], 0.95, 0.6),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 2) // thili — sons aigus dhol"
      },
    ],
    compatibleGenres: ["Bhangra", "Musique punjabi", "Bollywood", "UK Bhangra"],
    examples: ["Mundian To Bach Ke (Panjabi MC)", "Tunak Tunak Tun (Daler Mehndi)"],
  },

  {
    name: "Soukous",
    emoji: ':earth_africa:',
    description: "Rumba congolaise / soukous. Kick sur 1 et 3, snare sur 2 et 4, clave son 3-2 sur 2 mesures (hex '9228'), hi-hat continu. La guitare lead (sebene) joue des figures rapides syncopées.",
    timeSignature: '4/4',
    tempo: { min: 130, max: 180, typical: 155 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)], 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)],
          0.95
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) × 2 // temps 2 et 4"
      },
      {
        part: 'clave',
        steps: withVelocity(RhythmPattern.hex('9228'), 1.0),
        division: 'e',
        tonal: "RhythmPattern.hex('9228') // clave son 3-2 adaptée au soukous"
      },
      {
        part: 'hihat',
        steps: withVelocity([...RhythmPattern.euclid(8, 8), ...RhythmPattern.euclid(8, 8)], 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) × 2 // hi-hat continu"
      },
    ],
    compatibleGenres: ["Soukous", "Rumba congolaise", "Ndombolo", "Afropop"],
    examples: ["Nakombela (Tabu Ley Rochereau)", "Mario (Franco et TPOK Jazz)"],
  },

  {
    name: "Highlife",
    emoji: ':star2:',
    description: "Highlife ghanéen des années 50-60. Mélange de rythmes africains et de jazz. Kick sur 1 et 3, snare sur 2 et 4, clave son 3-2 adaptée en agogo/cowbell, hi-hat continu. Père du soukous et de l'afrobeats.",
    timeSignature: '4/4',
    tempo: { min: 90, max: 130, typical: 108 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)], 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 // temps 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)],
          0.9
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) × 2 // temps 2 et 4"
      },
      {
        part: 'perc',
        steps: withVelocity(RhythmPattern.hex('9228'), 0.85),
        division: 'e',
        tonal: "RhythmPattern.hex('9228') // clave son adaptée — agogo bell"
      },
      {
        part: 'hihat',
        steps: withVelocity([...RhythmPattern.euclid(8, 8), ...RhythmPattern.euclid(8, 8)], 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) × 2 // hi-hat continu"
      },
    ],
    compatibleGenres: ["Highlife", "Afropop", "Musique ghanéenne", "Jùjú"],
    examples: ["Sweet Mother (Prince Nico Mbarga)", "Joromi (Sir Victor Uwaifo)"],
  },

  {
    name: "Mbalax",
    emoji: ':drum:',
    description: "Mbalax sénégalais de Youssou N'Dour. Rythme sabar polyrhythmique : mbed (grosse peau) en euclid(16,7), nder (peau aiguë) en euclid(16,5) décalé, mbung-mbung en euclid(16,3). Très syncopé.",
    timeSignature: '4/4',
    tempo: { min: 110, max: 160, typical: 135 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 7), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 4)],
          [0,4,8,12,16,20,24,28], 1.0, 0.65
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 7) — mbed (grosse peau sabar)"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 6)],
          0.9
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation — nder (peau aiguë sabar)"
      },
      {
        part: 'perc',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 3), 1),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 3), 5)],
          0.8
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 3) + rotation — mbung-mbung"
      },
    ],
    compatibleGenres: ["Mbalax", "Musique sénégalaise", "World", "Afropop"],
    examples: ["7 Seconds (Youssou N'Dour)", "Birima (Youssou N'Dour)"],
  },

  {
    name: "Karşılama 9/8",
    emoji: ':crescent_moon:',
    description: "Rythme de danse turc en 9/8, découpé en groupes 2+2+2+3. Tablà ou darbuka. Kick sur les débuts de groupe (0,2,4,6), snare en euclid(9,5), hihat sur toutes les croches.",
    timeSignature: '9/8',
    tempo: { min: 100, max: 180, typical: 140 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents([1,0, 1,0, 1,0, 1,0,0], [0,2,4,6], 1.0, 0.7),
        division: 'e',
        tonal: "// Kick 9/8 : groupement 2+2+2+3 — positions 0, 2, 4, 6"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(9, 5), [0,2,4,6], 1.0, 0.6),
        division: 'e',
        tonal: "RhythmPattern.euclid(9, 5) // E(5,9) distribution euclidienne"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(9, 9), 0.65),
        division: 'e',
        tonal: "RhythmPattern.euclid(9, 9) // toutes les croches du 9/8"
      },
    ],
    compatibleGenres: ["Folk turc", "Musique ottomane", "World", "Danse orientale"],
    examples: ["Karşılama (traditionnel turc)", "Çiftetelli"],
  },

  {
    name: "Saidi",
    emoji: ':sparkles:',
    description: "Rythme de Haute-Égypte. Doumbek : Dum-Tek-Dum-Dum-Tek en 8 croches. Double Dum caractéristique sur les positions 5 et 6. Accompagne la danse du bâton (raqs al-assaya).",
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, typical: 110 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // Dum : croches 1, 5, 6 (base 1) → 0, 4, 5 (base 0)
        steps: withAccents([1.0,0,0,0, 1.0,0.8,0,0], [0], 1.0, 0.8),
        division: 'e',
        tonal: "// Dum saidi : croches 1, 5, 6 — double Dum caractéristique"
      },
      {
        part: 'snare',
        // Tek : croches 3 et 8 (base 1) → 2 et 7 (base 0)
        steps: withVelocity([0,0,1.0,0, 0,0,0,1.0], 0.9),
        division: 'e',
        tonal: "// Tek saidi : croches 3 et 8 — RhythmPattern.binary(0b00100001)"
      },
    ],
    compatibleGenres: ["Musique égyptienne", "Saidi", "Danse du bâton", "Folklore égyptien"],
    examples: ["Aleik Saloum (traditionnel)", "Raqs al-assaya (danse du bâton)"],
  },

  // ═══════════════════════════════════════════════════════
  // AFRIQUE CENTRALE — CONGO / ANGOLA
  // ═══════════════════════════════════════════════════════

  {
    name: "Rumba Congolaise",
    emoji: ':saxophone:',
    description: "Rumba lente de Kinshasa, fondement de toute la musique africaine moderne. Grosse caisse sur 1 et 3, snare discrète, clave son 3-2 sur 2 mesures, hi-hat léger. Franco TPOK Jazz, Dr Nico, Tabu Ley.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 90, typical: 75 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)], 0.95),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 // grosse caisse 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)],
          0.7
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) × 2 // snare douce 2 et 4"
      },
      {
        part: 'clave',
        steps: withVelocity(RhythmPattern.hex('9228'), 0.9),
        division: 'e',
        tonal: "RhythmPattern.hex('9228') // clave son 3-2 adaptée à la rumba congolaise"
      },
      {
        part: 'hihat',
        steps: withVelocity([...RhythmPattern.euclid(8, 8), ...RhythmPattern.euclid(8, 8)], 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) × 2 // hi-hat léger"
      },
    ],
    compatibleGenres: ["Rumba congolaise", "Lingala", "Musique congolaise classique"],
    examples: ["Lisanga ya Banganga (Franco et TPOK Jazz)", "Africa Mokili Mobimba (Dr Nico)"],
  },

  {
    name: "Cavacha",
    emoji: ':guitar:',
    description: "Style de percussion congolais des années 70, popularisé par TP OK Jazz. Hi-hat ouvert sur les contretemps (signature du cavacha), grosse caisse syncopée, snare discrète. Ancêtre du soukous moderne.",
    timeSignature: '4/4',
    tempo: { min: 100, max: 145, typical: 120 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents([1,0,0,0, 0.7,0,1,0, 0,0,0.7,0, 1,0,0,0], [0,6,12], 1.0, 0.7),
        division: 's',
        tonal: "// Kick cavacha syncopé : positions 1, 3e, 7 sur 16 DC"
      },
      {
        part: 'snare',
        steps: withVelocity(RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4), 0.8),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) // snare douce 2 et 4"
      },
      {
        part: 'hihat',
        // Hi-hat ouvert sur les off-beats — signature du cavacha
        steps: withAccents(RhythmPattern.rotate(RhythmPattern.euclid(16, 4), 2), [], 0.95, 0.95),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 4), 2) // hi-hat ouvert sur off-beats"
      },
    ],
    compatibleGenres: ["Cavacha", "Rumba congolaise", "Musique congolaise des années 70"],
    examples: ["Cavacha (Franco et TPOK Jazz)", "Pépé Kalle — Nakombela"],
  },

  {
    name: "Kwassa Kwassa",
    emoji: ':dancer:',
    description: "Kwassa kwassa congolais de Kanda Bongo Man (années 80-90). Basse répétitive syncopée euclid(16,5), hi-hat DC continu, snare sur 2 et 4. Caractère dansant et léger, popularisé en Occident.",
    timeSignature: '4/4',
    tempo: { min: 110, max: 150, typical: 130 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 3)],
          [0, 16], 1.0, 0.75
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // basse kwassa syncopée"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)],
          0.85
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) × 2 // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 16), ...RhythmPattern.euclid(16, 16)],
          0.65
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 16) × 2 // hi-hat continu léger"
      },
    ],
    compatibleGenres: ["Kwassa kwassa", "Soukous", "Afropop congolais"],
    examples: ["Iyi (Kanda Bongo Man)", "Nakombela (Kanda Bongo Man)"],
  },

  {
    name: "Ndombolo",
    emoji: ':fire:',
    description: "Ndombolo congolais de Kinshasa (fin des années 90). Dérivé ultra-rapide du soukous. Kick dense euclid(16,7), hi-hat frénétique euclid(16,11), polyrhythmie typique. Werrason, Koffi Olomide, Wenge Musica.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 190, typical: 165 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 7), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 7), 5)],
          [0,8,16,24], 1.0, 0.7
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 7) + rotation // kick ndombolo dense"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4),
           ...RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4)],
          0.95
        ),
        division: 's',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(16, 2), 4) × 2 // snare 2 et 4"
      },
      {
        part: 'hihat',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 11), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 11), 3)],
          [1,5,9,13,17,21,25,29], 0.85, 0.5
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 11) — hi-hat ndombolo frénétique"
      },
    ],
    compatibleGenres: ["Ndombolo", "Soukous rapide", "Musique congolaise contemporaine"],
    examples: ["Jamaïque (Werrason)", "Effrakata (Koffi Olomide)"],
  },

  {
    name: "Kizomba",
    emoji: ':two_hearts:',
    description: "Kizomba angolaise, descendante de la semba. Tempo lent et sensuel, grosse caisse sur 1 et 3, snare sur 2 et 4, basse syncopée euclid(16,5) sur 2 mesures. Influence kazdura/zouk love.",
    timeSignature: '4/4',
    tempo: { min: 55, max: 85, typical: 70 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity([...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)], 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 // grosse caisse 1 et 3"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)],
          0.9
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2) × 2 // snare 2 et 4"
      },
      {
        part: 'bass',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 2)],
          [0, 16], 1.0, 0.7
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) + rotation // basse kizomba syncopée"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 8)],
          0.55
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) × 2 // hi-hat doux en croches"
      },
    ],
    compatibleGenres: ["Kizomba", "Semba", "Angolais", "Zouk Love"],
    examples: ["Semba (Bonga)", "Kaissa (Kaysha)"],
  },

  // ═══════════════════════════════════════════════════════
  // CLASSIQUE / MARCHE
  // ═══════════════════════════════════════════════════════

  {
    name: "Marche",
    emoji: ':postal_horn:',
    description: "Rythme militaire en 2/4. Snare sur tous les temps avec accents forts/faibles alternés. Grosse caisse sur le 1. Euclidien E(4,4) pour la snare (toutes les croches).",
    timeSignature: '2/4',
    tempo: { min: 60, max: 120, typical: 90 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(RhythmPattern.euclid(4, 1), 1.0),
        division: 'e',
        tonal: "RhythmPattern.euclid(4, 1) // grosse caisse sur temps 1 seulement"
      },
      {
        part: 'snare',
        steps: withAccents(RhythmPattern.euclid(4, 4), [0, 2], 1.0, 0.55),
        division: 'e',
        tonal: "RhythmPattern.euclid(4, 4) avec accents alternés — fort/faible"
      },
    ],
    compatibleGenres: ["Marche militaire", "Fanfare", "Opéra comique"],
    examples: ["Colonel Bogey March", "Stars and Stripes Forever (Sousa)"],
  },

  {
    name: "Bolero de Ravel",
    emoji: ':musical_score:',
    description: "Ostinato répétitif en 3/4 sur toute la pièce. Pattern de snare : noire–croche-croche–croche-croche (binary 0b100110). Représenté via RhythmPattern.binary.",
    timeSignature: '3/4',
    tempo: { min: 58, max: 76, typical: 66 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'snare',
        // bar 1 : noire + 2×croche = 100 110 en croches → binary '100110'
        // bar 2 : 2×croche + 2×croche + 2×croche = 110 110 110 = binary '110110'
        steps: withVelocity(
          [...RhythmPattern.binary(0b100110), ...RhythmPattern.binary(0b110110)],
          0.85
        ),
        division: 'e',
        tonal: "RhythmPattern.binary(0b100110) + RhythmPattern.binary(0b110110)"
      },
      {
        part: 'bass',
        steps: withVelocity(
          [...RhythmPattern.euclid(6, 2), ...RhythmPattern.euclid(6, 2)],
          0.9
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 2) × 2 // basse sur temps 1 et 4 du cycle 3/4"
      },
    ],
    compatibleGenres: ["Classique", "Bolero espagnol"],
    examples: ["Boléro (Ravel)", "Boléro (Ravel — crescendo intégral)"],
  },

  // ═══════════════════════════════════════════════════════
  // MUSIQUE INDIENNE CLASSIQUE (TALAS HINDUSTANI)
  // ═══════════════════════════════════════════════════════

  {
    name: "Teentaal",
    emoji: ':drum:',
    description: "Le taal le plus utilisé de la musique hindustanie classique. 16 matras (temps) en 4 vibhags égaux de 4 (4+4+4+4). Le sam (temps 1, fort) est la résolution ; le khali (temps 9, vide) est joué plus légèrement, sans frappe grave. Theka de base au tabla : Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Na | Ta Dhin Dhin Dha. Chaque syllabe ('bols') indique un timbre spécifique du tabla double.",
    timeSignature: '4/4',
    tempo: { min: 30, max: 300, typical: 80 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
          [0, 4, 8, 12], 1.0, 0.7
        ),
        division: 'e',
        tonal: "// Bayan (tabla grave) : Dum sur chaque vibhag — sam(1) fort, khali(9) léger"
      },
      {
        part: 'snare',
        steps: withAccents(
          [1,1,1,0, 1,1,1,0, 1,1,1,1, 1,1,1,0],
          [0, 4, 8, 12], 1.0, 0.6
        ),
        division: 'e',
        tonal: "// Dayan (tabla aigu) : Dha-Dhin-Dhin / Dha-Tin-Tin-Na / Ta-Dhin-Dhin"
      },
    ],
    compatibleGenres: ["Musique hindustanie classique", "Raga", "Khyal", "Bandish", "Thumri"],
    examples: ["Raag Yaman en Teentaal (Pandit Ravi Shankar)", "Khyal vilambit (Ustad Rashid Khan)", "Tabla solo (Ustad Zakir Hussain)"],
  },

  {
    name: "Rupak Taal",
    emoji: ':pray:',
    description: "Taal de 7 matras en 3 vibhags (3+2+2) de la musique hindustanie. Particularité unique : le premier vibhag (3 temps) est un KHALI (vide, non-résolu), renversant l'ordre conventionnel. Le sam se confond avec le khali. Theka : Tin Tin Na | Dhi Na | Dhi Na. Très utilisé dans les thumris romantiques et le semi-classique. Sa mesure à 7 temps crée un balancement naturel distinct de la carrure occidentale.",
    timeSignature: '7/8',
    tempo: { min: 40, max: 200, typical: 90 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [0,0,0, 1,0, 1,0],
          [3, 5], 0.95, 0.65
        ),
        division: 'e',
        tonal: "// Bayan : vide sur les 3 premiers temps (khali), Dhi sur vibhags 2 et 3"
      },
      {
        part: 'snare',
        steps: withAccents(
          [1,1,1, 1,0, 1,0],
          [0,1,2, 3, 5], 0.55, 0.9
        ),
        division: 'e',
        tonal: "// Dayan : Tin-Tin-Na (khali léger) | Dhi-Na | Dhi-Na"
      },
    ],
    compatibleGenres: ["Musique hindustanie", "Thumri", "Ghazal", "Semi-classique indien"],
    examples: ["Thumri en Rupak (Girija Devi)", "Raag Bhairavi rupak (Pandit Ajoy Chakraborty)"],
  },

  {
    name: "Adi Talam",
    emoji: ':musical_note:',
    description: "Le talam le plus fondamental de la musique carnatique (Inde du Sud). 8 matras en structure Chatusra-Laghu (4) + Drutam (2) + Drutam (2) = 4+2+2. Correspond au cycle de la plupart des krithis (compositions) de la tradition trindé Thyagaraja-Muthuswami Dikshitar-Syama Sastri. Le solkattu (vocalisation rythmique) : Ta-Ka-Di-Mi Ta-Ka Ta-Ka. Équivalent à 8/8 avec accentuation 4+2+2.",
    timeSignature: '4/4',
    tempo: { min: 40, max: 240, typical: 80 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [1,0,0,0, 1,0, 1,0],
          [0, 4, 6], 1.0, 0.75
        ),
        division: 'e',
        tonal: "// Mridangam thattu (pouce) : 4+2+2 — 3 points d'accentuation du cycle"
      },
      {
        part: 'snare',
        steps: withAccents(
          [1,1,1,1, 1,1, 1,1],
          [0, 4, 6], 0.65, 0.95
        ),
        division: 'e',
        tonal: "// Konnakol : Ta-Ka-Di-Mi | Ta-Ka | Ta-Ka — toutes les matras marquées"
      },
    ],
    compatibleGenres: ["Musique carnatique", "Krithi", "Varnam", "Bhajan du Sud"],
    examples: ["Sri Gananatham (Muthuswami Dikshitar)", "Venkateswara Suprabhatam"],
  },

  // ═══════════════════════════════════════════════════════
  // FLAMENCO (COMPLÉMENTS)
  // ═══════════════════════════════════════════════════════

  {
    name: "Flamenco Seguiriya",
    emoji: ':rose:',
    description: "La seguiriya est considérée comme le cante jondo le plus profond du flamenco — une expression de la douleur et de la mort. Son cycle de 12 temps a des accents différents de la soleá et de la bulería : 1, 3, 6, 8, 11 (soit + 1 que la bulería mais décalé). Commence sur le temps 12 (anacrouse). Structure 12/4 découpée comme 3+3+2+2+2. Associée au duende de Federico García Lorca.",
    timeSignature: '12/8',
    tempo: { min: 35, max: 65, typical: 48 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        steps: withAccents(
          RhythmPattern.binary(0b100100101001),
          [0, 2, 5, 7, 10],
          1.0, 0.6
        ),
        division: 'e',
        tonal: "RhythmPattern.binary(0b100100101001) // accents : 1, 3, 6, 8, 11"
      },
    ],
    compatibleGenres: ["Flamenco", "Cante jondo"],
    examples: ["Seguiriya (Manuel Torre)", "Seguiriya (Camarón de la Isla)", "Seguiriya (Enrique Morente)"],
  },

  {
    name: "Rumba Flamenca",
    emoji: ':guitar:',
    description: "La rumba flamenca, différente de la rumba cubaine, est un style léger et festif du flamenco. Son pattern de palmas (mains) à 4/4 crée un contretemps caractéristique. La guitare utilise le rasgueado (grattage avec les doigts) en pattern syncopé. Très populaire dans les fiestas andalouses et reprise mondialement par les Gitans catalans.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 180, typical: 150 },
    feel: 'latin',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withVelocity(
          [...RhythmPattern.euclid(8, 3), ...RhythmPattern.rotate(RhythmPattern.euclid(8, 3), 1)],
          1.0
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 3) + rotation — golpe guitare flamenco"
      },
      {
        part: 'snare',
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 3)],
          0.85
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) — palmas en contretemps"
      },
      {
        part: 'chord',
        steps: withAccents(
          [...RhythmPattern.euclid(16, 5), ...RhythmPattern.rotate(RhythmPattern.euclid(16, 5), 3)],
          [1,5,9,13,17,21,25,29], 0.9, 0.5
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 5) — rasgueado rumba flamenca"
      },
    ],
    compatibleGenres: ["Flamenco", "Rumba Gitane", "Flamenco Fusion"],
    examples: ["Entre dos Aguas (Paco de Lucía)", "La Negra Flor (Gipsy Kings)", "Bamboleo (Gipsy Kings)"],
  },

  // ═══════════════════════════════════════════════════════
  // AFRIQUE DU NORD — GNAOUA / AMAZIGH
  // ═══════════════════════════════════════════════════════

  {
    name: "Gnaoua",
    emoji: ':moon:',
    description: "Rythme rituel des confréries Gnaoua (Gnawa) du Maroc, descendants d'esclaves subsahariens. Le guembri (3 cordes, basse) et les qraqeb (crotales métalliques) créent un hypnotisme rythmique particulier. Les cérémonies lila visent la transe et la guérison. Le pattern de base : temps forts sur 1 et 4 d'une mesure à 6/8, avec subdivision ternaire syncopée. Influence majeure sur les bluesmen américains via les Berbères et l'esclavage transatlantique.",
    timeSignature: '6/8',
    tempo: { min: 80, max: 160, typical: 115 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          RhythmPattern.binary(0b100100),
          [0, 3], 1.0, 0.75
        ),
        division: 'e',
        tonal: "RhythmPattern.binary(0b100100) // guembri : temps 1 et 4 du 6/8"
      },
      {
        part: 'snare',
        steps: withAccents(
          RhythmPattern.binary(0b010110),
          [1, 3, 4], 0.9, 0.55
        ),
        division: 'e',
        tonal: "RhythmPattern.binary(0b010110) // qraqeb : syncopé entre les temps"
      },
    ],
    compatibleGenres: ["Gnaoua", "Lila marocaine", "World fusion", "Trance rituelle"],
    examples: ["Boulalie (Master Musicians of Joujouka)", "Lila Gnaoua (Maâlem Mahmoud Guinia)", "Gnawa Diffusion"],
  },

  // ═══════════════════════════════════════════════════════
  // MUSIQUES D'ASIE ORIENTALE
  // ═══════════════════════════════════════════════════════

  {
    name: "Taiko Matsuri",
    emoji: ':drum:',
    description: "Pattern de taiko (grandes tambours japonais) typique des matsuri (festivals shinto). Le taiko utilise deux baguettes (bachi) de frappe différenciée : frappe forte centrale (don) et frappe légère sur le bord (ka). Pattern de base en 4/4 : don-ko-don-ko avec variations propulsives. Essentiel dans les processions et les danses bon-odori. L'ensemble de taiko (kumi-daiko) créé par Daihachi Oguchi dans les années 1950 a popularisé ce style mondialement.",
    timeSignature: '4/4',
    tempo: { min: 80, max: 200, typical: 130 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(8, 4), ...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 2)],
          [0, 4, 8, 12], 1.0, 0.7
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 4) + rotation — Don (frappe centrale forte)"
      },
      {
        part: 'snare',
        steps: withAccents(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 3)],
          [2, 6, 10, 14], 0.75, 0.45
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) — Ka (frappe bord)"
      },
    ],
    compatibleGenres: ["Musique japonaise traditionnelle", "Matsuri", "J-Pop fusion"],
    examples: ["Matsuri (Kodo)", "Yatai Bayashi (Kodo)", "Hiten (Kodo)"],
  },

  {
    name: "Gamelan Gong",
    emoji: ':bell:',
    description: "Cycle de gong balinais représentant la structure temporelle du gamelan. Le gong ageng (grand gong) marque la fin du cycle (gongan), le kempur marque les mi-cycles, les kenong et kempli subdivisent. Structure en puissance de 2 : 8 ou 16 beats par gong. Ici représenté en 8 beats (gongan de 8). Le gamelan utilise un système de stratification rythmique (subdivisions imbriquées) sans équivalent dans les musiques occidentales.",
    timeSignature: '4/4',
    tempo: { min: 40, max: 120, typical: 70 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [1, 0, 1, 0, 1, 0, 1, 1],
          [0, 7], 0.5, 0.9
        ),
        division: 'e',
        tonal: "// Kenong : subdivision kenong sur beats 1,3,5,7 + gong ageng final"
      },
      {
        part: 'chord',
        steps: withAccents(
          RhythmPattern.euclid(8, 8),
          [0, 2, 4, 6], 0.6, 0.4
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) — kempli (petite cloche) : subdivision continue"
      },
    ],
    compatibleGenres: ["Gamelan balinais", "Musique javanaise", "World", "Néo-classique"],
    examples: ["Kecak (gamelan de feu de Bali)", "Legong (gamelan de palais)", "Music for 18 Musicians — Reich (inspiration)"],
  },

  // ═══════════════════════════════════════════════════════
  // KLEZMER / MUSIQUE TSIGANE & ASHKÉNAZE
  // ═══════════════════════════════════════════════════════

  {
    name: "Klezmer Freylekhs",
    emoji: ':violin:',
    description: "Le freylekhs (de l'yiddish : joyeux) est la danse la plus répandue du répertoire klezmer ashkénaze d'Europe de l'Est. Mesure à 4/4 avec un feel 'bulgar' (entre straight et swing), accent fort sur le 1 et contretemps syncopés caractéristiques. Le klarineter (clarinettiste) et le fiddler (violoniste) jouent au-dessus d'une base rythmique de tsimbl (cymbalum) et de tshimap (tambour). Musique des mariages juifs d'Europe centrale, rescapée de la Shoah et renaissante depuis les années 1980.",
    timeSignature: '4/4',
    tempo: { min: 120, max: 200, typical: 160 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        steps: withAccents(
          [...RhythmPattern.euclid(8, 3), ...RhythmPattern.rotate(RhythmPattern.euclid(8, 3), 2)],
          [0, 8], 1.0, 0.7
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 3) — grosse caisse freylekhs syncopée"
      },
      {
        part: 'snare',
        steps: withAccents(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1),
           ...RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 3)],
          [2, 6, 10, 14], 0.95, 0.6
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(RhythmPattern.euclid(8, 4), 1) — tsimbl/snare contretemps"
      },
      {
        part: 'hihat',
        steps: withVelocity(
          [...RhythmPattern.euclid(16, 8), ...RhythmPattern.euclid(16, 8)],
          0.6
        ),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) — croches continues freylekhs"
      },
    ],
    compatibleGenres: ["Klezmer", "Musique ashkénaze", "Musique tsigane", "Mariage juif"],
    examples: ["Donna Donna (Klezmer)", "Shpil-Zhe Mir (Dave Tarras)", "David Krakauer Klezmer Madness"],
  },

  // ═══════════════════════════════════════════════════════
  // FLAMENCO COMPLÉMENTAIRE (C-1)
  // ═══════════════════════════════════════════════════════

  {
    name: "Flamenco Alegrías",
    emoji: ':dancer:',
    description: "Cycle de 12 pulsations en croches — le compás por alegrías. Les accents tombent sur les temps 1, 4, 7, 8, 10, 12 (index 0-based : 0, 3, 6, 7, 9, 11), différenciant les alegrías de la soleá (accents sur 3,6,8,10,12). Le caracttère des alegrías est festif et brillant — les compás commencent sur le temps 1 fort, contrairement à la soleá qui commence 'en levé'. Palos 'por alegrías' : alegrías proprement dite, cantiñas, romera, mirabras.",
    timeSignature: '12/8',
    tempo: { min: 130, max: 200, typical: 160 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        // Accents alegrías : 0, 3, 6, 7, 9, 11 (vs soleá : 2, 5, 7, 9, 11)
        steps: withAccents(
          [1,0,0,1,0,0,1,1,0,1,0,1],
          [0, 3, 6, 7, 9, 11], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual [1,0,0,1,0,0,1,1,0,1,0,1] — compás alegrías (accents 1,4,7,8,10,12)"
      },
      {
        part: 'kick',
        // Cajon bajo : temps forts 1, 4, 7 — golpe grave
        steps: withAccents(
          [1,0,0,1,0,0,1,0,0,0,0,0],
          [0, 3, 6], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual kick — temps forts alegrías"
      },
      {
        part: 'hihat',
        // Palmas chicas continues (croches égales)
        steps: withVelocity(RhythmPattern.euclid(12, 12), 0.45),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 12) — palmas chicas continues"
      },
    ],
    compatibleGenres: ["Flamenco", "Alegrías", "Cantiñas", "Musique andalouse"],
    examples: ["Alegrías (Paco de Lucía)", "Cantiñas (Camarón de la Isla)", "Romera (Tomatito)"],
  },

  {
    name: "Flamenco Tangos",
    emoji: ':dancer:',
    description: "Le tangos flamenco est en mesure binaire (4/4 à 2 tiempos), contrairement aux palos de 12 temps. Chaque compás compte 4 pulsations avec un fort accent syncopé caractéristique : le contretemps avant le 2 et avant le 4 donnent la sensation de balancement 'dos por cuatro'. Le tangos regroupe les palos : tangos, tientos (variante lente), farruca, garrotín, rumba gitana. Tempo vif, caractère joyeux et populaire.",
    timeSignature: '4/4',
    tempo: { min: 140, max: 220, typical: 175 },
    feel: 'latin',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        // Tangos : accent sur les 16ths 0, 4, 6, 8, 12, 14 → [1,0,0,0, 1,0,1,1, 1,0,0,0, 1,0,1,0]
        steps: withAccents(
          [1,0,0,0, 1,0,1,1, 1,0,0,0, 1,0,1,0],
          [0, 4, 8, 12], 1.0, 0.8
        ),
        division: 's',
        tonal: "Manual 16ths [1,0,0,0,1,0,1,1,1,0,0,0,1,0,1,0] — tangos flamenco syncopé"
      },
      {
        part: 'kick',
        // Cajon bajo sur le 1 et 9 (beats 1 et 3)
        steps: withAccents(RhythmPattern.euclid(16, 2), [0], 1.0, 0.8),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 2) — cajon grave beats 1 et 3"
      },
      {
        part: 'hihat',
        // Croches continues
        steps: withVelocity(RhythmPattern.euclid(16, 8), 0.45),
        division: 's',
        tonal: "RhythmPattern.euclid(16, 8) — croches continues tangos"
      },
    ],
    compatibleGenres: ["Flamenco", "Tangos", "Rumba flamenca", "Tientos", "Garrotín"],
    examples: ["Tangos (Paco de Lucía)", "Entre Dos Aguas (Paco de Lucía — rumba)", "Tangos del Sacromonte (traditionnel)"],
  },

  {
    name: "Flamenco Farruca",
    emoji: ':dancer:',
    description: "La farruca est l'un des palos les plus graves et les plus exigeants du flamenco — danse exclusivement masculine à l'origine. En mesure binaire (4/4), son compás est marqué, sévère, sans fioritures : chaque temps est clairement afirmé. Le cycle 'por farruca' se déroule sur 4 compases de 4 tiempos (16 temps au total). Le caractère dramatique et sobre de la farruca en fait un palo difficile à maîtriser — ses tempos lents exigent un contrôle maximal du corps.",
    timeSignature: '4/4',
    tempo: { min: 60, max: 120, typical: 80 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'perc',
        // Farruca : accent marqué sur 1 et 3, contretemps syncopé entre 2 et 3
        steps: withAccents(
          [...[1,0,1,0,0,1,0,1], ...[1,0,1,0,0,1,0,1]],
          [0, 2, 8, 10], 1.0, 0.75
        ),
        division: 'e',
        tonal: "Manual [1,0,1,0,0,1,0,1] × 2 — compás farruca grave et marqué"
      },
      {
        part: 'kick',
        // Golpe (coup de talon) : temps 1 et 3
        steps: withVelocity(
          [...RhythmPattern.euclid(8, 2), ...RhythmPattern.euclid(8, 2)],
          1.0
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 2) × 2 — golpe farruca beats 1 et 3"
      },
      {
        part: 'snare',
        // Caisse claire (planta) : temps 2 et 4
        steps: withVelocity(
          [...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2), ...RhythmPattern.rotate(RhythmPattern.euclid(8, 2), 2)],
          0.85
        ),
        division: 'e',
        tonal: "RhythmPattern.rotate(euclid(8,2), 2) × 2 — planta farruca beats 2 et 4"
      },
    ],
    compatibleGenres: ["Flamenco", "Farruca", "Danse flamenca masculine", "Palo grave"],
    examples: ["Farruca (Vicente Escudero — pionnier)", "Farruca (Mario Maya)", "Farruca (Farruquito)"],
  },

  // ═══════════════════════════════════════════════════════
  // TÂLAS CARNATIC (C-2)
  // ═══════════════════════════════════════════════════════

  {
    name: "Misra Chapu (7 matras = 3+4)",
    emoji: ':musical_note:',
    description: "Le Misra Chapu est un talam de la musique carnatique (Inde du Sud) à 7 matras structurées en 3+4. Le solkattu (vocalisation rythmique) : Ta-Ki-Ṭa (3) + Ta-Ka-Di-Mi (4). Ce talam 'chapu' (mot tamoule désignant une subdivision inégale) est asymétrique : la première cellule de 3 et la seconde de 4 créent un mouvement en 'boitement' caractéristique. Utilisé dans de nombreuses kritis (compositions vocales carnatiques) et dans la musique de danse Bharatanatyam.",
    timeSignature: '7/8',
    tempo: { min: 60, max: 180, typical: 100 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // Mridangam : accent sur le début de chaque cellule — positions 0 (Ta-Ki-Ṭa) et 3 (Ta-Ka-Di-Mi)
        steps: withAccents(
          [1, 0, 0, 1, 0, 0, 0],
          [0, 3], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual [1,0,0,1,0,0,0] — Misra Chapu groupement 3+4"
      },
      {
        part: 'snare',
        // Thavil (percussion lead) : accents secondaires en euclid(7,3)
        steps: withVelocity(RhythmPattern.euclid(7, 3), 0.8),
        division: 'e',
        tonal: "RhythmPattern.euclid(7, 3) — accents thavil Misra Chapu"
      },
      {
        part: 'hihat',
        // Tâla (battement de mains) : toutes les 7 pulsations
        steps: withVelocity(RhythmPattern.euclid(7, 7), 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(7, 7) — pulsation continue Misra Chapu"
      },
    ],
    compatibleGenres: ["Musique carnatique", "Bharatanatyam", "Musique classique indienne du Sud"],
    examples: ["Kriti 'Vatapi Ganapatim' (Muthuswami Dikshitar, adapté en Misra)", "Pallavi carnatique en Misra Chapu"],
  },

  {
    name: "Khanda Chapu (5 matras = 2+3)",
    emoji: ':musical_note:',
    description: "Le Khanda Chapu est un talam carnatique à 5 matras en groupement 2+3. Solkattu : Ta-Ka (2) + Ta-Ka-Ṭa (3). C'est le pendant quinaire du Misra Chapu septénaire. Très populaire dans les compositions vocales légères (bhajan, keertana), il est proche de la mesure à 5/8 du jazz progressif (Dave Brubeck, Take Five en 5/4) et des polyrythmes du funk (James Brown, '5/4 groove'). En danse Bharatanatyam, ses groupes inégaux créent une ondulation naturelle.",
    timeSignature: '5/8',
    tempo: { min: 60, max: 200, typical: 110 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // Mridangam : début des deux cellules — positions 0 (Ta-Ka) et 2 (Ta-Ka-Ṭa)
        // euclid(5,2) = [1,0,1,0,0] — exactement le groupement 2+3
        steps: withAccents(RhythmPattern.euclid(5, 2), [0, 2], 1.0, 0.8),
        division: 'e',
        tonal: "RhythmPattern.euclid(5, 2) = [1,0,1,0,0] — groupement 2+3 Khanda Chapu"
      },
      {
        part: 'snare',
        // Accents secondaires : euclid(5,3) = [1,0,1,0,1]
        steps: withVelocity(RhythmPattern.euclid(5, 3), 0.75),
        division: 'e',
        tonal: "RhythmPattern.euclid(5, 3) — thavil Khanda Chapu"
      },
      {
        part: 'hihat',
        // Pulsation de base : toutes les 5 croches
        steps: withVelocity(RhythmPattern.euclid(5, 5), 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(5, 5) — pulsation continue Khanda Chapu"
      },
    ],
    compatibleGenres: ["Musique carnatique", "Bharatanatyam", "Jazz progressif", "Fusion"],
    examples: ["Take Five (Dave Brubeck, 5/4 — esprit proche)", "Bhajan en Khanda Chapu", "Compositions Tyagaraja adaptées"],
  },

  {
    name: "Rupakam (6 matras = 3+2+1)",
    emoji: ':musical_note:',
    description: "Le Rupaka talam est l'un des Sapta (7) talas fondamentaux de la musique carnatique. En version 'chapu', son cycle de 6 matras se découpe en 3+2+1 — une cellule de 3 (laghu), une de 2 (drutam) et une de 1 (anudruta). Solkattu : Dhin-na-dhin (3) + Ta-Ka (2) + Dhin (1). Ce découpage asymétrique croissant-décroissant lui donne un caractère unique parmi les talas. Très utilisé dans les compositions du saint compositeur Thyagaraja et dans les raga alapanas (exposés mélodiques).",
    timeSignature: '6/8',
    tempo: { min: 40, max: 160, typical: 80 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // Mridangam : début des 3 cellules — positions 0 (×3), 3 (×2), 5 (×1)
        steps: withAccents(
          [1, 0, 0, 1, 0, 1],
          [0, 3, 5], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual [1,0,0,1,0,1] — Rupakam groupement 3+2+1"
      },
      {
        part: 'snare',
        // Kanjira (percussion secondaire) : euclid(6,3) = points de subdivision
        steps: withVelocity(RhythmPattern.euclid(6, 3), 0.7),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 3) — kanjira Rupakam"
      },
      {
        part: 'hihat',
        // Tâla : toutes les 6 pulsations
        steps: withVelocity(RhythmPattern.euclid(6, 6), 0.45),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 6) — pulsation continue Rupakam"
      },
    ],
    compatibleGenres: ["Musique carnatique", "Kritis Thyagaraja", "Raga alapana", "Musique classique indienne du Sud"],
    examples: ["Endaro Mahanubhavulu (Thyagaraja, Rupaka talam)", "Sri Gananatha (Muthuswami Dikshitar)"],
  },

  // ═══════════════════════════════════════════════════════
  // USUL TURCS (C-3)
  // ═══════════════════════════════════════════════════════

  {
    name: "Düyek (8/8 = 3+2+3)",
    emoji: ':crescent_moon:',
    description: "Le Düyek est l'un des usul (cycles rythmiques) les plus importants de la musique ottomane et turque classique. Son découpage 3+2+3 en 8 croches crée un mouvement asymétrique distinct du waltz (3/4) et du binaire (4/4). La darbuka (tombak) joue le düm (grave, ouvert) sur les positions 0 et 5, et le tek/ka (aigu, fermé) sur les positions intermédiaires. Le Düyek est le cadre rythmique de nombreuses pièces du répertoire makam (modal turc) et de l'art saz şiiri (poésie avec saz).",
    timeSignature: '8/8',
    tempo: { min: 80, max: 180, typical: 120 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // Darbuka düm (grave) : positions 0, 3, 5 (début de chaque groupe 3+2+3)
        steps: withAccents(
          [1, 0, 0, 1, 0, 1, 0, 0],
          [0, 3, 5], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual [1,0,0,1,0,1,0,0] — düm düyek groupement 3+2+3"
      },
      {
        part: 'snare',
        // Darbuka tek/ka (aigu) : positions non-düm
        steps: withAccents(
          [0, 1, 0, 0, 1, 0, 1, 1],
          [1, 4, 6, 7], 0.85, 0.65
        ),
        division: 'e',
        tonal: "Manual tek/ka darbuka — Düyek 3+2+3"
      },
      {
        part: 'hihat',
        // Zil (cymbale) : croches continues
        steps: withVelocity(RhythmPattern.euclid(8, 8), 0.45),
        division: 'e',
        tonal: "RhythmPattern.euclid(8, 8) — zil continu Düyek"
      },
    ],
    compatibleGenres: ["Musique ottomane classique", "Makam turc", "Musique moyen-orientale", "Musique des Balkans"],
    examples: ["Saz semaisi (répertoire makam en Düyek)", "Fasıl turc (soirée musicale ottomane)", "Müzeyyen Senar"],
  },

  {
    name: "Sengin Semai (10/8 = 3+2+2+3)",
    emoji: ':crescent_moon:',
    description: "Le Sengin Semai (ou Aksak Semai) est un usul turc en 10/8, découpé en groupes 3+2+2+3. C'est la version en 10 temps du principe aksak, complémentaire du Karşılama (9/8 = 2+2+2+3) déjà présent dans cette bibliothèque. Son nom 'semai' désigne la forme musicale chantée et son association avec certaines maqamat (maquams) spécifiques. Les darbuka jouent un düm grave sur les positions 0, 3, 5, 7, les tek sur les positions intermédiaires.",
    timeSignature: '10/8',
    tempo: { min: 70, max: 160, typical: 110 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'kick',
        // Darbuka düm : débuts de groupes 3+2+2+3 = positions 0, 3, 5, 7
        steps: withAccents(
          [1, 0, 0, 1, 0, 1, 0, 1, 0, 0],
          [0, 3, 5, 7], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual [1,0,0,1,0,1,0,1,0,0] — düm Sengin Semai 3+2+2+3"
      },
      {
        part: 'snare',
        // Tek/ka aux positions non-düm
        steps: withAccents(
          [0, 1, 0, 0, 1, 0, 1, 0, 1, 1],
          [1, 4, 6, 8, 9], 0.85, 0.6
        ),
        division: 'e',
        tonal: "Manual tek/ka — Sengin Semai contretemps"
      },
      {
        part: 'hihat',
        steps: withVelocity(RhythmPattern.euclid(10, 10), 0.45),
        division: 'e',
        tonal: "RhythmPattern.euclid(10, 10) — zil continu Sengin Semai"
      },
    ],
    compatibleGenres: ["Musique ottomane classique", "Makam turc", "Semai", "Musique moyen-orientale"],
    examples: ["Semai (répertoire fasıl ottoman en 10/8)", "Şarkı turcs en Aksak Semai", "Tanburi Cemil Bey"],
  },

  // ═══════════════════════════════════════════════════════
  // POLYRHYTHMIE AFRICAINE (C-4)
  // ═══════════════════════════════════════════════════════

  {
    name: "Bell Pattern Ewe (12/8, 7 frappes sur 12)",
    emoji: ':drum:',
    description: "Le 'standard pattern' ou 'timeline' des musiques Ewe (Ghana, Togo, Bénin) : 7 frappes asymétriques réparties sur 12 pulsations de 8e, créant un cycle qui ne se répète qu'après 12 temps. Ce pattern de cloche (gankogui) est fondamental dans les musiques d'Afrique de l'Ouest : agbadza, kpanlogo, borborbor (Ewe), highlife, afrobeat. Sa structure correspond à euclid(12,7) et est identique au clave 6-3 cubain tourné, démontrant l'influence africaine dans les musiques afro-caribéennes. Ethnomusicologue Kofi Agawu et Victor Kofi Agawu en ont fait l'analyse fondatrice.",
    timeSignature: '12/8',
    tempo: { min: 80, max: 160, typical: 115 },
    feel: 'straight',
    bars: 1,
    tracks: [
      {
        part: 'perc',
        // Gankogui (double cloche en fer) — standard pattern Ewe
        // 7 frappes sur 12 : positions 0, 2, 4, 6, 7, 9, 11
        steps: withAccents(
          [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
          [0, 6, 7], 1.0, 0.8
        ),
        division: 'e',
        tonal: "Manual [1,0,1,0,1,0,1,1,0,1,0,1] — gankogui Ewe standard pattern (7/12)"
      },
      {
        part: 'kick',
        // Atsimevu (master drum) : euclid(12,4) — points pivots du cycle
        steps: withVelocity(RhythmPattern.euclid(12, 4), 0.9),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 4) — atsimevu Ewe points pivots"
      },
      {
        part: 'snare',
        // Kidi (tambour de réponse) : euclid(12,3) — tierce de la cloche
        steps: withVelocity(RhythmPattern.euclid(12, 3), 0.75),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 3) — kidi Ewe réponse"
      },
    ],
    compatibleGenres: ["Musique Ewe", "Agbadza", "Kpanlogo", "Afrobeat", "Highlife", "Musique afro-caribéenne"],
    examples: ["Agbadza (traditionnel Ewe, Ghana/Togo)", "Kpanlogo (Accra, Ghana)", "Fela Kuti (influence bell pattern)"],
  },

  {
    name: "Fanga malien (6/8, pattern Mandingue)",
    emoji: ':drum:',
    description: "Le Fanga est un rythme cérémoniel traditionnel originaire de Guinée et du Mali, joué dans les sociétés mandingues (Malinké, Bambara, Dioula) pour accueillir les hôtes de marque et célébrer les unions. Son cycle de 6 pulsations en 6/8 est animé par le djembe (frappe basse-soufflet-ton : B-S-T) et le dundun (basse tambour à deux faces). Le motif dundun est répétitif et ancré sur les temps forts 1 et 4, tandis que le djembe lead improvise au-dessus. Source historique : Mamady Keïta (maître djembéfola guinéen).",
    timeSignature: '6/8',
    tempo: { min: 90, max: 150, typical: 116 },
    feel: 'straight',
    bars: 2,
    tracks: [
      {
        part: 'kick',
        // Dundun (basse) : frappe sur les temps 1 et 4 (pos. 0 et 3) sur 2 mesures
        steps: withAccents(
          [...[1, 0, 0, 1, 0, 0], ...[1, 0, 0, 1, 0, 0]],
          [0, 3, 6, 9], 1.0, 0.0
        ),
        division: 'e',
        tonal: "Manual [1,0,0,1,0,0] × 2 — dundun Fanga temps 1 et 4"
      },
      {
        part: 'snare',
        // Djembe accompagnement : pattern de base ton-soufflet en euclid(6,3)
        steps: withAccents(
          [...RhythmPattern.euclid(6, 3), ...RhythmPattern.rotate(RhythmPattern.euclid(6, 3), 1)],
          [0, 2, 4, 7, 9, 11], 0.85, 0.65
        ),
        division: 'e',
        tonal: "RhythmPattern.euclid(6, 3) + rotate — djembe accompagnement Fanga"
      },
      {
        part: 'hihat',
        // Sangban (cloche) : euclid(12,6) = croches égales sur 2 mesures
        steps: withVelocity(RhythmPattern.euclid(12, 6), 0.5),
        division: 'e',
        tonal: "RhythmPattern.euclid(12, 6) — sangban cloche Fanga"
      },
    ],
    compatibleGenres: ["Musique mandingue", "Djembe", "Musique guinéenne", "Musique malienne", "Percussion africaine"],
    examples: ["Fanga (Mamady Keïta, maître djembéfola)", "Fanga (Famoudou Konaté)", "Djembe Guinea traditionnel"],
  },

]
