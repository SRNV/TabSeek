import './assets/main.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import eventBus from './eventBus'
import { useMainStore } from './stores/useMainStore'

eventBus.on('noteSelected', (midi: number) => {
  console.log(midi)
  useMainStore.getState().setSelectedMidi(midi)
})

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
