# TabSeek — Documentation interne & règles de développement

> Fichier de référence vivant : il réunit l'architecture, les règles UI/UX, le flux de données, les commentaires importants trouvés dans le code et les points à nettoyer.

---

## 1. Identité du projet

- **Nom affiché** : TabSeek (nom de code package.json : `guitarnote`)
- **Stack** : React 18 + TypeScript, Vite 6, Zustand, React Router v6, SCSS, Tonal.js
- **PWA** : `vite-plugin-pwa` avec `registerType: 'autoUpdate'`
  - Icônes PWA manquantes : `public/icon-192.png` et `public/icon-512.png`
- **Migration** : Vue 3 + Pinia → React 18 + Zustand (juin 2025)

---

## 2. Lancer le projet

```bash
npm install
npm run dev      # serveur Vite HMR → http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview  # prévisualise le build prod
npm run lint     # ESLint --fix
npm run format   # Prettier src/
```

---

## 3. Docker

| Fichier | Rôle |
|---|---|
| `Dockerfile` | Multi-stage : `deps` → `builder` → `nginx:alpine` (~25 MB final) |
| `nginx.conf` | SPA fallback, gzip, cache 1 an assets hashés, **`no-store` sur `sw.js`** |
| `docker-compose.yml` | Production, port 80 |
| `docker-compose.dev.yml` | Dev HMR, port 5173 |

```bash
docker compose up --build
docker compose -f docker-compose.dev.yml up
```

---

## 4. Architecture du layout — RÈGLES ABSOLUES

### 4.1 Structure de la grille (App.tsx)

```
┌─────────────┬──────────────┬────────────────────────────────┐
│  NavSidebar │ ConfigSidebar│         Contenu principal      │
│  52–188 px  │    52 px     │              1fr               │
│  z-index    │  z-index     │                                │
│    1000      │    1000      │                                │
└─────────────┴──────────────┴────────────────────────────────┘
```

```scss
grid-template-areas: "nav config main";
grid-template-columns: auto auto 1fr;
grid-template-rows: 100vh;
height: 100vh;
overflow: hidden;
```

> **⚠️ Ne jamais oublier `grid-template-rows: 100vh`** — sans lui, la row se réduit à 0 px.

### 4.2 NavSidebar (`src/components/NavSidebar.tsx`)

- **Rôle** : navigation entre routes uniquement
- **Largeur** : 52 px (collapsé) ↔ 188 px (étendu), transition `0.22s ease`
- **Active state** : fond orange `#e57c00`
- **Extensible** : oui, via bouton toggle (chevron)
- **z-index** : 1000 avec `position: relative`
- **Props React** : `expanded: boolean` + `onExpandedChange: (v: boolean) => void`

### 4.3 ConfigSidebar (`src/components/ConfigSidebar.tsx`)

- **Rôle** : boutons de panneaux de configuration (Fondamentale, Modes, Accords)
- **Largeur** : 52 px fixe, **jamais extensible**
- **Active state** : teal `rgba(56,178,172,0.15)` + barre gauche `#38b2ac`
- **Boutons affichés** : uniquement ceux disponibles pour la route courante
- **z-index** : 1000 avec `position: relative`

### 4.4 Panneaux de configuration — RÈGLE UNIVERSELLE

> **Toute configuration s'ouvre en popover. Aucune colonne ne s'ajoute au layout.**

- `position: fixed`, glisse depuis la gauche (`translateX(-100%) → 0`)
- Taille déterminée par le contenu (`min-width: 160px`, `max-width: 400px`)
- `left` = largeur NavSidebar + ConfigSidebar :
  - NavSidebar collapsée : `52 + 52 = 104px`
  - NavSidebar étendue : `188 + 52 = 240px`
- **z-index** : 500 (sous les sidebars à 1000)

### 4.5 Backdrop

- `position: fixed`, transparent, z-index 499
- **Démarre après les deux sidebars** (`left: 104px` ou `240px`)
- Clic → ferme le popover
- Échap → ferme le popover (keydown sur `.app`)

---

## 5. Routing (React Router v6)

```
/              → ScaleContainer       panneaux: notes, modes, chords
/chords        → ChordsTabsDisplay    panneaux: notes, chords
/progressions  → ProgressionCompiler  panneaux: notes, modes
/tablature     → TablaturePage        panneaux: notes, modes, chords
```

