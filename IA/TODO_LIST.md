# TabSeek — TODO List

> Mis à jour après chaque tour de table. Dernière mise à jour : 2026-07-01 (session 10 — P2-1 PlaybackIndicator + ModePods + RhythmModifierPod/Pods + tablatureGeometry.ts).

---

## 🟠 PHASE 2 — ARCHITECTURE · TablatureR3F DÉCOMPOSITION (en cours — sessions 8-10)

> **Prérequis** : Phase 1 terminée. ✅ Décomposer sans changer le comportement.

### [P2-0] ✅ Extraction sessions 8-10 (cumulé — **-641 lignes TablatureR3F**)
- `src/types/mode.d.ts` — ModeGuitar migré depuis `src/types.ts` racine
- `src/utils/tablatureGeometry.ts` — `roundedRect`, `leftCircleRect`, `buildBeatGeo`, `buildMeasGeo`
- `src/hooks/useEditorSelection.ts` — 10 useState/useRef de sélection (21→7 useState dans TablatureScene)
- `src/hooks/useEditorHover.ts` — 5 useState de hover + `dragHoverSi` + useEffect fretboard
- `src/components/tablature/scene/ModeZoneTint.tsx` — tint gradient zones Mode (store direct)
- `src/components/tablature/scene/PlaybackIndicator.tsx` — curseur de lecture (`forwardRef`)
- `src/components/tablature/scene/ModePods.tsx` — pods mode + disques + drag
- `src/components/tablature/scene/RhythmModifierPod.tsx` — un pod rythme (SRP)
- `src/components/tablature/scene/RhythmModifierPods.tsx` — liste filtrée (store direct)
- TSDoc `@file` + docs exports : tous les services, stores, hooks principaux
- TablatureR3F : **2736 → 2095 lignes** · **21 → 7 `useState`**

### [P2-1] TablatureR3F.tsx — **2095 lignes** · 4 sous-composants restants
- ✅ `<ModeZoneTint />` — gradient shader zones mode
- ✅ `<PlaybackIndicator />` — curseur de lecture + flèche
- ✅ `<ModePods />` — pods mode
- ✅ `<RhythmModifierPods />` — pods rythme flottants
- `<SceneBackground />` — grille, marges, lanes (handlers drag partagés)
- `<NotePods />` — notes individuelles + legato lines (~400L de JSX)
- `<ChordPods />` — pods accord + disques
- `<ProgressionPods />` — pods progression
- **Complexité restante** : XL · 1-2 jours

### [P2-5] ChordPod et ProgressionPod rendering quasi-identiques
- Structure identique : header mesh + hit area + sticky disc Html
- **Fix** : `<PodHeaderTemplate>` partagé, paramétré par couleur/géo/handlers
- **Complexité** : M · 2 heures

### [P2-6] ✅ TablatureMoveService — `handleGroupMoveShared` extrait (fait en session 8)

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
