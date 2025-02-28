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
// Map des types d'accords groupés par catégorie avec descriptions détaillées
export const CHORD_TYPES_BY_CATEGORY = {
  // Triades de base
  "Triades": {
    description: "Accords fondamentaux à trois notes qui forment la base de l'harmonie occidentale. Utilisés pour établir la tonalité et créer des progressions simples et claires.",
    chords: [
      { 
        id: "major", 
        name: "Majeur", 
        symbol: "", 
        alt: ["M", "maj"],
        description: "L'accord majeur produit un son lumineux et stable, considéré comme joyeux ou positif. C'est l'accord le plus courant, formant la base de nombreuses chansons populaires. Sa sonorité résolue le rend idéal pour commencer ou terminer une progression d'accords.",
        lickDescription: "Pour les licks sur accord majeur, utilisez la gamme pentatonique majeure et embellissez avec les notes de la gamme majeure complète. Accentuez la tierce majeure pour affirmer le caractère de l'accord.",
        arpegeDescription: "L'arpège majeur (1-3-5) sonne complet et équilibré. Essayez de le jouer en montant puis en descendant pour créer des lignes mélodiques fluides. Le sweep picking est particulièrement efficace pour les arpèges majeurs rapides.",
        riffDescription: "Les riffs en majeur fonctionnent bien avec des hammer-ons et pull-offs entre la fondamentale et la tierce. Le power chord (1-5) enrichi de la tierce majeure crée un son rock classique plein.",
        intervals: ["1P", "3M", "5P"]
      },
      { 
        id: "minor", 
        name: "Mineur", 
        symbol: "m", 
        alt: ["min"],
        description: "L'accord mineur produit un son plus sombre ou mélancolique que l'accord majeur. Sa tierce mineure lui confère cette qualité émotionnelle plus introspective. Fondamental dans le rock, le blues et de nombreux autres genres, il exprime souvent tristesse, tension ou profondeur.",
        lickDescription: "Sur un accord mineur, explorez la gamme pentatonique mineure. Ajoutez la blue note (b5) pour plus d'expressivité. Les bends expressifs sur la tierce mineure et la quinte créent des phrases bluesy captivantes.",
        arpegeDescription: "L'arpège mineur (1-b3-5) peut être joué en balayage ou en motifs troués (en sautant certaines notes). La descente d'un arpège mineur crée une atmosphère mélancolique caractéristique.",
        riffDescription: "Les riffs mineurs sont la base du metal et du rock sombre. Combinez la fondamentale et la quinte en power chord, puis ajoutez la tierce mineure comme note de passage pour colorer le riff.",
        intervals: ["1P", "3m", "5P"]
      },
      { 
        id: "diminished", 
        name: "Diminué", 
        symbol: "°", 
        alt: ["dim"],
        description: "L'accord diminué contient une tension inhérente grâce à sa quinte diminuée. Cette dissonance crée un sentiment d'instabilité et d'inconfort qui appelle à une résolution. Souvent utilisé comme accord de passage ou pour créer du drame dans les progressions harmoniques.",
        lickDescription: "Les licks diminués utilisent la gamme diminuée (alternance de tons et demi-tons). Exploitez les motifs symétriques en répétant un même pattern à différentes positions pour créer une tension croissante.",
        arpegeDescription: "L'arpège diminué (1-b3-b5) a une sonorité instable caractéristique. Sa structure symétrique permet de créer des séquences répétitives qui montent ou descendent par tierces mineures.",
        riffDescription: "Les riffs diminués fonctionnent comme transitions dramatiques. Alternez entre l'accord complet et des dyades b3-b5 pour un effet mystérieux. Les descentes chromatiques vers un accord diminué créent une grande tension.",
        intervals: ["1P", "3m", "5d"]
      },
      { 
        id: "augmented", 
        name: "Augmenté", 
        symbol: "+", 
        alt: ["aug"],
        description: "L'accord augmenté contient une quinte augmentée qui crée une tension ascendante, évoquant un sentiment de suspense ou d'étrangeté. Sa structure symétrique (toutes tierces majeures) lui confère une sonorité unique, flottante et insaisissable utilisée dans le jazz et la musique impressionniste.",
        lickDescription: "Pour les licks sur accord augmenté, utilisez la gamme par tons entiers ou la gamme augmentée. Le glissement chromatique vers la quinte augmentée depuis un demi-ton inférieur crée un effet tension-résolution caractéristique.",
        arpegeDescription: "L'arpège augmenté (1-3-#5) peut être joué en exploitant sa symétrie parfaite. Chaque note peut servir de point de départ pour le même motif, créant des possibilités de modulation intéressantes.",
        riffDescription: "Les riffs augmentés ont une qualité psychédélique ou progressive. Exploitez le côté instable de l'accord en alternant entre l'accord complet et ses fragments, en laissant la quinte augmentée sonner comme note pivot.",
        intervals: ["1P", "3M", "5A"]
      }
    ]
  },
  
  // Accords de quinte
  "Quintes": {
    description: "Accords sans tierce, créant un son ouvert et ambigu. Les power chords sont essentiels dans le rock et le métal pour leur puissance et leur simplicité avec distorsion.",
    indice: ['5'],
    chords: [
      { 
        id: "5", 
        name: "Quinte (Power Chord)", 
        symbol: "5", 
        alt: ["power"],
        description: "Le power chord n'est pas techniquement un accord complet mais une dyade composée de la fondamentale et la quinte. Son absence de tierce le rend ni majeur ni mineur, ce qui lui donne une grande polyvalence. Très utilisé dans le rock et le métal car il sonne clair et puissant avec distorsion.",
        lickDescription: "Les licks autour des power chords fonctionnent bien avec la gamme pentatonique mineure et des techniques de palm muting. Alternez entre notes simples et power chords pour des phrases dynamiques typiques du rock.",
        arpegeDescription: "Bien que minimal, le power chord peut être arpégé en alternant fondamentale et quinte. Ajoutez l'octave supérieure pour enrichir le motif. Les ghost notes entre les notes principales ajoutent du groove.",
        riffDescription: "Les riffs de power chords sont l'essence même du rock et du métal. Utilisez des changements rythmiques (syncopes, gallops) tout en maintenant une séquence d'accords simple pour un impact maximal.",
        intervals: ["1P", "5P"]
      },
      { 
        id: "m#5", 
        name: "Mineur dièse 5", 
        symbol: "m♯5", 
        alt: ["min#5"],
        description: "Le mineur dièse 5 combine la couleur sombre de la tierce mineure avec la tension ascendante de la quinte augmentée. Cette sonorité contradictoire crée un effet à la fois mélancolique et dissonant, utilisé dans le jazz moderne et le rock progressif pour des moments d'intensité dramatique.",
        lickDescription: "Pour les licks sur m#5, combinez des éléments de la gamme mineure harmonique avec des chromatismes autour de la quinte augmentée. Le contraste entre les notes stables et instables crée une tension expressive.",
        arpegeDescription: "L'arpège m#5 (1-b3-#5) crée une tension dramatique quand il est joué lentement. Terminez vos phrases sur la quinte augmentée pour laisser l'auditeur en suspens, ou sur la fondamentale pour plus de résolution.",
        riffDescription: "Les riffs utilisant m#5 fonctionnent bien dans le métal progressif et le jazz-rock. Alternez entre l'accord complet et des dyades de tierce mineure ou quinte augmentée pour varier les textures sonores.",
        intervals: ["1P", "3m", "5A"]
      }
    ]
  },
  
  // Accords suspendus
  "Suspendus": {
    description: "Accords où la tierce est remplacée par une seconde ou quarte, créant une tension qui appelle à une résolution. Idéals pour créer du mouvement et des transitions entre accords.",
    indice: ['sus'],
    chords: [
      { 
        id: "sus2", 
        name: "Suspendu 2", 
        symbol: "sus2", 
        alt: [],
        description: "L'accord sus2 remplace la tierce par une seconde majeure, créant un son ouvert et aérien. Ni majeur ni mineur, il offre une ambiguïté harmonique qui fonctionne bien dans des contextes modaux ou comme couleur alternative. Populaire dans le folk et le rock moderne pour son caractère léger.",
        lickDescription: "Les licks sur sus2 marchent bien avec des hammer-ons et pull-offs entre la fondamentale et la seconde. La gamme pentatonique majeure avec emphase sur la seconde crée des phrases qui complètent le caractère ouvert de l'accord.",
        arpegeDescription: "L'arpège sus2 (1-2-5) est particulièrement efficace en motifs descendants. Les techniques de tapping peuvent mettre en valeur l'intervalle de quarte entre la seconde et la quinte pour un effet cascade.",
        riffDescription: "Les riffs sus2 apportent fraîcheur et ouverture. Utilisez des positions ouvertes incluant des cordes à vide pour maximiser la résonance, parfait pour des introductions atmosphériques ou des breaks.",
        intervals: ["1P", "2M", "5P"]
      },
      { 
        id: "sus4", 
        name: "Suspendu 4", 
        symbol: "sus4", 
        alt: [],
        description: "L'accord sus4 remplace la tierce par une quarte, créant une tension qui cherche naturellement à se résoudre. Cette qualité de suspension le rend idéal pour créer des moments d'attente ou de transition dans une progression. Le sus4 a aussi une sonorité majestueuse exploitée dans le rock et le folk rock.",
        lickDescription: "Sur un sus4, jouez des lignes qui mettent en valeur le mouvement entre la quarte et la tierce (là où l'accord va se résoudre). Cette oscillation 4-3 est la signature mélodique du sus4.",
        arpegeDescription: "L'arpège sus4 (1-4-5) est souvent joué avec un mouvement descendant 5-4-1 qui imite la résolution naturelle de l'accord. Dans des tempos lents, laissez résonner la quarte pour accentuer la suspension.",
        riffDescription: "Les riffs sus4 sont emblématiques du rock des années 60-70. Alternez entre l'accord complet et sa résolution (en remplaçant la quarte par une tierce) pour créer ce mouvement caractéristique de tension et relâchement.",
        intervals: ["1P", "4P", "5P"]
      },
      { 
        id: "7sus4", 
        name: "Septième suspendu 4", 
        symbol: "7sus4", 
        alt: [],
        description: "Le 7sus4 combine la suspension de la quarte avec la tension d'une septième mineure. Cette double tension crée un effet de suspension prolongée qui fonctionne particulièrement bien comme dominante alternative en jazz et fusion. Il offre une couleur bluesy sans la tierce, avec un caractère ouvert mais tendu.",
        lickDescription: "Les licks sur 7sus4 exploitent le blues et la gamme mixolydienne. Mettez en valeur le va-et-vient entre la quarte et la tierce majeure, tout en utilisant la septième comme note de passage expressive.",
        arpegeDescription: "L'arpège 7sus4 (1-4-5-b7) crée des lignes avec une forte directionnalité harmonique. La séquence 1-4-5-b7-5-4 forme un motif complet qui englobe toutes les tensions de l'accord.",
        riffDescription: "Les riffs 7sus4 sont courants dans le funk et la fusion. Utilisez des techniques de palm muting sur la fondamentale et la quinte, tout en laissant sonner clairement la quarte et la septième pour un effet rythmique dynamique.",
        intervals: ["1P", "4P", "5P", "7m"]
      },
      { 
        id: "9sus4", 
        name: "Neuvième suspendu 4", 
        symbol: "9sus4", 
        alt: [],
        description: "Le 9sus4 ajoute une neuvième majeure à la structure du 7sus4, créant un accord riche qui combine tension et ouverture. Ce mélange de suspension et d'extension supérieure offre une couleur harmonique sophistiquée très utilisée dans le jazz moderne, la fusion et certains styles de pop avancée.",
        lickDescription: "Pour les licks sur 9sus4, explorez les possibilités de la gamme mixolydienne avec emphase sur la neuvième. Les motifs qui sautent entre différentes octaves mettent en valeur la richesse harmonique de cet accord.",
        arpegeDescription: "L'arpège 9sus4 (1-4-5-b7-9) offre de nombreuses possibilités de motifs. Un mouvement 1-5-9-b7-4 crée une ligne mélodique équilibrée qui capture l'essence de cet accord riche.",
        riffDescription: "Les riffs 9sus4 brillent dans le jazz-rock et le funk fusion. Construisez des motifs rythmiques où la neuvième et la quarte sont mises en avant comme notes caractéristiques, créant cette sensation de suspension sophistiquée.",
        intervals: ["1P", "4P", "5P", "7m", "9M"]
      },
      { 
        id: "sus24", 
        name: "Suspendu 2-4", 
        symbol: "sus2sus4", 
        alt: [],
        description: "L'accord sus24 inclut à la fois la seconde et la quarte, créant une sonorité très ouverte et unique. Rare mais expressif, il combine l'ouverture du sus2 avec la tension du sus4, résultant en un accord riche en harmoniques qui fonctionne bien dans des contextes expérimentaux ou ambiants.",
        lickDescription: "Les licks sur sus24 peuvent exploiter le mouvement entre la seconde et la quarte. Créez des lignes qui entourent la fondamentale avec ces deux notes pour mettre en valeur la sonorité unique de l'accord.",
        arpegeDescription: "L'arpège sus24 (1-2-4-5) peut former des motifs ondulants comme 1-2-4-5-4-2. Cette séquence capture l'essence de cet accord peu commun et crée une texture presque arpégiatique.",
        riffDescription: "Les riffs sus24 fonctionnent bien dans la musique ambiante et progressive. Utilisez des techniques d'harmoniques ou de tapping pour créer des nappe sonores qui mettent en valeur la richesse harmonique de cet accord inhabituel.",
        intervals: ["1P", "2M", "4P", "5P"]
      }
    ]
  },
  
  // Accords avec notes ajoutées
  "Add": {
    description: "Accords enrichis par l'ajout d'une note sans les intermédiaires. L'ajout d'une neuvième apporte de la couleur et une sonorité moderne sans la complexité des accords de septième.",
    indice: ['add'],
    
    chords: [
      { 
        id: "add9", 
        name: "Ajout neuvième", 
        symbol: "add9", 
        alt: [],
        description: "L'accord add9 ajoute une neuvième (ou seconde à l'octave) à un accord majeur sans inclure la septième. Cette addition crée une couleur plus lumineuse et moderne que l'accord majeur simple, tout en gardant sa stabilité. Très répandu dans la pop, le rock et le jazz contemporain pour son caractère frais et ouvert.",
        lickDescription: "Pour les licks sur add9, utilisez la gamme majeure en mettant l'accent sur la neuvième. Les lignes mélodiques qui alternent entre la neuvième et la tierce majeure mettent en valeur la couleur distinctive de cet accord.",
        arpegeDescription: "L'arpège add9 (1-3-5-9) sonne particulièrement bien en motifs descendants où la neuvième est mise en valeur. Essayez le motif 9-5-3-1 pour une ligne mélodique caractéristique.",
        riffDescription: "Les riffs add9 fonctionnent bien dans la pop et le rock indépendant. Utilisez des structures où la neuvième flotte au-dessus des notes fondamentales de l'accord pour créer une texture plus riche qu'un simple accord majeur.",
        intervals: ["1P", "3M", "5P", "9M"]
      },
      { 
        id: "madd9", 
        name: "Mineur ajout neuvième", 
        symbol: "m(add9)", 
        alt: [],
        description: "L'accord madd9 enrichit un accord mineur avec une neuvième majeure, créant une combinaison de profondeur mineure et de brillance dans les aigus. Cette addition donne une couleur plus sophistiquée que le simple accord mineur, très utilisée dans le rock alternatif, le jazz et la néo-soul pour son caractère émotionnellement nuancé.",
        lickDescription: "Sur un madd9, explorez les phrases qui combinent la gamme pentatonique mineure avec la neuvième majeure comme note d'embellissement. Cette juxtaposition crée une tension expressive caractéristique.",
        arpegeDescription: "L'arpège madd9 (1-b3-5-9) fonctionne particulièrement bien avec des hammer-ons et pull-offs entre la tierce mineure et la neuvième. Cette technique met en valeur la tension créative entre ces deux notes.",
        riffDescription: "Les riffs madd9 sont fréquents dans le rock alternatif et le metal progressif. Construisez des structures où la neuvième est ajoutée comme note colorante au-dessus de la base mineure pour une texture plus dense et émotive.",
        intervals: ["1P", "3m", "5P", "9M"]
      }
    ]
  },
  
  // Accords de sixte
  "Sixtes": {
    description: "Accords lumineux et légers, très utilisés dans le jazz, la pop et la bossa nova. Offrent une alternative douce aux accords de septième avec une sonorité moins tendue.",
    indice: ['6'],
    
    chords: [
      { 
        id: "6", 
        name: "Majeur sixte", 
        symbol: "6", 
        alt: ["maj6"],
        description: "L'accord majeur sixte ajoute une sixte majeure à l'accord majeur standard, créant une sonorité plus colorée mais toujours stable. Sa brillance caractéristique le rend particulièrement populaire dans le jazz, la bossa nova et la pop sophistiquée. Il offre souvent une alternative plus douce à l'accord majeur septième.",
        lickDescription: "Les licks sur accord 6 fonctionnent bien avec la gamme majeure et la gamme pentatonique majeure. Mettez en valeur le mouvement mélodique entre la sixte et la quinte pour capturer la couleur distinctive de cet accord.",
        arpegeDescription: "L'arpège majeur sixte (1-3-5-6) crée des lignes mélodiques fluides et légères. La séquence ascendante 1-3-5-6 suivie d'une descente 6-5-3 captire l'essence jazz de cet accord.",
        riffDescription: "Les riffs majeur sixte sont caractéristiques du jazz manouche et du rockabilly. Utilisez des doubles croches swinguées avec accent sur la sixte pour ce son vintage reconnaissable.",
        intervals: ["1P", "3M", "5P", "6M"]
      },
      { 
        id: "min6", 
        name: "Mineur sixte", 
        symbol: "m6", 
        alt: ["m6"],
        description: "L'accord mineur sixte combine la chaleur de l'accord mineur avec la brillance d'une sixte majeure. Cette juxtaposition crée une sonorité sophistiquée et légèrement ambiguë, très prisée dans le jazz, la bossa nova et certains styles de pop. Le mineur sixte peut aussi évoquer des sonorités tziganes ou orientales selon son utilisation.",
        lickDescription: "Pour les licks sur m6, utilisez la gamme mineure dorien (qui contient naturellement la sixte majeure). Les phrases qui mettent en valeur la sixte majeure dans un contexte mineur créent cette tension expressive caractéristique.",
        arpegeDescription: "L'arpège m6 (1-b3-5-6) sonne particulièrement bien en séquences montantes et descendantes. Le contraste entre la tierce mineure et la sixte majeure crée une qualité émotionnelle complexe très expressive.",
        riffDescription: "Les riffs m6 sont emblématiques du jazz gypsy et de certains styles world. Alternez entre l'accord complet et des fragments qui mettent en valeur la sixte pour ce son à la fois nostalgique et lumineux.",
        intervals: ["1P", "3m", "5P", "6M"]
      },
      { 
        id: "69", 
        name: "Sixte neuvième", 
        symbol: "6/9", 
        alt: ["6add9"],
        description: "L'accord 6/9 ajoute à la fois une sixte et une neuvième à la triade majeure, créant une sonorité particulièrement riche et colorée sans être trop tendue. Emblématique du jazz moderne et de la néo-soul, cet accord offre une sophistication harmonique tout en gardant une qualité stable et lumineuse.",
        lickDescription: "Les licks sur 6/9 peuvent explorer toute la gamme majeure, avec des phrases qui mettent en valeur les extensions de sixte et neuvième. Des approches chromatiques vers ces notes créent un effet jazz sophistiqué.",
        arpegeDescription: "L'arpège 6/9 (1-3-5-6-9) offre de multiples possibilités. Essayez des motifs qui alternent entre sixte et neuvième (6-9-6-9) par-dessus la triade pour capturer l'essence de cet accord luxuriant.",
        riffDescription: "Les riffs 6/9 sont caractéristiques du funk et du R&B moderne. Construisez des motifs rythmiques où la sixte et la neuvième sont jouées simultanément pour ce son riche mais jamais trop dissonant.",
        intervals: ["1P", "3M", "5P", "6M", "9M"]
      },
      { 
        id: "m69", 
        name: "Mineur sixte neuvième", 
        symbol: "m6/9", 
        alt: ["min6/9"],
        description: "L'accord m6/9 cumule les extensions de sixte et neuvième sur un accord mineur, créant une palette sonore à la fois sombre et sophistiquée. Cette complexité harmonique en fait un favori du jazz moderne, de la fusion et de la néo-soul. Il combine la profondeur émotionnelle du mineur avec des notes supérieures qui ajoutent couleur et ouverture.",
        lickDescription: "Sur un m6/9, utilisez la gamme mineure dorienne comme base, en mettant l'accent sur la sixte et la neuvième. Les motifs qui alternent entre ces extensions et les notes de la triade créent des phrases jazz modernes caractéristiques.",
        arpegeDescription: "L'arpège m6/9 (1-b3-5-6-9) peut être joué en groupes de notes (1-b3-5 puis 6-9) pour mettre en valeur sa structure complexe. Les séquences qui isolent les extensions supérieures créent des lignes mélodiques riches et expressives.",
        riffDescription: "Les riffs m6/9 brillent dans le jazz fusion et la néo-soul. Construisez des structures où les extensions de sixte et neuvième flottent au-dessus d'une base rythmique mineure, créant ce contraste caractéristique entre profondeur et brillance.",
        intervals: ["1P", "3m", "5P", "6M", "9M"]
      }
    ]
  },
  
  // Accords de septième
  "Septièmes": {
    description: "Piliers de l'harmonie jazz et blues, ces accords ajoutent profondeur et mouvement. Le 7 dominant crée une tension demandant résolution, tandis que le maj7 offre richesse et sophistication.",
    indice: ['7'],
    
    chords: [
      { 
        id: "7", 
        name: "Septième", 
        symbol: "7", 
        alt: ["dom7"],
        description: "L'accord de septième (dominant) combine une triade majeure avec une septième mineure, créant une tension qui demande naturellement à se résoudre. Pierre angulaire du blues et du jazz, il possède ce son à la fois brillant et légèrement tendu qui pousse l'harmonie vers sa résolution. C'est l'accord dominant par excellence dans les progressions II-V-I.",
        lickDescription: "Pour les licks sur accord 7, utilisez la gamme mixolydienne ou la gamme blues. Les phrases qui intègrent la septième mineure et la tierce majeure capturent l'essence bluesy de cet accord.",
        arpegeDescription: "L'arpège dominant 7 (1-3-5-b7) peut être joué en motifs ascendants et descendants. Mettez l'accent sur la tension entre la tierce majeure et la septième mineure pour faire ressortir le caractère dominant.",
        riffDescription: "Les riffs dominants sont fondamentaux dans le blues et le rock. Utilisez des séquences rythmiques où la fondamentale et la septième sont mises en avant, avec des blue notes (b3, b5) comme notes de passage expressives.",
        intervals: ["1P", "3M", "5P", "7m"]
      },
      { 
        id: "maj7", 
        name: "Majeur septième", 
        symbol: "Δ7", 
        alt: ["M7"],
        description: "L'accord majeur septième combine une triade majeure avec une septième majeure, créant une sonorité riche et veloutée sans tension dominante. Essentiel au jazz, à la bossa nova et à la pop sophistiquée, il évoque souvent romantisme, contemplation ou sophistication. Sa stabilité harmonique en fait un accord parfait pour des fins de phrase ou des moments de repos.",
        lickDescription: "Les licks sur maj7 fonctionnent bien avec la gamme majeure ou lydienne. Des lignes mélodiques qui mettent en valeur la septième majeure et la tierce créent ce son doux et sophistiqué caractéristique.",
        arpegeDescription: "L'arpège maj7 (1-3-5-7) sonne particulièrement bien en montées fluides ou en motifs descendants larges. Le petit intervalle entre la septième et l'octave crée une tension subtile qui caractérise cet accord.",
        riffDescription: "Les riffs maj7 sont emblématiques du jazz et de la pop sophistiquée. Construisez des structures où la septième majeure est mise en valeur, souvent en position supérieure pour ce son planant et ouvert.",
        intervals: ["1P", "3M", "5P", "7M"]
      },
      { 
        id: "min7", 
        name: "Mineur septième", 
        symbol: "m7", 
        alt: ["m7"],
        description: "L'accord mineur septième allie une triade mineure et une septième mineure, produisant un son à la fois mélancolique et détendu. Fondamental dans le jazz, le funk et la soul, il possède une richesse expressive qui combine profondeur émotionnelle et fluidité harmonique. Souvent utilisé comme accord II dans les progressions II-V-I du jazz.",
        lickDescription: "Pour les licks sur min7, utilisez la gamme dorienne ou la pentatonique mineure. Des phrases qui mettent en valeur le mouvement entre la tierce mineure et la septième créent des lignes mélodiques douces et expressives.",
        arpegeDescription: "L'arpège min7 (1-b3-5-b7) se prête bien aux séquences descendantes pour un effet mélancolique caractéristique. Les motifs qui alternent parties ascendantes et descendantes créent un équilibre expressif.",
        riffDescription: "Les riffs min7 sont caractéristiques du funk et du jazz-rock. Construisez des motifs rythmiques où la fondamentale et la septième créent une base groove sur laquelle la tierce mineure apporte sa couleur mélancolique.",
        intervals: ["1P", "3m", "5P", "7m"]
      },
      { 
        id: "minMaj7", 
        name: "Mineur majeur septième", 
        symbol: "mΔ7", 
        alt: ["mM7", "m(maj7)"],
        description: "L'accord mineur majeur septième combine la sombre couleur d'une triade mineure avec la brillante septième majeure, créant une tension harmonique sophistiquée et mystérieuse. Utilisé dans le jazz moderne, la musique de film et les styles progressifs, il évoque souvent nostalgie, mystère ou une forme de beauté mélancolique.",
        lickDescription: "Sur un minMaj7, explorez la gamme mineure mélodique qui contient naturellement cette combinaison distinctive. Des phrases qui accentuent la tension entre la tierce mineure et la septième majeure créent cette atmosphère particulière.",
        arpegeDescription: "L'arpège minMaj7 (1-b3-5-7) crée des lignes mélodiques dramatiques et expressives. Sa combinaison inhabituelle de notes produit une qualité mystérieuse qui fonctionne particulièrement bien en tempos modérés.",
        riffDescription: "Les riffs minMaj7 sont caractéristiques du jazz moderne et du métal progressif. Construisez des structures où la septième majeure est mise en contraste avec la tierce mineure pour exploiter cette tension harmonique unique.",
        intervals: ["1P", "3m", "5P", "7M"]
      },
      { 
        id: "dim7", 
        name: "Diminué septième", 
        symbol: "°7", 
        alt: ["dim7"],
        description: "L'accord diminué septième empile trois tierces mineures, créant une structure parfaitement symétrique avec un maximum de tension harmonique. Sa septième diminuée (enharmonique d'une sixte majeure) ajoute à l'instabilité de la triade diminuée. Utilisé comme accord de passage ou pivot modulant dans le jazz et la musique classique.",
        lickDescription: "Pour les licks sur dim7, utilisez la gamme diminuée (alternance de tons et demi-tons). La structure symétrique de l'accord permet de répéter les mêmes motifs à des intervalles de tierce mineure pour un effet de tension croissante.",
        arpegeDescription: "L'arpège dim7 (1-b3-b5-bb7) exploite sa symétrie parfaite. Des séquences ascendantes ou descendantes à intervalles réguliers créent des lignes mélodiques qui semblent tourner en spirale, capturant l'instabilité fascinante de cet accord.",
        riffDescription: "Les riffs dim7 fonctionnent comme transitions dramatiques ou moments de tension maximale. Exploitez la structure symétrique pour créer des motifs qui glissent chromatiquement, augmentant la sensation d'instabilité harmonique.",
        intervals: ["1P", "3m", "5d", "7d"]
      },
      { 
        id: "min7b5", 
        name: "Demi-diminué", 
        symbol: "ø", 
        alt: ["m7b5"],
        description: "L'accord demi-diminué (ou min7b5) combine une triade diminuée avec une septième mineure, créant une tension plus contenue que l'accord diminué complet. Essentiel dans les progressions mineures de jazz comme accord II dans un II-V-I mineur, il évoque mélancolie sophistiquée et anticipation de résolution.",
        lickDescription: "Sur un min7b5, utilisez la gamme demi-diminuée (sixième mode de la gamme mineure mélodique). Des phrases qui mettent en valeur la quinte diminuée et la relation entre tierce mineure et septième mineure capturent le caractère distinctif de cet accord.",
        arpegeDescription: "L'arpège min7b5 (1-b3-b5-b7) sonne particulièrement bien en mouvements descendants pour un effet mélancolique. Les séquences qui contrastent la quinte diminuée avec les autres notes créent des lignes expressives caractéristiques du jazz.",
        riffDescription: "Les riffs min7b5 sont emblématiques du jazz modal et contemporain. Construisez des structures où la tension entre la quinte diminuée et la septième mineure est mise en valeur pour ce son à la fois instable et cohérent.",
        intervals: ["1P", "3m", "5d", "7m"]
      },
      { 
        id: "aug7", 
        name: "Augmenté septième", 
        symbol: "+7", 
        alt: ["7#5"],
        description: "L'accord augmenté septième combine la triade augmentée (avec sa quinte augmentée) et une septième mineure, créant une double tension vers la résolution. Utilisé dans le jazz, le blues avancé et la musique impressionniste, il offre une couleur harmonique riche et instable qui demande fortement à être résolue.",
        lickDescription: "Pour les licks sur aug7, utilisez la gamme altérée ou la gamme diminuée ton-demi-ton. Des phrases qui mettent en valeur la quinte augmentée et son mouvement vers la tonique de l'accord suivant créent des lignes mélodiques avec une forte directionnalité.",
        arpegeDescription: "L'arpège aug7 (1-3-#5-b7) crée des lignes mélodiques dramatiques. Des séquences qui contrastent les notes de l'arpège avec des approches chromatiques renforcent son caractère instable et expressif.",
        riffDescription: "Les riffs aug7 sont caractéristiques du jazz fusion et du blues sophistiqué. Construisez des structures où la quinte augmentée et la septième mineure créent cette double tension qui appelle fortement une résolution harmonique.",
        intervals: ["1P", "3M", "5A", "7m"]
      },
      { 
        id: "7b5", 
        name: "Septième bémol 5", 
        symbol: "7♭5", 
        alt: [],
        description: "L'accord 7b5 (septième bémol quinte) combine une tierce majeure, une quinte diminuée et une septième mineure, créant une tension harmonique distincte de celle de l'accord augmenté septième. Très utilisé dans le jazz et le blues avancé, il offre une couleur altérée qui annonce fortement une résolution.",
        lickDescription: "Sur un 7b5, utilisez la gamme altérée ou la gamme diminuée. Des phrases qui mettent en valeur la quinte diminuée et sa résolution naturelle vers la quarte de l'accord suivant créent des lignes mélodiques avec une forte direction harmonique.",
        arpegeDescription: "L'arpège 7b5 (1-3-b5-b7) peut être joué en alternant mouvements rapides et notes tenues pour mettre en valeur sa tension distinctive. Des approches chromatiques vers la quinte diminuée accentuent son caractère instable.",
        riffDescription: "Les riffs 7b5 sont typiques du jazz bebop et du blues sophistiqué. Construisez des motifs qui mettent en valeur la relation entre la tierce majeure et la quinte diminuée pour exploiter cette tension harmonique particulière.",
        intervals: ["1P", "3M", "5d", "7m"]
      },
      { 
        id: "maj7#5", 
        name: "Majeur septième dièse 5", 
        symbol: "Δ7♯5", 
        alt: ["M7+5"],
        description: "L'accord maj7#5 combine la triade augmentée avec une septième majeure, créant une sonorité à la fois lumineuse et tendue. Cette couleur harmonique sophistiquée est prisée dans le jazz moderne, la fusion et les styles progressifs pour son caractère onirique et sa tension contenue qui ne demande pas nécessairement de résolution.",
        lickDescription: "Pour les licks sur maj7#5, utilisez la gamme lydienne augmentée (troisième mode de la gamme mineure mélodique). Des phrases qui mettent en valeur la relation entre quinte augmentée et septième majeure créent des lignes mélodiques planantes et sophistiquées.",
        arpegeDescription: "L'arpège maj7#5 (1-3-#5-7) crée des lignes mélodiques éthérées et modernes. Des séquences qui exploitent sa structure symétrique partielle peuvent créer des motifs qui semblent flotter au-dessus de l'harmonie conventionnelle.",
        riffDescription: "Les riffs maj7#5 sont caractéristiques du jazz expérimental et de la fusion. Construisez des structures où les tensions entre quinte augmentée et septième majeure créent cette atmosphère suspendue et onirique distinctive.",
        intervals: ["1P", "3M", "5A", "7M"]
      },
      { 
        id: "maj7b5", 
        name: "Majeur septième bémol 5", 
        symbol: "Δ7♭5", 
        alt: ["M7b5"],
        description: "L'accord maj7b5 associe une tierce majeure, une quinte diminuée et une septième majeure, créant une couleur harmonique rare et ambiguë. Utilisé dans le jazz moderne et les musiques de film pour son caractère mystérieux et suspendu, il offre une tension qui ne se résout pas conventionnellement.",
        lickDescription: "Sur un maj7b5, utilisez la gamme lydienne b5 (quatrième mode de la gamme mineure mélodique). Des phrases qui explorent la tension entre quinte diminuée et septième majeure créent des lignes mélodiques mystérieuses et évocatrices.",
        arpegeDescription: "L'arpège maj7b5 (1-3-b5-7) crée des lignes mélodiques avec une qualité presque cinématographique. Des motifs lents et espacés permettent à l'auditeur d'absorber les colorations harmoniques inhabituelles de cet accord.",
        riffDescription: "Les riffs maj7b5 fonctionnent bien dans le jazz contemporain et la musique ambiante. Créez des structures où la quinte diminuée est mise en contraste avec la septième majeure pour ce son flottant et introspectif.",
        intervals: ["1P", "3M", "5d", "7M"]
      },
      { 
        id: "min7#5", 
        name: "Mineur septième dièse 5", 
        symbol: "m7♯5", 
        alt: ["m7+5"],
        description: "L'accord min7#5 combine tierce mineure, quinte augmentée et septième mineure, créant une sonorité complexe et inhabituelle. Cette structure harmonique ambiguë est utilisée dans le jazz moderne et expérimental pour ses qualités expressives qui transcendent les catégories traditionnelles majeur/mineur.",
        lickDescription: "Pour les licks sur min7#5, mélangez des éléments des gammes mineures mélodique et harmonique. Des phrases qui explorent le contraste entre tierce mineure et quinte augmentée créent des lignes mélodiques captivantes et non conventionnelles.",
        arpegeDescription: "L'arpège min7#5 (1-b3-#5-b7) peut créer des lignes mélodiques dramatiques et modernes. Des séquences qui isolent les paires de notes (b3-#5 ou #5-b7) mettent en valeur les tensions internes de cet accord complexe.",
        riffDescription: "Les riffs min7#5 sont caractéristiques du jazz fusion et du métal progressif. Construisez des structures où le contraste entre l'aspect sombre de la tierce mineure et l'aspect tendu de la quinte augmentée crée cette ambiguïté expressive unique.",
        intervals: ["1P", "3m", "5A", "7m"]
      }
    ]
  },
  
  // Accords de neuvième
  "Neuvièmes": {
    description: "Extensions plus riches apportant des couleurs harmoniques sophistiquées. Très utilisés dans le jazz, la soul et le R&B pour leur expressivité et leur chaleur.",
    indice: ['9'],
    
    chords: [
      { 
        id: "9", 
        name: "Neuvième", 
        symbol: "9", 
        alt: ["dom9"],
        description: "L'accord de neuvième ajoute une neuvième majeure à la structure de l'accord de septième dominant, créant une sonorité plus riche et colorée tout en conservant sa fonction dominante. Pilier du jazz, du funk et du R&B, il apporte chaleur et sophistication aux progressions harmoniques, avec plus d'expressivité qu'un simple accord de septième.",
        lickDescription: "Pour les licks sur accord 9, utilisez la gamme mixolydienne avec emphase sur la neuvième. Des phrases qui mettent en valeur le mouvement entre la neuvième et autres notes de l'accord (particulièrement la tierce) créent des lignes mélodiques expressives et colorées.",
        arpegeDescription: "L'arpège de neuvième (1-3-5-b7-9) offre de nombreuses possibilités mélodiques. Des séquences qui mettent en valeur les extensions supérieures (b7-9) créent des lignes caractéristiques du jazz moderne.",
        riffDescription: "Les riffs de neuvième sont emblématiques du funk et du jazz fusion. Construisez des motifs rythmiques où la neuvième est mise en valeur comme note colorante au-dessus de la structure dominante pour ce son à la fois tendu et chaleureux.",
        intervals: ["1P", "3M", "5P", "7m", "9M"]
      },
      { 
        id: "maj9", 
        name: "Majeur neuvième", 
        symbol: "Δ9", 
        alt: ["M9"],
        description: "L'accord majeur neuvième ajoute une neuvième majeure à la structure du majeur septième, créant une sonorité luxuriante et sophistiquée. Essentiel dans le jazz moderne, la bossa nova et la neo-soul, il associe la stabilité veloutée du majeur septième à la brillance de la neuvième, évoquant souvent raffinement, ouverture et profondeur émotionnelle.",
        lickDescription: "Sur un maj9, utilisez la gamme lydienne pour un son particulièrement brillant, ou la gamme majeure pour un son plus conventionnel. Des phrases qui mettent en valeur la relation entre septième majeure et neuvième créent des lignes mélodiques douces et sophistiquées.",
        arpegeDescription: "L'arpège maj9 (1-3-5-7-9) produit des lignes mélodiques riches et planantes. Des motifs qui groupent les notes en différentes cellules (comme 1-3-5 puis 7-9) créent des phrases avec une architecture intéressante.",
        riffDescription: "Les riffs maj9 sont caractéristiques du jazz contemporain et de la neo-soul. Construisez des structures où la septième et la neuvième flottent au-dessus de la triade de base pour ce son riche et ouvert.",
        intervals: ["1P", "3M", "5P", "7M", "9M"]
      },
      { 
        id: "min9", 
        name: "Mineur neuvième", 
        symbol: "m9", 
        alt: [],
        description: "L'accord mineur neuvième ajoute une neuvième majeure à la structure du mineur septième, enrichissant sa couleur mélancolique d'une touche de brillance dans les aigus. Très utilisé dans le jazz modal, la néo-soul et le R&B moderne, il offre une profondeur émotionnelle avec une sophistication harmonique qui transcende le simple accord mineur.",
        lickDescription: "Pour les licks sur min9, utilisez la gamme dorienne qui contient naturellement la neuvième majeure. Des phrases qui alternent entre neuvième et tierce mineure créent des lignes expressives qui capturent l'essence de cet accord riche.",
        arpegeDescription: "L'arpège min9 (1-b3-5-b7-9) peut être découpé en différents groupements de notes pour créer des motifs variés. La séquence 9-b7-5-b3-1 crée une ligne descendante particulièrement expressive.",
        riffDescription: "Les riffs min9 sont essentiels dans le jazz modal et le neo-soul. Construisez des structures où la neuvième ajoute sa brillance distinctive au-dessus de la base mineure septième pour ce son à la fois profond et ouvert.",
        intervals: ["1P", "3m", "5P", "7m", "9M"]
      },
      { 
        id: "minMaj9", 
        name: "Mineur majeur neuvième", 
        symbol: "mΔ9", 
        alt: ["mM9"],
        description: "L'accord minMaj9 combine la structure du mineur majeur septième avec une neuvième majeure, créant une sonorité extrêmement sophistiquée et émotionnellement complexe. Utilisé dans le jazz moderne et la musique de film pour son caractère mystérieux et narratif, il offre une palette expressive qui transcende les catégories harmoniques conventionnelles.",
        lickDescription: "Sur un minMaj9, utilisez la gamme mineure mélodique qui contient naturellement cette combinaison spécifique de notes. Des phrases qui mettent en valeur les tensions entre tierce mineure, septième majeure et neuvième créent des lignes mélodiques captivantes et évocatrices.",
        arpegeDescription: "L'arpège minMaj9 (1-b3-5-7-9) crée des lignes mélodiques avec une forte personnalité. Des motifs qui contrastent les éléments mineurs et majeurs de sa structure mettent en valeur sa nature harmoniquement complexe.",
        riffDescription: "Les riffs minMaj9 fonctionnent bien dans le jazz contemporain et la musique expérimentale. Construisez des structures où la septième majeure et la neuvième créent une brillance inattendue au-dessus de la base mineure pour ce son narratif et évocateur.",
        intervals: ["1P", "3m", "5P", "7M", "9M"]
      },
      { 
        id: "7b9", 
        name: "Septième bémol 9", 
        symbol: "7♭9", 
        alt: [],
        description: "L'accord 7b9 ajoute une neuvième bémol (ou neuvième mineure) à la structure de septième dominante, créant une tension dissonante distinctive. Pilier du jazz bebop et du blues sophistiqué, il possède cette sonorité mordante qui annonce fortement une résolution. Souvent utilisé pour les cadences en mineur, il évoque tension dramatique et urgence expressive.",
        lickDescription: "Pour les licks sur 7b9, utilisez la gamme diminuée ou la gamme altérée. Des phrases qui mettent en valeur la neuvième bémol et son mouvement chromatique vers la quinte ou la fondamentale créent des lignes mélodiques avec une forte directionnalité.",
        arpegeDescription: "L'arpège 7b9 (1-3-5-b7-b9) crée des lignes mélodiques dramatiques et tendues. Des motifs qui isolent la dissonance caractéristique entre la fondamentale et la neuvième bémol mettent en valeur la tension de cet accord.",
        riffDescription: "Les riffs 7b9 sont caractéristiques du jazz bebop et du blues urbain. Construisez des structures où la neuvième bémol est utilisée comme point culminant de tension avant une résolution, exploitant son fort potentiel dramatique.",
        intervals: ["1P", "3M", "5P", "7m", "9m"]
      },
      { 
        id: "7#9", 
        name: "Septième dièse 9", 
        symbol: "7♯9", 
        alt: [],
        description: "L'accord 7#9 (septième dièse neuf, ou « accord Hendrix ») ajoute une neuvième augmentée à la structure de septième dominante, créant une dissonance expressive caractéristique. Emblématique du rock psychédélique, du funk et du jazz fusion, il possède cette tension brûlante qui évoque à la fois blues et modernité. Sa juxtaposition d'éléments majeurs et mineurs lui confère une expressivité unique.",
        lickDescription: "Sur un 7#9, mélangez des éléments des gammes pentatoniques majeure et mineure – cette dualité capture l'essence de cet accord. Des phrases qui exploitent la tension entre la tierce majeure et la neuvième augmentée (enharmonique d'une tierce mineure) créent ce son bluesy et moderne.",
        arpegeDescription: "L'arpège 7#9 (1-3-5-b7-#9) peut être joué en mettant l'accent sur le contraste entre tierce majeure et neuvième augmentée. Cette juxtaposition est au cœur du caractère expressif et tendu de cet accord.",
        riffDescription: "Les riffs 7#9 sont signature du funk-rock et du blues psychédélique. Le fameux riff de Hendrix dans 'Purple Haze' illustre parfaitement comment construire des motifs où la dissonance entre tierce majeure et neuvième augmentée crée une tension expressive puissante.",
        intervals: ["1P", "3M", "5P", "7m", "9A"]
      }
    ]
  },
  
  // Accords de onzième
  "Onzièmes": {
    description: "Accords complexes et ouverts apportant une richesse harmonique impressionniste. Parfaits pour créer des ambiances planantes ou des transitions évocatrices.",
    indice: ['11'],
    
    chords: [
      { 
        id: "11", 
        name: "Onzième", 
        symbol: "11", 
        alt: [],
        description: "L'accord 11 étend la structure de l'accord 9 avec une onzième (ou quarte suspensive), créant une sonorité ouverte et ambiguë. La onzième remplace généralement la tierce, évitant la dissonance entre ces deux notes. Utilisé dans le jazz modal, le funk et la fusion, il offre cette qualité flottante idéale pour créer des textures harmoniques étendues.",
        lickDescription: "Pour les licks sur accord 11, utilisez la gamme mixolydienne ou dorien avec emphase sur la onzième. Des phrases qui mettent en valeur le mouvement entre la septième, la neuvième et la onzième créent des lignes mélodiques modernes et expressives.",
        arpegeDescription: "L'arpège 11 (1-5-b7-9-11) généralement joué sans la tierce, crée des lignes mélodiques ouvertes et modales. Des motifs qui regroupent les extensions supérieures (b7-9-11) peuvent former des séquences qui flottent au-dessus de la fondamentale.",
        riffDescription: "Les riffs 11 sont caractéristiques du jazz modal et de la fusion. Construisez des structures où la onzième est mise en valeur comme élément de suspension et de couleur, souvent en omettant la tierce pour éviter les dissonances trop marquées.",
        intervals: ["1P", "5P", "7m", "9M", "11P"]
      },
      { 
        id: "maj11", 
        name: "Majeur onzième", 
        symbol: "Δ11", 
        alt: ["M11"],
        description: "L'accord maj11 étend la structure du maj9 avec une onzième, créant une couleur harmonique riche et complexe. La onzième (ou quarte) forme une dissonance avec la tierce majeure, ce qui explique que cette dernière soit souvent omise. Utilisé dans le jazz contemporain, la fusion et la musique ambiante, il évoque espace, suspension et sophistication.",
        lickDescription: "Sur un maj11, utilisez la gamme lydienne qui résout naturellement la dissonance entre tierce et onzième grâce à sa quarte augmentée. Des phrases qui mettent en valeur les extensions supérieures (7-9-11) créent des lignes mélodiques planantes et sophistiquées.",
        arpegeDescription: "L'arpège maj11 (1-5-7-9-11), souvent joué sans la tierce, crée des lignes mélodiques ouvertes et modernes. Des séquences qui combinent différentes parties de l'arpège peuvent former des motifs avec une architecture harmonique complexe.",
        riffDescription: "Les riffs maj11 sont emblématiques du jazz contemporain et de la musique ambiante. Construisez des structures où les extensions d'onzième et au-delà créent des nappes sonores riches et ouvertes, idéales pour des contextes harmoniques statiques.",
        intervals: ["1P", "5P", "7M", "9M", "11P"]
      },
      { 
        id: "min11", 
        name: "Mineur onzième", 
        symbol: "m11", 
        alt: [],
        description: "L'accord min11 ajoute une onzième à la structure du min9, enrichissant encore sa palette expressive. Contrairement aux accords majeurs, la onzième ne crée pas de dissonance problématique avec la tierce mineure, ce qui permet de jouer l'accord complet. Très utilisé dans le jazz modal, la néo-soul et le R&B contemporain, il offre une profondeur harmonique particulièrement riche.",
        lickDescription: "Pour les licks sur min11, utilisez la gamme dorienne qui contient naturellement tous les éléments de cet accord. Des phrases qui explorent la relation entre la onzième, la neuvième et la septième créent des lignes mélodiques expressives et modernes.",
        arpegeDescription: "L'arpège min11 (1-b3-5-b7-9-11) offre de nombreuses possibilités de regroupement et de séquençage. Des motifs qui mettent en valeur les extensions supérieures peuvent créer des lignes mélodiques qui semblent flotter au-dessus de la fondamentale.",
        riffDescription: "Les riffs min11 sont caractéristiques de la néo-soul et du R&B moderne. Construisez des structures où les extensions s'empilent pour créer des textures harmoniques riches, idéales pour des grooves décontractés et sophistiqués.",
        intervals: ["1P", "3m", "5P", "7m", "9M", "11P"]
      },
      { 
        id: "7#11", 
        name: "Septième dièse 11", 
        symbol: "7♯11", 
        alt: [],
        description: "L'accord 7#11 ajoute une onzième augmentée (ou quarte augmentée) à la structure de septième dominante, créant une tension distinctive. Cette altération, qui correspond à la note caractéristique du mode lydien dominant, offre une couleur à la fois brillante et tendue. Prisé dans le jazz moderne et la fusion, il évoque sophistication, mouvement et une forme d'instabilité contrôlée.",
        lickDescription: "Sur un 7#11, utilisez la gamme lydienne dominante (quatrième mode de la mineur mélodique). Des phrases qui mettent en valeur la onzième augmentée et son mouvement de résolution vers la quinte créent des lignes mélodiques avec une forte direction harmonique.",
        arpegeDescription: "L'arpège 7#11 (1-3-5-b7-#11) crée des lignes mélodiques modernes et dynamiques. Des motifs qui isolent la tension entre la tierce majeure et la onzième augmentée mettent en valeur le caractère distinctif de cet accord.",
        riffDescription: "Les riffs 7#11 sont caractéristiques du jazz fusion et du rock progressif. Construisez des structures où la onzième augmentée apporte sa couleur lydienne distinctive, créant cette tension brillante qui contraste avec la fonction dominante de l'accord.",
        intervals: ["1P", "3M", "5P", "7m", "11A"]
      },
      { 
        id: "maj7#11", 
        name: "Majeur septième dièse 11", 
        symbol: "Δ7♯11", 
        alt: [],
        description: "L'accord maj7#11 ajoute une onzième augmentée à la structure du majeur septième, créant la sonorité caractéristique du mode lydien. Cette couleur harmonique brillante et légèrement tendue est emblématique du jazz modal, de la fusion et de la musique de film. Son caractère flottant et lumineux évoque souvent rêverie, ouverture ou une forme d'élévation.",
        lickDescription: "Pour les licks sur maj7#11, utilisez la gamme lydienne qui contient naturellement cette onzième augmentée caractéristique. Des phrases qui mettent en valeur la relation entre la septième majeure et la onzième augmentée créent des lignes mélodiques planantes et modernes.",
        arpegeDescription: "L'arpège maj7#11 (1-3-5-7-#11) crée des lignes mélodiques avec une qualité éthérée distinctive. Des motifs qui juxtaposent les éléments stables (1-3-5) avec les extensions colorantes (7-#11) mettent en valeur la richesse harmonique de cet accord.",
        riffDescription: "Les riffs maj7#11 sont emblématiques du jazz moderne et de la musique ambiante. Construisez des structures où la onzième augmentée apporte sa qualité lydienne distinctive, créant cette atmosphère flottante et contemplative.",
        intervals: ["1P", "3M", "5P", "7M", "11A"]
      }
    ]
  },
  
  // Accords de treizième
  "Treizièmes": {
    description: "Les accords les plus complets, incluant potentiellement toutes les notes de la gamme. Utilisés pour des moments de richesse harmonique maximale ou des fins de sections spectaculaires.",
    indice: ['13'],
    
    chords: [
      { 
        id: "13", 
        name: "Treizième", 
        symbol: "13", 
        alt: [],
        description: "L'accord 13 représente l'extension ultime de l'accord dominant, ajoutant une treizième (ou sixte) aux structures 7, 9 et 11. Cette addition crée une sonorité complète et sophistiquée, où la treizième apporte une douceur qui équilibre la tension dominante. Essentiel au jazz, au funk et à la soul, il offre une palette expressive maximale pour les cadences et les points culminants harmoniques.",
        lickDescription: "Pour les licks sur accord 13, utilisez la gamme mixolydienne avec des embellissements chromatiques. Des phrases qui explorent les différentes extensions (9, 13 et éventuellement 11) créent des lignes mélodiques riches qui mettent en valeur la complétude harmonique de cet accord.",
        arpegeDescription: "L'arpège 13 (1-3-5-b7-9-13) offre de nombreuses possibilités de regroupement et de motifs. Des séquences qui alternent les extensions supérieures avec les notes de la structure de base créent des lignes mélodiques équilibrées entre tension et résolution.",
        riffDescription: "Les riffs 13 sont caractéristiques du funk, du jazz fusion et du R&B sophistiqué. Construisez des motifs rythmiques qui mettent en valeur la treizième comme note colorante brillante au-dessus de la tension dominante sous-jacente.",
        intervals: ["1P", "3M", "5P", "7m", "9M", "13M"]
      },
      { 
        id: "maj13", 
        name: "Majeur treizième", 
        symbol: "Δ13", 
        alt: ["M13"],
        description: "L'accord maj13 représente l'extension complète de l'accord majeur septième, incluant potentiellement toutes les tensions diatoniques jusqu'à la treizième. Cette richesse harmonique crée une sonorité luxuriante et sophistiquée, parfaite pour les accords finaux ou les moments de plénitude harmonique. Utilisé dans le jazz moderne, la bossa nova sophistiquée et les arrangements orchestraux pour sa qualité englobante.",
        lickDescription: "Sur un maj13, utilisez la gamme lydienne ou ionienne avec des approches chromatiques. Des phrases qui explorent la richesse des extensions, particulièrement la relation entre septième majeure, neuvième et treizième, créent des lignes mélodiques à la fois sophistiquées et douces.",
        arpegeDescription: "L'arpège maj13 (1-3-5-7-9-13) peut être joué en regroupant les notes de différentes façons pour créer des motifs variés. Une approche efficace consiste à alterner entre la triade de base et les extensions supérieures pour créer un contraste expressif.",
        riffDescription: "Les riffs maj13 sont emblématiques du jazz moderne et de la fusion sophistiquée. Construisez des structures où les extensions supérieures créent des nappes harmoniques riches, idéales pour des conclusions ou des sections d'ouverture atmosphériques.",
        intervals: ["1P", "3M", "5P", "7M", "9M", "13M"]
      },
      { 
        id: "min13", 
        name: "Mineur treizième", 
        symbol: "m13", 
        alt: [],
        description: "L'accord min13 étend l'harmonie mineure jusqu'à sa limite diatonique, créant un accord d'une richesse et d'une profondeur exceptionnelles. Cette structure complète combine la chaleur mélancolique du mineur avec la brillance des extensions supérieures. Utilisé dans le jazz contemporain, la néo-soul et le R&B sophistiqué pour sa capacité à exprimer des émotions complexes et nuancées.",
        lickDescription: "Pour les licks sur min13, utilisez la gamme dorienne qui contient naturellement la treizième majeure. Des phrases qui explorent l'espace harmonique entre la tierce mineure et les extensions supérieures créent des lignes mélodiques à la fois profondes et ouvertes.",
        arpegeDescription: "L'arpège min13 (1-b3-5-b7-9-11-13) offre un vaste terrain d'exploration mélodique. Des motifs qui regroupent les extensions en différentes cellules peuvent créer des lignes avec une architecture harmonique complexe et expressive.",
        riffDescription: "Les riffs min13 brillent dans le contexte du jazz modal et de la neo-soul. Construisez des structures où la treizième majeure apporte sa brillance distinctive au-dessus de la fondation mineure, créant ce contraste expressif entre profondeur et ouverture.",
        intervals: ["1P", "3m", "5P", "7m", "9M", "11P", "13M"]
      },
      { 
        id: "maj13#11", 
        name: "Majeur treizième dièse 11", 
        symbol: "Δ13♯11", 
        alt: [],
        description: "L'accord maj13#11 représente probablement la structure harmonique la plus complète du système tonal occidental, combinant la base majeur septième avec toutes les extensions colorantes (9, #11, 13). Cette palette sonore extraordinaire, issue du mode lydien, offre à la fois stabilité et couleur. Utilisé dans le jazz contemporain, la fusion et les arrangements sophistiqués pour son caractère complet et nuancé.",
        lickDescription: "Sur un maj13#11, utilisez la gamme lydienne qui contient naturellement toutes les extensions de cet accord. Des phrases qui explorent les différentes combinaisons d'extensions créent des lignes mélodiques riches en couleurs et en nuances harmoniques.",
        arpegeDescription: "L'arpège maj13#11 (1-3-5-7-9-#11-13) offre d'infinies possibilités créatives. Des motifs qui regroupent ces notes en différentes cellules mélodiques peuvent créer des lignes d'une sophistication harmonique remarquable.",
        riffDescription: "Les riffs maj13#11 sont caractéristiques du jazz contemporain et de la fusion avancée. Construisez des structures qui exploitent la tension subtile de la onzième augmentée dans le contexte luxuriant des extensions de neuvième et treizième pour un maximum de richesse harmonique.",
        intervals: ["1P", "3M", "5P", "7M", "9M", "11A", "13M"]
      },
      { 
        id: "7b13", 
        name: "Septième bémol 13", 
        symbol: "7♭13", 
        alt: [],
        description: "L'accord 7b13 ajoute une treizième bémol (ou sixte mineure) à la structure de septième dominante, créant une tension altérée distinctive. Cette coloration, issue du mode mixolydien b6, évoque souvent des atmosphères sombres ou mystérieuses tout en conservant la fonction dominante. Utilisé dans le jazz moderne et le blues sophistiqué pour sa tension expressive qui appelle fortement une résolution.",
        lickDescription: "Pour les licks sur 7b13, utilisez la gamme altérée ou mixolydienne b6. Des phrases qui mettent en valeur la treizième bémol et son mouvement de résolution vers la quinte de l'accord suivant créent des lignes mélodiques avec une forte directionnalité harmonique.",
        arpegeDescription: "L'arpège 7b13 (1-3-5-b7-b13) crée des lignes mélodiques avec une qualité menaçante distinctive. Des motifs qui isolent la tension entre la tierce majeure et la treizième bémol mettent en valeur le caractère dramatique de cet accord.",
        riffDescription: "Les riffs 7b13 fonctionnent bien dans le jazz moderne et le blues sophistiqué. Construisez des structures où la treizième bémol apporte sa couleur sombre distinctive, créant une tension qui contraste avec le caractère dominante de l'accord de base.",
        intervals: ["1P", "3M", "5P", "7m", "13m"]
      }
    ]
  },
  
  // Accords altérés composés
  "Altérés composés": {
    description: "Accords avec multiples altérations créant des sonorités très tendues et dissonantes. Utilisés dans le jazz moderne et la musique expérimentale pour leur forte tension et expressivité.",
    indice: ['#', 'b', '♭', '♯'],
    
    chords: [
      { 
        id: "7#9#11", 
        name: "Septième dièse 9 dièse 11", 
        symbol: "7♯9♯11", 
        alt: [],
        description: "L'accord 7#9#11 combine deux altérations ascendantes (neuvième augmentée et onzième augmentée) avec la structure de septième dominante, créant une tension complexe et moderniste. Cette double altération produit une sonorité à la fois brûlante et sophistiquée, utilisée dans le jazz contemporain et la fusion pour des moments de tension maximale ou des transitions harmoniques audacieuses.",
        lickDescription: "Sur un 7#9#11, utilisez la gamme altérée ou diminuée-ton. Des phrases qui mettent en valeur les deux altérations ascendantes et leur mouvement de résolution créent des lignes mélodiques avec une forte tension expressive et une directionnalité harmonique claire.",
        arpegeDescription: "L'arpège 7#9#11 (1-3-5-b7-#9-#11) crée des lignes mélodiques dramatiques et modernes. Des motifs qui isolent et confrontent les différentes tensions de cet accord complexe mettent en valeur sa richesse harmonique distinctive.",
        riffDescription: "Les riffs 7#9#11 sont caractéristiques du jazz fusion et du métal progressif. Construisez des structures qui exploitent la tension maximale créée par les multiples altérations, parfaites pour des moments de climax harmonique avant résolution.",
        intervals: ["1P", "3M", "5P", "7m", "9A", "11A"]
      },
      { 
        id: "7#9b13", 
        name: "Septième dièse 9 bémol 13", 
        symbol: "7♯9♭13", 
        alt: [],
        description: "L'accord 7#9b13 combine une altération ascendante (neuvième augmentée) et une altération descendante (treizième bémol) avec la structure de septième dominante. Cette combinaison crée une tension particulièrement expressive et dramatique, utilisée dans le jazz moderne et la fusion pour des moments de haute intensité harmonique.",
        lickDescription: "Pour les licks sur 7#9b13, utilisez la gamme altérée qui contient naturellement ces altérations. Des phrases qui exploitent le contraste entre la neuvième augmentée ascendante et la treizième bémol descendante créent des lignes mélodiques avec une expressivité dramatique.",
        arpegeDescription: "L'arpège 7#9b13 (1-3-5-b7-#9-b13) crée des lignes mélodiques avec une qualité à la fois brûlante et menaçante. Des motifs qui mettent en valeur le contraste entre les différentes altérations peuvent créer des tensions et résolutions internes fascinantes.",
        riffDescription: "Les riffs 7#9b13 brillent dans le jazz fusion avancé et le métal progressif. Construisez des structures où les altérations contrastées créent une instabilité dynamique, idéale pour créer des moments de tension avant des résolutions dramatiques.",
        intervals: ["1P", "3M", "5P", "7m", "9A", "13m"]
      },
      { 
        id: "7b9#11", 
        name: "Septième bémol 9 dièse 11", 
        symbol: "7♭9♯11", 
        alt: [],
        description: "L'accord 7b9#11 combine une altération descendante (neuvième bémol) et une altération ascendante (onzième augmentée) avec la structure de septième dominante. Cette combinaison crée une sonorité particulièrement dissonante et expressive, emblématique du bebop avancé et du jazz moderne pour des cadences de haute tension harmonique.",
        lickDescription: "Sur un 7b9#11, utilisez la gamme diminuée avec une onzième augmentée, ou la gamme altérée. Des phrases qui mettent en valeur la tension entre la neuvième bémol et l'onzième augmentée créent des lignes mélodiques avec une expressivité dramatique et une forte résolution.",
        arpegeDescription: "L'arpège 7b9#11 (1-3-5-b7-b9-#11) crée des lignes mélodiques avec une qualité à la fois menaçante et brillante. Des motifs qui regroupent les notes en cellules contrastées mettent en valeur les multiples tensions de cet accord complexe.",
        riffDescription: "Les riffs 7b9#11 sont caractéristiques du jazz moderne et de la fusion avancée. Construisez des structures qui exploitent le maximum de tension créé par les altérations contrastées, idéales pour des moments de pivot harmonique ou de cadence sophistiquée.",
        intervals: ["1P", "3M", "5P", "7m", "9m", "11A"]
      },
      { 
        id: "7b9b13", 
        name: "Septième bémol 9 bémol 13", 
        symbol: "7♭9♭13", 
        alt: [],
        description: "L'accord 7b9b13 combine deux altérations descendantes (neuvième bémol et treizième bémol) avec la structure de septième dominante, créant une tension sombre et dramatique. Cette double altération produit la sonorité caractéristique de la gamme altérée, emblématique du jazz contemporain pour des cadences de résolution intense, particulièrement en contexte mineur.",
        lickDescription: "Pour les licks sur 7b9b13, utilisez la gamme altérée ou superlocrien. Des phrases qui mettent en valeur les multiples tensions descendantes et leur résolution naturelle créent des lignes mélodiques avec une forte directionnalité harmonique et une expressivité dramatique.",
        arpegeDescription: "L'arpège 7b9b13 (1-3-5-b7-b9-b13) crée des lignes mélodiques avec une qualité sombre et menaçante. Des motifs qui regroupent ces tensions en différentes cellules mélodiques peuvent créer des contrastes internes expressifs dans le cadre d'une tension harmonique globale.",
        riffDescription: "Les riffs 7b9b13 brillent dans le jazz contemporain et le métal progressif. Construisez des structures qui exploitent la tension maximale créée par les multiples altérations descendantes, parfaites pour créer des moments de climax dramatique avant résolution.",
        intervals: ["1P", "3M", "5P", "7m", "9m", "13m"]
      }
    ]
  }
};


