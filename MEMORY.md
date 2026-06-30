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
/              → ScaleContainer       panneaux: notes, modes, chords, rhythms
/chords        → ChordsTabsDisplay    panneaux: notes, chords, rhythms
/progressions  → ProgressionCompiler  panneaux: notes, modes, rhythms
/tablature     → TablaturePage        panneaux: notes, modes, chords, rhythms
```

**Fichier** : `src/router/index.tsx` — `createBrowserRouter([...])`

---

## 5.1 MainGrid — Organisation des onglets

- **Ordre des onglets** : Accords > Rythmes > Progressions > Accords Infos
- **Style des listes** : Les listes (Accords, Rythmes) utilisent des **volets pliables** par catégorie.
  - **Fermés par défaut** pour une meilleure lisibilité.
  - **Décompte** : Le nombre d'items est affiché entre parenthèses dans le header de la catégorie : `Feel (12)`.
  - **Interaction** : Toggle via clic sur le header ou l'icône `expand_more`/`expand_less`.

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
  selectedRhythm: null,
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
| `useAudio.ts` | Façade audio — délègue à `SoundFontService` si prêt, oscillateur sinon. Même API : `playNote`, `playFullChord`, `stopAllSounds`. Lance `SoundFontService.preload()` à l'import. |
| `useGuitarNotes.ts` | Calculs de notes sur le manche |
| `useNoteHelpers.ts` | `getNoteColor()`, `getNoteDegreeLabel()` |
| `rhythmPatterns.ts` | Définition des patterns rythmiques (kick, snare, hi-hat) par feel. |
| `TablatureDropService.ts` | Logique métier pour le Drag & Drop d'accords/progressions/rythmes. Division proportionnelle des notes lors du drop de rythme. |
| `TablatureMoveService.ts` | Logique métier pour le déplacement/redimensionnement (collisions incluses) |
| `FretboardHighlightService.ts` | Highlights sur le manche (hover/play). **Correction Juin 2026** : Respecte strictement les positions (corde/frette) du store pour ne pas highlighter toutes les notes d'une même hauteur (pitch class). |
| `LegatoFretVisualizationService.ts` | Visualisation legato sur le manche : `.show(noteId, notes)` et `.clear()`. Alimente `legatoFretHighlights` ET `legatoActiveNoteIds` dans le store. |
| `RibbonLineService.ts` | **Service partagé** pour tous les line segments animés (shader traveling wave). Exporte : `createRibbonMaterial()`, `createRibbonGeometry(maxSegs)`, `fillRibbonGeoLinear(geo, waypoints, halfW, subdivisions, maxSegs)`, `buildRibbonGeoCatmullRom(chain, colors, halfW, subdivisions, z)`. |
| `SoundFontService.ts` | **Moteur audio SF2** — parseur RIFF inline (PHDR→PBAG→PGEN→INST→IBAG→IGEN+SHDR), zones par preset, `AudioBufferSourceNode` avec looping SF2. Exporte `SoundFontService` singleton + `getSharedAudioCtx()` / `resumeSharedAudioCtx()`. |
| `GuitarSelectionService.ts` | Zustand store — preset guitare sélectionné (`selected`, `setSelected()`, `loadPresets()`). Persiste via `PreferencesService`. Appelle `SoundFontService.setPreset()` au changement. |
| `PreferencesService.ts` | Wrapper localStorage — `get<T>(key, default)`, `set(key, value)`, `remove(key)`. Préfixe `tabseek_`. |

---

## 8. Système Audio SoundFont (SF2)

### 8.1 Architecture

```
useAudio.ts  →  SoundFontService  ←  GuitarSelectionService  ←  PreferencesService
                      ↑
               public/Studio FG460s II Pro Guitar Pack.sf2
