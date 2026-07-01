/**
 * @file RhythmModifierService.ts
 * Business logic for rhythm modifiers — non-destructive rhythmic subdivision of notes,
 * chord groups, and progression groups.
 *
 * Key concepts:
 * - `getVirtualRhythm` computes the display-time sub-notes without touching the store.
 * - `materializeLegatoRhythm` converts virtual sub-notes into real legato chains, one
 *   per note of a chord (multi-chain architecture).
 * - `dematerializeLegatoRhythm` reverses the above, restoring each base note to its
 *   original beat range.
 * - Per-chord string instrument assignment (`stringTrackOverrides`) is managed by
 *   `getAssignedTrack` / `cycleStringTrack`.
 *
 * Pre-flight check (P4-3): notes already in a legato chain (`legatoNext` present)
 * are skipped during materialisation to avoid silently overwriting existing chains.
 */
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { rhythmPatterns } from '../data/rhythmPatterns'
import type { RhythmPatternDef, TablatureNote, RhythmModifier, ChordGroup, ProgressionGroup } from '../types'
import { BEATS_PER_MEAS } from '../utils/tabUtils'

export interface VirtualNote {
  startBeat: number
  duration: number
  id: string
}

export const ALL_TRACKS = '__all__'

// When a chord-targeting modifier has a per-string override for this note, only that
// track's steps drive the note — otherwise fall back to the merged activeTracks (default).
function mergeSteps(pattern: RhythmPatternDef, mod: RhythmModifier, note: TablatureNote): { totalSteps: number, mergedSteps: number[] } {
  const override = mod.targetType === 'chord' ? mod.stringTrackOverrides?.[note.id] : undefined
  const tracksToUse = (override && override !== ALL_TRACKS)
    ? pattern.tracks.filter(t => t.part === override)
    : pattern.tracks.filter(t => mod.activeTracks.includes(t.part))

  let totalSteps = 0
  const mergedSteps: number[] = []
  tracksToUse.forEach(t => {
    totalSteps = Math.max(totalSteps, t.steps.length)
    t.steps.forEach((v, i) => { mergedSteps[i] = Math.max(mergedSteps[i] || 0, v) })
  })
  return { totalSteps, mergedSteps }
}

// Shared helper: compute the onset list and step duration for a modifier + note
function computeVirtualNotes(mod: RhythmModifier, note: TablatureNote): VirtualNote[] | null {
  const pattern = rhythmPatterns.find(p => p.name === mod.patternName)
  if (!pattern) return null

  const { totalSteps, mergedSteps } = mergeSteps(pattern, mod, note)

  const onsets = mergedSteps.map((vel, i) => vel > 0 ? i : -1).filter(i => i !== -1)
  if (onsets.length < 2) return null

  let stepDur = note.duration / totalSteps
  if (mod.mode === 'extended') {
    const patternBars = pattern.bars || 1
    stepDur = patternBars * BEATS_PER_MEAS / totalSteps
  }

  return onsets.map((step, idx) => {
    let dur = stepDur
    if (mod.fillGaps) {
      const nextStep = idx < onsets.length - 1 ? onsets[idx + 1] : totalSteps
      dur = (nextStep - step) * stepDur
    }
    return { startBeat: note.startBeat + step * stepDur, duration: dur, id: `${note.id}-sub-${step}` }
  })
}

