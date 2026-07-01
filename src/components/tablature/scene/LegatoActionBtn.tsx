/**
 * @file LegatoActionBtn.tsx
 * Small icon button used inside the legato behavior and render popovers.
 */
import React from 'react'
import { ColorService } from '../../../services/ColorService'

/**
 * Icon button whose background is the given `color` and whose icon ink is
 * auto-contrasted (white or black) via `ColorService.getContrastColor`.
 */
export function LegatoActionBtn({ color, icon, onClick }: {
  color: string
  icon: string
  onClick: () => void
}) {
  const ink = ColorService.getContrastColor(color)
  return (
    <button
      type="button"
      className="legato-action-btn"
      style={{ backgroundColor: color }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <span className="material-symbols-outlined" style={{ color: ink }}>{icon}</span>
    </button>
  )
}
