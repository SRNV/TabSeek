# TabSeek — TODO List

> Mis à jour après chaque tour de table. Dernière mise à jour : 2026-07-01 (session 6 — audit architecture complet, comité Dr. Ota + Eva).
> ⚠️ **Eva a posé son veto sur tout ajout de feature tant que les items 🔴 PHASE 1 ne sont pas traités.**

---

## ✅ TRAITÉS (sessions 3-5)

| Item | Fix | Session |
|---|---|---|
| C1 Progression hover fretboard | `TablatureR3F.tsx` ~1882 — FretboardHighlightService sur progression pod | 3 |
| C2 Icônes PWA | `public/icon-192.png` + `public/icon-512.png` générés | 5 |
| C3 PreferencesService | Catch vides → console.warn documenté | 5 |
| M1 Console.log prod | `main.tsx`, `SoundFontService.ts`, etc. nettoyés | 5 |
| M3/M4 Tuning doc | JSDoc complet sur `tuning` ; `REFERENCE_TUNING` commenté | 5 |
| M5 Validation Chord.get | `TablatureDropService.ts` — vérification `chordData.empty` | 5 |
| M7 Fret hors-bornes | `ModeZoneService.ts` — skip `f < 0 \|\| f > 24` | 5 |
| A1 legatoUtils.ts | `syncLegatoHelper`, `detectChordName`, `isRhythmLegatoLocked` extraits du store | 5 |
| A2 eventBus typé | `any` → `ChordProgression` | 5 |
| A3 tablatureDrag.ts | Types drag centralisés, TablatureMoveService typé | 5 |

---

## 🔴 PHASE 1 — CRITIQUE · BLOQUER TOUTE FEATURE (2-3 jours)

### [P1-1] playbackBeat dans Zustand → re-render 60 FPS sur toute l'app ⚠️ VETO EVA
- **Fichier** : `src/stores/useTablatureR3FStore.ts:108`, `TablatureR3F.tsx:945`
- `setPlaybackBeat(newBeat)` est appelé **chaque frame** dans `useFrame`, modifie Zustand, provoque un re-render de tous les subscribers à chaque frame (60 FPS)
- **Fix** : sortir `playbackBeat` de Zustand → `useRef` local dans `TablatureScene` + `useFrame` lit/écrit la ref ; les composants qui ont besoin de la valeur lisent via `useTablatureR3FStore.getState().playbackBeat` (sans subscription) ou un store séparé haute-fréquence
- **Impact** : Performance critique — arrête les re-renders inutiles sur tout le composant
- **Complexité** : M · 3 heures

### [P1-2] HistoryEntry incomplète — undo incohérent
- **Fichier** : `src/stores/useTablatureR3FStore.ts:86-92`
- Manquent dans `HistoryEntry` : `legatoSourceId` (UI incohérente après undo si legato en cours de création)
- **Fix** : ajouter `legatoSourceId: string | null` à `HistoryEntry` + `pushHistory` + `undo` + `redo`
- **Complexité** : S · 30 min

### [P1-3] `@ts-ignore` dans le handler drag
- **Fichier** : `TablatureR3F.tsx:2503`
- `// @ts-ignore` sur `gl.domElement.setPointerCapture(e.pointerId)` — masque une incompatibilité de types R3F
- **Fix** : typer correctement via `(e.target as HTMLElement).setPointerCapture(e.pointerId)` ou étendre les types R3F
- **Complexité** : S · 1 heure

### [P1-4] ChordDetection sur chaque updateNote même pour durée seule
- **Fichier** : `src/stores/useTablatureR3FStore.ts:206-214`
- `detectChordName` (Tonal.js, coûteux) s'exécute même si seul `startBeat`/`duration` change
- **Fix** : vérifier `if ('fret' in patch || 'string' in patch)` avant de re-détecter
- **Complexité** : S · 30 min

### [P1-5] `getTuning()` helper manquant — format accédé en 4 endroits différents
- **Fichier** : `TablatureDropService.ts`, `ModeZoneService.ts`, `PodModifierService.ts`, `TablatureR3F.tsx`
- Tous font `useTablatureStore.getState().tuning.split(',')` — si le format change, 4+ endroits cassent
- **Fix** : créer `src/utils/tuningUtils.ts` → `getTuning(): string[]`
- **Complexité** : S · 20 min