```

- **Pas de dépendance Tone.js** : implémentation directe Web Audio API pour conserver le support des **loop points SF2** (sustain des notes). Tone.Sampler ne supporte pas les boucles SF2.
- `useAudio.ts` garde le même API public. Fallback oscillateur si SF2 pas encore chargé.
- `SoundFontService` lit le preset sauvegardé dans localStorage au démarrage → bonne guitare active dès le chargement.

### 8.2 Parseur SF2 inline

Chaîne complète parsée dans `SoundFontService.ts` :

```
PHDR → PBAG → PGEN (oper=41 instrument) → INST → IBAG → IGEN
                                                          oper=43  keyRange
                                                          oper=44  velRange
                                                          oper=53  sampleID  → SHDR → smpl (PCM Int16)
                                                          oper=58  overridingRootKey ← CRITIQUE
```

> **⚠️ `overridingRootKey` (sfGenOper=58) est la vraie note racine du sample**, pas `shdr.originalPitch` (qui vaut 60 pour tous les samples de ce SF2). Utiliser `originalPitch` cause un désaccordage total.

`rootMidi` dans `SampleData` = `overridingRootKey` si ≥ 0, sinon `shdr.originalPitch` (< 128), sinon 60.

### 8.3 Sélection de preset

- `public/guitars.json` — 63 presets, 8 catégories : Acoustique, Méga/Chorus, 12 cordes, Tremolo/Vibrato, Wild, Paddy/Doux, Strums, Arabe, Effets.
- `GuitarSoundSideBar` — drawer accessible via bouton `music_note` dans `NavSidebar`, disponible sur toutes les routes.
- `SoundFontService.setPreset(bank, preset)` reconstruit la map MIDI→`SampleData` depuis les zones du preset. `audioBufferCache` évite de re-décoder les PCM.
- Sélection persistée : clé localStorage `tabseek_selectedGuitar`.

### 8.4 Lecture audio

```ts
// Pitch correction depuis rootMidi (pas originalPitch)
src.playbackRate.value = Math.pow(2, (midi - rootMidi + shdr.pitchCorrection / 100) / 12);

