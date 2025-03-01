// src/composables/progressions.ts

// Définition du type pour une progression d'accords
export type ChordProgression = {
  name: string;
  numerals: string;
  description: string;
  compatibleModes: string[];
  examples?: string[]; // Exemples optionnels de morceaux utilisant cette progression
};

// Liste des progressions d'accords communes à exporter
export const chordProgressions: ChordProgression[] = [
  // Progressions originales
  {
    name: "Cadence parfaite",
    numerals: "V-I",
    description: "La cadence la plus forte et conclusive en musique occidentale, créant un fort sentiment de résolution.",
    compatibleModes: ["Majeur", "Mineur harmonique", "Mineur mélodique"],
    examples: ["Fin de nombreux hymnes et chansons classiques"]
  },
  {
    name: "Cadence plagale (Amen)",
    numerals: "IV-I",
    description: "Souvent appelée 'cadence d'église' ou 'amen', moins conclusive que la cadence parfaite mais toujours résolutive.",
    compatibleModes: ["Majeur", "Mineur", "Lydien", "Mixolydien"],
    examples: ["Fin de nombreux hymnes religieux", "Hey Jude (The Beatles) - 'na na na' final"]
  },
  {
    name: "Cadence rompue",
    numerals: "V-vi",
    description: "Crée une résolution inattendue, souvent utilisée pour prolonger une phrase musicale.",
    compatibleModes: ["Majeur", "Mineur harmonique"],
    examples: ["Prélude en Do Majeur (Bach)"]
  },
  {
    name: "Cadence demi-close",
    numerals: "I-V",
    description: "Crée une tension qui demande résolution, souvent utilisée au milieu d'une phrase.",
    compatibleModes: ["Majeur", "Mineur", "Mixolydien"],
  },
  {
    name: "Progression I-IV-V",
    numerals: "I-IV-V",
    description: "Fondement de la musique occidentale, particulièrement dans le blues, rock et folk.",
    compatibleModes: ["Majeur", "Mixolydien"],
    examples: ["La Bamba", "Twist and Shout", "Wild Thing"]
  },
  {
    name: "Progression I-V-vi-IV",
    numerals: "I-V-vi-IV",
    description: "Progression pop très populaire connue pour son caractère optimiste et épique.",
    compatibleModes: ["Majeur"],
    examples: ["Let It Be (The Beatles)", "No Woman No Cry (Bob Marley)", "With or Without You (U2)"]
  },
  {
    name: "Progression vi-IV-I-V",
    numerals: "vi-IV-I-V",
    description: "Variante de la progression pop I-V-vi-IV, plus mélancolique au début.",
    compatibleModes: ["Majeur"],
    examples: ["Zombie (The Cranberries)", "Africa (Toto)"]
  },
  {
    name: "12-Bar Blues",
    numerals: "I-I-I-I-IV-IV-I-I-V-IV-I-V",
    description: "Structure de base du blues, généralement jouée avec des accords de septième.",
    compatibleModes: ["Majeur", "Mixolydien", "Blues"],
    examples: ["Sweet Home Chicago", "Johnny B. Goode", "Hound Dog"]
  },
  {
    name: "Anatole",
    numerals: "I-vi-ii-V",
    description: "Progression de jazz typique, base de nombreux standards.",
    compatibleModes: ["Majeur"],
    examples: ["Rhythm Changes", "I Got Rhythm (Gershwin)"]
  },
  {
    name: "Canon de Pachelbel",
    numerals: "I-V-vi-iii-IV-I-IV-V",
    description: "Progression baroque célèbre, très utilisée dans la musique pop contemporaine.",
    compatibleModes: ["Majeur"],
    examples: ["Canon en Ré (Pachelbel)", "Basket Case (Green Day)", "Let It Be (Beatles)"]
  },
  {
    name: "La Monte des Quintes",
    numerals: "vi-ii-V-I",
    description: "Progression suivant le cycle des quintes, fondamentale en jazz.",
    compatibleModes: ["Majeur", "Mineur"],
    examples: ["Autumn Leaves", "Fly Me to the Moon"]
  },
  {
    name: "Andalouse (phrygienne)",
    numerals: "iv-III-II-I",
    description: "Progression caractéristique de la musique espagnole et flamenco.",
    compatibleModes: ["Phrygien", "Phrygien dominant", "Mineur"],
    examples: ["Flamenco traditionnel", "Malaguena"]
  },
  {
    name: "ii-V-I",
    numerals: "ii-V-I",
    description: "La progression de jazz par excellence, pilier de l'harmonie jazz.",
    compatibleModes: ["Majeur", "Mineur"],
    examples: ["Autumn Leaves", "All The Things You Are"]
  },
  {
    name: "Turnaround",
    numerals: "I-vi-ii-V",
    description: "Fin de section typique dans le jazz, ramenant à la tonique.",
    compatibleModes: ["Majeur"],
    examples: ["The Girl From Ipanema", "Nombreux standards de jazz"]
  },
  {
    name: "Doo-Wop",
    numerals: "I-vi-IV-V",
    description: "Base du rock'n'roll des années 50 et doo-wop.",
    compatibleModes: ["Majeur"],
    examples: ["Stand By Me (Ben E. King)", "Earth Angel", "In the Still of the Night"]
  },
  {
    name: "Passamezzo antico",
    numerals: "i-VII-i-V-III-VII-i-V",
    description: "Progression de la Renaissance, base de nombreuses variations.",
    compatibleModes: ["Mineur", "Dorien"],
    examples: ["Greensleeves (version traditionnelle)"]
  },
  {
    name: "Progression modale I-bVII-I",
    numerals: "I-bVII-I",
    description: "Progression caractéristique de la musique modale rock et folk.",
    compatibleModes: ["Mixolydien"],
    examples: ["Sweet Home Alabama (Lynyrd Skynyrd)", "Sympathy for the Devil (Rolling Stones)"]
  },
  {
    name: "Vamp mineur",
    numerals: "i-bVII",
    description: "Progression simple créant une tension harmonique en mineur.",
    compatibleModes: ["Mineur", "Dorien", "Éolien"],
    examples: ["Chameleon (Herbie Hancock)", "Evil Ways (Santana)"]
  },
  {
    name: "Progression Creep",
    numerals: "I-III-IV-iv",
    description: "Progression rendue célèbre par Radiohead, mélangeant majeur et mineur.",
    compatibleModes: ["Majeur"],
    examples: ["Creep (Radiohead)", "My Iron Lung (Radiohead)"]
  },
  {
    name: "Progression de power ballad",
    numerals: "I-V-vi-IV-I-V-iii-IV",
    description: "Une variante étendue de la progression populaire, typique des power ballads rock.",
    compatibleModes: ["Majeur"],
    examples: ["November Rain (Guns N' Roses)", "Forever Young (Alphaville)"]
  },
  {
    name: "Progression Soul",
    numerals: "ii-V-I-vi",
    description: "Une variante de ii-V-I avec une touche soul/R&B par l'ajout du vi.",
    compatibleModes: ["Majeur"],
    examples: ["Ain't No Mountain High Enough", "Stand By Me"]
  },
  {
    name: "Progression Grunge",
    numerals: "I-IV-iii-vi",
    description: "Progression descendante caractéristique du grunge et rock alternatif.",
    compatibleModes: ["Majeur"],
    examples: ["Smells Like Teen Spirit (Nirvana)", "Black Hole Sun (Soundgarden)"]
  },
  {
    name: "La Folia",
    numerals: "i-V-i-VII-III-VII-i-V",
    description: "Une des plus anciennes progressions documentées, utilisée depuis le 15ème siècle.",
    compatibleModes: ["Mineur"],
    examples: ["La Folia (Corelli)", "Variations sur La Folia (Vivaldi)"]
  },
  
  // 80 NOUVELLES PROGRESSIONS
  
  // Progressions de jazz
  {
    name: "ii-V-I mineur",
    numerals: "iiø-V7b9-i",
    description: "Version mineure de la célèbre progression ii-V-I, fondamentale en jazz.",
    compatibleModes: ["Mineur mélodique", "Mineur harmonique"],
    examples: ["Blue Bossa", "Autumn Leaves (section mineure)"]
  },
  {
    name: "Coltrane Changes",
    numerals: "I-bIII7-bVI7-I",
    description: "Progression par tierces majeures rendue célèbre par John Coltrane, créant un sentiment de suspension harmonique.",
    compatibleModes: ["Majeur", "Mineur mélodique"],
    examples: ["Giant Steps", "Countdown"]
  },
  {
    name: "Bird Blues",
    numerals: "I7-IV7-#IVdim7-I7-#Idim7-ii7-V7",
    description: "Variation bebop du blues traditionnel avec substitutions chromatiques.",
    compatibleModes: ["Mixolydien", "Blues"],
    examples: ["Blues for Alice (Charlie Parker)", "Confirmation"]
  },
  {
    name: "Montgomery Changes",
    numerals: "Imaj7-Imaj7-iim7-V7-iiim7-VI7-iim7-V7",
    description: "Structure harmonique utilisée par Wes Montgomery, enrichissant le ii-V-I avec des accords de passage.",
    compatibleModes: ["Majeur"],
    examples: ["Four on Six", "West Coast Blues"]
  },
  {
    name: "Satin Doll",
    numerals: "ii7-V7-iii7-VI7-ii7-V7-I6",
    description: "Progression avec deux ii-V consécutifs menant à la tonique, typique du jazz des années 50.",
    compatibleModes: ["Majeur"],
    examples: ["Satin Doll (Duke Ellington)", "Take the 'A' Train"]
  },
  {
    name: "Bossa Nova",
    numerals: "I6/9-ii7b5-V7b9-Imaj7",
    description: "Progression caractéristique de la bossa nova brésilienne, avec tension et résolution subtiles.",
    compatibleModes: ["Majeur", "Lydien"],
    examples: ["The Girl From Ipanema", "Desafinado"]
  },
  {
    name: "Rhythm Changes Bridge",
    numerals: "III7-VI7-II7-V7",
    description: "Section B du Rhythm Changes, créant un contraste harmonique fort avec la section A.",
    compatibleModes: ["Majeur"],
    examples: ["I Got Rhythm (section B)", "Oleo (section B)"]
  },
  {
    name: "So What Modal",
    numerals: "i7-i7-i7-i7-ii7-ii7-i7-i7",
    description: "Progression modale minimaliste popularisée par Miles Davis, basée sur deux accords seulement.",
    compatibleModes: ["Dorien"],
    examples: ["So What (Miles Davis)", "Impressions (John Coltrane)"]
  },
  {
    name: "All Blues",
    numerals: "I7-I7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-I7",
    description: "Progression de blues en 6/8 avec un sentiment de flottement harmonique caractéristique.",
    compatibleModes: ["Mixolydien", "Blues"],
    examples: ["All Blues (Miles Davis)"]
  },
  {
    name: "Minor Plagal Cascade",
    numerals: "i-VII-VI-iv-V",
    description: "Progression descendante avec une touche mineure plagale créant une tension graduelle.",
    compatibleModes: ["Mineur", "Dorien"],
    examples: ["Mad World", "Space Oddity (David Bowie)"]
  },
  
  // Progressions rock et pop modernes
  {
    name: "Shuttle",
    numerals: "I-V-I-IV",
    description: "Progression en va-et-vient entre I et V puis I et IV, créant un sentiment d'ouverture et d'espace.",
    compatibleModes: ["Majeur", "Mixolydien"],
    examples: ["Where the Streets Have No Name (U2)", "Beautiful Day"]
  },
  {
    name: "Circle of Life",
    numerals: "I-V-vi-iii-IV-I-IV-V",
    description: "Variante du Canon de Pachelbel, plus populaire dans la pop et le rock des années 2000.",
    compatibleModes: ["Majeur"],
    examples: ["Circle of Life (Lion King)", "Can You Feel the Love Tonight"]
  },
  {
    name: "Elevator",
    numerals: "vi-IV-V-I-vi-IV-V-V",
    description: "Progression ascendante qui semble monter continuellement, créant un sentiment d'élévation.",
    compatibleModes: ["Majeur"],
    examples: ["Love Story (Taylor Swift)", "A Thousand Miles"]
  },
  {
    name: "Royal Road",
    numerals: "I-V-bVII-IV",
    description: "Progression rock avec une touche mixolydienne, apportant une sensation de grandeur.",
    compatibleModes: ["Mixolydien"],
    examples: ["Stairway to Heaven (section finale)", "All Along the Watchtower"]
  },
  {
    name: "Wondering",
    numerals: "vi-V-IV-V",
    description: "Progression cyclique avec un sentiment d'interrogation ou de recherche.",
    compatibleModes: ["Majeur"],
    examples: ["Zombie (The Cranberries, couplet)", "Boulevard of Broken Dreams"]
  },
  {
    name: "Nostalgic",
    numerals: "I-iii-IV-iv",
    description: "Progression avec un accord mineur emprunt, créant un sentiment de mélancolie et de nostalgie.",
    compatibleModes: ["Majeur"],
    examples: ["Space Oddity (David Bowie, couplet)", "Someone Like You (Adele)"]
  },
  {
    name: "Retro Pop",
    numerals: "I-vi-ii-V-I-vi-ii-V",
    description: "Progression classique des années 50-60, avec un sentiment de danse légère.",
    compatibleModes: ["Majeur"],
    examples: ["Duke of Earl", "Lollipop", "Stand By Me"]
  },
  {
    name: "Dream Pop",
    numerals: "IV-V-vi-I",
    description: "Progression utilisée dans la pop onirique et le shoegaze, créant une atmosphère brumeuse.",
    compatibleModes: ["Majeur"],
    examples: ["Dreams (The Cranberries)", "1979 (Smashing Pumpkins)"]
  },
  {
    name: "Indie Pop",
    numerals: "vi-IV-I-V-vi-IV-I-V",
    description: "Progression mélancolique mais lumineuse, populaire dans l'indie pop des années 2000.",
    compatibleModes: ["Majeur"],
    examples: ["Viva la Vida (Coldplay)", "Pompeii (Bastille)"]
  },
  {
    name: "EDM Drop",
    numerals: "vi-V-IV-I-vi-V-IV-I",
    description: "Progression typique des drops d'EDM, créant une sensation d'euphorie et d'énergie.",
    compatibleModes: ["Majeur"],
    examples: ["Levels (Avicii)", "Don't You Worry Child (Swedish House Mafia)"]
  },
  
  // Progressions metal et rock progressif
  {
    name: "Power Metal",
    numerals: "i-III-VII-i-VI-VII",
    description: "Progression mineure avec des mouvements épiques, typique du metal mélodique.",
    compatibleModes: ["Mineur harmonique", "Mineur éolien"],
    examples: ["The Bard's Song (Blind Guardian)", "Master of Puppets (couplet)"]
  },
  {
    name: "Prog Metal",
    numerals: "i-bII-bIII-bVII",
    description: "Progression utilisant des mouvements inhabituels et des modes altérés, typique du metal progressif.",
    compatibleModes: ["Phrygien", "Locrien"],
    examples: ["Schism (Tool)", "Lateralus (sections)"]
  },
  {
    name: "Death Metal",
    numerals: "i-bII-bVI-bVII",
    description: "Progression sombre avec des mouvements de triton, créant une ambiance menaçante.",
    compatibleModes: ["Locrien", "Phrygien"],
    examples: ["Hammer Smashed Face (Cannibal Corpse)", "Chapel of Ghouls"]
  },
  {
    name: "Djent",
    numerals: "i-bVI-bVII-i-i-IV-bV-bVI",
    description: "Progression polymétriques avec des changements brusques, typique du djent et du metal moderne.",
    compatibleModes: ["Phrygien", "Locrien", "Mineur éolien"],
    examples: ["Bleed (Meshuggah)", "Icarus Lives (Periphery)"]
  },
  {
    name: "Symphonic Metal",
    numerals: "i-VI-III-VII",
    description: "Progression mineur-majeur avec un sentiment grandiloquent et théâtral.",
    compatibleModes: ["Mineur harmonique"],
    examples: ["Wishmaster (Nightwish)", "Ghost Love Score"]
  },
  {
    name: "Rock Progressif",
    numerals: "I-II-IV-I-VI-II-bIII-IV",
    description: "Progression utilisant des modulations et des changements de centre tonal, typique du rock progressif.",
    compatibleModes: ["Majeur", "Lydien"],
    examples: ["Roundabout (Yes)", "Close to the Edge (sections)"]
  },
  {
    name: "Math Rock",
    numerals: "i-III-bVI-V-i-VII-III-I",
    description: "Progression asymétrique avec des changements de métrique, typique du math rock.",
    compatibleModes: ["Dorien", "Mineur mélodique"],
    examples: ["Never Meant (American Football)", "Toe (Goodbye)"]
  },
  {
    name: "Stoner Rock",
    numerals: "I-bIII-bVII-IV",
    description: "Progression lourde et hypnotique, typique du stoner et doom metal.",
    compatibleModes: ["Dorien", "Mixolydien"],
    examples: ["Black Sabbath (Black Sabbath)", "Dragonaut (Sleep)"]
  },
  {
    name: "Doom Metal",
    numerals: "i-bVI-bIII-bVII",
    description: "Progression lente et pesante, créant une atmosphère apocalyptique.",
    compatibleModes: ["Phrygien", "Éolien"],
    examples: ["Funeralopolis (Electric Wizard)", "Dopethrone"]
  },
  {
    name: "New Wave Metal",
    numerals: "VI-VII-i-III-VI-VII-i-V",
    description: "Progression alternant majeur et mineur, typique du metal alternatif des années 2000.",
    compatibleModes: ["Mineur éolien"],
    examples: ["Toxicity (System of a Down)", "Chop Suey!"]
  },
  
  // Progressions électroniques et dance
  {
    name: "House Classic",
    numerals: "I-vi-IV-V-I-vi-IV-V",
    description: "Progression house classique avec une touche disco, créant une sensation de dance euphorique.",
    compatibleModes: ["Majeur"],
    examples: ["Around the World (Daft Punk)", "Music Sounds Better With You"]
  },
  {
    name: "Trance Uplifting",
    numerals: "vi-IV-I-V-vi-IV-I-V",
    description: "Progression trance avec une sensation d'élévation et d'euphorie.",
    compatibleModes: ["Majeur"],
    examples: ["Adagio for Strings (Tiësto remix)", "Silence (Delerium ft. Sarah McLachlan)"]
  },
  {
    name: "Techno Hypnotic",
    numerals: "i-VII-VI-v-i-VII-VI-v",
    description: "Progression mineure hypnotique et répétitive, typique de la techno underground.",
    compatibleModes: ["Phrygien", "Éolien"],
    examples: ["Spastik (Plastikman)", "Strings of Life (Rhythim Is Rhythim)"]
  },
  {
    name: "Ambient Flow",
    numerals: "I-iii-vi-IV-I-iii-vi-IV",
    description: "Progression lente et planante, créant une atmosphère méditative et spatiale.",
    compatibleModes: ["Majeur", "Ionien"],
    examples: ["Ambient 1: Music for Airports (Brian Eno)", "Substrata (Biosphere)"]
  },
  {
    name: "Drum & Bass",
    numerals: "i-VI-VII-v-i-VI-VII-III",
    description: "Progression énergique avec des changements rapides, adaptée aux breakbeats rapides.",
    compatibleModes: ["Dorien", "Éolien"],
    examples: ["Watercolour (Pendulum)", "Inner City Life (Goldie)"]
  },
  {
    name: "Synthwave",
    numerals: "I-V-vi-IV-I-V-vi-vi",
    description: "Progression nostalgique des années 80, avec un sentiment de conduite nocturne.",
    compatibleModes: ["Majeur"],
    examples: ["Nightcall (Kavinsky)", "Endless Summer (The Midnight)"]
  },
  {
    name: "Future Bass",
    numerals: "vi-V-IV-V-vi-V-iii-IV",
    description: "Progression émotionnelle avec des résolutions surprenantes, typique de la future bass.",
    compatibleModes: ["Majeur"],
    examples: ["Shelter (Porter Robinson)", "Faded (Alan Walker)"]
  },
  {
    name: "Lo-Fi Hip Hop",
    numerals: "Imaj7-vi7-IV7-V7",
    description: "Progression jazz-hop relaxante avec des extensions de septième, typique du lo-fi.",
    compatibleModes: ["Majeur", "Lydien"],
    examples: ["Lofi Girl stream", "Nujabes productions"]
  },
  {
    name: "Dubstep",
    numerals: "i-VI-III-VII-i-VI-III-v",
    description: "Progression mineure avec des tensions harmoniques avant les drops.",
    compatibleModes: ["Éolien", "Phrygien"],
    examples: ["Scary Monsters and Nice Sprites (Skrillex)", "I Can't Stop (Flux Pavilion)"]
  },
  {
    name: "Vaporwave",
    numerals: "I6-IV6-V6-I6",
    description: "Progression simple avec des accords sixte, ralentie et déformée dans le style vaporwave.",
    compatibleModes: ["Majeur"],
    examples: ["リサフランク420 / 現代のコンピュー (Macintosh Plus)", "TOGETHER (Saint Pepsi)"]
  },
  
  // Progressions rock classique et blues
  {
    name: "Blues Shuffle",
    numerals: "I7-I7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-I7",
    description: "Progression blues en 12 mesures avec un rythme de shuffle, fondamentale du blues et du rock.",
    compatibleModes: ["Mixolydien", "Blues"],
    examples: ["Pride and Joy (Stevie Ray Vaughan)", "Sweet Home Chicago"]
  },
  {
    name: "Hard Rock",
    numerals: "I-bIII-IV-I-bIII-bVI-bVII",
    description: "Progression rock avec des emprunts modaux, créant une sensation de puissance et d'énergie.",
    compatibleModes: ["Mixolydien", "Dorien"],
    examples: ["Smoke on the Water (Deep Purple)", "Iron Man (Black Sabbath)"]
  },
  {
    name: "Classic Rock Ballad",
    numerals: "I-V-vi-iii-IV-I-IV-V",
    description: "Progression étendue pour ballade rock, créant une sensation émotionnelle et narrative.",
    compatibleModes: ["Majeur"],
    examples: ["Dream On (Aerosmith)", "Stairway to Heaven (début)"]
  },
  {
    name: "Southern Rock",
    numerals: "I-bVII-IV-I-I-bVII-IV-IV",
    description: "Progression rock du sud avec des influences country et blues.",
    compatibleModes: ["Mixolydien"],
    examples: ["Sweet Home Alabama", "Free Bird (Lynyrd Skynyrd)"]
  },
  {
    name: "Shuffle Rock",
    numerals: "I-IV-V-IV-I-IV-V-V",
    description: "Progression rock avec un rythme de shuffle, créant un sentiment de danse et de mouvement.",
    compatibleModes: ["Majeur", "Mixolydien"],
    examples: ["Johnny B. Goode (Chuck Berry)", "You Never Can Tell"]
  },
  {
    name: "Texas Blues",
    numerals: "I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7",
    description: "Variante du blues en 12 mesures avec des accentuations différentes, typique du Texas blues.",
    compatibleModes: ["Mixolydien", "Blues"],
    examples: ["Texas Flood (Stevie Ray Vaughan)", "Cold Shot"]
  },
  {
    name: "Rock'n'Roll 50s",
    numerals: "I-IV-I-V-IV-I-V",
    description: "Progression rock'n'roll classique des années 50, avec un sentiment de danse et d'énergie.",
    compatibleModes: ["Majeur"],
    examples: ["Rock Around the Clock", "Jailhouse Rock (Elvis Presley)"]
  },
  {
    name: "Boogie Woogie",
    numerals: "I-I-I-I-IV-IV-I-I-V-IV-I-I",
    description: "Progression blues avec un rythme de boogie woogie, typique du piano blues.",
    compatibleModes: ["Mixolydien", "Blues"],
    examples: ["Boogie Woogie Bugle Boy", "Pine Top's Boogie Woogie"]
  },
  {
    name: "Slow Blues",
    numerals: "I7-IV7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7",
    description: "Blues à 12 mesures joué lentement avec beaucoup d'expressivité.",
    compatibleModes: ["Blues"],
    examples: ["Red House (Jimi Hendrix)", "The Thrill Is Gone (B.B. King)"]
  },
  {
    name: "British Invasion",
    numerals: "I-vi-IV-V-I-vi-IV-V",
    description: "Progression typique des groupes britanniques des années 60, avec un son pop-rock légèrement bluesy.",
    compatibleModes: ["Majeur"],
    examples: ["I Want to Hold Your Hand (Beatles)", "You Really Got Me (The Kinks)"]
  },
  
  // Progressions folk et country
  {
    name: "Folk Ballad",
    numerals: "I-vi-IV-V-I-vi-IV-V",
    description: "Progression folk classique pour ballades narratives.",
    compatibleModes: ["Majeur"],
    examples: ["Blowin' in the Wind (Bob Dylan)", "The Times They Are a-Changin'"]
  },
  {
    name: "Country Roadhouse",
    numerals: "I-IV-V-I-IV-V-IV-I",
    description: "Progression country typique avec un sentiment de route et d'espace ouvert.",
    compatibleModes: ["Majeur"],
    examples: ["Take Me Home, Country Roads (John Denver)", "On the Road Again"]
  },
  {
    name: "Nashville",
    numerals: "I-I-IV-IV-I-I-V-IV-I-I",
    description: "Variante country de la progression blues, avec un sentiment plus lumineux.",
    compatibleModes: ["Majeur"],
    examples: ["Folsom Prison Blues (Johnny Cash)", "Your Cheatin' Heart"]
  },
  {
    name: "Celtic Folk",
    numerals: "I-V-vi-IV-I-V-vi-vi",
    description: "Progression folk avec une touche celtique, créant un sentiment mélancolique mais lumineux.",
    compatibleModes: ["Majeur", "Mixolydien"],
    examples: ["Wild Mountain Thyme", "Danny Boy"]
  },
  {
    name: "Bluegrass Breakdown",
    numerals: "I-IV-I-V-I-IV-I-V-I",
    description: "Progression rapide utilisée dans le bluegrass, particulièrement pour les sections instrumentales.",
    compatibleModes: ["Majeur"],
    examples: ["Foggy Mountain Breakdown", "Orange Blossom Special"]
  },
  {
    name: "Appalachian Modal",
    numerals: "I-VII-I-VII",
    description: "Progression modale simple utilisée dans la musique folk des Appalaches.",
    compatibleModes: ["Mixolydien", "Dorien"],
    examples: ["Man of Constant Sorrow", "Shady Grove"]
  },
  {
    name: "Irish Jig",
    numerals: "I-IV-I-V-I-IV-I-V",
    description: "Progression énergique typique des gigues irlandaises en 6/8.",
    compatibleModes: ["Majeur", "Mixolydien"],
    examples: ["The Irish Washerwoman", "Drowsy Maggie"]
  },
  {
    name: "Old-Time Mountain",
    numerals: "I-IV-V-IV",
    description: "Progression circulaire simple utilisée dans la musique traditionnelle américaine.",
    compatibleModes: ["Majeur", "Mixolydien"],
    examples: ["Will the Circle Be Unbroken", "I'll Fly Away"]
  },
  {
    name: "Gospel Turnaround",
    numerals: "I-I7-IV-iv-I-V7-I",
    description: "Progression gospel avec un mouvement chromatique iv, créant une résolution émotionnelle.",
    compatibleModes: ["Majeur"],
    examples: ["Amazing Grace (certaines versions)", "This Little Light of Mine"]
  },
  
  // Progressions latines et mondiales
  {
    name: "Bossa Nova II",
    numerals: "i-VII-III-VI-ii°-V7b9",
    description: "Progression bossa nova en mineur avec une tension harmonique sophistiquée.",
    compatibleModes: ["Mineur", "Mineur harmonique"],
    examples: ["Black Orpheus (Manha de Carnaval)", "How Insensitive"]
  },
  {
    name: "Son Montuno",
    numerals: "I-IV-V-IV",
    description: "Progression simple mais efficace utilisée dans la salsa et la musique cubaine.",
    compatibleModes: ["Majeur"],
    examples: ["Guantanamera", "Son de la Loma"]
  },
  {
    name: "Rumba Flamenca",
    numerals: "i-VII-VI-V",
    description: "Progression descendante typique du flamenco espagnol et de la rumba gitane.",
    compatibleModes: ["Phrygien", "Phrygien dominant"],
    examples: ["Entre Dos Aguas (Paco de Lucía)", "Bamboléo (Gipsy Kings)"]
  },
  {
    name: "Tango Argentina",
    numerals: "i-iv-V7-i",
    description: "Progression du tango argentin classique, avec une tension dramatique.",
    compatibleModes: ["Mineur harmonique"],
    examples: ["La Cumparsita", "Por una Cabeza"]
  },
  {
    name: "Raga Rock",
    numerals: "I5-bVII5-IV5-I5",
    description: "Progression rock avec une influence indienne, utilisant souvent des drones et des accords suspendus.",
    compatibleModes: ["Mixolydien"],
    examples: ["Within You Without You (Beatles)", "Kashmir (Led Zeppelin)"]
  },
  {
    name: "Reggae Roots",
    numerals: "I-V-vi-IV-I-V-vi-IV",
    description: "Progression reggae classique avec accent sur les temps faibles.",
    compatibleModes: ["Majeur"],
    examples: ["Three Little Birds (Bob Marley)", "Could You Be Loved"]
  },
  {
    name: "Afrobeat",
    numerals: "I-IV-I-V-I-IV-I-V",
    description: "Progression cyclique utilisée dans l'afrobeat, joué avec des rythmiques complexes.",
    compatibleModes: ["Mixolydien", "Majeur"],
    examples: ["Water No Get Enemy (Fela Kuti)", "Lady"]
  },
  {
    name: "Middle Eastern",
    numerals: "i-bII-i-bVII",
    description: "Progression avec une seconde mineure, créant une tension caractéristique de la musique moyen-orientale.",
    compatibleModes: ["Phrygien", "Hijaz"],
    examples: ["Misirlou", "Hava Nagila (versions modernes)"]
  },
  {
    name: "Chacarera",
    numerals: "i-III-VII-V",
    description: "Progression folklorique argentine en 6/8 avec un sentiment de danse.",
    compatibleModes: ["Mineur", "Dorien"],
    examples: ["La Chacarera (traditionnelle)", "El Olvidao"]
  },
  {
    name: "Highlife",
    numerals: "I-IV-I-V-vi-IV-I-V",
    description: "Progression africaine joyeuse, base de nombreux styles ouest-africains.",
    compatibleModes: ["Majeur"],
    examples: ["Sweet Mother (Prince Nico Mbarga)", "Joromi (Sir Victor Uwaifo)"]
  },
  
  // Progressions classiques et modernes
  {
    name: "Romanesca",
    numerals: "I-V-vi-iii-IV-I-IV-V",
    description: "Progression baroque ancienne, ancêtre du Canon de Pachelbel.",
    compatibleModes: ["Majeur"],
    examples: ["Greensleeves (version majeure)", "Ground bass baroque"]
  },
  {
    name: "Passamezzo Moderno",
    numerals: "I-IV-I-V-I-IV-I-V",
    description: "Progression de la Renaissance en majeur, base de nombreuses danses de cour.",
    compatibleModes: ["Majeur"],
    examples: ["Danses de la Renaissance", "Queen Elizabeth's Galliard"]
  },
  {
    name: "Chaconne",
    numerals: "i-VII-VI-V",
    description: "Progression baroque descendante utilisée comme base d'ostinato et de variations.",
    compatibleModes: ["Mineur"],
    examples: ["Chaconne en Ré mineur (Bach)", "Dido's Lament (Purcell)"]
  },
  {
    name: "Lament Bass",
    numerals: "i-vii°-VI-V-iv-III-ii°-V",
    description: "Ligne de basse chromatique descendante exprimant la douleur et la lamentation.",
    compatibleModes: ["Mineur"],
    examples: ["When I Am Laid in Earth (Purcell)", "Crucifixus (Bach)"]
  },
  {
    name: "Impressionniste",
    numerals: "Imaj7-IVmaj7-bVIImaj7-IIImaj7",
    description: "Progression utilisant des accords majeur7 avec mouvements parallèles, évoquant l'impressionnisme.",
    compatibleModes: ["Majeur", "Lydien"],
    examples: ["Clair de Lune (Debussy)", "Gymnopédie No.1 (Satie)"]
  },
  {
    name: "Néo-romantique",
    numerals: "vi-iii-I-IV-vi-V-iii-I",
    description: "Progression avec des mouvements harmoniques évoquant le romantisme tardif et le post-romantisme.",
    compatibleModes: ["Majeur"],
    examples: ["Adagio for Strings (Barber)", "Theme from Schindler's List"]
  },
  {
    name: "Minimaliste",
    numerals: "I-V-vi-iii-I-V-vi-iii",
    description: "Progression répétitive avec des changements graduels, typique de la musique minimaliste.",
    compatibleModes: ["Majeur"],
    examples: ["Music for 18 Musicians (Steve Reich)", "Glassworks (Philip Glass)"]
  },
  {
    name: "Film Score Heroic",
    numerals: "I-V-vi-IV-I-V-bVI-bVII",
    description: "Progression épique utilisée dans les bandes originales de films, particulièrement pour les scènes héroïques.",
    compatibleModes: ["Majeur"],
    examples: ["Star Wars Main Theme", "Superman Theme"]
  },
  {
    name: "Film Noir",
    numerals: "i-VI7-ii°7-V7b9",
    description: "Progression jazz-influencée avec beaucoup de tension, évoquant les films noirs des années 40-50.",
    compatibleModes: ["Mineur", "Mineur harmonique"],
    examples: ["Chinatown (Jerry Goldsmith)", "Vertigo (Bernard Herrmann)"]
  },
  {
    name: "Modern Orchestral",
    numerals: "i-bVI-bIII-bVII",
    description: "Progression puissante et cinématique populaire dans les bandes originales contemporaines.",
    compatibleModes: ["Mineur éolien"],
    examples: ["The Dark Knight (Hans Zimmer)", "Inception"]
  },
  // 30 progressions jazz supplémentaires
  {
    name: "Minor Blues",
    numerals: "i7-iv7-i7-i7-iv7-iv7-i7-i7-V7-iv7-i7-V7",
    description: "Blues en mineur, offrant une couleur plus sombre et mélancolique que le blues traditionnel.",
    compatibleModes: ["Mineur éolien", "Dorien"],
    examples: ["Mr. PC (John Coltrane)", "Equinox (John Coltrane)"]
  },
  {
    name: "Jazz Waltz",
    numerals: "imaj7-vi7b5-II7-V7-imaj7-VI7-II7-V7",
    description: "Progression de jazz en 3/4 avec des harmonies riches et sophistiquées.",
    compatibleModes: ["Mineur mélodique"],
    examples: ["Someday My Prince Will Come", "Waltz for Debby (Bill Evans)"]
  },
  {
    name: "Honeysuckle Rose",
    numerals: "I6-I6-I7-I7-IV7-IV7-I7-I7-II7-V7-I6-V7",
    description: "Progression swing classique utilisée dans de nombreux standards des années 30-40.",
    compatibleModes: ["Majeur"],
    examples: ["Honeysuckle Rose (Fats Waller)", "Ain't Misbehavin'"]
  },
  {
    name: "Autumn Leaves",
    numerals: "i7-IV7-VII7-III7-VI7-II7-V7-i7",
    description: "Célèbre progression descendant par quintes, alternant entre relatif mineur et majeur.",
    compatibleModes: ["Mineur harmonique", "Mineur éolien"],
    examples: ["Autumn Leaves", "Tune Up (Miles Davis)"]
  },
  {
    name: "How High The Moon",
    numerals: "Imaj7-VIIm7-VIm7-Vm7-IVmaj7-iii7-vi7-II7-V7",
    description: "Progression descendante caractéristique du bebop avec des II-V secondaires.",
    compatibleModes: ["Majeur"],
    examples: ["How High The Moon", "Ornithology (Charlie Parker)"]
  },
  {
    name: "Rhythm Changes A",
    numerals: "I-VI7-ii7-V7-I-VI7-ii7-V7-iii7-VI7-ii7-V7-I-VI7-ii7-V7",
    description: "Section A du célèbre Rhythm Changes, un des piliers du bebop et du jazz moderne.",
    compatibleModes: ["Majeur"],
    examples: ["I Got Rhythm (section A)", "Oleo (Sonny Rollins)"]
  },
  {
    name: "New Orleans Jazz",
    numerals: "I7-IV7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7",
    description: "Blues traditionnel joué dans le style New Orleans avec des septièmes de dominante.",
    compatibleModes: ["Mixolydien", "Blues"],
    examples: ["Basin Street Blues", "When The Saints Go Marching In"]
  },
  {
    name: "Gypsy Jazz",
    numerals: "i6-V7b9-i6-VI7-ii°7-V7b9-i6-V7b9",
    description: "Progression mineure avec des dominantes altérées, caractéristique du jazz manouche.",
    compatibleModes: ["Mineur harmonique"],
    examples: ["Minor Swing (Django Reinhardt)", "Nuages"]
  },
  {
    name: "Modal Jazz (Dorian)",
    numerals: "i7-IV7-i7-IV7-i7-IV7-i7-IV7",
    description: "Progression modale simple utilisant le mode dorien, popularisée par Miles Davis et John Coltrane.",
    compatibleModes: ["Dorien"],
    examples: ["So What (Miles Davis)", "Impressions (John Coltrane)"]
  },
  {
    name: "Modal Jazz (Lydian)",
    numerals: "Imaj7-II7-Imaj7-II7-Imaj7-II7-Imaj7-II7",
    description: "Progression oscillant entre deux accords, exploitant les sonorités du mode lydien.",
    compatibleModes: ["Lydien"],
    examples: ["Maiden Voyage (Herbie Hancock)", "Flamenco Sketches (partie lydienne)"]
  },
  {
    name: "Jazz Fusion",
    numerals: "i9-IV9-VII9-III9-VI9-II9-V7alt-i9",
    description: "Progression jazz avec des accords étendus et des harmonies complexes, typique de la fusion.",
    compatibleModes: ["Mineur mélodique", "Dorien"],
    examples: ["Spain (Chick Corea)", "Birdland (Weather Report)"]
  },
  {
    name: "Cool Jazz",
    numerals: "Imaj7-iii7-IVmaj7-V7sus4-Imaj7-iii7-vi9-II7-V7",
    description: "Progression avec des accords suspendus et des extensions, typique du cool jazz des années 50.",
    compatibleModes: ["Majeur", "Lydien"],
    examples: ["Take Five (Dave Brubeck)", "My Funny Valentine (Chet Baker)"]
  },
  {
    name: "Hard Bop",
    numerals: "i7-iv7-i7-V7alt-i7-VI7alt-II7alt-V7alt",
    description: "Progression blues avec des altérations harmoniques, caractéristique du hard bop.",
    compatibleModes: ["Mineur dorien", "Mineur mélodique"],
    examples: ["Moanin' (Art Blakey)", "Moment's Notice (John Coltrane)"]
  },
  {
    name: "Jazz Ballad",
    numerals: "Imaj9-iii7-vi9-II7b9-IVmaj7-#iv°7-Imaj7/V-V7b9",
    description: "Progression lente avec des harmonies sophistiquées, idéale pour les ballades jazz.",
    compatibleModes: ["Majeur"],
    examples: ["Body and Soul", "In a Sentimental Mood (Duke Ellington)"]
  },
  {
    name: "Jazz Manouche",
    numerals: "i6-II7-V7-i6-VI7-II7-V7-i6",
    description: "Progression jazz manouche classique avec des dominantes secondaires.",
    compatibleModes: ["Mineur harmonique"],
    examples: ["Django's Tiger (Django Reinhardt)", "Dark Eyes (Les Yeux Noirs)"]
  },
  {
    name: "Be-Bop Fast",
    numerals: "Imaj7-VI7-ii7-V7-iii7-VI7-ii7-V7",
    description: "Progression bop rapide avec des changements harmoniques fréquents.",
    compatibleModes: ["Majeur"],
    examples: ["Cherokee (Ray Noble)", "Donna Lee (Charlie Parker)"]
  },
  {
    name: "Free Jazz Structure",
    numerals: "i11-bIImaj7-biii7-bVII7alt-i11-IV7sus4-bVI9-V7alt",
    description: "Progression explorant des relations harmoniques non conventionnelles, typique du free jazz.",
    compatibleModes: ["Mineur mélodique", "Altéré"],
    examples: ["Lonely Woman (Ornette Coleman)", "Spiritual (John Coltrane)"]
  },
  {
    name: "Chromatic Descent",
    numerals: "Imaj7-VII7-bVIImaj7-VI7-VImaj7-V7-Vmaj7-bV7",
    description: "Progression descendante chromatique, créant une tension grandissante.",
    compatibleModes: ["Chromatique", "Diminué"],
    examples: ["Giant Steps (transition)", "Countdown (John Coltrane)"]
  },
  {
    name: "Herbie Hancock",
    numerals: "i7-bIIImaj7-bVImaj7-IV7alt-i7-bIIImaj7-VII7sus4-bIII7",
    description: "Progression avec des mouvements harmoniques inhabituels et des sonorités modales.",
    compatibleModes: ["Mineur mélodique", "Dorien"],
    examples: ["Maiden Voyage", "Cantaloupe Island (Herbie Hancock)"]
  },
  {
    name: "Wayne Shorter",
    numerals: "imaj7-bVImaj7#11-Vsus4-bVII9-imaj7-bIIImaj7-V7alt-i6/9",
    description: "Progression avec des structures d'accords innovantes et des résolutions inattendues.",
    compatibleModes: ["Mineur mélodique", "Lydien augmenté"],
    examples: ["Footprints (Wayne Shorter)", "Speak No Evil"]
  },
  {
    name: "Miles Davis Modal",
    numerals: "i7-bVImaj7-i7-bVImaj7-bIIImaj7-bVIImaj7-i7-bVImaj7",
    description: "Progression utilisant des relations modales distantes, créant une atmosphère ouverte.",
    compatibleModes: ["Phrygien", "Dorien"],
    examples: ["Flamenco Sketches", "Blue in Green (Miles Davis)"]
  },
  {
    name: "Bill Evans",
    numerals: "Imaj7#11-bIIImaj7-bVImaj7#11-bVIImaj7-IVmaj7#11-bVImaj7-Imaj7/V-V7sus4",
    description: "Progression avec des harmonies impressionnistes et des accords majeur7 avec tensions.",
    compatibleModes: ["Lydien", "Majeur"],
    examples: ["Peace Piece (Bill Evans)", "Blue in Green (sections)"]
  },
  {
    name: "McCoy Tyner",
    numerals: "i7sus4-bIII7sus4-bVI7sus4-bVII7sus4-i7sus4-bVI7sus4-bVII7sus4-i7sus4",
    description: "Progression utilisant des accords sus4 et des mouvements de quartes, créant un son modal puissant.",
    compatibleModes: ["Dorien", "Pentatonique mineure"],
    examples: ["Passion Dance (McCoy Tyner)", "Resolution (John Coltrane)"]
  },
  {
    name: "Latin Jazz",
    numerals: "i6/9-bIIImaj7-IVm7-bVIImaj7-V7sus4-V7b9-i6/9",
    description: "Progression jazz avec des rythmiques latines et des tensions harmoniques sophistiquées.",
    compatibleModes: ["Mineur mélodique", "Dorien"],
    examples: ["Song for My Father (Horace Silver)", "Manteca (Dizzy Gillespie)"]
  },
  {
    name: "Jazz Funk",
    numerals: "i9-i9-bIIImaj9-bIIImaj9-IV13-IV13-i9-i9",
    description: "Progression funk avec des extensions d'accords jazz, typique du jazz-funk des années 70.",
    compatibleModes: ["Dorien"],
    examples: ["Chameleon (Herbie Hancock)", "Watermelon Man"]
  },
  {
    name: "Contemporary Jazz",
    numerals: "Imaj9#11-vi9-IVmaj7#11/V-iii11-vi9-II7sus4-Vsus4-V7alt",
    description: "Progression jazz moderne avec des superpositions d'accords et des tensions sophistiquées.",
    compatibleModes: ["Lydien", "Majeur"],
    examples: ["Windows (Chick Corea)", "Dolphin Dance (Herbie Hancock)"]
  },
  {
    name: "ECM Jazz",
    numerals: "Imaj7sus4-vi9-IVmaj7/V-bVIIadd9-Imaj7sus4-vi9-bIImaj7-V7sus4",
    description: "Progression atmosphérique avec des accords suspendus et des relations harmoniques ambiguës.",
    compatibleModes: ["Lydien", "Ionien"],
    examples: ["Vashkar (Carla Bley)", "As Falls Wichita (Pat Metheny)"]
  },
  {
    name: "Modal Interchange",
    numerals: "Imaj7-bVImaj7-IV9-iv9-Imaj7-bIIImaj7-ii7-V7sus4",
    description: "Progression utilisant des emprunts modaux, alternant entre modes parallèles majeur et mineur.",
    compatibleModes: ["Majeur", "Mineur mélodique"],
    examples: ["Nefertiti (Wayne Shorter)", "E.S.P. (Miles Davis)"]
  },
  {
    name: "Altered Dominants",
    numerals: "imaj7-VII7alt-VI7alt-V7alt-ivmaj7-bVII7alt-bIII7alt-bII7alt",
    description: "Progression utilisant des dominantes altérées descendantes, créant une forte tension harmonique.",
    compatibleModes: ["Altéré", "Diminué"],
    examples: ["Inner Urge (Joe Henderson)", "26-2 (John Coltrane)"]
  },
  {
    name: "Bitonal Jazz",
    numerals: "Imaj7/bIImaj7-bVIImaj7/Vmaj7-IVmaj7/bVmaj7-bIIImaj7/VImaj7",
    description: "Progression utilisant des superpositions bitonales d'accords, créant des textures harmoniques complexes.",
    compatibleModes: ["Polytonal", "Lydien augmenté"],
    examples: ["In a Silent Way (Miles Davis)", "Time Remembered (Bill Evans)"]
  }
];