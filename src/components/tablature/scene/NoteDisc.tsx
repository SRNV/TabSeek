/**
 * @file NoteDisc.tsx
 * DOM overlay (via drei Html) showing the fret number and note name for a note pod.
 * Rendered at zIndex 70 so it sits below chord/rhythm discs (80) and measure labels (200).
 */
import React from 'react'
import { Html } from '@react-three/drei'
import { passWheel } from './passWheel'

/**
 * Fret-number + note-name badge pinned to the left edge of a note pod.
 * When `locked` (rhythm-legato materialized note), a padlock icon is shown
 * — the note can still change string manually but horizontal move/resize are blocked.
 */
export function NoteDisc({ discX, discPx, fill, border, text, fret, noteName, locked, onClick, onMouseEnter, onMouseLeave }: {
  discX: number
  discPx: number
  fill: string
  border: string
  text: string
  fret: number
  noteName: string
  locked: boolean
  onClick: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <Html position={[discX, 0, 0.06]} center zIndexRange={[70, 70]} style={{ pointerEvents: 'auto' }} onWheel={passWheel}>
      <div
        onPointerDown={e => e.stopPropagation()}
        onWheel={passWheel}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          width: discPx, height: discPx, borderRadius: '50%',
          background: fill, border: `2px solid ${border}`,
          boxSizing: 'border-box', position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {locked && (
          <span className="material-symbols-outlined" style={{
            position: 'absolute', top: -discPx * 0.08, left: -discPx * 0.08,
            fontSize: discPx * 0.32, color: text, lineHeight: 1,
            background: border, borderRadius: '50%', padding: discPx * 0.04,
            boxSizing: 'border-box',
          }}>lock</span>
        )}
        <span style={{ fontSize: discPx * 0.38, fontWeight: 800, color: text, lineHeight: 1 }}>
          {fret}
        </span>
        <span style={{ fontSize: discPx * 0.18, fontWeight: 700, color: text, opacity: 0.85, lineHeight: 1, marginTop: discPx * 0.03 }}>
          {noteName}
        </span>
      </div>
    </Html>
  )
}
