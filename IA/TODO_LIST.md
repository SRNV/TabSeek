# TabSeek — TODO List

> Mis à jour après chaque tour de table. Dernière mise à jour : 2026-07-01 (session 13 — PDF finalisé, F5 en cours).

---

## ✅ FEATURES TERMINÉES

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

---

## 🟡 EN COURS / PRIORITÉ

### [F5] Édition corde depuis clavier (flèches haut/bas)
- Note sélectionnée : ↑ monte d'une corde, ↓ descend d'une corde
- Garder le même fret ou recalculer l'équivalent (à décider)

---

## 🔴 À FAIRE

### [F1] Export MIDI
### [F4] Raccourcis clavier — aide/overlay (Ctrl+?) — spec à définir
### [F6] Preview progression avant drop
### [F7] Hover Mode Zone → scale degrees sur le manche

---

---

## 🔵 BACKLOG DATA — `src/data/` Enrichissement

> Issu du débat équipe (session 12). Priorisé par Jean, validé par Bryan (tests), Dr. Kouyaté (cultures), Eva (types stricts).

### Complétude des accords (`chords.ts`)

- **B-3** — Ajouter ≥ 3 positions par type d'accord (actuellement 1-2 max pour les types altérés). Priorité : accords de couleur (maj7#5, maj7b5, 7#9#11, min13, etc.) · _Responsable : Jean + Alex (UX guitare)_
- **Q-3** — Typer `CHORDS` en `Record<TonalChordType, ChordsCompleteDef>` strict pour vérification exhaustive à la compilation. Nécessite export du type union depuis `tonalChordsMapping.ts`. · _Responsable : Eva (compile-time safety)_

### Rythmes — `rhythmPatterns.ts`

- **C-1** — Flamenco : ajouter Alegrías (3/4, 12 temps), Tangos (4/4 à 2 tiempos), Farruca (4/4, 4×4) · _Valider avec Dr. Kouyaté_
- **C-2** — Tâlas carnatic : Misra Chapu (7 temps = 3+4), Khanda Chapu (5 temps = 2+3), Rupakam (6 temps = 3+2+1) · _Valider intervalles avec sources IRCAM_
- **C-3** — Usul turcs : Düyek (8/8 = 3+2+3), Sengin Semai (10/8 = 3+2+2+3) · _Complémentaire Karşılama déjà présent_
- **C-4** — Polyrhythmie africaine : bell pattern Ewe (12/8 = cycle de 7 sur 12), Fanga malien (6/8, pattern Mandingue) · _Dr. Ndiaye recommande sources Nzewi (SOAS)_

### Grilles — `chord-charts.ts`

- **C-5** — Jazz standards manquants : Round Midnight (Monk), Cherokee (Ray Noble), Wave (Jobim), Corcovado (Jobim), Have You Met Miss Jones (Rodgers) · _Jean prioritise Round Midnight (chromatisme Monk)_

### Progressions — `progressions.ts`

- **C-6** — Renaissance/Baroque : passacaille (basse obstinée chromatique), chaconne (i-bVII-bVI-V), ground bass (i-iv-V7-i) · _Contexte historique pour pédagogie_
- **C-7** — Balkan / aksak : progressions sur 7/8, 9/8, cycles asymétriques (ex. 2+2+3, 3+3+2+2) · _Complément rythmes Karşılama déjà présents_

### Qualité — `progressions.ts` + `extraModes.ts`

- **Q-1** — Standardiser séparateur de mesure `-` → `|` dans tous les champs `numerals` de `progressions.ts` (cohérence avec `chord-charts.ts`) · _Refactor non-breaking, rechercher/remplacer ciblé_
- **Q-2** — Ajouter disclaimer 12-TET dans toutes les descriptions de maqams et ragas (`extraModes.ts`) : préciser que les intervalles sont des approximations tempérées d'intervalles microtonal · _Validation Dr. Kouyaté / Dr. Tanaka_

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
