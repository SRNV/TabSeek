/**
 * @file mode.d.ts
 * Pure type definition for a musical mode (scale) as used throughout TabSeek.
 * Sourced from `src/data/extraModes.ts` at runtime; kept separate so consumers
 * can import the type without pulling in the full 62-mode data array.
 */

/** Shape of a single mode entry from `src/data/extraModes.ts`. */
export interface ModeGuitar {
    name: string;
    aliases: string[];
    modeNum: number;
    mode: number;
    intervals: string[];
    alt: string[];
    triad: string;
    seventh: string;
    description?: string;
    culture?: string;
    category: string;
}
