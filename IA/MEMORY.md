# TabSeek — Documentation interne & règles de développement

> Fichier de référence vivant : il réunit l'architecture, les règles UI/UX, le flux de données, les commentaires importants trouvés dans le code et les points à nettoyer.

---

# Roles & Brainstorming

> **IMPORTANT** : Pour comprendre le contexte de l'équipe, les personnages (Comité de Pilotage, Équipe Technique, Experts, Utilisateurs) et le processus de développement (Ticket Review), **consultez impérativement le fichier `.\IA\ROLES.md`, !!TOUT DOIT Y ETRE RESPECTE !!**. 
>
> Ce fichier définit l'identité de chaque membre et les règles strictes de brainstorming à suivre avant toute implémentation. L'IA doit lire `.\IA\ROLES.md` en complément de `.\IA\MEMORY.md` pour maintenir la cohérence du projet.
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

> **⚠️ Tuning — double convention d'ordre :**
> - `tuning.split(',')` → index 0 = corde grave E2 → utilisé par **TablatureR3F, tous les services**
> - `tuningArray()` → `.reverse()` → index 0 = corde aiguë E4 → utilisé par **Tab.tsx (vue grille legacy)**
> Ne jamais mixer les deux sans conversion explicite.

### 6.3 Store Tablature R3F (`src/stores/useTablatureR3FStore.ts`)
Gère l'état du Piano Roll (notes, chords, progressions, legato, playback).

> **Règle architecture** : le store ne doit contenir que de la **gestion d'état pure** (set/get). Toute logique algorithmique (interpolation, détection, verrouillage) va dans `src/utils/` ou `src/services/`. Voir `src/utils/legatoUtils.ts` pour exemple.

### 6.4 Utils — `src/utils/legatoUtils.ts` *(Juillet 2026)*
Fonctions pures extraites du store pour séparation store/logique :
- `syncLegatoHelper` — interpolation pitch/position des notes intermédiaires d'une chaîne legato
- `detectChordName` — détection Chord.detect avec tri MIDI (résistant à l'ordre d'insertion)
- `isRhythmLegatoLocked` — vérification lock chaîne legato-rythme (source unique — plus de copie locale)
- `getNoteNameFromFret` — nom complet (ex: `E3`) depuis corde ouverte + frette

### 6.5 Types — `src/types/` *(Juillet 2026, restructuré session 8)*

Tous les types purs (sans implémentation) résident dans des fichiers **`.d.ts`** sous `src/types/`.

| Fichier | Contenu |
|---|---|
| `src/types/drag.d.ts` | `NoteZone`, union discriminée `AnyDragState` = `DragNoteState` \| `DragChordGroupState` \| `DragProgGroupState` \| `DragRectState` \| `DragNewProgState` \| `DragPlaybackState` \| `DragModeZoneState` |
| `src/types/index.ts` | Barrel re-exportant `ModeGuitar` (depuis `src/types.ts`), `ChordProgression`, `RhythmPatternDef`, tous les types de `drag.d.ts` |

> **Règle** : tout type pur (interface, union, alias) qui n'a pas de couplage à une implémentation doit vivre dans `src/types/*.d.ts`. Les types couplés à leur implémentation (ex: état Zustand dans les stores) restent dans leur fichier d'origine.

`NoteZone` est la source canonique dans `drag.d.ts` ; `tabUtils.ts` le re-exporte pour compat import unique.

---

## 7. Hooks, Données & Services

### 7.0 Organisation des dossiers *(restructuré session 8)*

```
src/
  data/          ← fichiers de données pures (pas de hooks, pas d'effets)
    rhythmPatterns.ts
    extraModes.ts
    progressions.ts
    chords.ts
    chord-charts.ts
    tonalChordsMapping.ts
  hooks/         ← hooks React (useXxx) et fonctions utilitaires de composables
    useAudio.ts
    useGuitarChords.ts
    useGuitarNotes.ts
    useMidiUtils.ts
    useNoteHelpers.ts
    useUIState.ts
  types/         ← types purs uniquement (.d.ts)
    drag.d.ts
    index.ts     ← barrel
  utils/         ← fonctions pures (pas de hooks, pas de store)
    tabUtils.ts
    guitarUtils.ts
    legatoUtils.ts
    tuningUtils.ts
    tablatureGeometry.ts (à créer — P2 non terminé)
  services/      ← services métier (accèdent au store via getState())
  stores/        ← stores Zustand
  components/
    tablature/
      scene/     ← composants Three.js/R3F atomiques (1 fichier = 1 composant)
        LegatoLine.tsx
        LegatoActionBtn.tsx
        NoteDisc.tsx
        SubNoteBody.tsx
        PodGradientMaterial.tsx
        ModeZoneGradientMaterial.tsx
        passWheel.ts
        sceneConstants.ts
        NoteComponents.tsx   ← barrel re-export (compat)
        PodMaterials.tsx     ← barrel re-export (compat)
```

> **⚠️ JAMAIS de fichiers de données dans `src/composables/`** — ce dossier est vide depuis la session 8. Tout import qui pointait vers `composables/X` a été migré vers `data/X` ou `hooks/X`.

### 7.1 Hooks & Données

| Fichier | Rôle |
|---|---|
| `hooks/useAudio.ts` | Façade audio — délègue à `SoundFontService` si prêt, oscillateur sinon. Même API : `playNote`, `playFullChord`, `stopAllSounds`. Lance `SoundFontService.preload()` à l'import. |
| `hooks/useGuitarNotes.ts` | Calculs de notes sur le manche |
| `hooks/useNoteHelpers.ts` | `getNoteColor()`, `getNoteDegreeLabel()` |
| `data/rhythmPatterns.ts` | Définition des patterns rythmiques (kick, snare, hi-hat) par feel. |
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
- **Marge de début de tablature** (Juin 2026) : Ajout d'une marge de **1/8 de mesure** (`LEFT_MARGIN_W`) avant l'instant 0 (beat 0). Permet de garder les boutons sticky (disques, icônes) visibles sur les premières notes sans qu'ils ne soient cropés au bord gauche. La marge a un fond 33% plus sombre que `LANE_COL` (`MARGIN_COL`) et ne contient pas de lignes de grille. Les contraintes de caméra (`Math.max`) ont été ajustées pour permettre le scroll dans cette zone négative.
- **Labels de mesures** (Juin 2026) : Positionnés sur le bord **gauche** de chaque mesure (avec un léger offset de 0.08 WU) au lieu d'être centrés, pour une meilleure lisibilité avec la grille.

