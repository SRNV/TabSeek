import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ScaleContainer from '../components/ScaleContainer'
import ChordsTabsDisplay from '../components/chords/ChordsTabsDisplay'
import ProgressionCompiler from '../components/progression/ProgressionCompiler'
import TablaturePage from '../components/tablature/TablaturePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ScaleContainer />} />
      <Route path="/chords" element={<ChordsTabsDisplay />} />
      <Route path="/progressions" element={<ProgressionCompiler />} />
      <Route path="/tablature" element={<TablaturePage />} />
    </Routes>
  )
}
