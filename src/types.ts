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