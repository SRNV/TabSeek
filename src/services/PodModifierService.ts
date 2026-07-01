/**
 * @file PodModifierService.ts
 * Business logic for the three interactive pod modifier types: Chord, Progression, and Arpeggio.
 *
 * Provides navigation (prev/next chord type, voicing cycle, octave transpose), chord-group
 * mutations (replace voicing, replace progression content), and arpeggio materialisation/
 * dematerialisation (reuses the legato-locking mechanism from RhythmModifierService).
 *
 * All functions that write to the store call `pushHistory()` first so every action is undoable.
 * Functions that only compute or navigate do NOT push history (navigation-priority-over-lock
 * pattern: dematerialize first, navigate, then the caller decides whether to rematerialize).
 */
import { Note, Chord } from 'tonal'
import { useTablatureR3FStore, ChordGroup, ProgressionGroup, TablatureNote, ArpeggioDirection, RhythmModifier } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useMainStore } from '../stores/useMainStore'
import { TONAL_CHORD_TYPES, formatChordName } from '../data/tonalChordsMapping'
import { chordProgressions, ChordProgression } from '../data/progressions'
import { numeralToChordName } from '../utils/chordUtils'
import { findBestChordFrets, findRankedChordVoicings, findNearestFretForMidi } from '../utils/guitarUtils'
import { RhythmModifierService } from './RhythmModifierService'

function getTuning(): string[] {
  return useTablatureStore.getState().tuning.split(',')
}

function midiOf(tuning: string[], n: { string: number; fret: number }): number {
  return (Note.midi(tuning[n.string] ?? 'E2') ?? 0) + n.fret
}

// Resolves the Tonal chord-type id (from TONAL_CHORD_TYPES) backing a full chord name,
// e.g. "Cm7" -> "min7". Mirrors ChordEmojiService.getChordEmojiByName's lookup strategy.
function detectChordTypeId(chordName: string): string {
  const chord = Chord.get(chordName)
  if (chord.empty || !chord.tonic) return TONAL_CHORD_TYPES[0]
  const suffix = chordName.slice(chord.tonic.length)
  if (TONAL_CHORD_TYPES.includes(suffix)) return suffix
  for (const alias of chord.aliases) {
    if (TONAL_CHORD_TYPES.includes(alias)) return alias
  }
  return TONAL_CHORD_TYPES[0]
}

function groupBounds(notes: TablatureNote[]) {
  return {
    startBeat: Math.min(...notes.map(n => n.startBeat)),
    endBeat: Math.max(...notes.map(n => n.startBeat + n.duration)),
  }
}

function getArpeggioForGroup(groupId: string): RhythmModifier | undefined {
  return useTablatureR3FStore.getState().rhythmModifiers.find(
    m => m.kind === 'arpeggio' && m.targetType === 'chord' && m.targetId === groupId
  )
}

/**
 * Restores a chord group's original simultaneous voicing, undoing applyArpeggio.
 * Shared by the explicit "désactiver l'arpège" button and by navigation actions
 * (chord type / voicing / octave / progression template), which always take priority
 * over the lock — they dematerialize the arpeggio first instead of refusing to act.
 */
function dematerializeArpeggio(mod: RhythmModifier) {
  const state = useTablatureR3FStore.getState()
  if (mod.kind !== 'arpeggio' || !mod.legato || !mod.legatoBaseNoteId || !mod.legatoOrigRange) return

  const baseNote = state.notes.find(n => n.id === mod.legatoBaseNoteId)
  if (!baseNote) return

  // No tuning passed to deleteNote: skip its auto chord-name re-detection — the group's
  // chordName must stay the source chord's name throughout, not whatever a lone note detects as.
  const extras = new Set(mod.legatoExtras ?? [])
  extras.forEach(id => state.deleteNote(id))

  state.updateNote(baseNote.id, {
    startBeat: mod.legatoOrigRange.startBeat,
    duration: mod.legatoOrigRange.duration,
    legatoNext: undefined,
    legatoPrev: undefined,
    intermediateNoteIds: [],
  })

  const restoredIds = (mod.arpeggioOrigNotes ?? []).map(n => state.addNote(n))
  state.setChordGroupNoteIds(mod.targetId, [baseNote.id, ...restoredIds])
  state.removeRhythmModifier(mod.id)
}

