# TabSeek — Documentation interne & règles de développement

> Fichier de référence vivant : il réunit l'architecture, les règles UI/UX, le flux de données, les commentaires importants trouvés dans le code et les points à nettoyer.

---

## 1. Identité du projet

- **Nom affiché** : TabSeek (ancien nom de code dans le package.json : `guitarnote`)
- **Stack** : Vue 3 (Composition API + `<script setup>`), Vite 6, TypeScript, Pinia, SCSS, Tonal.js
- **PWA** : `vite-plugin-pwa` avec `registerType: 'autoUpdate'`
  - Nom PWA actuel : `"Ma Super App Tonal"` — **placeholder à remplacer**
  - Icônes PWA manquantes : `public/icon-192.png` et `public/icon-512.png`
- **Tests** : Vitest (unitaires) + Cypress (e2e)
- **Linting** : ESLint + Prettier

---

## 2. Lancer le projet

```bash
npm install
npm run dev          # serveur Vite HMR → http://localhost:5173

npm run build        # build prod (typecheck inclus)
npm run preview      # prévisualise le build prod
npm run test:unit    # Vitest
npm run test:e2e:dev # Cypress (ouvre l'UI)
npm run lint         # ESLint --fix
npm run format       # Prettier src/
```

---

## 3. Docker

Trois fichiers ajoutés à la racine :

| Fichier | Rôle |
|---|---|
| `Dockerfile` | Multi-stage : `deps` → `builder` → `nginx:alpine` (~25 MB final) |
| `nginx.conf` | SPA fallback (`try_files → index.html`), gzip, cache 1 an assets hashés, **`no-store` sur `sw.js`** (obligatoire PWA) |
| `docker-compose.yml` | Production, port 80 |
| `docker-compose.dev.yml` | Dev HMR, port 5173, volume mount + `--host` |

```bash
docker compose up --build                    # prod
docker compose -f docker-compose.dev.yml up  # dev
```

---

## 4. Architecture du layout — RÈGLES ABSOLUES

### 4.1 Structure de la grille (App.vue)

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

