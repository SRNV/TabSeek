# TabSeek — TODO List

> Mis à jour après chaque tour de table. Dernière mise à jour : 2026-07-01 (session 5 — traitement TODO + refactoring architecture).

---

## ✅ TRAITÉS EN SESSION 5

| Item | Fix |
|---|---|
| C1 Progression hover fretboard | `TablatureR3F.tsx` ~1882 — `FretboardHighlightService.setHighlights()` ajouté sur la progression pod |
| C2 Icônes PWA | `public/icon-192.png` + `public/icon-512.png` générés (cercle orange TabSeek) |
| C3 PreferencesService | Catch vides → `console.warn` avec clé et erreur |
| M1 Console.log prod | `main.tsx`, `SoundFontService.ts`, `useGuitarChords.ts`, `useNoteHelpers.ts` nettoyés |
| M3/M4 Tuning doc | `useTablatureStore.ts` — JSDoc complet sur `tuning` + convention d'ordre documentée ; `useGuitarChords.ts` — `REFERENCE_TUNING` commenté |
| M5 Validation Chord.get | `TablatureDropService.ts` — vérification `chordData.empty` avant voicing |
| M7 Fret hors-bornes | `ModeZoneService.ts` — skip `f < 0 \|\| f > 24` dans `getVirtualFret` |
| A1 Extraire legatoUtils | `src/utils/legatoUtils.ts` — `syncLegatoHelper` (169L), `detectChordName`, `isRhythmLegatoLocked`, `getNoteNameFromFret` extraits du store |
| A2 Typer eventBus | `eventBus.ts` — `playProgression`/`progressionDragStart` : `any` → `ChordProgression` |
| A3 Typer drag service | `src/types/tablatureDrag.ts` + `TablatureMoveService.ts` — `d: any` → union discriminée typée |

**Résultat** : `useTablatureR3FStore.ts` 834 → **628 lignes** (-24%), 0 `any` dans les services critiques.

---

## 🔴 CRITIQUE (UX bloquant / régressif)

### ~~[C1] Progression pod hover~~ ✅ résolu session 5

### ~~[C1] (archive) Progression pod hover ne highlight pas le manche
- **Fichier** : `TablatureR3F.tsx` ~ligne 1882
- `onPointerEnter` du progression pod fait `setHoveredProgId()` mais **n'appelle pas** `FretboardHighlightService.setHighlights()`
- **Attendu** : survoler une progression → toutes les notes de tous ses accords s'allument sur le SmartFretBoard
- **Pattern** : identique au chord pod hover fixé en session 3 (lignes 2092-2093)

### [C2] Icônes PWA manquantes
- **Fichier** : `public/` — `icon-192.png` et `icon-512.png` absents
- `vite.config.ts:18-19` référence ces fichiers — PWA installable mais icône cassée
- **Fix** : générer deux PNG (192×192 et 512×512) depuis le logo du projet

### [C3] PreferencesService catch vides — silently fail
- **Fichier** : `src/services/PreferencesService.ts:8,16,22`
- Les préférences échouent silencieusement (localStorage) — aucune notification utilisateur
- **Fix** : logger l'erreur + fallback sur valeur par défaut visible

---

## 🟡 AMÉLIORATIONS COURT TERME

### [M1] Console.log en production à retirer
| Fichier | Ligne | Message |
|---|---|---|
| `src/main.tsx` | 10 | `console.log(midi)` |
| `src/services/SoundFontService.ts` | 298, 374 | Logs SF2 chargement/preset |
| `src/composables/useGuitarChords.ts` | 43 | `console.error` en français |
| `src/composables/useNoteHelpers.ts` | 145 | `console.error` en français |
| `src/services/GuitarSelectionService.ts` | 46 | `console.warn` sans contexte |

### [M2] Types `any` à corriger (dettes TypeScript)
| Fichier | Lignes | Problème |
|---|---|---|
| `src/eventBus.ts` | 10-11 | `playProgression: any` → typer avec `ChordProgression` |
| `src/stores/useTablatureStore.ts` | 87-90, 199 | Params progression et frets non typés |
| `src/services/TablatureMoveService.ts` | 11, 46, 90 | `d: any` → union discriminée des types DragXxx |
| `src/composables/useGuitarNotes.ts` | 15-22 | Champs du mode non typés |
| `src/components/chords/ChordsList.tsx` | 13, 27, 44 | `chord: any` → utiliser l'interface existante |
| `TablatureR3F.tsx` | 98, 438-439, 1188 | Casts `as any` évitables |

### [M3] `tuningArray()` — absence de documentation
- **Fichier** : `src/stores/useTablatureStore.ts:130`
- `.reverse()` est intentionnel (vue grille legacy) mais non documenté → source de bugs potentiels
- **Fix** : ajouter un JSDoc expliquant la convention inversée vs ordre direct R3F

### [M4] Duplication de la définition du tuning
- `useTablatureStore.ts:123` : `'E2,A2,D3,G3,C4,E4'` (hardcodé)
- `src/composables/useGuitarChords.ts:7` : `REFERENCE_TUNING` défini séparément
- **Fix** : `useGuitarChords.ts` doit importer depuis `useTablatureStore` ou une constante partagée

### [M5] Validation manquante dans TablatureDropService
- **Fichier** : `src/services/TablatureDropService.ts:127-150`
- `Chord.get()` peut échouer silencieusement si le nom d'accord est invalide
- **Fix** : vérifier `chord.empty` avant de construire le voicing

