# TabSeek — TODO List

> Mis à jour après chaque tour de table. Dernière mise à jour : 2026-07-01 (session 11 — bugfixes : Minimap cursor, legato labels, click-outside popover).

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
5. **Interdiction des sélecteurs objet-littéral sans `useShallow`** → `useTablatureR3FStore(s => ({ a: s.a }))` provoque une boucle infinie de re-renders. Utiliser `useShallow` ou des sélecteurs atomiques.
6. **playbackBeat = ref, jamais Zustand** (Eva, veto permanent)
7. **Tout nouveau pod partage `<PodModifierDisc>` + `<PodModifierPopover>`** → pas de copier-coller chord/progression
8. **Tuning lu via `getTuning()` uniquement** (quand créé en P1-5)
9. **HistoryEntry doit capturer tout état UI impacté par undo**