/**
 * Rebuilds a chord group's voicing for a new chord name, anchoring the root on the same
 * string/fret as the group's current root note (same pitch class, so the anchor doesn't
 * jump) and keeping the group's existing time range.
 */
function buildVoicingFor(group: ChordGroup, newChordName: string): { notes: Omit<TablatureNote, 'id'>[] } | null {
  const state = useTablatureR3FStore.getState()
  const tuning = getTuning()
  const existing = state.notes.filter(n => group.noteIds.includes(n.id))
  if (existing.length === 0) return null

  const notesPc = Chord.get(newChordName).notes
  if (notesPc.length === 0) return null

  const { startBeat, endBeat } = groupBounds(existing)
  const duration = endBeat - startBeat

  // Anchor: the existing note whose pitch class matches the new chord's root, preferring
  // the lowest string — falls back to the lowest-string note of the current voicing.
  const rootPc = Note.pitchClass(notesPc[0])
  const anchor =
    existing.find(n => Note.pitchClass(Note.fromMidi(midiOf(tuning, n))) === rootPc) ??
    existing.reduce((a, b) => a.string <= b.string ? a : b)

  const forcedRoot = { si: anchor.string, fret: anchor.fret }
  const voicing = findBestChordFrets(tuning, notesPc, anchor.string, forcedRoot)

  return {
    notes: voicing.map(v => ({ string: v.si, fret: v.fret, startBeat, duration })),
  }
}

/**
 * Dematerializes any materialized legato chain — arpeggio OR rhythm-pattern — anchored on
 * this group or on one of its individual notes. Voicing-replacing actions (chord type,
 * fingering search, octave, progression template) delete the group's current notes and
 * recreate fresh ones with new ids; any materialized chain still pointing at the old ids
 * would otherwise be left dangling (its destination/intermediates orphaned, never moving
 * again — the bug this fixes). Must run before the group's notes are touched.
 */
function dematerializeChainsForGroup(groupId: string) {
  const state = useTablatureR3FStore.getState()
  const group = state.chordGroups.find(g => g.id === groupId)
  if (!group) return

  const arpMod = getArpeggioForGroup(groupId)
  if (arpMod) dematerializeArpeggio(arpMod)

  // Re-read: dematerializing the arpeggio (if any) changed the group's noteIds.
  const noteIds = new Set(useTablatureR3FStore.getState().chordGroups.find(g => g.id === groupId)?.noteIds ?? [])
  useTablatureR3FStore.getState().rhythmModifiers
    .filter(m => m.kind !== 'arpeggio' && m.legato && (
      (m.targetType === 'chord' && m.targetId === groupId) ||
      (m.targetType === 'note' && noteIds.has(m.targetId))
    ))
    .forEach(m => RhythmModifierService.dematerializeLegatoRhythm(m.id))
}

// Dematerializes any active chain (arpeggio or materialized rhythm) on this group and
// returns its fresh state (note ids change when a chain is dematerialized, so callers must
// re-read from the store afterwards rather than reuse the ChordGroup object they were called with).
function freshGroupAfterUnlock(groupId: string): ChordGroup | undefined {
  dematerializeChainsForGroup(groupId)
  return useTablatureR3FStore.getState().chordGroups.find(g => g.id === groupId)
}

// ── Legato-preserving voicing replacement ────────────────────────────────────
//
// When a chord's voicing changes (type, fingering, octave), any legato chains
// anchored on group notes would be orphaned — the old note IDs are deleted and
// replaced by new ones that have no legato state. This wrapper:
//   1. Snapshots legato source/destination info on the group's current notes.
//   2. Calls replaceChordGroupVoicing to swap in the new notes.
//   3. For each saved legato link, finds the "closest" new note by:
//        - Priority 1: same string as the old note
//        - Priority 2: closest MIDI pitch
//   4. Transfers all legato fields and calls syncLegato.

