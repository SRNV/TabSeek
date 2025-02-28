<template>
    <div class="chord-category" v-if="currentMode">
      <h2 class="category-title">
        {{ currentMode.name }}
        <span class="mode-scale">{{ scaleInfo }}</span>
      </h2>
      
      <div class="mode-culture" v-if="currentMode.culture">
        <span class="culture-label">Culture:</span> {{ currentMode.culture }}
      </div>
      
      <p class="category-description" v-if="currentMode.description || modeDescription">
        {{ currentMode.description || modeDescription }}
      </p>
      
      <div class="mode-details-container">
        <div class="mode-intervals details-block">
          <h3 class="details-title">Intervalles:</h3>
          <div class="interval-list">
            <span class="interval-chip" v-for="(interval, idx) in currentMode.intervals" :key="idx">
              {{ interval }}
            </span>
          </div>
        </div>
        
        <div class="mode-chords details-block">
          <h3 class="details-title">Accords:</h3>
          <div class="chords-list">
            <div class="chord-type">
              <span class="chord-label">Triade:</span> 
              <span class="chord-value">{{ currentMode.triad }}</span>
            </div>
            <div class="chord-type">
              <span class="chord-label">Septième:</span> 
              <span class="chord-value">{{ currentMode.seventh }}</span>
            </div>
          </div>
        </div>
        
        <div class="mode-notes details-block" v-if="modeNotes.length > 0">
          <h3 class="details-title">Notes:</h3>
          <div class="notes-list">
            <span class="note-chip" v-for="(note, idx) in modeNotes" :key="idx">{{ note }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
    
  <script lang="ts" setup>
  import { computed } from 'vue';
  import { useMainStore } from '../stores';
  import type { ModeGuitar } from '../types';
  
  const store = useMainStore();
  
  // Récupérer les informations sur le mode actuel
  const currentMode = computed<ModeGuitar | null>(() => {
    return {
      name: store.selectedMode,
      aliases: store.modeObject.aliases || [],
      modeNum: store.modeObject.modeNum || 0,
      mode: store.modeObject.mode || 0,
      intervals: store.modeObject.intervals || [],
      alt: store.modeObject.alt || [],
      triad: store.modeObject.triad || '',
      seventh: store.modeObject.seventh || '',
      description: store.modeObject.description,
      culture: store.modeObject.culture
    };
  });
  
  // Calcul des notes à partir des intervalles
  const modeNotes = computed(() => {
    return store.modeNotes;
  });
  
  // Afficher la gamme actuelle et le mode
  const scaleInfo = computed(() => {
    return `${store.userScale}`;
  });
  
  // Descriptions des modes pour une meilleure compréhension
  const modeDescriptions = {
    'ionian': `Le mode ionien, ou gamme majeure classique, est caractérisé par sa sonorité lumineuse et joyeuse. Il forme la base de la musique occidentale traditionnelle et est utilisé dans d'innombrables chansons populaires. Sa structure d'intervalles (T-T-1/2T-T-T-T-1/2T) crée une résolution harmonique puissante sur l'accord de tonique. C'est le mode de référence pour tous les autres modes diatoniques, utilisé pour exprimer la joie, la stabilité et la complétude. On le retrouve abondamment dans la musique classique, pop, et gospel.`,
  
    'dorian': `Le mode dorien est une gamme mineure avec une sixte majeure distinctive qui lui confère un caractère à la fois mélancolique et optimiste. Très présent dans le jazz modal, le blues et la musique celtique, il offre un équilibre unique entre tension et résolution. Sa structure (T-1/2T-T-T-T-1/2T-T) crée une sonorité reconnaissable dans des morceaux comme "So What" de Miles Davis. Ce mode apporte une couleur mélancolique sans être totalement sombre, idéal pour le jazz, la musique folk et le rock progressif. Sa sixte majeure distincte permet des progressions harmoniques riches et expressives.`,
  
    'phrygian': `Le mode phrygien se distingue immédiatement par sa seconde mineure qui lui confère une tension caractéristique et une sonorité orientale ou espagnole. Pilier du flamenco et de la musique andalouse, il évoque souvent le mystère, l'intensité et parfois même la menace. Sa structure d'intervalles (1/2T-T-T-T-1/2T-T-T) crée une forte tension vers la tonique, produisant un sentiment d'urgence ou d'inévitabilité. Le demi-ton entre la tonique et la seconde note génère une sonorité immédiatement reconnaissable. Ce mode est particulièrement efficace pour créer des atmosphères sombres, exotiques ou dramatiques dans le metal, la musique électronique et les compositions contemporaines.`,
  
    'lydian': `Le mode lydien, avec sa caractéristique quarte augmentée, crée une atmosphère aérienne, flottante et parfois surréaliste. Fréquemment utilisé dans les musiques de films de science-fiction et de fantasy, il évoque le mystère, l'émerveillement et l'ouverture. Sa structure d'intervalles (T-T-T-1/2T-T-T-1/2T) avec le triton entre la tonique et la quarte lui confère cette qualité éthérée distinctive. Le lydien est souvent associé à l'exploration, à l'élévation spirituelle et aux états altérés de conscience. Compositeurs comme Debussy et Ravel l'ont exploité pour ses qualités impressionnistes, tandis que des musiciens de jazz comme Bill Evans l'ont utilisé pour ses possibilités harmoniques uniques qui permettent des extensions d'accords riches et colorées.`,
  
    'mixolydian': `Le mode mixolydien, essentiellement une gamme majeure avec une septième mineure, est omniprésent dans le rock, le blues et la musique celtique. Sa sonorité est à la fois brillante et légèrement tendue, offrant un équilibre parfait entre l'énergie majeure et la subtile mélancolie de la septième abaissée. Sa structure (T-T-1/2T-T-T-1/2T-T) crée naturellement un mouvement vers le quatrième degré, expliquant sa présence dans d'innombrables progressions I-bVII-IV. Pilier du blues-rock dans des chansons comme "Sweet Home Alabama", il apporte une qualité enjouée mais jamais complètement résolue. Le mixolydien est parfaitement adapté à l'improvisation, particulièrement sur des accords de septième dominante, et offre une transition naturelle entre les sonorités majeures et mineures.`,
  
    'aeolian': `Le mode éolien, ou gamme mineure naturelle, est fondamental dans la musique occidentale pour exprimer la mélancolie, l'introspection et la profondeur émotionnelle. Sa structure (T-1/2T-T-T-1/2T-T-T) avec ses tierces, sixtes et septièmes mineures crée cette sonorité immédiatement reconnaissable dans la musique classique romantique, le folk et le rock alternatif. Contrairement au mode majeur, l'éolien possède une qualité inachevée qui invite à la contemplation et à l'expression des émotions complexes. Ce mode est omniprésent dans le rock et la pop pour des ballades émotionnelles, dans la musique classique pour des mouvements expressifs, et dans la musique folk pour des récits poignants. Sa versatilité lui permet d'exprimer une large gamme d'émotions, de la douce mélancolie à la profonde tristesse.`,
  
    'locrian': `Le mode locrien, le plus dissonant des modes diatoniques, se distingue par sa quinte diminuée et sa seconde mineure qui créent une instabilité harmonique permanente. Rarement utilisé comme tonalité principale, il génère une tension extrême qui cherche presque toujours à se résoudre vers d'autres modes. Sa structure unique (1/2T-T-T-1/2T-T-T-T) avec son triton entre la tonique et la quinte le rend particulièrement utile dans le metal progressif, le jazz expérimental et la musique contemporaine. Le locrien évoque l'incertitude, le chaos et parfois même l'angoisse, ce qui explique son utilisation pour des sections transitoires plutôt que des thèmes principaux. Malgré sa rareté, des compositeurs comme Bartók et des groupes comme Dream Theater ont exploité ses qualités dissonantes uniques pour créer des moments de tension dramatique et d'expressivité intense.`
  };
  
  const modeDescription = computed(() => {
    if (!currentMode.value) return '';
    return modeDescriptions[currentMode.value.name] || 
           `Le mode ${currentMode.value.name} est défini par les intervalles ${currentMode.value.intervals.join(', ')}. 
            Il convient bien pour des accords de type ${currentMode.value.triad} et ${currentMode.value.seventh}.`;
  });
  </script>
    
  <style scoped lang="scss">
  .chord-category {
    margin-bottom: 15px;
    background-color: rgba(30, 30, 30, 0.7);
    border-radius: 8px;
    padding: 15px;
    
    .category-title {
      font-size: 1.2rem;
      margin: 0 0 5px 0;
      color: #f0f0f0;
      padding-bottom: 5px;
      border-bottom: 1px solid #555;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      
      .mode-scale {
        font-size: 0.9rem;
        color: #aaa;
        font-style: italic;
        font-weight: normal;
      }
    }
    
    .mode-culture {
      margin: 8px 0;
      color: orange;
      font-size: 0.85rem;
      font-style: italic;
      
      .culture-label {
        color: #aaa;
        font-weight: bold;
        margin-right: 5px;
      }
    }
    
    .category-description {
      font-size: 0.8rem;
      color: #bbb;
      margin: 0 0 15px 0;
      font-style: italic;
      line-height: 1.4;
    }
    
    .mode-details-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .details-block {
        background-color: rgba(40, 40, 40, 0.5);
        border-radius: 4px;
        padding: 10px;
        
        .details-title {
          font-size: 0.9rem;
          margin: 0 0 8px 0;
          color: #ddd;
          font-weight: normal;
        }
      }
      
      .interval-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        
        .interval-chip {
          background-color: #3a4a5a;
          color: #ddd;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 0.8rem;
          font-family: monospace;
        }
      }
      
      .chords-list {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        
        .chord-type {
          font-size: 0.85rem;
          
          .chord-label {
            color: #aaa;
            margin-right: 5px;
          }
          
          .chord-value {
            color: orange;
            font-weight: bold;
          }
        }
      }
      
      .notes-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .note-chip {
          background-color: #3a3a3a;
          padding: 5px 10px;
          border-radius: 4px;
          font-family: monospace;
          color: #ddd;
          font-size: 0.9rem;
        }
      }
    }
  }
  </style>