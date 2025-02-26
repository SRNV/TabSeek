// Liste complète des types d'accords disponibles dans Tonal.js
export const TONAL_CHORD_TYPES = [
  // Triades de base
  "major", "minor", "augmented", "diminished",
  // Accords de septièmes
  "7", "maj7", "min7", "minMaj7", "dim7", "7b5", "aug7",
  // Accords de sixte
  "6", "min6",
  // Accords de neuvième
  "9", "maj9", "min9", "minMaj9",
  // Accords avec 11
  "11", "maj11", "min11",
  // Accords avec 13
  "13", "maj13", "min13",
  // Accords suspendus
  "sus2", "sus4", "7sus4", "9sus4",
  // Accords ajoutés
  "add9", "madd9",
  // Accords altérés
  "7b9", "7#9", "7#11", "7b13", "7#9#11", "7#9b13", "7b9#11", "7b9b13",
  // Accords spécifiques
  "maj7#5", "maj7b5", "maj7#11", "maj13#11", "min7b5", "min7#5",
  // Accords de 6/9
  "69", "m69",
  // Autres
  "5", "m#5", "sus24"
];

// Mappings entre les noms d'accords communs et les noms Tonal.js
export const CHORD_NAME_MAPPINGS = {
  // Triades
  "major": "major",
  "maj": "major",
  "M": "major",
  "minor": "minor",
  "min": "minor",
  "m": "minor",
  "dim": "diminished",
  "°": "diminished",
  "aug": "augmented",
  "+": "augmented",
  
  // Septièmes
  "7": "7",
  "maj7": "maj7",
  "M7": "maj7",
  "Δ7": "maj7",
  "m7": "min7",
  "min7": "min7",
  "mM7": "minMaj7",
  "minMaj7": "minMaj7",
  "m(maj7)": "minMaj7",
  "dim7": "dim7",
  "°7": "dim7",
  "m7b5": "min7b5",
  "ø": "min7b5",
  "7b5": "7b5",
  "7#5": "aug7",
  "aug7": "aug7",
  "+7": "aug7",
  
  // Sixtes
  "6": "6",
  "maj6": "6",
  "m6": "min6",
  "min6": "min6",
  
  // Neuvièmes
  "9": "9",
  "maj9": "maj9",
  "M9": "maj9",
  "m9": "min9",
  "min9": "min9",
  "mM9": "minMaj9",
  "minMaj9": "minMaj9",
  
  // Onzièmes
  "11": "11",
  "maj11": "maj11",
  "M11": "maj11",
  "m11": "min11",
  "min11": "min11",
  
  // Treizièmes
  "13": "13",
  "maj13": "maj13",
  "M13": "maj13",
  "m13": "min13",
  "min13": "min13",
  
  // Suspendus
  "sus2": "sus2",
  "sus4": "sus4",
  "7sus4": "7sus4",
  "9sus4": "9sus4",
  
  // Ajoutés
  "add9": "add9",
  "madd9": "madd9",
  "m(add9)": "madd9",
  
  // Altérés
  "7b9": "7b9",
  "7#9": "7#9",
  "7#11": "7#11",
  "7b13": "7b13",
  "7#9#11": "7#9#11",
  "7#9b13": "7#9b13",
  "7b9#11": "7b9#11",
  "7b9b13": "7b9b13",
  
  // Spécifiques
  "maj7#5": "maj7#5",
  "M7#5": "maj7#5",
  "maj7b5": "maj7b5",
  "M7b5": "maj7b5",
  "maj7#11": "maj7#11",
  "M7#11": "maj7#11",
  "maj13#11": "maj13#11",
  "M13#11": "maj13#11",
  "min7#5": "min7#5",
  "m7#5": "min7#5",
  
  // Autres
  "5": "5",
  "power": "5",
  "m#5": "m#5",
  "min#5": "m#5",
  "sus24": "sus24",
  
  // Accords 6/9
  "69": "69",
  "6/9": "69",
  "m69": "m69",
  "min6/9": "m69"
};

/**
 * Convertit un nom d'accord commun vers le format utilisé par Tonal.js
 * @param inputChordType - Le nom d'accord à convertir (ex: "m7", "maj7", "7sus4")
 * @returns Le nom d'accord au format Tonal.js
 */
export function getTonalChordName(inputChordType: string): string {
  return CHORD_NAME_MAPPINGS[inputChordType] || inputChordType;
}

/**
 * Convertit un nom d'accord Tonal.js vers un format plus lisible
 * @param tonalChordType - Le nom d'accord au format Tonal.js (ex: "min7", "maj7", "7sus4")
 * @param preferredNotation - Notation préférée ('short', 'common', 'symbol'), par défaut 'common'
 * @returns Le nom d'accord dans un format plus lisible
 */
