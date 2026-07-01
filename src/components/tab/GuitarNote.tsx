import React, { useState, useEffect } from 'react'
import { Note, Scale } from 'tonal'
import './GuitarNote.scss'
import eventBus from '../../eventBus'
import { playNote } from '../../hooks/useAudio'
import { getNoteColor } from '../../hooks/useNoteHelpers'
import { useMainStore } from '../../stores/useMainStore'

interface GuitarNoteProps {
  child?: boolean
  forChordsDisplay?: boolean
  mode?: string
  position?: number
  cord?: number
  displayName?: string
  background?: string
  degreeLabel?: string
  onClick?: (e: React.MouseEvent) => void
  className?: string
}

export default function GuitarNote({
  child: _child = false,
  forChordsDisplay = false,
  position = 0,
  cord = 0,
  displayName = '',
  background = '#fff',
  degreeLabel = '',
  onClick,
  className: classNameProp,
}: GuitarNoteProps) {
  const order = [3, 5, 7, 2, 4, 6]
  const selectedMode = useMainStore(s => s.selectedMode)
  const userScale = useMainStore(s => s.userScale)
  const [playing, setPlaying] = useState(false)

  const currentMode = `${userScale} ${selectedMode}`

  const scaleStr = `${displayName} ${selectedMode}`
  const minorStr = `${displayName} minor`
  const sc = Scale.get(scaleStr)
  const intervals = order
    .map(Scale.degrees(!sc.empty ? scaleStr : minorStr))
    .filter((n) => n.length)

  const modeIntervals = order
    .map(Scale.degrees(currentMode))
    .filter((n) => n.length)

  const note = Note.get(displayName)
  const isAccidented = Boolean(note.acc?.length)
  const finalName = isAccidented
    ? `${displayName} ${Note.enharmonic(displayName)}`
    : displayName

  function handleClick(e: React.MouseEvent) {
    const midi = Note.get(displayName).midi
    playNote(displayName)
    if (midi != null) {
      eventBus.emit('noteSelected', midi)
      useMainStore.getState().setChordRootNote(displayName)
    }
    onClick?.(e)
  }

  function showIntervalTooltip(interval: string, e: React.MouseEvent) {
    try {
      const intervalNote = Note.distance(displayName, interval)
      eventBus.emit('showTooltip', {
        title: `${displayName} : Degré ${interval} (${intervalNote})`,
        content: `Note: ${intervalNote}`,
        x: e.clientX,
        y: e.clientY
      })
    } catch {}
  }

  function hideTooltip() {
    eventBus.emit('hideTooltip')
  }

  function onNotePlayed(midiPlayed: number) {
    const midiThis = Note.get(displayName).midi
    if (midiThis != null && midiPlayed === midiThis) {
      setPlaying(true)
      setTimeout(() => setPlaying(false), 700)
    }
  }

  useEffect(() => {
    eventBus.on('notePlayed', onNotePlayed)
    return () => eventBus.off('notePlayed', onNotePlayed)
  }, [displayName])

  const className = [
    'noteItem',
    playing ? 'playing' : '',
    forChordsDisplay ? 'forChordsDisplay' : '',
    classNameProp || '',
  ]
    .filter(Boolean).join(' ')

  return (
    <li
      {...{ note: displayName, cord: String(cord) } as any}
      className={className}
      style={{ backgroundColor: background }}
      onClick={handleClick}
    >
      <div className="description">
        <div className="position">{position}</div>
        <div className="name">{finalName}</div>
        <div className="degree">{degreeLabel}</div>
      </div>
      <div className="intervals">
        {intervals.map((inter, i) => (
          <div
            key={i}
            className="child"
            style={{ backgroundColor: getNoteColor(inter, 0, modeIntervals) }}
            onMouseEnter={(e) => showIntervalTooltip(inter, e)}
            onMouseLeave={hideTooltip}
            title={inter}
          >___</div>
        ))}
      </div>
    </li>
  )
}