// Loop SF2 si points valides (endLoop > startLoop + 32)
src.loop = true;
src.loopStart = (shdr.startLoop - shdr.start) / shdr.sampleRate;
src.loopEnd   = (shdr.endLoop   - shdr.start) / shdr.sampleRate;
```

---

## 9. UI Iconography — RÈGLE ABSOLUE

> **Toutes les icônes de l'application doivent utiliser Google Material Symbols.**

- **HTML** : `<span className="material-symbols-outlined">icon_name</span>`
- **SCSS** : `@import` dans `index.html`, stylisé via `.material-symbols-outlined`
- **Z-index** : Faire attention aux conflits entre `Html` de `@react-three/drei` et le canvas. Utiliser `zIndexRange`.

---

## 10. Fretboard WebGL — R3F (`Tab.tsx`)

- Composant `Tab.tsx` — manche de guitare WebGL, gammes/accords, `InstancedMesh`.
- Pop-over interactif pour changer d'accord.

### 10.1 Couleurs des cellules

Chaque cellule `CellData` a deux couleurs :
- `color` : couleur effective (peut être orange si `fretboardHighlights` est actif)
- `naturalColor` : couleur de degré calculée **indépendamment** de `fretboardHighlights` (utilisée pour la visualisation legato)

```ts
// Palette degrés (Tab.tsx) — identique à SCALE_COLORS dans TablatureR3F
DEGREE_COLORS = ['#FFF9B1','#77DD77','#AEC6CF','#CDB4DB','#FFB3B3','#FFD1B3','#FFFFFF']
```

### 10.2 Visualisation Legato sur le manche

Déclenchée par `LegatoFretVisualizationService.show()` (hover ou lecture).

| Élément | Description |
|---|---|
| Outlines orange | `InstancedMesh` (`legatoOutlineRef`) — contours sans fond sur chaque cellule de la chaîne |
| Line segment animé | Mesh ribbon (`legatoLineMeshRef`) avec shader traveling wave, couleurs = `naturalColor` de chaque cellule (dégradé) |
| Couleur des cellules | Reprend `naturalColorsRef[idx]` (couleurs de degré, pas orange) |

**Shader ribbon** (via `RibbonLineService`) : traveling wave pulse qui scale la largeur du ruban. `uInvStretchX = 1.0` pour le manche (isotrope). Largeur `CHORD_LINE_HALF_W = 0.08`.

### 10.3 Chord line (outline → line segment)

Même shader ribbon que le legato. Largeur `CHORD_LINE_HALF_W = 0.08`, segments pré-alloués `MAX_CHORD_SEGS = 120`.

---

## 11. Tablature R3F (Piano Roll) — Implémenté Juin 2026

`TablatureR3F.tsx` est un éditeur de style piano roll pour guitare.

### 11.1 Hiérarchie des Pods & Profondeur
La profondeur est gérée par `renderOrder` et la position Z pour éviter le z-fighting.

| Élément | renderOrder | Position Z |
|---|---|---|
| Grille (Beats/Measures) | 1 | -0.04 |
| Progression Pods (Contour bleu, fond gris) | 2–3 | -0.035 |
| Chord Pods (Contour vert, fond gris foncé) | 4–5 | -0.03 |
| Legato Lines (Shader animé, contour orange) | 6 | -0.02 |
| Note Pods (Couleur dynamique) | 8–9 | 0.0 |
| Disc Html (Fret + Nom de note) | auto | 0.06 |
| Viewport Rect Minimap (orange, layer 1) | — | 0.5 |
| Curseur Minimap (vert, layer 1) | — | 0.6 |

### 11.2 Anatomie d'un Note Pod — Refonte Juin 2026

**Corps (`getNoteGeo` → `leftCircleRect`)** :
- Bord **gauche** : demi-cercle plein (`rayon = min(hauteur/2, largeur/2)`) — se marie visuellement avec le disque.
- Bord **droit** : coin arrondi classique (`NOTE_R_MAX`, inchangé).
- Hauteur du corps (`PODBODY_H`) = hauteur de voie (`LANE_H`), capée à la voie de corde.
- **Couleur** : dégradé gauche→droite (shader `PodGradientMaterial`), de la couleur de degré (`getNoteColor`) vers la couleur de remplissage du disque (`discColors.fill`). Le dégradé s'étend sur **une mesure** (`MEASURE_W`) — un pod plus court qu'une mesure n'affiche qu'une portion du dégradé ; plus long, il reste figé sur la couleur du disque après la première mesure.
- **Note fondamentale** : pulse (0.5 Hz, blend 40% blanc) intégré dans le **même** shader via l'uniform `u_blink` (remplace l'ancien `BlinkMaterial` séparé).
- **Atténuation pendant la lecture** (`u_gray`) : tant que `isPlaying` est vrai, tout pod **hors** de l'intervalle de beats sous le curseur de lecture s'assombrit vers `LANE_COL`, transition `ease` ~0.5s (`useFrame`, approche exponentielle `1 - 0.01^(delta/0.5)`). Hors lecture ou pod actif → couleur normale. Calculé **par segment** (`item`), donc un pattern rythmique « chasse » la couleur sous-note par sous-note.

**Disque (fret + nom de note)** — remplace l'ancien Fret Label / Note Name :
- Disque circulaire ancré au **début** du pod, badge fret (grand) + nom de note (petit, bas-droite).
- **Sticky** : clampé entre les bords du pod et le bord gauche visible de la caméra (`camL = scrollX - halfW`) — reste visible tant qu'une partie du corps du pod est à l'écran (même pattern que les disques sticky des Chord/Rhythm Pods).
- **Taille** : diamètre cible = `LANE_H * 0.87` (13% de marge), réduit encore pour les pods étroits (`Math.min(discTargetPx, podWidthPx * 0.92)`).
  - ⚠️ **Calculé via `pxPerWUY`, pas `pxPerWUX`** : le disque est ancré à la hauteur de voie (axe Y), or le zoom horizontal (Ctrl+molette) ne change que `pxPerWUX`. Utiliser le mauvais ratio fait grossir/rétrécir le disque pendant le zoom horizontal — bug corrigé Juin 2026.
- **Couleurs** (`DISC_PALETTE`, précalculé au chargement du module — seulement 7 couleurs de degré possibles) :
  - `fill` = couleur de degré assombrie 33% + désaturée 35%
  - `border` = `fill` assombri encore 33% (désaturation déjà héritée, `darkenHex` ne touche pas la saturation)
  - `text` = `ColorService.getContrastColor(fill)` (noir/blanc, jamais codé en dur)
- **Clic sur le disque** : ouvre l'édition de la frette (équivalent du double-clic historique, mais en un clic).
  - **Pendant la sélection d'un legato** (`legatoSourceId` actif) : le clic sur le disque **résout** la chaîne (`addLegato`) au lieu d'éditer — comportement identique au clic ailleurs sur le pod.

**Bulle Legato** : seule la bulle **droite** (`bubble-next`) subsiste (la bulle gauche a été retirée). Masquée et non-cliquable sur **tous** les pods pendant la sélection d'un legato (`legatoSourceId` actif) — le clic se fait alors sur le disque ou n'importe où sur le corps du pod cible.

**Zones d'interaction** (`noteZoneCompact`, remplace l'ancien `noteZone` pour les pods de note) :
`[ Resize L | Move | Bubble Next (optionnel) | Resize R ]` — les zones Fret/Name ont disparu : le disque (élément DOM `Html`) intercepte le clic **avant** qu'il n'atteigne le mesh de raycasting THREE.js sous-jacent, donc plus besoin de zones dédiées.

- **Intermediate Notes** : Les notes générées par un legato sont 50% plus sombres, 30% désaturées et n'ont pas de bulle/disque de legato (la bulle ; le disque fret/nom reste affiché).
- **Pendant la visualisation legato** : Les notes de la chaîne active (`legatoActiveNoteIds`) ne sont **pas** assombries — elles affichent leur couleur de degré pleine (`SCALE_COLORS[deg-1]`).

### 11.3 Line Segment Legato (Tablature)

Composant `LegatoLine` dans `TablatureR3F.tsx` :
- Geometry : `buildRibbonGeoCatmullRom(chain, colors, 0.12, subdivisions, -0.02)` — courbe CatmullRom, largeur `halfW = 0.12`
- Material : `createRibbonMaterial()` depuis `RibbonLineService` — `uInvStretchX` mis à jour chaque frame pour corriger la déformation horizontale du zoom
- Couleurs : `getNoteColor(n, true)` (skipDarken=true), dégradé source → destination

### 11.4 Legato Engine
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

### 11.5 Minimap

Bande de **56 px** en bas du canvas WebGL — vue d'ensemble du projet à échelle réduite, style VS Code.

**Architecture : multi-camera dans le même canvas WebGL**

- `useFrame(priority=1)` prend le contrôle du rendu (R3F skip son auto-render dès que `priority > 0`).
- Rendu en deux passes par frame :
  1. Caméra principale → canvas complet (`gl.setScissorTest(false)` → `gl.render(scene, mainCam)`)
  2. `minimapCam` → bande basse 56 px (`gl.setViewport(0,0,w,56)` + scissor + clear + render)
- `gl.autoClear = false` obligatoire pour ne pas effacer la passe 1.
- **Minimap Interaction** : `onPointerDown`/`onPointerMove` sur la zone minimap :
  - Calcule `targetWorldX` proportionnellement.
  - Écrit dans `minimapTargetXRef` (ref partagée) → appliqué à `o.position.x` dans le `useFrame priority=1`.

### 11.6 Rhythm Modifiers (Non-Destructif) — Juin 2026

Le système de rythmes permet d'appliquer des patterns de subdivision sans modifier les notes originales via des **Rhythm Modifiers**.

- **Hiérarchie d'application** : Note > Accord > Progression. Si plusieurs modificateurs s'appliquent, le plus spécifique l'emporte.
- **RhythmModifierService** : Centralise la logique.
  - `applyRhythmToTarget` : Crée un modificateur pour une note, un accord ou une progression.
  - `getVirtualRhythm` : Calcule les "virtual notes" pour le rendu et le playback.
- **Visualisation (TablatureR3F)** :
  - **Contour rouge** (`#cc0000`) : Entoure l'élément modifié (Note, Accord ou Progression).
  - **Disque Interactif** : Situé en haut à gauche (positionnement sticky pour rester visible).
  - **Pop-over** :
    - **Mode Proportionnel** : Divise la durée de la note/accord selon le pattern.
    - **Mode Étendu** : Applique le pattern sur sa durée réelle (mesures).
    - **Instruments** : Sélection des pistes (kick, snare, hi-hat) qui imposent leur rythme.
    - **Navigation** : Changement de pattern via flèches ou liste.
  - **Emojis** : Utilise le service global de résolution d'emojis (`ChordEmojiService.tsx`) pour afficher l'icône spécifique du pattern (ex: `:earth_africa:` pour Afrobeat).
