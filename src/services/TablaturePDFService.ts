/**
 * @file TablaturePDFService.ts
 * Generates a printable PDF tablature from a ProjectData snapshot.
 * Uses jsPDF for low-level drawing (lines, text) — no external rendering engine.
 *
 * Layout follows professional printed guitar tab conventions (Hal Leonard / Berklee Press):
 * - A4 portrait, 15 mm margins, 6-line staff with 6 mm string spacing.
 * - 3 measures per line for readable horizontal spacing.
 * - Courier Bold for fret numbers (standard tab typography).
 * - Frame strings (high e / low E) drawn thicker than internal strings.
 * - TAB label, measure numbers, chord names, and footer on every page.
 */

import { jsPDF } from 'jspdf'
import type { ProjectData } from '../types/project'
import type { TablatureNote, ChordGroup, ProgressionGroup } from '../types'
import { expandNotesWithModifiers } from './RhythmModifierService'

// ── Layout constants (mm) ────────────────────────────────────────────────────
const PAGE_W          = 210
const PAGE_H          = 297
const MARGIN          = 15
const USABLE_W        = PAGE_W - MARGIN * 2        // 180 mm
const STRING_LABEL_W  = 10                         // left column for string labels + TAB

const STRING_GAP      = 6                          // mm between strings
const STAFF_H         = STRING_GAP * 5             // 30 mm (6 lines × 6 mm gap)
const BEATS_PER_MEAS  = 4
const MEASURES_PER_LINE = 3                        // 3 measures per system (wider spacing)
// Beat width: fills full usable width across MEASURES_PER_LINE measures
const BEAT_W          = (USABLE_W - STRING_LABEL_W) / (MEASURES_PER_LINE * BEATS_PER_MEAS)
const MEAS_W          = BEAT_W * BEATS_PER_MEAS

const HEADER_H        = 26                         // first-page header height
const CHORD_LABEL_H   = 14                         // space above staff: measure# + chord name + prog label
const STEM_H          = 9                          // stem extension below staff bottom
const LINE_GAP        = 16                         // gap between systems (includes stem area)
const SYSTEM_H        = CHORD_LABEL_H + STAFF_H + LINE_GAP
const N_STRINGS       = 6

// Rhythmic notation
const BEAM_THICK      = 1.4
const BEAM_GAP        = 2.0

// ── Public API ───────────────────────────────────────────────────────────────

export const TablaturePDFService = {
  generatePDF(data: ProjectData): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const ctx = new RenderContext(doc, data)
    ctx.render()
    const safeName = data.name.replace(/[^a-z0-9_\-]/gi, '_')
    doc.save(`${safeName}.pdf`)
  },
}

// ── Internal render context ───────────────────────────────────────────────────

interface PrintSlot {
  startBeat: number
  duration:  number
  notes:     TablatureNote[]
  chordName: string | null
  progLabel: string | null
}

interface PrintMeasure {
  measureIdx: number
  slots:      PrintSlot[]
  widthMM:    number
}

class RenderContext {
  private doc:      InstanceType<typeof jsPDF>
  private data:     ProjectData
  private measures: PrintMeasure[]

  constructor(doc: InstanceType<typeof jsPDF>, data: ProjectData) {
    this.doc  = doc
    this.data = data
    // Expand virtual rhythm sub-notes before building the print layout
    const expandedNotes = expandNotesWithModifiers(
      data.notes, data.rhythmModifiers, data.chordGroups, data.progressionGroups
    )
    this.measures = buildPrintMeasures(expandedNotes, data.chordGroups, data.progressionGroups)
  }

