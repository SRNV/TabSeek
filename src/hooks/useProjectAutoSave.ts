/**
 * @file useProjectAutoSave.ts
 * Subscribes to the R3F store and auto-saves the project to localStorage
 * with a 2-second debounce after any mutation.
 * Also marks the project dirty on any store change and syncs document.title.
 */

import { useEffect, useRef } from 'react'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { ProjectSerializerService } from '../services/ProjectSerializerService'
import { PreferencesService } from '../services/PreferencesService'

const AUTOSAVE_KEY = 'autosave'
const DEBOUNCE_MS  = 2000

export function useProjectAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function doSave() {
      const r3f    = useTablatureR3FStore.getState()
      const tuning = useTablatureStore.getState().tuning
      const data   = ProjectSerializerService.serialize(
        {
          notes:             r3f.notes,
          chordGroups:       r3f.chordGroups,
          progressionGroups: r3f.progressionGroups,
          rhythmModifiers:   r3f.rhythmModifiers,
          modeZones:         r3f.modeZones,
          tempo:             r3f.tempo,
          projectName:       r3f.projectName,
        },
        tuning
      )
      PreferencesService.set(AUTOSAVE_KEY, data)
      // Clear dirty flag after successful save
      useTablatureR3FStore.setState({ isProjectDirty: false })
    }

    const unsubscribe = useTablatureR3FStore.subscribe((state, prev) => {
      // Ignore playback-only changes to avoid spamming saves during playback
      if (
        state.notes             === prev.notes &&
        state.chordGroups       === prev.chordGroups &&
        state.progressionGroups === prev.progressionGroups &&
        state.rhythmModifiers   === prev.rhythmModifiers &&
        state.modeZones         === prev.modeZones &&
        state.tempo             === prev.tempo &&
        state.projectName       === prev.projectName
      ) return

      useTablatureR3FStore.setState({ isProjectDirty: true })

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(doSave, DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}
