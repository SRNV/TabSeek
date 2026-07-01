import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock for ResizeObserver which is not present in jsdom
;(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock for HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn()