- **Playback** : Le moteur audio utilise les segments virtuels fournis par le service. Le highlight sur le manche suit également ces segments.
  - ⚠️ `rawMaxBeat` (fin de lecture) doit inclure la fin des sous-notes virtuelles (`getVirtualRhythm`), pas seulement `note.startBeat + note.duration` — sinon le curseur s'arrête avant la fin réelle d'un pattern en mode étendu.
- **Suppression** : Un clic droit sur le contour rouge ou le bouton supprimer dans la pop-over restaure instantanément l'état normal.
- `gl.autoClear = false` obligatoire pour les deux passes ; remis à `true` en fin de frame.

#### 11.6.1 Materialisation Legato d'un Rhythm Modifier — Juin 2026

Bouton `linear_scale` dans la pop-over du Rhythm Modifier. **Ne réimplémente pas** le legato — réutilise entièrement le moteur existant (11.3/11.4).

- **ON** → `RhythmModifierService.materializeLegatoRhythm(modId)` :
  - Calcule les sous-notes virtuelles du pattern (`computeVirtualNotes`).
  - 1ère sous-note → **source** (la note de base est mise à jour en place : `startBeat`/`duration` repris de la 1ère sous-note).
  - Dernière sous-note → **destination** (nouvelle note, `legatoPrev` = source).
  - Sous-notes intermédiaires → **notes intermédiaires** réelles, IDs stockés dans `source.intermediateNoteIds`.
  - `LegatoLine` dessine alors un seul ruban source → intermédiaires → destination, comme un legato classique.