// Association entre chaque type d'accord et les modes recommandés
export const CHORD_MODE_ASSOCIATIONS = {
  // Triades de base
  "major": {
    id: "major",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "Le mode ionien (gamme majeure) est parfaitement adapté à l'accord majeur, tous ses degrés sont consonants avec l'accord." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le mode lydien ajoute une couleur brillante à l'accord majeur grâce à sa quarte augmentée (#11)." },
      { id: "mixolydian", name: "Mixolydien", priority: 3, description: "Le mode mixolydien fonctionne bien sur un accord majeur quand on veut ajouter une couleur plus bluesy avec la septième mineure." }
    ]
  },
  "minor": {
    id: "minor",
    recommendedModes: [
      { id: "aeolian", name: "Éolien", priority: 1, description: "Le mode éolien (mineur naturel) est le choix classique pour l'accord mineur, offrant une sonorité mineure pure." },
      { id: "dorian", name: "Dorien", priority: 2, description: "Le mode dorien ajoute une sixte majeure à l'accord mineur, créant une sonorité plus ouverte et moins sombre." },
      { id: "phrygian", name: "Phrygien", priority: 3, description: "Le mode phrygien donne une couleur plus sombre et orientale à l'accord mineur grâce à sa seconde mineure." }
    ]
  },
  "diminished": {
    id: "diminished",
    recommendedModes: [
      { id: "locrian", name: "Locrien", priority: 1, description: "Le mode locrien contient naturellement la quinte diminuée qui définit l'accord diminué." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 2, description: "La gamme diminuée demi-ton ton est parfaitement adaptée à l'accord diminué, contenant toutes ses notes et offrant des possibilités d'extension." },
      { id: "whole-half diminished", name: "Diminué ton demi-ton", priority: 3, description: "La gamme diminuée ton demi-ton est une autre option pour l'accord diminué, avec une sonorité légèrement différente." }
    ]
  },
  "augmented": {
    id: "augmented",
    recommendedModes: [
      { id: "whole tone", name: "Gamme par tons", priority: 1, description: "La gamme par tons entiers contient naturellement la quinte augmentée et fonctionne parfaitement sur l'accord augmenté." },
      { id: "lydian augmented", name: "Lydien augmenté", priority: 2, description: "Le mode lydien augmenté (3e mode de la mineur mélodique) contient la quinte augmentée tout en maintenant une structure de gamme plus familière." },
      { id: "altered", name: "Altéré", priority: 3, description: "La gamme altérée peut fonctionner sur un accord augmenté dans un contexte de tension dominante." }
    ]
  },

  // Accords de quinte
  "5": {
    id: "5",
    recommendedModes: [
      { id: "pentatonic minor", name: "Pentatonique mineure", priority: 1, description: "La pentatonique mineure est le choix classique pour les power chords, fonctionnant parfaitement dans les contextes rock et métal." },
      { id: "pentatonic major", name: "Pentatonique majeure", priority: 2, description: "La pentatonique majeure offre une alternative plus lumineuse sur les power chords." },
      { id: "blues", name: "Blues", priority: 3, description: "La gamme blues ajoute des blue notes expressives qui fonctionnent bien sur les power chords, particulièrement dans un contexte rock-blues." }
    ]
  },
  "m#5": {
    id: "m#5",
    recommendedModes: [
      { id: "harmonic minor", name: "Mineur harmonique", priority: 1, description: "Le mineur harmonique contient la tierce mineure et peut accommoder la quinte augmentée dans certains contextes." },
      { id: "phrygian dominant", name: "Phrygien dominant", priority: 2, description: "Le mode phrygien dominant (5e mode du mineur harmonique) peut fonctionner sur cet accord dans certains contextes." },
      { id: "whole tone", name: "Gamme par tons", priority: 3, description: "La gamme par tons entiers peut fonctionner sur m#5 en mettant l'accent sur la quinte augmentée." }
    ]
  },

  // Accords suspendus
  "sus2": {
    id: "sus2",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mode mixolydien fonctionne bien sur sus2, offrant une palette diatonique complète tout en respectant l'absence de tierce." },
      { id: "major pentatonic", name: "Pentatonique majeure", priority: 2, description: "La pentatonique majeure est parfaite sur sus2, évitant naturellement la tierce tout en offrant des lignes mélodiques claires." },
      { id: "dorian", name: "Dorien", priority: 3, description: "Le mode dorien peut fonctionner sur sus2 en évitant la tierce mineure ou en l'utilisant comme note de passage." }
    ]
  },
  "sus4": {
    id: "sus4",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mode mixolydien fonctionne parfaitement sur sus4, permettant de jouer autour de la tension et résolution 4-3." },
      { id: "dorian", name: "Dorien", priority: 2, description: "Le mode dorien peut fonctionner sur sus4, particulièrement dans des contextes modaux où l'accord n'a pas de fonction dominante." },
      { id: "lydian", name: "Lydien", priority: 3, description: "Le mode lydien crée une tension intéressante sur sus4, avec le contraste entre la quarte augmentée de la gamme et la quarte juste de l'accord." }
    ]
  },
  "7sus4": {
    id: "7sus4",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien est le choix naturel pour 7sus4, contenant à la fois la quarte et la septième mineure." },
      { id: "dorian", name: "Dorien", priority: 2, description: "Le dorien peut fonctionner sur 7sus4 dans certains contextes, en considérant la tierce mineure comme note de passage." },
      { id: "blues", name: "Blues", priority: 3, description: "La gamme blues fonctionne bien sur 7sus4, particulièrement dans les contextes funk et R&B." }
    ]
  },
  "9sus4": {
    id: "9sus4",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien est idéal pour 9sus4, contenant naturellement la quarte, la septième mineure et la neuvième." },
      { id: "dorian", name: "Dorien", priority: 2, description: "Le dorien peut fonctionner sur 9sus4 en évitant la tierce mineure ou en l'utilisant comme note colorante." },
      { id: "lydian dominant", name: "Lydien dominant", priority: 3, description: "Le lydien dominant offre une couleur intéressante sur 9sus4, en ajoutant une onzième augmentée comme note colorante." }
    ]
  },
  "sus24": {
    id: "sus24",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien fonctionne bien sur sus24, offrant un contexte diatonique complet autour des tensions 2 et 4." },
      { id: "major pentatonic", name: "Pentatonique majeure", priority: 2, description: "La pentatonique majeure fonctionne bien sur sus24, évitant la tierce tout en offrant une clarté mélodique." },
      { id: "dorian", name: "Dorien", priority: 3, description: "Le dorien peut fonctionner sur sus24 en approchant la tierce mineure comme note de passage ou de couleur." }
    ]
  },

  // Accords avec notes ajoutées
  "add9": {
    id: "add9",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "Le mode ionien est parfait pour add9, contenant naturellement la neuvième et la tierce majeure." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le lydien ajoute une couleur brillante à l'accord add9 grâce à sa quarte augmentée." },
      { id: "major pentatonic", name: "Pentatonique majeure", priority: 3, description: "La pentatonique majeure avec l'ajout de la neuvième fonctionne très bien sur add9, offrant des lignes claires et directes." }
    ]
  },
  "madd9": {
    id: "madd9",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien contient naturellement la neuvième majeure et s'harmonise parfaitement avec madd9." },
      { id: "aeolian", name: "Éolien", priority: 2, description: "L'éolien fonctionne bien sur madd9, apportant une saveur mineure naturelle avec la neuvième comme note d'extension." },
      { id: "minor pentatonic", name: "Pentatonique mineure", priority: 3, description: "La pentatonique mineure avec l'ajout de la neuvième crée des lignes expressives sur madd9." }
    ]
  },

  // Accords de sixte
  "6": {
    id: "6",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "Le mode ionien contient naturellement la sixte majeure et fonctionne parfaitement sur l'accord 6." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le lydien ajoute une couleur brillante à l'accord 6 grâce à sa quarte augmentée." },
      { id: "major pentatonic", name: "Pentatonique majeure", priority: 3, description: "La pentatonique majeure contient la sixte et offre des lignes mélodiques claires sur l'accord 6." }
    ]
  },
  "min6": {
    id: "min6",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien contient naturellement la sixte majeure et s'harmonise parfaitement avec min6." },
      { id: "melodic minor", name: "Mineur mélodique", priority: 2, description: "Le mineur mélodique ascendant contient la sixte majeure et ajoute une septième majeure comme couleur potentielle." },
      { id: "minor pentatonic", name: "Pentatonique mineure", priority: 3, description: "La pentatonique mineure avec l'ajout de la sixte majeure fonctionne très bien sur min6, particulièrement dans le jazz." }
    ]
  },
  "69": {
    id: "69",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "Le mode ionien contient naturellement la sixte et la neuvième et fonctionne parfaitement sur l'accord 6/9." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le lydien ajoute une couleur brillante à l'accord 6/9 grâce à sa quarte augmentée." },
      { id: "major pentatonic", name: "Pentatonique majeure", priority: 3, description: "La pentatonique majeure contient la sixte et offre des lignes claires sur 6/9, la neuvième peut être ajoutée comme note de couleur." }
    ]
  },
  "m69": {
    id: "m69",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien contient naturellement la sixte majeure et la neuvième, s'harmonisant parfaitement avec m6/9." },
      { id: "melodic minor", name: "Mineur mélodique", priority: 2, description: "Le mineur mélodique ascendant contient sixte et neuvième, ajoutant une septième majeure comme couleur potentielle." },
      { id: "minor hexatonic", name: "Hexatonique mineure", priority: 3, description: "Une gamme hexatonique mineure incluant sixte et neuvième fonctionne parfaitement sur m6/9." }
    ]
  },

  // Accords de septième
  "7": {
    id: "7",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien est le mode par excellence pour l'accord 7, contenant toutes ses notes et des extensions diatoniques." },
      { id: "blues", name: "Blues", priority: 2, description: "La gamme blues offre une expressivité unique sur les accords 7, apportant cette couleur bluesy caractéristique." },
      { id: "lydian dominant", name: "Lydien dominant", priority: 3, description: "Le lydien dominant (4e mode du mineur mélodique) ajoute une onzième augmentée comme couleur distinctive sur l'accord 7." }
    ]
  },
  "maj7": {
    id: "maj7",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "Le mode ionien contient naturellement la septième majeure et s'harmonise parfaitement avec maj7." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le lydien ajoute une couleur brillante à l'accord maj7 grâce à sa quarte augmentée (#11)." },
      { id: "major pentatonic", name: "Pentatonique majeure", priority: 3, description: "La pentatonique majeure avec l'ajout de la septième majeure fonctionne très bien sur maj7." }
    ]
  },
  "min7": {
    id: "min7",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien est le mode privilégié pour min7, offrant une sixte majeure comme extension naturelle." },
      { id: "aeolian", name: "Éolien", priority: 2, description: "L'éolien donne une saveur plus sombre au min7 avec sa sixte mineure." },
      { id: "phrygian", name: "Phrygien", priority: 3, description: "Le phrygien offre une couleur encore plus sombre au min7 grâce à sa seconde mineure." }
    ]
  },
  "minMaj7": {
    id: "minMaj7",
    recommendedModes: [
      { id: "melodic minor", name: "Mineur mélodique", priority: 1, description: "Le mineur mélodique contient naturellement la combinaison tierce mineure et septième majeure qui définit minMaj7." },
      { id: "harmonic minor", name: "Mineur harmonique", priority: 2, description: "Le mineur harmonique contient aussi la combinaison tierce mineure et septième majeure qui définit minMaj7." },
      { id: "phrygian #3", name: "Phrygien #3", priority: 3, description: "Une variante moins commune qui peut créer des couleurs intéressantes sur minMaj7." }
    ]
  },
  "dim7": {
    id: "dim7",
    recommendedModes: [
      { id: "whole-half diminished", name: "Diminué ton demi-ton", priority: 1, description: "La gamme diminuée ton-demi-ton contient naturellement toutes les notes de l'accord dim7 et est parfaitement adaptée pour l'improvisation." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 2, description: "La gamme diminuée demi-ton-ton offre une alternative avec une saveur légèrement différente sur dim7." },
      { id: "altered", name: "Altéré", priority: 3, description: "La gamme altérée peut fonctionner sur dim7 dans certains contextes, particulièrement en transition." }
    ]
  },
  "min7b5": {
    id: "min7b5",
    recommendedModes: [
      { id: "locrian", name: "Locrien", priority: 1, description: "Le locrien contient naturellement toutes les notes de min7b5 et est le mode classique pour cet accord." },
      { id: "locrian #2", name: "Locrien #2", priority: 2, description: "Le locrien #2 (6e mode du mineur mélodique) offre une couleur plus mélodique sur min7b5 grâce à sa seconde majeure." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 3, description: "La gamme diminuée demi-ton-ton peut fonctionner sur min7b5 en ajoutant des notes colorantes." }
    ]
  },
  "aug7": {
    id: "aug7",
    recommendedModes: [
      { id: "whole tone", name: "Gamme par tons", priority: 1, description: "La gamme par tons contient naturellement la quinte augmentée et fonctionne parfaitement sur aug7." },
      { id: "lydian dominant", name: "Lydien dominant", priority: 2, description: "Le lydien dominant avec une quinte altérée peut fonctionner sur aug7 dans certains contextes." },
      { id: "altered", name: "Altéré", priority: 3, description: "La gamme altérée peut fonctionner sur aug7 en mettant l'accent sur la quinte augmentée." }
    ]
  },
  "7b5": {
    id: "7b5",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée (7e mode du mineur mélodique) est parfaite pour 7b5, contenant naturellement la quinte diminuée." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 2, description: "La gamme diminuée demi-ton-ton fonctionne très bien sur 7b5, offrant de nombreuses tensions colorantes." },
      { id: "lydian dominant", name: "Lydien dominant", priority: 3, description: "Le lydien dominant avec quinte diminuée peut fonctionner sur 7b5, créant une tension distinctive." }
    ]
  },
  "maj7#5": {
    id: "maj7#5",
    recommendedModes: [
      { id: "lydian augmented", name: "Lydien augmenté", priority: 1, description: "Le lydien augmenté (3e mode du mineur mélodique) contient naturellement la combinaison septième majeure et quinte augmentée." },
      { id: "whole tone", name: "Gamme par tons", priority: 2, description: "La gamme par tons entiers peut fonctionner sur maj7#5 en évitant la septième majeure ou en l'utilisant comme note de passage." },
      { id: "augmented", name: "Gamme augmentée", priority: 3, description: "La gamme augmentée (alternance de seconde mineure et tierce mineure) fonctionne bien sur maj7#5." }
    ]
  },
  "maj7b5": {
    id: "maj7b5",
    recommendedModes: [
      { id: "lydian b5", name: "Lydien b5", priority: 1, description: "Le lydien b5 (4e mode du mineur mélodique) contient naturellement la combinaison septième majeure et quinte diminuée." },
      { id: "melodic minor", name: "Mineur mélodique", priority: 2, description: "Le mineur mélodique peut fonctionner sur maj7b5 dans certains contextes harmoniques spécifiques." },
      { id: "whole-half diminished", name: "Diminué ton demi-ton", priority: 3, description: "La gamme diminuée ton-demi-ton peut fonctionner sur maj7b5 en mettant l'accent sur certaines tensions." }
    ]
  },
  "min7#5": {
    id: "min7#5",
    recommendedModes: [
      { id: "melodic minor", name: "Mineur mélodique", priority: 1, description: "Le mineur mélodique peut fonctionner sur min7#5 dans certains contextes harmoniques." },
      { id: "whole tone", name: "Gamme par tons", priority: 2, description: "La gamme par tons peut fonctionner sur min7#5 en adaptant certaines notes pour correspondre à la tierce mineure." },
      { id: "augmented", name: "Gamme augmentée", priority: 3, description: "La gamme augmentée peut fonctionner sur min7#5 en mettant l'accent sur la quinte augmentée." }
    ]
  },

  // Accords de neuvième
  "9": {
    id: "9",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien contient naturellement toutes les notes de l'accord 9 et est le choix classique pour cet accord." },
      { id: "lydian dominant", name: "Lydien dominant", priority: 2, description: "Le lydien dominant ajoute une onzième augmentée comme couleur distinctive sur l'accord 9." },
      { id: "blues", name: "Blues", priority: 3, description: "La gamme blues offre une expressivité unique sur les accords 9, particulièrement dans le contexte funk ou R&B." }
    ]
  },
  "maj9": {
    id: "maj9",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "Le mode ionien contient naturellement toutes les notes de maj9 et est le choix classique pour cet accord." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le lydien ajoute une onzième augmentée comme couleur distinctive sur l'accord maj9." },
      { id: "major bebop", name: "Majeur bebop", priority: 3, description: "La gamme majeure bebop ajoute une note chromatique qui fonctionne bien sur maj9 dans un contexte jazz." }
    ]
  },
  "min9": {
    id: "min9",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien contient naturellement toutes les notes de min9 et offre une sixte majeure comme extension naturelle." },
      { id: "aeolian", name: "Éolien", priority: 2, description: "L'éolien fonctionne sur min9 avec une saveur plus sombre grâce à sa sixte mineure." },
      { id: "minor bebop", name: "Mineur bebop", priority: 3, description: "La gamme mineure bebop ajoute des notes chromatiques qui fonctionnent bien sur min9 dans un contexte jazz." }
    ]
  },
  "minMaj9": {
    id: "minMaj9",
    recommendedModes: [
      { id: "melodic minor", name: "Mineur mélodique", priority: 1, description: "Le mineur mélodique contient naturellement toutes les notes de minMaj9 et est le choix idéal pour cet accord." },
      { id: "harmonic minor", name: "Mineur harmonique", priority: 2, description: "Le mineur harmonique contient la combinaison tierce mineure et septième majeure, avec la neuvième comme extension." },
      { id: "dorian ♮7", name: "Dorien ♮7", priority: 3, description: "Le dorien avec septième majeure peut créer des couleurs intéressantes sur minMaj9." }
    ]
  },
  "7b9": {
    id: "7b9",
    recommendedModes: [
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 1, description: "La gamme diminuée demi-ton-ton contient naturellement la neuvième bémol et est parfaite pour 7b9." },
      { id: "phrygian dominant", name: "Phrygien dominant", priority: 2, description: "Le phrygien dominant (5e mode du mineur harmonique) fonctionne bien sur 7b9 avec sa seconde mineure." },
      { id: "altered", name: "Altéré", priority: 3, description: "La gamme altérée contient la neuvième bémol et offre d'autres altérations colorantes pour 7b9." }
    ]
  },
  "7#9": {
    id: "7#9",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée (7e mode du mineur mélodique) contient la neuvième augmentée et est idéale pour 7#9." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 2, description: "La gamme diminuée demi-ton-ton peut fonctionner sur 7#9 en mettant l'accent sur certaines tensions." },
      { id: "phrygian dominant", name: "Phrygien dominant", priority: 3, description: "Le phrygien dominant avec une neuvième augmentée ajoutée crée une tension distinctive sur 7#9." }
    ]
  },

  // Accords de onzième
  "11": {
    id: "11",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien contient naturellement l'onzième juste et toutes les autres notes de l'accord 11." },
      { id: "dorian", name: "Dorien", priority: 2, description: "Le dorien fonctionne bien sur 11, particulièrement quand l'accord est utilisé comme sus dominant." },
      { id: "blues", name: "Blues", priority: 3, description: "La gamme blues peut fonctionner sur 11 dans un contexte funk ou R&B." }
    ]
  },
  "maj11": {
    id: "maj11",
    recommendedModes: [
      { id: "lydian", name: "Lydien", priority: 1, description: "Le lydien résout la dissonance entre tierce majeure et onzième juste grâce à sa quarte augmentée, idéal pour maj11." },
      { id: "ionian", name: "Ionien", priority: 2, description: "L'ionien peut fonctionner sur maj11 si la tierce est minimisée ou si l'onzième est utilisée comme note de passage." },
      { id: "lydian augmented", name: "Lydien augmenté", priority: 3, description: "Le lydien augmenté ajoute une quinte augmentée comme couleur supplémentaire sur maj11." }
    ]
  },
  "min11": {
    id: "min11",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien contient naturellement toutes les notes de min11 et offre une sixte majeure comme extension naturelle." },
      { id: "aeolian", name: "Éolien", priority: 2, description: "L'éolien fonctionne sur min11 avec une saveur plus sombre grâce à sa sixte mineure." },
      { id: "phrygian", name: "Phrygien", priority: 3, description: "Le phrygien offre une couleur encore plus sombre pour min11 avec sa seconde mineure distinctive." }
    ]
  },
  "7#11": {
    id: "7#11",
    recommendedModes: [
      { id: "lydian dominant", name: "Lydien dominant", priority: 1, description: "Le lydien dominant (4e mode du mineur mélodique) contient naturellement la onzième augmentée et est parfait pour 7#11." },
      { id: "altered", name: "Altéré", priority: 2, description: "La gamme altérée peut fonctionner sur 7#11 en mettant l'accent sur la onzième augmentée et d'autres tensions." },
      { id: "whole tone", name: "Gamme par tons", priority: 3, description: "La gamme par tons entiers contient la onzième augmentée et fonctionne bien sur 7#11." }
    ]
  },
