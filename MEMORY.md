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
  fretboardHighlights: [],      // [{ si, fret, color? }] — highlights classiques (hover/play)
  legatoFretHighlights: [],     // [{ si, fret }] — cellules à entourer (outline orange) pendant viz legato
  legatoActiveNoteIds: [],      // string[] — IDs des notes de la chaîne legato active (tablature)
}
```

> **Convention string index** : `si=0` = corde grave (low E) dans le store, `si=0` = corde aiguë (high e) dans l'affichage visuel de `Tab.tsx`. Conversion : `visualSi = (N_STRINGS - 1) - storeSi`.

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
| `TablatureDropService.ts` | Logique métier pour le Drag & Drop d'accords/progressions |
| `TablatureMoveService.ts` | Logique métier pour le déplacement/redimensionnement (collisions incluses) |
| `FretboardHighlightService.ts` | Highlights classiques sur le manche (hover/play hors legato) |
| `LegatoFretVisualizationService.ts` | Visualisation legato sur le manche : `.show(noteId, notes)` et `.clear()`. Alimente `legatoFretHighlights` ET `legatoActiveNoteIds` dans le store. |
| `RibbonLineService.ts` | **Service partagé** pour tous les line segments animés (shader traveling wave). Exporte : `createRibbonMaterial()`, `createRibbonGeometry(maxSegs)`, `fillRibbonGeoLinear(geo, waypoints, halfW, subdivisions, maxSegs)`, `buildRibbonGeoCatmullRom(chain, colors, halfW, subdivisions, z)`. |

---

## 8. UI Iconography — RÈGLE ABSOLUE

> **Toutes les icônes de l'application doivent utiliser Google Material Symbols.**

- **HTML** : `<span className="material-symbols-outlined">icon_name</span>`
- **SCSS** : `@import` dans `index.html`, stylisé via `.material-symbols-outlined`
- **Z-index** : Faire attention aux conflits entre `Html` de `@react-three/drei` et le canvas. Utiliser `zIndexRange`.

---

## 9. Fretboard WebGL — R3F (`Tab.tsx`)

- Composant `Tab.tsx` — manche de guitare WebGL, gammes/accords, `InstancedMesh`.
- Pop-over interactif pour changer d'accord.

### 9.1 Couleurs des cellules

Chaque cellule `CellData` a deux couleurs :
- `color` : couleur effective (peut être orange si `fretboardHighlights` est actif)
- `naturalColor` : couleur de degré calculée **indépendamment** de `fretboardHighlights` (utilisée pour la visualisation legato)

```ts
// Palette degrés (Tab.tsx) — identique à SCALE_COLORS dans TablatureR3F
DEGREE_COLORS = ['#FFF9B1','#77DD77','#AEC6CF','#CDB4DB','#FFB3B3','#FFD1B3','#FFFFFF']
```

### 9.2 Visualisation Legato sur le manche

Déclenchée par `LegatoFretVisualizationService.show()` (hover ou lecture).

| Élément | Description |
|---|---|
| Outlines orange | `InstancedMesh` (`legatoOutlineRef`) — contours sans fond sur chaque cellule de la chaîne |
| Line segment animé | Mesh ribbon (`legatoLineMeshRef`) avec shader traveling wave, couleurs = `naturalColor` de chaque cellule (dégradé) |
| Couleur des cellules | Reprend `naturalColorsRef[idx]` (couleurs de degré, pas orange) |

**Shader ribbon** (via `RibbonLineService`) : traveling wave pulse qui scale la largeur du ruban. `uInvStretchX = 1.0` pour le manche (isotrope). Largeur `CHORD_LINE_HALF_W = 0.08`.

### 9.3 Chord line (outline → line segment)

Même shader ribbon que le legato. Largeur `CHORD_LINE_HALF_W = 0.08`, segments pré-alloués `MAX_CHORD_SEGS = 120`.

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
| Viewport Rect Minimap (orange, layer 1) | — | 0.5 |
| Curseur Minimap (vert, layer 1) | — | 0.6 |

### 10.2 Anatomie d'un Note Pod
Un pod de note est divisé en zones interactives (`noteZone`) :
`[ Resize L | Bubble Prev | Fret Label | Note Name | Move | Bubble Next | Resize R ]`

- **Intermediate Notes** : Les notes générées par un legato sont 50% plus sombres, 30% désaturées et n'ont pas de bulles de legato.
- **Pendant la visualisation legato** : Les notes de la chaîne active (`legatoActiveNoteIds`) ne sont **pas** assombries — elles affichent leur couleur de degré pleine (`SCALE_COLORS[deg-1]`).

### 10.3 Line Segment Legato (Tablature)

Composant `LegatoLine` dans `TablatureR3F.tsx` :
- Geometry : `buildRibbonGeoCatmullRom(chain, colors, 0.12, subdivisions, -0.02)` — courbe CatmullRom, largeur `halfW = 0.12`
- Material : `createRibbonMaterial()` depuis `RibbonLineService` — `uInvStretchX` mis à jour chaque frame pour corriger la déformation horizontale du zoom
- Couleurs : `getNoteColor(n, true)` (skipDarken=true), dégradé source → destination

### 10.4 Legato Engine
- **Création** : Drag depuis une bulle (Next/Prev) vers une autre note.
- **Behaviors** : `chromatique`, `secondes`, `tierces`, `quartes`, `quintes`, `sixtes`, `septiemes`, `octaves`, `gamme`, `pentatonique`, `triade`, `arp7`, `blues`, `whole-tone` (par tons), `diminished` (diminué), `free`.
- **Sync Modes** : 
  - **Auto** (activé par défaut) : Recalcule tout le segment quand la source ou destination bouge.
  - **Chain** : Recalcule uniquement les notes *suivantes* dans le segment quand on déplace une note intermédiaire.
- **Interaction** : 
  - Deux **boutons arrondis** (`<button type="button" className="legato-action-btn">`, 28×28px, `border-radius: 7px`) apparaissent **au-dessus du pod source**, via `<Html>` drei.
  - **Positionnement Sticky** : Les boutons s'alignent sur la gauche du pod par défaut (`note.startBeat * BEAT_W`), mais restent visibles au bord gauche de la caméra si le pod est partiellement hors champ.
  - Bouton 1 : icône `merge` → `renderLegato(note.id)` — fige le legato en notes réelles.
  - Bouton 2 : icône du comportement courant → ouvre le pop-over de configuration.
  - **Interaction** : `e.stopPropagation()` sur le conteneur pour éviter les conflits avec R3F.
  - **Hover** : Scale 1.1 et box-shadow via CSS `:hover` (animation pulse supprimée).
  - **Pop-over** : Rendu conditionnel (`popoverVisible && ...`) pour ne pas intercepter les clics quand elle est masquée. Utilise des icônes Material Symbols pour choisir le comportement et activer les modes Auto/Chain.
  - **DblClick** sur un pod intermédiaire : Divise le pod en deux (ajoute une note).
  - **Suppression** : Supprimer une source/destination supprime tout le legato. Supprimer le dernier pod intermédiaire casse le lien legato.
- **Algorithme d'interpolation** : Respecte strictement la gamme (`scaleNotes`) et l'intervalle de pitch entre [source, destination]. Les notes sont uniformément réparties en durée sur l'espace disponible.
- **Ergonomie** : L'algorithme privilégie les cordes adjacentes et un span de frettes restreint (max 4-6) pour assurer la jouabilité.

### 10.5 Minimap

Bande de **56 px** en bas du canvas WebGL — vue d'ensemble du projet à échelle réduite, style VS Code.

**Architecture : multi-camera dans le même canvas WebGL**

- `useFrame(priority=1)` prend le contrôle du rendu (R3F skip son auto-render dès que `priority > 0`).
- Rendu en deux passes par frame :
  1. Caméra principale → canvas complet (`gl.setScissorTest(false)` → `gl.render(scene, mainCam)`)
  2. `minimapCam` → bande basse 56 px (`gl.setViewport(0,0,w,56)` + scissor + clear + render)
- `gl.autoClear = false` obligatoire pour les deux passes ; remis à `true` en fin de frame.

**`minimapCam` (OrthographicCamera)**

- `cam.layers.enable(1)` → voit layer 0 (toute la scène) + layer 1 (éléments minimap-only).
- Frustum mis à jour chaque frame pour couvrir tout le contenu utilisé (`dispMeas = max(usedMeas+8, viewRight+4, 20)`).
- `position.x = totalWorldW / 2`, `left = -totalWorldW/2`, `right = +totalWorldW/2`.

**Éléments layer 1 (invisibles à la caméra principale)**

| Élément | Description |
|---|---|
| `<lineLoop ref={viewportRectRef}>` | Rectangle orange (`#FF9500`) montrant ce que voit la caméra principale |
| `<mesh ref={minimapCursorRef}>` | Curseur de lecture vert (`APPLE_GREEN`), 1.5 WU de large, mis à jour via `useTablatureR3FStore.getState().playbackBeat` |