  render() {
    const lines: PrintMeasure[][] = []
    for (let i = 0; i < this.measures.length; i += MEASURES_PER_LINE) {
      lines.push(this.measures.slice(i, i + MEASURES_PER_LINE))
    }
    if (lines.length === 0) lines.push([])

    let cursorY = MARGIN
    let page    = 1

    this._renderPageHeader(cursorY)
    cursorY += HEADER_H

    const fullLineW = MEASURES_PER_LINE * MEAS_W   // staff always spans full width

    for (const line of lines) {
      if (cursorY + SYSTEM_H > PAGE_H - MARGIN) {
        this._renderFooter(page)
        this.doc.addPage()
        page++
        cursorY = MARGIN
        this._renderPageHeader(cursorY)
        cursorY += HEADER_H
      }

      const staffTop = cursorY + CHORD_LABEL_H
      const staffX   = MARGIN + STRING_LABEL_W

      this._renderStringLabels(staffX, staffTop)

      // Proportional measure widths: each slot gets the same visual space
      // Empty measures get a minimum of 1 "slot unit" so they're not invisible
      const slotCounts  = line.map(m => Math.max(m.slots.length, 1))
      const totalSlots  = slotCounts.reduce((a, b) => a + b, 0)
      const measWidths  = slotCounts.map(c => (c / totalSlots) * fullLineW)

      // Full-width staff lines (always span the entire system)
      for (let s = 0; s < N_STRINGS; s++) {
        const lineY   = staffTop + s * STRING_GAP
        const isFrame = s === 0 || s === N_STRINGS - 1
        this.doc.setDrawColor(90, 90, 90).setLineWidth(isFrame ? 0.35 : 0.15)
        this.doc.line(staffX, lineY, staffX + fullLineW, lineY)
      }

      // Opening barline of the system
      this.doc.setDrawColor(60, 60, 60).setLineWidth(0.4)
      this.doc.line(staffX, staffTop, staffX, staffTop + STAFF_H)

      // Render each measure with its proportional width
      let xPos = staffX
      for (let mi = 0; mi < line.length; mi++) {
        this._renderMeasure(line[mi], xPos, staffTop, measWidths[mi])
        xPos += measWidths[mi]
      }

      // Closing barline at right edge
      this.doc.setDrawColor(60, 60, 60).setLineWidth(0.4)
      this.doc.line(staffX + fullLineW, staffTop, staffX + fullLineW, staffTop + STAFF_H)

      cursorY += SYSTEM_H
    }

    // Footer + page numbers on last page (and any remaining pages)
    const total = (this.doc as any).getNumberOfPages?.() ?? page
    for (let p = 1; p <= total; p++) {
      if (typeof (this.doc as any).setPage === 'function') {
        ;(this.doc as any).setPage(p)
      }
      this._renderFooter(p, total)
    }
  }

  // ── Page-level elements ──────────────────────────────────────────────────