**Disque (fret + nom de note)** — remplace l'ancien Fret Label / Note Name :
- Disque circulaire ancré au **début** du pod, badge fret (grand) + nom de note (petit) **empilés verticalement** (`flexDirection: column`, centrés) — le nom de note était positionné en absolu bas-droite à l'origine, mais dépassait le cercle ; empilé sous le fret, il reste dans la zone la plus large du disque.
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

  - ** Intermediate Notes** : Les notes générées par un legato sont 50% plus sombres, 30% désaturées et n'ont pas de bulle de legato (le disque fret/nom reste affiché).
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
- **Transfert d'événements (passWheel)** (Juin 2026) : Les overlays `<Html>` de R3F avec `pointer-events: auto` interceptent nativement l'événement `wheel` (zoom/pan), empêchant son arrivée sur le canvas. Un utilitaire `passWheel` a été ajouté sur tous ces éléments pour redispatcher manuellement l'événement au canvas via `canvas.dispatchEvent(new WheelEvent('wheel', ...))`.
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
  - **Double-clic** (Juin 2026) : positionne instantanément le curseur de lecture (`playbackBeat`) au world X cliqué.

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
    - **Positionnement** (`.rhythm-popover` SCSS) : ancrée **au-dessus** du disque (`bottom: calc(100% + 6px)`, pas `top`) — sinon elle s'étend vers le bas et se superpose aux pods de note et à l'interligne en dessous. Même pattern que `.rhythm-instr-popover`.
  - **Emojis** : Utilise le service global de résolution d'emojis (`ChordEmojiService.tsx`) pour afficher l'icône spécifique du pattern (ex: `:earth_africa:` pour Afrobeat).
- **Playback** : Le moteur audio utilise les segments virtuels fournis par le service. Le highlight sur le manche suit également ces segments.
  - ⚠️ `rawMaxBeat` (fin de lecture) doit inclure la fin des sous-notes virtuelles (`getVirtualRhythm`), pas seulement `note.startBeat + note.duration` — sinon le curseur s'arrête avant la fin réelle d'un pattern en mode étendu.
- **Suppression** : Un clic droit sur le contour rouge ou le bouton supprimer dans la pop-over restaure instantanément l'état normal.
- `gl.autoClear = false` obligatoire pour les deux passes ; remis à `true` en fin de frame.

#### 11.6.1 Materialisation Legato d'un Rhythm Modifier — Juin 2026 (multi-chaîne depuis la factorisation des pods)

Bouton `linear_scale` dans la pop-over du Rhythm Modifier. **Ne réimplémente pas** le legato — réutilise entièrement le moteur existant (11.3/11.4).

