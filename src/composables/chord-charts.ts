// Définition du type pour une grille d'accords
type ChordChart = {
    name: string;
    genre: string[];
    structure: string;
    description: string;
    chords: {
      majorKey?: string;   // Exemple en tonalité majeure (souvent Do majeur)
      minorKey?: string;   // Exemple en tonalité mineure (souvent La mineur)
    };
    examples: string[];    // Morceaux connus utilisant cette grille
    variations?: string[]; // Variations connues de la grille
  };
  
  // Liste des grilles d'accords connues
  export const chordCharts: ChordChart[] = [
    {
      name: "Blues 12 mesures",
      genre: ["Blues", "Jazz", "Rock", "R&B"],
      structure: "3 phrases de 4 mesures (AAB)",
      description: "La grille de blues la plus fondamentale, base de nombreux standards blues, rock et jazz. Typiquement jouée avec des accords de septième de dominante.",
      chords: {
        majorKey: "I7 | I7 | I7 | I7 | IV7 | IV7 | I7 | I7 | V7 | IV7 | I7 | V7",
        minorKey: "i7 | i7 | i7 | i7 | iv7 | iv7 | i7 | i7 | V7 | iv7 | i7 | V7"
      },
      examples: ["Sweet Home Chicago", "Johnny B. Goode", "Pride and Joy (Stevie Ray Vaughan)"],
      variations: [
        "Blues mineur: i7 | i7 | i7 | i7 | iv7 | iv7 | i7 | i7 | V7 | iv7 | i7 | i7",
        "Jazz Blues: I7 | IV7 | I7 | I7 | IV7 | IV7 | I7 | VI7 | ii7 | V7 | I7 | (V7)",
        "Quick Change: I7 | IV7 | I7 | I7 | IV7 | IV7 | I7 | I7 | V7 | IV7 | I7 | V7"
      ]
    },
    {
      name: "Rhythm Changes",
      genre: ["Jazz", "Bebop"],
      structure: "AABA de 32 mesures (8+8+8+8)",
      description: "Basée sur 'I Got Rhythm' de Gershwin, seconde grille la plus utilisée dans le jazz après le blues. Structure de base pour des centaines de standards de jazz.",
      chords: {
        majorKey: "I | vi | ii | V | I | vi | ii | V | I | I7 | IV | IVm | I | V | I | (V) || III7 | III7 | VI7 | VI7 | II7 | II7 | V | V || I | vi | ii | V | I | vi | ii | V | I | I7 | IV | IVm | I | V | I | I",
      },
      examples: ["I Got Rhythm (Gershwin)", "Oleo (Sonny Rollins)", "Anthropology (Charlie Parker)"],
      variations: [
        "Bird Changes: Variation bebop avec substitutions tritones",
        "Variation moderne: Utilisant des accords de substitution et extensions"
      ]
    },
    {
      name: "Anatole",
      genre: ["Jazz"],
      structure: "Séquence répétitive",
      description: "Progression courante dans le jazz, parfois assimilée à la première partie des Rhythm Changes. Motif cyclique souvent utilisé pour l'improvisation.",
      chords: {
        majorKey: "I | vi | ii | V | I | vi | ii | V",
      },
      examples: ["I Got Rhythm (section A)", "Nombreux standards de jazz"],
    },
    {
      name: "Canon de Pachelbel",
      genre: ["Classique", "Pop", "Rock"],
      structure: "Séquence répétitive",
      description: "Progression baroque très populaire qui a influencé d'innombrables chansons modernes.",
      chords: {
        majorKey: "I | V | vi | iii | IV | I | IV | V",
      },
      examples: ["Canon en Ré (Pachelbel)", "Basket Case (Green Day)", "Don't Look Back in Anger (Oasis)"],
    },
    {
      name: "ii-V-I",
      genre: ["Jazz", "Bossa Nova"],
      structure: "Séquence de 2 ou 4 mesures",
      description: "La progression harmonique fondamentale du jazz. Peut être enchaînée dans différentes tonalités pour créer des grilles complexes.",
      chords: {
        majorKey: "ii7 | V7 | Imaj7 | Imaj7",
        minorKey: "ii7b5 | V7b9 | im7 | im7"
      },
      examples: ["Autumn Leaves", "All The Things You Are", "There Will Never Be Another You"],
      variations: [
        "ii-V sans résolution: ii7 | V7 | (autre tonalité)",
        "ii-V-I tritone: ii7 | bII7 | Imaj7"
      ]
    },
    {
      name: "Coltrane Changes (Substitution par tierce)",
      genre: ["Jazz", "Jazz modal"],
      structure: "Séquence modulante",
      description: "Progression harmonique développée par John Coltrane utilisant des modulations par tierces majeures, créant un cycle symétrique de 12 mesures.",
      chords: {
        majorKey: "Imaj7 | bIIImaj7 | Vmaj7 | Imaj7",
      },
      examples: ["Giant Steps (John Coltrane)", "Countdown (John Coltrane)"],
    },
    {
      name: "Grille So What / Impressions",
      genre: ["Jazz modal"],
      structure: "AABA de 32 mesures",
      description: "Grille modale minimaliste popularisée par Miles Davis et John Coltrane, avec un seul accord par section, favorisant l'improvisation modale.",
      chords: {
        majorKey: "D-7 (16 mesures) | Eb-7 (8 mesures) | D-7 (8 mesures)",
      },
      examples: ["So What (Miles Davis)", "Impressions (John Coltrane)"],
    },
    {
      name: "Grille 'All The Things You Are'",
      genre: ["Jazz standard"],
      structure: "AABA' de 36 mesures",
      description: "Grille célèbre pour sa progression harmonique riche traversant plusieurs tonalités, souvent utilisée comme exercice d'improvisation.",
      chords: {
        majorKey: "Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | G7 | Cmaj7 | Cmaj7 | Cm7 | Fm7 | Bb7 | Ebmaj7 | Abmaj7 | D7 | Gmaj7 | Gmaj7 | Am7 | D7 | Gmaj7 | Gmaj7 | F#m7 | B7 | Emaj7 | Emaj7 | C7 | C7 | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | Gbmaj7 | Cmaj7 | Fm7 | Bb7 | Ebmaj7",
      },
      examples: ["All The Things You Are (Jerome Kern)"],
    },
    {
      name: "Grille I-V-vi-IV",
      genre: ["Pop", "Rock"],
      structure: "Séquence de 4 accords en boucle",
      description: "La progression pop la plus utilisée depuis les années 90, connue pour son caractère optimiste et émotionnel.",
      chords: {
        majorKey: "I | V | vi | IV",
      },
      examples: ["Let It Be (The Beatles)", "No Woman No Cry (Bob Marley)", "Don't Stop Believin' (Journey)"],
      variations: [
        "vi-IV-I-V: Version commençant par le relatif mineur",
        "I-V-vi-iii-IV: Version étendue"
      ]
    },
    {
      name: "Grille I-vi-IV-V",
      genre: ["Doo-wop", "Rock'n'Roll", "Pop des années 50-60"],
      structure: "Séquence de 4 accords en boucle",
      description: "Progression classique des années 50-60, base du doo-wop et du rock'n'roll primitif.",
      chords: {
        majorKey: "I | vi | IV | V",
      },
      examples: ["Stand By Me (Ben E. King)", "Earth Angel", "Blue Moon", "Heart and Soul"],
    },
    {
      name: "Grille La Folia",
      genre: ["Classique", "Baroque", "Folk"],
      structure: "Séquence répétitive de 16 mesures",
      description: "Une des plus anciennes progressions musicales documentées, originaire du Portugal au 15ème siècle, base de nombreuses variations classiques.",
      chords: {
        minorKey: "i | V | i | V | i | VII | III | VII | i | V | i | V | i | VII | III-V | i",
      },
      examples: ["La Folia (Corelli)", "Variations sur La Folia (Vivaldi)", "Nombreuses pièces baroques"],
    },
    {
      name: "Flamenco (Andalouse)",
      genre: ["Flamenco", "Musique espagnole"],
      structure: "Séquence de 4 accords",
      description: "Progression caractéristique de la musique espagnole et flamenco, utilisant la cadence phrygienne.",
      chords: {
        minorKey: "i | VII | VI | V",
      },
      examples: ["Malaguena", "Entre Dos Aguas (Paco de Lucía)"],
    },
    {
      name: "Grille Autumn Leaves",
      genre: ["Jazz", "Standard"],
      structure: "AABC de 32 mesures",
      description: "Une des grilles de jazz les plus jouées, excellente pour apprendre les progressions ii-V-I et leurs enchaînements.",
      chords: {
        minorKey: "i | VII | III | VI | ii | V | i | i | i | VII | III | VI | ii | V | i | i | IV | VII | III | VI | ii | V | i | i | i | VII | III | VI | ii | V | i | i",
      },
      examples: ["Autumn Leaves (Joseph Kosma)"],
    },
    {
      name: "Passamezzo Antico",
      genre: ["Renaissance", "Folk traditionnel"],
      structure: "Séquence de 8 mesures",
      description: "Progression de la Renaissance, base de nombreuses chansons traditionnelles.",
      chords: {
        minorKey: "i | VII | i | V | III | VII | i-V | i",
      },
      examples: ["Greensleeves (version originale)", "Nombreuses chansons folkloriques"],
    },
    {
      name: "Grille 'Blue Bossa'",
      genre: ["Latin Jazz", "Bossa Nova"],
      structure: "16 mesures",
      description: "Fusion de bossa nova et de jazz, avec des éléments de blues mineur.",
      chords: {
        minorKey: "i | i | IV | IV | i | i | V | V | III | III | VI | VI | ii7b5 | V7 | i | i",
      },
      examples: ["Blue Bossa (Kenny Dorham)"],
    },
    {
      name: "Grille Vamp Modal",
      genre: ["Rock", "Pop", "Funk"],
      structure: "2 accords en alternance",
      description: "Structure minimaliste populaire dans le funk, soul et rock, basée sur l'alternance de deux accords, souvent dans un mode dorien ou mixolydien.",
      chords: {
        majorKey: "I7 | bVII7 | I7 | bVII7",
        minorKey: "i7 | IV7 | i7 | IV7"
      },
      examples: ["Chameleon (Herbie Hancock)", "Evil Ways (Santana)", "Get Lucky (Daft Punk)"],
    },
    {
      name: "Grille 'Hit the Road Jack'",
      genre: ["R&B", "Soul"],
      structure: "8 mesures en boucle",
      description: "Progression descendante typique de la soul et du R&B des années 60.",
      chords: {
        minorKey: "i | VII | VI | V | i | VII | VI | V",
      },
      examples: ["Hit the Road Jack (Ray Charles)", "Love Me Do (Beatles)"],
    },
    {
      name: "Grille 'Eternal Triangle'",
      genre: ["Bebop", "Jazz"],
      structure: "AABA de 32 mesures",
      description: "Variation complexe des Rhythm Changes, avec substitutions avancées et modulations.",
      chords: {
        majorKey: "Cmaj7 | Am7 | Dm7 | G7 | Cmaj7 | Am7 | Dm7 | G7 | Cmaj7 | C7 | Fmaj7 | Fm7 | Cmaj7 | A7 | Dm7 | G7 | G7 | G#o7 | Am7 | E7alt | Am7 | D7 | Dm7 | G7 | Cmaj7 | Am7 | Dm7 | G7 | Cmaj7 | Dm7 | Cmaj7 | Cmaj7",
      },
      examples: ["The Eternal Triangle (Sonny Stitt)"],
    },
    {
      name: "Grille 'Bohemian Rhapsody'",
      genre: ["Rock progressif"],
      structure: "Multi-sections",
      description: "Grille complexe avec de multiples sections et transitions, exemple typique de rock progressif.",
      chords: {
        majorKey: "Trop complexe pour être notée brièvement, contient des progressions chromatiques et modulations multiples",
      },
      examples: ["Bohemian Rhapsody (Queen)"],
    }
  ];