> **⚠️ Ne jamais oublier `grid-template-rows: 100vh`** — sans lui, la row se réduit à la hauteur du contenu (0 px si le composant n'a pas de hauteur propre).

### 4.2 NavSidebar (`src/components/NavSidebar.vue`)

- **Rôle** : navigation entre routes uniquement
- **Largeur** : 52 px (collapsé) ↔ 188 px (étendu), transition `0.22s ease`
- **Active state** : fond orange `#e57c00`
- **Extensible** : oui, via bouton toggle (chevron)
- **z-index** : 1000 avec `position: relative`

### 4.3 ConfigSidebar (`src/components/ConfigSidebar.vue`)

- **Rôle** : boutons de panneaux de configuration (Fondamentale, Modes, Accords)
- **Largeur** : 52 px fixe, **jamais extensible**
- **Active state** : teal `rgba(56,178,172,0.15)` + barre gauche `#38b2ac`
- **Boutons affichés** : uniquement ceux disponibles pour la route courante (`routePanels` dans `useUIState.ts`)
- **z-index** : 1000 avec `position: relative`

### 4.4 Panneaux de configuration — RÈGLE UNIVERSELLE

> **Toute configuration s'ouvre en popover. Aucune colonne supplémentaire ne s'ajoute au layout.**

- `position: fixed`, glisse depuis la gauche (`translateX(-100%) → 0`)
- Taille déterminée par le contenu (`min-width: 160px`, `max-width: 400px`)
- `left` = largeur NavSidebar + largeur ConfigSidebar :
  - NavSidebar collapsée : `52 + 52 = 104px`
  - NavSidebar étendue : `188 + 52 = 240px`
- `transition: left 0.22s ease` — suit l'animation de la NavSidebar
- **z-index** : 500 (sous les sidebars à 1000)

### 4.5 Backdrop (fermeture du popover)

- `position: fixed`, transparent, z-index 499
- **Démarre après les deux sidebars** (`left: 104px` ou `240px`)
  → les boutons de la ConfigSidebar restent cliquables sans double-clic
- Clic → `activePanel = null`
- Échap → `activePanel = null` (keydown capturé sur `.app`)

---

## 5. Routing

```
/              → ScaleContainer       panneaux: notes, modes, chords
/chords        → ChordsTabsDisplay    panneaux: notes, chords
/progressions  → ProgressionCompiler  panneaux: notes, modes
/tablature     → TablaturePage        panneaux: notes, modes, chords
```

> **Plus de `side1` / `side2` / `side3`** dans le router. Chaque route n'a qu'un `component` par défaut. Les sidebars sont gérées globalement par `useUIState`.

---

## 6. Gestion d'état

### 6.1 Store principal (`src/stores/index.ts`)

```ts
// Commentaire dans le code : "Mise à jour du store pour inclure chordRootNote"
state: {
  userScale: 'C4',          // note fondamentale de la gamme
  selectedMidi: null,        // note MIDI sélectionnée (via GuitarNote ou piano)
  selectedMode: 'ionian',    // nom du mode courant
  modeObject: defaultMode,   // objet ModeGuitar complet du mode courant
  chordRootNote: 'C4',      // fondamentale pour les accords
  chordRootObject: null,     // ChordsCompleteDef sélectionné (null = rien affiché)
  chordRootNoteType: 'major' // identifiant du type d'accord
}

// Getter clé :
modeNotes // transpose userScale par chaque intervalle du modeObject → notes réelles de la gamme
```

> **Par défaut la page `/chords` charge A Majeur** via `onMounted` dans `ChordsTabsDisplay` si `chordRootObject === null`.

### 6.2 Store tablature (`src/stores/tablatureStore.ts`)

```ts
// Commentaire : "Rhythm subdivision values: 0=none(default), 1=whole, 2=half, 4=quarter,
//               8=eighth, 16=16th, 32=32nd, 64=64th"
// Commentaire : "Beam levels: how many beams for each subdivision"
// BEAM_COUNTS: { 8: 1, 16: 2, 32: 3, 64: 4 }

state: {
  measures: TabMeasure[],       // tableau de mesures
  columns: 8 * 4,              // 32 colonnes par mesure
  tuning: 'E2,A2,D3,G3,C3,E4', // accordage (affiché inversé pour l'UI)
  tempo: 120,                   // BPM
  filterByScaleEnabled: true,   // masque les frettes hors gamme
  currentPlayingColumn: -1,     // -1 = pas de lecture
}

// TabMeasure = { data: string[][], modeOverrides: ColumnOverride[], indexPositions: number[], rhythmValues: number[] }
// Les getters "flat*" convertissent (mesure, colonne locale) → colonne globale
```

> **Tuning non-standard** : `G3` avant `C3` dans la chaîne — vérifier si intentionnel ou bug.

### 6.3 État UI (`src/composables/useUIState.ts`)

```ts
// Singleton module-level — partagé entre tous les composants
const activePanel = ref<PanelId | null>(null)  // 'notes' | 'modes' | 'chords' | null

// Quand la route change : ferme le panneau s'il n'est pas disponible sur la nouvelle route
closePanelIfUnavailable(routePath)
```

### 6.4 EventBus (`src/eventBus.ts`)

```ts
// Commentaire : "eventBus.ts - Système d'événements amélioré"
// Utilise mitt<Events>
Events: {
  noteSelected: number,           // MIDI → main.ts → store.setSelectedMidi()
  notePlayed: number,             // émis par useAudio après playNote()
  midiSelected: number[],
  showTooltip: { title, content, x, y },
  hideTooltip: void,
  playProgression: any,
  progressionDragStart: any,
}
```

---

## 7. Composables clés

| Fichier | Rôle | Commentaire dans le code |
|---|---|---|
| `useAudio.ts` | Web Audio API — `playNote(note, duration, type, onEnd)` | "mis à jour" ; fréquence = `440 * 2^((midi-69)/12)` |
| `useGuitarNotes.ts` | Calculs de notes sur le manche | — |
| `useGuitarChords.ts` | Formes d'accords sur le manche | — |
| `useNoteHelpers.ts` | `getNoteColor()`, `getNoteDegreeLabel()` | — |
| `useMidiUtils.ts` | `notesToMidi()` | — |
| `chord-charts.ts` | Rendu SVG des diagrammes d'accord | — |
| `useUIState.ts` | État panneau actif, disponibilité par route | Singleton module-level |

---

## 8. Données statiques (fichiers lourds)

> Ces fichiers contiennent exclusivement des données. Ils n'ont pas de logique métier.

| Fichier | Lignes | Contenu |
|---|---|---|
| `tonalChordsMapping.ts` | ~1430 | `TONAL_CHORD_TYPES` (liste) + `CHORD_TYPES_BY_CATEGORY` (catégorisé avec descriptions) |
| `extraModes.ts` | ~963 | `EXTRA_MODES: ModeGuitar[]` — 40+ modes avec descriptions culturelles |
| `progressions.ts` | ~956 | `chordProgressions: ChordProgression[]` — 100+ progressions avec exemples |
| `chords.ts` | ~896 | `CHORDS` (positions de frettes) + interfaces `ChordTypeDef`, `ChordsCompleteDef` |

**Recommandation** : déplacer ces données vers `src/data/*.json` pour séparer données et logique.

---

## 9. Styles globaux — RÈGLES

### 9.1 Scrollbar
```css
/* Défini UNE SEULE FOIS dans src/assets/base.css */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #555; }
```
> **Ne jamais redéfinir les scrollbar styles dans les composants.**

### 9.2 Body / HTML
```css
/* src/assets/main.css */
html, body { height: 100%; overflow: hidden; }
```
> Le `display: flex; place-items: center` du template Vue par défaut a été **supprimé** — il centrait l'app verticalement.

---

## 10. Composants à refactoriser (dette technique)

| Composant | Lignes | Problème |
|---|---|---|
| `PartitionTab.vue` | 1052 | **Composant legacy** — Options API, `console.log` ligne 234, mélange playback + sélection + rendu + styles. À découper en composable `useTabPlayback` + sous-composants |
| `TabContent.vue` | 900 | Trois zones (rythme, cordes, index) dans un seul composant. Candidat : `RhythmRow.vue`, `StringRow.vue`, `IndexRow.vue` |
| `ProgressionCompiler.vue` | 363 | Logique de compilation mélangée avec UI de lecture |
| `TabPlayback.vue` | 355 | Gère l'état audio — logique à extraire vers `useAudio.ts` |
| `ChordTab.vue` | 332 | SVG + sélection + calcul de positions dans un seul composant |

---

## 11. Console.log à supprimer (production)

| Fichier | Ligne | Contenu |
|---|---|---|
| `main.ts` | 22 | `console.log(midi)` |
| `stores/index.ts` | — | via setSelectedMidi |
| `ChordTab.vue` | 109 | `console.log(store.chordRootObject?.intervals)` |
| `TabSVGOverlay.vue` | 47 | `console.log(i)` (intervalle) |
| `ChordsDetailsSideBar.vue` | 41 | `console.log(store)` |

---

## 12. Types principaux (`src/types.ts`)

```ts
interface ModeGuitar {
  name: string        // ex: "dorian"
  aliases: string[]   // ex: ["dor", "m"]
  modeNum: number     // index dans l'octave (0–6 pour les modes diatoniques)
  mode: number        // idem
  intervals: string[] // ex: ["1P", "2M", "3m", "4P", "5P", "6M", "7m"]
  alt: string[]       // altérations ex: ["b3", "b7"]
  triad: string       // "major" | "minor" | "diminished" | "augmented"
  seventh: string     // "maj7" | "min7" | "dom7" | etc.
  description?: string
  culture?: string    // ex: "Celtique & Jazz modal"
  category: string    // ex: "Modes Principaux"
}
```

---

## 13. Hiérarchie z-index

| Élément | z-index | Position |
|---|---|---|
| NavSidebar | **1000** | `relative` |
| ConfigSidebar | **1000** | `relative` |
| Popover config | 500 | `fixed` |
| Backdrop popover | 499 | `fixed` |
| Reste du contenu | auto | — |
