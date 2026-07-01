import { Note, Chord } from 'tonal'
import { numeralToChordName, romanToDegree } from '../utils/chordUtils'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import { useTablatureStore } from '../stores/useTablatureStore'
import { useMainStore } from '../stores/useMainStore'
import { getNoteName } from '../composables/useNoteHelpers'
import { findBestChordFrets, Voicing } from '../utils/guitarUtils'
import { RhythmModifierService } from './RhythmModifierService'
import type { ChordProgression } from '../composables/progressions'
import type { RhythmPatternDef } from '../composables/rhythmPatterns'

const CHORD_DUR = 4 // Default duration for each chord in a progression

export const TablatureDropService = {
  handleRhythmDrop: (rhythm: RhythmPatternDef, targetId: string, trackIndex?: number) => {
    RhythmModifierService.applyRhythmToTarget(rhythm, targetId, trackIndex)
  },

  handleDrop: (
    prog: ChordProgression,
    si: number,
    beat: number,
    scaleNotes: string[]
  ) => {
    const state = useTablatureR3FStore.getState()
    const { 
      addNote: add, addChordGroup: addGrp, addProgressionGroup: addProg, 
      deleteNote, updateNote, removeChordGroup, setLegatoSourceId, pushHistory: ph 
    } = state
    
    setLegatoSourceId(null) // Clear any pending legato creation
    
    const tuning = useTablatureStore.getState().tuning.split(',')
    const userScale = useMainStore.getState().userScale
    const scalePc = Note.pitchClass(userScale)
    
    // Check if dropped on an existing note pod (within its duration)
    const dropOnNote = state.notes.find(n => 
      n.string === si && 
      beat >= n.startBeat && 
      beat <= (n.startBeat + n.duration)
    )

    if (dropOnNote) {
      const isChordPod = state.chordGroups.some(g => g.noteIds.includes(dropOnNote.id))
      const isLegatoPod = !!(dropOnNote.legatoNext || dropOnNote.legatoPrev || state.notes.some(n => n.intermediateNoteIds?.includes(dropOnNote.id)))
      
      if (isChordPod || isLegatoPod) {
        return // Forbidden to drop on chord pods or legato-generated pods
      }
    }
    
    ph()
    const addedGroupIds: string[] = []

    let effectiveScalePc = scalePc
    let forcedRoot: Voicing | undefined = undefined
    let effectiveBeat = beat
    let dropNoteId: string | undefined = undefined
    let dur = CHORD_DUR

    if (dropOnNote) {
      dur = dropOnNote.duration
      const noteName = getNoteName(tuning[dropOnNote.string], dropOnNote.fret)
      
      // Anchoring logic: find the Tonic such that the first chord's root is the note we dropped on
      const firstNumeral = prog.numerals?.split('-')[0]
      if (firstNumeral && !prog._chordType) {
        const { degree, alteration } = romanToDegree(firstNumeral)
        const ivsSemitones = [0, 2, 4, 5, 7, 9, 11]
        const intervalSt = ivsSemitones[degree - 1] + alteration
        const noteMidi = Note.midi(noteName + '4')
        effectiveScalePc = (noteMidi !== null && noteMidi !== undefined)
          ? Note.pitchClass(Note.fromMidi(noteMidi - intervalSt))
          : noteName
      } else {
        effectiveScalePc = Note.pitchClass(noteName)
      }

      forcedRoot = { si: dropOnNote.string, fret: dropOnNote.fret }
      effectiveBeat = dropOnNote.startBeat // Snap to the target pod's position
      dropNoteId = dropOnNote.id
      
      // Update global tonic
      if (effectiveScalePc) {
        const scaleWithOctave = effectiveScalePc.includes('0') || effectiveScalePc.includes('1') || effectiveScalePc.includes('2') || 
                               effectiveScalePc.includes('3') || effectiveScalePc.includes('4') || effectiveScalePc.includes('5') || 
                               effectiveScalePc.includes('6') || effectiveScalePc.includes('7') || effectiveScalePc.includes('8') || 
                               effectiveScalePc.includes('9') 
                               ? effectiveScalePc : `${effectiveScalePc}4`
        useMainStore.getState().setUserScale(scaleWithOctave)
      }
      
      // Break any legato connection
      updateNote(dropNoteId, { 
        legatoNext: undefined, 
        legatoPrev: undefined, 
        intermediateNoteIds: [], 
        legatoCount: 0 
      }, tuning, scaleNotes)

      // Clean intermediate notes if it was a source
      if (dropOnNote.intermediateNoteIds && dropOnNote.intermediateNoteIds.length > 0) {
        dropOnNote.intermediateNoteIds.forEach(id => deleteNote(id, tuning))
      }

      // Remove existing groups that contain this note
      state.chordGroups.forEach(g => {
        if (g.noteIds.includes(dropNoteId!)) {
          removeChordGroup(g.id)
        }
      })
    }

    const numChords = prog._chordType ? 1 : prog.numerals.split('-').length
    const totalProgDur = numChords * dur

    const chordEntries: Array<{ chordName: string; startBeat: number }> = prog._chordType
      ? [{ chordName: effectiveScalePc + prog._chordType, startBeat: effectiveBeat }]
      : prog.numerals.split('-').map((numeral, ci) => ({
          chordName: numeralToChordName(numeral, effectiveScalePc),
          startBeat: effectiveBeat + ci * dur,
        }))

    chordEntries.forEach(({ chordName, startBeat }, ci) => {
      // Re-fetch fresh state for each chord entry to avoid using stale notes array
      const currentState = useTablatureR3FStore.getState()
      const chordData = Chord.get(chordName)
      if (chordData.empty || chordData.notes.length === 0) return // skip unrecognised chord names
      const notesPc   = chordData.notes
      const addedIds: string[] = []

      const voicing = findBestChordFrets(tuning, notesPc, si, ci === 0 ? forcedRoot : undefined)
      
      voicing.forEach(v => {
        const targetSi = v.si
        
        const overlapping = currentState.notes.filter(n => 
          n.string === targetSi && 
          n.id !== dropNoteId &&
          n.startBeat < (startBeat + dur) && 
          (n.startBeat + n.duration) > startBeat
        )

        // Instead of deleting, we shift overlapping notes forward
        overlapping.forEach(n => {
          updateNote(n.id, { startBeat: n.startBeat + totalProgDur }, tuning, scaleNotes)
        })

        if (ci === 0 && dropNoteId && targetSi === dropOnNote!.string) {
          // Keep the note we dropped on, update its duration
          updateNote(dropNoteId, { duration: dur, fret: v.fret }, tuning, scaleNotes)
          addedIds.push(dropNoteId)
          return
        }
        
        addedIds.push(add({ string: targetSi, startBeat, duration: dur, fret: v.fret }))
      })
      if (addedIds.length > 0) {
        const gId = addGrp(addedIds, chordName)
        addedGroupIds.push(gId)
      }
    })

    if (addedGroupIds.length > 0 && !prog._chordType) {
      addProg(addedGroupIds, prog.name || 'Progression')
    }
  }
}