"maj7#11": {
    id: "maj7#11",
    recommendedModes: [
      { id: "lydian", name: "Lydien", priority: 1, description: "Le lydien contient naturellement la onzième augmentée qui définit maj7#11 et est le choix idéal pour cet accord." },
      { id: "lydian augmented", name: "Lydien augmenté", priority: 2, description: "Le lydien augmenté ajoute une quinte augmentée comme couleur supplémentaire sur maj7#11." },
      { id: "major bebop", name: "Majeur bebop", priority: 3, description: "La gamme majeure bebop avec une onzième augmentée ajoutée peut fonctionner sur maj7#11 dans un contexte jazz." }
    ]
  },

  // Accords de treizième
  "13": {
    id: "13",
    recommendedModes: [
      { id: "mixolydian", name: "Mixolydien", priority: 1, description: "Le mixolydien contient naturellement la treizième majeure ainsi que toutes les autres notes de l'accord 13." },
      { id: "lydian dominant", name: "Lydien dominant", priority: 2, description: "Le lydien dominant ajoute une onzième augmentée comme couleur distinctive sur l'accord 13." },
      { id: "blues", name: "Blues", priority: 3, description: "La gamme blues avec l'ajout de la treizième offre une expressivité unique sur 13 dans un contexte funk ou R&B." }
    ]
  },
  "maj13": {
    id: "maj13",
    recommendedModes: [
      { id: "ionian", name: "Ionien", priority: 1, description: "L'ionien contient naturellement toutes les notes de maj13 et constitue le choix classique pour cet accord." },
      { id: "lydian", name: "Lydien", priority: 2, description: "Le lydien ajoute une onzième augmentée comme couleur distinctive sur l'accord maj13." },
      { id: "major bebop", name: "Majeur bebop", priority: 3, description: "La gamme majeure bebop offre des notes de passage chromatiques qui fonctionnent bien sur maj13 dans un contexte jazz." }
    ]
  },
  "min13": {
    id: "min13",
    recommendedModes: [
      { id: "dorian", name: "Dorien", priority: 1, description: "Le dorien contient naturellement la treizième majeure et toutes les autres notes de min13." },
      { id: "melodic minor", name: "Mineur mélodique", priority: 2, description: "Le mineur mélodique ajoute une septième majeure comme couleur alternative sur min13." },
      { id: "minor bebop", name: "Mineur bebop", priority: 3, description: "La gamme mineure bebop offre des notes de passage chromatiques qui fonctionnent bien sur min13 dans un contexte jazz." }
    ]
  },
  "maj13#11": {
    id: "maj13#11",
    recommendedModes: [
      { id: "lydian", name: "Lydien", priority: 1, description: "Le lydien contient naturellement la onzième augmentée qui définit maj13#11, ainsi que la treizième majeure." },
      { id: "lydian augmented", name: "Lydien augmenté", priority: 2, description: "Le lydien augmenté ajoute une quinte augmentée comme couleur supplémentaire sur maj13#11." },
      { id: "major bebop lydian", name: "Majeur bebop lydien", priority: 3, description: "Une variante bebop du lydien qui ajoute des notes de passage chromatiques sur maj13#11." }
    ]
  },
  "7b13": {
    id: "7b13",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée contient naturellement la treizième bémol et est parfaite pour 7b13." },
      { id: "phrygian dominant", name: "Phrygien dominant", priority: 2, description: "Le phrygien dominant contient la treizième bémol et fonctionne bien sur 7b13." },
      { id: "whole-half diminished", name: "Diminué ton demi-ton", priority: 3, description: "La gamme diminuée ton-demi-ton peut fonctionner sur 7b13 en mettant l'accent sur certaines tensions." }
    ]
  },

  // Accords altérés composés
  "7#9#11": {
    id: "7#9#11",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée contient à la fois la neuvième augmentée et la onzième augmentée, parfaite pour 7#9#11." },
      { id: "diminished whole tone", name: "Diminué-ton entier", priority: 2, description: "Cette fusion des gammes diminuée et par tons offre toutes les altérations nécessaires pour 7#9#11." },
      { id: "lydian dominant #9", name: "Lydien dominant #9", priority: 3, description: "Une variante du lydien dominant qui inclut une neuvième augmentée, idéale pour 7#9#11." }
    ]
  },
  "7#9b13": {
    id: "7#9b13",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée contient naturellement la neuvième augmentée et la treizième bémol, parfaite pour 7#9b13." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 2, description: "La gamme diminuée demi-ton-ton peut fonctionner sur 7#9b13 en mettant l'accent sur certaines tensions." },
      { id: "phrygian dominant #9", name: "Phrygien dominant #9", priority: 3, description: "Une variante du phrygien dominant avec une neuvième augmentée ajoutée, pour 7#9b13." }
    ]
  },
  "7b9#11": {
    id: "7b9#11",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée contient la neuvième bémol et la onzième augmentée, parfaite pour 7b9#11." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 2, description: "La gamme diminuée demi-ton-ton peut fonctionner sur 7b9#11, particulièrement avec l'ajout de la onzième augmentée." },
      { id: "phrygian dominant #11", name: "Phrygien dominant #11", priority: 3, description: "Une variante du phrygien dominant avec une onzième augmentée ajoutée, pour 7b9#11." }
    ]
  },
  "7b9b13": {
    id: "7b9b13",
    recommendedModes: [
      { id: "altered", name: "Altéré", priority: 1, description: "La gamme altérée contient naturellement la neuvième bémol et la treizième bémol, parfaite pour 7b9b13." },
      { id: "phrygian dominant", name: "Phrygien dominant", priority: 2, description: "Le phrygien dominant contient naturellement la neuvième bémol et la treizième bémol, idéal pour 7b9b13." },
      { id: "half-whole diminished", name: "Diminué demi-ton ton", priority: 3, description: "La gamme diminuée demi-ton-ton peut fonctionner sur 7b9b13 avec certaines adaptations." }
    ]
  }
};

