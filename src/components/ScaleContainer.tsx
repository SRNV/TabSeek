import React from 'react'
import './ScaleContainer.scss'
import ModeDisplay from './modes/ModeDisplay'
import CurrentModeDisplay from './modes/CurrentModeDisplay'

export default function ScaleContainer() {
  return (
    <div className="scale">
      <ModeDisplay />
      <CurrentModeDisplay />
    </div>
  )
}