- **OFF** → `dematerializeLegatoRhythm` : supprime les notes générées (`legatoExtras`), restaure la note de base à `legatoOrigRange`.
- **Changement de pattern/instruments pendant que `legato=true`** : auto-déclenche `rematerializeWithPatch` (dematerialize → applique le patch → re-materialize) pour garder la chaîne synchronisée — sinon le changement de pattern n'aurait aucun effet visible sur des notes déjà matérialisées.
- **Champs `RhythmModifier`** : `legato?`, `legatoBaseNoteId?` (lookup fiable, y compris pour les modifiers de type accord), `legatoExtras?` (IDs intermédiaires + destination), `legatoOrigRange?` (plage d'origine de la note de base).
- **Bounds du pod** : quand `legato=true`, le pod du modifier couvre toutes les notes matérialisées (`targetId` + `legatoExtras`), pas seulement la position (raccourcie) de la note de base.

### 11.7 Génération d'Accords & Voicing

- **Règle de Jouabilité** : L'algorithme de voicing (`guitarUtils.ts`) filtre strictement les doublons de fréquences. Deux cordes différentes ne peuvent pas jouer la même note MIDI (même pitch, même octave) simultanément dans un accord généré automatiquement.
- **Priorité** : Favorise les positions proches de l'ancre (startSi) et un span de frettes réduit.

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

## 12. Workflow de Drag & Drop (Accords / Rythmes / Progressions)

Le service `TablatureDropService.ts` gère l'intelligence musicale lors du dépôt d'éléments sur la tablature.

### 12.1 Rythmes (Rhythm Modifiers)

- **Source** : `rhythmPatterns.ts` définit des patterns par instrument (kick, snare, hi-hat).
- **Rhythm Modifiers** : 
  - Au lieu de modifier les notes de façon destructive, le drag & drop d'un rythme crée un **RhythmModifier**.
  - S'applique à une **Note**, un **ChordGroup** ou un **ProgressionGroup**.
  - **Modes** :
    - `proportional` (défaut) : Le pattern est compressé/étendu pour tenir exactement dans la durée du pod cible.
    - `extended` : Le pattern conserve sa durée naturelle (mesures) à partir du début de la cible.
  - **Visualisation** : Encadré d'un trait rouge (`#cc0000`) avec un disque icône en haut à gauche.
  - **Reversibilité** : Supprimer le modifier (clic droit sur l'encadré) restaure immédiatement l'apparence et le comportement normal du pod original.
  - **Configuration** : Clic sur l'icône ouvre un pop-over pour choisir les pistes actives (kick, snare, etc.), changer de pattern ou basculer entre les modes Proportionnel/Étendu.

### 12.2 Restrictions
- **Interdit** de déposer sur un pod appartenant déjà à un accord (`ChordGroup`).
- **Interdit** de déposer sur un pod faisant partie d'une chaîne legato (source, destination ou intermédiaire).

### 12.2 Comportement non-destructif ("Shift")
Lorsqu'un accord est déposé sur une note simple :
1. La note cible devient l'**ancre** (fondamentale) de l'accord.
2. La durée de l'accord s'adapte à celle du pod d'ancrage.
3. Toutes les notes présentes sur les mêmes beats que le nouvel accord sont **décalées vers l'avant** (leur `startBeat` augmente de la durée totale de la progression) au lieu d'être supprimées.

---

## 13. Playback & Highlighting

### 13.1 Playback Audio
- **Playback Indicator** : Barre verticale verte (`APPLE_GREEN`) avec flèche. Draggable pour changer la position.
- **Auto-Reset** : Si `isLooping` est faux, la lecture revient à 0 à la fin du morceau.
- **Audio** : Utilise `playFullChord` et `playNote`. `stopAllSounds()` est appelé au Stop ou pause.
- **Atténuation des pods pendant la lecture** (Juin 2026, voir 11.2) : Chaque segment de pod s'assombrit vers `LANE_COL` quand le curseur n'est pas dans son intervalle de beats (`isPlaying && playbackBeat ∉ [startBeat, startBeat+duration)`), transition `ease` ~0.5s via le shader `PodGradientMaterial`. Désactivé hors lecture.

### 13.2 Fretboard Highlight

Deux services distincts selon le type de note :

**`FretboardHighlightService.ts`** — notes normales (non-legato) :
- **Hover** : positionne `fretboardHighlights` → highlight orange classique
- **Lecture** : idem pour la note jouée

**`LegatoFretVisualizationService.ts`** — notes legato :
- **Hover / Lecture** : `.show(noteId, notes)` remonte toute la chaîne (source + intermédiaires + destination), set `legatoFretHighlights` (outlines orange sur le manche) ET `legatoActiveNoteIds` (pods tablature non-assombris)
- `.clear()` vide les deux
- Les notes legato n'appellent **jamais** `FretboardHighlightService` (pour éviter de griser les autres cellules de la chaîne)

---

## 14. Hiérarchie z-index Globale

| Élément | z-index | Position |
|---|---|---|
| NavSidebar | **1000** | `relative` |
| ConfigSidebar | **1000** | `relative` |
| Playback Footer | 100 | — |
| Html Overlays (R3F) | 10–100 | `Html` `zIndexRange` |
| Popover config | 500 | `fixed` |
| Backdrop popover | 499 | `fixed` |
