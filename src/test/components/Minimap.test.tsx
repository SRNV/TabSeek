/**
 * @file Minimap.test.tsx
 * Tests de non-régression pour le curseur de lecture de la minimap.
 */

import React from 'react'
import { create } from '@react-three/test-renderer'
import * as THREE from 'three'
import { Minimap } from '../../components/tablature/scene/Minimap'
import { APPLE_GREEN } from '../../components/tablature/scene/sceneConstants'
import { CAM_HALF_H_TOP, CAM_HALF_H_BOT, marginY } from '../../utils/tabUtils'

vi.mock('../../stores/useTablatureR3FStore', () => {
  const mockFn: any = vi.fn((selector: any) =>
    selector({
      isFollowing: false,
      setFollowing: vi.fn(),
      setPlaybackBeat: vi.fn(),
    })
  )
  mockFn.getState = () => ({ playbackBeat: 0 })
  return { useTablatureR3FStore: mockFn }
})

const defaultProps = {
  notes: [],
  totalMeasures: 8,
  halfWRef: { current: 10 } as React.MutableRefObject<number>,
  playbackBeatRef: { current: 0 } as React.MutableRefObject<number>,
  scrollTo: vi.fn(),
  applyCameraW: vi.fn(),
}

describe('Minimap — curseur de lecture', () => {
  it('contient exactement un mesh (le curseur)', async () => {
    const renderer = await create(<Minimap {...defaultProps} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes).toHaveLength(1)
  })

  it(`couleur identique au curseur principal : APPLE_GREEN (${APPLE_GREEN})`, async () => {
    const renderer = await create(<Minimap {...defaultProps} />)
    const [cursorMesh] = renderer.scene.findAllByType('Mesh')
    const material = cursorMesh.instance.material as THREE.MeshBasicMaterial
    expect('#' + material.color.getHexString()).toBe(APPLE_GREEN.toLowerCase())
  })

  it('largeur 1.5 WU (assez visible dans la bande 56 px)', async () => {
    const renderer = await create(<Minimap {...defaultProps} />)
    const [cursorMesh] = renderer.scene.findAllByType('Mesh')
    const geometry = cursorMesh.instance.geometry as THREE.PlaneGeometry
    expect(geometry.parameters.width).toBe(1.5)
  })

  it('hauteur couvre toute la bande minimap (CAM_HALF_H_TOP + CAM_HALF_H_BOT)', async () => {
    const renderer = await create(<Minimap {...defaultProps} />)
    const [cursorMesh] = renderer.scene.findAllByType('Mesh')
    const geometry = cursorMesh.instance.geometry as THREE.PlaneGeometry
    expect(geometry.parameters.height).toBe(CAM_HALF_H_TOP + CAM_HALF_H_BOT)
  })

  it('centré verticalement dans la vue minimap (marginY) — pas de coupure', async () => {
    const renderer = await create(<Minimap {...defaultProps} />)
    const [cursorMesh] = renderer.scene.findAllByType('Mesh')
    expect(cursorMesh.instance.position.y).toBeCloseTo(marginY, 5)
  })
})
