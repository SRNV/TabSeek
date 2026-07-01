# TabSeek — TODO List

> Mis à jour après chaque tour de table. Dernière mise à jour : 2026-07-01 (session 14 — F5 + F7 + F6 terminés).

---

## ✅ FEATURES TERMINÉES

### [RGRS-02] Pods de notes inertes (InstancedMesh raycast figé) — DONE
- **Bug majeur** : plus aucune action possible sur le corps d'un pod de note (clic, sélection, drag) après la migration Phase B vers `NotePodsInstanced`. Le disque (`NoteDisc`, DOM `<Html>`) continuait de répondre — piège qui a fait durer le diagnostic 5-6 sessions.
- **Root cause** : `THREE.InstancedMesh.raycast()` met en cache `boundingSphere` de façon définitive dès le premier calcul (lazy) — jamais réinvalidé par R3F quand `instanceMatrix`/`count` changent ensuite. Confirmé dans `node_modules/three/src/objects/InstancedMesh.js:270`.
- **Fix** : `mesh.boundingSphere = null` à la fin des `useEffect` de synchro `bodyMesh`/`selMesh` dans `NotePodsInstanced.tsx`, forçant le recalcul au prochain raycast.
- **Vérifié en live** via `agent-browser` (clic précis sur canvas par dispatch d'événements natifs) : sélection + drag confirmés fonctionnels après fix, captures à l'appui.
- **Postmortem complet** : `IA/MEMORY.md` §18. Règle architecturale généralisée : §16.6b. Test anti-régression : `T-NOTE` N-21. Process QA formalisé (vérification live `agent-browser` obligatoire pour bugs d'interaction R3F) : `IA/ROLES.md`, étape 11 du Ticket Review.

### [F2] Export PDF/tablature imprimable — DONE
- A4 portrait, Courier Bold 9pt, 3 mesures/ligne, espacement 6 mm
- Widths proportionnels au nombre de notes par mesure
- Stems + beams + flags (croches, doubles-croches)
- Noms d'accords (bleu bold italic 9pt) + numéros de mesure
- Labels progression (vert italic 6pt) : `prog: Nom (Am, G, F)`
- Expansion des rhythm modifier virtual notes pour le rendu PDF
- Carrés blancs dimensionnés dynamiquement (getTextWidth) pour masquer les lignes
- Header : titre, accordage, tempo, date de création
- Footer : nom · tempo · TabSeek · pagination

### [F3] Sauvegarde projet JSON — DONE
- Sérialisation/désérialisation complète ProjectData
- Import/export fichier .json via FileReader

### [F5] Édition corde depuis clavier (↑/↓) — DONE
- ↑/↓ déplace la note sélectionnée d'une corde en conservant le MIDI (fret recalculé)
- Blocage si pitch impossible sur la corde cible (fret hors 0-24) ou borne atteinte
- 7 tests KB-01..KB-07 dans `TablatureKeyboard.test.ts`

### [F6] Preview progression avant drop — DONE
- `computeDropPreview(prog, si, beat, tuning, scalePc): PreviewNote[]` — pure function dans `TablatureDropService`
- `PreviewNote` interface exportée (`si, fret, startBeat, duration, chordName`)
- `previewNotes: PreviewNote[] | null` + `setPreviewNotes` ajoutés à `useMainStore`
- `eventBus.emit('chordDragStart')` dans `ChordsList.tsx` (idem `progressionDragStart` existant)
- `chordDragStart: ChordProgression` ajouté aux `Events` dans `src/types/events.ts`
- `useTablatureFileDrop.ts` : écoute eventBus, cache payload ref, preview throttlée `${si}:${beat}`, clear on leave/drop
- `GhostNotePods.tsx` : plans semi-transparents (#88ccff, opacity 0.35) aux coordonnées monde correctes
- Intégré dans `TablatureR3F.tsx` avant le `PlaybackIndicator`
- 5 tests F6-01..F6-05 dans `DropPreview.test.ts` — tous verts

### [F7] Hover Mode Zone → scale degrees sur le manche — DONE
- `ModeZoneService.getScaleHighlights(zone, tuning, userScale)` : tous les frets de chaque degré, colorés par DEGREE_COLORS
- `DEGREE_COLORS` extrait dans `src/utils/musicColors.ts` (partagé Tab.tsx + ModeZoneService)
- `ModePods.tsx` : `onPointerEnter` → `FretboardHighlightService.setHighlights`, `onPointerLeave` → `clearHighlights`
- 6 tests F7-01..F7-06 dans `ModeZoneHighlight.test.ts`

### [ERG-1] Ergonomie des voicings dans les progressions — DONE
- `positionPenalty = fMax * fMax * 1.5` (quadratique) dans `scoreVoicing`
- `voiceLeadCost` ×15 → ×20 pour continuité inter-accords
- `prevDropVoicing` dans `TablatureDropService`, `prevTemplateVoicing` dans `PodModifierService`
- 6 tests ERG (ERG-01..ERG-06) dans `guitarUtils.test.ts` — tous verts

---

## 🟡 EN COURS / PRIORITÉ


---

## 🔴 À FAIRE

### [F1] Export MIDI
### [F4] Raccourcis clavier — aide/overlay (Ctrl+?) — spec à définir

---

---

## 🔵 BACKLOG DATA — `src/data/` Enrichissement

> Issu du débat équipe (session 12). Priorisé par Jean, validé par Bryan (tests), Dr. Kouyaté (cultures), Eva (types stricts).

### Complétude des accords (`chords.ts`)

- **B-3** — Ajouter ≥ 3 positions par type d'accord (actuellement 1-2 max pour les types altérés). Priorité : accords de couleur (maj7#5, maj7b5, 7#9#11, min13, etc.) · _Responsable : Jean + Alex (UX guitare)_
- ✅ **Q-3** — DONE · `TonalChordType` exporté depuis `tonalChordsMapping.ts` (`as const` + `typeof TONAL_CHORD_TYPES[number]`). `CHORDS` typé en `Record<TonalChordType, ChordTypeDef>`. 5 call-sites castés `as TonalChordType` (`useGuitarChords` ×2, `ChordTab`, `PodModifierService` ×3). · _Eva_

### Rythmes — `rhythmPatterns.ts`

- ✅ **C-1** — DONE · Flamenco : Alegrías (12/8, compás 12 temps, accents 0-3-6-7-9-11), Tangos (4/4 syncopé 16 steps), Farruca (4/4 grave 2×8 steps)
- ✅ **C-2** — DONE · Carnatic : Misra Chapu (7/8=3+4, euclid snare/hihat), Khanda Chapu (5/8=2+3), Rupakam (6/8=3+2+1)
- ✅ **C-3** — DONE · Usul turcs : Düyek (8/8=3+2+3), Sengin Semai (10/8=3+2+2+3)
- ✅ **C-4** — DONE · Polyrhythmie africaine : Bell Pattern Ewe (12/8, gankogui 7 hits/12), Fanga malien (6/8, dundun+djembe+sangban, pattern Mandingue)

### Grilles — `chord-charts.ts`

- ✅ **C-5** — DONE · 5 jazz standards ajoutés dans `chord-charts.ts` : 'Round Midnight (Monk), Cherokee (Noble, AABA 64 bars), Wave (Jobim), Corcovado (Jobim), Have You Met Miss Jones (Rodgers, pont bVI/bIV anticipant Coltrane)

### Progressions — `progressions.ts`

- ✅ **C-6** — DONE · Renaissance/Baroque : Lamento bass (i-VII-bVII-bVI-V), Chaconne enrichie (i-bVII-bVI-V), Basse obstinée (i-iv-V-i), Romanesca (bIII-bVII-i-V), Passacaille (i-iv-i-V-i-bVI-bIII-V). Doublons résolus (ancienne Romanesca → "Basse baroque en majeur", Chaconne baroque fusionnée, Čoček dédupliqué).
- ✅ **C-7** — DONE · Balkan/aksak : Pajduško (5/8, i-V), Račenica (7/8=2+2+3, i-iv-V), Oro (7/8=3+2+2, i-bII-V), Čoček (9/8=2+2+2+3, i-bVII-bVI-V7), Leventiko (9/8=3+2+2+2, i-iv-i-V)

### Qualité — `progressions.ts` + `extraModes.ts`

- ⚠️ **Q-1** — ANNULÉ · **CRITIQUE** : le champ `numerals` dans `progressions.ts` **doit garder `-` comme séparateur de mesure** (pas `|`). L'app parse avec `split('-')` dans 5 endroits : `CompiledProgressionItem.tsx:30`, `ProgressionCompiler.tsx:94`, `PodModifierService.ts:356`, `TablatureDropService.ts:82/122/127`, `ProgressionsList.tsx:27`. La standardisation vers `|` a cassé l'app (session 13 — 153 champs corrigés via script de retour).
- ✅ **Q-2** — DONE · 20 disclaimers 12-TET injectés dans `extraModes.ts` via script `add_12tet.js` : maqams arabes/persans/bayati/saba, byzantine, ragas indiens (yaman/todi/marwa/poorvi/bhairavi/hindu), gammes japonaises (ritusen/yo/hirajoshi/in sen/iwato/kumoi), chinoises (man gong/zhi/shang). · _Dr. Kouyaté / Dr. Tanaka_

### Tests data — `src/data/__tests__/`

- **T-DATA-01** — `chords.ts` : toutes les clés de `TONAL_CHORD_TYPES` ont une entrée dans `CHORDS`
- **T-DATA-02** — `chords.ts` : chaque entrée a ≥ 1 position valide (frets.length === 6)
- **T-DATA-03** — `chords.ts` : aucune description vide ou contenant "(etc.)"
- **T-DATA-04** — `chords.ts` : chaque entrée a un champ `category` non-vide
- **T-DATA-05** — `chord-charts.ts` : chaque grille a `majorKey` et `minorKey` non-vides
- **T-DATA-06** — `chord-charts.ts` : au moins 2 examples par genre culturel représenté
- **T-DATA-07** — `progressions.ts` : chaque progression a au moins 1 `compatibleMode`
- **T-DATA-08** — `progressions.ts` : aucun `numerals` vide
- **T-DATA-09** — `extraModes.ts` : chaque mode a `description`, `culture`, `category`
- **T-DATA-10** — `extraModes.ts` : tous les `intervals` sont des notations Tonal.js valides ("1P", "3m", etc.)
- **T-DATA-11** — `rhythmPatterns.ts` : chaque pattern a ≥ 1 track non-vide
- **T-DATA-12** — `rhythmPatterns.ts` : tous les `timeSignature` sont du format `N/M`
- **T-DATA-13** — Cross-check : chaque `compatibleMode` référencé dans progressions existe dans extraModes (par `name` ou `aliases`)
- **T-DATA-14** — Cross-check : chaque `compatibleGenre` référencé dans rhythmPatterns a au moins une grille dans chord-charts
- **T-DATA-15 à T-DATA-32** — Réservé : tests non-régression culturels (validation Dr. Ndiaye + Dr. Kouyaté) · _À définir session suivante_

> **Responsable tests** : Bryan O'Conor + Dr. Ndiaye (validation données africaines) · **Cible** : 0 régression sur données existantes avant d'ajouter C-1..C-7

---

## 📌 RÈGLES ARCHITECTURALES (James Edison — à respecter dès maintenant)

1. **Aucune logique algorithmique dans les stores** → `src/utils/` ou `src/services/`
2. **Les services ne font pas de getState() direct** → recevoir le state en paramètre
3. **Aucun fichier de données dans `src/composables/`** → `src/data/`
4. **Les composants R3F ne lisent pas le store entier** → sélecteurs ciblés obligatoires
5. **Interdiction des sélecteurs objet-littéral sans `useShallow`** → `useTablatureR3FStore(s => ({ a: s.a }))` provoque une boucle infinie de re-renders. Utiliser `useShallow` ou des sélecteurs atomiques.
6. **playbackBeat = ref, jamais Zustand** (Eva, veto permanent)
7. **Tout nouveau pod partage `<PodModifierDisc>` + `<PodModifierPopover>`** → pas de copier-coller chord/progression
8. **Tuning lu via `getTuning()` uniquement** (quand créé en P1-5)
9. **HistoryEntry doit capturer tout état UI impacté par undo**
