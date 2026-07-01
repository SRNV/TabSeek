/**
 * @file ProjectSerializerService.ts
 * Serialization, deserialization, validation and schema migration
 * for the TabSeek project format (.tabseek / JSON).
 *
 * Design constraints:
 * - serialize() never reads store state directly — caller passes SerializableState.
 * - deserialize() never mutates caller state on failure.
 * - Every schema change bumps PROJECT_VERSION and adds a migrateVn() function.
 */

import type { ProjectData, SerializableState } from '../types/project'
import { PROJECT_VERSION } from '../types/project'

export type DeserializeResult =
  | { ok: true; data: ProjectData }
  | { ok: false; error: string }

export const ProjectSerializerService = {
  /**
   * Produce a ProjectData snapshot from live store state.
   * Does not include transient fields (isPlaying, history, legatoSourceId…).
   */
  serialize(state: SerializableState, tuning: string): ProjectData {
    const now = new Date().toISOString()
    return {
      version: PROJECT_VERSION,
      name: state.projectName,
      createdAt: now,
      updatedAt: now,
      settings: { tuning, tempo: state.tempo },
      notes:            state.notes,
      chordGroups:      state.chordGroups,
      progressionGroups: state.progressionGroups,
      rhythmModifiers:  state.rhythmModifiers,
      modeZones:        state.modeZones,
    }
  },

  /**
   * Parse, migrate and validate a raw JSON string.
   * Returns { ok: false } on any error — never throws.
   */
  deserialize(raw: string): DeserializeResult {
    if (!raw) return { ok: false, error: 'Fichier vide.' }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'JSON invalide — fichier corrompu ou non supporté.' }
    }

    return _validateAndMigrate(parsed)
  },
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _validateAndMigrate(data: unknown): DeserializeResult {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'Format invalide — objet JSON attendu.' }
  }

  // Work on a shallow copy so we never mutate the caller's object.
  const d: Record<string, unknown> = { ...data as Record<string, unknown> }

  // ── Migration v0 → v1 ────────────────────────────────────────────────────
  if (!('version' in d) || d.version === 0) {
    if (!d.name)      d.name      = 'Projet importé'
    if (!d.createdAt) d.createdAt = new Date().toISOString()
    if (!d.updatedAt) d.updatedAt = new Date().toISOString()
    if (!d.settings)  d.settings  = { tuning: 'E2,A2,D3,G3,C4,e4', tempo: 120 }
    if (!Array.isArray(d.notes))            d.notes            = []
    if (!Array.isArray(d.chordGroups))      d.chordGroups      = []
    if (!Array.isArray(d.progressionGroups)) d.progressionGroups = []
    if (!Array.isArray(d.rhythmModifiers))  d.rhythmModifiers  = []
    if (!Array.isArray(d.modeZones))        d.modeZones        = []
    d.version = 1
  }

  // ── Field validation (v1) ────────────────────────────────────────────────
  if (!Array.isArray(d.notes))
    return { ok: false, error: 'Champ "notes" manquant ou invalide.' }
  if (!Array.isArray(d.chordGroups))
    return { ok: false, error: 'Champ "chordGroups" manquant ou invalide.' }
  if (!Array.isArray(d.progressionGroups))
    return { ok: false, error: 'Champ "progressionGroups" manquant ou invalide.' }
  if (!Array.isArray(d.rhythmModifiers))
    return { ok: false, error: 'Champ "rhythmModifiers" manquant ou invalide.' }
  if (!Array.isArray(d.modeZones))
    return { ok: false, error: 'Champ "modeZones" manquant ou invalide.' }
  if (typeof d.settings !== 'object' || d.settings === null)
    return { ok: false, error: 'Champ "settings" manquant ou invalide.' }

  // ── Referential integrity: legatoNext ────────────────────────────────────
  const noteIds = new Set((d.notes as any[]).map((n: any) => n?.id).filter(Boolean))
  for (const note of d.notes as any[]) {
    if (note?.legatoNext && !noteIds.has(note.legatoNext)) {
      return {
        ok: false,
        error: `legatoNext orphelin — la note "${note.legatoNext}" n'existe pas dans le projet.`,
      }
    }
  }

  return { ok: true, data: d as unknown as ProjectData }
}
