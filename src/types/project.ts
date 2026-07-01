/**
 * @file project.ts
 * Serialization types for the TabSeek project format (.tabseek files).
 * All fields are JSON-serializable — no THREE.js objects allowed here.
 */

import type {
  TablatureNote,
  ChordGroup,
  ProgressionGroup,
  RhythmModifier,
  ModeZone,
} from './tablature'

export const PROJECT_VERSION = 1

export interface ProjectSettings {
  tuning: string   // e.g. "E2,A2,D3,G3,C4,e4"
  tempo: number
}

export interface ProjectData {
  version: number
  name: string
  createdAt: string   // ISO 8601
  updatedAt: string
  settings: ProjectSettings
  notes: TablatureNote[]
  chordGroups: ChordGroup[]
  progressionGroups: ProgressionGroup[]
  rhythmModifiers: RhythmModifier[]
  modeZones: ModeZone[]
}

/** Subset of the R3F store state that is safe to serialize. */
export interface SerializableState {
  notes: TablatureNote[]
  chordGroups: ChordGroup[]
  progressionGroups: ProgressionGroup[]
  rhythmModifiers: RhythmModifier[]
  modeZones: ModeZone[]
  tempo: number
  projectName: string
}