// Tableau inversé: modes recommandés pour chaque accord
export const MODE_CHORD_ASSOCIATIONS = {
  // Modes diatoniques
  "ionian": {
    id: "ionian",
    recommendedChords: [
      { id: "major", name: "Majeur", priority: 1, description: "L'accord majeur est l'accord de tonique naturel du mode ionien, tous ses degrés correspondent parfaitement." },
      { id: "maj7", name: "Majeur septième", priority: 2, description: "Le maj7 inclut la septième majeure caractéristique du mode ionien, créant une sonorité riche et complète." },
      { id: "maj9", name: "Majeur neuvième", priority: 3, description: "Le maj9 étend l'harmonie avec la neuvième, parfaitement consonante dans le mode ionien." },
      { id: "maj13", name: "Majeur treizième", priority: 4, description: "Le maj13 inclut toutes les extensions diatoniques possibles dans le mode ionien." },
      { id: "6", name: "Sixte", priority: 5, description: "L'accord de sixte offre une alternative douce au maj7 qui fonctionne parfaitement dans le mode ionien." }
    ]
  },
  "dorian": {
    id: "dorian",
    recommendedChords: [
      { id: "min7", name: "Mineur septième", priority: 1, description: "Le min7 est l'accord de tonique naturel du mode dorien, incluant sa septième mineure caractéristique." },
      { id: "min9", name: "Mineur neuvième", priority: 2, description: "Le min9 étend l'harmonie avec la neuvième, parfaitement consonante dans le mode dorien." },
      { id: "min11", name: "Mineur onzième", priority: 3, description: "Le min11 ajoute l'onzième, créant une sonorité modale caractéristique du dorien." },
      { id: "min13", name: "Mineur treizième", priority: 4, description: "Le min13 inclut la treizième (sixte majeure) caractéristique qui distingue le dorien des autres modes mineurs." },
      { id: "min6", name: "Mineur sixte", priority: 5, description: "Le mineur sixte met en valeur la sixte majeure distinctive du mode dorien, sans la septième." }
    ]
  },
  "phrygian": {
    id: "phrygian",
    recommendedChords: [
      { id: "min7", name: "Mineur septième", priority: 1, description: "Le min7 est un accord de tonique efficace pour le mode phrygien, bien que n'incluant pas sa seconde mineure caractéristique." },
      { id: "min7b9", name: "Mineur septième bémol 9", priority: 2, description: "Le min7b9 inclut la seconde mineure (b9) caractéristique du mode phrygien." },
      { id: "min11", name: "Mineur onzième", priority: 3, description: "Le min11 étend l'harmonie avec l'onzième, créant une sonorité modale riche pour le phrygien." },
      { id: "7b9b13", name: "Septième bémol 9 bémol 13", priority: 4, description: "Comme accord dominant altéré, il capture l'essence du phrygien avec ses altérations caractéristiques." },
      { id: "sus4b9", name: "Sus4 bémol 9", priority: 5, description: "Le sus4b9 crée une sonorité phrygienne distinctive en évitant la tierce et incluant la seconde mineure." }
    ]
  },
  "lydian": {
    id: "lydian",
    recommendedChords: [
      { id: "maj7#11", name: "Majeur septième dièse 11", priority: 1, description: "Le maj7#11 est l'accord idéal pour le mode lydien, incluant sa quarte augmentée (#11) caractéristique." },
      { id: "maj9#11", name: "Majeur neuvième dièse 11", priority: 2, description: "Le maj9#11 étend l'harmonie avec la neuvième tout en conservant la quarte augmentée caractéristique." },
      { id: "maj13#11", name: "Majeur treizième dièse 11", priority: 3, description: "Le maj13#11 inclut toutes les extensions possibles avec la quarte augmentée distinctive du lydien." },
      { id: "maj7", name: "Majeur septième", priority: 4, description: "Le maj7 fonctionne bien sur le lydien même sans la #11, qui peut être utilisée mélodiquement." },
      { id: "6/9#11", name: "Sixte neuvième dièse 11", priority: 5, description: "Une variante de 6/9 qui inclut la quarte augmentée du lydien pour une couleur distinctive." }
    ]
  },
  "mixolydian": {
    id: "mixolydian",
    recommendedChords: [
      { id: "7", name: "Septième", priority: 1, description: "Le 7 (dominant) est l'accord de tonique naturel du mode mixolydien, incluant sa septième mineure caractéristique." },
      { id: "9", name: "Neuvième", priority: 2, description: "Le 9 étend l'harmonie avec la neuvième, parfaitement consonante dans le mode mixolydien." },
      { id: "13", name: "Treizième", priority: 3, description: "Le 13 inclut la treizième (sixte majeure), créant une sonorité riche caractéristique du mixolydien." },
      { id: "7sus4", name: "Septième sus4", priority: 4, description: "Le 7sus4 offre une couleur modale distinctive qui fonctionne parfaitement dans le mixolydien." },
      { id: "11", name: "Onzième", priority: 5, description: "Le 11 (souvent joué sans la tierce) crée une sonorité ouverte idéale pour le contexte modal du mixolydien." }
    ]
  },
  "aeolian": {
    id: "aeolian",
    recommendedChords: [
      { id: "min7", name: "Mineur septième", priority: 1, description: "Le min7 est l'accord de tonique naturel du mode éolien, incluant sa septième mineure caractéristique." },
      { id: "min9", name: "Mineur neuvième", priority: 2, description: "Le min9 étend l'harmonie avec la neuvième, parfaitement consonante dans le mode éolien." },
      { id: "min11", name: "Mineur onzième", priority: 3, description: "Le min11 ajoute l'onzième, créant une sonorité modale riche pour l'éolien." },
      { id: "minor", name: "Mineur", priority: 4, description: "L'accord mineur simple est parfait comme accord de tonique basique pour le mode éolien." },
      { id: "min6", name: "Mineur sixte", priority: 5, description: "Bien que la sixte majeure ne soit pas diatonique dans l'éolien, le min6 peut créer une couleur intéressante en contexte." }
    ]
  },
  "locrian": {
    id: "locrian",
    recommendedChords: [
      { id: "min7b5", name: "Demi-diminué", priority: 1, description: "Le min7b5 est l'accord de tonique naturel du mode locrien, incluant sa quinte diminuée caractéristique." },
      { id: "diminished", name: "Diminué", priority: 2, description: "L'accord diminué simple met en valeur la quinte diminuée du locrien sans la septième." },
      { id: "min7b5b9", name: "Demi-diminué bémol 9", priority: 3, description: "Le min7b5b9 inclut la seconde mineure (b9) caractéristique du locrien en plus de la quinte diminuée." },
      { id: "7alt", name: "Septième altéré", priority: 4, description: "L'accord 7 altéré peut fonctionner dans un contexte locrien en créant une forte tension harmonique." },
      { id: "dim7", name: "Diminué septième", priority: 5, description: "Bien que contenant une septième diminuée non diatonique, le dim7 peut créer une couleur intéressante en contexte locrien." }
    ]
  },

  // Modes de la gamme mineure mélodique
  "melodic minor": {
    id: "melodic minor",
    recommendedChords: [
      { id: "minMaj7", name: "Mineur majeur septième", priority: 1, description: "Le minMaj7 est l'accord de tonique parfait pour le mineur mélodique, incluant sa septième majeure caractéristique." },
      { id: "minMaj9", name: "Mineur majeur neuvième", priority: 2, description: "Le minMaj9 étend l'harmonie avec la neuvième, parfaitement consonante dans le mineur mélodique." },
      { id: "min6/9", name: "Mineur sixte neuvième", priority: 3, description: "Le min6/9 met en valeur la sixte majeure caractéristique du mineur mélodique, avec la neuvième comme extension." },
      { id: "minor", name: "Mineur", priority: 4, description: "L'accord mineur simple peut fonctionner comme base, les notes caractéristiques du mineur mélodique étant utilisées mélodiquement." },
      { id: "min6", name: "Mineur sixte", priority: 5, description: "Le min6 met en valeur la sixte majeure du mineur mélodique sans la septième majeure." }
    ]
  },
  "lydian dominant": {
    id: "lydian dominant",
    recommendedChords: [
      { id: "7#11", name: "Septième dièse 11", priority: 1, description: "Le 7#11 est l'accord parfait pour le lydien dominant, incluant sa septième mineure et sa quarte augmentée (#11) caractéristiques." },
      { id: "9#11", name: "Neuvième dièse 11", priority: 2, description: "Le 9#11 étend l'harmonie avec la neuvième tout en conservant les notes caractéristiques du lydien dominant." },
      { id: "13#11", name: "Treizième dièse 11", priority: 3, description: "Le 13#11 inclut toutes les extensions possibles avec la quarte augmentée distinctive du lydien dominant." },
      { id: "7", name: "Septième", priority: 4, description: "L'accord 7 simple peut fonctionner, la quarte augmentée étant utilisée mélodiquement comme note colorante." },
      { id: "7#4", name: "Septième dièse 4", priority: 5, description: "Variante de notation pour 7#11, mettant l'accent sur la quarte augmentée dans la structure de base de l'accord." }
    ]
  },
  "lydian augmented": {
    id: "lydian augmented",
    recommendedChords: [
      { id: "maj7#5", name: "Majeur septième dièse 5", priority: 1, description: "Le maj7#5 est l'accord parfait pour le lydien augmenté, incluant sa quinte augmentée caractéristique." },
      { id: "maj7#11#5", name: "Majeur septième dièse 11 dièse 5", priority: 2, description: "Le maj7#11#5 inclut à la fois la quarte et la quinte augmentées caractéristiques du lydien augmenté." },
      { id: "maj9#5", name: "Majeur neuvième dièse 5", priority: 3, description: "Le maj9#5 étend l'harmonie avec la neuvième tout en conservant la quinte augmentée distinctive." },
      { id: "augmented", name: "Augmenté", priority: 4, description: "L'accord augmenté simple met en valeur la quinte augmentée du lydien augmenté sans les extensions." },
      { id: "maj7#11", name: "Majeur septième dièse 11", priority: 5, description: "Le maj7#11 capture la quarte augmentée du lydien augmenté, la quinte augmentée pouvant être utilisée mélodiquement." }
    ]
  },
  "altered": {
    id: "altered",
    recommendedChords: [
      { id: "7alt", name: "Septième altéré", priority: 1, description: "Le 7alt (avec diverses altérations possibles) est l'accord parfait pour la gamme altérée." },
      { id: "7b9b13", name: "Septième bémol 9 bémol 13", priority: 2, description: "Le 7b9b13 capture deux des altérations caractéristiques de la gamme altérée." },
      { id: "7#9b13", name: "Septième dièse 9 bémol 13", priority: 3, description: "Le 7#9b13 offre une autre combinaison d'altérations caractéristiques de cette gamme." },
      { id: "7b5#9", name: "Septième bémol 5 dièse 9", priority: 4, description: "Le 7b5#9 combine deux altérations différentes pour une couleur altérée distinctive." },
      { id: "7#11b9", name: "Septième dièse 11 bémol 9", priority: 5, description: "Le 7#11b9 offre encore une autre combinaison d'altérations caractéristiques de la gamme altérée." }
    ]
  },

  // Autres modes et gammes importantes
  "harmonic minor": {
    id: "harmonic minor",
    recommendedChords: [
      { id: "minMaj7", name: "Mineur majeur septième", priority: 1, description: "Le minMaj7 est l'accord de tonique parfait pour le mineur harmonique, incluant sa septième majeure caractéristique." },
      { id: "min(maj9)", name: "Mineur majeur neuvième", priority: 2, description: "Le min(maj9) étend l'harmonie avec la neuvième, parfaitement consonante dans le mineur harmonique." },
      { id: "7b9", name: "Septième bémol 9", priority: 3, description: "Le 7b9 est parfait comme accord dominant dans le contexte du mineur harmonique (sur le V degré)." },
      { id: "dim7", name: "Diminué septième", priority: 4, description: "Le dim7 fonctionne bien sur le vii degré du mineur harmonique, incluant la septième diminuée." },
      { id: "minor", name: "Mineur", priority: 5, description: "L'accord mineur simple peut fonctionner comme base, la septième majeure étant utilisée mélodiquement." }
    ]
  },
  "phrygian dominant": {
    id: "phrygian dominant",
    recommendedChords: [
      { id: "7b9", name: "Septième bémol 9", priority: 1, description: "Le 7b9 est l'accord parfait pour le phrygien dominant, incluant sa seconde mineure caractéristique." },
      { id: "7b9b13", name: "Septième bémol 9 bémol 13", priority: 2, description: "Le 7b9b13 ajoute la treizième bémol, autre note caractéristique du phrygien dominant." },
      { id: "9sus4b9", name: "Neuvième sus4 bémol 9", priority: 3, description: "Cette variante sus crée une couleur modale distinctive parfaite pour le phrygian dominant." },
      { id: "7", name: "Septième", priority: 4, description: "L'accord 7 simple peut fonctionner, la seconde mineure étant utilisée mélodiquement comme note colorante." },
      { id: "7sus4b9", name: "Septième sus4 bémol 9", priority: 5, description: "Une autre variante sus qui capture la seconde mineure caractéristique du mode." }
    ]
  },
  "whole tone": {
    id: "whole tone",
    recommendedChords: [
      { id: "7#5", name: "Septième dièse 5", priority: 1, description: "Le 7#5 (ou aug7) est l'accord parfait pour la gamme par tons, incluant sa quinte augmentée caractéristique." },
      { id: "9#5", name: "Neuvième dièse 5", priority: 2, description: "Le 9#5 étend l'harmonie avec la neuvième tout en conservant la quinte augmentée distinctive." },
      { id: "7#5#11", name: "Septième dièse 5 dièse 11", priority: 3, description: "Le 7#5#11 inclut deux altérations ascendantes typiques de la gamme par tons." },
      { id: "augmented", name: "Augmenté", priority: 4, description: "L'accord augmenté simple met en valeur la quinte augmentée, élément fondamental de la gamme par tons." },
      { id: "7#11", name: "Septième dièse 11", priority: 5, description: "Le 7#11 inclut la onzième augmentée de la gamme par tons sans la quinte augmentée." }
    ]
  },
  "half-whole diminished": {
    id: "half-whole diminished",
    recommendedChords: [
      { id: "dim7", name: "Diminué septième", priority: 1, description: "Le dim7 est l'accord parfait pour la gamme diminuée demi-ton ton, partageant sa structure symétrique." },
      { id: "7b9", name: "Septième bémol 9", priority: 2, description: "Le 7b9 est un accord dominant altéré qui fonctionne parfaitement avec cette gamme." },
      { id: "7b9b5", name: "Septième bémol 9 bémol 5", priority: 3, description: "Le 7b9b5 inclut deux altérations descendantes caractéristiques de cette gamme." },
      { id: "7b9#9", name: "Septième bémol 9 dièse 9", priority: 4, description: "Le 7b9#9 exploite la présence simultanée des neuvièmes mineure et augmentée dans cette gamme." },
      { id: "min7b5", name: "Demi-diminué", priority: 5, description: "Le min7b5 peut fonctionner avec cette gamme en contexte, bien que moins caractéristique que dim7." }
    ]
  },
  "whole-half diminished": {
    id: "whole-half diminished",
    recommendedChords: [
      { id: "dim7", name: "Diminué septième", priority: 1, description: "Le dim7 est l'accord parfait pour la gamme diminuée ton demi-ton, partageant sa structure symétrique." },
      { id: "min7b5", name: "Demi-diminué", priority: 2, description: "Le min7b5 peut fonctionner efficacement avec cette gamme dans certains contextes." },
      { id: "7b9b5", name: "Septième bémol 9 bémol 5", priority: 3, description: "Le 7b9b5 inclut des altérations caractéristiques de cette gamme." },
      { id: "diminished", name: "Diminué", priority: 4, description: "L'accord diminué simple (sans septième) fonctionne bien avec cette gamme." },
      { id: "7#9b5", name: "Septième dièse 9 bémol 5", priority: 5, description: "Le 7#9b5 exploite certaines tensions disponibles dans cette gamme." }
    ]
  },
  "blues": {
    id: "blues",
    recommendedChords: [
      { id: "7", name: "Septième", priority: 1, description: "Le 7 (dominant) est l'accord classique pour la gamme blues, créant la tension bluesy caractéristique." },
      { id: "9", name: "Neuvième", priority: 2, description: "Le 9 étend l'harmonie dominante avec la neuvième, très utilisé dans le blues." },
      { id: "13", name: "Treizième", priority: 3, description: "Le 13 ajoute encore plus de richesse harmonique tout en conservant le caractère blues." },
      { id: "min7", name: "Mineur septième", priority: 4, description: "Le min7 permet d'exploiter le côté mineur de la gamme blues, particulièrement la tierce mineure." },
      { id: "7#9", name: "Septième dièse 9", priority: 5, description: "Le fameux 'Hendrix chord' capture parfaitement l'ambiguïté majeur/mineur de la gamme blues." }
    ]
  }
};