export const RhythmModifierService = {
  /**
   * Applies a rhythm pattern to a target (note, chord, or progression)
   */
  applyRhythmToTarget: (rhythm: RhythmPatternDef, targetId: string, trackIndex?: number) => {
    const state = useTablatureR3FStore.getState()
    const { addRhythmModifier: addMod, pushHistory: ph } = state

    // targetId is the note dropped on (the only thing the canvas drop handler can hit-test).
    // If that note belongs to a chord, the modifier targets the whole ChordGroup instead —
    // dropping a rhythm on any note of a chord pod imposes the rhythm on the chord.
    // (targetId may also directly be a chord/progression id if called from elsewhere.)
    let targetType: 'note' | 'chord' | 'progression'
    let resolvedId = targetId

    const directProg  = state.progressionGroups.find(p => p.id === targetId)
    const directChord = state.chordGroups.find(g => g.id === targetId)
    const chordOfNote = state.chordGroups.find(g => g.noteIds.includes(targetId))

    if (directProg) {
      targetType = 'progression'
    } else if (directChord) {
      targetType = 'chord'
    } else if (chordOfNote) {
      targetType = 'chord'
      resolvedId = chordOfNote.id
    } else if (state.notes.some(n => n.id === targetId)) {
      targetType = 'note'
    } else {
      return
    }

    if (targetType === 'note') {
      const isLegatoIntermediate = state.notes.some(n => n.intermediateNoteIds?.includes(targetId))
      if (isLegatoIntermediate) return
    }

    const existing = state.rhythmModifiers.find(m => m.targetId === resolvedId && m.targetType === targetType)
    if (existing) return

    ph()

    let activeTracks: string[] = []
    if (trackIndex === -2) {
      activeTracks = rhythm.tracks.map(t => t.part)
    } else {
      let track = rhythm.tracks[trackIndex ?? -1]
      if (!track || (trackIndex === undefined || trackIndex === -1)) {
        track = rhythm.tracks.find(t => ['chord', 'perc', 'kick'].includes(t.part)) || rhythm.tracks[0]
      }
      if (track) activeTracks = [track.part]
    }

    if (activeTracks.length === 0) return

    addMod({ targetType, targetId: resolvedId, patternName: rhythm.name, activeTracks, mode: 'proportional', enabled: true, fillGaps: true })
  },

  /**
   * Removes a modifier from a target, restoring it to normal
   */
  restoreToNormal: (modifierId: string) => {
    const state = useTablatureR3FStore.getState()
    // If legato was materialized, dematerialize first
    const mod = state.rhythmModifiers.find(m => m.id === modifierId)
    if (mod?.legato) RhythmModifierService.dematerializeLegatoRhythm(modifierId)
    state.pushHistory()
    state.removeRhythmModifier(modifierId)
  },

  /**
   * Finds the active modifier for a given note, respecting the hierarchy:
   * 1. Note-specific modifier
   * 2. Chord-group modifier
   * 3. Progression-group modifier
   */
  getActiveModifierForNote: (note: TablatureNote): RhythmModifier | undefined => {
    const state = useTablatureR3FStore.getState()
    const mods = state.rhythmModifiers.filter(m => m.enabled)

    let activeMod = mods.find(m => m.targetType === 'note' && m.targetId === note.id)
    if (activeMod) return activeMod

    const chord = state.chordGroups.find(g => g.noteIds.includes(note.id))
    if (chord) {
      activeMod = mods.find(m => m.targetType === 'chord' && m.targetId === chord.id)
      if (activeMod) return activeMod
    }

    if (chord) {
      const prog = state.progressionGroups.find(p => p.chordGroupIds.includes(chord.id))
      if (prog) {
        activeMod = mods.find(m => m.targetType === 'progression' && m.targetId === prog.id)
        if (activeMod) return activeMod
      }
    }

    return undefined
  },

  /**
   * Calculates the virtual sub-notes for a given note if a rhythm modifier is active.
   * Returns null if no modifier applies OR if the modifier is in legato mode
   * (in that case, the notes are materialized as real notes in the store).
   */
  getVirtualRhythm: (note: TablatureNote): VirtualNote[] | null => {
    const activeMod = RhythmModifierService.getActiveModifierForNote(note)
    if (!activeMod) return null
    if (activeMod.legato) return null  // Notes are real — rendered by the normal notes loop

    const pattern = rhythmPatterns.find(p => p.name === activeMod.patternName)
    if (!pattern) return null

    const { totalSteps, mergedSteps } = mergeSteps(pattern, activeMod, note)

    const onsets = mergedSteps.map((vel, i) => vel > 0 ? i : -1).filter(i => i !== -1)
    if (onsets.length === 0) return null

    let stepDur = note.duration / totalSteps
    if (activeMod.mode === 'extended') {
      const patternBars = pattern.bars || 1
      stepDur = patternBars * BEATS_PER_MEAS / totalSteps
    }

    return onsets.map((step, idx) => {
      let dur = stepDur
      if (activeMod.fillGaps) {
        const nextStep = idx < onsets.length - 1 ? onsets[idx + 1] : totalSteps
        dur = (nextStep - step) * stepDur
      }
      return { startBeat: note.startBeat + step * stepDur, duration: dur, id: `${note.id}-sub-${step}` }
    })
  },

  /**
   * Materializes one note's virtual sub-notes as a real legato chain.
   * First sub-note = legato SOURCE (base note updated in place).
   * Last sub-note  = legato DESTINATION (new note).
   * Middle sub-notes = INTERMEDIATE notes stored in source.intermediateNoteIds.
   * The LegatoLine component then renders a single ribbon from source through intermediates to dest.
   * Caller is responsible for pushHistory() — this only performs the mutation.
   */
  materializeChainForNote: (mod: RhythmModifier, baseNote: TablatureNote): { baseNoteId: string; extras: string[]; origRange: { startBeat: number; duration: number } } | null => {
    const state = useTablatureR3FStore.getState()
    const virtual = computeVirtualNotes(mod, baseNote)
    if (!virtual || virtual.length < 2) return null

    const origRange = { startBeat: baseNote.startBeat, duration: baseNote.duration }
    const sn0 = virtual[0]
    const snLast = virtual[virtual.length - 1]

    // Update base note → legato source (first sub-note position)
    state.updateNote(baseNote.id, {
      startBeat: sn0.startBeat,
      duration: sn0.duration,
      legatoNext: undefined,
      legatoPrev: undefined,
      intermediateNoteIds: []
    })

    // Create destination note (last sub-note)
    const destId = state.addNote({
      string: baseNote.string,
      fret: baseNote.fret,
      startBeat: snLast.startBeat,
      duration: snLast.duration
    })
    state.updateNote(destId, { legatoPrev: baseNote.id })

    // Create intermediate notes (sub-notes 1..N-2) at their pattern positions
    const intermediateIds: string[] = []
    for (let i = 1; i < virtual.length - 1; i++) {
      const sn = virtual[i]
      const id = state.addNote({
        string: baseNote.string,
        fret: baseNote.fret,
        startBeat: sn.startBeat,
        duration: sn.duration
      })
      intermediateIds.push(id)
    }

    // Wire source: legatoNext → dest, intermediateNoteIds → middles
    state.updateNote(baseNote.id, {
      legatoNext: destId,
      intermediateNoteIds: intermediateIds
    })

    return { baseNoteId: baseNote.id, extras: [...intermediateIds, destId], origRange }
  },

  /**
   * Materializes the modifier's virtual rhythm as real legato notes.
   * - targetType='note': a single chain on that note (legacy single-chain fields).
   * - targetType='chord': **every note of the chord** gets its own independent chain —
   *   the rhythm must apply to the whole chord, not collapse onto just the root/fundamental.
   *   Stored as legatoChains[]; the chord group's noteIds is updated to span all of them.
   */
  materializeLegatoRhythm: (modId: string) => {
    const state = useTablatureR3FStore.getState()
    const mod = state.rhythmModifiers.find(m => m.id === modId)
    if (!mod || mod.legato) return

    if (mod.targetType === 'chord') {
      const chord = state.chordGroups.find(g => g.id === mod.targetId)
      if (!chord) return
      const chordNotes = state.notes.filter(n => chord.noteIds.includes(n.id))
      if (chordNotes.length === 0) return

      // P4-3: pre-flight — skip notes that are already in a legato chain from a different
      // modifier (legatoNext present means the note is a chain source or an intermediate).
      // Overwriting legatoNext would silently corrupt the existing chain.
      const availableNotes = chordNotes.filter(n => !n.legatoNext && !n.legatoPrev)
      if (availableNotes.length === 0) return

      state.pushHistory()
      // Notes whose pattern has fewer than 2 onsets can't form a chain (materializeChainForNote
      // returns null without touching them) — they stay in the group untouched, alongside the
      // notes that did materialize.
      const unchangedIds: string[] = chordNotes
        .filter(n => n.legatoNext || n.legatoPrev)  // already-chained notes stay untouched
        .map(n => n.id)
      const chains: { baseNoteId: string; extras: string[]; origRange: { startBeat: number; duration: number } }[] = []
      availableNotes.forEach(n => {
        const chain = RhythmModifierService.materializeChainForNote(mod, n)
        if (chain) chains.push(chain)
        else unchangedIds.push(n.id)
      })
      if (chains.length === 0) return

      const allIds = [...chains.flatMap(c => [c.baseNoteId, ...c.extras]), ...unchangedIds]
      const fresh = useTablatureR3FStore.getState()
      fresh.setChordGroupNoteIds(chord.id, allIds)
      fresh.updateRhythmModifier(modId, { legato: true, legatoChains: chains })
      return
    }

    const baseNote = state.notes.find(n => n.id === mod.targetId)
    if (!baseNote) return

    // P4-3: pre-flight for single-note target
    if (baseNote.legatoNext || baseNote.legatoPrev) return

    state.pushHistory()
    const chain = RhythmModifierService.materializeChainForNote(mod, baseNote)
    if (!chain) return

    useTablatureR3FStore.getState().updateRhythmModifier(modId, {
      legato: true,
      legatoBaseNoteId: chain.baseNoteId,
      legatoExtras: chain.extras,
      legatoOrigRange: chain.origRange
    })
  },

  /**
   * Dematerializes every chain (single or multi) on this modifier, restoring each base note
   * to its original range and deleting the extra materialized notes. Deleting a chain's extras
   * naturally shrinks the chord group's noteIds back down to just the base notes (deleteNote's
   * own cascade), so no explicit chord-group cleanup is needed here.
   */
  dematerializeLegatoRhythm: (modId: string) => {
    const initial = useTablatureR3FStore.getState()
    const mod = initial.rhythmModifiers.find(m => m.id === modId)
    if (!mod?.legato) return

    initial.pushHistory()

    const chains = (mod.legatoChains && mod.legatoChains.length > 0)
      ? mod.legatoChains
      : (mod.legatoBaseNoteId && mod.legatoOrigRange)
        ? [{ baseNoteId: mod.legatoBaseNoteId, extras: mod.legatoExtras ?? [], origRange: mod.legatoOrigRange }]
        : []

    // No tuning passed to deleteNote: skip its auto chord-name re-detection — the chord's
    // name must stay what it was before materializing, not whatever a partial set detects as.
    chains.forEach(chain => {
      const store = useTablatureR3FStore.getState()
      const extras = new Set(chain.extras)
      extras.forEach(id => store.deleteNote(id))

      const baseNote = useTablatureR3FStore.getState().notes.find(n => n.id === chain.baseNoteId)
      if (baseNote) {
        useTablatureR3FStore.getState().updateNote(baseNote.id, {
          startBeat: chain.origRange.startBeat,
          duration: chain.origRange.duration,
          legatoNext: undefined,
          legatoPrev: undefined,
          intermediateNoteIds: [],
          legatoCount: 0
        })
      }
    })

    useTablatureR3FStore.getState().updateRhythmModifier(modId, {
      legato: false,
      legatoBaseNoteId: undefined,
      legatoExtras: undefined,
      legatoOrigRange: undefined,
      legatoChains: undefined
    })
  },

  /**
   * Dematerializes, applies a modifier patch, then re-materializes.
   * Used when changing pattern or instruments while legato is active.
   */
  rematerializeWithPatch: (modId: string, patch: Partial<RhythmModifier>) => {
    RhythmModifierService.dematerializeLegatoRhythm(modId)
    useTablatureR3FStore.getState().updateRhythmModifier(modId, patch)
    RhythmModifierService.materializeLegatoRhythm(modId)
  },

  /**
   * Returns the track part assigned to a single string/note of a chord-targeting modifier,
   * or ALL_TRACKS when no per-string override is set (merged default behavior).
   */
  getAssignedTrack: (mod: RhythmModifier, noteId: string): string => {
    return mod.stringTrackOverrides?.[noteId] ?? ALL_TRACKS
  },

  /**
   * Cycles a single chord note's instrument assignment through the active pattern's tracks
   * (plus ALL_TRACKS), used by the per-string instrument discs on chord pods.
   */
  cycleStringTrack: (modId: string, noteId: string) => {
    const state = useTablatureR3FStore.getState()
    const mod = state.rhythmModifiers.find(m => m.id === modId)
    if (!mod) return
    const pattern = rhythmPatterns.find(p => p.name === mod.patternName)
    if (!pattern) return

    const options = [ALL_TRACKS, ...pattern.tracks.map(t => t.part)]
    const current = RhythmModifierService.getAssignedTrack(mod, noteId)
    const next = options[(options.indexOf(current) + 1) % options.length]

    const overrides = { ...(mod.stringTrackOverrides ?? {}) }
    if (next === ALL_TRACKS) delete overrides[noteId]
    else overrides[noteId] = next

    const patch: Partial<RhythmModifier> = { stringTrackOverrides: overrides }
    if (mod.legato) RhythmModifierService.rematerializeWithPatch(modId, patch)
    else {
      state.pushHistory()
      state.updateRhythmModifier(modId, patch)
    }
  },

  /**
   * True when the note belongs to a materialized rhythm-legato chain (source, intermediate,
   * or destination) AND that chain is still actually linked. Locked notes may only change
   * string manually — horizontal move and resize are blocked. Only applies to rhythm-modifier
   * legato, not manual legato chains.
   *
   * Checks the base note's live `legatoNext` rather than trusting the modifier's stored
   * `legatoBaseNoteId`/`legatoExtras` blindly — those go stale once the chain is dissolved
   * by "merge" (renderLegato clears legatoNext) or by deleting the destination/last
   * intermediate (deleteNote also clears legatoNext), so the pods must unlock automatically
   * in both cases without needing an explicit cleanup call at every dissolution site.
   */
  isLegatoLocked: (noteId: string): boolean => {
    const state = useTablatureR3FStore.getState()
    return state.rhythmModifiers.some(m => {
      if (!m.legato) return false
      if (m.legatoChains && m.legatoChains.length > 0) {
        return m.legatoChains.some(chain => {
          if (chain.baseNoteId !== noteId && !chain.extras.includes(noteId)) return false
          const base = state.notes.find(n => n.id === chain.baseNoteId)
          return !!base?.legatoNext
        })
      }
      if (!m.legatoBaseNoteId) return false
      if (m.legatoBaseNoteId !== noteId && !m.legatoExtras?.includes(noteId)) return false
      const base = state.notes.find(n => n.id === m.legatoBaseNoteId)
      return !!base?.legatoNext
    })
  }
}

