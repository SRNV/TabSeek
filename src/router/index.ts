// src/router/index.ts
import NotesSideBar from '../components/sidebars/NotesSideBar.vue'
import ChordsTabsDisplay from '../components/chords/ChordsTabsDisplay.vue'
import ScaleContainer from '../components/ScaleContainer.vue'
import { createRouter, createWebHistory } from 'vue-router'
import ModesSideBar from '../components/sidebars/ModesSideBar.vue'
import ChordPopUp from '../components/chords/ChordPopUp.vue'
import ChordsDetailsSideBar from '../components/sidebars/ChordsDetailsSideBar.vue'
import ModeChordRecommendations from '../components/modes/ModeChordRecommendations.vue'
import ChordModeRecommendations from '../components/chords/ChordModeRecommendations.vue'
import ProgressionCompiler from '../components/progression/ProgressionCompiler.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/',
      name: 'Tablature selon le Mode',
      components: {
        default: ScaleContainer,
        side1: NotesSideBar,
        side2: ModesSideBar,
        side3: ChordsDetailsSideBar,
      }
    },
    {
      path: '/chords',
      name: 'Description des Accords',
      components: {
        default: ChordsTabsDisplay,
        side1: NotesSideBar,
        side2: ChordsDetailsSideBar,
        details1: ChordModeRecommendations,
        details2: ModeChordRecommendations,
      }
    },
    {
      path: '/progressions',
      name: 'Compilation de progressions connues',
      components: {
        default: ProgressionCompiler,
        side1: NotesSideBar,
        side2: ModesSideBar,
      }
    },
  ],
})

export default router
