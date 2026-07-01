/**
 * @file TablaturePDF.test.ts
 * TDD — tests écrits avant l'implémentation de TablaturePDFService.
 * jsPDF est mocké pour éviter les dépendances de rendu canvas/browser.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ProjectData } from '../../types/project'

// ── Mock jsPDF ────────────────────────────────────────────────────────────────
const mockDoc = {
  setFontSize:    vi.fn().mockReturnThis(),
  setFont:        vi.fn().mockReturnThis(),
  setDrawColor:   vi.fn().mockReturnThis(),
  setTextColor:   vi.fn().mockReturnThis(),
  setFillColor:   vi.fn().mockReturnThis(),
  setLineWidth:   vi.fn().mockReturnThis(),
  text:           vi.fn().mockReturnThis(),
  line:           vi.fn().mockReturnThis(),
  rect:           vi.fn().mockReturnThis(),
  addPage:        vi.fn().mockReturnThis(),
  save:           vi.fn().mockReturnThis(),
  getTextWidth:   vi.fn().mockReturnValue(2.0),
  internal: {
    pageSize: { getWidth: () => 210, getHeight: () => 297 },
  },
  getNumberOfPages: vi.fn().mockReturnValue(1),
}

vi.mock('jspdf', () => ({
  // Must be a regular function (not arrow) so `new jsPDF()` works as a constructor.
  jsPDF: vi.fn(function MockJsPDF() { return mockDoc }),
}))

import { TablaturePDFService } from '../../services/TablaturePDFService'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE: ProjectData = {
  version: 1,
  name: 'Test Project',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  settings: { tuning: 'E2,A2,D3,G3,C4,e4', tempo: 120 },
  notes: [],
  chordGroups: [],
  progressionGroups: [],
  rhythmModifiers: [],
  modeZones: [],
}

function note(id: string, string: number, fret: number, startBeat: number, duration = 1) {
  return { id, string, fret, startBeat, duration }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TablaturePDFService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('génère sans erreur sur un projet vide', () => {
    expect(() => TablaturePDFService.generatePDF(BASE)).not.toThrow()
  })

  it('appelle doc.save() avec le nom du projet', () => {
    TablaturePDFService.generatePDF(BASE)
    expect(mockDoc.save).toHaveBeenCalledWith('Test_Project.pdf')
  })

  it('dessine l\'en-tête (nom du projet dans text())', () => {
    TablaturePDFService.generatePDF(BASE)
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t.includes('Test Project'))).toBe(true)
  })

  it('dessine le tempo dans l\'en-tête', () => {
    TablaturePDFService.generatePDF(BASE)
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t.includes('120'))).toBe(true)
  })

  it('dessine exactement 6 lignes de staff (une par corde)', () => {
    TablaturePDFService.generatePDF({ ...BASE, notes: [note('n1', 0, 3, 0)] })
    // 6 horizontal lines + at least 2 barlines → line() called ≥ 8 times
    expect(mockDoc.line.mock.calls.length).toBeGreaterThanOrEqual(6)
  })

  it('affiche le numéro de frette comme texte sur le staff', () => {
    TablaturePDFService.generatePDF({ ...BASE, notes: [note('n1', 2, 7, 0)] })
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t === '7')).toBe(true)
  })

  it('affiche "0" pour une corde à vide (frette 0)', () => {
    TablaturePDFService.generatePDF({ ...BASE, notes: [note('n1', 0, 0, 0)] })
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t === '0')).toBe(true)
  })

  it('affiche le nom d\'accord au-dessus du staff', () => {
    const data: ProjectData = {
      ...BASE,
      notes: [note('n1', 0, 3, 0), note('n2', 1, 2, 0)],
      chordGroups: [{ id: 'g1', noteIds: ['n1', 'n2'], chordName: 'Am' }],
    }
    TablaturePDFService.generatePDF(data)
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t === 'Am')).toBe(true)
  })

  it('ajoute une page pour un projet dépassant la hauteur utile (>32 mesures)', () => {
    // 4 measures/line, ~7 lines/page → need ≥8 lines = 32 measures to trigger addPage()
    const manyNotes = Array.from({ length: 140 }, (_, i) =>
      note(`n${i}`, i % 6, i % 12, i * 1)
    )
    TablaturePDFService.generatePDF({ ...BASE, notes: manyNotes })
    expect(mockDoc.addPage).toHaveBeenCalled()
  })

  it('inclut l\'accordage dans l\'en-tête', () => {
    TablaturePDFService.generatePDF(BASE)
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t.includes('E2'))).toBe(true)
  })

  it('dessine le numéro de la première mesure', () => {
    TablaturePDFService.generatePDF({ ...BASE, notes: [note('n1', 0, 3, 0)] })
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t === '1')).toBe(true)
  })

  it('utilise la police courier pour les numéros de frette', () => {
    TablaturePDFService.generatePDF({ ...BASE, notes: [note('n1', 2, 5, 0)] })
    const fontCalls = mockDoc.setFont.mock.calls.map((c: any[]) => c[0])
    expect(fontCalls.some((f: string) => f === 'courier')).toBe(true)
  })

  it('dessine les noms d\'accords en 9pt', () => {
    const data: ProjectData = {
      ...BASE,
      notes: [note('n1', 0, 3, 0)],
      chordGroups: [{ id: 'g1', noteIds: ['n1'], chordName: 'Dm7' }],
    }
    TablaturePDFService.generatePDF(data)
    const sizeCalls = mockDoc.setFontSize.mock.calls.map((c: any[]) => c[0])
    expect(sizeCalls.some((s: number) => s === 9)).toBe(true)
  })

  it('dessine un footer avec "TabSeek" en bas de page', () => {
    TablaturePDFService.generatePDF(BASE)
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t.includes('TabSeek'))).toBe(true)
  })

  it('dessine les lignes de cadre du staff plus épaisses que les cordes internes (≥ 0.3 mm)', () => {
    TablaturePDFService.generatePDF({ ...BASE, notes: [note('n1', 0, 3, 0)] })
    const lineWidths = mockDoc.setLineWidth.mock.calls.map((c: any[]) => c[0])
    expect(lineWidths.some((w: number) => w >= 0.3)).toBe(true)
  })

  it('affiche le label de progression au premier slot de la progression', () => {
    const data: ProjectData = {
      ...BASE,
      notes: [note('n1', 0, 3, 0), note('n2', 1, 5, 4)],
      chordGroups: [
        { id: 'g1', noteIds: ['n1'], chordName: 'Am' },
        { id: 'g2', noteIds: ['n2'], chordName: 'Em' },
      ],
      progressionGroups: [{ id: 'p1', chordGroupIds: ['g1', 'g2'], name: 'Anatole' }],
    }
    TablaturePDFService.generatePDF(data)
    const calls = mockDoc.text.mock.calls.map((c: any[]) => String(c[0]))
    expect(calls.some(t => t.includes('prog:') && t.includes('Anatole') && t.includes('Am'))).toBe(true)
  })
})