function getScaleNotes(): string[] {
  const { userScale, modeObject } = useMainStore.getState()
  return (modeObject.intervals as string[]).map((iv: string) => Note.transpose(userScale, iv))
}

function findClosestNote(
  candidates: TablatureNote[],
  tuning: string[],
  preferredString: number,
  preferredMidi: number
): TablatureNote | null {
  if (candidates.length === 0) return null
  const sameString = candidates.find(n => n.string === preferredString)
  if (sameString) return sameString
  return candidates.reduce((best, n) =>
    Math.abs(midiOf(tuning, n) - preferredMidi) < Math.abs(midiOf(tuning, best) - preferredMidi) ? n : best
  )
}

function replaceVoicingPreservingLegato(
  groupId: string,
  newNotes: Omit<TablatureNote, 'id'>[],
  chordName: string
) {
  const state  = useTablatureR3FStore.getState()
  const group  = state.chordGroups.find(g => g.id === groupId)
  if (!group) return

  const tuning   = getTuning()
  const oldNotes = state.notes.filter(n => group.noteIds.includes(n.id))

  // Snapshot legato sources (old notes that START a chain)
  const sources = oldNotes
    .filter(n => n.legatoNext)
    .map(n => ({
      oldString:          n.string,
      oldMidi:            midiOf(tuning, n),
      legatoNext:         n.legatoNext!,
      legatoCount:        n.legatoCount,
      legatoBehavior:     n.legatoBehavior,
      legatoOvershoot:    n.legatoOvershoot,
      intermediateNoteIds: n.intermediateNoteIds ?? [],
    }))

  // Snapshot destinations whose SOURCE is outside the group
  const dests = oldNotes
    .filter(n => n.legatoPrev && !group.noteIds.includes(n.legatoPrev))
    .map(n => ({
      oldString:  n.string,
      oldMidi:    midiOf(tuning, n),
      legatoPrev: n.legatoPrev!,
    }))

  // Replace voicing — old notes deleted, new IDs generated
  const newIds = state.replaceChordGroupVoicing(groupId, newNotes, chordName)
  if (!sources.length && !dests.length) return  // nothing to reconnect

  const newState  = useTablatureR3FStore.getState()
  const newGroup  = newState.notes.filter(n => newIds.includes(n.id))
  const scaleNotes = getScaleNotes()

  // Reconnect legato sources → their chains survive the voicing change
  for (const src of sources) {
    const match = findClosestNote(newGroup, tuning, src.oldString, src.oldMidi)
    if (!match) continue

    newState.updateNote(match.id, {
      legatoNext:          src.legatoNext,
      legatoCount:         src.legatoCount,
      legatoBehavior:      src.legatoBehavior,
      legatoOvershoot:     src.legatoOvershoot,
      intermediateNoteIds: src.intermediateNoteIds,
    }, tuning, scaleNotes)

    // Update the destination's back-pointer to the new source note
    const dest = newState.notes.find(n => n.id === src.legatoNext)
    if (dest) newState.updateNote(dest.id, { legatoPrev: match.id }, tuning, scaleNotes)

    // Recompute intermediate positions for the new source/string layout
    newState.syncLegato(match.id, tuning, scaleNotes)
  }

  // Reconnect destinations (where the source is an external note)
  for (const dst of dests) {
    const match  = findClosestNote(newGroup, tuning, dst.oldString, dst.oldMidi)
    const srcNote = newState.notes.find(n => n.id === dst.legatoPrev)
    if (!match || !srcNote) continue

    newState.updateNote(srcNote.id, { legatoNext: match.id }, tuning, scaleNotes)
    newState.updateNote(match.id, { legatoPrev: srcNote.id }, tuning, scaleNotes)
    newState.syncLegato(srcNote.id, tuning, scaleNotes)
  }
}

function applyChordType(group: ChordGroup, typeId: string) {
  useTablatureR3FStore.getState().pushHistory()
  // Navigation always takes priority over the arpeggio lock: dematerialize first if needed.
  const fresh = freshGroupAfterUnlock(group.id)
  if (!fresh) return
  const tonic = Chord.get(fresh.chordName).tonic ?? 'C'
  const newName = formatChordName(tonic, typeId)
  const built = buildVoicingFor(fresh, newName)
  if (!built) return

  replaceVoicingPreservingLegato(fresh.id, built.notes, newName)
}

