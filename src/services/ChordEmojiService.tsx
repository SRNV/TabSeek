import React from 'react'
import * as emoji from 'node-emoji'
import { Chord } from 'tonal'

function e(name: string, fallback: string): string {
  const r = emoji.get(name)
  return r && !r.startsWith(':') ? r : fallback
}

// Keys = tonal chord type ids (from CHORD_TYPES_BY_CATEGORY) + common suffix shorthands
const EMOJI_BY_ID: Record<string, string> = {
  // ── Triads ────────────────────────────────────────────────────────────────
  'major':       e('sunny',                    '☀️'),
  '':            e('sunny',                    '☀️'),   // pure major suffix
  'minor':       e('crescent_moon',            '🌙'),
  'm':           e('crescent_moon',            '🌙'),
  'diminished':  e('small_red_triangle_down',  '🔻'),
  'dim':         e('small_red_triangle_down',  '🔻'),
  'augmented':   e('small_red_triangle',       '🔺'),
  'aug':         e('small_red_triangle',       '🔺'),
  // ── Power ─────────────────────────────────────────────────────────────────
  '5':           e('zap',                      '⚡'),
  'm#5':         e('collision',                '💥'),
  // ── Suspended ─────────────────────────────────────────────────────────────
  'sus2':        e('ocean',                    '🌊'),
  'sus4':        e('dizzy',                    '💫'),
  '7sus4':       e('cyclone',                  '🌀'),
  '9sus4':       e('tornado',                  '🌪️'),
  'sus24':       e('rainbow',                  '🌈'),
  // ── Added ─────────────────────────────────────────────────────────────────
  'add9':        e('seedling',                 '🌱'),
  'madd9':       e('herb',                     '🌿'),
  // ── Sixths ────────────────────────────────────────────────────────────────
  '6':           e('cherry_blossom',           '🌸'),
  'min6':        e('hibiscus',                 '🌺'),
  'm6':          e('hibiscus',                 '🌺'),
  '69':          e('notes',                    '🎶'),
  'm69':         e('musical_note',             '🎵'),
  // ── Sevenths ──────────────────────────────────────────────────────────────
  '7':           e('fire',                     '🔥'),
  'maj7':        e('sparkles',                 '✨'),
  'M7':          e('sparkles',                 '✨'),
  'min7':        e('waxing_crescent_moon',     '🌒'),
  'm7':          e('waxing_crescent_moon',     '🌒'),
  'minMaj7':     e('last_quarter_moon',        '🌗'),
  'mMaj7':       e('last_quarter_moon',        '🌗'),
  'dim7':        e('new_moon',                 '🌑'),
  'min7b5':      e('spider_web',               '🕸️'),
  'm7b5':        e('spider_web',               '🕸️'),
  'aug7':        e('volcano',                  '🌋'),
  '7b5':         e('performing_arts',          '🎭'),
  'maj7#5':      e('stars',                    '🌠'),
  'maj7b5':      e('star2',                    '🌟'),
  'min7#5':      e('comet',                    '☄️'),
  // ── Ninths ────────────────────────────────────────────────────────────────
  '9':           e('guitar',                   '🎸'),
  'maj9':        e('sunrise',                  '🌅'),
  'min9':        e('city_sunrise',             '🌆'),
  'm9':          e('city_sunrise',             '🌆'),
  'minMaj9':     e('night_with_stars',         '🌃'),
  'mMaj9':       e('night_with_stars',         '🌃'),
  '7b9':         e('hot_pepper',               '🌶️'),
  '7#9':         e('metal',                    '🤘'),
  // ── 11ths ─────────────────────────────────────────────────────────────────
  '11':          e('trumpet',                  '🎺'),
  'maj11':       e('violin',                   '🎻'),
  'min11':       e('musical_keyboard',         '🎹'),
  'm11':         e('musical_keyboard',         '🎹'),
  '7#11':        e('comet',                    '☄️'),
  'maj7#11':     e('gem',                      '💎'),
  // ── 13ths ─────────────────────────────────────────────────────────────────
  '13':          e('saxophone',                '🎷'),
  'maj13':       e('musical_score',            '🎼'),
  'min13':       e('musical_note',             '🎵'),
  'm13':         e('musical_note',             '🎵'),
  'maj13#11':    e('crown',                    '👑'),
  '7b13':        e('foggy',                    '🌁'),
  '7#9#11':      e('tornado',                  '🌪️'),
  '7#9b13':      e('cyclone',                  '🌀'),
  '7b9#11':      e('performing_arts',          '🎭'),
  '7b9b13':      e('sparkles',                 '✨'),
}

const DEFAULT = '🎵'

/** Look up emoji by chord type id (e.g. "min7", "major", "7b9"). */
export function getChordEmojiById(typeId: string): string {
  return EMOJI_BY_ID[typeId] ?? DEFAULT
}

/** Look up emoji from a full chord name (e.g. "Cm7", "Amaj7", "Cdim"). */
export function getChordEmojiByName(chordName: string): string {
  if (!chordName) return DEFAULT
  const chord = Chord.get(chordName)
  if (!chord || chord.empty) return DEFAULT

  // 1. Tonic-stripped suffix (covers names produced by numeralToChordName)
  if (chord.tonic) {
    const suffix = chordName.slice(chord.tonic.length)
    if (suffix in EMOJI_BY_ID) return EMOJI_BY_ID[suffix]
  }

  // 2. Tonal aliases (e.g. "maj7", "m7", "min7")
  for (const alias of chord.aliases) {
    if (alias in EMOJI_BY_ID) return EMOJI_BY_ID[alias]
  }

  return DEFAULT
}

// ── React component ──────────────────────────────────────────────────────────

interface ChordEmojiBoxProps {
  /** Chord type id from CHORD_TYPES_BY_CATEGORY (e.g. "min7") */
  chordId?: string
  /** Full chord name (e.g. "Cm7"). Used when chordId is not available. */
  chordName?: string
  /** Emoji size in px (default 50). */
  size?: number
  /**
   * When provided, renders a disc behind the emoji.
   * Disc diameter = 1.2 × size. Center = emoji center.
   */
  disc?: { bgColor: string; borderColor: string }
  style?: React.CSSProperties
}

export function ChordEmojiBox({
  chordId,
  chordName,
  size = 50,
  disc,
  style,
}: ChordEmojiBoxProps) {
  const em = chordId
    ? getChordEmojiById(chordId)
    : getChordEmojiByName(chordName ?? '')

  const discSize = disc ? Math.round(size * 1.2) : size

  return (
    <div
      style={{
        width: discSize,
        height: discSize,
        borderRadius: disc ? '50%' : undefined,
        backgroundColor: disc?.bgColor,
        border: disc ? `2px solid ${disc.borderColor}` : undefined,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.62,
        lineHeight: 1,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {em}
    </div>
  )
}
