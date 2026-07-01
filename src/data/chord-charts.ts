import type { ChordChart } from '../types'

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
    },

    // ─── Standards jazz essentiels manquants ───────────────────────────────────
    {
      name: "Grille 'Giant Steps'",
      genre: ["Jazz", "Bebop", "Jazz modal"],
      structure: "16 mesures",
      description: "La grille révolutionnaire de John Coltrane (1960) utilisant des modulations par tierces majeures — les fameux 'Coltrane Changes'. Elle traverse trois centres tonals équidistants (B, G, Eb) séparés de 400 cents, rendant toute improvisation tonale extrêmement exigeante. Point de départ de toute la théorie des substitutions par triton élargie.",
      chords: {
        majorKey: "Bmaj7 | D7 | Gmaj7 | Bb7 | Ebmaj7 | Am7-D7 | Gmaj7 | Bb7 | Ebmaj7 | F#7 | Bmaj7 | Fm7-Bb7 | Ebmaj7 | Db7 | F#maj7 | C7"
      },
      examples: [
        "Giant Steps (John Coltrane, 1960)",
        "Countdown (John Coltrane — variation sur Tune Up)",
        "26-2 (John Coltrane — variation sur Confirmation de Charlie Parker)"
      ],
      variations: [
        "Countdown: iim7-V7/III | IIImaj7 | iim7-V7/bVI | bVImaj7 | iim7-V7/bII | bIImaj7 | iim7-V7/I | Imaj7",
        "Coltrane Changes appliqués à 'Body and Soul' et 'But Not for Me'"
      ]
    },
    {
      name: "Grille 'Summertime'",
      genre: ["Jazz", "Blues", "Soul", "Classique américain"],
      structure: "16 mesures en mineur (forme binaire répétée)",
      description: "Berceuse de George Gershwin pour l'opéra Porgy and Bess (1935). La grille alterne entre le mode dorien et des accents majeurs, avec une cadence plagale caractéristique vers le IVmaj7 avant la résolution finale. Terrain idéal pour apprendre l'improvisation en mode dorien/éolien.",
      chords: {
        minorKey: "i | V7 | i | i | i | VI7 | ii7b5 | V7b9 | i | V7 | i | i | IVmaj7 | IV7 | i | V7"
      },
      examples: [
        "Summertime (George Gershwin, Porgy and Bess 1935)",
        "Summertime (Ella Fitzgerald & Louis Armstrong)",
        "Summertime (Janis Joplin / Big Brother and the Holding Company)",
        "Summertime (Miles Davis, Gil Evans)"
      ],
      variations: [
        "Version modale: vamp im7 | im7 | im7 | im7 | IVmaj7 | IVmaj7 | im7 | V7",
        "Version jazz avancée: ajouter des ii7b5-V7b9 substitutions"
      ]
    },
    {
      name: "Grille 'Misty'",
      genre: ["Jazz standard", "Ballade"],
      structure: "AABA de 32 mesures (8+8+8+8)",
      description: "Ballade jazz d'Erroll Garner (1954), l'une des plus enregistrées de l'histoire du jazz. La section A utilise des iim7-V7 secondaires vers IVmaj7, puis retour par VI7-IIm7-V7. Le pont part du IVmaj7 et explore plusieurs tonalités voisines avant de conclure sur le IIm7-V7. Idéal pour travailler les substitutions secondaires.",
      chords: {
        majorKey: "Imaj7 | Vm7-I7 | IVmaj7 | IVm7-VII7 | Imaj7-VIm7 | IIm7-V7 | IIIm7-VI7 | IIm7-V7 | Imaj7 | Vm7-I7 | IVmaj7 | IVm7-VII7 | Imaj7-VIm7 | IIm7-V7 | Imaj7 | Imaj7 || IVmaj7 | IVmaj7 | bVIIm7-bIII7 | bVImaj7 | bIIm7-bV7 | IIm7-V7 | Imaj7 | Vm7-I7"
      },
      examples: [
        "Misty (Erroll Garner, 1954)",
        "Misty (Ella Fitzgerald)",
        "Misty (Sarah Vaughan)",
        "Play Misty for Me (film, Clint Eastwood 1971)"
      ]
    },
    {
      name: "Grille 'Body and Soul'",
      genre: ["Jazz standard", "Ballade", "Bebop"],
      structure: "AABA de 32 mesures avec pont modulant à la tierce mineure",
      description: "Standard de Green/Heyman (1930), rendu légendaire par le chorus de Coleman Hawkins (1939) qui fonde le saxophone ténor dans le jazz. La section A est en Db majeur avec des ii-V-I riches ; le pont module vers D majeur (un demi-ton au-dessus), créant un contraste saisissant. John Coltrane en fera une version révolutionnaire.",
      chords: {
        majorKey: "IIm7-V7 | Imaj7-IIm7 | IIIm7-VI7 | IIm7-V7 | Imaj7 | IVm7-VII7 | IIIm7-VIm7 | IIm7-V7 | Imaj7-IIm7 | IIIm7-VI7 | IIm7-V7 | Imaj7 || bIIImaj7 | bIIImaj7 | bIIIm7-bVI7 | bIImaj7 | bIIm7-bV7 | IIm7-V7 | IIm7 | V7"
      },
      examples: [
        "Body and Soul (Coleman Hawkins, 1939 — enregistrement fondateur)",
        "Body and Soul (John Coltrane)",
        "Body and Soul (Amy Winehouse)"
      ],
      variations: [
        "Version bebop: enrichir chaque accord d'extensions (9, #11, 13) avec chromatic approach notes",
        "Version Coltrane Changes appliquée au pont"
      ]
    },
    {
      name: "Grille 'There Will Never Be Another You'",
      genre: ["Jazz standard", "Bebop"],
      structure: "AABA de 32 mesures",
      description: "Standard de Harry Warren et Mack Gordon (1942), très prisé des boppers pour la richesse de ses ii-V secondaires et la facilité avec laquelle on peut y appliquer des substitutions de triton. La section A alterne résolutions majeures et mineures successives, offrant un excellent terrain d'entraînement.",
      chords: {
        majorKey: "Imaj7 | IVm7-VII7 | Imaj7 | bVIIm7-bIII7 | bVImaj7 | IIm7b5-V7b9 | Imaj7 | IIm7-V7 | Imaj7 | IVm7-VII7 | Imaj7 | bVIIm7-bIII7 | bVImaj7 | IIm7-V7 | Imaj7 | Imaj7"
      },
      examples: [
        "There Will Never Be Another You (Chet Baker)",
        "There Will Never Be Another You (Miles Davis)",
        "There Will Never Be Another You (Bill Evans)"
      ],
      variations: [
        "Version bebop rapide (up tempo): substitutions de triton sur tous les V7",
        "Application des Coltrane Changes au pont"
      ]
    },
    {
      name: "Grille 'Stella by Starlight'",
      genre: ["Jazz standard", "Ballade"],
      structure: "32 mesures (ABAC)",
      description: "Standard de Victor Young (1946), tiré du film The Uninvited. Sa structure ABAC (plutôt que AABA) et ses modulations fréquentes en font une grille de choix pour le travail des ii-V-I dans plusieurs tonalités. Miles Davis et Bill Evans en ont donné les lectures les plus importantes.",
      chords: {
        majorKey: "IIm7b5-V7b9 | im7 | IIm7-V7 | IIIm7-VI7 | IIm7-V7 | bVIm7-bII7 | Imaj7 | IIm7-V7 | IIm7b5-V7b9 | im7 | IVm7-VII7 | bIIImaj7 | IIm7b5-V7b9 | im7 | IIm7-V7 | Imaj7"
      },
      examples: [
        "Stella by Starlight (Miles Davis, Kind of Blue era)",
        "Stella by Starlight (Bill Evans Trio)",
        "Stella by Starlight (Stan Getz)"
      ]
    },
    // ─── Grilles non-occidentales ───────────────────────────────────────────────
    {
      name: "Grille Flamenco por Seguiriya",
      genre: ["Flamenco", "Cante jondo"],
      structure: "Cycle de 12 temps (3+3+2+2+2) — accents sur 1, 3, 6, 8, 11",
      description: "La seguiriya est le palo le plus profond et tragique du flamenco, associé à la mort et à l'âme gitane. Son cycle de 12 temps est distinct de la soleá et de la bulería : les accents tombent sur 1, 3, 6, 8, 11. La cadence harmonique por seguiriya (En Phrygien dominant) descend I-bVII-bVI-V7, créant une tension inexorable. Le duende de García Lorca naît ici.",
      chords: {
        minorKey: "i | i | bVII | bVII | bVI | bVI | V7 | V7 | i | bII | bII | V7"
      },
      examples: [
        "Seguiriya (Camarón de la Isla)",
        "Seguiriya gitana (Manuel Torre)",
        "Siguiriyas (Paco de Lucía)"
      ]
    },
    {
      name: "Maqam Hijaz — Grille d'improvisation",
      genre: ["Musique arabe", "Musique turque", "Méditerranéenne"],
      structure: "8 mesures — cadence maqam Hijaz",
      description: "Le maqam Hijaz (équivalent de la gamme arabe ou phrygien dominant) est le maqam le plus emblématique de la musique proche-orientale. Sa seconde augmentée caractéristique (entre b2 et 3M) est immédiatement reconnaissable. Cette grille d'improvisation suit la structure typique d'un taqasim (improvisation libre) : d'abord l'exposition de la tonique, puis la montée vers les degrés élevés, puis la résolution. Fondamentale pour tout musicien voulant explorer les traditions arabes, turques et espagnoles.",
      chords: {
        minorKey: "i | bII | i | V7 | bII | V7 | i | i"
      },
      examples: [
        "Taqasim Hijaz (oud — Farid Al Atrash)",
        "Improvisations maqam Hijaz (ney — Kudsi Erguner)",
        "Cadence flamenca andalouse"
      ]
    },
    {
      name: "Raga Vamp — Drone modal",
      genre: ["Musique indienne classique", "Hindustani", "Fusion"],
      structure: "Vamp libre (cycle alaap) — 4 à 8 mesures",
      description: "Dans la musique indienne classique, l'harmonie est monodale — un seul accord (ou drone) tenu longuement pendant que le soliste explore les degrés du raga. Cette représentation guitaristique approxime un vamp de raga en mode dorien ou mixolydien, les deux modes les plus proches de nombreux ragas populaires. Le drone de la tanpura (4 cordes accordées Sa-Pa-Sa-Sa) est au cœur de cette esthétique. On joue sur la résonance et l'ornementation (gamak, meend, kan, andolan), pas sur les changements d'accords.",
      chords: {
        majorKey: "Im7 | Im7 | Im7 | Im7 | bVIImaj7 | IV | Im7 | Im7"
      },
      examples: [
        "Raag Yaman alaap (Pandit Ravi Shankar)",
        "Raag Bhairavi alap (Kishori Amonkar)",
        "Guitar raga (John McLaughlin — Shakti)"
      ]
    },
    {
      name: "Grille Klezmer (Freylekhs)",
      genre: ["Klezmer", "Musique ashkénaze", "Musique tsigane"],
      structure: "AABB de 16 mesures (8+8)",
      description: "La grille harmonique type d'un freylekhs (danse joyeuse klezmer) utilise le mode phrygien dominant (gamme arabe) ou le mineur harmonique pour les sections A, avec une section B plus majeure. Les modulations entre modes y sont fréquentes et caractéristiques. La musique klezmer d'Europe de l'Est (Pologne, Ukraine, Lituanie) a failli disparaître avec la Shoah mais connaît une renaissance depuis les années 1980 avec des musiciens comme Giora Feidman, David Krakauer et the Klezmatics.",
      chords: {
        minorKey: "i | bII | V7 | i | bVI | bVII | i | V7 | I | I | IV | V | I | bVII | i | V7"
      },
      examples: [
        "Hava Nagila (traditionnel — freylekhs)",
        "Oy Tumbalaika (traditionnel ashkénaze)",
        "David Krakauer Klezmer Madness"
      ]
    },
    {
      name: "Grille Highlife (Ghana)",
      genre: ["Highlife", "Afrique de l'Ouest", "Afrojazz"],
      structure: "16 mesures — forme circulaire",
      description: "Le highlife, né au Ghana dans les années 1920 à la croisée des musiques traditionnelles akan et de la fanfare coloniale britannique, utilise des progressions majeures simples avec un fort balancement rythmique. Sa grille circulaire reflète la conception africaine de la temporalité musicale comme cycle et non comme narration linéaire (début-milieu-fin). E.T. Mensah, King Bruce et les Ramblers International ont défini ce style qui a influencé toute la pop africaine occidentale.",
      chords: {
        majorKey: "I | IV | I | V | I | bVII | IV | I | I | IV | I | V | I | IV | bVII | I"
      },
      examples: [
        "Day By Day (E.T. Mensah & The Tempo's Band)",
        "Highlife traditionnel (Nkrumah era Ghana)",
        "Fela Kuti — premières influences"
      ]
    },

    {
      name: "Grille 'Autumn Leaves (détaillée)'",
      genre: ["Jazz standard", "Ballade"],
      structure: "AABA de 32 mesures",
      description: "Version étendue et harmoniquement détaillée d'Autumn Leaves (Joseph Kosma / Johnny Mercer, 1945). Modèle parfait pour étudier les ii-V-I consécutifs dans les tonalités relatives majeure et mineure. La section B descend par V7-im des degrés voisins avant de revenir au thème.",
      chords: {
        minorKey: "IVm7-VII7 | IIIbmaj7 | IIm7b5-V7 | im7 | IVm7-VII7 | IIIbmaj7 | IIm7b5-V7b9 | im7 | IIm7b5 | V7b9 | im7 | im7 | IVm7 | VII7 | IIIbmaj7 | IIbmaj7 | IIm7b5 | V7b9 | im7 | VIm7b5-II7 | IIm7b5-V7b9 | im7 | IVm7-VII7 | IIIbmaj7 | IIm7b5-V7b9 | im7"
      },
      examples: [
        "Autumn Leaves (Yves Montand, version originale)",
        "Autumn Leaves (Miles Davis, 1958 — Cannonball Adderley Quintet)",
        "Autumn Leaves (Bill Evans, Waltz for Debby)"
      ]
    },

  // ─── JAZZ STANDARDS (C-5) ─────────────────────────────────────────────────

  {
    name: "'Round Midnight",
    genre: ["Jazz standard", "Bebop", "Ballade"],
    structure: "AABA de 32 mesures (8+8+8+8)",
    description: "Standard de Thelonious Monk (1944), l'un des thèmes de jazz les plus enregistrés. Sa progression chromatique et ses harmonies substitutées sont emblématiques du style Monk : aucune note superflue, chaque accord génère une tension colorée et inattendue. La structure AABA en mode mineur avec l'arpège descendant de l'intro est immédiatement reconnaissable.",
    chords: {
      minorKey: "im6 | iiø7-V7b9 | im-IVm7 | bVII7-bVImaj7 | VIIdim7-V7b9 | im | iiø7-V7b9 | im6 | im6 | iiø7-V7b9 | im-IVm7 | bVII7-bVImaj7 | VIIdim7-V7b9 | im | iiø7-V7b9 | V7b9 | bIIImaj7-bVI7 | bIImaj7-V7 | iim7b5-V7b9 | im | IVm7-bVII7 | bVImaj7-bII7 | iiø7-V7b9 | V7b9 | im6 | iiø7-V7b9 | im-IVm7 | bVII7-bVImaj7 | VIIdim7-V7b9 | im | iiø7-V7b9 | im6"
    },
    examples: [
      "'Round Midnight (Thelonious Monk Quartet, 1947)",
      "'Round Midnight (Miles Davis, Columbia, 1957)",
      "'Round About Midnight (Charlie Parker, 1948)"
    ],
    variations: [
      "Intro canonique : im(maj7)-im7-im6-iiø7-V7b9 (arpège descendant Monk)",
      "Substitution tritone : V7b9 → bII7 pour renforcer le chromatisme"
    ]
  },

  {
    name: "Cherokee",
    genre: ["Jazz standard", "Bebop"],
    structure: "AABA de 64 mesures (16+16+32+16)",
    description: "Standard de Ray Noble (1938), terrain d'improvisation bebop rendu célèbre par Charlie Parker. Son bridge module par tons entiers descendants — le même principe que Coltrane utilisera 20 ans plus tard dans Giant Steps. Le thème A est simple, mais le pont est une leçon complète en modulations par tierces majeures.",
    chords: {
      majorKey: "Imaj7 | IVmaj7 | Imaj7 | iim7-V7 | iim7 | V7 | Imaj7 | Imaj7 | Imaj7 | IVmaj7 | Imaj7 | iim7-V7 | iim7 | V7 | Imaj7 | Imaj7 | bIImaj7 | V7/bII | bIImaj7 | V7/bII | bVImaj7 | V7/bVI | bIVmaj7 | V7/bIV | bIVmaj7 | V7/bIV | bIImaj7 | V7/bII | iim7 | V7 | Imaj7 | V7 | Imaj7 | IVmaj7 | Imaj7 | iim7-V7 | iim7 | V7 | Imaj7 | Imaj7 | Imaj7 | IVmaj7 | Imaj7 | iim7-V7 | iim7 | V7 | Imaj7 | Imaj7"
    },
    examples: [
      "Cherokee (Charlie Barnet, 1939 — version originale populaire)",
      "Ko-Ko (Charlie Parker, 1945 — bebop sur les changes de Cherokee)",
      "Cherokee (Clifford Brown, 1955)"
    ],
    variations: [
      "Bebop bridge : iiø7-V7b9-im sur chaque tonalité de passage",
      "Version accélérée : 240+ bpm, test de virtuosité bebop"
    ]
  },

  {
    name: "Wave (A Onda)",
    genre: ["Bossa Nova", "Jazz standard"],
    structure: "AABA de 32 mesures",
    description: "Composition d'Antônio Carlos Jobim (1967). Son harmonie utilise des médiantes chromatiques et des II-V-I en cascade vers des tonalités éloignées, créant un effet de 'vague' harmonique. Wave est l'une des compositions de Jobim les plus harmoniquement sophistiquées tout en restant mélodiquement immédiate.",
    chords: {
      majorKey: "Imaj7 | bVII7 | IIImaj7-VI7 | iim7-V7 | bVImaj7 | bII7 | Imaj7 | iim7-V7 | IIImaj7 | VI7 | IImaj7 | V7/II | iim7 | bII7 | Imaj7 | V7sus4 | Imaj7 | bVII7 | IIImaj7-VI7 | iim7-V7 | bVImaj7 | bII7 | Imaj7 | iim7-V7"
    },
    examples: [
      "Wave (Antônio Carlos Jobim, Wave LP, 1967)",
      "Wave (João Gilberto, 1969)",
      "Wave (Frank Sinatra & Tom Jobim, 1967)"
    ],
    variations: [
      "Guitare solo : voicings 4 sons sur les degrés altérés, position ouverte",
      "Trio piano : pédale de tonique pendant la descente chromatique des soprani"
    ]
  },

  {
    name: "Corcovado (Quiet Nights of Quiet Stars)",
    genre: ["Bossa Nova", "Jazz standard"],
    structure: "Couplet-refrain en 2 sections de 16 mesures",
    description: "Composition de Jobim (1960), l'une des plus intimes de la bossa nova. Sa progression alterne ii-V-I majeurs et mineurs avec des accords chromatiques intermédiaires (im-IV7-bVIImaj7-bIII7). Le titre fait référence au quartier Corcovado de Rio. La mélodie plane sur une harmonie dont les changements semblent flotter entre tension et résolution.",
    chords: {
      majorKey: "Imaj7 | im7-IV7 | bVIImaj7 | bIII7 | vim7 | bVI7 | iim7 | V7b9 | vim7 | bVI7 | Imaj7 | bII7 | iim7 | V7 | Imaj7 | Imaj7"
    },
    examples: [
      "Corcovado (Antônio Carlos Jobim, 1960)",
      "Quiet Nights of Quiet Stars (Stan Getz & João Gilberto, 1963)",
      "Quiet Nights (Ella Fitzgerald, 1982)"
    ],
    variations: [
      "Version lente : extensions 9 et 13 sur les dominants",
      "Version samba : accords en position fermée pour la basse"
    ]
  },

  {
    name: "Have You Met Miss Jones?",
    genre: ["Jazz standard", "Swing"],
    structure: "AABA de 32 mesures (8+8+8+8)",
    description: "Standard de Richard Rodgers / Lorenz Hart (1937). Son bridge module par tierces majeures (I → bVI → bIV → I), anticipant de 20 ans les Coltrane Changes. Cette modulation symétrique par tierces était unique en 1937 et a fasciné les boppers qui l'ont étudiée comme démonstration précoce des substitutions par tierces.",
    chords: {
      majorKey: "Imaj7 | iim7-V7 | Imaj7 | iiim7-VI7 | IVmaj7-V7 | iim7-bVII7 | Imaj7 | iiø7-V7b9 | Imaj7 | iim7-V7 | Imaj7 | iiim7-VI7 | IVmaj7-V7 | iim7-bVII7 | Imaj7 | Imaj7 | bVImaj7 | iim7/bVI-V7/bVI | bIVmaj7 | iim7/bIV-V7/bIV | Imaj7 | iim7-V7 | Imaj7 | V7 | Imaj7 | iim7-V7 | Imaj7 | iiim7-VI7 | IVmaj7-V7 | iim7-bVII7 | Imaj7 | Imaj7"
    },
    examples: [
      "Have You Met Miss Jones? (Hal McIntyre, 1937 — version originale)",
      "Have You Met Miss Jones? (Fats Waller, 1937)",
      "Have You Met Miss Jones? (Oscar Peterson Trio, 1959)"
    ],
    variations: [
      "Bridge tritone subs : V7/bVI → bII7 sur chaque tonalité de passage",
      "Arrangement Bill Evans : IVmaj7#11 sur les mesures A"
    ]
  }
  ];