**Fichier** : `src/router/index.tsx` — `createBrowserRouter([...])`

---

## 6. Gestion d'état (Zustand)

### 6.1 Store principal (`src/stores/useMainStore.ts`)

```ts
// Importation : import { useMainStore } from '../stores/useMainStore'
// Utilisation : const store = useMainStore()
// Ou sélecteur : const scale = useMainStore(s => s.userScale)
// Hors composant : useMainStore.getState().setSelectedMidi(midi)

state: {
  userScale: 'C4',          // note fondamentale de la gamme
  selectedMidi: null,        // note MIDI sélectionnée
  selectedMode: 'ionian',    // nom du mode courant
  modeObject: defaultMode,   // objet ModeGuitar complet
  chordRootNote: 'C4',      // fondamentale pour les accords
  chordRootObject: null,     // ChordsCompleteDef | null
  chordRootNoteType: 'major'
}

// Computed (fonctions dans le store, pas des getters Zustand) :
modeNotes()   // intervals.map(i => Note.transpose(userScale, i))
modeTriad()
modeSeventh()
```

> **Page `/chords` : charge A Majeur par défaut** dans `ChordsTabsDisplay` si `chordRootObject === null`.

### 6.2 Store tablature (`src/stores/useTablatureStore.ts`)

```ts
// Rhythm subdivision values: 0=none, 1=whole, 2=half, 4=quarter,
// 8=eighth, 16=16th, 32=32nd, 64=64th
// BEAM_COUNTS: { 8: 1, 16: 2, 32: 3, 64: 4 }

state: {
  measures: TabMeasure[],
  columns: 32,              // 8 * 4 colonnes par mesure
  tuning: 'E2,A2,D3,G3,C3,E4',
  tempo: 120,
  filterByScaleEnabled: true,
  currentPlayingColumn: -1,  // -1 = pas de lecture
}
// Les getters "flat*" convertissent colonne globale → (mesure, col locale)
```

> **Tuning non-standard** : `G3` avant `C3` — à vérifier si intentionnel.

### 6.3 Store UI (`src/composables/useUIState.ts`)

```ts
// Zustand store — singleton partagé entre tous les composants
import { useUIStore } from '../composables/useUIState'

const { activePanel, togglePanel, closePanel } = useUIStore()
// ou
const activePanel = useUIStore(s => s.activePanel)

// Quand la route change → closePanelIfUnavailable(pathname)
```

### 6.4 EventBus (`src/eventBus.ts`)

```ts
// mitt — framework agnostic, fonctionne identiquement en Vue et React
Events: {
  noteSelected: number,     // MIDI → main.tsx → store.setSelectedMidi()
  notePlayed: number,
  midiSelected: number[],
  showTooltip: { title, content, x, y },
  hideTooltip: void,
  playProgression: any,
  progressionDragStart: any,
}
```

---

## 7. Composables → Hooks React

Les composables Vue ont été conservés comme hooks purs TypeScript (pas de Vue reactivity).

| Fichier | Rôle |
|---|---|
| `useAudio.ts` | Web Audio API — `playNote(note, duration, type, onEnd)` |
| `useGuitarNotes.ts` | Calculs de notes sur le manche |
| `useGuitarChords.ts` | Formes d'accords sur le manche |
| `useNoteHelpers.ts` | `getNoteColor()`, `getNoteDegreeLabel()` |
| `useMidiUtils.ts` | `notesToMidi()` |
| `chord-charts.ts` | Rendu SVG des diagrammes d'accord |
| `useUIState.ts` | Store Zustand pour activePanel |

---

## 8. Données statiques (fichiers lourds)

| Fichier | Lignes | Contenu |
|---|---|---|
| `tonalChordsMapping.ts` | ~1430 | `CHORD_TYPES_BY_CATEGORY` avec descriptions |
| `extraModes.ts` | ~963 | `EXTRA_MODES: ModeGuitar[]` — 40+ modes |
| `progressions.ts` | ~956 | `chordProgressions[]` — 100+ progressions |
| `chords.ts` | ~896 | `CHORDS` (positions de frettes) + interfaces |

