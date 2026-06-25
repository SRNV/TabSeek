import React, { useState, useRef, useEffect, useCallback } from 'react'
import './TabContent.scss'
import { useTablatureStore } from '../../stores/useTablatureStore'
import { useMainStore } from '../../stores/useMainStore'
import { Note, Interval } from 'tonal'

const columnWidth = 32
const labelWidth = 40

const modeColors: Record<string, string> = {
  'major': '#3a7ca5', 'minor': '#a53a3a', 'dorian': '#3aa56e',
  'phrygian': '#a53a99', 'lydian': '#a59d3a', 'mixolydian': '#a5623a', 'locrian': '#7a3aa5'
}

const MODE_INTERVALS: Record<string, string[]> = {
  'major': ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
  'minor': ["1P", "2M", "3m", "4P", "5P", "6m", "7m"],
  'dorian': ["1P", "2M", "3m", "4P", "5P", "6M", "7m"],
  'phrygian': ["1P", "2m", "3m", "4P", "5P", "6m", "7m"],
  'lydian': ["1P", "2M", "3M", "4A", "5P", "6M", "7M"],
  'mixolydian': ["1P", "2M", "3M", "4P", "5P", "6M", "7m"],
  'locrian': ["1P", "2m", "3m", "4P", "5d", "6m", "7m"]
}