export function getReadableChordName(tonalChordType: string, preferredNotation: 'short' | 'common' | 'symbol' = 'common'): string {
  // Mappings inverses pour différentes notations
  const commonMapping: {[key: string]: string} = {
    "major": "maj",
    "minor": "min",
    "diminished": "dim",
    "augmented": "aug",
    "min7": "min7",
    "maj7": "maj7",
    "minMaj7": "minMaj7",
    "dim7": "dim7",
    "min7b5": "min7b5",
  };
  
  const shortMapping: {[key: string]: string} = {
    "major": "M",
    "minor": "m",
    "diminished": "dim",
    "augmented": "aug",
    "min7": "m7",
    "maj7": "M7",
    "minMaj7": "mM7",
    "dim7": "°7",
    "min7b5": "ø",
  };
  
  const symbolMapping: {[key: string]: string} = {
    "major": "",  // Majeur est implicite
    "minor": "m",
    "diminished": "°",
    "augmented": "+",
    "min7": "m7",
    "maj7": "Δ7",
    "minMaj7": "mΔ7",
    "dim7": "°7",
    "min7b5": "ø7",
  };
  
  let mapping: {[key: string]: string};
  
  switch (preferredNotation) {
    case 'short':
      mapping = shortMapping;
      break;
    case 'symbol':
      mapping = symbolMapping;
      break;
    case 'common':
    default:
      mapping = commonMapping;
      break;
  }
  
  return mapping[tonalChordType] || tonalChordType;
}

/**
 * Crée un affichage complet d'accord avec note fondamentale et type d'accord
 * @param rootNote - Note fondamentale (ex: "C", "F#", "Bb")
 * @param chordType - Type d'accord au format Tonal.js
 * @param preferredNotation - Notation préférée pour l'affichage
 * @returns Nom complet de l'accord (ex: "Cmaj7", "F#m7")
 */
export function formatChordName(rootNote: string, chordType: string, preferredNotation: 'short' | 'common' | 'symbol' = 'common'): string {
  const readableType = getReadableChordName(chordType, preferredNotation);
  
  // Si le type d'accord est un accord majeur et que nous utilisons la notation symbolique,
  // nous n'affichons pas le "maj" car l'accord majeur est implicite
  if (chordType === "major" && preferredNotation === 'symbol') {
    return rootNote;
  }
  
  return `${rootNote}${readableType}`;
}

