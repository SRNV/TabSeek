/**
 * Service dedicated to color calculations and accessibility (contrast).
 */
export class ColorService {
  /**
   * Returns a highly contrasting color (white or black) based on the background color.
   */
  static getContrastColor(hex: string): string {
    if (!hex) return '#000000'
    
    // Normalize hex (handle #RGB or RRGGBB)
    let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('')
    }
    
    // Parse RGB
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255

    // Calculate perceived brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000

    return brightness < 0.5 ? '#ffffff' : '#000000'
  }
}