### [M6] Copy/paste sans feedback visuel
- **Fichier** : `TablatureR3F.tsx:1407-1428`
- Ctrl+C / Ctrl+V fonctionne mais aucun toast/indicateur pour l'utilisateur
- **Fix** : afficher une notification temporaire "X note(s) copiées" / "Collé"

### [M7] Mode Zone `getVirtualFret` — cas limite octave supérieure
- **Fichier** : `src/services/ModeZoneService.ts:73-95`
- `findFretForPc()` peut retourner une frette invalide si la hauteur cible dépasse la 24ème
- **Fix** : vérifier que le résultat est dans `[0, 24]` et retourner `null` sinon

---

## 🟢 FEATURES MANQUANTES

### [F1] Export MIDI
- Aucune fonctionnalité d'export actuellement
- Les données (`notes`, `chordGroups`, `tempo`) sont toutes disponibles dans le store
- **Lib suggérée** : `@tonejs/midi` ou `midi-writer-js`

### [F2] Export PDF / tablature imprimable
- Rendu de la tablature en notation ASCII ou image SVG/PDF
- Priorité après MIDI

### [F3] Sauvegarde projet (JSON)
- La tablature est éphémère (pas de persistance localStorage R3F)
- **Fix** : sérialiser `useTablatureR3FStore` en JSON (export/import fichier)

### [F4] Aide / raccourcis clavier
- **Fichier** : `TablatureR3F.tsx:1387-1456`
- Raccourcis existants : Undo, Redo, Delete, Select All, Ctrl+C, Ctrl+V, Ctrl+G, Ctrl+M
- Aucun moyen de les découvrir (pas de modal ? ou help menu)
- **Fix** : touche `?` ou `F1` → overlay des raccourcis

### [F5] Édition de la corde depuis le clavier
- Cliquer le disque d'une note ouvre l'édition de frette, mais pas de la corde
- **Fix** : flèches haut/bas pour changer de corde pendant l'édition

### [F6] Preview template de progression avant drop
- L'utilisateur ne sait pas quels accords vont être générés avant de déposer
- **Fix** : tooltip au survol de chaque progression dans la liste

### [F7] Hover Mode Zone → scale degrees sur le manche
- Survoler un pod Mode devrait afficher les degrés de la gamme du mode sur le SmartFretBoard
- Similaire au chord pod hover (session 3)

---

## 🔵 ARCHITECTURE / DETTE TECHNIQUE

### [A1] Copie locale de `isLegatoLocked` dans le store
- **Fichier** : `src/stores/useTablatureR3FStore.ts` (isRhythmLegatoLocked, ligne ~130)
- Dupliqué depuis `RhythmModifierService.ts` pour éviter l'import circulaire
- **Solution** : extraire dans un fichier utilitaire partagé `src/utils/legatoUtils.ts`

### [A2] `eventBus.ts` non typé
- **Fichier** : `src/eventBus.ts:10-11`
- `playProgression: any` et `progressionDragStart: any` — perte de sécurité type sur les événements inter-composants
- **Fix** : définir les interfaces des payloads

### [A3] Validation fret input sans borne supérieure
- **Fichier** : `TablatureR3F.tsx:1485`
- Input accepte 0-24 mais ne valide pas que la note existe sur le manche selon le tuning
- **Fix** : calculer la frette max atteignable par corde et valider dynamiquement

---

## ⚪ PERFORMANCE (faible risque mais notable)

### [P1] `rootNoteIds` recompté à chaque render
- **Fichier** : `TablatureR3F.tsx:1682-1691`
- `useMemo` présent mais se retriggère si `notes` ou `chordGroups` changent — même pour des changements de `startBeat`/`duration` qui n'affectent pas les noms de notes
- **Fix** : dépendance plus fine (seulement `chordName` et `noteIds`)

### [P2] `midiList` SmartFretboard recompté à chaque hover
- **Fichier** : `src/components/SmartFretboard.tsx:51-63`
- Recompute sur chaque changement de `tabHoveredChordName` sans cache
- **Fix** : `useMemo` avec `tabHoveredChordName` en dépendance

### [P3] Fonctions `onNoteDown` non mémoïsées
- **Fichier** : `TablatureR3F.tsx:1736`
- Calcul de zones legato à chaque pointeur-bas — pourrait être memoïsé par `note.id`

---

## ✅ RÉSOLU (historique)

### [R1] Tuning octave — C3 → C4 *(2026-07-01)*
### [R2] Architecture tuning vérifiée *(2026-07-01 session 2)*
### [R3] A2 — `getNoteName` propagation octave validée *(2026-07-01 session 2)*
### [R4] Tests T1–T4 validés par inspection *(2026-07-01 session 2)*
### [R5] Hover chord pod → highlight SmartFretBoard *(2026-07-01 session 3)*
- `TablatureR3F.tsx` ~ligne 2092 — `FretboardHighlightService.setHighlights()` ajouté

---

## 📌 NOTES TRANSVERSALES

- Tuning actuel : `'E2,A2,D3,G3,C4,E4'` — source unique dans `useTablatureStore.ts`
- `tuningArray()` inverse l'ordre (vue grille legacy) — convention intentionnelle documentée
- `B1 "Force Note" du pod Mode` : abandonné — non reproductible de façon fiable
- Aucun framework d'internationalisation (i18n) — messages d'erreur en français dans le code