/**
 * Cycles to another way to *play* the same chord (different strings/frets, same notes) —
 * not a different chord. Re-runs the voicing search ranked by playability and steps to the
 * next-best alternative after the one currently on the fretboard, wrapping around.
 */
function cycleVoicing(group: ChordGroup, direction: 1 | -1 = 1) {
  useTablatureR3FStore.getState().pushHistory()
  const fresh = freshGroupAfterUnlock(group.id)
  if (!fresh) return
  const state = useTablatureR3FStore.getState()
  const tuning = getTuning()
  const existing = state.notes.filter(n => fresh.noteIds.includes(n.id))
  if (existing.length === 0) return

  const notesPc = Chord.get(fresh.chordName).notes
  if (notesPc.length === 0) return

  const { startBeat, endBeat } = groupBounds(existing)
  const duration = endBeat - startBeat
  const anchorSi = Math.min(...existing.map(n => n.string))

  const alternates = findRankedChordVoicings(tuning, notesPc, anchorSi, undefined, 16)
  if (alternates.length <= 1) return

  const currentKey = [...existing].sort((a, b) => a.string - b.string).map(n => `${n.string}:${n.fret}`).join(',')
  const currentIdx = alternates.findIndex(v => [...v].sort((a, b) => a.si - b.si).map(x => `${x.si}:${x.fret}`).join(',') === currentKey)
  const nextIdx = ((currentIdx === -1 ? 0 : currentIdx) + direction + alternates.length) % alternates.length
  const next = alternates[nextIdx]

  replaceVoicingPreservingLegato(fresh.id, next.map(v => ({ string: v.si, fret: v.fret, startBeat, duration })), fresh.chordName)
}

/** Transposes every note of the chord one octave up/down, keeping the same playable range (0-24 frets). */
function transposeOctave(group: ChordGroup, direction: 1 | -1) {
  useTablatureR3FStore.getState().pushHistory()
  const fresh = freshGroupAfterUnlock(group.id)
  if (!fresh) return
  const state = useTablatureR3FStore.getState()
  const tuning = getTuning()
  const existing = state.notes.filter(n => fresh.noteIds.includes(n.id))
  if (existing.length === 0) return

  const moved = existing.map(n => {
    const targetMidi = midiOf(tuning, n) + direction * 12
    const v = findNearestFretForMidi(tuning, targetMidi, n.string, n.fret)
    return { string: v.si, fret: v.fret, startBeat: n.startBeat, duration: n.duration }
  })
  // Bail out if the transposition couldn't actually move every note (e.g. already at the edge
  // of the fretboard) — findNearestFretForMidi's clamp fallback would otherwise silently no-op.
  const allMoved = moved.every((m, i) => midiOf(tuning, m) === midiOf(tuning, existing[i]) + direction * 12)
  if (!allMoved) return

  replaceVoicingPreservingLegato(fresh.id, moved, fresh.chordName)
}

