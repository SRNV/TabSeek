# TabSeek — Documentation interne & règles de développement

> Fichier de référence vivant : il réunion l'architecture, les règles UI/UX, le flux de données, les commentaires importants trouvés dans le code et les points à nettoyer.

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
| `Dockerfile` | Multi-stage : `deps` → `builder` | `nginx:alpine` (~25 MB final) |
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
- **Icônes** : Utiliser `material-symbols-outlined`.

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
state: {
  userScale: 'C4',
  selectedMidi: null,
  selectedMode: 'ionian',
  modeObject: defaultMode,
  chordRootNote: 'C4',
  chordRootObject: null,
  chordRootNoteType: 'major',
  fretboardHighlights: [] // [{ si, fret, color? }]
}
```

### 6.2 Store tablature (`src/stores/useTablatureStore.ts`)
Store pour la vue grille standard (non-R3F).

### 6.3 Store Tablature R3F (`src/stores/useTablatureR3FStore.ts`)
Gère l'état du Piano Roll (notes, chords, progressions, legato, playback).

---

## 7. Composables & Services

| Fichier | Rôle |
|---|---|
| `useAudio.ts` | Web Audio API — `playNote`, `playFullChord`, `stopAllSounds` |
| `useGuitarNotes.ts` | Calculs de notes sur le manche |
| `useNoteHelpers.ts` | `getNoteColor()`, `getNoteDegreeLabel()` |
| `TablatureDropService.ts`| Logique métier pour le Drag & Drop d'accords/progressions |
| `TablatureMoveService.ts`| Logique métier pour le déplacement/redimensionnement (collisions incluses) |
| `FretboardHighlightService.ts`| Gestion centralisée des highlights sur le manche |

---

## 8. UI Iconography — RÈGLE ABSOLUE

> **Toutes les icônes de l'application doivent utiliser Google Material Symbols.**

- **HTML** : `<span className="material-symbols-outlined">icon_name</span>`
- **SCSS** : `@import` dans `index.html`, stylisé via `.material-symbols-outlined`
- **Z-index** : Faire attention aux conflits entre `Html` de `@react-three/drei` et le canvas. Utiliser `zIndexRange`.

---

## 9. Fretboard WebGL — R3F (`Tab.tsx`)

- Composant `Tab.tsx` pour visualiser les gammes/accords sur un manche.
- Utilise `InstancedMesh` pour les performances.
- Pop-over interactif pour changer d'accord.

---

## 10. Tablature R3F (Piano Roll) — Implémenté Juin 2026

`TablatureR3F.tsx` est un éditeur de style piano roll pour guitare.

### 10.1 Hiérarchie des Pods & Profondeur
La profondeur est gérée par `renderOrder` et la position Z pour éviter le z-fighting.

| Élément | renderOrder | Position Z |
|---|---|---|
| Grille (Beats/Measures) | 1 | -0.04 |
| Progression Pods (Contour bleu, fond gris) | 2–3 | -0.035 |
| Chord Pods (Contour vert, fond gris foncé) | 4–5 | -0.03 |
| Legato Lines (Shader animé, contour orange) | 6 | -0.02 |
| Note Pods (Couleur dynamique) | 8–9 | 0.0 |
| Labels Html (Fret, Note Name) | auto | 0.02 |

### 10.2 Anatomie d'un Note Pod
Un pod de note est divisé en zones interactives (`noteZone`) :
`[ Resize L | Bubble Prev | Fret Label | Note Name | Move | Bubble Next | Resize R ]`

- **Intermediate Notes** : Les notes générées par un legato sont 50% plus sombres, 30% désaturées et n'ont pas de bulles de legato.

### 10.3 Legato Engine
- **Création** : Drag depuis une bulle (Next/Prev) vers une autre note.
- **Behaviors** : `chromatique`, `secondes`, `tierces`, `quartes`, `quintes`, `sixtes`, `septiemes`, `octaves`, `gamme`, `pentatonique`, `triade`, `arp7`, `blues`, `whole-tone` (par tons), `diminished` (diminué), `free`.
- **Sync Modes** : 
  - **Auto** (activé par défaut) : Recalcule tout le segment quand la source ou destination bouge.
  - **Chain** : Recalcule uniquement les notes *suivantes* dans le segment quand on déplace une note intermédiaire.
- **Interaction** : 
  - Bulle de comportement avec **pulse animation** (scale 1.2) et hit area agrandie (32px).
  - Pop-over avec icônes Material Symbols pour choisir le comportement et activer les modes Auto/Chain.
  - **DblClick** sur un pod intermédiaire : Divise le pod en deux (ajoute une note).
  - **Suppression** : Supprimer une source/destination supprime tout le legato. Supprimer le dernier pod intermédiaire casse le lien legato.
- **Algorithme d'interpolation** : Respecte strictement la gamme (`scaleNotes`) et l'intervalle de pitch entre [source, destination]. Les notes sont uniformément réparties en durée sur l'espace disponible.
- **Ergonomie** : L'algorithme privilégie les cordes adjacentes et un span de frettes restreint (max 4-6) pour assurer la jouabilité.

---

## 11. Workflow de Drag & Drop (Accords / Progressions)

Le service `TablatureDropService.ts` gère l'intelligence musicale lors du dépôt d'éléments sur la tablature.

### 11.1 Restrictions
- **Interdit** de déposer sur un pod appartenant déjà à un accord (`ChordGroup`).
- **Interdit** de déposer sur un pod faisant partie d'une chaîne legato (source, destination ou intermédiaire).

### 11.2 Comportement non-destructif ("Shift")
Lorsqu'un accord est déposé sur une note simple :
1. La note cible devient l'**ancre** (fondamentale) de l'accord.
2. La durée de l'accord s'adapte à celle du pod d'ancrage.
3. Toutes les notes présentes sur les mêmes beats que le nouvel accord sont **décalées vers l'avant** (leur `startBeat` augmente de la durée totale de la progression) au lieu d'être supprimées.

---

## 12. Playback & Highlighting

### 12.1 Playback Audio
- **Playback Indicator** : Barre verticale verte (`APPLE_GREEN`) avec flèche. Draggable pour changer la position.
- **Auto-Reset** : Si `isLooping` est faux, la lecture revient à 0 à la fin du morceau.
- **Audio** : Utilise `playFullChord` et `playNote`. `stopAllSounds()` est appelé au Stop ou pause.

### 12.2 Fretboard Highlight (`FretboardHighlightService.ts`)
Le manche (`Tab.tsx`) réagit dynamiquement aux événements de la tablature :
- **Lecture** : Seules les notes **activement jouées** (selon le curseur de lecture) sont mises en avant sur le manche. Les autres notes de la gamme sont grisées.
- **Hover** : Survoler une note ou un label d'accord dans la tablature met en surbrillance instantanément les positions correspondantes sur le manche.
- **Priorité** : Dès qu'un highlight spécifique est actif, l'affichage par défaut de la gamme est masqué pour éviter toute confusion visuelle.

---

## 13. Hiérarchie z-index Globale

| Élément | z-index | Position |
|---|---|---|
| NavSidebar | **1000** | `relative` |
| ConfigSidebar | **1000** | `relative` |
| Playback Footer | 100 | — |
| Html Overlays (R3F) | 10–100 | `Html` `zIndexRange` |
| Popover config | 500 | `fixed` |
| Backdrop popover | 499 | `fixed` |
