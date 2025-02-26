// main.ts
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
// Écoute de l'EventBus pour récupérer la note sélectionnée
import eventBus from './eventBus.ts';
import { useMainStore } from './stores';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

const store = useMainStore();
eventBus.on('noteSelected', (midi: number) => {
    console.log(midi)
  store.setSelectedMidi(midi);
});
