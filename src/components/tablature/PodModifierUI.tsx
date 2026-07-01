import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { EmojiBox, resolveEmojiStr } from '../../services/ChordEmojiService'
import { PodModifierService } from '../../services/PodModifierService'
import { ModeZoneService } from '../../services/ModeZoneService'
import { RhythmModifierService } from '../../services/RhythmModifierService'
import { useTablatureR3FStore } from '../../stores/useTablatureR3FStore'
import { rhythmPatterns } from '../../data/rhythmPatterns'
import type { RhythmPatternDef, ArpeggioDirection, ChordGroup, RhythmModifier, ModeZone } from '../../types'

// ── Floating overlay root — a single DOM node appended to <body>, outside the
// R3F Html stacking entirely. Popovers portal into it so they (a) can never be
// visually trapped/clipped under another row's Html element and (b) never sit
// in the canvas's row flow, so they can't block a neighboring string's clicks. ──
let overlayRootEl: HTMLDivElement | null = null

/**
 * Utility to forward wheel events to the canvas. 
 * R3F Html overlays with pointer-events: auto block the canvas's native wheel listener.
 */
function passWheel(e: React.WheelEvent) {
  const canvas = (e.currentTarget.ownerDocument || document).querySelector('.tab-r3f-canvas-area canvas')
  if (canvas) {
    canvas.dispatchEvent(new WheelEvent('wheel', {
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaZ: e.deltaZ,
      deltaMode: e.deltaMode,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      clientX: e.clientX,
      clientY: e.clientY,
      bubbles: true,
      cancelable: true
    }))
  }
}

function getOverlayRoot(): HTMLDivElement {
  if (overlayRootEl && document.body.contains(overlayRootEl)) return overlayRootEl
  overlayRootEl = document.createElement('div')
  overlayRootEl.className = 'pod-modifier-overlay-root'
  document.body.appendChild(overlayRootEl)
  return overlayRootEl
}