/**
 * Pure expansion of notes using rhythm modifiers — no store access.
 * Used by TablaturePDFService to include virtual sub-notes in the PDF output.
 *
 * - Materialized modifiers (mod.legato = true): notes are already real in the store → pass through.
 * - Virtual modifiers (mod.legato = false): expand the note into sub-notes using the pattern.
 */
export function expandNotesWithModifiers(
  notes: TablatureNote[],
  rhythmModifiers: RhythmModifier[],
  chordGroups: ChordGroup[],
  progressionGroups: ProgressionGroup[],
): TablatureNote[] {
  const enabledMods = rhythmModifiers.filter(m => m.enabled)
  const result: TablatureNote[] = []

  for (const note of notes) {
    // Hierarchy: note → chord → progression
    let activeMod = enabledMods.find(m => m.targetType === 'note' && m.targetId === note.id)
    if (!activeMod) {
      const chord = chordGroups.find(g => g.noteIds.includes(note.id))
      if (chord) {
        activeMod = enabledMods.find(m => m.targetType === 'chord' && m.targetId === chord.id)
        if (!activeMod) {
          const prog = progressionGroups.find(p => p.chordGroupIds.includes(chord.id))
          if (prog) {
            activeMod = enabledMods.find(m => m.targetType === 'progression' && m.targetId === prog.id)
          }
        }
      }
    }

    if (!activeMod || activeMod.legato) {
      // No modifier, or already materialized as real notes
      result.push(note)
      continue
    }

    const virtual = computeVirtualNotes(activeMod, note)
    if (!virtual || virtual.length === 0) {
      result.push(note)
      continue
    }

    // Replace the base note with its virtual sub-notes (same string/fret, different timing)
    for (const vn of virtual) {
      result.push({ ...note, id: vn.id, startBeat: vn.startBeat, duration: vn.duration })
    }
  }

  return result
}
