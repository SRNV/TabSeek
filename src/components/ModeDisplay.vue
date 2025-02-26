<!-- ModeDisplay.vue avec la sélection de mode -->
<template>
    <div>
      <h3>Modes</h3>
      <div>
        <Tab
          v-if="currentMode"
          isScale
          :key="currentMode.name"
          :item="getItemForTab(currentMode)"
          :notes="getModeNotes(currentMode)"
          :tabLength="tabLength"
          :visibleStart="visibleStart"
          :visibleEnd="visibleEnd"
          @click="selectMode(currentMode)"
        />
      </div>
    </div>
  </template>
    
  <script lang="ts" setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { useMainStore } from '../stores';
  import { Note } from 'tonal';
  import Tab from './Tab.vue';
  import { EXTRA_MODES } from '../composables/extraModes';
  import type { ModeGuitar } from '../types';
    
  const store = useMainStore();
    
  const tabLength = 24;
  const visibleStart = 0;
  const visibleEnd = 10;
    
  const modes = ref<ModeGuitar[]>([]);
  const currentMode = ref<ModeGuitar | null>(null);
  
  // Liste des modes principaux avec l'interface ModeGuitar
  const MAIN_MODES: ModeGuitar[] = [
    {
      name: "ionian",
      aliases: ["major", "M"],
      modeNum: 0,
      mode: 0,
      intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
      alt: [],
      triad: "major",
      seventh: "maj7",
      description: "Le mode ionien est la gamme majeure traditionnelle, caractérisé par sa sonorité lumineuse et équilibrée. Il exprime la joie, la stabilité et l'affirmation, formant la base de la musique occidentale classique et populaire. Sa structure d'intervalles crée une résolution harmonique naturelle qui procure un sentiment de complétude. Omniprésent dans les hymnes, chansons enfantines et compositions classiques, il est idéal pour transmettre des émotions positives et claires. Cette tonalité majeure constitue le point de référence pour tous les autres modes diatoniques.",
      culture: "Occidentale classique"
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
      description: "Le mode dorien, avec sa sixte majeure distinctive, crée un équilibre unique entre mélancolie et optimisme. Il exprime la contemplation, la nostalgie teintée d'espoir, et une profondeur émotionnelle sans tomber dans le dramatique. Prisé dans le jazz modal, le folk et la musique celtique, ce mode offre une palette expressive riche et nuancée. Sa sonorité reconnaissable traverse les époques, de la musique médiévale aux morceaux emblématiques comme 'So What' de Miles Davis. Le dorien constitue un outil puissant pour l'improvisation et la composition, évoquant une mélancolie qui n'est jamais désespérée.",
      culture: "Celtique & Jazz modal"
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
      description: "Le mode phrygien se distingue immédiatement par sa seconde mineure qui génère une tension caractéristique et une couleur orientale. Il évoque le mystère, l'intensité et parfois la menace, créant une atmosphère dramatique et exotique. Pilier du flamenco et de la musique andalouse, il imprègne de nombreuses compositions méditerranéennes et moyen-orientales. Sa structure crée une forte tension vers la tonique, produisant un sentiment d'urgence ou d'inévitabilité. Le phrygien est particulièrement efficace dans le metal, la musique électronique et les compositions cherchant à créer une ambiance sombre et énigmatique.",
      culture: "Espagnole & Moyen-orientale"
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
      description: "Le mode lydien, avec sa caractéristique quarte augmentée, crée une atmosphère aérienne, flottante et onirique. Il évoque l'émerveillement, le mystère et l'ouverture, transportant l'auditeur vers des territoires imaginaires et surréels. Fréquemment utilisé dans les musiques de films de science-fiction et fantasy, il colore les œuvres d'une qualité éthérée et transcendante. Le triton entre la tonique et la quarte lui confère cette sonorité distinctive qui semble défier la gravité. Favori des compositeurs impressionnistes comme Debussy et de jazzmen comme Bill Evans, le lydien invite à l'exploration harmonique et à l'élévation spirituelle.",
      culture: "Impressionnisme & Cinéma"
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
      description: "Le mode mixolydien, essentiellement une gamme majeure avec septième mineure, offre un équilibre parfait entre énergie majeure et tension subtile. Il exprime la vitalité, l'affirmation teintée de blues, et une joie qui n'est jamais complètement résolue. Omniprésent dans le rock, le blues et la musique celtique, il forme le fondement de nombreux riffs emblématiques comme ceux de 'Sweet Home Alabama'. Sa structure crée naturellement un mouvement vers le quatrième degré, expliquant sa présence dans d'innombrables progressions I-bVII-IV. Le mixolydien est l'outil idéal pour l'improvisation sur des accords dominants, offrant une transition naturelle entre les univers majeurs et mineurs.",
      culture: "Rock & Blues"
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
      description: "Le mode éolien, ou gamme mineure naturelle, est fondamental pour exprimer la mélancolie, l'introspection et la profondeur émotionnelle. Il évoque la nostalgie, le drame intérieur et parfois la tristesse, avec une qualité inachevée qui invite à la contemplation. Omniprésent dans le répertoire romantique classique, le rock alternatif et les ballades émotionnelles, il permet d'explorer les émotions complexes et nuancées. Sa structure avec tierces, sixtes et septièmes mineures crée cette sonorité immédiatement reconnaissable qui touche les cordes sensibles de l'âme. L'éolien possède une versatilité émotionnelle allant de la douce mélancolie à la profonde tristesse, rendant compte de toute la palette des émotions sombres.",
      culture: "Classique romantique & Rock"
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
      description: "Le mode locrien, le plus dissonant des modes diatoniques, se distingue par sa quinte diminuée créant une instabilité permanente. Il évoque le chaos, l'angoisse et l'incertitude, générant une tension extrême qui cherche presque toujours à se résoudre. Rarement utilisé comme tonalité principale, il apparaît dans le metal progressif, le jazz expérimental et la musique contemporaine pour des moments de tension maximale. Son triton entre la tonique et la quinte lui confère cette qualité profondément instable et inquiétante. Des compositeurs comme Bartók et des groupes comme Dream Theater l'ont exploité pour créer des moments d'expressivité dramatique intense.",
      culture: "Metal progressif & Contemporain"
    }
  ];

  function getModeNotes(mode: ModeGuitar): string[] {
    return mode.intervals.map(interval => 
      Note.transpose(store.userScale, interval)
    );
  }

  function getItemForTab(mode: ModeGuitar) {
    return {
      name: mode.name,
      aliases: mode.aliases,
      notes: getModeNotes(mode)
    };
  }
  
  function refresh() {
    // Combiner les modes principaux avec les modes additionnels
    const allModes = [...MAIN_MODES, ...EXTRA_MODES];
    modes.value = allModes;
    
    // Trouver le mode correspondant au mode sélectionné dans le store
    const selected = allModes.find((mode) => mode.name === store.selectedMode);
    
    if (selected) {
      currentMode.value = selected;
      // Mise à jour de l'objet mode dans le store si nécessaire
      store.setModeObject(selected);
    } else if (allModes.length > 0) {
      // Si le mode sélectionné n'est pas disponible, choisir le premier mode
      selectMode(allModes[0]);
    }
  }
  function selectMode(mode: ModeGuitar) {
    // Mettre à jour le mode dans le store avec l'objet complet
    store.setModeObject(mode);
    currentMode.value = mode;
  }
    
  onMounted(() => {
    refresh();
  });
    
  watch(() => store.userScale, () => {
    refresh();
  });
  watch(() => store.selectedMode, () => {
    refresh();
  });
  </script>
    
  <style scoped lang="scss">
  .mode-selection {
    margin-bottom: 15px;
    
    .mode-selector {
      padding: 8px 12px;
      background-color: #333;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 0.9rem;
      width: 100%;
      max-width: 300px;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: #3a7ca5;
      }
      
      option {
        background-color: #222;
        color: #ddd;
      }
    }
  }
  
  .selected-mode {
    border-left: 4px solid #3a7ca5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  </style>