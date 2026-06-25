import React, { useState, useEffect } from 'react'
import './TabSVGOverlay.scss'
import { useMainStore } from '../../stores/useMainStore'
import { Note } from 'tonal'

interface Position {
  x: number
  y: number
  note: string
  isFirst: boolean
}

interface Connection {
  from: Position
  to: Position
  note: string
}

export default function TabSVGOverlay() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const [notePositions, setNotePositions] = useState<Position[][]>([])

  const chordRootNote = useMainStore(s => s.chordRootNote)
  const chordRootObject = useMainStore(s => s.chordRootObject)

  const highlightedNotes: number[] = []
  if (chordRootObject) {
    chordRootObject.intervals.forEach((i: string) => {
      const r = Note.transpose(chordRootNote, i)
      const m = Note.midi(r)
      if (m !== null) highlightedNotes.push(m % 12)
    })
  }

  function updateNotePositions() {
    const newNotePositions: Position[][] = []
    const cords = new Set<string>()
    let positions: Position[] = []

    const forChordsDisplays = Array.from(
      document.querySelectorAll('.forChordsDisplay[note]')
    ).reverse() as HTMLElement[]

    while (forChordsDisplays.length > 0) {
      const element = forChordsDisplays.pop()
      if (!element) continue

      const note = element.getAttribute('note')
      const cord = element.getAttribute('cord')

      if (!note) continue
      if (cord && cords.has(cord)) continue

      const midiVal = Note.midi(note)
      if (midiVal === null) continue
      const midi = midiVal % 12

      if (highlightedNotes.includes(midi)) {
        const index = highlightedNotes.indexOf(midi)

        if (index === 0) {
          if (positions.length > 0) {
            newNotePositions.push(positions)
            positions = []
            cords.clear()
          }
        }

        const rect = element.getBoundingClientRect()
        const position: Position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          note: midi.toString(),
          isFirst: index === 0,
        }

        positions[index] = position
        positions = positions.filter(p => p)

        if (cord) cords.add(cord)
      }
    }

    if (positions.length > 0) {
      newNotePositions.push(positions)
    }

    setNotePositions(newNotePositions)
  }

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
      updateNotePositions()
    }

    window.addEventListener('resize', handleResize)
    updateNotePositions()

    const observer = new MutationObserver(() => updateNotePositions())
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    const intervalId = setInterval(updateNotePositions, 1000)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    updateNotePositions()
  }, [chordRootObject, chordRootNote])

  const connections: Connection[] = []
  notePositions.forEach((positions) => {
    for (let i = 0; i < positions.length - 1; i++) {
      if (positions[i] && positions[i + 1]) {
        connections.push({
          from: positions[i],
          to: positions[i + 1],
          note: positions[i].note,
        })
      }
    }
  })

  return (
    <div className="overlay-container">
      <svg
        className="overlay-svg"
        width={windowWidth}
        height={windowHeight}
        xmlns="http://www.w3.org/2000/svg"
      >
        {connections.map((conn, index) => (
          <line
            key={`line-${index}-${conn.note}`}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke="orange"
            strokeWidth="4"
            strokeOpacity="0.7"
          />
        ))}
        {notePositions.map((positions, index) => (
          <g key={index}>
            {positions.map((p, index2) => (
              <circle
                key={`circle-${index2}-${p.note}`}
                cx={p.x}
                cy={p.y}
                r="15"
                fill={p.isFirst ? 'blue' : 'orange'}
                fillOpacity="0.5"
                stroke="orange"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