// Map des types d'accords groupés par catégorie avec descriptions
export const CHORD_TYPES_BY_CATEGORY = {
  // Triades de base
  "Triades": {
    description: "Accords fondamentaux à trois notes qui forment la base de l'harmonie occidentale. Utilisés pour établir la tonalité et créer des progressions simples et claires.",
    chords: [
      { id: "major", name: "Majeur", symbol: "", alt: ["M", "maj"] },
      { id: "minor", name: "Mineur", symbol: "m", alt: ["min"] },
      { id: "diminished", name: "Diminué", symbol: "°", alt: ["dim"] },
      { id: "augmented", name: "Augmenté", symbol: "+", alt: ["aug"] }
    ]
  },
  
  // Accords de quinte
  "Quintes": {
    description: "Accords sans tierce, créant un son ouvert et ambigu. Les power chords sont essentiels dans le rock et le métal pour leur puissance et leur simplicité avec distorsion.",
    indice: ['5'],
    chords: [
      { id: "5", name: "Quinte (Power Chord)", symbol: "5", alt: ["power"] },
      { id: "m#5", name: "Mineur dièse 5", symbol: "m♯5", alt: ["min#5"] }
    ]
  },
  
  // Accords suspendus
  "Suspendus": {
    description: "Accords où la tierce est remplacée par une seconde ou quarte, créant une tension qui appelle à une résolution. Idéals pour créer du mouvement et des transitions entre accords.",
    indice: ['sus'],
    chords: [
      { id: "sus2", name: "Suspendu 2", symbol: "sus2", alt: [] },
      { id: "sus4", name: "Suspendu 4", symbol: "sus4", alt: [] },
      { id: "sus24", name: "Suspendu 2-4", symbol: "sus2sus4", alt: [] },
      { id: "7sus4", name: "Septième suspendu 4", symbol: "7sus4", alt: [] },
      { id: "9sus4", name: "Neuvième suspendu 4", symbol: "9sus4", alt: [] }
    ]
  },
  
  // Accords avec notes ajoutées
  "Add": {
    description: "Accords enrichis par l'ajout d'une note sans les intermédiaires. L'ajout d'une neuvième apporte de la couleur et une sonorité moderne sans la complexité des accords de septième.",
    indice: ['add'],
    
    chords: [
      { id: "add9", name: "Ajout neuvième", symbol: "add9", alt: [] },
      { id: "madd9", name: "Mineur ajout neuvième", symbol: "m(add9)", alt: [] }
    ]
  },
  
  // Accords de sixte
  "Sixtes": {
    description: "Accords lumineux et légers, très utilisés dans le jazz, la pop et la bossa nova. Offrent une alternative douce aux accords de septième avec une sonorité moins tendue.",
    indice: ['6'],
    
    chords: [
      { id: "6", name: "Majeur sixte", symbol: "6", alt: ["maj6"] },
      { id: "min6", name: "Mineur sixte", symbol: "m6", alt: ["m6"] },
      { id: "69", name: "Sixte neuvième", symbol: "6/9", alt: ["6add9"] },
      { id: "m69", name: "Mineur sixte neuvième", symbol: "m6/9", alt: ["min6/9"] }
    ]
  },
  
  // Accords de septième
  "Septièmes": {
    description: "Piliers de l'harmonie jazz et blues, ces accords ajoutent profondeur et mouvement. Le 7 dominant crée une tension demandant résolution, tandis que le maj7 offre richesse et sophistication.",
    indice: ['7'],
    
    chords: [
      { id: "7", name: "Septième", symbol: "7", alt: ["dom7"] },
      { id: "maj7", name: "Majeur septième", symbol: "Δ7", alt: ["M7"] },
      { id: "min7", name: "Mineur septième", symbol: "m7", alt: ["m7"] },
      { id: "minMaj7", name: "Mineur majeur septième", symbol: "mΔ7", alt: ["mM7", "m(maj7)"] },
      { id: "dim7", name: "Diminué septième", symbol: "°7", alt: ["dim7"] },
      { id: "min7b5", name: "Demi-diminué", symbol: "ø", alt: ["m7b5"] },
      { id: "aug7", name: "Augmenté septième", symbol: "+7", alt: ["7#5"] },
      { id: "7b5", name: "Septième bémol 5", symbol: "7♭5", alt: [] },
      { id: "maj7#5", name: "Majeur septième dièse 5", symbol: "Δ7♯5", alt: ["M7+5"] },
      { id: "maj7b5", name: "Majeur septième bémol 5", symbol: "Δ7♭5", alt: ["M7b5"] },
      { id: "min7#5", name: "Mineur septième dièse 5", symbol: "m7♯5", alt: ["m7+5"] }
    ]
  },
  
  // Accords de neuvième
  "Neuvièmes": {
    description: "Extensions plus riches apportant des couleurs harmoniques sophistiquées. Très utilisés dans le jazz, la soul et le R&B pour leur expressivité et leur chaleur.",
    indice: ['9'],
    
    chords: [
      { id: "9", name: "Neuvième", symbol: "9", alt: ["dom9"] },
      { id: "maj9", name: "Majeur neuvième", symbol: "Δ9", alt: ["M9"] },
      { id: "min9", name: "Mineur neuvième", symbol: "m9", alt: [] },
      { id: "minMaj9", name: "Mineur majeur neuvième", symbol: "mΔ9", alt: ["mM9"] },
      { id: "7b9", name: "Septième bémol 9", symbol: "7♭9", alt: [] },
      { id: "7#9", name: "Septième dièse 9", symbol: "7♯9", alt: [] }
    ]
  },
  
  // Accords de onzième
  "Onzièmes": {
    description: "Accords complexes et ouverts apportant une richesse harmonique impressionniste. Parfaits pour créer des ambiances planantes ou des transitions évocatrices.",
    indice: ['11'],
    
    chords: [
      { id: "11", name: "Onzième", symbol: "11", alt: [] },
      { id: "maj11", name: "Majeur onzième", symbol: "Δ11", alt: ["M11"] },
      { id: "min11", name: "Mineur onzième", symbol: "m11", alt: [] },
      { id: "7#11", name: "Septième dièse 11", symbol: "7♯11", alt: [] },
      { id: "maj7#11", name: "Majeur septième dièse 11", symbol: "Δ7♯11", alt: [] }
    ]
  },
  
  // Accords de treizième
  "Treizièmes": {
    description: "Les accords les plus complets, incluant potentiellement toutes les notes de la gamme. Utilisés pour des moments de richesse harmonique maximale ou des fins de sections spectaculaires.",
    indice: ['13'],
    
    chords: [
      { id: "13", name: "Treizième", symbol: "13", alt: [] },
      { id: "maj13", name: "Majeur treizième", symbol: "Δ13", alt: ["M13"] },
      { id: "min13", name: "Mineur treizième", symbol: "m13", alt: [] },
      { id: "maj13#11", name: "Majeur treizième dièse 11", symbol: "Δ13♯11", alt: [] },
      { id: "7b13", name: "Septième bémol 13", symbol: "7♭13", alt: [] }
    ]
  },
  
  // Accords altérés composés
  "Altérés composés": {
    description: "Accords avec multiples altérations créant des sonorités très tendues et dissonantes. Utilisés dans le jazz moderne et la musique expérimentale pour leur forte tension et expressivité.",
    indice: ['#', 'b', '♭', '♯'],
    
    chords: [
      { id: "7#9#11", name: "Septième dièse 9 dièse 11", symbol: "7♯9♯11", alt: [] },
      { id: "7#9b13", name: "Septième dièse 9 bémol 13", symbol: "7♯9♭13", alt: [] },
      { id: "7b9#11", name: "Septième bémol 9 dièse 11", symbol: "7♭9♯11", alt: [] },
      { id: "7b9b13", name: "Septième bémol 9 bémol 13", symbol: "7♭9♭13", alt: [] }
    ]
  }
};