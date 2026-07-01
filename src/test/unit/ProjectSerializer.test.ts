/**
 * @file ProjectSerializer.test.ts
 * TDD — tests écrits avant l'implémentation de ProjectSerializerService.
 * Couvre : sérialisation, désérialisation, migrations, validation.
 */

import { describe, it, expect } from 'vitest'
import { ProjectSerializerService } from '../../services/ProjectSerializerService'
import { PROJECT_VERSION } from '../../types/project'
import type { TablatureNote } from '../../types'
import type { SerializableState } from '../../types/project'

const TUNING = 'E2,A2,D3,G3,C4,e4'

function makeNote(overrides: Partial<TablatureNote> = {}): TablatureNote {
  return { id: 'n1', string: 0, startBeat: 0, duration: 1, fret: 0, ...overrides }
}

const emptyState: SerializableState = {
  notes: [],
  chordGroups: [],
  progressionGroups: [],
  rhythmModifiers: [],
  modeZones: [],
  tempo: 120,
  projectName: 'Test',
}

// ── Sérialisation ────────────────────────────────────────────────────────────

describe('ProjectSerializerService — serialize()', () => {
  it('inclut tous les champs requis', () => {
    const data = ProjectSerializerService.serialize(emptyState, TUNING)
    expect(data.version).toBe(PROJECT_VERSION)
    expect(data.name).toBe('Test')
    expect(data.settings.tuning).toBe(TUNING)
    expect(data.settings.tempo).toBe(120)
    expect(Array.isArray(data.notes)).toBe(true)
    expect(Array.isArray(data.chordGroups)).toBe(true)
    expect(Array.isArray(data.progressionGroups)).toBe(true)
    expect(Array.isArray(data.rhythmModifiers)).toBe(true)
    expect(Array.isArray(data.modeZones)).toBe(true)
    expect(typeof data.createdAt).toBe('string')
    expect(typeof data.updatedAt).toBe('string')
  })

  it('exclut les champs éphémères (isPlaying, playbackBeat, legatoSourceId, history)', () => {
    const data = ProjectSerializerService.serialize(emptyState, TUNING) as any
    expect(data.isPlaying).toBeUndefined()
    expect(data.playbackBeat).toBeUndefined()
    expect(data.legatoSourceId).toBeUndefined()
    expect(data.past).toBeUndefined()
    expect(data.future).toBeUndefined()
    expect(data.isFollowing).toBeUndefined()
  })

  it('createdAt et updatedAt sont des ISO 8601 valides', () => {
    const data = ProjectSerializerService.serialize(emptyState, TUNING)
    expect(() => new Date(data.createdAt).toISOString()).not.toThrow()
    expect(() => new Date(data.updatedAt).toISOString()).not.toThrow()
  })
})

// ── Round-trip ───────────────────────────────────────────────────────────────

describe('ProjectSerializerService — round-trip', () => {
  it('deserialize(serialize(state)) restitue les notes fidèlement', () => {
    const note = makeNote({ id: 'n1', fret: 7, string: 2, duration: 2 })
    const state: SerializableState = { ...emptyState, notes: [note] }
    const json = JSON.stringify(ProjectSerializerService.serialize(state, TUNING))
    const result = ProjectSerializerService.deserialize(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.notes).toHaveLength(1)
    expect(result.data.notes[0].fret).toBe(7)
    expect(result.data.notes[0].string).toBe(2)
    expect(result.data.settings.tuning).toBe(TUNING)
    expect(result.data.settings.tempo).toBe(120)
  })

  it('les références legato valides survivent au round-trip', () => {
    const src = makeNote({ id: 'src', legatoNext: 'dst' })
    const dst = makeNote({ id: 'dst', legatoPrev: 'src' })
    const state: SerializableState = { ...emptyState, notes: [src, dst] }
    const json = JSON.stringify(ProjectSerializerService.serialize(state, TUNING))
    const result = ProjectSerializerService.deserialize(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.notes[0].legatoNext).toBe('dst')
    expect(result.data.notes[1].legatoPrev).toBe('src')
  })
})

// ── Migrations ───────────────────────────────────────────────────────────────

describe('ProjectSerializerService — migrations', () => {
  it('fichier sans champ version (v0 legacy) ne plante pas', () => {
    const v0 = {
      notes: [], chordGroups: [], progressionGroups: [],
      rhythmModifiers: [], modeZones: [],
      settings: { tuning: TUNING, tempo: 120 },
      name: 'Legacy',
      createdAt: '', updatedAt: '',
    }
    const result = ProjectSerializerService.deserialize(JSON.stringify(v0))
    expect(result.ok).toBe(true)
  })

  it('fichier v0 sans champ settings reçoit les valeurs par défaut', () => {
    const v0 = {
      notes: [], chordGroups: [], progressionGroups: [],
      rhythmModifiers: [], modeZones: [],
    }
    const result = ProjectSerializerService.deserialize(JSON.stringify(v0))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.settings.tuning).toBe('E2,A2,D3,G3,C4,e4')
    expect(result.data.settings.tempo).toBe(120)
  })
})

// ── Validation ───────────────────────────────────────────────────────────────

describe('ProjectSerializerService — validation', () => {
  it('JSON invalide retourne ok:false sans throw', () => {
    const result = ProjectSerializerService.deserialize('{not: valid json}')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(typeof result.error).toBe('string')
  })

  it('JSON vide retourne ok:false', () => {
    const result = ProjectSerializerService.deserialize('')
    expect(result.ok).toBe(false)
  })

  it('champ notes manquant retourne ok:false', () => {
    const result = ProjectSerializerService.deserialize(
      JSON.stringify({ version: 1, chordGroups: [], progressionGroups: [], rhythmModifiers: [], modeZones: [], settings: { tuning: TUNING, tempo: 120 }, name: 'x', createdAt: '', updatedAt: '' })
    )
    expect(result.ok).toBe(false)
  })

  it('legatoNext orphelin retourne ok:false avec message explicite', () => {
    const note = makeNote({ id: 'n1', legatoNext: 'GHOST_ID' })
    const state: SerializableState = { ...emptyState, notes: [note] }
    const json = JSON.stringify(ProjectSerializerService.serialize(state, TUNING))
    const result = ProjectSerializerService.deserialize(json)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('legatoNext')
  })

  it('store intact après une désérialisation échouée — pas de mutation de l\'appelant', () => {
    const before = { ...emptyState }
    ProjectSerializerService.deserialize('{bad}')
    expect(emptyState).toEqual(before)
  })
})
