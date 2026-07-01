import { ColorService } from '../../services/ColorService'

describe('ColorService', () => {
  describe('getContrastColor', () => {
    it('should return black for light colors', () => {
      expect(ColorService.getContrastColor('#ffffff')).toBe('#000000')
      expect(ColorService.getContrastColor('#ffff00')).toBe('#000000')
      expect(ColorService.getContrastColor('ffffff')).toBe('#000000')
    })

    it('should return white for dark colors', () => {
      expect(ColorService.getContrastColor('#000000')).toBe('#ffffff')
      expect(ColorService.getContrastColor('#333333')).toBe('#ffffff')
      expect(ColorService.getContrastColor('#0000ff')).toBe('#ffffff')
    })

    it('should handle 3-digit hex codes', () => {
      expect(ColorService.getContrastColor('#fff')).toBe('#000000')
      expect(ColorService.getContrastColor('#000')).toBe('#ffffff')
    })

    it('should return black for empty or invalid input', () => {
      expect(ColorService.getContrastColor('')).toBe('#000000')
    })
  })
})