  private _renderPageHeader(y: number) {
    const { name, settings, createdAt } = this.data
    const dateStr = new Date(createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    this.doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(20, 20, 20)
    this.doc.text(name, MARGIN, y + 8)

    this.doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(80, 80, 80)
    this.doc.text(
      `Accordage : ${settings.tuning}    Tempo : ${settings.tempo} BPM`,
      MARGIN, y + 16
    )
    this.doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(160, 160, 160)
    this.doc.text(`Créé le ${dateStr}`, MARGIN + USABLE_W, y + 16, { align: 'right' })

    this.doc.setDrawColor(160, 160, 160).setLineWidth(0.3)
    this.doc.line(MARGIN, y + 20, MARGIN + USABLE_W, y + 20)
  }

  private _renderFooter(page: number, total?: number) {
    const { name, settings } = this.data
    const pageLabel = total != null ? `${page} / ${total}` : String(page)
    const footerY   = PAGE_H - 7

    this.doc.setDrawColor(200, 200, 200).setLineWidth(0.2)
    this.doc.line(MARGIN, footerY - 3, MARGIN + USABLE_W, footerY - 3)

    this.doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(140, 140, 140)
    this.doc.text(
      `${name}   •   Tempo : ${settings.tempo} BPM   •   Généré par TabSeek`,
      MARGIN, footerY
    )
    this.doc.text(pageLabel, MARGIN + USABLE_W, footerY, { align: 'right' })
  }

  private _renderStringLabels(staffX: number, staffTop: number) {
    const tuning = this.data.settings.tuning.split(',')
    this.doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(80, 80, 80)
    for (let s = 0; s < N_STRINGS; s++) {
      const storeIdx = N_STRINGS - 1 - s
      const label    = tuning[storeIdx] ?? `S${s}`
      const lineY    = staffTop + s * STRING_GAP
      this.doc.text(label, staffX - 1, lineY + 1, { align: 'right' })
    }
  }

  // ── Measure rendering ────────────────────────────────────────────────────

  private _renderMeasure(meas: PrintMeasure, x: number, staffTop: number, measWidth: number) {
    const bottom     = staffTop + STAFF_H
    const localBeatW = measWidth / BEATS_PER_MEAS

    // Barline between measures (not for the first in each line — drawn at system level)
    if (meas.measureIdx % MEASURES_PER_LINE !== 0) {
      this.doc.setDrawColor(60, 60, 60).setLineWidth(0.4)
      this.doc.line(x, staffTop, x, bottom)
    }

    // Measure number at top of chord-label zone (CHORD_LABEL_H above staff), chord names sit below
    this.doc.setFontSize(6).setFont('helvetica', 'normal').setTextColor(170, 170, 170)
    this.doc.text(String(meas.measureIdx + 1), x + 1, staffTop - CHORD_LABEL_H + 4)

    const measStartBeat = meas.measureIdx * BEATS_PER_MEAS
    const beamY         = bottom + STEM_H

    // Note positions — fixed 1.5 mm padding after barline, clamp before closing barline
    const xs = meas.slots.map(slot => {
      const relBeat = slot.startBeat - measStartBeat
      return Math.min(x + 1.5 + relBeat * localBeatW, x + measWidth - 2.0)
    })

    // ── PASS 1: Stems (before fret numbers so white masks cut through them) ─
    const stems: Array<{ sx: number; tipY: number; dur: number }> = []

    for (let i = 0; i < meas.slots.length; i++) {
      const slot  = meas.slots[i]
      const slotX = xs[i]
      if (slot.duration >= 3.5 || slot.notes.length === 0) continue

      const stemTopY = Math.min(...slot.notes.map(n =>
        staffTop + (N_STRINGS - 1 - n.string) * STRING_GAP
      ))
      const tipY = slot.duration >= 2 ? beamY + STEM_H * 0.35 : beamY

      this.doc.setDrawColor(40, 40, 40).setLineWidth(0.35)
      this.doc.line(slotX, stemTopY + 2.5, slotX, tipY)
      stems.push({ sx: slotX, tipY, dur: slot.duration })
    }

    // ── PASS 2: Chord names + fret numbers (over stems) ──────────────────
    for (let i = 0; i < meas.slots.length; i++) {
      const slot  = meas.slots[i]
      const slotX = xs[i]

      if (slot.chordName) {
        this.doc.setFontSize(9).setFont('helvetica', 'bolditalic').setTextColor(30, 60, 150)
        this.doc.text(slot.chordName, slotX, staffTop - 7, { align: 'center' })
      }
      if (slot.progLabel) {
        this.doc.setFontSize(6).setFont('helvetica', 'italic').setTextColor(30, 120, 50)
        this.doc.text(slot.progLabel, slotX, staffTop - 3)
      }

      for (const note of slot.notes) {
        const visualSi = N_STRINGS - 1 - note.string
        const lineY    = staffTop + visualSi * STRING_GAP
        const fretStr  = String(note.fret)
        this.doc.setFontSize(9).setFont('courier', 'bold')
        const tw = typeof (this.doc as any).getTextWidth === 'function'
          ? (this.doc as any).getTextWidth(fretStr) as number
          : fretStr.length * 2.0
        // White rect sized exactly to the text — masks staff lines without covering adjacent notes
        this.doc.setFillColor(255, 255, 255)
        this.doc.rect(slotX - tw / 2 - 0.5, lineY - 2.0, tw + 1.0, 3.5, 'F')
        this.doc.setTextColor(15, 15, 15)
        this.doc.text(fretStr, slotX - tw / 2, lineY + 1.1)
      }
    }

    // ── PASS 3: Beams and flags ──────────────────────────────────────────
    const beamed = new Set<number>()
    for (let i = 0; i < stems.length - 1; i++) {
      if (stems[i].dur <= 0.5 && stems[i + 1].dur <= 0.5) {
        beamed.add(i); beamed.add(i + 1)
      }
    }

    for (let i = 0; i < stems.length - 1; i++) {
      const a = stems[i], b = stems[i + 1]
      if (a.dur <= 0.5 && b.dur <= 0.5) {
        this.doc.setDrawColor(40, 40, 40).setLineWidth(BEAM_THICK)
        this.doc.line(a.sx, a.tipY, b.sx, b.tipY)
        if (a.dur <= 0.25 && b.dur <= 0.25) {
          this.doc.line(a.sx, a.tipY - BEAM_GAP, b.sx, b.tipY - BEAM_GAP)
        }
      }
    }

    for (let i = 0; i < stems.length; i++) {
      const s = stems[i]
      if (s.dur > 0.5 || beamed.has(i)) continue
      this.doc.setDrawColor(40, 40, 40).setLineWidth(0.5)
      this.doc.line(s.sx, s.tipY, s.sx + 3, s.tipY - 2)
      this.doc.line(s.sx + 3, s.tipY - 2, s.sx + 1.5, s.tipY + 2)
      if (s.dur <= 0.25) {
        this.doc.line(s.sx, s.tipY - BEAM_GAP, s.sx + 3, s.tipY - BEAM_GAP - 2)
        this.doc.line(s.sx + 3, s.tipY - BEAM_GAP - 2, s.sx + 1.5, s.tipY - BEAM_GAP + 2)
      }
    }
  }
}

// ── Data transformation ───────────────────────────────────────────────────────

function buildPrintMeasures(
  notes: TablatureNote[],
  chordGroups: ChordGroup[],
  progressionGroups: ProgressionGroup[],
): PrintMeasure[] {
  if (notes.length === 0) return [emptyMeasure(0)]

  const noteToChordId   = new Map<string, string>()
  const noteToChordName = new Map<string, string>()
  const chordById       = new Map<string, ChordGroup>()
  for (const g of chordGroups) {
    chordById.set(g.id, g)
    for (const id of g.noteIds) {
      noteToChordId.set(id, g.id)
      noteToChordName.set(id, g.chordName)
    }
  }

  const chordToProgId = new Map<string, string>()
  const progById      = new Map<string, ProgressionGroup>()
  for (const p of progressionGroups) {
    progById.set(p.id, p)
    for (const cid of p.chordGroupIds) {
      chordToProgId.set(cid, p.id)
    }
  }

  const maxBeat   = Math.max(...notes.map(n => n.startBeat + n.duration))
  const totalMeas = Math.ceil(maxBeat / BEATS_PER_MEAS) || 1

  const slotMap = new Map<string, PrintSlot>()
  for (const note of notes) {
    const mIdx = Math.floor(note.startBeat / BEATS_PER_MEAS)
    const key  = `${mIdx}:${note.startBeat}`
    if (!slotMap.has(key)) {
      slotMap.set(key, { startBeat: note.startBeat, duration: note.duration, notes: [], chordName: null, progLabel: null })
    }
    const slot = slotMap.get(key)!
    slot.notes.push(note)
    slot.duration = Math.min(slot.duration, note.duration)
    if (!slot.chordName && noteToChordName.has(note.id)) {
      slot.chordName = noteToChordName.get(note.id)!
    }
  }

  // Assign prog label once per progression at its first slot
  const labeledProgs = new Set<string>()
  const allSlots = Array.from(slotMap.values()).sort((a, b) => a.startBeat - b.startBeat)
  for (const slot of allSlots) {
    for (const note of slot.notes) {
      const chordId = noteToChordId.get(note.id)
      if (!chordId) continue
      const progId = chordToProgId.get(chordId)
      if (!progId || labeledProgs.has(progId)) continue
      const prog = progById.get(progId)!
      const chordNames = prog.chordGroupIds
        .map(cid => chordById.get(cid)?.chordName)
        .filter(Boolean)
        .join(', ')
      slot.progLabel = `prog: ${prog.name} (${chordNames})`
      labeledProgs.add(progId)
      break
    }
  }

  const result: PrintMeasure[] = []
  for (let m = 0; m < totalMeas; m++) {
    const slots = Array.from(slotMap.values())
      .filter(s => Math.floor(s.startBeat / BEATS_PER_MEAS) === m)
      .sort((a, b) => a.startBeat - b.startBeat)
    result.push({ measureIdx: m, slots, widthMM: MEAS_W })
  }
  return result
}

function emptyMeasure(idx: number): PrintMeasure {
  return { measureIdx: idx, slots: [], widthMM: MEAS_W }
}
