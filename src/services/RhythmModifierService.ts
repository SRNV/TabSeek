import { useTablatureR3FStore, TablatureNote, RhythmModifier } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { rhythmPatterns, RhythmPatternDef } from '../composables/rhythmPatterns'
import { BEATS_PER_MEAS } from '../utils/tabUtils'

export interface VirtualNote {
  startBeat: number
  duration: number
  id: string
}

// Shared helper: compute the onset list and step duration for a modifier + note
function computeVirtualNotes(mod: RhythmModifier, note: TablatureNote): VirtualNote[] | null {
  const pattern = rhythmPatterns.find(p => p.name === mod.patternName)
  if (!pattern) return null

  let totalSteps = 0
  const mergedSteps: number[] = []
  pattern.tracks.forEach(t => {
    if (mod.activeTracks.includes(t.part)) {
      totalSteps = Math.max(totalSteps, t.steps.length)
      t.steps.forEach((v, i) => { mergedSteps[i] = Math.max(mergedSteps[i] || 0, v) })
    }
  })

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

    let targetType: 'note' | 'chord' | 'progression' = 'note'
    const isNote = state.notes.some(n => n.id === targetId)
    const isChord = state.chordGroups.some(g => g.id === targetId)
    const isProg = state.progressionGroups.some(p => p.id === targetId)

    if (isProg) targetType = 'progression'
    else if (isChord) targetType = 'chord'
    else if (isNote) targetType = 'note'
    else return

    if (targetType === 'note') {
      const isLegatoIntermediate = state.notes.some(n => n.intermediateNoteIds?.includes(targetId))
      if (isLegatoIntermediate) return
    }

    const existing = state.rhythmModifiers.find(m => m.targetId === targetId && m.targetType === targetType)
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

    addMod({ targetType, targetId, patternName: rhythm.name, activeTracks, mode: 'proportional', enabled: true })
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

    let totalSteps = 0
    const mergedSteps: number[] = []
    pattern.tracks.forEach(t => {
      if (activeMod.activeTracks.includes(t.part)) {
        totalSteps = Math.max(totalSteps, t.steps.length)
        t.steps.forEach((v, i) => { mergedSteps[i] = Math.max(mergedSteps[i] || 0, v) })
      }
    })

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
   * Materializes virtual sub-notes as real legato notes.
   * First sub-note = legato SOURCE (base note updated in place).
   * Last sub-note  = legato DESTINATION (new note).
   * Middle sub-notes = INTERMEDIATE notes stored in source.intermediateNoteIds.
   * The LegatoLine component then renders a single ribbon from source through intermediates to dest.
   */
  materializeLegatoRhythm: (modId: string) => {
    const state = useTablatureR3FStore.getState()
    const mod = state.rhythmModifiers.find(m => m.id === modId)
    if (!mod || mod.legato) return

    // Find the base note to materialize
    let baseNote: TablatureNote | undefined
    if (mod.targetType === 'note') {
      baseNote = state.notes.find(n => n.id === mod.targetId)
    } else if (mod.targetType === 'chord') {
      const chord = state.chordGroups.find(g => g.id === mod.targetId)
      if (chord) baseNote = state.notes.find(n => chord.noteIds.includes(n.id))
    }
    if (!baseNote) return

    const virtual = computeVirtualNotes(mod, baseNote)
    if (!virtual || virtual.length < 2) return

    state.pushHistory()

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

    // Store materialized info in modifier (legatoBaseNoteId for reliable future lookup)
    state.updateRhythmModifier(modId, {
      legato: true,
      legatoBaseNoteId: baseNote.id,
      legatoExtras: [...intermediateIds, destId],
      legatoOrigRange: origRange
    })
  },

  /**
   * Dematerializes the legato chain, restoring the base note to its original range
   * and deleting the extra materialized notes.
   */
  dematerializeLegatoRhythm: (modId: string) => {
    const state = useTablatureR3FStore.getState()
    const mod = state.rhythmModifiers.find(m => m.id === modId)
    if (!mod?.legato || !mod.legatoOrigRange) return

    // Use stored legatoBaseNoteId for reliable lookup (chord-level modifiers would otherwise
    // find any note in the chord, not necessarily the materialized source)
    const baseNote = state.notes.find(n => n.id === (mod.legatoBaseNoteId ?? mod.targetId))

    state.pushHistory()

    const tuning = useTablatureStore.getState().tuning.split(',')

    // Delete extra notes (intermediates + dest) — deleteNote for dest also unlinks source's legatoNext
    const extras = new Set(mod.legatoExtras ?? [])
    extras.forEach(id => state.deleteNote(id, tuning))

    // Restore base note to original range
    if (baseNote) {
      state.updateNote(baseNote.id, {
        startBeat: mod.legatoOrigRange.startBeat,
        duration: mod.legatoOrigRange.duration,
        legatoNext: undefined,
        legatoPrev: undefined,
        intermediateNoteIds: [],
        legatoCount: 0
      })
    }

    state.updateRhythmModifier(modId, {
      legato: false,
      legatoBaseNoteId: undefined,
      legatoExtras: undefined,
      legatoOrigRange: undefined
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
      if (!m.legato || !m.legatoBaseNoteId) return false
      if (m.legatoBaseNoteId !== noteId && !m.legatoExtras?.includes(noteId)) return false
      const base = state.notes.find(n => n.id === m.legatoBaseNoteId)
      return !!base?.legatoNext
    })
  }
}
