import React from 'react'
import { create } from '@react-three/test-renderer'
import { PlaybackIndicator } from '../../components/tablature/scene/PlaybackIndicator'
import * as THREE from 'three'

describe('PlaybackIndicator', () => {
  it('should render correctly and respond to props', async () => {
    const onDragStart = vi.fn()
    const onHoverEnter = vi.fn()
    const onHoverLeave = vi.fn()
    
    const renderer = await create(
      <PlaybackIndicator 
        playbackBeat={2}
        invStretchX={1}
        onDragStart={onDragStart}
        onHoverEnter={onHoverEnter}
        onHoverLeave={onHoverLeave}
      />
    )

    const group = renderer.scene.findByType('Group')
    expect(group).toBeDefined()

    // Check hit area (first mesh in group)
    const hitArea = group.children[0]
    expect(hitArea.type).toBe('Mesh')
    
    // Simulate pointer down
    await renderer.fireEvent(group, 'pointerDown')
    expect(onDragStart).toHaveBeenCalled()
  })
})