export default function TabContent() {
  const store = useTablatureStore()
  const mainStore = useMainStore()

  const tablatureRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const indexEditInputRef = useRef<HTMLInputElement>(null)

  const [selectedCell, setSelectedCell] = useState<{ string: number; column: number } | null>(null)
  const [editingCell, setEditingCell] = useState<{ string: number; column: number } | null>(null)
  const [editBuffer, setEditBuffer] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [indexEditBuffer, setIndexEditBuffer] = useState('')
  const [rhythmDragStart, setRhythmDragStart] = useState<number | null>(null)
  const [rhythmDragEnd, setRhythmDragEnd] = useState<number | null>(null)
  const [rhythmDragging, setRhythmDragging] = useState(false)

  const totalColumns = store.totalColumns()
  const tuningArray = store.tuningArray()

  useEffect(() => {
    tablatureRef.current?.focus()
  }, [])

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCell])

  useEffect(() => {
    if (editingIndex !== null && indexEditInputRef.current) {
      indexEditInputRef.current.focus()
      indexEditInputRef.current.select()
    }
  }, [editingIndex])

  function scrollToColumn(gc: number) {
    if (!scrollContainerRef.current) return
    const targetX = gc * columnWidth
    const { scrollLeft, clientWidth } = scrollContainerRef.current
    if (targetX < scrollLeft + labelWidth) {
      scrollContainerRef.current.scrollLeft = targetX - labelWidth
    } else if (targetX + columnWidth > scrollLeft + clientWidth) {
      scrollContainerRef.current.scrollLeft = targetX + columnWidth - clientWidth + 20
    }
  }

  function onScroll() {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    if (scrollWidth - scrollLeft - clientWidth < 200) {
      store.addMeasure()
    }
  }

  function getScaleNotes(globalCol: number): number[] {
    const mode = store.flatColumnMode(globalCol)
    if (mode) {
      const intervals = MODE_INTERVALS[mode]
      if (!intervals) return []
      const modeNotes = intervals.map(interval => Note.transpose(mainStore.userScale, interval))
      return modeNotes.map(n => { const m = Note.midi(n); return m !== null ? m % 12 : -1 }).filter(m => m !== -1)
    }
    return mainStore.getModeNotes().map(n => { const m = Note.midi(n); return m !== null ? m % 12 : -1 }).filter(m => m !== -1)
  }

  function isOutOfScale(stringIndex: number, gc: number): boolean {
    const cellValue = store.flatCellValue(stringIndex, gc)
    if (!cellValue || cellValue === '-' || cellValue === 'x' || cellValue === 'X') return false
    const fretMatch = cellValue.match(/^(\d{1,2})/)
    if (!fretMatch) return false
    const fretNumber = parseInt(fretMatch[1])
    if (isNaN(fretNumber)) return false
    const stringTuning = tuningArray[stringIndex]
    if (!stringTuning) return false
    const noteToCheck = Note.transpose(stringTuning, Interval.fromSemitones(fretNumber))
    const midiNote = Note.midi(noteToCheck)
    if (midiNote === null) return false
    return !getScaleNotes(gc).includes(midiNote % 12)
  }

  function isIndexOutOfScale(gc: number): boolean {
    const indexPos = store.flatIndexPosition(gc)
    if (indexPos === 0) return false
    const scaleNotes = getScaleNotes(gc)
    if (scaleNotes.length === 0) return false
    return tuningArray.every(stringTuning => {
      const noteAtFret = Note.transpose(stringTuning, Interval.fromSemitones(indexPos))
      const midi = Note.midi(noteAtFret)
      return midi === null || !scaleNotes.includes(midi % 12)
    })
  }

  function isOutOfReach(stringIndex: number, gc: number): boolean {
    const cellValue = store.flatCellValue(stringIndex, gc)
    if (!cellValue || cellValue === '-' || cellValue === 'x' || cellValue === 'X') return false
    const fretMatch = cellValue.match(/^(\d{1,2})/)
    if (!fretMatch) return false
    const fret = parseInt(fretMatch[1])
    if (isNaN(fret) || fret === 0) return false
    const indexPos = store.flatIndexPosition(gc)
    return fret < indexPos || fret > indexPos + 3
  }

  function beamPosition(gc: number): string | null {
    const rv = store.flatRhythmValue(gc)
    if (rv < 8) return null
    const prevBeamed = gc > 0 && store.flatRhythmValue(gc - 1) >= 8
    const nextBeamed = gc < totalColumns - 1 && store.flatRhythmValue(gc + 1) >= 8
    if (!prevBeamed && !nextBeamed) return 'single'
    if (!prevBeamed && nextBeamed) return 'first'
    if (prevBeamed && nextBeamed) return 'middle'
    return 'last'
  }

  function isIndexChange(gc: number): boolean {
    if (gc === 0) return true
    if (store.isMeasureStart(gc)) return true
    return store.flatIndexPosition(gc) !== store.flatIndexPosition(gc - 1)
  }

  function getColumnStyle(gc: number): React.CSSProperties {
    const mode = store.flatColumnMode(gc)
    if (mode && modeColors[mode]) return { backgroundColor: `${modeColors[mode]}88` }
    return {}
  }

  // Rhythm drag
  function rhythmDragRange(): [number, number] | null {
    if (rhythmDragStart === null || rhythmDragEnd === null) return null
    return [Math.min(rhythmDragStart, rhythmDragEnd), Math.max(rhythmDragStart, rhythmDragEnd)]
  }

  function isInRhythmDrag(gc: number): boolean {
    const range = rhythmDragRange()
    if (!range) return false
    return gc >= range[0] && gc <= range[1]
  }

  function onRhythmMousedown(gc: number, e: React.MouseEvent) {
    e.preventDefault()
    setRhythmDragStart(gc)
    setRhythmDragEnd(gc)
    setRhythmDragging(true)
  }

  function onRhythmMouseenter(gc: number) {
    if (!rhythmDragging) return
    setRhythmDragEnd(gc)
  }

  function onRhythmMouseup() {
    if (!rhythmDragging) return
    const range = rhythmDragRange()
    if (range) {
      const [start, end] = range
      if (start === end) {
        const current = store.flatRhythmValue(start)
        if (current >= 8) {
          store.flatUpdateRhythmValue(start, 0)
        } else {
          const slow = [0, 1, 2, 4]
          const idx = slow.indexOf(current)
          store.flatUpdateRhythmValue(start, slow[(idx + 1) % slow.length])
        }
      } else {
        const beamLevels = [8, 16, 32, 64]
        let minLevel = Infinity
        for (let i = start; i <= end; i++) {
          const v = store.flatRhythmValue(i)
          if (v < minLevel) minLevel = v
        }
        let newValue = 8
        if (minLevel >= 8) {
          const idx = beamLevels.indexOf(minLevel)
          newValue = beamLevels[Math.min(idx + 1, beamLevels.length - 1)]
        }
        for (let i = start; i <= end; i++) {
          store.flatUpdateRhythmValue(i, newValue)
        }
      }
    }
    setRhythmDragStart(null)
    setRhythmDragEnd(null)
    setRhythmDragging(false)
  }

  // Cell selection & editing
  function commitEdit(curEditingCell?: { string: number; column: number } | null, curEditBuffer?: string) {
    const cell = curEditingCell ?? editingCell
    const buf = curEditBuffer ?? editBuffer
    if (!cell) return
    const { string: s, column: gc } = cell
    const value = buf.trim()
    if (value === '' || value === '-') {
      store.flatUpdateCellValue(s, gc, '-')
    } else if (isValidFretValue(value)) {
      store.flatUpdateCellValue(s, gc, value)
    }
    setEditingCell(null)
    setEditBuffer('')
  }

  function isValidFretValue(value: string): boolean {
    if (/^\d{1,2}$/.test(value)) { const num = parseInt(value); return num >= 0 && num <= 24 }
    if (value === 'x' || value === 'X') return true
    if (/^\d{1,2}h$/.test(value)) return true
    if (/^\d{1,2}p$/.test(value)) return true
    if (/^\d{1,2}\/\d{1,2}$/.test(value)) return true
    return false
  }

  function selectCell(stringIndex: number, gc: number, e: React.MouseEvent) {
    if (e.shiftKey) {
      store.updateSelection(Math.min(store.selectionStart, gc), Math.max(store.selectionStart, gc))
      return
    }
    if (e.ctrlKey || e.metaKey) {
      const newCols = [...store.selectedColumns]
      const index = newCols.indexOf(gc)
      if (index === -1) { newCols.push(gc) } else { newCols.splice(index, 1) }
      useTablatureStore.setState({ selectedColumns: newCols })
      if (newCols.length > 0) {
        useTablatureStore.setState({
          selectionStart: Math.min(...newCols),
          selectionEnd: Math.max(...newCols)
        })
      }
      return
    }
    if (selectedCell?.string === stringIndex && selectedCell?.column === gc) {
      startEditing(stringIndex, gc)
    } else {
      commitEdit()
      setSelectedCell({ string: stringIndex, column: gc })
      store.updateSelection(gc, gc)
      store.setCurrentEditingCell(stringIndex, gc)
      tablatureRef.current?.focus()
    }
  }

  function startEditing(stringIndex: number, gc: number) {
    const currentValue = store.flatCellValue(stringIndex, gc)
    setEditBuffer(currentValue === '-' ? '' : currentValue)
    setEditingCell({ string: stringIndex, column: gc })
  }

  function moveTo(s: number, gc: number) {
    store.ensureColumn(gc)
    setSelectedCell({ string: s, column: gc })
    store.updateSelection(gc, gc)
    store.setCurrentEditingCell(s, gc)
    useTablatureStore.setState({ currentMeasure: store.measureForColumn(gc) })
    setTimeout(() => scrollToColumn(gc), 0)
  }

  function handleKeydown(e: React.KeyboardEvent) {
    if (editingCell) return
    if (!selectedCell) {
      if (/^(Arrow|Enter|[0-9xX])/.test(e.key)) moveTo(0, 0)
      return
    }
    const { string: s, column: c } = selectedCell
    const maxString = tuningArray.length - 1

    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); if (s > 0) moveTo(s - 1, c); break
      case 'ArrowDown': e.preventDefault(); if (s < maxString) moveTo(s + 1, c); break
      case 'ArrowLeft': e.preventDefault(); if (c > 0) moveTo(s, c - 1); break
      case 'ArrowRight': e.preventDefault(); moveTo(s, c + 1); break
      case 'Delete': case 'Backspace':
        e.preventDefault()
        store.flatUpdateCellValue(s, c, '-')
        break
      case 'Enter': e.preventDefault(); startEditing(s, c); break
      default:
        if (/^[0-9xX]$/.test(e.key)) {
          e.preventDefault()
          setEditBuffer(e.key)
          setEditingCell({ string: s, column: c })
        }
        break
    }
  }

  function handleEditKeydown(e: React.KeyboardEvent) {
    if (!selectedCell) return
    const { string: s, column: c } = selectedCell
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        commitEdit()
        moveTo(s, c + 1)
        tablatureRef.current?.focus()
        break
      case 'Escape':
        e.preventDefault()
        setEditingCell(null)
        setEditBuffer('')
        tablatureRef.current?.focus()
        break
      case 'Tab':
        e.preventDefault()
        commitEdit()
        moveTo(s, c + (e.shiftKey ? -1 : 1))
        tablatureRef.current?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        commitEdit()
        if (s > 0) moveTo(s - 1, c)
        tablatureRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        commitEdit()
        if (s < tuningArray.length - 1) moveTo(s + 1, c)
        tablatureRef.current?.focus()
        break
      case 'ArrowLeft':
        e.preventDefault()
        commitEdit()
        if (c > 0) moveTo(s, c - 1)
        tablatureRef.current?.focus()
        break
      case 'ArrowRight':
        e.preventDefault()
        commitEdit()
        moveTo(s, c + 1)
        tablatureRef.current?.focus()
        break
      case ' ':
        e.preventDefault()
        commitEdit()
        moveTo(s, c + 1)
        tablatureRef.current?.focus()
        break
    }
  }

  // Index row
  function startEditingIndex(gc: number) {
    commitEdit()
    setIndexEditBuffer(String(store.flatIndexPosition(gc)))
    setEditingIndex(gc)
  }

  function commitIndexEdit(curEditingIndex?: number | null, curIndexEditBuffer?: string) {
    const col = curEditingIndex ?? editingIndex
    const buf = curIndexEditBuffer ?? indexEditBuffer
    if (col === null) return
    const value = parseInt(buf)
    if (!isNaN(value) && value >= 0 && value <= 24) {
      const oldValue = store.flatIndexPosition(col)
      store.flatUpdateIndexPosition(col, value)
      const measureIdx = store.measureForColumn(col)
      const measureEnd = (measureIdx + 1) * store.columns
      for (let i = col + 1; i < measureEnd; i++) {
        if (store.flatIndexPosition(i) === oldValue) {
          store.flatUpdateIndexPosition(i, value)
        } else { break }
      }
    }
    setEditingIndex(null)
    setIndexEditBuffer('')
  }

  function handleIndexEditKeydown(e: React.KeyboardEvent) {
    const col = editingIndex
    if (col === null) return
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        commitIndexEdit()
        if (col + 1 < totalColumns) startEditingIndex(col + 1)
        else tablatureRef.current?.focus()
        break
      case 'Escape':
        e.preventDefault()
        setEditingIndex(null)
        setIndexEditBuffer('')
        tablatureRef.current?.focus()
        break
      case 'Tab':
        e.preventDefault()
        commitIndexEdit()
        const next = col + (e.shiftKey ? -1 : 1)
        if (next >= 0 && next < totalColumns) startEditingIndex(next)
        break
      case 'ArrowLeft':
        e.preventDefault()
        commitIndexEdit()
        if (col > 0) startEditingIndex(col - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        commitIndexEdit()
        if (col < totalColumns - 1) startEditingIndex(col + 1)
        break
    }
  }

  const columns = Array.from({ length: totalColumns }, (_, i) => i)

  return (
    <div className="tablature-scroll" ref={scrollContainerRef} onScroll={onScroll}>
      <div
        className="tablature"
        onKeyDown={handleKeydown}
        tabIndex={0}
        ref={tablatureRef}
        style={{ minWidth: totalColumns * columnWidth + labelWidth + 'px' }}
      >
        {/* Rhythm row */}
        <div
          className="tab-string rhythm-row"
          onMouseUp={onRhythmMouseup}
          onMouseLeave={onRhythmMouseup}
        >
          <div className="string-label rhythm-label"></div>
          <div className="string-content">
            {columns.map(gc => {
              const rv = store.flatRhythmValue(gc)
              const bp = beamPosition(gc)
              const cls = [
                'tab-column', 'rhythm-column',
                store.isMeasureStart(gc) && gc > 0 ? 'measure-start' : '',
                bp ? `beam-${bp}` : '',
                rv === 1 ? 'slow-1' : '',
                rv === 2 ? 'slow-2' : '',
                rv === 4 ? 'slow-4' : '',
                rv >= 16 ? 'beams-2' : '',
                rv >= 32 ? 'beams-3' : '',
                rv >= 64 ? 'beams-4' : '',
                isInRhythmDrag(gc) && rhythmDragging ? 'drag-preview' : '',
              ].filter(Boolean).join(' ')
              return (
                <div
                  key={`r-${gc}`}
                  className={cls}
                  style={{ width: columnWidth + 'px', minWidth: columnWidth + 'px' }}
                  onMouseDown={e => onRhythmMousedown(gc, e)}
                  onMouseEnter={() => onRhythmMouseenter(gc)}
                />
              )
            })}
          </div>
        </div>

        {/* Guitar strings */}
        {tuningArray.map((stringTuning, stringIndex) => (
          <div key={`string-${stringIndex}`} className="tab-string">
            <div className="string-label">{stringTuning}</div>
            <div className="string-content">
              {columns.map(gc => {
                const isEditing = editingCell?.string === stringIndex && editingCell?.column === gc
                const isFocused = selectedCell?.string === stringIndex && selectedCell?.column === gc && !editingCell
                const cellValue = store.flatCellValue(stringIndex, gc)
                const cls = [
                  'tab-column',
                  gc === store.currentPlayingColumn ? 'active' : '',
                  store.isColumnSelected(gc) ? 'selected' : '',
                  store.flatColumnMode(gc) ? 'mode-override' : '',
                  isEditing ? 'editing' : '',
                  isFocused ? 'focused' : '',
                  isOutOfReach(stringIndex, gc) ? 'out-of-reach' : '',
                  store.isMeasureStart(gc) && gc > 0 ? 'measure-start' : '',
                ].filter(Boolean).join(' ')
                return (
                  <div
                    key={`c-${gc}`}
                    className={cls}
                    style={{ ...getColumnStyle(gc), width: columnWidth + 'px', minWidth: columnWidth + 'px' }}
                    onClick={e => selectCell(stringIndex, gc, e)}
                    onDoubleClick={() => startEditing(stringIndex, gc)}
                  >
                    {stringIndex === 0 && store.flatColumnMode(gc) && (
                      <div className="mode-indicator">{store.flatColumnMode(gc)}</div>
                    )}
                    {!isEditing && (
                      <span
                        className={[
                          'cell-value',
                          cellValue !== '-' ? 'has-value' : '',
                          isOutOfScale(stringIndex, gc) ? 'out-of-scale' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {cellValue === '-' ? '' : cellValue}
                      </span>
                    )}
                    {isEditing && (
                      <input
                        ref={editInputRef}
                        className="cell-input"
                        value={editBuffer}
                        onChange={e => setEditBuffer(e.target.value)}
                        onKeyDown={handleEditKeydown}
                        onBlur={() => commitEdit()}
                        maxLength={4}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Index row */}
        <div className="tab-string index-row">
          <div className="string-label index-label">Idx</div>
          <div className="string-content">
            {columns.map(gc => {
              const isEditingIdx = editingIndex === gc
              const idxCls = [
                'tab-column', 'index-column',
                isEditingIdx ? 'editing' : '',
                isIndexChange(gc) ? 'index-change' : '',
                isIndexOutOfScale(gc) ? 'out-of-scale' : '',
                store.isMeasureStart(gc) && gc > 0 ? 'measure-start' : '',
              ].filter(Boolean).join(' ')
              return (
                <div
                  key={`idx-${gc}`}
                  className={idxCls}
                  style={{ width: columnWidth + 'px', minWidth: columnWidth + 'px' }}
                  onClick={() => startEditingIndex(gc)}
                  onDoubleClick={() => startEditingIndex(gc)}
                >
                  {!isEditingIdx && (
                    <span className={['index-value', !isIndexChange(gc) ? 'inherited' : ''].filter(Boolean).join(' ')}>
                      {isIndexChange(gc) ? store.flatIndexPosition(gc) : ''}
                    </span>
                  )}
                  {isEditingIdx && (
                    <input
                      ref={indexEditInputRef}
                      className="cell-input index-input"
                      value={indexEditBuffer}
                      onChange={e => setIndexEditBuffer(e.target.value)}
                      onKeyDown={handleIndexEditKeydown}
                      onBlur={() => commitIndexEdit()}
                      maxLength={2}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Measure row */}
        <div className="tab-string measure-row">
          <div className="string-label measure-label">Mes</div>
          <div className="string-content">
            {columns.map(gc => (
              <div
                key={`m-${gc}`}
                className={['tab-column', 'measure-column', store.isMeasureStart(gc) ? 'measure-start' : ''].filter(Boolean).join(' ')}
                style={{ width: columnWidth + 'px', minWidth: columnWidth + 'px' }}
              >
                {store.isMeasureStart(gc) && (
                  <span className="measure-number">{store.measureForColumn(gc) + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