### [P1-6] `legatoSourceId` absent de `HistoryEntry` — cf. [P1-2]
*(Regroupé avec P1-2 dans l'implémentation)*

---

## 🟠 PHASE 2 — ARCHITECTURE · TablatureR3F DÉCOMPOSITION (4-5 jours, Dr. Ota)

> **Prérequis** : Phase 1 terminée. Décomposer sans changer le comportement.

### [P2-1] TablatureR3F.tsx — God Component 2705 lignes · 21 useState · ~40 responsabilités
- **Fichier** : `TablatureR3F.tsx` entier
- **Plan de découpage en 8 sous-composants** (Dr. Kenji Ota) :
  - `<SceneBackground />` — grille, marges, lanes (lignes ~1750-1810)
  - `<ModeZoneTint />` — gradient shader zones mode (lignes ~1812-1835)
  - `<NotePods />` — notes individuelles + legato lines (lignes ~2055-2530)
  - `<ChordPods />` — pods accord + disques (lignes ~1960-2055)
  - `<ProgressionPods />` — pods progression (lignes ~1855-1960)
  - `<RhythmModifierPods />` — pods rythme flottants (lignes ~1920-1965)
  - `<ModePods />` — pods mode (lignes ~1985-2060)
  - `<PlaybackIndicator />` — curseur de lecture + flèche (lignes ~2535-2575)
- **Complexité** : XL · 4 jours

### [P2-2] TablatureScene — 21 useState à extraire en 3 hooks
- **Fichier** : `TablatureR3F.tsx:1043-1070, 1229-1263`
- `useEditorSelection()` → `selectedIds`, `editingId`, `inputVal`, `selectedChordGroupIds`
- `useEditorHover()` → `hoveredGroupId`, `labelHoveredGroupId`, `hoveredProgId`, `hoveredModId`, `hoveredModeZoneId`
- `useEditorDrag()` → état drag + handlers `onMove`/`onUp`
- **Complexité** : L · 1 jour

### [P2-3] `noteZone()` et `noteZoneCompact()` quasi-identiques → unifier
- **Fichier** : `TablatureR3F.tsx:177-213`
- Les deux fonctions partagent 80% de leur logique
- **Fix** : une seule fonction `computeNoteZone(lx, w, invStretchX, options: {compact?: boolean, showBubble?: boolean})`
- **Complexité** : S · 1 heure

### [P2-4] Shader vertex dupliqué (PodGradient + ModeZoneGradient)
- **Fichier** : `TablatureR3F.tsx:388-394` et `TablatureR3F.tsx:456-461`
- Même vertex shader `varying vec2 vPos; void main() {...}` recopié 2 fois
- **Fix** : `const SHARED_POS_VERT = ...` utilisé par les deux materials
- **Complexité** : S · 30 min

### [P2-5] ChordPod et ProgressionPod rendering quasi-identiques
- **Fichier** : `TablatureR3F.tsx:1858-1950` (progression) vs `~2000-2060` (chord)
- Structure identique : header mesh + hit area + sticky disc Html
- **Fix** : `<PodHeaderTemplate>` partagé, paramétré par couleur/géo/handlers
- **Complexité** : M · 2 heures

### [P2-6] TablatureMoveService — chord/prog handlers 90% identiques
- **Fichier** : `src/services/TablatureMoveService.ts:46-136`
- `handleChordGroupMove` et `handleProgGroupMove` — copie de code, bug fixé dans l'un mais pas l'autre
- **Fix** : extraire `handleGroupMove(d: DragGroupState, ...)` générique, les deux appellent le même handler
- **Complexité** : S · 1 heure

---

## 🟠 PHASE 3 — RÉORGANISATION DOSSIERS (1 jour)

### [P3-1] `src/composables/` contient des fichiers de données pures — confusion totale
- **Fichiers à déplacer** vers `src/data/` :
  - `src/composables/rhythmPatterns.ts` — données statiques
  - `src/composables/extraModes.ts` — données statiques
  - `src/composables/progressions.ts` — données statiques
  - `src/composables/chords.ts` — données statiques
  - `src/composables/chord-charts.ts` — données statiques
  - `src/composables/tonalChordsMapping.ts` — données + mappings
- **Fichiers à déplacer** vers `src/hooks/` :
  - `src/composables/useAudio.ts`
  - `src/composables/useGuitarChords.ts`
  - `src/composables/useGuitarNotes.ts`
  - `src/composables/useMidiUtils.ts`
  - `src/composables/useNoteHelpers.ts`
  - `src/composables/useUIState.ts`
- **Complexité** : M · 1 jour (+ mise à jour de tous les imports)

### [P3-2] `src/types/` incomplet — consolider
- Actuellement : seulement `tablatureDrag.ts`
- Ajouter : `src/types/index.ts` qui ré-exporte `ModeGuitar` (de `types.ts` racine), `ChordProgression`, `RhythmPatternDef`
- **Complexité** : S · 30 min

---

## 🟠 PHASE 4 — SERVICES & QUALITÉ (2 jours)

### [P4-1] Services couplés au store via getState() direct — pas d'injection
- **Fichiers** : `PodModifierService.ts`, `RhythmModifierService.ts`, `ModeZoneService.ts`, `TablatureDropService.ts`, `TablatureMoveService.ts`
- Tous appellent directement `useTablatureR3FStore.getState()` ou `useTablatureStore.getState()`
- **Problème** : impossible de tester unitairement, couplage fort, races potentielles
- **Fix** : passer le `state` (ou les actions nécessaires) en paramètre des fonctions (ou utiliser un provider pattern)
- **Complexité** : L · 4 heures

### [P4-2] RhythmModifierService — mutations séquentielles sans transaction
- **Fichier** : `src/services/RhythmModifierService.ts:265-298`
- `materializeLegatoRhythm()` exécute 5+ mutations store en séquence — si échec à mi-parcours, état corrompu
- **Fix** : `pushHistory()` une seule fois en début ; collecter toutes les mutations dans un objet puis appliquer atomiquement via un seul `set()`
- **Complexité** : M · 3 heures

### [P4-3] RhythmModifierService — pas de pre-flight check sur notes déjà en legato
- **Fichier** : `src/services/RhythmModifierService.ts:254-298`
- Materialiser un rythme sur un accord contenant des notes en `legatoNext` écraserait silencieusement les chaînes
- **Fix** : avant materialisation, vérifier `note.legatoNext === undefined` pour chaque note du chord
- **Complexité** : M · 1 heure

### [P4-4] LegatoLine souscrit à `notes` entier — re-render sur chaque note
- **Fichier** : `TablatureR3F.tsx:271`
- `const notes = useTablatureR3FStore(s => s.notes)` — subscribe à tout
- **Fix** : sélecteur ciblé `s => s.notes.filter(n => n.id === sourceId || n.id === destId || source?.intermediateNoteIds?.includes(n.id))`
- **Complexité** : S · 30 min

### [P4-5] ModeZone `getZoneBounds` — params `_allZones` et `_totalMeasures` ignorés mais présents
- **Fichier** : `src/services/ModeZoneService.ts:30-32`
- Les underscores indiquent un design incomplet — la gestion des overlaps n'est pas implémentée
- **Fix** : soit supprimer les params inutiles, soit implémenter la gestion des overlaps (zones qui se chevauchent)
- **Complexité** : M · 1 heure

### [P4-6] Géométries Three.js — disposal fragilisé par le nettoyage sur changement d'aspect ratio
- **Fichier** : `TablatureR3F.tsx:1544-1553`
- `useEffect([invXKey])` détruit TOUT le cache géométrique à chaque changement d'aspect ratio
- **Fix** : invalider uniquement les géométries dépendantes de `invStretchX` (rounded rects) pas toutes
- **Complexité** : S · 1 heure

---

## ⚪ PHASE 5 — PERFORMANCE (1 jour, Alex Chen)

### [P5-1] `useTablatureR3FStore()` sans sélecteur dans TablatureScene
- `TablatureScene` destructure 30+ propriétés sans sélecteur → re-render entier sur tout changement du store
- **Fix** : scinder en plusieurs souscriptions ciblées ou utiliser `useShallow`
- **Complexité** : M · 2 heures

### [P5-2] `rootNoteIds` useMemo trop large
- Se retrigger sur tout changement de `notes` ou `chordGroups` même si seul `startBeat` change
- **Fix** : dépendance plus fine (seulement `chordGroups.map(g => g.chordName + g.noteIds.join(','))`)
- **Complexité** : S · 20 min

### [P5-3] midiList SmartFretboard sans cache par chordName
- **Fix** : `useMemo` avec `tabHoveredChordName` seul en dépendance
- **Complexité** : S · 15 min

---

## 🟢 FEATURES FUTURES (roadmap)

### [F1] Export MIDI
### [F2] Export PDF/tablature imprimable
### [F3] Sauvegarde projet JSON (actuellement éphémère)
### [F4] Raccourcis clavier — aide/overlay (Ctrl+?)
### [F5] Édition corde depuis clavier (flèches haut/bas)
### [F6] Preview progression avant drop
### [F7] Hover Mode Zone → scale degrees sur le manche

---

## 📌 RÈGLES ARCHITECTURALES (James Edison — à respecter dès maintenant)

1. **Aucune logique algorithmique dans les stores** → `src/utils/` ou `src/services/`
2. **Les services ne font pas de getState() direct** → recevoir le state en paramètre
3. **Aucun fichier de données dans `src/composables/`** → `src/data/`
4. **Les composants R3F ne lisent pas le store entier** → sélecteurs ciblés obligatoires
5. **playbackBeat = ref, jamais Zustand** (Eva, veto permanent)
6. **Tout nouveau pod partagent `<PodHeaderTemplate>`** → pas de copier-coller chord/progression
7. **Tuning lu via `getTuning()` uniquement** (quand créé en P1-5)
8. **HistoryEntry doit capturer tout état UI impacté par undo**
