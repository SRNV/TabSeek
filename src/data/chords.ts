import { ChordTypeDef } from '../types'
import { TonalChordType } from './tonalChordsMapping'

export const CHORDS: Record<TonalChordType, ChordTypeDef> = {
    // Triades de base
    "major": {
      notes: ["1", "3", "5"],
      intervals: ["1P", "3M", "5P"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 0, 2, 3, 0],
          fingers: [0, 1, 0, 2, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 3, 5, 5, 5, 3],
          fingers: [1, 1, 3, 4, 2, 1],
          barres: [3]
        }
      ],
      category: "Triades de base",
      description:
        "L’accord majeur est la triade fondatrice de la tonalité occidentale. Sa tierce majeure et sa quinte juste engendrent une stabilité lumineuse et une affirmation positive qui traversent toutes les cultures utilisant les tierces. Point de départ de toute harmonie classique, du chant grégorien au rock, en passant par la sonate et le gospel. Sa couleur ouverte et consensuelle le rend universel : il n’existe aucune tradition musicale utilisant des tierces qui ne connaisse l’accord majeur."
    },
    "minor": {
      notes: ["1", "b3", "5"],
      intervals: ["1P", "3m", "5P"],
      positions: [
        {
          position: 1,
          frets: [3, 4, 5, 5, 3, 3],
          fingers: [1, 2, 4, 3, 1, 1],
          barres: [3]
        },
        {
          position: 2,
          frets: [8, 8, 8, 10, 10, 8],
          fingers: [1, 1, 1, 4, 3, 1],
          barres: [8]
        }
      ],
      category: "Triades de base",
      description:
        "L’accord mineur se distingue par sa tierce mineure, abaissée d’un demi-ton par rapport au majeur. Cette légère altération suffit à basculer la couleur harmonique vers l’ombre, la mélancolie et l’introspection. Du blues aux ballades romantiques, de Beethoven à Radiohead, l’accord mineur est le langage universel de la profondeur émotionnelle. Sa tierce mineure crée une tension douce vers la résolution qui lui confère cet irrésistible pouvoir expressif."
    },
    "diminished": {
      notes: ["1", "b3", "b5"],
      intervals: ["1P", "3m", "5d"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 4, 5, 4, null],
          fingers: [0, 1, 2, 4, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, null, 10, 8, 10, null],
          fingers: [1, 0, 3, 1, 4, 0],
          barres: []
        }
      ],
      category: "Triades de base",
      description:
        "L’accord diminué, formé de deux tierces mineures superposées, crée une tension instable et inquiète. Sa quinte diminuée (triton) est l’intervalle le plus dissonant du système tonal — les médiévaux l’appelaient ‘diabolus in musica’. Indispensable comme accord de passage chromatique (VII°→I), dans le jazz pour les substitutions d’accords et comme couleur dramatique dans la musique de film. Sur guitare, ses quatre inversions enharmoniques permettent de couvrir tout le manche avec un seul doigté mobile."
    },
    "augmented": {
      notes: ["1", "3", "#5"],
      intervals: ["1P", "3M", "5A"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 2, 1, 1, null],
          fingers: [0, 3, 2, 1, 1, 0],
          barres: [1]
        },
        {
          position: 2,
          frets: [4, 3, 2, 1, null, null],
          fingers: [4, 3, 2, 1, 0, 0],
          barres: []
        }
      ],
      category: "Triades de base",
      description:
        "L’accord augmenté, composé de deux tierces majeures empilées, crée une ambiguïté tonale unique : ses trois inversions sont enharmoniquement identiques, rendant toute résolution possible et surprenante. Il produit un effet de flottement et d’attente suspendue. Debussy et les impressionnistes l’ont exploité pour dissoudre la tonalité ; en jazz, il sert d’accord de passage V7aug→I, et en rock, il colore les transitions les plus dramatiques (Beatles, ‘Oh! Darling’)."
    },
  
    // Accords de septième
    "7": {
      notes: ["1", "3", "5", "b7"],
      intervals: ["1P", "3M", "5P", "7m"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 3, 2, 3, 0],
          fingers: [0, 1, 4, 2, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 3, 5, 3, 5, 3],
          fingers: [1, 1, 3, 1, 4, 1],
          barres: [3]
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord de septième de dominante est le moteur harmonique de la musique tonale : il crée la tension maximale avant la résolution sur l’accord de tonique. Sa septième mineure forme un triton avec la tierce, générant un appel irrésistible vers la résolution. Sans le V7, ni la cadence parfaite, ni le blues à 12 mesures, ni le bebop n’existeraient. C’est l’accord le plus important de l’histoire de la musique occidentale, le fil conducteur entre Bach et Charlie Parker."
    },
    "maj7": {
      notes: ["1", "3", "5", "7"],
      intervals: ["1P", "3M", "5P", "7M"],
      positions: [
        {
          position: 1,
          frets: [0, 0, 0, 2, 3, 0],
          fingers: [0, 0, 0, 2, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 3, 4, 5, 5, 3],
          fingers: [1, 1, 2, 4, 3, 1],
          barres: [3]
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord majeur 7 est réputé pour son caractère doux, sophistiqué et légèrement mélancolique malgré sa couleur majeure. La septième majeure crée un intervalle de seconde mineure avec la fondamentale à l’octave, produisant une douceur veloutée caractéristique du jazz cool et de la bossa nova. Incontournable chez Bill Evans, Jobim et dans toute la tradition du jazz modal — il sonne le repos luxuriant, la résolution ample, le bonheur ambigu d’une lumière trop belle pour durer."
    },
    "min7": {
      notes: ["1", "b3", "5", "b7"],
      intervals: ["1P", "3m", "5P", "7m"],
      positions: [
        {
          position: 1,
          frets: [3, 4, 3, 5, 3, 3],
          fingers: [1, 2, 1, 3, 1, 1],
          barres: [3]
        },
        {
          position: 2,
          frets: [8, 8, 8, 8, 10, 8],
          fingers: [1, 1, 1, 1, 3, 1],
          barres: [8]
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord mineur 7 conjugue la chaleur du mineur et la souplesse de la septième mineure, créant une couleur mélancolique et détendue à la fois. C’est l’accord du mode dorien par excellence — il structure le ii dans un ii-V-I jazz et le im7 dans les vamps modaux. Sombre mais élégant, fondamental du jazz, de la soul et du R&B, il est la couleur d’Autumn Leaves, de So What (Miles Davis) et de la neo-soul moderne."
    },
    "min7b5": {
      notes: ["1", "b3", "b5", "b7"],
      intervals: ["1P", "3m", "5d", "7m"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 4, 3, 4, null],
          fingers: [0, 1, 3, 2, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, null, 8, 8, 7, null],
          fingers: [2, 0, 3, 4, 1, 0],
          barres: []
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord mineur 7 bémol 5, aussi appelé demi-diminué (symbole ø), combine tierce mineure, quinte diminuée et septième mineure. C’est le ii dans une cadence mineure ii°7-V7b9-im, et le degré VII dans la gamme majeure. Sa tension unique (triton entre b3 et b7) en fait un accord pivot essentiel entre les répertoires majeur et mineur. Chopin et Ravel en ont fait un outil expressif majeur ; en jazz, il ouvre toutes les cadences mineures les plus dramatiques."
    },
    "dim7": {
      notes: ["1", "b3", "b5", "bb7"],
      intervals: ["1P", "3m", "5d", "7d"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 4, 2, 4, null],
          fingers: [0, 2, 3, 1, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, null, 7, 8, 7, null],
          fingers: [2, 0, 1, 3, 1, 0],
          barres: [7]
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord dim7, formé exclusivement de tierces mineures successives, est le plus symétrique qui soit : il divise l’octave en quatre parties égales. Chacune de ses quatre inversions est enharmonique à un autre dim7 de racine différente, d’où sa redoutable polyvalence comme accord de substitution. Bouclier de Brahms dans les transitions harmoniques, carquois de Liszt dans les climax dramatiques — en jazz il permet une modulation chromatique vers n’importe quelle tonalité."
    },
    "minMaj7": {
      notes: ["1", "b3", "5", "7"],
      intervals: ["1P", "3m", "5P", "7M"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 4, 4, 4, null],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, 8, 8, 9, 10, 8],
          fingers: [1, 1, 1, 2, 3, 1],
          barres: [8]
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord mineur majeur 7 (minMaj7) se distingue par la coexistence d’une tierce mineure et d’une septième majeure, créant un intervalle de seconde augmentée entre ces deux notes. C’est un accord de haute tension, à la fois mystérieux et expressif. Il apparaît naturellement sur le premier degré de la gamme mineure mélodique, est utilisé par Brahms, par Bernard Herrmann (thème de Psycho) et dans les vamps de tension maximale du jazz moderne — couleur de danger élégant."
    },
    "7b5": {
      notes: ["1", "3", "b5", "b7"],
      intervals: ["1P", "3M", "5d", "7m"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 2, 2, null],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [null, 9, 8, 9, 7, null],
          fingers: [0, 3, 2, 4, 1, 0],
          barres: []
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord 7b5 introduit une quinte diminuée (triton) dans l’accord de dominante, doublant la tension du triton déjà présent entre la tierce et la septième. Cette superposition de deux tritons crée une instabilité harmonique maximale. Très utilisé comme substitution de triton en jazz — le bII7 peut remplacer le V7 grâce à cette structure commune. Sa résolution vers I est électrisante, presque vertigineuse."
    },
    "aug7": {
      notes: ["1", "3", "#5", "b7"],
      intervals: ["1P", "3M", "5A", "7m"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 2, 4, null],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, 7, 8, 7, null, null],
          fingers: [3, 1, 4, 2, 0, 0],
          barres: []
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord 7 augmenté fusionne la tension de la septième mineure avec l’instabilité de la quinte augmentée, créant un accord de dominante à résolution ambiguë. Il apparaît souvent comme V7alt vers un accord mineur ou augmenté. Très apprécié dans la musique de fin du XIXe siècle — Liszt, Wagner — et dans le jazz chromatique. Sa résolution vers im est particulièrement expressive, comme un cri qui trouve enfin son réceptacle."
    },
  
    // Accords suspendus
    "sus2": {
      notes: ["1", "2", "5"],
      intervals: ["1P", "2M", "5P"],
      positions: [
        {
          position: 1,
          frets: [0, 3, 5, 5, 3, 0],
          fingers: [0, 1, 4, 3, 1, 0],
          barres: [3]
        },
        {
          position: 2,
          frets: [3, 0, 0, 0, 3, 3],
          fingers: [2, 0, 0, 0, 3, 4],
          barres: []
        }
      ],
      category: "Accords suspendus",
      description:
        "L’accord sus2 remplace la tierce par une seconde majeure, créant un son ouvert et aérien. Sans tierce, aucune polarité majeur/mineur n’est définie — d’où une ambiguïté modale qui laisse l’auditeur dans l’expectative. Popularisé par le rock des années 80-90 (Sting, Radiohead, U2), il crée des textures lumineuses et planantes. Souvent utilisé comme note pédal ou voicing de couleur, il invite l’oreille à projeter sa propre tonalité."
    },
    "sus4": {
      notes: ["1", "4", "5"],
      intervals: ["1P", "4P", "5P"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 3, 3, 3, 0],
          fingers: [0, 1, 4, 3, 2, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 3, 5, 5, 6, 3],
          fingers: [1, 1, 3, 2, 4, 1],
          barres: [3]
        }
      ],
      category: "Accords suspendus",
      description:
        "L’accord sus4 substitue la tierce par une quarte juste, créant une tension suspendue et douce. Omniprésent dans la musique rock (The Who, Led Zeppelin), dans les hymnes (le sus4→I est un effet quasi-rituel) et dans le jazz modal (McCoy Tyner). Son mouvement naturel vers la tierce — sus4→majeur ou sus4→mineur — est l’une des résolutions les plus satisfaisantes de la tonalité : l’attente qui se résout, la question qui trouve sa réponse."
    },
    "7sus4": {
      notes: ["1", "4", "5", "b7"],
      intervals: ["1P", "4P", "5P", "7m"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 3, 3, 6, 3],
          fingers: [0, 1, 1, 1, 4, 1],
          barres: [3]
        },
        {
          position: 2,
          frets: [8, 8, 10, 8, 11, 8],
          fingers: [1, 1, 3, 1, 4, 1],
          barres: [8]
        }
      ],
      category: "Accords suspendus",
      description:
        "L’accord 7sus4 reprend la structure du 7 tout en remplaçant la tierce par une quarte, effaçant la polarité majeur/mineur et retardant la résolution. C’est l’accord modal par excellence du jazz des années 60 (Herbie Hancock, Chick Corea). Il peut rester en suspension indéfiniment sans appeler de résolution — ce qui en fait un outil clé du jazz modal où la tension se vit dans la durée, comme une question sans fin suspendue dans l’air."
    },
  
    // Accords avec neuvième
    "9": {
      notes: ["1", "3", "5", "b7", "9"],
      intervals: ["1P", "3M", "5P", "7m", "9M"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 0, 2, 1, 3],
          fingers: [0, 1, 0, 3, 2, 4],
          barres: []
        },
        {
          position: 2,
          frets: [3, 5, 3, 5, 3, 5],
          fingers: [1, 3, 1, 3, 1, 4],
          barres: [3, 5]
        }
      ],
      category: "Accords avec neuvième",
      description:
        "L’accord 9 ajoute une neuvième majeure à la dominante septième, enrichissant la tension harmonique d’une couleur plus douce. La neuvième crée une consonance relative au sein de la dissonance du V7, ce qui explique son omniprésence dans le jazz et le R&B. Le 9 swing différemment du 7 : il a plus de personnalité, plus de rondeur. Incontournable des voicings jazz de guitare en position ouverte, son caractère ouvert appelle naturellement l’improvisation."
    },
    "maj9": {
      notes: ["1", "3", "5", "7", "9"],
      intervals: ["1P", "3M", "5P", "7M", "9M"],
      positions: [
        {
          position: 1,
          frets: [0, 0, 0, 2, 2, 0],
          fingers: [0, 0, 0, 2, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 5, 4, 5, 3, 5],
          fingers: [1, 3, 2, 4, 1, 3],
          barres: [3, 5]
        }
      ],
      category: "Accords avec neuvième",
      description:
        "L’accord maj9 associe la douceur du maj7 et la fraîcheur de la neuvième majeure, sans aucune tension non résolue. C’est l’accord du jazz cool et de la bossa nova par excellence — chaleureux, sophistiqué, jamais agressif. Bill Evans, Jobim et Pat Metheny l’utilisent comme couleur de repos ou de résolution finale. Sa neuvième ouverte crée un espace harmonique propice à la mélodie flottante."
    },
    "min9": {
      notes: ["1", "b3", "5", "b7", "9"],
      intervals: ["1P", "3m", "5P", "7m", "9M"],
      positions: [
        {
          position: 1,
          frets: [3, 1, 3, 1, 3, 3],
          fingers: [2, 1, 3, 1, 4, 3],
          barres: [1]
        },
        {
          position: 2,
          frets: [8, 10, 8, 10, 8, 10],
          fingers: [1, 3, 1, 4, 1, 2],
          barres: [8]
        }
      ],
      category: "Accords avec neuvième",
      description:
        "L’accord min9 marie la couleur mélancolique du mineur 7 à la douceur de la neuvième majeure, créant un accord d’une grande profondeur émotionnelle. C’est l’accord de la neo-soul, du jazz progressif et des ballades R&B. Sa richesse tient à la coexistence de la tierce mineure (tension sombre) et de la neuvième (consonance lumineuse). Miles Davis et Herbie Hancock en ont fait un outil de composition essentiel."
    },
    "minMaj9": {
      notes: ["1", "b3", "5", "7", "9"],
      intervals: ["1P", "3m", "5P", "7M", "9M"],
      positions: [
        {
          position: 1,
          frets: [3, 1, 3, 2, 3, 3],
          fingers: [2, 1, 3, 1, 4, 3],
          barres: [1]
        }
      ],
      category: "Accords avec neuvième",
      description:
        "L’accord minMaj9 prolonge l’idée du minMaj7 en ajoutant une neuvième majeure, combinant profondeur mystérieuse et tension chromatique subtile. Sa couleur est à la fois sombre (tierce mineure) et lumineuse (neuvième, septième majeure), créant un effet de douleur sublimée. On le retrouve dans les ballades jazz d’une grande complexité harmonique et dans les bandes originales de film noir — couleur de beauté douloureuse."
    },
    "7b9": {
      notes: ["1", "3", "5", "b7", "b9"],
      intervals: ["1P", "3M", "5P", "7m", "9m"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 3, 2, 2, null],
          fingers: [0, 1, 4, 2, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, 9, 8, 9, 8, 9],
          fingers: [1, 2, 1, 3, 1, 4],
          barres: [8]
        }
      ],
      category: "Accords avec neuvième",
      description:
        "L’accord 7b9 introduit une neuvième mineure (seconde mineure à l’octave), renforçant considérablement la tension de la dominante. La dissonance entre la fondamentale et la b9 (un demi-ton) crée un appel de résolution urgent. C’est l’accord du V7b9→im mineur par excellence, fondamental dans le jazz bebop et les cadences flamenco. Sur l’accord de dim7, il génère une symétrie parfaite : 3 notes du dim7 + b9 forment 4 notes équidistantes."
    },
    "7#9": {
      notes: ["1", "3", "5", "b7", "#9"],
      intervals: ["1P", "3M", "5P", "7m", "9A"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 3, 2, 4, null],
          fingers: [0, 1, 3, 2, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, 7, 8, 7, 8, null],
          fingers: [3, 1, 4, 2, 3, 0],
          barres: [8]
        }
      ],
      category: "Accords avec neuvième",
      description:
        "L’accord 7#9 est célèbre pour son rôle dans le rock et le funk, souvent surnommé Hendrix chord depuis Purple Haze (1967). La neuvième augmentée (enharmonique à la tierce mineure) coexiste avec la tierce majeure de la dominante, créant une ambigüité majeur/mineur électrisante. C est aussi un accord fondamental du jazz alteré (V7alt), utilisé sur le V7 pour maximiser la tension avant résolution."
    },
  
    // Accords avec 11 et 13
    "11": {
      notes: ["1", "3", "5", "b7", "9", "11"],
      intervals: ["1P", "3M", "5P", "7m", "9M", "11P"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 1, 1, 3, 0],
          fingers: [0, 1, 1, 1, 3, 0],
          barres: [1]
        },
        {
          position: 2,
          frets: [5, 5, 5, 6, 8, 8],
          fingers: [1, 1, 1, 2, 4, 3],
          barres: [5]
        }
      ],
      category: "Accords avec 11 et 13",
      description:
        "L’accord 11 étend l’accord de dominante jusqu’à la onzième, offrant une texture complexe et planante. La coexistence de la tierce majeure et de la quarte (11ème) crée une dissonance de seconde mineure, souvent résolue en omettant la tierce. Typique du jazz modal et des arrangements orchestraux jazz, il est le pont entre la dominante classique et les harmonies de quartes de McCoy Tyner."
    },
    "13": {
      notes: ["1", "3", "5", "b7", "9", "11", "13"],
      intervals: ["1P", "3M", "5P", "7m", "9M", "11P", "13M"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 3, 2, 3, 5],
          fingers: [0, 1, 3, 2, 3, 4],
          barres: [3]
        },
        {
          position: 2,
          frets: [8, 10, 8, 9, 10, 10],
          fingers: [1, 3, 1, 2, 4, 4],
          barres: [8, 10]
        }
      ],
      category: "Accords avec 11 et 13",
      description:
        "L’accord 13 représente l’extension maximale d’une dominante : en empilant des tierces jusqu’à la treizième, on obtient potentiellement toutes les 7 notes de la gamme. En pratique, on sélectionne les notes les plus caractéristiques (1, 3, b7, 13) en omettant 5, 9 et 11. C’est l’accord le plus ‘plein’ du jazz, utilisé comme dominante finale dans les cadences sophistiquées et les big bands de Duke Ellington à Maria Schneider."
    },
    "maj13": {
      notes: ["1", "3", "5", "7", "9", "11", "13"],
      intervals: ["1P", "3M", "5P", "7M", "9M", "11P", "13M"],
      positions: [
        {
          position: 1,
          frets: [null, 0, 2, 1, 2, 2],
          fingers: [0, 0, 4, 1, 2, 3],
          barres: []
        }
      ],
      category: "Accords avec 11 et 13",
      description:
        "L’accord maj13 réunit toutes les extensions diatoniques de l’accord majeur. Sa richesse harmonique en fait un accord de résolution lumineuse et ample, caractéristique des arrangements de big band et des compositions de jazz modal. Il suggère une tonalité pleinement établie, un repos complet. Herbie Hancock et Chick Corea l’utilisent pour les fins de sections dans leurs compositions les plus développées."
    },
    "min13": {
      notes: ["1", "b3", "5", "b7", "9", "11", "13"],
      intervals: ["1P", "3m", "5P", "7m", "9M", "11P", "13M"],
      positions: [
        {
          position: 1,
          frets: [8, 8, 8, 8, 10, 10],
          fingers: [1, 1, 1, 1, 3, 4],
          barres: [8]
        }
      ],
      category: "Accords avec 11 et 13",
      description:
        "L’accord min13 mobilise toute la gamme dorien : tierce mineure, septième mineure, neuvième, onzième et treizième majeure. Sa texture dense lui confère une profondeur orchestrale qui dépasse largement la simple couleur mineure. Parfait pour les introductions de ballades jazz ou les accords de tension prolongée. Wayne Shorter et Herbie Hancock en ont fait un ingrédient clé de leur langage modal."
    },
  
    // Accords avec 6
    "6": {
      notes: ["1", "3", "5", "6"],
      intervals: ["1P", "3M", "5P", "6M"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 2, 2, 3, 0],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 5, 5, 5, 5, 3],
          fingers: [1, 3, 3, 3, 3, 1],
          barres: [3, 5]
        }
      ],
      category: "Accords avec 6",
      description:
        "L’accord 6 ajoute la sixte majeure à la triade, créant une couleur douce et lumineuse sans la tension de la septième. La sixte ajoute de la chaleur sans créer d’appel de résolution. Très utilisé dans la chanson française, le jazz des années 30-40, le ragtime et le gospel. Il s’entend fréquemment comme accord de tonique alternatif au maj7 — parfois perçu comme plus neutre, moins sophistiqué, mais d’une clarté chaleureuse incomparable."
    },
    "min6": {
      notes: ["1", "b3", "5", "6"],
      intervals: ["1P", "3m", "5P", "6M"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 1, 3, null],
          fingers: [0, 1, 2, 1, 3, 0],
          barres: [1]
        },
        {
          position: 2,
          frets: [8, 10, 10, 8, 10, 8],
          fingers: [1, 3, 3, 1, 4, 1],
          barres: [8, 10]
        }
      ],
      category: "Accords avec 6",
      description:
        "L’accord mineur 6 associe la tierce mineure et la sixte majeure, créant une sonorité douce-amère caractéristique du jazz modal et de la chanson française. La sixte majeure dans un contexte mineur crée une tension élégante, mi-ombre mi-lumière. C’est le iim6 naturel d’une cadence mineure et un accord fréquent dans les thèmes de jazz classique — Autumn Leaves en fait usage dans sa progression d’ouverture."
    },
  
    // Accords avec add
    "add9": {
      notes: ["1", "3", "5", "9"],
      intervals: ["1P", "3M", "5P", "9M"],
      positions: [
        {
          position: 1,
          frets: [0, 3, 0, 2, 3, 0],
          fingers: [0, 2, 0, 1, 3, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 0, 0, 0, 3, 0],
          fingers: [2, 0, 0, 0, 3, 0],
          barres: []
        }
      ],
      category: "Accords avec add",
      description:
        "L’accord add9 garde la structure d’un accord majeur tout en y ajoutant une neuvième majeure, sans septième. Sans septième, il n’a pas la tension du V9 — il reste un accord de couleur simple, lumineux et ouvert. Très utilisé dans la pop et le rock contemporain (Sting, U2, Radiohead) pour ses voicings ouverts à la guitare avec cordes à vide. Il ajoute de la fraîcheur sans complexifier l’harmonie."
    },
    "madd9": {
      notes: ["1", "b3", "5", "9"],
      intervals: ["1P", "3m", "5P", "9M"],
      positions: [
        {
          position: 1,
          frets: [3, 1, 0, 2, 3, 3],
          fingers: [3, 1, 0, 2, 4, 3],
          barres: []
        },
        {
          position: 2,
          frets: [8, 10, 10, 8, 8, 8],
          fingers: [1, 3, 4, 1, 1, 1],
          barres: [8]
        }
      ],
      category: "Accords avec add",
      description:
        "L’accord madd9 fusionne la couleur mineure et la fraîcheur de la neuvième majeure, sans septième. C’est un accord de couleur pure, mélancolique et ouvert à la fois — tristesse lumineuse, nostalgie sans amertume. Très utilisé dans la guitare folk contemporaine et le singer-songwriter. Sa simplicité structurelle (1-b3-5-9) permet des voicings guitare avec cordes à vide particulièrement résonnants et émouvants."
    },
  
    // Accords 6/9
    "69": {
      notes: ["1", "3", "5", "6", "9"],
      intervals: ["1P", "3M", "5P", "6M", "9M"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 0, 2, 0, 0],
          fingers: [0, 1, 0, 2, 0, 0],
          barres: []
        },
        {
          position: 2,
          frets: [3, 5, 3, 5, 5, 3],
          fingers: [1, 2, 1, 3, 4, 1],
          barres: [3]
        }
      ],
      category: "Accords 6/9",
      description:
        "L’accord 6/9 associe la sixte majeure et la neuvième à la triade, sans septième. C’est l’accord de résolution jazz le plus satisfaisant : suffisamment riche pour le jazz sans la tension d’une septième. Herbie Hancock, Horace Silver et Wes Montgomery le placent fréquemment comme accord de tonique final. Sa sonorité pentatonique (1-2-3-5-6 = pentatonique majeure) explique son universalité et son naturel."
    },
    "m69": {
      notes: ["1", "b3", "5", "6", "9"],
      intervals: ["1P", "3m", "5P", "6M", "9M"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 1, 2, 3, 3],
          fingers: [0, 2, 1, 3, 4, 4],
          barres: [3]
        }
      ],
      category: "Accords 6/9",
      description:
        "L’accord m6/9 combine tierce mineure, sixte majeure et neuvième, sans septième. Il crée une couleur douce-amère, mélancolique et ouverte à la fois. C’est l’accord mineur le plus jazzé sans septième, idéal comme accord de im final dans une ballade. La coexistence de la tierce mineure et de la sixte majeure produit un intervalle de quarte augmentée — tension subtile qui lui donne son caractère unique."
    },
  
    // Accords altérés et de tension
    "7#11": {
      notes: ["1", "3", "5", "b7", "#11"],
      intervals: ["1P", "3M", "5P", "7m", "11A"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 1, 3, null],
          fingers: [0, 1, 2, 1, 3, 0],
          barres: [1]
        }
      ],
      category: "Accords altérés et de tension",
      description:
        "L’accord 7#11 est une forme altérée de la dominante qui ajoute une quarte augmentée, créant simultanément deux tritons (1-b7 et 3-#11). C’est l’accord lydien-dominant par excellence, typique du jazz fusion et des arrangements de Herbie Hancock. Il sonne à la fois brillant et tendu, comme une dominante prête à explorer avant de résoudre. Idéal sur V7 vers IV ou lors d’une Coltrane cadence."
    },
    "7b13": {
      notes: ["1", "3", "5", "b7", "b13"],
      intervals: ["1P", "3M", "5P", "7m", "13m"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 3, 2, 4, 4],
          fingers: [0, 1, 3, 2, 4, 4],
          barres: [4]
        }
      ],
      category: "Accords altérés et de tension",
      description:
        "L’accord 7b13 ajoute une treizième mineure (sixte bémol) à l’accord de dominante, créant une couleur sombre et expressive. La b13 est enharmonique à la quinte augmentée, donnant à cet accord un caractère quasi-augmenté. Il apparaît fréquemment dans les cadences vers une tonalité mineure, où le V7b13 annonce l’accord mineur suivant. Fondamental du jazz de Miles Davis et Wayne Shorter."
    },
    "7#9#11": {
      notes: ["1", "3", "5", "b7", "#9", "#11"],
      intervals: ["1P", "3M", "5P", "7m", "9A", "11A"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 2, 4, null],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        }
      ],
      category: "Accords altérés et de tension",
      description:
        "L’accord 7#9#11 cumule la neuvième augmentée (la note Hendrix) et la quarte augmentée (couleur lydienne), combinant deux des altérations les plus expressives de la dominante. La densité de ses tensions en fait un accord de très haute intensité, idéal pour les climax harmoniques en jazz bebop ou en fusion. Herbie Hancock et Chick Corea l’utilisent dans leurs solos de piano les plus complexes."
    },
    "7#9b13": {
      notes: ["1", "3", "5", "b7", "#9", "b13"],
      intervals: ["1P", "3M", "5P", "7m", "9A", "13m"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 3, 2, 4, 4],
          fingers: [0, 1, 3, 2, 4, 4],
          barres: [4]
        }
      ],
      category: "Accords altérés et de tension",
      description:
        "L’accord 7#9b13 associe la tension de la neuvième augmentée (ambiguïté majeur/mineur) à celle de la treizième mineure (couleur sombre). C’est un accord altéré du jazz, très proche de la gamme altérée (super-locrien). Il est utilisé comme V7alt sur les cadences les plus sophistiquées du jazz, notamment dans le style bebop avancé de Charlie Parker, Clifford Brown et leurs héritiers."
    },
    "7b9#11": {
      notes: ["1", "3", "5", "b7", "b9", "#11"],
      intervals: ["1P", "3M", "5P", "7m", "9m", "11A"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 1, 2, null],
          fingers: [0, 1, 3, 2, 4, 0],
          barres: []
        }
      ],
      category: "Accords altérés et de tension",
      description:
        "L’accord 7b9#11 combine la dissonance urgente de la neuvième mineure et la brillance de la quarte augmentée. On le trouve dans les arrangements jazz les plus complexes comme accord de passage chromatique, souvent en mouvement vers une résolution sur I ou im. C’est une des formes d’accord altéré les plus utilisées dans le jazz classique (Parker, Gillespie, Coltrane) pour créer une tension maximale avant résolution."
    },
    "7b9b13": {
      notes: ["1", "3", "5", "b7", "b9", "b13"],
      intervals: ["1P", "3M", "5P", "7m", "9m", "13m"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 3, 1, 2, 4],
          fingers: [0, 1, 3, 1, 2, 4],
          barres: [1]
        }
      ],
      category: "Accords altérés et de tension",
      description:
        "L’accord 7b9b13 superpose la neuvième mineure et la treizième mineure sur la base du V7, créant le degré de tension altérée maximale. Il fait directement référence à la gamme phrygienne dominante (sur V7→im) et au maqam Hijaz. On le retrouve dans le jazz avancé, le flamenco harmonisé et les bandes originales dramatiques. Sa tension ne peut être résolue que par une résolution complète vers la tonique."
    },
  
    // Accords majeurs spécifiques
    "maj7#5": {
      notes: ["1", "3", "#5", "7"],
      intervals: ["1P", "3M", "5A", "7M"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 0, 2, 4, null],
          fingers: [0, 1, 0, 2, 4, 0],
          barres: []
        }
      ],
      category: "Accords majeurs spécifiques",
      description:
        "L’accord maj7#5 propose une couleur lumineuse et légèrement décalée : la quinte augmentée crée une tension ascendante douce qui coexiste avec la beauté de la septième majeure. Il apparaît naturellement comme accord III de la gamme mineure mélodique. Dans le jazz modal, il suggère un espace harmonique ouvert et planant. Wayne Shorter l’utilise fréquemment dans ses compositions pour créer des ambiances de flottement."
    },
    "maj7b5": {
      notes: ["1", "3", "b5", "7"],
      intervals: ["1P", "3M", "5d", "7M"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 2, 3, null],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        }
      ],
      category: "Accords majeurs spécifiques",
      description:
        "L’accord maj7b5 introduit une quinte diminuée dans l’accord majeur 7, créant une ambivalence subtile entre clarté et instabilité. Il est le IV de la gamme mineure mélodique (lydien augmenté). Sa couleur est à la fois belle et légèrement inquiète — une beauté qui cache une tension. Utilisé par Herbie Hancock dans ses compositions modales pour les moments de transition harmonique délicats."
    },
    "maj7#11": {
      notes: ["1", "3", "5", "7", "#11"],
      intervals: ["1P", "3M", "5P", "7M", "11A"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 2, 3, null],
          fingers: [0, 1, 2, 3, 4, 0],
          barres: []
        }
      ],
      category: "Accords majeurs spécifiques",
      description:
        "L’accord maj7#11 (accord lydien) insère une quarte augmentée dans un accord majeur 7, créant la couleur du mode lydien : brillante, ascendante, ouverte vers l’infini. C’est l’accord préféré de John Williams pour les scènes d’émerveillement (Star Wars, E.T.). En jazz, il apparaît comme accord de IV lydien dans les substitutions harmoniques et les turnarounds."
    },
    "maj13#11": {
      notes: ["1", "3", "5", "7", "9", "#11", "13"],
      intervals: ["1P", "3M", "5P", "7M", "9M", "11A", "13M"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 0, 2, 2, 2],
          fingers: [0, 1, 0, 2, 3, 4],
          barres: []
        }
      ],
      category: "Accords majeurs spécifiques",
      description:
        "L’accord maj13#11 représente l’extension ultime d’un accord majeur lydien : en y intégrant la treizième et la quarte augmentée, on obtient toutes les notes de la gamme lydienne sur un seul accord. Sa richesse timbrale en fait un accord de résolution ample et lumineuse, caractéristique des grandes finales jazz. Herbie Hancock et Chick Corea le placent souvent comme accord-couleur en début ou fin de sections."
    },
  
    // Autres accords spécifiques
    "5": {
      notes: ["1", "5"],
      intervals: ["1P", "5P"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 5, 5, null, null],
          fingers: [0, 1, 3, 2, 0, 0],
          barres: []
        },
        {
          position: 2,
          frets: [8, 10, 10, null, null, null],
          fingers: [1, 3, 2, 0, 0, 0],
          barres: []
        }
      ],
      category: "Autres accords spécifiques",
      description:
        "L’accord 5, souvent appelé « power chord, se compose uniquement de la fondamentale et de la quinte juste — sans tierce, donc sans polarité majeur/mineur. Cette neutralité harmonique, combinée à la distorsion électrique, crée l’énergie caractéristique du rock et du metal. L’absence de tierce évite les battements désagréables en distorsion. Pete Townshend (The Who) et Tony Iommi (Black Sabbath) en ont fait le signe de ralliement du rock."
    },
    "m#5": {
      notes: ["1", "b3", "#5"],
      intervals: ["1P", "3m", "5A"],
      positions: [
        {
          position: 1,
          frets: [null, 1, 2, 1, 2, null],
          fingers: [0, 1, 3, 2, 4, 0],
          barres: []
        }
      ],
      category: "Autres accords spécifiques",
      description:
        "L’accord m#5 marie la tierce mineure et la quinte augmentée, créant une tension ascendante dans un contexte sombre. Son caractère est à la fois mélancolique et inquiet, planant entre le mineur et l’augmenté. Il apparaît dans le mode lydien augmenté (degré III+) et dans les progressions chromatiques descendantes de la musique contemporaine et du jazz d’avant-garde."
    },
    "sus24": {
      notes: ["1", "2", "4", "5"],
      intervals: ["1P", "2M", "4P", "5P"],
      positions: [
        {
          position: 1,
          frets: [0, 0, 0, 2, 3, 0],
          fingers: [0, 0, 0, 2, 3, 0],
          barres: []
        }
      ],
      category: "Autres accords spécifiques",
      description:
        "L’accord sus24 cumule la seconde et la quarte sur la fondamentale et la quinte, produisant une structure sans tierce ni sixte et donc sans définition tonale majeur/mineur. Cette ambiguïté maximale en fait un accord de texture pure, idéal pour créer des espaces ouverts. Utilisé dans les musiques ambient, post-rock et dans certains travaux de guitare préparée ou de compositeurs minimalistes."
    },
    "9sus4": {
      notes: ["1", "4", "5", "b7", "9"],
      intervals: ["1P", "4P", "5P", "7m", "9M"],
      positions: [
        {
          position: 1,
          frets: [0, 1, 0, 1, 1, 3],
          fingers: [0, 1, 0, 2, 2, 4],
          barres: [1]
        }
      ],
      category: "Autres accords spécifiques",
      description:
        "L’accord 9sus4 combine la suspension de la quarte avec la richesse de la neuvième, tout en conservant la septième mineure. C’est l’accord modal jazz par excellence — Herbie Hancock le déploie dans Maiden Voyage, McCoy Tyner dans Passion Dance. Sa texture suspendue et son mouvement de neuvième créent un espace indéfini entre majeur et mineur, propice à l’improvisation modale."
    },

    // Accords avec 11 (suppléments manquants)
    "maj11": {
      notes: ["1", "3", "5", "7", "9", "11"],
      intervals: ["1P", "3M", "5P", "7M", "9M", "11P"],
      positions: [
        {
          position: 1,
          frets: [null, 3, 3, 4, 3, 3],
          fingers: [0, 1, 1, 2, 1, 1],
          barres: [3]
        },
        {
          position: 2,
          frets: [8, null, 9, 9, 8, 8],
          fingers: [1, 0, 3, 4, 1, 1],
          barres: [8]
        }
      ],
      category: "Accords avec 11 et 13",
      description:
        "L’accord maj11 enrichit le maj9 d’une quarte juste (onzième), créant une couleur ouverte et planante typique du jazz modal. La tierce est souvent omise pour éviter la dissonance de neuvième mineure avec l’onzième. Voicing fondamental de Herbie Hancock et Bill Evans."
    },
    "min11": {
      notes: ["1", "b3", "5", "b7", "9", "11"],
      intervals: ["1P", "3m", "5P", "7m", "9M", "11P"],
      positions: [
        {
          position: 1,
          frets: [null, 0, 0, 0, 1, 3],
          fingers: [0, 0, 0, 0, 1, 3],
          barres: []
        },
        {
          position: 2,
          frets: [5, 7, 5, 7, 8, 5],
          fingers: [1, 3, 1, 3, 4, 1],
          barres: [5, 7]
        }
      ],
      category: "Accords avec 11 et 13",
      description:
        "L’accord min11 est l’un des plus riches de l’harmonie jazz, combinant profondeur mineure, septième, neuvième et quarte. Contrairement au maj11, la quarte ne crée pas de dissonance avec la tierce mineure, permettant de jouer l’accord complet. Indispensable en jazz modal et néo-soul."
    },

    // Accords spécifiques (suppléments manquants)
    "min7#5": {
      notes: ["1", "b3", "#5", "b7"],
      intervals: ["1P", "3m", "5A", "7m"],
      positions: [
        {
          position: 1,
          frets: [null, 0, 3, 2, 1, 3],
          fingers: [0, 0, 3, 2, 1, 4],
          barres: []
        },
        {
          position: 2,
          frets: [null, 3, 6, 5, 4, null],
          fingers: [0, 1, 4, 3, 2, 0],
          barres: []
        }
      ],
      category: "Accords de septième",
      description:
        "L’accord min7#5 superpose tierce mineure, quinte augmentée et septième mineure, créant une tension expressive ambiguë entre couleur sombre et instabilité ascendante. Utilisé dans le jazz moderne et le rock progressif pour des moments de haute intensité dramatique. On le retrouve souvent en tant que V7alt partiel ou accord de couleur."
    },

  // Accords étendus manquants (B-2)
  "maj9#11": {
    notes: ["1", "3", "5", "7", "9", "#11"],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11A"],
    positions: [
      {
        position: 1,
        frets: [null, 0, 2, 2, 2, 2],
        fingers: [0, 0, 1, 2, 3, 4],
        barres: []
      },
      {
        position: 2,
        frets: [null, 3, 4, 3, 4, null],
        fingers: [0, 1, 3, 2, 4, 0],
        barres: []
      }
    ],
    category: "Accords majeurs spécifiques",
    description:
      "L'accord maj9#11 est l'accord lydien-majeur par excellence : il combine la douceur de la neuvième et la brillance de la quarte augmentée sur un socle de maj7. Sa sonorité est lumineuse, ascendante et onirique — la couleur du mode lydien dans toute sa plénitude. Il est utilisé comme accord de IV lydien dans le jazz modal et dans les compositions de film (John Williams, Hans Zimmer) pour évoquer l'émerveillement et la grandeur."
  },
  "min9maj7": {
    notes: ["1", "b3", "5", "7", "9"],
    intervals: ["1P", "3m", "5P", "7M", "9M"],
    positions: [
      {
        position: 1,
        frets: [null, 0, 2, 2, 1, 0],
        fingers: [0, 0, 3, 4, 1, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 1, 3, 2, 3, null],
        fingers: [3, 1, 4, 2, 3, 0],
        barres: []
      }
    ],
    category: "Accords de septième",
    description:
      "L'accord min9maj7, alias du minMaj9, réunit tierce mineure, septième majeure et neuvième. Sa tension chromatique (seconde augmentée entre b3 et 7M) lui confère un caractère mystérieux et dramatique. Il est l'accord de départ de la gamme mineure mélodique ascendante et revient dans les ballades jazz d'une grande densité harmonique. Bernard Herrmann l'a rendu célèbre dans la musique de Psycho (1960)."
  },
  "13sus4": {
    notes: ["1", "4", "5", "b7", "9", "13"],
    intervals: ["1P", "4P", "5P", "7m", "9M", "13M"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 1, 3, 3, 3],
        fingers: [0, 1, 1, 3, 2, 4],
        barres: [1]
      }
    ],
    category: "Accords suspendus",
    description:
      "L'accord 13sus4 est la version suspendue du 13 — il remplace la tierce par une quarte, effaçant la polarité majeur/mineur tout en conservant la richesse des extensions supérieures (septième, neuvième, treizième). Sa couleur est ouverte, floue et lumineuse à la fois. C'est l'accord que McCoy Tyner et Herbie Hancock utilisent pour créer des vamps modal de grande amplitude émotionnelle sans définir de tonalité."
  },
  "7#9#5": {
    notes: ["1", "3", "#5", "b7", "#9"],
    intervals: ["1P", "3M", "5A", "7m", "9A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 4, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [null, 3, 4, 3, 4, null],
        fingers: [0, 1, 3, 2, 4, 0],
        barres: []
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L'accord 7#9#5 cumule la neuvième augmentée et la quinte augmentée sur un accord de dominante, créant l'archétype de l'accord super-alteré. Ces deux altérations ascendantes combinées à la septième descendante génèrent une tension maximale dans trois directions simultanées. C'est l'accord de la gamme altérée (super-locrien) dans sa forme la plus dense — utilisé dans le jazz d'avant-garde et le fusion de haute intensité."
  },
  "min13#11": {
    notes: ["1", "b3", "5", "b7", "9", "#11", "13"],
    intervals: ["1P", "3m", "5P", "7m", "9M", "11A", "13M"],
    positions: [
      {
        position: 1,
        frets: [null, 0, 2, 0, 1, 2],
        fingers: [0, 0, 3, 0, 1, 2],
        barres: []
      }
    ],
    category: "Accords altérés et de tension",
    description:
      "L'accord min13#11 est l'une des sonorités les plus denses et les plus sophistiquées du jazz : il réunit les extensions du min13 (neuvième, onzième, treizième) avec une onzième augmentée, créant une tension lydienne dans un contexte mineur. Cette coexistence du #11 et de la tierce mineure génère une ambiguïté modale fascinante. On le retrouve dans le jazz d'après-garde et dans les compositions de Wayne Shorter."
  },
  "add#11": {
    notes: ["1", "3", "5", "#11"],
    intervals: ["1P", "3M", "5P", "11A"],
    positions: [
      {
        position: 1,
        frets: [null, 1, 2, 2, 2, null],
        fingers: [0, 1, 2, 3, 4, 0],
        barres: []
      },
      {
        position: 2,
        frets: [3, 0, 0, 0, 4, null],
        fingers: [2, 0, 0, 0, 4, 0],
        barres: []
      }
    ],
    category: "Accords avec add",
    description:
      "L'accord add#11 est une triade majeure enrichie d'une quarte augmentée, sans septième. Il capte la couleur lydienne dans sa forme la plus simple : pas de tension de septième, juste la brillance lumineuse du triton supérieur qui colore la triade. C'est l'accord de la grâce sonique simple — utilisé comme accord de couleur dans les progressions pop sophistiquées et dans les intros de compositions jazz-fusion."
  }

};
