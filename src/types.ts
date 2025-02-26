// src/types.ts
export interface ModeGuitar {
    name: string;           // Nom du mode (ex: "major", "dorian")
    aliases: string[];      // Noms alternatifs du mode
    modeNum: number;        // Numéro du mode (0...7)
    mode: number;           // Numéro du mode (même valeur que modeNum, pour compatibilité)
    intervals: string[];    // Intervalles du mode (ex: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"])
    alt: string[];          // Altérations du mode
    triad: string;          // Type d'accord triade associé à ce mode
    seventh: string;        // Type d'accord de septième associé à ce mode
    description?: string;   // Description du mode, son utilisation et son expressivité
    culture?: string;       // Culture d'origine ou associée à ce mode
    category: string;      // Catégorie à laquelle appartient ce mode pour le regroupement
  }