- **ON** → `RhythmModifierService.materializeLegatoRhythm(modId)` :
  - **Cible `note`** : une seule chaîne (comportement historique, champs simples).
  - **Cible `chord`** : ⚠️ **chaque note de l'accord reçoit sa propre chaîne indépendante** — matérialiser ne doit **pas** se limiter à la fondamentale (bug corrigé : avant cela, une seule note — la première trouvée dans `chord.noteIds`, généralement la fondamentale — était matérialisée, les autres cordes de l'accord restaient statiques en mode legato). `materializeChainForNote(mod, note)` est appelée pour **chaque note** du `ChordGroup` ; les notes dont le pattern n'a pas assez d'onsets (< 2) restent simplement inchangées (pas d'erreur).
  - Par chaîne : calcule les sous-notes virtuelles (`computeVirtualNotes`, respecte `stringTrackOverrides` — voir 11.8.3) ; 1ère sous-note → **source** (note de base mise à jour en place) ; dernière → **destination** (nouvelle note, `legatoPrev` = source) ; sous-notes intermédiaires → **notes intermédiaires** réelles dans `source.intermediateNoteIds`.
  - `group.noteIds` est remplacé par l'union de toutes les notes matérialisées **+** les notes non matérialisées inchangées, afin que les bounds du Chord Pod restent corrects.
  - `LegatoLine` dessine un ruban par chaîne — autant de rubans que de cordes matérialisées.
- **OFF** → `dematerializeLegatoRhythm` : itère sur **toutes** les chaînes (`legatoChains` ou le champ simple legacy), supprime les notes générées et restaure chaque note de base à son `origRange`. `deleteNote` est appelé **sans** `tuning` (évite que `detectChordName` renomme l'accord pendant la suppression progressive des extras — voir 11.8.4).
- **Changement de pattern/instruments pendant que `legato=true`** : auto-déclenche `rematerializeWithPatch` (dematerialize → applique le patch → re-materialize) pour garder toutes les chaînes synchronisées.
- **Champs `RhythmModifier`** :
  - Legacy (cible `note`) : `legatoBaseNoteId?`, `legatoExtras?`, `legatoOrigRange?`.
  - Multi-chaîne (cible `chord`) : `legatoChains?: { baseNoteId, extras, origRange }[]` — un élément par corde matérialisée.
- **Bounds du pod** : quand `legato=true` sur une cible `note`/`progression` (rendu en pod flottant), le pod couvre `targetId` + `legatoExtras`. Pour une cible `chord`, les bounds viennent simplement de `group.noteIds` (déjà mis à jour ci-dessus) — pas de cas spécial dans le rendu du Chord Pod.

#### 11.6.2 Verrouillage des Pods Legato-Rythme — Juin 2026

Les notes matérialisées (11.6.1) sont **verrouillées** : seul un changement manuel de corde est autorisé ; déplacement horizontal et redimensionnement sont bloqués.

- **Détection** : `RhythmModifierService.isLegatoLocked(noteId)` — **vérification live**, pas un simple flag stocké. Cherche un modifier `legato=true` dont `legatoBaseNoteId === noteId` ou `legatoExtras.includes(noteId)` (cible `note`, legacy), **ou** dont un élément de `legatoChains[]` matche (cible `chord`, multi-chaîne — 11.6.1), **et** vérifie que la note de base correspondante a toujours un `legatoNext` actif. Même logique dupliquée dans `useTablatureR3FStore.ts` (`isRhythmLegatoLocked`, copie locale).
  - ⚠️ Important : `renderLegato` (bouton merge) et `deleteNote` (suppression de la destination ou du dernier intermédiaire) effacent `legatoNext` sur la source — sans cette vérification live, les pods resteraient « verrouillés » indéfiniment après dissolution de la chaîne. Aucun nettoyage explicite n'est nécessaire à chaque site de dissolution : le déverrouillage est automatique.
- **Drag** : `onNoteDown` force `type:'move'` pour une note verrouillée (jamais resize). `TablatureMoveService.handleNoteMove` fige `startBeat` (=`d.origBeat`) sur `move` mais laisse passer `string`/`fret`. Les branches resize sont no-op. `handleChordGroupMove`/`handleProgGroupMove` sautent aussi les notes verrouillées dans leurs boucles (drag d'un accord/progression contenant une note de base verrouillée).
- **Correctif racine (store)** : `legatoAuto` vaut `true` par défaut (`?? true`) — donc même le changement de corde *autorisé* déclenchait silencieusement `syncLegatoHelper` (resize) via `updateNote`. Toutes les fonctions pouvant appeler `syncLegatoHelper` vérifient désormais `isRhythmLegatoLocked` (copie locale dans `useTablatureR3FStore.ts`, pas d'import du service pour éviter un cycle store↔service) et l'ignorent si verrouillé : `updateNote` (branches Auto et Chain), `setLegatoBehavior`, `syncLegato`, `addLegatoIntermediate`, `removeLegatoIntermediate`.
- **UI** :
  - Icône cadenas (`material-symbols-outlined: lock`) en haut à gauche du disque — composant `NoteDisc` reçoit `locked: boolean` en prop explicite.
  - Curseur `ns-resize` au survol d'un pod verrouillé (indique : changement de corde uniquement).
  - Bouton **merge** (figer le legato) masqué sur la note source d'une chaîne verrouillée — le désynchroniserait silencieusement du modifier (le pop-over reste le seul moyen propre de dématérialiser).
  - Bulle legato (démarrer une nouvelle chaîne) masquée sur les notes verrouillées — en démarrer une écraserait `legatoNext`/`intermediateNoteIds` de la chaîne gérée par le rythme.
  - Pop-over **Comportement Legato** : pour une note verrouillée, navigation du comportement (chevrons), **Auto** et **Chain** sont masqués (pas juste désactivés) — seule l'info en lecture seule (icône + nom) reste affichée. Ces trois contrôles redimensionnent les notes via `syncLegatoHelper`.

#### 11.6.3 Ruban déformé du header (test shader) — Juin 2026

Quand `mod.legato` est actif, la barre d'en-tête plate (`planeGeometry`) du `RhythmModifierPod` est remplacée par un **ruban shader** qui plonge vers l'interligne juste au-dessus de chaque pod géré, en s'épaississant, avant de remonter — au lieu de rester une barre droite superposée aux pods.

- `RibbonLineService.buildRibbonGeoCatmullRom` accepte désormais un paramètre optionnel `chainWidths?: number[]` (parallèle au chain de points), interpolé le long de la courbe **comme les couleurs** (même logique d'index/fraction). Rétrocompatible — `LegatoLine` (seul autre appelant) ne le passe pas.
- `RhythmModifierPod` reçoit `governedNotes: TablatureNote[]` (les notes matérialisées, déjà calculées au site d'appel pour les bounds). Pour chaque note (triée par `startBeat`) : approche plate à `relHeaderY`, plongée à `stringY(note.string) + STRING_H/2` (l'interligne **au-dessus** de la corde de la note, pas la corde elle-même), traversée à cette hauteur sur toute la largeur du beat de la note (épaisseur ×2.6 par rapport à la barre plate), puis remontée. Réutilise le même matériau/pattern que `LegatoLine` (`createRibbonMaterial`, `uTime`/`uInvStretchX` mis à jour par frame).
- Sans notes gérées (modifier non-legato), le plan plat d'origine reste inchangé.

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

### 11.8 PodModifierService — Factorisation des Pods Modifier (Accord/Progression/Rythme) — Juin 2026

Les 3 types de pods (Chord, Progression, Rhythm Modifier) partagent désormais le **même pattern** : disque émoji sticky → clic → popover. Composants partagés dans `src/components/tablature/PodModifierUI.tsx`, logique métier dans `src/services/PodModifierService.ts`.

#### 11.8.1 Composants UI partagés

- **`PodModifierDisc`** : disque sticky (emoji + couleur de thème en bordure) qui toggle une popover au clic. Utilisé par les 3 types de pods — chacun passe `emojiStr`/`discBg`/`borderCol` selon son thème (vert `CHORD_BORDER_COL`, bleu `PROG_BORDER_COL`, violet `#7c3aed`).
  - ⚠️ Le `borderCol` ne doit **jamais** être `'transparent'` par défaut — chaque disque doit avoir le contour de sa couleur de thème en permanence (bug corrigé : le disque accord avait `borderCol:'transparent'` sauf si arpège actif).
- **`PodModifierPopover`** : coquille commune (nav précédent/suivant optionnelle + zone enfants + bouton supprimer optionnel + bouton fermer). `className` pour le thème CSS (`chord-popover`/`progression-popover`/`rhythm-popover`).
- **`FloatingPodPopover`** : ⚠️ **portail flottant** — rendu via `createPortal` dans un nœud DOM dédié ajouté à `document.body` (`getOverlayRoot()`), **complètement hors de la hiérarchie `<Html>` de R3F**. Recalcule sa position (`getBoundingClientRect()` de l'ancre) à chaque frame via `requestAnimationFrame`, donc suit le pan/zoom de la caméra. Placement intelligent : au-dessus de l'ancre par défaut, bascule en dessous si pas de place (`placement: 'above'|'below'`), avec petit connecteur triangulaire CSS pointant vers le disque.
  - **Pourquoi un portail et pas un `<Html>` imbriqué** : plusieurs `<Html>` R3F empilés (disque du pod + popover + sous-popovers) pouvaient se voler les événements de clic selon l'ordre de stacking DOM — cause la plus probable des boutons de popover qui ne répondaient plus. Le portail élimine ce risque structurellement.
  - **Pas de fermeture au clic extérieur** : seulement via le bouton ✕ explicite (un `document.addEventListener('pointerdown', ..., {capture:true})` global a été essayé puis retiré — risque d'interférer avec le système de pointer du canvas R3F, notamment le drag des pods).
  - ⚠️ **`passWheel`** (`PodModifierUI.tsx`) : le portail sortant le disque/la popover de la hiérarchie du canvas, le listener `wheel` natif du canvas (zoom/pan) ne reçoit plus l'événement quand le curseur survole un disque ou une popover (`pointer-events:auto`). `passWheel(e)` redispatch un `WheelEvent` synthétique vers `.tab-r3f-canvas-area canvas`, monté en `onWheel` sur le wrapper du disque (`PodModifierDisc`) et sur la popover flottante elle-même — sans ça, zoomer/scroller la molette ne fonctionne plus dès que le curseur est sur un disque de pod.
- **`RhythmModifierDisc`** : disque+popover rythme factorisé, réutilisé à la fois par le pod flottant (cible `note`/`progression`) et par le Chord Pod (cible `chord`, voir 11.8.3).
- **`InstrumentTrackDisc`** : voir 11.8.3.

#### 11.8.2 Navigation, recherche, arpège (Chord Pod) & template (Progression Pod)

- **`PodModifierService.getChordTypeNav(group)`** : chevrons précédent/suivant dans `TONAL_CHORD_TYPES` (liste plate `tonalChordsMapping.ts`), garde la fondamentale (`Chord.get(chordName).tonic`), reconstruit le voicing via `findBestChordFrets` ancré sur la même corde/frette que la racine actuelle.
- **Recherche → autre digitation** (pas recherche de type) : `PodModifierService.cycleVoicing(group, dir)` — `guitarUtils.findRankedChordVoicings` retourne les N meilleurs voicings classés (au lieu d'un seul comme `findBestChordFrets`), le bouton recherche cycle vers le suivant dans le classement après le voicing courant.
- **Octave** : `PodModifierService.transposeOctave(group, ±1)` — transpose chaque note de ±12 demi-tons via `findNearestFretForMidi` (extrait de `syncLegatoHelper`, partagé dans `guitarUtils.ts`).
- **Arpège verrouillé** : `PodModifierService.applyArpeggio(groupId, direction, noteCount)` — trie les notes par hauteur MIDI, construit la séquence selon la direction (`up`/`down`/`updown`/`downup`, cycle par octave si `noteCount` > nombre de tons), matérialise en chaîne legato réelle (même mécanisme que 11.6.1, stocké comme `RhythmModifier` avec `kind:'arpeggio'` dans le **même tableau** `rhythmModifiers` — réutilise gratuitement tout le verrouillage 11.6.2 sans modification).
- **Template de progression** : `PodModifierService.getProgressionTemplateNav(prog)` — chevrons dans `chordProgressions` (`composables/progressions.ts`), reconstruit toute la séquence d'accords en gardant la fondamentale du 1er accord et la durée totale.
- **⚠️ Navigation prioritaire sur le verrou** : `applyChordType`/`cycleVoicing`/`transposeOctave`/`applyProgressionTemplate` **dématérialisent automatiquement** toute chaîne active (arpège ET legato-rythme matérialisé, via `dematerializeChainsForGroup`) avant d'agir, plutôt que de refuser silencieusement. Comportement voulu explicitement : la navigation ne doit jamais être bloquée par un verrou.
- **Actions store atomiques** : `replaceChordGroupVoicing`/`replaceProgressionContent`/`setChordGroupNoteIds` (`useTablatureR3FStore.ts`) — bypassent les cascades de `deleteNote`/`removeProgressionGroup` (qui suppriment un groupe/une progression devenu vide) pour permettre de remplacer le contenu d'un groupe **en gardant son id**.

#### 11.8.3 Rythme imposé à un accord — disque accolé + instruments par corde

- Quand un `RhythmModifier` cible un `ChordGroup` (`targetType:'chord'`), il n'est **plus** rendu comme pod flottant séparé (la boucle `rhythmModifiers.map` dans `TablatureR3F.tsx` filtre `targetType !== 'chord'`) — son disque (`RhythmModifierDisc`) est rendu **juste après le disque de l'accord**, dans le même conteneur flex du Chord Pod.
- **`RhythmModifierService.applyRhythmToTarget`** : ⚠️ bug corrigé — déposer un rythme sur une note appartenant à un accord doit cibler le **`ChordGroup`** (`targetType:'chord'`, `targetId` = id du groupe), pas la note individuelle. Avant le correctif, `isChord` testait `g.id === targetId` (jamais vrai puisque seule une note est passée par le drop), donc tout rythme déposé sur une note d'accord devenait silencieusement un modifier `targetType:'note'` invisible dans le Chord Pod.
- **Assignation par corde** : `mod.stringTrackOverrides?: Record<noteId, trackPart>` — par défaut chaque note de l'accord joue la fusion de `activeTracks` (comportement existant) ; un override limite une note précise à **une seule piste** du pattern. `RhythmModifierService.getAssignedTrack`/`cycleStringTrack`.
- **`InstrumentTrackDisc`** : disque (même style que le disque d'accord, contour violet `#7c3aed`, **22px** — même taille que le disque `RhythmModifierDisc` accolé au Chord Pod) affichant l'emoji de la piste assignée (`'__all__'` = note 🎶), clic = cycle vers la piste suivante.
  - ⚠️ **Indépendant des sous-pods de rythme** (corrigé) : positionné une seule fois par note, **sticky-clampé sur l'étendue complète de la note** (`note.startBeat`→`note.startBeat+note.duration`), pas attaché à un sous-pod spécifique. Une première version l'attachait au disque du 1er sous-pod visible (`idx===firstVisibleDiscIdx`), mais si **tous** les sous-pods devenaient trop étroits (zoom arrière, pattern très subdivisé), la bulle disparaissait — plus de fallback possible. La version sticky-indépendante reste toujours visible, à n'importe quel niveau de zoom.
  - **Positionnement** : `podStickyLeftX` = bord gauche sticky du pod (même formule que `NoteDisc`, mais sur l'étendue complète de la note) ; la bulle est placée à `podStickyLeftX - gap - rayon`, avec `gap = 5px` converti en world-units (`5 / pxPerWUX`) — garantit un espace constant de 5px avec le pod qu'elle suit, à n'importe quel zoom, sans jamais le chevaucher.
  - ⚠️ **Une seule bulle par corde, pas par note matérialisée** (corrigé) : en mode legato matérialisé (11.6.1), chaque corde produit plusieurs vraies notes (ancre + intermédiaires + destination), toutes dans `group.noteIds` — sans garde, chacune affichait sa propre bulle. Condition : `!isIntermediate && !note.legatoPrev` (la note n'est ni un intermédiaire d'une autre chaîne, ni elle-même une destination) — ne matche que l'**ancre** de chaque chaîne, qui représente "cette corde".
- **Matérialisation multi-chaîne** : voir 11.6.1 — activer "legato" sur un rythme ciblant un accord matérialise **chaque corde indépendamment**, pas seulement la fondamentale.

#### 11.8.4 `detectChordName` — tri par hauteur avant `Chord.detect`

⚠️ **Bug confirmé et corrigé** (`useTablatureR3FStore.ts`) : `Chord.detect` (Tonal.js) est **sensible à l'ordre** des notes en entrée, pas seulement à l'ensemble. Reproduit : `Chord.detect(['C4','E4','G4'])` → `'CM'`, mais `Chord.detect(['E4','C4','G4'])` (mêmes notes, ordre différent) → `'Em#5'`. Comme `detectChordName` construit le tableau de pitches dans l'**ordre d'insertion du store** (`s.notes`, append-only) et non dans un ordre musical stable, déplacer une note (et la remettre à sa place) pouvait renommer l'accord de façon incohérente. **Fix** : trier par hauteur MIDI ascendante avant `Chord.detect` — rend le résultat invariant à l'ordre d'insertion.

- **Même précaution répandue ailleurs** : `PodModifierService.applyArpeggio`/`removeArpeggio` et `RhythmModifierService.materializeLegatoRhythm`/`dematerializeLegatoRhythm` appellent `deleteNote` **sans** passer `tuning`, précisément pour éviter que cette même détection (même corrigée, elle reste partielle/heuristique sur un sous-ensemble de notes) ne renomme l'accord pendant une suppression intermédiaire de notes.

---

## 12. Workflow de Drag & Drop (Accords / Rythmes / Progressions)

Le service `TablatureDropService.ts` gère l'intelligence musicale lors du dépôt d'éléments sur la tablature.

### 12.1 Rythmes (Rhythm Modifiers)

- **Source** : `rhythmPatterns.ts` définit des patterns par instrument (kick, snare, hi-hat).
  - **Compatibilité Emoji** (Juin 2026) : Utilisation stricte des codes compatibles avec `node-emoji` v2.4.0 (ex: `:postal_horn:` au lieu de `:bugle:`, `:musical_keyboard:` au lieu de `:accordion:`).
- **Rhythm Modifiers** : 
  - Au lieu de modifier les notes de façon destructive, le drag & drop d'un rythme crée un **RhythmModifier**.
  - S'applique à une **Note**, un **ChordGroup** ou un **ProgressionGroup**.
  - **Modes** :
    - `proportional` (par défaut) : Le pattern est compressé/étendu pour tenir exactement dans la durée du pod cible.
    - `extended` : Le pattern conserve sa durée naturelle (en mesures) à partir du début de la cible.
  - **Visualisation** : Encadré d'un trait rouge (`#cc0000`) avec un disque icône en haut à gauche.
  - **Réversibilité** : Supprimer le modifier (clic droit sur l'encadré) restaure immédiatement l'apparence et le comportement normal du pod original.
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
- **Playback Indicator** : Barre verticale verte (`APPLE_GREEN`) avec flèche. Déplaçable pour changer la position.
- **Auto-Reset** : Si `isLooping` est faux, la lecture revient à 0 à la fin du morceau.
- **Audio** : Utilise `playFullChord` et `playNote`. `stopAllSounds()` est appelé au Stop ou Pause.
  - **Correction des accords (Juin 2026)** : `playFullChord` a été modifié pour accepter un tableau de durées. Cela corrige le bug où un accord s'arrêtait dès que sa note la plus courte se terminait. Désormais, chaque note d'un accord (même complexe ou arpeggié) conserve sa propre durée.
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

---

## 15. Référentiel de Tests QA — Bryan O'Conor & Dr. Amara Ndiaye

> Mis en place après les régressions de session 7. À exécuter manuellement avant tout merge. **Processus** : T-NOTE + T-CHORD + T-PLAY + T-AUDIO minimum avant chaque PR ; suite complète avant chaque release.

### T-NOTE — Pods de Notes (20 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| N-01 | Cliquer dans une lane vide | Note créée, durée = 1 beat |
| N-02 | Drag horizontal note | startBeat mis à jour, snappé 1/4 beat |
| N-03 | Drag bord droit note | duration augmente, bord gauche fixe |
| N-04 | Drag bord gauche note | startBeat recule, durée ajustée |
| N-05 | Drag note vers autre corde (isolée) | string change, fret identique |
| N-06 | Drag note vers autre corde (accord) | fret recalculé pour conserver la hauteur |
| N-07 | Cliquer le disque d'une note | Input frette s'ouvre |
| N-08 | Saisir frette 0–24 puis Entrée | fret mis à jour |
| N-09 | Saisir frette > 24 | Valeur clampée à 24 |
| N-10 | Clic droit sur note | Note supprimée |
| N-11 | Supprimer source legato | Note + intermédiaires + destination supprimés |
| N-12 | Hover note | Manche : cellule (corde, frette) orange |
| N-13 | Hover note legato | Toute la chaîne s'allume sur le manche |
| N-14 | Note sans zone Mode | Couleur degré via mode global sidebar |
| N-15 | Note dans zone Mode active | Couleur selon gamme du pod Mode |
| N-16 | Note hors gamme | Gris neutre (OFF_COL) |
| N-17 | Disque note locked (arpège/rythme) | Icône cadenas visible |
| N-18 | Resize-right note locked | Aucun changement |
| N-19 | Drag vertical note locked | Seulement la corde change |
| N-20 | Ctrl+A puis Suppr | Toutes les notes supprimées |

### T-CHORD — Pods d'Accord (18 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| C-01 | Drop accord depuis panneau | Accord créé sur bonnes cordes |
| C-02 | Hover header accord | Manche : toutes notes de l'accord en orange |
| C-03 | Hover zone info-lane accord | Même highlight manche que C-02 |
| C-04 | Quitter hover accord | Manche revient à état normal |
| C-05 | Cliquer disque accord | Popover flottante s'ouvre |
| C-06 | Chevron gauche popover | Type change, fondamentale conservée |
| C-07 | Bouton recherche (loupe) | Voicing alternatif (mêmes notes, autres frettes) |
| C-08 | Bouton octave ↑ | Toutes notes +12 demi-tons |
| C-09 | Bouton octave ↓ | Toutes notes -12 demi-tons |
| C-10 | Arpège UP 4 notes actif | 4 notes legato verrouillées, ascendant MIDI |
| C-11 | Arpège DOWN actif | Descendant |
| C-12 | Arpège UPDOWN | Aller-retour sans répéter extrémités |
| C-13 | Désactiver arpège | Accord retourne à notes simultanées originales |
| C-14 | Déplacer accord horizontalement | startBeat toutes notes mis à jour |
| C-15 | Clic droit header accord | Accord + toutes notes supprimés |
| C-16 | Drop accord sur note existante | Note existante = ancre fondamentale |
| C-17 | Undo arpège | Notes simultanées restaurées exactement |
| C-18 | Disque accord : tooltip hover | Tooltip affiche le nom de l'accord |

### T-PROG — Pods de Progression (10 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| P-01 | Drop progression depuis panneau | Séquence d'accords créée |
| P-02 | Hover header progression | Toutes notes de tous les accords s'allument |
| P-03 | Quitter hover progression | Manche normal |
| P-04 | Cliquer disque progression | Popover (nav chevrons templates) |
| P-05 | Chevron template | Séquence remplacée, fondamentale conservée |
| P-06 | Double-clic disque progression | Input renommage s'ouvre |
| P-07 | Renommer puis Entrée | Nom mis à jour (visible tooltip) |
| P-08 | Déplacer progression | Tous accords + notes déplacés proportionnellement |
| P-09 | Resize-right progression | Durée de tous les accords ajustée |
| P-10 | Clic droit header progression | Progression + accords + notes supprimés |

### T-LEGATO — Moteur Legato (13 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| L-01 | Drag bulle droite vers autre note | Chaîne legato créée, ruban orange |
| L-02 | Legato chromatique G3→C4 | 5 demi-tons (quarte juste) entre les deux |
| L-03 | Legato comportement "gamme" | Notes intermédiaires = degrés de la gamme active |
| L-04 | Bouton merge | Intermédiaires figés en notes réelles |
| L-05 | Déplacer source, Auto=ON | Intermédiaires repositionnés automatiquement |
| L-06 | Déplacer destination, Auto=ON | Idem |
| L-07 | Changer comportement | Intermédiaires recalculés |
| L-08 | Mode Chain : déplacer intermédiaire | Seulement les suivants re-syndés |
| L-09 | Double-clic sur intermédiaire | Divisé en deux |
| L-10 | Supprimer dernier intermédiaire | Lien cassé, source et dest libres |
| L-11 | Supprimer destination | Source libérée, intermédiaires supprimés |
| L-12 | Undo après création legato | Chaîne entièrement supprimée |
| L-13 | Drop rythme sur note legato intermédiaire | REFUSÉ (restriction 12.2) |

### T-RHYTHM — Rhythm Modifiers (13 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| R-01 | Drop rythme sur note | Virtual sub-notes affichées, note non modifiée |
| R-02 | Drop rythme sur note d'accord | Modifier cible le ChordGroup entier |
| R-03 | Chevrons pattern | Sub-notes recalculées |
| R-04 | Mode Étendu actif | Pattern sur durée réelle (mesures) |
| R-05 | Combler les silences actif | Sub-notes s'étendent jusqu'à onset suivant |
| R-06 | Legato sur rythme (note) | Chaîne legato matérialisée, cadenas visible |
| R-07 | Legato sur rythme (accord) | Chaque corde reçoit sa propre chaîne |
| R-08 | Désactiver legato rythme | Notes originales restaurées |
| R-09 | Changer pattern pendant legato actif | Re-matérialisation automatique |
| R-10 | Clic bulle 🎶 instrument par corde | Cycle entre pistes du pattern |
| R-11 | Clic droit pod rythme | Modifier supprimé, note restaurée |
| R-12 | Undo matérialisation legato rythme | Notes intermédiaires disparaissent |
| R-13 | Drop rythme sur note de legato intermédiaire | REFUSÉ |

### T-MODE — Pods Mode Zone (14 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| M-01 | Drop mode depuis onglet Modes | Pod rouge, 1 mesure, couleur aléatoire |
| M-02 | Notes dans zone → couleurs | Colorées selon gamme du pod Mode |
| M-03 | Notes hors zone → couleurs | Couleur degré via mode global |
| M-04 | Resize-right pod Mode → min 1/8 mesure | Pas en dessous du minimum |
| M-05 | Déplacer pod Mode | Notes recolorées selon nouvelle position |
| M-06 | Activer Force Note | Notes remappées vers même degré dans nouvelle gamme |
| M-07 | Désactiver Force Note | Notes reviennent (non-destructif) |
| M-08 | Note déjà in-scale + Force Note | Aucun changement de frette |
| M-09 | Note avec frette résultante > 24 | Ignorée (fret hors-bornes) |
| M-10 | Changer couleur via color picker | Dégradé de fond mis à jour |
| M-11 | Navigation modes chevrons | Gamme change, notes recolorées |
| M-12 | Clic droit pod Mode | Supprimé, notes recolorées mode global |
| M-13 | Deux pods Mode contigus | Zones sans chevauchement |
| M-14 | Tooltip disque pod Mode | Affiche le nom du mode |

### T-PLAY — Playback (15 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| PL-01 | Clic Play | Lecture démarre, curseur se déplace |
| PL-02 | Vérifier vitesse 120 BPM | 1 mesure = exactement 2 secondes |
| PL-03 | Clic Stop | Arrêt, curseur à 0 |
| PL-04 | Follow mode actif | Scroll suit le curseur |
| PL-05 | Drag curseur vert | Position de lecture déplacée |
| PL-06 | Clic minimap | Curseur repositionné |
| PL-07 | Double-clic minimap | Curseur de lecture positionné immédiatement |
| PL-08 | Loop ON : fin morceau | Reprend depuis le début |
| PL-09 | Loop OFF : fin morceau | S'arrête en fin |
| PL-10 | Undo pendant lecture | Lecture continue, état mis à jour |
| PL-11 | Changer tempo pendant lecture | Vitesse change immédiatement |
| PL-12 | 50+ notes : playback sans décrochage | FPS stable |
| PL-13 | Playback 5 min continu | Pas de memory leak, position correcte |
| PL-14 | Seek vers beat déjà joué | Sons ne se répètent pas |
| PL-15 | Lecture sans notes | Curseur avance normalement jusqu'à la fin |

### T-AUDIO — Audio SoundFont (12 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| A-01 | Corde E2, frette 0 | Son E2 (MIDI 40) |
| A-02 | Corde A2, frette 0 | Son A2 (MIDI 45) |
| A-03 | Corde D3, frette 0 | Son D3 (MIDI 50) |
| A-04 | Corde G3, frette 0 | Son G3 (MIDI 55) |
| A-05 | Corde C4, frette 0 | Son C4 (MIDI 60) — NOT C3 |
| A-06 | Corde e4, frette 0 | Son E4 (MIDI 64) |
| A-07 | Corde C4 frette 4 vs D3 frette 2 | Sons DIFFÉRENTS (E4≠E3) |
| A-08 | Accord Cmaj | 3 sons distincts simultanés |
| A-09 | Changer preset guitare | Son change à la prochaine note |
| A-10 | Zone Mode Force Note active | Note joue la hauteur effective (nouvelle frette) |
| A-11 | Rhythm modifier proportionnel | Sons aux beats corrects |
| A-12 | Hover note pendant lecture | Son joué si lecture active |

### T-SMART — SmartFretboard (8 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| S-01 | Aucun survol | Gamme du mode global affichée |
| S-02 | Hover note | Cellule (corde, frette) orange |
| S-03 | Hover accord header | Toutes cellules de l'accord oranges |
| S-04 | Hover progression header | Toutes cellules de tous les accords |
| S-05 | Hover note legato | Toute la chaîne sur le manche |
| S-06 | Quitter hover | Manche revient à la gamme |
| S-07 | Lecture note active | Cellule s'allume pendant la note |
| S-08 | Zone Mode active pendant lecture | Gamme du manche = gamme de la zone |

### T-UX — UX & Clavier (20 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| UX-01 | Ctrl+Z | Dernière action annulée |
| UX-02 | Ctrl+Z × 3 consécutifs | 3 états restaurés dans l'ordre |
| UX-03 | Ctrl+Shift+Z (Redo) | Action re-appliquée |
| UX-04 | Ctrl+A | Toutes notes sélectionnées |
| UX-05 | Suppr avec sélection | Notes sélectionnées supprimées |
| UX-06 | Ctrl+C puis Ctrl+V | Notes copiées et collées décalées |
| UX-07 | Ctrl+G sur sélection notes | ChordGroup créé |
| UX-08 | Ctrl+Molette | Zoom horizontal |
| UX-09 | Molette sur popover ouverte | Canvas zoome (passWheel) |
| UX-10 | Tooltip disque accord | Nom de l'accord visible au survol maintenu |
| UX-11 | Tooltip disque progression | Nom de la progression |
| UX-12 | Tooltip disque rythme | Nom du pattern |
| UX-13 | Tooltip disque pod Mode | Nom du mode |
| UX-14 | Labels cordes sidebar | E2, A2, D3, G3, C4, e4 affichés |
| UX-15 | Popover ouverte | Ne bloque pas l'interligne du dessous |
| UX-16 | Popover : flèche connecteur | Pointe vers le disque d'ancrage |
| UX-17 | Disque sticky scroll | Reste visible au bord gauche si note hors-écran |
| UX-18 | Undo après legato en création | legatoSourceId réinitialisé |
| UX-19 | Pod Mode drag horizontal | Zone de couleur suit |
| UX-20 | Resize pod Mode bord droit | Curseur e-resize au survol du bord |

### T-PERF & PWA (8 tests)

| ID | Action | Résultat attendu |
|---|---|---|
| PF-01 | 50+ notes simultanées | FPS > 30, interface réactive |
| PF-02 | 10 zones Mode actives | Pas de freeze |
| PF-03 | Undo 60 fois consécutives | Pas de crash, état cohérent |
| PF-04 | `npx tsc -b` | 0 erreur TypeScript |
| PF-05 | `npm run build` | Build sans erreur |
| PF-06 | Rechargement page | State réinitialisé |
| PF-07 | `public/icon-192.png` | Fichier présent et valide (PNG 192×192) |
| PF-08 | `public/icon-512.png` | Fichier présent et valide (PNG 512×512) |

---

## 16. Règles de Codage — James Edison (Juillet 2026)

> Ces règles sont **contraignantes**. Tout code soumis en revue qui les enfreint est refusé.

### 16.1 Principe de Responsabilité Unique (SRP — Single Responsibility Principle)

> **Un composant → une responsabilité → une seule raison de changer → un fichier.**

Un composant React (ou un hook, ou un service) ne doit avoir qu'**une seule raison de changer**. Si un fichier doit être modifié à cause de deux décisions indépendantes (ex: le style du disque ET la logique de drag), c'est un signal d'alarme : il faut séparer.

**Applications concrètes :**

| ❌ Interdit | ✅ Requis |
|---|---|
| `NoteComponents.tsx` contenant `NoteDisc` + `SubNoteBody` + `passWheel` | `NoteDisc.tsx`, `SubNoteBody.tsx`, `passWheel.ts` séparés |
| `PodMaterials.tsx` contenant `PodGradientMaterial` + `ModeZoneGradientMaterial` | `PodGradientMaterial.tsx`, `ModeZoneGradientMaterial.tsx` séparés |
| `LegatoLine.tsx` contenant `LegatoLine` + `LegatoActionBtn` | `LegatoLine.tsx` + `LegatoActionBtn.tsx` séparés |
| Un service qui accède au DOM **et** au store **et** calcule des pitch | Séparation : DOM dans composant, store dans service, pitch dans utils |

**Règle de nommage** : le nom du fichier = le nom du composant exporté principal. Si le nom ne correspond pas, c'est que le fichier en fait trop.

### 16.2 Types dans `.d.ts`

> **Tout type pur (interface, union, alias de type) qui n'est pas couplé à une implémentation doit vivre dans `src/types/*.d.ts`.**

- Un fichier `.d.ts` ne contient que des `type`, `interface`, `enum const` — pas de `function`, pas de `const` valeur.
- Les types couplés à leur module (ex: l'état d'un store Zustand) restent dans leur fichier d'origine — les extraire créerait une dépendance circulaire ou obligerait à dupliquer des informations.
- **`src/types/index.ts`** est le barrel public — c'est là qu'on importe les types dans les composants.

### 16.3 TSDoc sur chaque fichier et chaque export public

> **Tout fichier `src/` doit avoir un bloc `@file` en début de fichier. Toute fonction/composant/classe exporté(e) doit avoir un TSDoc.**

Format du bloc `@file` :
```ts
/**
 * @file nomFichier.ts
 * Une phrase décrivant la responsabilité unique de ce fichier.
 *
 * Détails supplémentaires si nécessaire (contraintes, invariants, pourquoi
 * une approche particulière a été choisie, liens vers d'autres fichiers).
 */
```

Format TSDoc pour une fonction :
```ts
/**
 * Description en une phrase (verbe à l'impératif).
 *
 * @param tuning  Tableau de notes ouvertes, index 0 = corde grave.
 * @param targetMidi  MIDI de la note cible (0–127).
 * @param siRange  [min, max] — restreint la recherche à cet intervalle de cordes.
 * @returns  `{ si, fret }` — position la plus proche du `refFret` sur les cordes autorisées.
 */
```

Pas de TSDoc pour les fonctions internes non-exportées de moins de 5 lignes (évidente par le code).

### 16.4 Règles d'Architecture Existantes (rappel)

> Ces règles complètent le SRP — elles étaient dans `TODO_LIST.md` et sont désormais ici, source unique.

1. **Aucune logique algorithmique dans les stores** → `src/utils/` ou `src/services/`
2. **Les services ne font pas de `getState()` direct** → idéalement recevoir le state en paramètre (P4-1, en attente)
3. **Aucun fichier de données dans `src/composables/`** → `src/data/` (migré session 8, composables/ vide)
4. **Les composants R3F ne lisent pas le store entier** → sélecteurs ciblés + `useShallow` sur les propriétés directes
5. **`playbackBeat` = ref impérative, jamais Zustand** (Eva, veto permanent — P1-1)
6. **Tout nouveau pod partage `<PodModifierDisc>` + `<PodModifierPopover>`** → pas de copier-coller chord/progression
7. **Tuning lu via `getTuning()` uniquement** (`src/utils/tuningUtils.ts`)
8. **`HistoryEntry` doit capturer tout état UI impacté par undo**

### 16.5 Piège Zustand — `useShallow` et tableaux dérivés

> **`useShallow` ne fonctionne PAS avec des tableaux dérivés (`filter`, `map`) dans le sélecteur.**

`Array.prototype.filter()` crée toujours un nouveau tableau. `useShallow` compare les propriétés de l'objet retourné avec `Object.is`. `Object.is([], [])` → `false`, même si le contenu est identique. Résultat : le composant entre dans une boucle de re-render infinie.

**Règle** : n'utiliser `useShallow` que pour sélectionner des **propriétés directes** du store (jamais des valeurs dérivées).

```ts
// ✅ OK — propriétés directes, références stables
useTablatureR3FStore(useShallow(s => ({ notes: s.notes, chordGroups: s.chordGroups })))

// ❌ INTERDIT — filter() crée un nouveau tableau à chaque appel
useTablatureR3FStore(useShallow(s => ({
  source: s.notes.find(n => n.id === sourceId),       // OK (undefined ou ref stable)
  intermediates: s.notes.filter(n => ids.includes(n.id)) // ❌ nouveau tableau chaque fois
})))

// ✅ Alternative correcte pour les données dérivées
const notes = useTablatureR3FStore(s => s.notes)     // ref stable si pas de mutation
const source = notes.find(n => n.id === sourceId)    // dérivé localement
```

Ce piège a causé le bug de `LegatoLine` en session 8 lors de la tentative de fix P4-4.