---

## 9. Styles globaux — RÈGLES

### 9.1 Scrollbar
```css
/* Défini UNE SEULE FOIS dans src/assets/base.css */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
```
> **Ne jamais redéfinir les scrollbar styles dans les composants.**

### 9.2 SCSS par composant
Chaque composant a son propre fichier `.scss` importé directement :
```tsx
import './ComponentName.scss'  // pas de CSS modules
```

### 9.3 Body / HTML
```css
html, body { height: 100%; overflow: hidden; }
```

---

## 10. Correspondances Vue → React

| Vue | React |
|---|---|
| `ref(x)` | `useState(x)` |
| `computed(() => x)` | `useMemo(() => x, [deps])` |
| `watch(src, cb)` | `useEffect(() => { cb() }, [deps])` |
| `onMounted(cb)` | `useEffect(cb, [])` |
| `onBeforeUnmount` | cleanup dans `useEffect` |
| `v-if="cond"` | `{cond && <JSX>}` |
| `v-for="item in list"` | `{list.map(item => <JSX key={...}/>)}` |
| `v-model="x"` | `value={x} onChange={e => setX(e.target.value)}` |
| `@click="fn"` | `onClick={fn}` |
| `:class="{ a: b }"` | `className={b ? 'a' : ''}` |
| `defineModel` | `props.value + props.onChange` |
| `useRoute().path` | `useLocation().pathname` |
| `<RouterLink to="/">` | `<Link to="/">` |
| Pinia store | Zustand store |
| `<Transition>` | CSS classes conditionnelles |

---

## 11. Composants à refactoriser (dette technique)

| Composant | Lignes | Problème |
|---|---|---|
| `TabContent.tsx` | ~600 | Trois zones (rythme, cordes, index) dans un fichier. Candidat : `RhythmRow`, `StringRow`, `IndexRow` |
| `ProgressionCompiler.tsx` | ~240 | Logique playback mélangée avec UI de compilation |
| `TabPlayback.tsx` | ~196 | Logique audio à extraire vers `useTabPlayback` hook |
| `ChordTab.tsx` | ~153 | SVG + sélection + calcul mélangés |

---

## 12. Console.log à supprimer

| Fichier | Contenu |
|---|---|
| `src/main.tsx` | `console.log(midi)` dans le listener noteSelected |
| `src/components/chords/ChordTab.tsx` | `console.log(store.chordRootObject?.intervals)` |
| `src/components/tab/TabSVGOverlay.tsx` | `console.log(i)` |
| `src/components/sidebars/ChordsDetailsSideBar.tsx` | `console.log(store)` |

---

## 13. Types principaux (`src/types.ts`)

```ts
interface ModeGuitar {
  name: string        // ex: "dorian"
  aliases: string[]
  modeNum: number
  mode: number
  intervals: string[] // ex: ["1P", "2M", "3m", "4P", "5P", "6M", "7m"]
  alt: string[]
  triad: string       // "major" | "minor" | "diminished" | "augmented"
  seventh: string
  description?: string
  culture?: string
  category: string
}
```

---

## 14. Hiérarchie z-index

| Élément | z-index | Position |
|---|---|---|
| NavSidebar | **1000** | `relative` |
| ConfigSidebar | **1000** | `relative` |
| Popover config | 500 | `fixed` |
| Backdrop popover | 499 | `fixed` |
| Reste du contenu | auto | — |

---

## 15. Chantier WebGL (prévu — pas encore implémenté)

Le composant `Tab.tsx` (manche de guitare) est le candidat pour une migration WebGL :

**Solution recommandée** : **Three.js vanilla** dans un hook `useFretboard3D.ts`
- Caméra orthographique (pas de distorsion)
- `InstancedMesh` pour les cases (6 × N frettes ≈ 150 instances)
- `InstancedMesh` pour les cordes (6 instances)
- `InstancedMesh` pour les barres de frette (N+1 instances)
- `CSS2DRenderer` pour les labels (note name, degré)
- Raycaster pour les clics → `playNote()` + `eventBus`
- `setColorAt(i, color)` + `instanceColor.needsUpdate = true` pour sync avec le store

```bash
npm install three
npm install -D @types/three
```
