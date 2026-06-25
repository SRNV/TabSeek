import { createRouter, createWebHistory } from 'vue-router'
import ScaleContainer from '../components/ScaleContainer.vue'
import ChordsTabsDisplay from '../components/chords/ChordsTabsDisplay.vue'
import ProgressionCompiler from '../components/progression/ProgressionCompiler.vue'
import TablaturePage from '../components/tablature/TablaturePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',             name: 'Tablature selon le Mode',  component: ScaleContainer },
    { path: '/chords',       name: 'Description des Accords',  component: ChordsTabsDisplay },
    { path: '/progressions', name: 'Progressions',             component: ProgressionCompiler },
    { path: '/tablature',    name: 'Tablature',                component: TablaturePage },
  ],
})

export default router
