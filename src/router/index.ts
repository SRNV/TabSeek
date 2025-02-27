// src/router/index.ts
import ChordsTabsDisplay from '../components/ChordsTabsDisplay.vue'
import ScaleContainer from '../components/ScaleContainer.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ScaleContainer },
    { path: '/chords', component: ChordsTabsDisplay },
  ],
})

export default router