// Floating popover: tracks the anchor disc's live screen position every frame
// (so it follows pan/zoom) and renders via portal at a fixed screen position —
// above the disc by default, flipped below if there isn't room above the viewport.
function FloatingPodPopover({ anchorRef, popoverRef, children }: {
  anchorRef: React.RefObject<HTMLElement>
  popoverRef: React.RefObject<HTMLDivElement>
  children: React.ReactNode
}) {
  const [pos, setPos] = useState<{ left: number; top: number; placement: 'above' | 'below'; arrowLeft: number } | null>(null)

  useEffect(() => {
    let raf = 0
    function update() {
      const anchor = anchorRef.current
      const pop = popoverRef.current
      if (anchor) {
        const r = anchor.getBoundingClientRect()
        const popH = pop?.offsetHeight ?? 40
        const popW = pop?.offsetWidth ?? 200
        const gap = 8
        const aboveTop = r.top - popH - gap
        const placement: 'above' | 'below' = aboveTop >= 8 ? 'above' : 'below'
        const top = placement === 'above' ? aboveTop : r.bottom + gap
        const anchorCx   = r.left + r.width / 2
        const anchorLeft = r.left
        const maxLeft    = window.innerWidth - popW - 8
        const left       = Math.max(8, Math.min(maxLeft, anchorLeft))
        const arrowLeft  = Math.max(10, Math.min(popW - 10, anchorCx - left))
        setPos({ left, top, placement, arrowLeft })
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [anchorRef, popoverRef])

  return createPortal(
    <div
      ref={popoverRef}
      className={`floating-pod-popover${pos ? ` placement-${pos.placement}` : ''}`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onWheel={passWheel}
    >
      <div className="floating-pod-popover__arrow" style={{ left: pos?.arrowLeft ?? 0 }} />
      {children}
    </div>,
    getOverlayRoot()
  )
}

// ── Shared sticky disc: emoji + click-to-toggle floating popover ─────────────
// `title` is shown as a native tooltip on sustained hover — pod headers no longer carry a
// permanent visible label (chord name / pattern name / progression name), the disc's
// title attribute is the only place that name surfaces, kept on hover.
export function PodModifierDisc({
  emojiStr, size = 25, discBg, borderCol, glow, popoverContent, style, title, onDoubleClick,
}: {
  emojiStr: string
  size?: number
  discBg: string
  borderCol: string
  glow?: boolean
  popoverContent: (close: () => void) => React.ReactNode
  style?: React.CSSProperties
  title?: string
  onDoubleClick?: (e: React.MouseEvent) => void
}) {
  const [popoverVisible, setPopoverVisible] = useState(false)
  const anchorRef  = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside the disc or the popover.
  // Bubbling phase (not capture) so R3F processes canvas events first.
  useEffect(() => {
    if (!popoverVisible) return
    function handleOutside(e: PointerEvent) {
      if (anchorRef.current?.contains(e.target as Node)) return
      if (popoverRef.current?.contains(e.target as Node)) return
      setPopoverVisible(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [popoverVisible])

  return (
    <div style={{ position: 'relative', ...style }} onWheel={passWheel}>
      <div
        ref={anchorRef}
        onClick={e => { e.stopPropagation(); setPopoverVisible(v => !v) }}
        onDoubleClick={onDoubleClick ? (e => { e.stopPropagation(); onDoubleClick(e) }) : undefined}
        style={{ cursor: 'pointer' }}
        onWheel={passWheel}
        title={title}
      >
        <EmojiBox
          emojiStr={emojiStr}
          size={size}
          disc={{ bgColor: discBg, borderColor: borderCol }}
          style={{ boxShadow: glow ? `0 0 10px ${borderCol}80` : 'none' }}
        />
      </div>
      {popoverVisible && (
        <FloatingPodPopover anchorRef={anchorRef} popoverRef={popoverRef}>
          {popoverContent(() => setPopoverVisible(false))}
        </FloatingPodPopover>
      )}
    </div>
  )
}

// ── Shared popover shell: nav (optional) + specific content + remove/close ───
export function PodModifierPopover({
  nav, emojiStr, onRemove, onClose, className, children,
}: {
  nav?: { label: string; prev: () => void; next: () => void }
  emojiStr: string
  onRemove?: () => void
  onClose: () => void
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`legato-popover visible${className ? ` ${className}` : ''}`} onClick={e => e.stopPropagation()}>
      {nav && (
        <>
          <button className="pop-nav" onClick={nav.prev}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="pop-behavior-info">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{resolveEmojiStr(emojiStr)}</span>
            <span className="pop-name">{nav.label}</span>
          </div>
          <button className="pop-nav" onClick={nav.next}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <div className="pop-divider" />
        </>
      )}

      {children}

      {onRemove && (
        <>
          <div className="pop-divider" />
          <button className="pop-toggle" onClick={() => { onRemove(); onClose() }} title="Supprimer" style={{ color: '#883333' }}>
            <span className="material-symbols-outlined">delete</span>
          </button>
        </>
      )}
      <button className="pop-toggle" onClick={onClose} title="Fermer">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  )
}

// ── Chord pod: arpeggio sub-panel ─────────────────────────────────────────────
const ARP_DIRECTIONS: { id: ArpeggioDirection, icon: string, title: string }[] = [
  { id: 'up', icon: 'trending_up', title: 'Montant' },
  { id: 'down', icon: 'trending_down', title: 'Descendant' },
  { id: 'updown', icon: 'sync_alt', title: 'Aller-retour' },
  { id: 'downup', icon: 'swap_horiz', title: 'Aller-retour inversé' },
]

export function ArpeggioPanel({ group }: { group: ChordGroup }) {
  const activeMod = PodModifierService.getArpeggioForChord(group.id)
  const [direction, setDirection] = useState<ArpeggioDirection>(activeMod?.arpeggioDirection ?? 'up')
  const [noteCount, setNoteCount] = useState<number>(activeMod?.arpeggioNoteCount ?? Math.max(2, group.noteIds.length))

  function apply(nextDir: ArpeggioDirection, nextCount: number) {
    setDirection(nextDir)
    setNoteCount(nextCount)
    if (activeMod) PodModifierService.updateArpeggio(activeMod, nextDir, nextCount)
    else PodModifierService.applyArpeggio(group.id, nextDir, nextCount)
  }

  return (
    <div className="arpeggio-popover" onClick={e => e.stopPropagation()} onWheel={passWheel}>
      <div className="arpeggio-popover__directions">
        {ARP_DIRECTIONS.map(d => (
          <button
            key={d.id}
            className={`pop-toggle${direction === d.id ? ' active' : ''}`}
            title={d.title}
            onClick={() => apply(d.id, noteCount)}
          >
            <span className="material-symbols-outlined">{d.icon}</span>
          </button>
        ))}
      </div>
      <div className="arpeggio-popover__count">
        <button className="pop-nav" onClick={() => apply(direction, Math.max(2, noteCount - 1))}>
          <span className="material-symbols-outlined">remove</span>
        </button>
        <span className="arpeggio-popover__count-value">{noteCount}</span>
        <button className="pop-nav" onClick={() => apply(direction, Math.min(16, noteCount + 1))}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
      {activeMod ? (
        <button className="pop-toggle active" title="Désactiver l'arpège" onClick={() => PodModifierService.removeArpeggio(activeMod.id)}>
          <span className="material-symbols-outlined">link_off</span>
        </button>
      ) : (
        <button className="pop-toggle" title="Activer l'arpège" onClick={() => apply(direction, noteCount)}>
          <span className="material-symbols-outlined">link</span>
        </button>
      )}
    </div>
  )
}

// ── Rhythm-on-chord: per-string instrument assignment ────────────────────────
const TRACK_EMOJI: Record<string, string> = {
  kick: ':drum:', snare: ':clap:', hihat: ':bell:', ride: ':loud_sound:',
  clave: ':notes:', perc: ':drum:', bass: ':guitar:', chord: ':musical_note:',
}

export function trackEmoji(part: string): string {
  return TRACK_EMOJI[part] ?? (part === '__all__' ? ':notes:' : ':musical_note:')
}

export function InstrumentTrackDisc({ mod, noteId, size = 16 }: { mod: RhythmModifier, noteId: string, size?: number }) {
  const assigned = RhythmModifierService.getAssignedTrack(mod, noteId)
  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      onWheel={passWheel}
      onClick={e => { e.stopPropagation(); RhythmModifierService.cycleStringTrack(mod.id, noteId) }}
      title={assigned === '__all__' ? 'Toutes les pistes' : assigned}
      style={{ cursor: 'pointer' }}
    >
      <EmojiBox emojiStr={trackEmoji(assigned)} size={size} disc={{ bgColor: '#1a1a1a', borderColor: '#7c3aed' }} />
    </div>
  )
}

// ── Rhythm modifier: disc + popover (shared by the floating note/progression pod
// and the chord pod's embedded "rhythm imposed on this chord" disc) ──────────────
function RhythmPopoverBody({ mod, pattern, onUpdate }: {
  mod: RhythmModifier
  pattern: RhythmPatternDef | undefined
  onUpdate: (patch: Partial<RhythmModifier>) => void
}) {
  const [instrVisible, setInstrVisible] = useState(false)
  return (
    <>
      <button className={`pop-toggle${mod.mode === 'proportional' ? ' active' : ''}`} onClick={() => onUpdate({ mode: 'proportional' })} title="Proportionnel">
        <span className="material-symbols-outlined">compress</span>
      </button>
      <button className={`pop-toggle${mod.mode === 'extended' ? ' active' : ''}`} onClick={() => onUpdate({ mode: 'extended' })} title="Étendu">
        <span className="material-symbols-outlined">open_in_full</span>
      </button>
      <button className={`pop-toggle${mod.fillGaps ? ' active' : ''}`} onClick={() => onUpdate({ fillGaps: !mod.fillGaps })} title="Combler les silences">
        <span className="material-symbols-outlined">density_small</span>
      </button>
      <button
        className={`pop-toggle${mod.legato ? ' active' : ''}`}
        onClick={() => {
          if (mod.legato) RhythmModifierService.dematerializeLegatoRhythm(mod.id)
          else RhythmModifierService.materializeLegatoRhythm(mod.id)
        }}
        title="Legato — matérialise les pods comme une chaîne legato"
      >
        <span className="material-symbols-outlined">linear_scale</span>
      </button>

      <div className="pop-divider" />

      <div style={{ position: 'relative' }}>
        <button className={`pop-toggle${instrVisible ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setInstrVisible(v => !v) }} title="Instruments">
          <span className="material-symbols-outlined">tune</span>
        </button>
        {instrVisible && (
          <div className="rhythm-instr-popover" onClick={e => e.stopPropagation()}>
            {pattern?.tracks.map(t => (
              <label key={t.part} className="rhythm-instr-popover__row">
                <input
                  type="checkbox"
                  checked={mod.activeTracks.includes(t.part)}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...mod.activeTracks, t.part]
                      : mod.activeTracks.filter((p: string) => p !== t.part)
                    onUpdate({ activeTracks: next })
                  }}
                />
                {t.part}
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Chord pod popover content: voicing cycle + octave transpose + arpeggio ───
export function ChordPopoverButtons({ group }: { group: ChordGroup }) {
  const [arpVisible, setArpVisible] = useState(false)
  const arpActive = !!PodModifierService.getArpeggioForChord(group.id)
  return (
    <>
      <button
        className="pop-toggle"
        onClick={e => { e.stopPropagation(); PodModifierService.cycleVoicing(group, 1) }}
        title="Chercher une autre façon de jouer cet accord"
      >
        <span className="material-symbols-outlined">search</span>
      </button>
      <button
        className="pop-toggle"
        onClick={e => { e.stopPropagation(); PodModifierService.transposeOctave(group, -1) }}
        title="Octave en dessous"
      >
        <span className="material-symbols-outlined">keyboard_double_arrow_down</span>
      </button>
      <button
        className="pop-toggle"
        onClick={e => { e.stopPropagation(); PodModifierService.transposeOctave(group, 1) }}
        title="Octave au-dessus"
      >
        <span className="material-symbols-outlined">keyboard_double_arrow_up</span>
      </button>
      <div style={{ position: 'relative' }}>
        <button
          className={`pop-toggle${arpVisible || arpActive ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); setArpVisible(v => !v) }}
          title="Arpège verrouillé"
        >
          <span className="material-symbols-outlined">linear_scale</span>
        </button>
        {arpVisible && <ArpeggioPanel group={group} />}
      </div>
    </>
  )
}

// ── Mode pod popover content: force-note toggle + color picker ───────────────
export function ModePopoverButtons({ zone }: { zone: ModeZone }) {
  return (
    <>
      <button
        className={`pop-toggle${zone.forceNote ? ' active' : ''}`}
        onClick={e => {
          e.stopPropagation()
          useTablatureR3FStore.getState().pushHistory()
          useTablatureR3FStore.getState().updateModeZone(zone.id, { forceNote: !zone.forceNote })
        }}
        title="Forcer les notes de la zone vers la gamme du mode — non-destructif"
      >
        <span className="material-symbols-outlined">sync_alt</span>
      </button>
      <label className="pop-toggle" style={{ position: 'relative', cursor: 'pointer' }} title="Couleur de la zone">
        <span className="material-symbols-outlined" style={{ color: zone.color }}>palette</span>
        <input
          type="color"
          value={zone.color}
          onChange={e => useTablatureR3FStore.getState().updateModeZone(zone.id, { color: e.target.value })}
          onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </label>
    </>
  )
}

export function RhythmModifierDisc({ mod, onUpdate, onRemove, size = 26, glow }: {
  mod: RhythmModifier
  onUpdate: (patch: Partial<RhythmModifier>) => void
  onRemove: () => void
  size?: number
  glow?: boolean
}) {
  const pattern = rhythmPatterns.find(p => p.name === mod.patternName)
  const borderCol = glow ? '#a855f7' : '#7c3aed'
  const emojiStr = pattern?.emoji ?? ':musical_note:'

  return (
    <PodModifierDisc
      emojiStr={emojiStr}
      size={size}
      discBg="#1a0033"
      borderCol={borderCol}
      glow={glow}
      title={mod.patternName}
      popoverContent={close => (
        <PodModifierPopover
          nav={{
            label: mod.patternName,
            prev: () => {
              const idx = rhythmPatterns.findIndex(p => p.name === mod.patternName)
              const prev = rhythmPatterns[(idx - 1 + rhythmPatterns.length) % rhythmPatterns.length]
              onUpdate({ patternName: prev.name, activeTracks: prev.tracks.map(t => t.part) })
            },
            next: () => {
              const idx = rhythmPatterns.findIndex(p => p.name === mod.patternName)
              const next = rhythmPatterns[(idx + 1) % rhythmPatterns.length]
              onUpdate({ patternName: next.name, activeTracks: next.tracks.map(t => t.part) })
            },
          }}
          emojiStr={emojiStr}
          onRemove={onRemove}
          onClose={close}
          className="rhythm-popover"
        >
          <RhythmPopoverBody mod={mod} pattern={pattern} onUpdate={onUpdate} />
        </PodModifierPopover>
      )}
    />
  )
}