function applyProgressionTemplate(prog: ProgressionGroup, template: ChordProgression) {
  useTablatureR3FStore.getState().pushHistory()

  // Navigation always takes priority over any chord's arpeggio lock in this progression.
  prog.chordGroupIds.forEach(id => {
    const arpMod = getArpeggioForGroup(id)
    if (arpMod) dematerializeArpeggio(arpMod)
  })

  const state = useTablatureR3FStore.getState()
  const groups = prog.chordGroupIds.map(id => state.chordGroups.find(g => g.id === id)).filter((g): g is ChordGroup => !!g)
  if (groups.length === 0) return

  const tuning = getTuning()
  const allNotes = groups.flatMap(g => state.notes.filter(n => g.noteIds.includes(n.id)))
  if (allNotes.length === 0) return

  const { startBeat } = groupBounds(allNotes)
  const firstGroupNotes = state.notes.filter(n => groups[0].noteIds.includes(n.id))
  const { startBeat: firstStart, endBeat: firstEnd } = groupBounds(firstGroupNotes)
  const dur = Math.max(0.1, firstEnd - firstStart)

  const rootPc = Note.pitchClass(Chord.get(groups[0].chordName).tonic ?? 'C')
  const anchorSi = Math.min(...firstGroupNotes.map(n => n.string))
  const anchorNote = firstGroupNotes.find(n => n.string === anchorSi)

  const numerals = template.numerals.split('-')
  const chordEntries = numerals.map((numeral, ci) => {
    const chordName = numeralToChordName(numeral, rootPc)
    const notesPc = Chord.get(chordName).notes
    const forcedRoot = (ci === 0 && anchorNote) ? { si: anchorNote.string, fret: anchorNote.fret } : undefined
    const voicing = findBestChordFrets(tuning, notesPc, anchorSi, forcedRoot)
    const entryStart = startBeat + ci * dur
    return {
      chordName,
      notes: voicing.map(v => ({ string: v.si, fret: v.fret, startBeat: entryStart, duration: dur })),
    }
  })

  state.replaceProgressionContent(prog.id, chordEntries, template.name)
}

function buildArpeggioMidiSeq(baseMidis: number[], direction: ArpeggioDirection, noteCount: number): number[] {
  const asc = [...baseMidis].sort((a, b) => a - b)
  let basePattern: number[]
  switch (direction) {
    case 'down':
      basePattern = [...asc].reverse()
      break
    case 'updown':
      basePattern = asc.length > 2 ? [...asc, ...[...asc].reverse().slice(1, -1)] : asc
      break
    case 'downup': {
      const desc = [...asc].reverse()
      basePattern = asc.length > 2 ? [...desc, ...asc.slice(1, -1)] : desc
      break
    }
    case 'up':
    default:
      basePattern = asc
  }
  if (basePattern.length === 0) return []

  const octaveStep = (direction === 'down' || direction === 'downup') ? -12 : 12
  const seq: number[] = []
  for (let i = 0; i < noteCount; i++) {
    const cycle = Math.floor(i / basePattern.length)
    const within = i % basePattern.length
    seq.push(basePattern[within] + cycle * octaveStep)
  }
  return seq
}