Les deux objets ont leur layer mis à 1 via `useEffect(() => { ref.current.layers.set(1) }, [])`.

**Drag & curseur dans la minimap**

- `useEffect` sur `gl.domElement` avec listeners en phase **capture** (`{ capture: true }`).
- Détecte si `clientY > rect.height - 56` → événement dans la minimap.
- Convertit `clientX` en `worldX` via les bounds du `minimapCam` : `worldX = frac * (cam.position.x + cam.right)`.
- Écrit dans `minimapTargetXRef` (ref partagée) → appliqué à `o.position.x` dans le `useFrame priority=1`.
- Curseur géré directement sur `canvas.style.cursor` :

| Situation | Curseur |
|---|---|
| Survol de la bande minimap | `pointer` |
| Drag en cours | `grabbing` |
| Relâché / `pointerleave` | `default` |

**Règles CSS importantes**

> ⚠️ Ne **jamais** appliquer `clip-path` sur `.tab-r3f-canvas-area > div` — ce sélecteur cible le wrapper div de R3F qui contient le `<canvas>`, ce qui clipperait le canvas lui-même et masquerait la minimap.

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

### 12.2 Fretboard Highlight

Deux services distincts selon le type de note :

**`FretboardHighlightService.ts`** — notes normales (non-legato) :
- **Hover** : positionne `fretboardHighlights` → highlight orange classique
- **Lecture** : idem pour la note jouée

**`LegatoFretVisualizationService.ts`** — notes legato :
- **Hover / Lecture** : `.show(noteId, notes)` remonte toute la chaîne (source + intermédiaires + destination), set `legatoFretHighlights` (outlines orange sur le manche) ET `legatoActiveNoteIds` (pods tablature non-assombris)
- `.clear()` vide les deux
- Les notes legato n'appellent **jamais** `FretboardHighlightService` (pour éviter de griser les autres cellules de la chaîne)

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
