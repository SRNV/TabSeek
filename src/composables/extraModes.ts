// src/composables/extraModes.ts
// Définition de tous les modes additionnels au format tonal.js
import type { ModeGuitar } from '../types';

export const EXTRA_MODES: ModeGuitar[] = [
  // MODES PRINCIPAUX
  {
    name: "ionian",
    aliases: ["major", "M"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
    alt: [],
    triad: "major",
    seventh: "maj7",
    description:
      "Le mode ionien est la gamme majeure traditionnelle, caractérisé par sa sonorité lumineuse et équilibrée. Il exprime la joie, la stabilité et l'affirmation, formant la base de la musique occidentale classique et populaire. Sa structure d'intervalles crée une résolution harmonique naturelle qui procure un sentiment de complétude. Omniprésent dans les hymnes, chansons enfantines et compositions classiques, il est idéal pour transmettre des émotions positives et claires. Cette tonalité majeure constitue le point de référence pour tous les autres modes diatoniques.",
    culture: "Occidentale classique",
    category: "Modes Principaux"
  },
  {
    name: "dorian",
    aliases: ["dor", "m"],
    modeNum: 1,
    mode: 1,
    intervals: ["1P", "2M", "3m", "4P", "5P", "6M", "7m"],
    alt: ["b3", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le mode dorien, avec sa sixte majeure distinctive, crée un équilibre unique entre mélancolie et optimisme. Il exprime la contemplation, la nostalgie teintée d'espoir, et une profondeur émotionnelle sans tomber dans le dramatique. Prisé dans le jazz modal, le folk et la musique celtique, ce mode offre une palette expressive riche et nuancée. Sa sonorité reconnaissable traverse les époques, de la musique médiévale aux morceaux emblématiques comme “So What” de Miles Davis. Le dorien constitue un outil puissant pour l'improvisation et la composition, évoquant une mélancolie qui n'est jamais désespérée.",
    culture: "Celtique & Jazz modal",
    category: "Modes Principaux"
  },
  {
    name: "phrygian",
    aliases: ["phry"],
    modeNum: 2,
    mode: 2,
    intervals: ["1P", "2m", "3m", "4P", "5P", "6m", "7m"],
    alt: ["b2", "b3", "b6", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le mode phrygien se distingue immédiatement par sa seconde mineure qui génère une tension caractéristique et une couleur orientale. Il évoque le mystère, l’intensité et parfois la menace, créant une atmosphère dramatique et exotique. Pilier du flamenco et de la musique andalouse, il imprègne de nombreuses compositions méditerranéennes et moyen-orientales. Sa structure crée une forte tension vers la tonique, produisant un sentiment d’urgence ou d’inévitabilité. Le phrygien est particulièrement efficace dans le metal, la musique électronique et les compositions cherchant à créer une ambiance sombre et énigmatique.",
    culture: "Espagnole & Moyen-orientale",
    category: "Modes Principaux"
  },
  {
    name: "lydian",
    aliases: ["lyd", "maj#4"],
    modeNum: 3,
    mode: 3,
    intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7M"],
    alt: ["#4"],
    triad: "major",
    seventh: "maj7",
    description:
      "Le mode lydien, avec sa caractéristique quarte augmentée, crée une atmosphère aérienne, flottante et onirique. Il évoque l'émerveillement, le mystère et l'ouverture, transportant l'auditeur vers des territoires imaginaires et surréels. Fréquemment utilisé dans les musiques de films de science-fiction et de fantasy, il colore les œuvres d’une qualité éthérée et transcendante. Le triton entre la tonique et la quarte lui confère cette sonorité distinctive qui semble défier la gravité. Favori des compositeurs impressionnistes comme Debussy et de jazzmen comme Bill Evans, le lydien invite à l’exploration harmonique et à l’élévation spirituelle.",
    culture: "Impressionnisme & Cinéma",
    category: "Modes Principaux"
  },
  {
    name: "mixolydian",
    aliases: ["mixo", "dom"],
    modeNum: 4,
    mode: 4,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7m"],
    alt: ["b7"],
    triad: "major",
    seventh: "7",
    description:
      "Le mode mixolydien, essentiellement une gamme majeure avec septième mineure, offre un équilibre parfait entre énergie majeure et tension subtile. Il exprime la vitalité, l’affirmation teintée de blues, et une joie qui n’est jamais complètement résolue. Omniprésent dans le rock, le blues et la musique celtique, il forme le fondement de nombreux riffs emblématiques comme ceux de “Sweet Home Alabama”. Sa structure crée naturellement un mouvement vers le quatrième degré, expliquant sa présence dans d’innombrables progressions I–bVII–IV. Le mixolydien est l’outil idéal pour l’improvisation sur des accords dominants, offrant une transition naturelle entre les univers majeurs et mineurs.",
    culture: "Rock & Blues",
    category: "Modes Principaux"
  },
  {
    name: "aeolian",
    aliases: ["minor", "m"],
    modeNum: 5,
    mode: 5,
    intervals: ["1P", "2M", "3m", "4P", "5P", "6m", "7m"],
    alt: ["b3", "b6", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le mode éolien, ou gamme mineure naturelle, est fondamental pour exprimer la mélancolie, l’introspection et la profondeur émotionnelle. Il évoque la nostalgie, le drame intérieur et parfois la tristesse, avec une qualité inachevée qui invite à la contemplation. Omniprésent dans le répertoire romantique classique, le rock alternatif et les ballades émotionnelles, il permet d’explorer des émotions complexes et nuancées. Sa structure avec tierces, sixtes et septièmes mineures crée cette sonorité immédiatement reconnaissable qui touche les cordes sensibles de l’âme. L’éolien possède une versatilité émotionnelle allant de la douce mélancolie à la profonde tristesse, rendant compte de toute la palette des émotions sombres.",
    culture: "Classique romantique & Rock",
    category: "Modes Principaux"
  },
  {
    name: "locrian",
    aliases: ["loc"],
    modeNum: 6,
    mode: 6,
    intervals: ["1P", "2m", "3m", "4P", "5d", "6m", "7m"],
    alt: ["b2", "b3", "b5", "b6", "b7"],
    triad: "diminished",
    seventh: "min7b5",
    description:
      "Le mode locrien, le plus dissonant des modes diatoniques, se distingue par sa quinte diminuée créant une instabilité permanente. Il évoque le chaos, l’angoisse et l’incertitude, générant une tension extrême qui cherche presque toujours à se résoudre. Rarement utilisé comme tonalité principale, il apparaît dans le metal progressif, le jazz expérimental et la musique contemporaine pour des moments de tension maximale. Son triton entre la tonique et la quinte lui confère cette qualité profondément instable et inquiétante. Des compositeurs comme Bartók et des groupes comme Dream Theater l’ont exploité pour créer des moments d’expressivité dramatique intense.",
    culture: "Metal progressif & Contemporain",
    category: "Modes Principaux"
  },

  // MODES MINEURS MÉLODIQUES ET HARMONIQUES
  {
    name: "melodic minor",
    aliases: ["melodic", "jazz minor"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4P", "5P", "6M", "7M"],
    alt: [],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "Le mode mineur mélodique combine la chaleur mineure avec une tension ascendante créée par les sixte et septième majeures. Il évoque la sophistication, l’élégance et une mélancolie nuancée qui s’ouvre vers la résolution. Fondamental dans le jazz moderne et la musique classique, il offre un parfait équilibre entre profondeur émotionnelle et richesse harmonique. Sa sonorité distinctive a inspiré d’innombrables compositions de Bach à Bill Evans, permettant des progressions harmoniques complexes et des mélodies expressives. Le mineur mélodique représente l’alliance parfaite entre la tradition classique et l’innovation jazz.",
    culture: "Jazz moderne",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "dorian b2",
    aliases: ["phrygian #6", "melodic minor second mode"],
    modeNum: 1,
    mode: 1,
    intervals: ["1P", "2m", "3m", "4P", "5P", "6M", "7m"],
    alt: ["b2"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le mode dorien bémol 2 combine la mélancolie du dorien avec la tension dramatique d’une seconde mineure. Il évoque à la fois l’introspection du dorien et l’exotisme oriental du phrygien, formant un pont unique entre cultures musicales occidentales et orientales. Présent dans la musique juive klezmer, indienne et modale contemporaine, il apporte une tension expressive rare et singulière. Sa dualité entre la seconde mineure sombre et la sixte majeure lumineuse crée un équilibre émotionnel complexe. Le dorien bémol 2 (ou phrygien dièse 6) illustre parfaitement comment une simple altération peut transformer radicalement le caractère expressif d’un mode.",
    culture: "Klezmer & Contemporain",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "lydian augmented",
    aliases: ["lydian #5", "melodic minor third mode"],
    modeNum: 2,
    mode: 2,
    intervals: ["1P", "2M", "3M", "4A", "5A", "6M", "7M"],
    alt: ["#4", "#5"],
    triad: "augmented",
    seventh: "maj7#5",
    description:
      "Le mode lydien augmenté, avec sa quarte augmentée et sa quinte augmentée, pousse l’étrangeté du lydien encore plus loin dans le territoire de l’altération et du surréalisme. Il évoque le mystère, la transcendance et une luminosité presque surnaturelle grâce à ses deux altérations ascendantes. Particulièrement prisé dans le jazz moderne, la musique de film d’anticipation et les compositions expérimentales, il crée des couleurs harmoniques très riches. Sa structure intervallique unique génère une forte tension qui semble défier la gravité tonale traditionnelle. Le lydien augmenté représente l’une des expressions les plus avancées de la modernité harmonique tout en restant accessible à l’oreille avertie.",
    culture: "Jazz d'avant-garde",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "lydian dominant",
    aliases: ["mixolydian #11", "melodic minor fourth mode"],
    modeNum: 3,
    mode: 3,
    intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7m"],
    alt: ["#4", "b7"],
    triad: "major",
    seventh: "7#11",
    description:
      "Le mode lydien dominant fusionne la brillance éthérée du lydien avec l’énergie terrienne du mixolydien. Il associe l’élévation spirituelle de la quarte augmentée à la tension bluesy de la septième mineure, créant un équilibre parfait entre sophistication et accessibilité. Pilier du jazz fusion et des compositions de musiciens comme Joe Satriani ou John Scofield, il offre une richesse harmonique idéale pour des solos expressifs. Sa dualité entre tension et résolution, entre modernité et tradition, explique sa popularité dans les compositions contemporaines. Le lydien dominant incarne l’évolution naturelle du langage harmonique du jazz, combinant influence africaine-américaine et sophistication européenne.",
    culture: "Jazz fusion",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "melodic major",
    aliases: ["mixolydian b6", "melodic minor fifth mode"],
    modeNum: 4,
    mode: 4,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6m", "7m"],
    alt: ["b6", "b7"],
    triad: "major",
    seventh: "7",
    description:
      "Le mode majeur mélodique (ou mixolydien bémol 6) combine la luminosité majeure avec une tension mélancolique créée par sa sixte mineure. Il crée un pont entre la joie du majeur et la profondeur émotionnelle du mineur, offrant une expressivité particulièrement nuancée. Présent dans de nombreuses musiques ethniques, notamment des Balkans, et repris par des compositeurs comme Bartók, il apporte une couleur modale distinctive. Sa combinaison de tierce majeure et sixte mineure évoque une nostalgie lumineuse plutôt qu’une tristesse profonde. Le majeur mélodique incarne la dualité émotionnelle inhérente à l’expérience humaine, permettant de belles ambiances quand on recherche un mélange subtil de clarté et de gravité.",
    culture: "Balkanique & Est-européenne",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "half diminished",
    aliases: ["locrian #2", "melodic minor sixth mode"],
    modeNum: 5,
    mode: 5,
    intervals: ["1P", "2M", "3m", "4P", "5d", "6m", "7m"],
    alt: ["b5", "b6", "b7"],
    triad: "diminished",
    seventh: "min7b5",
    description:
      "Le mode demi-diminué (ou locrien dièse 2) adoucit légèrement la tension extrême du locrien tout en maintenant son caractère instable. Il évoque l’incertitude, la transition et une anxiété contenue, rendant sa résolution encore plus satisfaisante. Fondamental dans le jazz pour harmoniser les accords II-V-I en mineur, il constitue un vocabulaire essentiel des progressions d’accords sophistiquées. Sa seconde majeure offre un point d’appui mélodique tout en préservant la tension dramatique de la quinte diminuée. Le demi-diminué représente l’équilibre parfait entre tension et fonction harmonique claire, expliquant son omniprésence dans les compositions de Duke Ellington à John Coltrane.",
    culture: "Jazz modal",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "altered",
    aliases: ["super locrian", "melodic minor seventh mode"],
    modeNum: 6,
    mode: 6,
    intervals: ["1P", "2m", "3m", "4d", "5d", "6m", "7m"],
    alt: ["b2", "b3", "b4", "b5", "b6", "b7"],
    triad: "diminished",
    seventh: "7alt",
    description:
      "Le mode altéré, avec ses multiples altérations descendantes, représente le paroxysme de la tension harmonique dans le langage jazz. Il évoque un chaos contrôlé, une dissonance expressive et l’urgence de résolution, créant une intensité dramatique inégalée. Utilisé exclusivement sur les dominantes altérées dans le jazz moderne, il offre un maximum de possibilités chromatiques pour l’improvisation avancée. Sa structure intervallique particulière, avec quarte et quinte diminuées, génère cette instabilité extrême qui annonce et valorise la résolution. Le mode altéré incarne l’évolution ultime du langage bebop, poussant la tension harmonique à ses limites tout en maintenant une fonction tonale claire.",
    culture: "Jazz contemporain",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "harmonic minor",
    aliases: ["minor harmonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4P", "5P", "6m", "7M"],
    alt: ["b3", "b6"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "Le mode mineur harmonique, avec son intervalle augmenté caractéristique entre le sixième et le septième degré, évoque immédiatement mystère et exotisme. Il combine la profondeur émotionnelle du mineur avec une tension dramatique créée par sa septième majeure. Utilisé abondamment dans la musique classique, le flamenco et la musique tzigane, il apporte une intensité théâtrale sans pareille. Sa sonorité distinctive a inspiré d’innombrables compositeurs, de Mozart à Rimsky-Korsakov, pour représenter des atmosphères orientales ou magiques. Le mineur harmonique transcende les frontières culturelles pour exprimer passion et mystère avec une couleur immédiatement reconnaissable.",
    culture: "Classique & Tzigane",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "locrian 6",
    aliases: ["harmonic minor second mode"],
    modeNum: 1,
    mode: 1,
    intervals: ["1P", "2m", "3m", "4P", "5d", "6M", "7m"],
    alt: ["b2", "b3", "b5", "b7"],
    triad: "diminished",
    seventh: "min7b5",
    description:
      "Le mode locrien 6, avec sa sixte majeure contrastant avec la quinte diminuée, crée une tension harmonique particulière et paradoxale. Il évoque une instabilité sophistiquée, une mélancolie complexe et une tension qui cherche une résolution sans être totalement désespérée. Rarement utilisé comme tonalité principale, il apparaît dans le jazz contemporain et la musique classique moderne pour des passages très dramatiques. Sa structure particulière offre un équilibre intéressant entre dissonance et espoir, grâce à la présence de la sixte majeure. Le locrien 6 reflète la capacité de la musique moderne à exprimer des émotions ambiguës et contradictoires, traduisant la complexité de l’âme humaine.",
    culture: "Jazz d'avant-garde",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "ionian #5",
    aliases: ["harmonic minor third mode"],
    modeNum: 2,
    mode: 2,
    intervals: ["1P", "2M", "3M", "4P", "5A", "6M", "7m"],
    alt: ["#5", "b7"],
    triad: "augmented",
    seventh: "aug7",
    description:
      "Le mode ionien dièse 5 transforme la stabilité du mode majeur en une sonorité plus tendue et exotique grâce à sa quinte augmentée. Il évoque à la fois la familiarité du majeur et l’étrangeté d’une harmonie augmentée, créant une brillance teintée de mystère. Utilisé principalement dans le jazz moderne et la musique de film, il ajoute une touche audacieuse aux progressions harmoniques. Sa capacité à fusionner consonance et dissonance en fait un outil expressif particulièrement riche pour les compositeurs contemporains. L’ionien dièse 5 illustre parfaitement comment une simple altération peut transformer radicalement le caractère émotionnel et expressif d’un mode familier.",
    culture: "Jazz moderne",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "dorian #4",
    aliases: ["harmonic minor fourth mode"],
    modeNum: 3,
    mode: 3,
    intervals: ["1P", "2M", "3m", "4A", "5P", "6M", "7m"],
    alt: ["b3", "#4", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le mode dorien dièse 4 enrichit la mélancolie équilibrée du dorien avec la tension spectrale de la quarte augmentée. Il évoque une introspection teintée d’étrangeté, une tristesse aux couleurs surréalistes, créant cette dualité entre familiarité et altérité. Utilisé dans la musique contemporaine, le jazz expérimental et certaines musiques ethniques d’Europe de l’Est, il offre une palette de couleurs harmoniques fascinantes. Sa combinaison de notes mineures et de quarte augmentée génère un climat à la fois doux et angoissant. Le dorien dièse 4 représente l’évolution naturelle du langage modal, transcendant les catégories traditionnelles pour exprimer des nuances émotionnelles complexes.",
    culture: "Contemporain & Est-européen",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "phrygian dominant",
    aliases: ["spanish phrygian", "harmonic minor fifth mode"],
    modeNum: 4,
    mode: 4,
    intervals: ["1P", "2m", "3M", "4P", "5P", "6m", "7m"],
    alt: ["b2", "b6", "b7"],
    triad: "major",
    seventh: "7",
    description:
      "Le mode phrygien dominant, avec son mélange unique de tierce majeure et seconde mineure, incarne l’essence de la musique espagnole et méditerranéenne. Il évoque immédiatement passion, intensité et chaleur, créant la tension si caractéristique du flamenco. Sa structure intervallique particulière, oscillant entre saveurs orientales et occidentales, le rend incontournable dans les musiques séfarades et moyen-orientales. Pilier du flamenco et de la musique andalouse, ce mode confère aux œuvres un caractère à la fois exalté et mystique. Le phrygien dominant possède la remarquable capacité d’immerger instantanément l’auditeur dans un paysage sonore aux couleurs ardentes et dramatiques.",
    culture: "Espagnole & Méditerranéenne",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "lydian #2",
    aliases: ["harmonic minor sixth mode"],
    modeNum: 5,
    mode: 5,
    intervals: ["1P", "2A", "3M", "4A", "5P", "6M", "7M"],
    alt: ["#2", "#4"],
    triad: "major",
    seventh: "maj7",
    description:
      "Le mode lydien dièse 2, avec sa seconde augmentée distinctive, pousse l’étrangeté du lydien encore plus loin dans l’altération et l’exotisme. Il évoque des sonorités orientales et mystiques tout en conservant la brillance aérienne typique du lydien. Utilisé dans les compositions modernes, le jazz d’avant-garde et certaines musiques de film, il offre une tension harmonique subtile et intrigante. Sa combinaison unique de secondes et de quartes augmentées donne ce sentiment d’apesanteur où la résolution semble suspendue. Le lydien dièse 2 représente l’une des expressions les plus avancées de la fusion entre influences orientales et occidentales dans le langage musical contemporain.",
    culture: "Fusion orientale & Contemporain",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "ultralocrian",
    aliases: ["super locrian bb7", "harmonic minor seventh mode"],
    modeNum: 6,
    mode: 6,
    intervals: ["1P", "2m", "3m", "4d", "5d", "6m", "7d"],
    alt: ["b2", "b3", "b4", "b5", "b6", "bb7"],
    triad: "diminished",
    seventh: "dim7",
    description:
      "Le mode ultralocrien, avec sa septième doublement bémolisée, représente l’extrême limite de la dissonance et de l’instabilité harmonique. Il évoque un chaos absolu, où la tension semble ne jamais pouvoir se résoudre selon les approches tonales classiques. Rarement utilisé comme tonalité principale, on le retrouve surtout dans la musique contemporaine expérimentale et certains domaines du jazz avant-gardiste. Sa structure intervallique unique, riche en altérations descendantes, projette l’auditeur dans une zone hors des repères traditionnels. L’ultralocrien incarne la recherche permanente de nouvelles frontières expressives, en repoussant les limites de ce qui est considéré comme consonant ou dissonant.",
    culture: "Avant-garde & Expérimental",
    category: "Modes mineurs mélodiques et harmoniques"
  },
  {
    name: "harmonic major",
    aliases: ["major harmonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6m", "7M"],
    alt: ["b6"],
    triad: "major",
    seventh: "maj7",
    description:
      "Le mode majeur harmonique, fusion du majeur ionien avec la sixte mineure, crée un pont subtil entre la joie du majeur et la gravité du mineur. Il évoque une luminosité teintée de nostalgie, apportant une profondeur émotionnelle originale. Utilisé par des compositeurs comme Chopin et Tchaïkovski, ainsi que dans certaines musiques traditionnelles d’Europe de l’Est, il enrichit grandement le vocabulaire harmonique. Sa sixte mineure est la clé de sa tension expressive, permettant de basculer entre la douceur du majeur et l’intensité du mineur. Le majeur harmonique illustre la sophistication émotionnelle obtenue par une simple altération, offrant une grande diversité de couleurs dans l’écriture ou l’improvisation.",
    culture: "Romantique européen",
    category: "Modes mineurs mélodiques et harmoniques"
  },

  // GAMMES PENTATONIQUES
  {
    name: "major pentatonic",
    aliases: ["pentatonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "5P", "6M"],
    alt: [],
    triad: "major",
    seventh: "6",
    description:
      "La gamme pentatonique majeure, avec ses cinq notes harmonieusement arrangées, offre une sonorité universellement agréable et intuitive. Elle exprime la joie, la simplicité et une clarté qui transcende les cultures musicales du monde entier. Sans demi-tons, elle crée une consonance naturelle qui évite les tensions, ce qui la rend parfaite pour l'improvisation et les mélodies mémorables. Fondamentale dans la musique folk, country, pop et rock, cette gamme constitue un langage musical accessible à tous. Des chansons enfantines traditionnelles aux solos de guitare classiques, la pentatonique majeure incarne l'essence même de la communication musicale directe et universelle.",
    culture: "Musiques traditionnelles mondiales",
    category: "Gammes pentatoniques"
  },
  {
    name: "minor pentatonic",
    aliases: ["minor pent"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3m", "4P", "5P", "7m"],
    alt: ["b3", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "La gamme pentatonique mineure, pierre angulaire du blues et du rock, possède une expressivité émotionnelle incomparable malgré sa simplicité. Elle évoque à la fois la mélancolie, la force, l’introspection et la rébellion, avec une tension subtile qui ne verse jamais dans la dissonance. Sans demi-tons, elle offre une liberté d’improvisation qui pardonne les erreurs tout en permettant une profonde expression personnelle. Des lamentations de la guitare blues aux riffs puissants du hard rock, cette gamme a façonné l’histoire de la musique populaire moderne. La pentatonique mineure représente le parfait équilibre entre accessibilité technique et profondeur émotionnelle, expliquant son omniprésence dans une multitude de genres contemporains.",
    culture: "Blues & Rock",
    category: "Gammes pentatoniques"
  },
  {
    name: "ritusen",
    aliases: ["major pentatonic b2"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "4P", "5P", "6M"],
    alt: ["b2"],
    triad: "sus4",
    seventh: "sus4add6",
    description:
      "La gamme ritusen, variante japonaise de la pentatonique incluant une seconde mineure, crée un univers sonore à la fois apaisant et mystérieux. Elle exprime sérénité et intériorité, tout en gardant une petite touche d’exotisme propre aux échelles orientales. Utilisée principalement dans la musique traditionnelle japonaise et dans certaines compositions modernes d’inspiration asiatique, elle apporte une couleur modale distincte. Son absence de tierce donne un caractère suspendu, oscillant entre majeur et mineur, et laissant la place aux nuances de l’interprète. La ritusen illustre parfaitement l’esthétique japonaise du “ma”, où le silence et l’espace occupent une importance égale à celle des notes.",
    culture: "Japonaise",
    category: "Gammes pentatoniques"
  },
  {
    name: "man gong",
    aliases: ["major pentatonic b6"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "4P", "5P", "6m"],
    alt: ["b6"],
    triad: "sus4",
    seventh: "7sus4",
    description:
      "La gamme man gong, avec son mélange de quarte juste et sixte mineure, crée une sonorité ouverte et contemplative évoquant les paysages sonores de l’Extrême-Orient. Elle exprime une tranquillité teintée de mélancolie, une sérénité qui reconnaît la dualité de l’existence. Utilisée dans les musiques traditionnelles chinoises et dans certaines créations contemporaines d’inspiration asiatique, elle transcende la division occidentale majeur/mineur. Son absence de tierce lui confère une qualité flottante, incitant l’auditeur à se concentrer sur la couleur globale plutôt que sur la tension entre majeur et mineur. Le man gong représente l’équilibre parfait entre espace et émotion, incarnant l’idéal esthétique oriental où la suggestion prévaut sur l’affirmation directe.",
    culture: "Chinoise",
    category: "Gammes pentatoniques"
  },
  {
    name: "yo",
    aliases: ["pentatonic b3 b7"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "5P", "7m"],
    alt: ["b3", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "La gamme yo, fondamentale dans la musique traditionnelle japonaise, tisse un pont fascinant entre sensibilités orientales et occidentales grâce à sa structure pentatonique mineure. Elle évoque une mélancolie paisible, une acceptation sereine de l’impermanence qui incarne parfaitement le concept esthétique japonais du mono no aware. Utilisée principalement sur des instruments comme le shakuhachi et le koto, elle distille cette douceur contemplative propre à l’art nippon. Son absence de quarte et de sixte crée un espace sonore propice à la réflexion et à l’introspection. La gamme yo symbolise l’équilibre entre expression émotionnelle et retenue méditative, entre tristesse et sublimation.",
    culture: "Japonaise",
    category: "Gammes pentatoniques"
  },
  {
    name: "blues minor",
    aliases: ["pentatonic b3 b5"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3m", "4P", "5d", "7m"],
    alt: ["b3", "b5", "b7"],
    triad: "diminished",
    seventh: "min7b5",
    description:
      "La gamme blues mineure, avec sa quinte diminuée caractéristique, intensifie la profondeur expressive de la pentatonique mineure. Elle évoque une tristesse viscérale, une plainte vibrante et cette fameuse “blue note” qui traduit la douleur humaine avec une authenticité bouleversante. Parfaite pour le blues le plus cru, le jazz modal et certains sous-genres du rock alternatif, elle délivre une intensité dramatique remarquable. Sa quinte diminuée, véritable pivot de la gamme, encourage des inflexions microtonales expressives typiques du style. La blues mineure incarne la quintessence de l’émotion brute en musique, offrant un véhicule puissant pour exprimer la souffrance et la résilience.",
    culture: "Blues expressif",
    category: "Gammes pentatoniques"
  },
  {
    name: "blues major",
    aliases: ["pentatonic b2 b5"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "5d", "6M"],
    alt: ["b2", "b5"],
    triad: "augmented",
    seventh: "6",
    description:
      "La gamme blues majeure, fusionnant caractéristiques majeures et altérations blues, offre un son unique à la fois joyeux et plein de nostalgie. Elle évoque la joie teintée de vécu, l’optimisme conscient des difficultés, et traduit parfaitement la dualité émotionnelle du blues. Utilisée par des guitaristes comme Robben Ford ou Larry Carlton, elle sert à colorer les solos d’une expressivité plus “lumineuse” que la simple pentatonique mineure. Sa combinaison de tierce majeure et de notes altérées crée une tension mélodique subtile propice aux glissandos et aux bending. La blues majeure symbolise l’évolution du blues vers une forme plus ouverte, gardant son âme profonde tout en explorant des territoires harmoniques variés.",
    culture: "Jazz-blues",
    category: "Gammes pentatoniques"
  },

  // GAMMES HEXATONIQUES
  {
    name: "whole tone",
    aliases: ["wholetone", "augmented"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4A", "5A", "7m"],
    alt: ["#4", "#5", "b7"],
    triad: "augmented",
    seventh: "7#5",
    description:
      "La gamme par tons entiers, parfaitement symétrique et sans centre tonal évident, installe une atmosphère flottante et irréelle. Elle évoque le mystère, l’apesanteur et une forme d’instabilité qui semble suspendre tout sens de résolution. Popularisée par Debussy et les compositeurs impressionnistes, elle est souvent associée à l’idée de rêve, d’incertitude ou de magie dans les musiques de film. Son absence totale de demi-tons lui confère une sonorité homogène et insaisissable, où chaque note paraît équidistante. La gamme par tons entiers symbolise ainsi l’ambiguïté et la fluidité, créant un paysage sonore où la notion de tension/résolution classique se dissout presque complètement.",
    culture: "Impressionnisme français",
    category: "Gammes hexatoniques"
  },
  {
    name: "augmented triad",
    aliases: ["major augmented triad"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3M", "5A"],
    alt: ["#5"],
    triad: "augmented",
    seventh: "maj7#5",
    description:
      "L’arpège augmenté, formé de trois tierces majeures empilées, présente une symétrie remarquable qui défie les repères harmoniques traditionnels. Il évoque une tension mystique, une brillance presque surnaturelle et une sensation de flottement entre plusieurs pôles tonals. Utilisé par Liszt, Debussy et des jazzmen comme John Coltrane, il marque souvent des moments de transition ou de recherche d’harmonie hors du cadre tonal classique. Sa structure parfaitement équidistante offre des possibilités modulantes intéressantes qui fascinent les compositeurs depuis la fin du XIXe siècle. L’arpège augmenté représente l’une des premières explorations de la musique occidentale vers un langage davantage chromatique et moins centré sur la tonalité fonctionnelle.",
    culture: "Impressionnisme & Contemporain",
    category: "Gammes hexatoniques"
  },
  {
    name: "prometheus",
    aliases: ["prometheus scale", "lydian flat 7"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4A", "6M", "7m"],
    alt: ["#4", "b7"],
    triad: "lydian",
    seventh: "7#11",
    description:
      "La gamme prométhéenne, conçue par Scriabine, se caractérise par la présence de la quarte augmentée et de la septième mineure, offrant un coloris à la fois lumineux et tendu. Elle évoque une tension cosmique et une brillance quasi divine teintée d’une humanité plus sombre. Utilisée par Scriabine dans ses œuvres mystiques puis reprise par des musiciens de jazz comme Wayne Shorter, elle incarne la quête spirituelle et la recherche d’un nouveau langage expressif. Sa structure hexatonique particulière crée cette impression d’une gamme incomplète, toujours en attente d’une résolution qui n’arrive jamais vraiment. La gamme prométhéenne reflète ainsi la volonté d’atteindre une forme de transcendance artistique au-delà des cadres harmoniques usuels.",
    culture: "Mystique russe",
    category: "Gammes hexatoniques"
  },
  {
    name: "blues",
    aliases: ["blues scale"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3m", "4P", "5d", "5P", "7m"],
    alt: ["b3", "b5", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "La gamme blues, avec sa fameuse “blue note” (la quinte diminuée ou « blue note »), capture l’essence même de l’expression afro-américaine dans la musique populaire. Elle évoque la souffrance, la plainte et la libération émotionnelle, permettant une grande variété d’inflexions microtonales. Ce mélange pentatonique enrichi d’une note supplémentaire permet de traduire la douleur et la résilience, offrant des possibilités infinies pour l’improvisation. Fondement du blues, du rock, du jazz et de nombreuses musiques populaires, elle est devenue un langage universel de l’émotion brute. La gamme blues représente l’équilibre parfait entre une structure simple et une expressivité profonde, touchant l’auditeur par sa sincérité directe.",
    culture: "Afro-américaine",
    category: "Gammes hexatoniques"
  },

  // GAMMES OCTATONIQUES ET SYMÉTRIQUES
  {
    name: "diminished",
    aliases: ["whole-half diminished", "octatonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4P", "5d", "6m", "6M", "7M"],
    alt: ["b5"],
    triad: "diminished",
    seventh: "dim7",
    description:
      "La gamme diminuée ton–demi-ton, parfaitement symétrique dans sa construction alternée, produit une tension harmonique continue et insaisissable. Elle évoque le mystère, l’angoisse et parfois l’aspect mécanique d’une spirale sans fin. Exploitée par des compositeurs comme Stravinsky ou Bartók et adoptée par de nombreux jazzmen, elle outrepasse la tonalité traditionnelle pour offrir un univers sonore inclassable. Sa structure symétrique rend possible le déplacement de motifs identiques par tierces mineures, créant un effet de kaléidoscope musical. La gamme diminuée incarne l’un des premiers pas de la musique occidentale vers des systèmes moins centrés sur la tonalité, ouvrant la voie à l’exploration du chromatisme intégral.",
    culture: "Jazz & Contemporain",
    category: "Gammes octatoniques et symétriques"
  },
  {
    name: "half-whole diminished",
    aliases: ["half-whole", "octatonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "3M", "5d", "5P", "6M", "7m"],
    alt: ["b2", "b3", "#3", "b5"],
    triad: "diminished",
    seventh: "dim7",
    description:
      "La gamme diminuée demi-ton–ton, autre version de l’octatonique, intensifie la tension harmonique dès le premier intervalle (seconde mineure). Elle évoque une anxiété plus immédiate, une urgence dramatique tout en conservant la fascinante symétrie propre aux échelles octatoniques. Utilisée par Messiaen et dans le jazz moderne pour improviser sur des accords altérés, elle propose un registre d’expressivité très large. Sa structure symétrique permet des modulations rapides par tierces majeures, créant de véritables effets de dédoublement. La gamme diminuée demi-ton–ton illustre l’intérêt de la musique contemporaine pour des organisations sonores non-tonales, offrant un terrain fertile pour les compositeurs et improvisateurs en quête de nouveauté.",
    culture: "Contemporain & Jazz moderne",
    category: "Gammes octatoniques et symétriques"
  },

  // MODES JAPONAIS
  {
    name: "hirajoshi",
    aliases: ["japanese"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "5P", "6m"],
    alt: ["b3", "b6"],
    triad: "minor",
    seventh: "min7",
    description:
      "La gamme hirajoshi, pilier de la musique traditionnelle japonaise, transporte immédiatement l’auditeur dans un univers sonore sobre et contemplatif. Elle évoque un exotisme méditatif, une certaine retenue et une élégance discrète typiques de l’esthétique japonaise. Utilisée principalement pour le koto ou le shamisen, elle met l’accent sur l’ornementation et les silences valorisés par la philosophie du ‘ma’. Sa structure pentatonique particulière, mariant secondes majeures et tierces mineures, offre une tension légère et subtile. L’hirajoshi représente la quintessence de l’équilibre entre simplicité apparente et raffinement expressif, caractéristique de l’art nippon.",
    culture: "Japonaise",
    category: "Modes japonais"
  },
  {
    name: "in sen",
    aliases: ["japanese in"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "4P", "5P", "7m"],
    alt: ["b2", "b7"],
    triad: "sus4",
    seventh: "sus4",
    description:
      "La gamme in sen, avec sa seconde mineure initiale, instaure dès la première note une ambiance intime et introspective. Elle évoque le mystère, l’intériorité et cette qualité méditative qui incite à la réflexion profonde. Utilisée sur le shakuhachi et dans le théâtre nô, elle sublime le silence autant que la note, élément central de la pensée zen. Son absence de tierce ouvre un espace sonore où l’émotion peut se déployer sans être strictement cataloguée en mode majeur ou mineur. L’in sen illustre parfaitement l’esthétique japonaise où la suggestion et l’imperfection deviennent des sources de beauté et d’intensité expressive.",
    culture: "Japonaise",
    category: "Modes japonais"
  },
  {
    name: "iwato",
    aliases: ["japanese iwato"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "4P", "5d", "7m"],
    alt: ["b2", "b5", "b7"],
    triad: "diminished",
    seventh: "dim7",
    description:
      "La gamme iwato, caractérisée par l’association d’une seconde mineure et d’une quinte diminuée, déploie une tension rare et envoûtante. Elle évoque un univers empreint de mystère, de sacré et parfois d’une légère inquiétude, typique du théâtre nô où elle est souvent employée. Utilisée aussi pour des pièces au shakuhachi, elle produit un climat sonore profond et hypnotique. Sa structure tendue fait naître des mélodies qui paraissent flotter entre deux mondes, sans jamais trouver de repos définitif. L’iwato symbolise le pouvoir de la musique japonaise à suggérer l’invisible, le fantomatique, et à investir l’espace scénique d’une aura spirituelle.",
    culture: "Japonaise traditionnelle",
    category: "Modes japonais"
  },
  {
    name: "kumoi",
    aliases: ["japanese kumoi"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "5P", "6M"],
    alt: ["b3"],
    triad: "minor",
    seventh: "min6",
    description:
      "La gamme kumoi, combinant tierce mineure et sixte majeure, incarne un subtil équilibre entre mélancolie et luminosité propre à certaines traditions japonaises. Elle évoque la contemplation, la délicatesse et cette dualité émotionnelle inscrite dans l’esthétique nippone. Utilisée pour le koto ou le shamisen, elle ouvre un champ expressif riche et nuancé, propice aux ornementations raffinées. Sa structure pentatonique laisse un large espace aux interprètes pour jouer sur la dynamique et l’articulation. La kumoi représente l’harmonie fragile entre la tristesse et l’espoir, caractéristique de la philosophie japonaise axée sur l’impermanence et la beauté éphémère.",
    culture: "Japonaise",
    category: "Modes japonais"
  },

  // GAMMES ETHNIQUES ET FOLKLORIQUES
  {
    name: "arabian",
    aliases: ["arabic", "hijaz"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4P", "5P", "6m", "7M"],
    alt: ["b2", "b6"],
    triad: "major",
    seventh: "maj7",
    description:
      "Le maqam hijaz, parfois appelé mode arabe, est défini par l’écart d’un ton et demi entre sa seconde mineure et sa tierce majeure, créant une tension orientale typique. Il évoque immédiatement les paysages désertiques, l’appel du muezzin et la richesse émotionnelle de la culture moyen-orientale. Fondamental dans la musique arabe, turque et séfarade, il se décline en de multiples variantes régionales. Sa seconde augmentée distinctive traduit musicalement la chaleur et la passion de ces régions, offrant au chanteur ou à l’instrumentiste des possibilités ornementales foisonnantes. Le hijaz illustre l’héritage culturel et spirituel profondément ancré dans l’Orient méditerranéen, où musique et poésie s’entremêlent depuis des siècles.",
    culture: "Arabe & Moyen-orientale",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "persian",
    aliases: ["middle eastern"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4P", "5d", "6m", "7M"],
    alt: ["b2", "b5", "b6"],
    triad: "augmented",
    seventh: "maj7b5",
    description:
      "Le mode persan, marqué par plusieurs intervalles augmentés, reflète l’essence sophistiquée de la musique classique iranienne et ses somptueuses ornementations. Il évoque les jardins de Perse, la poésie de Rumi et une forme d’extase intérieure propre à la tradition soufie. Fondamental dans la musique savante persane, jouée notamment sur le tar ou le santur, il traduit une quête spirituelle et philosophique. Ses intervalles inusités ouvrent la porte à des microtonalités et à des sentiments mélodiques d’une grande finesse. Le mode persan est l’une des pierres angulaires d’un univers musical millénaire, alliant rigueur structurelle et liberté ornementale.",
    culture: "Persane",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "byzantine",
    aliases: ["double harmonic", "gypsy major"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4P", "5P", "6m", "7M"],
    alt: ["b2", "b6"],
    triad: "major",
    seventh: "maj7",
    description:
      "La gamme byzantine, caractérisée par deux secondes augmentées, émane un parfum d’Orient, de mystère et de transcendance. Elle évoque la majesté des liturgies orthodoxes, les ruelles animées d’Istanbul et l’atmosphère spirituelle des monastères grecs. Sa structure combine des éléments issus de la musique arabe, grecque et tzigane, reflétant un creuset culturel entre l’Est et l’Ouest. Fondamentale dans la musique orthodoxe et dans certaines traditions balkaniques, elle a également influencé de nombreux compositeurs occidentaux en quête d’exotisme. La gamme byzantine incarne ainsi le dialogue permanent entre cultures, en offrant une couleur sonore reconnaissable entre mille.",
    culture: "Grecque & Moyen-orientale",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "hungarian minor",
    aliases: ["gypsy minor", "double harmonic minor"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4A", "5P", "6m", "7M"],
    alt: ["#4", "b6"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "Le mode mineur hongrois, doté d’une quarte augmentée et d’une septième majeure, incarne l’âme passionnée et mélancolique de la musique tzigane d’Europe centrale. Il évoque un tourbillon d’émotions allant de la tristesse profonde à la virtuosité éclatante, typique des violonistes roms. Sa structure singulière, mélange de mineur harmonique et d’éléments lydiens, produit une tension colorée et déstabilisante. Fondamental dans la musique tzigane hongroise et roumaine, il a séduit des compositeurs tels que Liszt, Brahms ou Bartók. Le mineur hongrois symbolise l’esprit libre, intense et souvent nomade de ces peuples qui ont influencé profondément le répertoire classique et folklorique européen.",
    culture: "Tzigane & Hongroise",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "hungarian major",
    aliases: ["gypsy major scale"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2A", "3M", "4A", "5P", "6M", "7m"],
    alt: ["#2", "#4", "b7"],
    triad: "augmented",
    seventh: "7#11",
    description:
      "Le mode majeur hongrois, riche en secondes et quartes augmentées, atteint des sommets d’exotisme dans la musique d’Europe centrale. Il évoque simultanément une joie débridée et une profonde mélancolie, reflétant les contrastes émotionnels de la culture tzigane. Sa structure inhabituelle, combinant des intervalles diatoniques et altérés, crée une tension particulièrement savoureuse. Intégré par Bartók et Kodály dans leurs compositions inspirées du folklore, il témoigne de la vitalité et de la complexité de la tradition musicale tzigane. Le majeur hongrois exprime l’âme tzigane en toute sa flamboyance, conjuguant la fête et le drame dans un même élan.",
    culture: "Tzigane & Hongroise",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "enigmatic",
    aliases: ["enigmatic scale"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4A", "5A", "6M", "7M"],
    alt: ["b2", "#4", "#5"],
    triad: "augmented",
    seventh: "maj7#5",
    description:
      "La gamme énigmatique, imaginée par Giuseppe Verdi pour défier la théorie musicale de son époque, propose un enchaînement d’intervalles singulièrement ascendants. Elle évoque un mystère insondable, une tension harmonique presque irréconciliable et une atmosphère proche de l’incantation. Sa structure complexe a inspiré des compositeurs comme Scriabine ou des jazzmen en quête de nouvelles couleurs. Chaque degré altéré projette l’auditeur dans une sphère onirique, loin des repères de la tonalité classique. La gamme énigmatique incarne la volonté d’explorer l’inconnu musical, annonçant les bouleversements harmoniques du XXe siècle et la naissance de la modernité atonale.",
    culture: "Post-romantique européen",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "neapolitan major",
    aliases: ["neapolitan"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "4P", "5P", "6M", "7M"],
    alt: ["b2", "b3"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "La gamme napolitaine majeure, avec sa seconde mineure caractéristique, associe l’élégance baroque à un exotisme subtil venu du bassin méditerranéen. Elle exprime une gravité raffinée et un certain lyrisme propre à la tradition italienne. Utilisée par Scarlatti et Mozart, entre autres, elle apparaît dans de nombreuses pièces pour souligner un climat plus sombre ou plus noble. Sa seconde mineure initiale crée une tension remarquable, vite contrecarrée par la sixte et la septième majeures. La gamme napolitaine majeure incarne la rencontre harmonieuse entre le style académique européen et les couleurs plus audacieuses des musiques populaires de la région napolitaine.",
    culture: "Baroque italien",
    category: "Gammes ethniques et folkloriques"
  },
  {
    name: "neapolitan minor",
    aliases: ["neapolitan min"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "4P", "5P", "6m", "7M"],
    alt: ["b2", "b3", "b6"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "La gamme napolitaine mineure résulte de la fusion de la seconde mineure caractéristique de la napolitaine et du caractère dramatique du mineur harmonique. Elle évoque une noblesse tragique, une passion intense et une force théâtrale rappelant l’opéra romantique italien. Utilisée par des compositeurs comme Bellini ou Donizetti, elle souligne des passages chargés d’émotion et de tension. Sa combinaison de seconde mineure et de septième majeure offre une palette harmonique rare, entre douleur et sublime. La gamme napolitaine mineure incarne la puissance expressive de la tradition romantique, capable de faire vibrer les cœurs et les larmes.",
    culture: "Romantique italien",
    category: "Gammes ethniques et folkloriques"
  },

  // GAMMES DE JAZZ ET CONTEMPORAINES
  {
    name: "bebop major",
    aliases: ["bebop", "bebop dominant"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7m", "7M"],
    alt: ["b7", "7"],
    triad: "major",
    seventh: "7",
    description:
      "La gamme bebop majeure, enrichie d’une note chromatique de passage entre la septième mineure et l’octave, reflète la sophistication mélodique du jazz moderne. Elle facilite le phrasé “bebop” où les notes clés de l’accord tombent sur les temps forts, créant une fluidité rythmique inimitable. Développée par Charlie Parker et Dizzy Gillespie, elle symbolise la montée en complexité harmonique du jazz dans les années 1940. Sa structure à huit notes préserve la simplicité du majeur tout en ajoutant une pincée de piquant chromatique. La gamme bebop majeure illustre l’inventivité des jazzmen, capables d’adapter la théorie musicale à leur virtuosité improvisatrice.",
    culture: "Bebop américain",
    category: "Gammes de jazz et contemporaines"
  },
  {
    name: "bebop minor",
    aliases: ["bebop dorian"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4P", "5P", "6M", "7m", "7M"],
    alt: ["b3", "7"],
    triad: "minor",
    seventh: "min7",
    description:
      "La gamme bebop mineure, issue de la combinaison du mode dorien et d’une note chromatique supplémentaire, confère une fluidité mélodique exemplaire en contexte mineur. Elle permet de maintenir la logique rythmique propre au style bebop tout en conservant l’atmosphère introspective du mineur. Utilisée par des pionniers comme Thelonious Monk ou Bud Powell, elle a enrichi le vocabulaire de l’improvisation jazz. Sa structure à huit notes autorise ces fameuses lignes de croches continues tombant harmonieusement sur les notes d’accord. La gamme bebop mineure illustre l’équilibre entre la recherche de complexité harmonique et la nécessité de garder un élan mélodique naturel.",
    culture: "Bebop américain",
    category: "Gammes de jazz et contemporaines"
  },
  {
    name: "bebop dominant",
    aliases: ["bebop mixolydian"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7m", "7M"],
    alt: ["b7", "7"],
    triad: "major",
    seventh: "7",
    description:
      "La gamme bebop dominante, dérivée du mode mixolydien avec une note chromatique de passage, est l’outil privilégié pour improviser sur des accords de septième. Elle permet ces lignes mélodiques rapides et précises où les notes fortes coïncident avec l’harmonie, signature du style bebop. Développée par Charlie Parker et ses contemporains, elle fait partie du socle théorique du jazz moderne. Sa structure à huit notes ajoute juste ce qu’il faut de chromatisme pour augmenter la richesse du discours improvisé. La gamme bebop dominante montre comment de simples ajustements au système diatonique peuvent libérer une expressivité rythmique et harmonique exceptionnelle.",
    culture: "Bebop américain",
    category: "Gammes de jazz et contemporaines"
  },
  {
    name: "lydian dominant pentatonic",
    aliases: ["dominant pentatonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3M", "4A", "5P", "7m"],
    alt: ["#4", "b7"],
    triad: "lydian",
    seventh: "7#11",
    description:
      "La gamme pentatonique lydienne dominante associe la luminosité de la quarte augmentée au caractère bluesy de la septième mineure. Elle évoque à la fois un sentiment d’élévation et une tension vivifiante, idéale pour donner du relief à des progressions dominantes. Utilisée par des guitaristes de jazz fusion comme John Scofield ou Kurt Rosenwinkel, elle apporte une alternative rafraîchissante à la pentatonique traditionnelle. Sa structure réduite à cinq notes met en valeur ces deux intervalles clés, facilitant l’improvisation. La pentatonique lydienne dominante traduit l’évolution du vocabulaire moderne, combinant simplicité pentatonique et richesse des modes altérés.",
    culture: "Jazz fusion",
    category: "Gammes de jazz et contemporaines"
  },

  // GAMMES SUPPLÉMENTAIRES
  {
    name: "leading whole tone",
    aliases: ["lydian dominant b2"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4A", "5P", "6M", "7m"],
    alt: ["b2", "#4", "b7"],
    triad: "lydian",
    seventh: "7#11",
    description:
      "La gamme “leading whole tone” résulte d’une fusion entre la seconde mineure du phrygien et la structure globale du lydien dominant. Elle associe l’exotisme oriental à une brillance contemporaine, créant une tension dramatique particulièrement marquée. Utilisée dans le jazz actuel et certaines musiques de film, elle apporte de nouvelles couleurs aux accords dominants. Sa combinaison paradoxale d’intervalles, mêlant tons entiers et demi-tons inattendus, offre un espace idéal pour l’improvisation audacieuse. La “leading whole tone” incarne l’ouverture du jazz à des influences diverses, rapprochant traditions orientales et langage harmonique occidental.",
    culture: "Jazz contemporain",
    category: "Gammes supplémentaires"
  },
  {
    name: "six tone symmetrical",
    aliases: ["hexatonic", "augmented scale"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3m", "3M", "5P", "5A", "7M"],
    alt: ["b3", "#5"],
    triad: "augmented",
    seventh: "maj7#5",
    description:
      "La gamme hexatonique symétrique, alternant demi-tons et tons à intervalles réguliers, crée un univers sonore en perpétuel mouvement. Elle évoque une forme de mystère, d’instabilité et de vertige, où l’harmonie semble tourner en boucle sans point d’ancrage stable. Utilisée par Bartók, Debussy et parfois par Coltrane dans sa phase expérimentale, elle offre des possibilités de modulation inhabituelles. Sa structure répétitive facilite la transposition par tierces majeures, provoquant des effets kaléidoscopiques. L’hexatonique symétrique illustre l’intérêt des compositeurs du XXe siècle pour des systèmes alternatifs, rompant avec la tonalité traditionnelle en faveur d’une exploration purement intervallique.",
    culture: "Contemporain & Expérimental",
    category: "Gammes supplémentaires"
  },
  {
    name: "pelog",
    aliases: ["indonesian pelog"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "5P", "6m"],
    alt: ["b2", "b3", "b6"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le pélog, dans sa forme occidentalisée, tente d’approcher l’un des deux systèmes d’accord fondamentaux de la musique indonésienne de gamelan. Il évoque immédiatement les îles de Bali et Java, la résonance des gongs et l’atmosphère cérémonielle des temples. Sa structure pentatonique inégale, parfois éloignée du tempérament égal, offre des couleurs microtonales inconnues de l’oreille occidentale. Central dans les orchestres de gamelan, il a fasciné des compositeurs comme Debussy ou Messiaen, à la recherche de nouvelles palettes sonores. Le pélog nous rappelle que nos notions occidentales de tonalité et de tempérament ne sont qu’un choix parmi d’autres, et que le monde regorge de traditions musicales aux logiques singulières.",
    culture: "Indonésienne",
    category: "Gammes supplémentaires"
  },
  {
    name: "prometheus neopolitan",
    aliases: ["scriabin"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4A", "6M", "7m"],
    alt: ["b2", "#4", "b7"],
    triad: "lydian",
    seventh: "7#11",
    description:
      "La gamme prométhéenne napolitaine, élaborée par Scriabine, marie la seconde mineure napolitaine à la tension onirique de la quarte augmentée et la vitalité de la septième mineure. Elle évoque une extase mystique et une intensité dramatique, caractéristiques des œuvres tardives de Scriabine. Au cœur du système harmonique personnel du compositeur, elle vise à dépasser les limites de la tonalité pour rejoindre une sorte de “théosophie musicale”. Sa structure inédite mêle couleurs orientales et élans romantiques, créant des accords “mystiques” d’une grande densité. La gamme prométhéenne napolitaine symbolise la quête d’une transcendance artistique cherchant à unir l’émotion et la spiritualité dans un langage sonore nouveau.",
    culture: "Mystique russe",
    category: "Gammes supplémentaires"
  },
  {
    name: "super locrian",
    aliases: ["altered dominant"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "4d", "5d", "6m", "7m"],
    alt: ["b2", "b3", "b4", "b5", "b6", "b7"],
    triad: "diminished",
    seventh: "7alt",
    description:
      "Le mode super locrien, cumulé d’altérations descendantes, incarne l’apogée de la tension harmonique dans le jazz. Il évoque un sentiment d’urgence et d’instabilité extrêmes, où chaque note réclame une résolution immédiate. Essentiel pour jouer sur des accords dominants altérés, il offre la palette la plus large en termes de tensions mélodiques. Sa structure, regroupant presque toutes les altérations possibles, garantit un effet de surprise et un caractère très moderne dans les solos. Le super locrien traduit l’évolution du bebop vers un langage résolument contemporain, élargissant l’éventail expressif des improvisateurs.",
    culture: "Jazz contemporain",
    category: "Gammes supplémentaires"
  },
  {
    name: "algerian",
    aliases: ["north african"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4A", "5P", "6m", "7M"],
    alt: ["b3", "#4", "b6"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "La gamme algérienne, fruit des influences berbères, arabes et andalouses, reflète la diversité culturelle de l’Afrique du Nord. Elle évoque la chaleur du soleil méditerranéen, les étendues désertiques et la vitalité des rythmes maghrébins. Sa structure singulière, combinant mineur et inflexions orientales, imprime une tension expressive typique de la musique chaâbi ou andalouse. Fondamentale dans le patrimoine musical du Maghreb, elle a aussi séduit de nombreux compositeurs occidentaux intrigués par ses sonorités exotiques. La gamme algérienne symbolise ce carrefour entre Orient et Occident, où les traditions musicales s’entrelacent pour créer de nouvelles couleurs.",
    culture: "Nord-africaine",
    category: "Gammes supplémentaires"
  },

  // MODES ADDITIONNELS
  {
    name: "lydian flat 7",
    aliases: ["mixolydian #4", "overtone"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7m"],
    alt: ["#4", "b7"],
    triad: "lydian",
    seventh: "7#11",
    description:
      "Le mode lydien bémol 7, qui combine la brillance du lydien avec la tension du mixolydien, illustre parfaitement l’équilibre entre sophistication et caractère bluesy. Il évoque à la fois une élévation aérienne et un ancrage plus populaire, créant un climat sonore riche et distinctif. Fondamental dans le jazz modal et la fusion, on le retrouve souvent chez des musiciens tels que Pat Metheny ou Wayne Shorter. Sa structure, dérivée de la série des harmoniques naturelles, est aussi appelée “gamme acoustique” en raison de sa proximité avec les harmoniques d’un instrument à vent ou à cordes. Le lydien bémol 7 représente la poursuite du langage modal vers des territoires plus nuancés, mêlant tradition et modernité avec élégance.",
    culture: "Jazz modal",
    category: "Modes additionnels"
  },
  {
    name: "mixolydian b9 b13",
    aliases: ["phrygian dominant"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4P", "5P", "6m", "7m"],
    alt: ["b2", "b6", "b7"],
    triad: "major",
    seventh: "7",
    description:
      "Le mode mixolydien bémol 9 bémol 13, parfois associé au phrygien dominant, marie l’énergie du mixolydien à la tension exotique du phrygien. Il évoque d’emblée la passion ibérique, le flamenco et les musiques andalouses imprégnées d’influences arabes et tziganes. Sa seconde mineure et sa sixte mineure appuient le caractère épicé, voire enflammé, du style flamenco. Fondamental dans la musique méditerranéenne et les ambiances orientales, il a inspiré des compositeurs classiques et de nombreux guitaristes. Le mixolydien bémol 9 bémol 13 incarne la fusion des cultures, offrant un registre expressif mêlant fierté, mélancolie et virtuosité.",
    culture: "Méditerranéenne & Flamenco",
    category: "Modes additionnels"
  },
  {
    name: "locrian #6",
    aliases: ["aeolian b5"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "4P", "5d", "6M", "7m"],
    alt: ["b2", "b3", "b5", "b7"],
    triad: "diminished",
    seventh: "min7b5",
    description:
      "Le mode locrien dièse 6, version atténuée du locrien, vient adoucir sa tension inhérente grâce à la présence d’une sixte majeure. Il évoque un sentiment de désespoir teinté d’espérance, comme une lueur dans l’obscurité. Utilisé dans le jazz contemporain, notamment sur des accords de type II-V-I en mineur, il apporte une couleur nuancée à l’harmonie. Sa sixte majeure donne un petit souffle de lumière au cœur d’un mode traditionnellement sombre et instable. Le locrien dièse 6 symbolise la capacité à moduler entre tension et relâchement, offrant un langage sophistiqué aux improvisateurs recherchant des ambiances ambiguës.",
    culture: "Jazz contemporain",
    category: "Modes additionnels"
  },
  {
    name: "locrian major",
    aliases: ["ionian b2 b3"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3m", "4P", "5P", "6M", "7M"],
    alt: ["b2", "b3"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "Le mode locrien majeur, paradoxal dans sa conception, marie la base instable du locrien à une septième majeure plus lumineuse. Il évoque une dualité incessante entre ombre et clarté, tension et espoir, créant un paysage sonore particulièrement moderne. Utilisé dans le jazz contemporain ou certaines musiques de film, il propose des harmonies ambiguës propices à l’exploration atmosphérique. Sa structure intervallique renverse les repères classiques, forçant l’oreille à naviguer entre dissonance et consonance inhabituelles. Le locrien majeur illustre l’esprit d’une musique en quête de nouvelles frontières, où la notion de tonalité stable est remise en question au profit d’une expressivité plus libre.",
    culture: "Contemporain",
    category: "Modes additionnels"
  },
  {
    name: "romanian minor",
    aliases: ["ukrainian dorian"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "4A", "5P", "6m", "7m"],
    alt: ["b3", "#4", "b6", "b7"],
    triad: "minor",
    seventh: "min7",
    description:
      "Le mode mineur roumain, caractérisé par sa quarte augmentée, incarne l’intensité expressive et la richesse folklorique d’Europe de l’Est. Il évoque les vastes plaines ukrainiennes, les danses endiablées et le profond sentiment de fatalité qui imprègne l’âme slave. Sa structure singulière, fusionnant des éléments du dorien et des altérations orientales, confère à la mélodie une tension captivante. Fondamental dans les musiques traditionnelles roumaines, moldaves ou ukrainiennes, il a inspiré Bartók et Enesco dans leurs recherches ethnomusicologiques. Le mineur roumain traduit parfaitement la force brute et la sensibilité exacerbée de ces cultures, oscillant entre fête et lamentation.",
    culture: "Roumaine & Est-européenne",
    category: "Modes additionnels"
  },
  {
    name: "hindu",
    aliases: ["indian"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "4P", "5P", "6m", "7m"],
    alt: ["b6", "b7"],
    triad: "major",
    seventh: "7",
    description:
      "Le mode hindou, adaptation occidentale du raga Kafi, combine la clarté du majeur et la gravité d’une sixte et septième mineures. Il évoque la spiritualité indienne, la force contemplative des ragas et un certain détachement propre à la philosophie hindoue. Sa structure, proche du mixolydien, offre un mélange de convivialité majeure et de saveurs mineures. Bien qu’il ne capture qu’approximativement la richesse microtonale des ragas authentiques, il apporte une couleur orientale aux compositions occidentales. Le mode hindou témoigne de la fascination mutuelle entre Orient et Occident, chaque tradition musicale cherchant à enrichir son langage avec de nouvelles échelles et de nouveaux modes d’expression.",
    culture: "Indienne (approximation)",
    category: "Modes additionnels"
  },
  {
    name: "spanish",
    aliases: ["spanish 8 tone"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2m", "3M", "4P", "5P", "6m", "7m", "7M"],
    alt: ["b2", "b6", "b7", "7"],
    triad: "major",
    seventh: "7",
    description:
      "La gamme espagnole, née de la rencontre entre influences andalouses, mauresques et gitanes, est l’incarnation sonore du flamenco et de l’âme ibérique. Elle évoque une passion brûlante, un drame intérieur et une énergie flamboyante propres aux danses et chants andalous. Sa structure unique, combinant phrygien dominant et note chromatique supplémentaire, dégage une tension expressive immédiate. Fondamentale dans l’œuvre de compositeurs comme Manuel de Falla ou dans le flamenco traditionnel, elle est associée à la virtuosité des guitaristes et au chant profond du cante jondo. La gamme espagnole symbolise le brassage culturel qui caractérise l’Espagne, unissant éléments orientaux et européens dans un bouillonnement artistique incomparable.",
    culture: "Espagnole & Flamenco",
    category: "Modes additionnels"
  },
  {
    name: "major blues",
    aliases: ["blues major scale"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3m", "3M", "5P", "6M"],
    alt: ["b3", "3"],
    triad: "major",
    seventh: "6",
    description:
      "La gamme blues majeure, fruit de la fusion entre pentatonique majeure et notes blues, propose un univers où la joie coexiste avec une pointe de mélancolie. Elle évoque cette dualité caractéristique du blues : un sourire qui connaît la souffrance, une tristesse transcendée par le groove. Sa “blue note” (tierce mineure) dans un contexte majeur offre des possibilités d’inflexions subtiles qui reflètent l’histoire afro-américaine. Utilisée par innombrables guitaristes, elle enrichit l’improvisation d’un caractère festif mais conscient des épreuves. La blues majeure témoigne de la capacité du blues à évoluer et à intégrer de nouvelles nuances tout en préservant son intensité expressive.",
    culture: "Blues américain",
    category: "Modes additionnels"
  },
  {
    name: "minor hex",
    aliases: ["minor hexatonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "3m", "4P", "5P", "6M", "7M"],
    alt: ["b3"],
    triad: "minor",
    seventh: "minMaj7",
    description:
      "La gamme hexatonique mineure, associant tierce mineure et septième majeure, suscite une tension harmonique particulièrement raffinée. Elle évoque une mélancolie élégante, un sentiment d’attente qui ne sombre jamais dans l’obscurité complète. Utilisée par des pianistes comme Bill Evans ou des guitaristes comme Kurt Rosenwinkel, elle enrichit l’improvisation jazz d’une touche de modernité. Sa structure à six notes, dépourvue de seconde et de quinte altérées, crée un son aérien et épuré. L’hexatonique mineure illustre la recherche de nouvelles textures sonores, où la sobriété d’une gamme réduite sert de tremplin à une expression riche et nuancée.",
    culture: "Jazz contemporain",
    category: "Modes additionnels"
  },
  {
    name: "major hex",
    aliases: ["major hexatonic"],
    modeNum: 0,
    mode: 0,
    intervals: ["1P", "2M", "3M", "5P", "6M", "7M"],
    alt: [],
    triad: "major",
    seventh: "maj7",
    description:
      "La gamme hexatonique majeure, dépourvue de quarte et de septième mineure, confère un caractère à la fois lumineux et dépouillé à la musique. Elle évoque la sérénité, la légèreté et un sentiment d’espace, car elle évite certaines tensions propres à la gamme diatonique complète. Utilisée par des pianistes comme Kenny Barron ou des guitaristes comme Pat Metheny, elle apporte une fraîcheur modale dans l’improvisation jazz. Sa structure simplifiée de six notes facilite aussi le jeu rapide et l’ornementation subtile. L’hexatonique majeure incarne la tendance moderne à rechercher la pureté mélodique, en mettant l’accent sur la couleur globale plutôt que sur la tension-résolution traditionnelle.",
    culture: "Jazz moderne",
    category: "Modes additionnels"
  }
];