export const PodModifierService = {
  // ── Chord pod: type navigation ────────────────────────────────────────────
  getChordTypeNav(group: ChordGroup) {
    const typeId = detectChordTypeId(group.chordName)
    const idx = Math.max(0, TONAL_CHORD_TYPES.indexOf(typeId))
    return {
      label: group.chordName,
      prev: () => applyChordType(group, TONAL_CHORD_TYPES[(idx - 1 + TONAL_CHORD_TYPES.length) % TONAL_CHORD_TYPES.length]),
      next: () => applyChordType(group, TONAL_CHORD_TYPES[(idx + 1) % TONAL_CHORD_TYPES.length]),
    }
  },

  applyChordType,

  // ── Chord pod: alternate fingering search (same chord, different frets/strings) ──
  cycleVoicing,

  // ── Chord pod: octave switch ──────────────────────────────────────────────
  transposeOctave,

  // ── Progression pod: template navigation ─────────────────────────────────
  getProgressionTemplateNav(prog: ProgressionGroup) {
    const idx = Math.max(0, chordProgressions.findIndex(t => t.name === prog.name))
    return {
      label: prog.name,
      prev: () => applyProgressionTemplate(prog, chordProgressions[(idx - 1 + chordProgressions.length) % chordProgressions.length]),
      next: () => applyProgressionTemplate(prog, chordProgressions[(idx + 1) % chordProgressions.length]),
    }
  },

  // ── Chord pod: locked arpeggio ────────────────────────────────────────────
  getArpeggioForChord: getArpeggioForGroup,

  applyArpeggio(chordGroupId: string, direction: ArpeggioDirection, noteCount: number) {
    const state = useTablatureR3FStore.getState()
    const group = state.chordGroups.find(g => g.id === chordGroupId)
    if (!group) return
    if (PodModifierService.getArpeggioForChord(chordGroupId)) return // already arpeggiated

    const tuning = getTuning()
    const groupNotes = state.notes.filter(n => group.noteIds.includes(n.id))
    if (groupNotes.length < 2) return
    noteCount = Math.max(2, Math.round(noteCount))

    const baseMidis = groupNotes.map(n => midiOf(tuning, n))
    const seq = buildArpeggioMidiSeq(baseMidis, direction, noteCount)
    if (seq.length < 2) return

    const anchorNote = groupNotes.find(n => midiOf(tuning, n) === seq[0]) ?? groupNotes[0]
    const others = groupNotes.filter(n => n.id !== anchorNote.id)

    const { startBeat, endBeat } = groupBounds(groupNotes)
    const totalDur = Math.max(0.1, endBeat - startBeat)
    const stepDur = totalDur / noteCount

    // Walk the target pitches, picking the nearest playable fret/string from the previous step
    const steps: { string: number; fret: number }[] = []
    let refString = anchorNote.string
    let refFret = anchorNote.fret
    seq.forEach(midi => {
      const v = findNearestFretForMidi(tuning, midi, refString, refFret)
      steps.push({ string: v.si, fret: v.fret })
      refString = v.si
      refFret = v.fret
    })

    state.pushHistory()

    const origRange = { startBeat: anchorNote.startBeat, duration: anchorNote.duration }
    const origOthers = others.map(n => ({ string: n.string, fret: n.fret, startBeat: n.startBeat, duration: n.duration }))

    // Remove the other simultaneous chord tones (deleteNote also prunes them out of
    // group.noteIds, leaving just the anchor). No tuning passed: skip deleteNote's
    // auto chord-name re-detection — the group's chordName must stay the source chord's
    // name throughout the arpeggio, not whatever a single remaining note would detect as.
    others.forEach(n => state.deleteNote(n.id))

    // Anchor -> first arpeggio step
    state.updateNote(anchorNote.id, {
      string: steps[0].string,
      fret: steps[0].fret,
      startBeat: startBeat,
      duration: stepDur,
      legatoNext: undefined,
      legatoPrev: undefined,
      intermediateNoteIds: [],
    })

    const destId = state.addNote({
      string: steps[noteCount - 1].string,
      fret: steps[noteCount - 1].fret,
      startBeat: startBeat + (noteCount - 1) * stepDur,
      duration: stepDur,
    })
    state.updateNote(destId, { legatoPrev: anchorNote.id })

    const intermediateIds: string[] = []
    for (let i = 1; i < noteCount - 1; i++) {
      const id = state.addNote({
        string: steps[i].string,
        fret: steps[i].fret,
        startBeat: startBeat + i * stepDur,
        duration: stepDur,
      })
      intermediateIds.push(id)
    }

    state.updateNote(anchorNote.id, { legatoNext: destId, intermediateNoteIds: intermediateIds })
    state.setChordGroupNoteIds(chordGroupId, [anchorNote.id, ...intermediateIds, destId])

    state.addRhythmModifier({
      kind: 'arpeggio',
      targetType: 'chord',
      targetId: chordGroupId,
      patternName: '',
      activeTracks: [],
      mode: 'proportional',
      enabled: true,
      arpeggioDirection: direction,
      arpeggioNoteCount: noteCount,
      arpeggioOrigNotes: origOthers,
      legato: true,
      legatoBaseNoteId: anchorNote.id,
      legatoExtras: [...intermediateIds, destId],
      legatoOrigRange: origRange,
    })
  },

  removeArpeggio(modId: string) {
    const state = useTablatureR3FStore.getState()
    const mod = state.rhythmModifiers.find(m => m.id === modId)
    if (!mod) return
    state.pushHistory()
    dematerializeArpeggio(mod)
  },

  updateArpeggio(mod: RhythmModifier, direction: ArpeggioDirection, noteCount: number) {
    const chordGroupId = mod.targetId
    PodModifierService.removeArpeggio(mod.id)
    PodModifierService.applyArpeggio(chordGroupId, direction, noteCount)
  },
}
