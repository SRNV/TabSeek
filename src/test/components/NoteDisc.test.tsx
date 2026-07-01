import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteDisc } from '../../components/tablature/scene/NoteDisc'

// Mock Html from drei since it's hard to test in JSDOM
vi.mock('@react-three/drei', () => ({
  Html: ({ children }: any) => <div>{children}</div>
}))

describe('NoteDisc', () => {
  const props = {
    discX: 0,
    discPx: 50,
    fill: '#ff0000',
    border: '#000000',
    text: '#ffffff',
    fret: 5,
    noteName: 'A',
    locked: false,
    onClick: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn()
  }

  it('should render fret and note name', () => {
    render(<NoteDisc {...props} />)
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('A')).toBeDefined()
  })

  it('should show lock icon when locked', () => {
    render(<NoteDisc {...props} locked={true} />)
    expect(screen.getByText('lock')).toBeDefined()
  })

  it('should call event handlers', () => {
    render(<NoteDisc {...props} />)
    const disc = screen.getByText('5').parentElement!
    fireEvent.click(disc)
    expect(props.onClick).toHaveBeenCalled()
    fireEvent.mouseEnter(disc)
    expect(props.onMouseEnter).toHaveBeenCalled()
    fireEvent.mouseLeave(disc)
    expect(props.onMouseLeave).toHaveBeenCalled()
  })
})
