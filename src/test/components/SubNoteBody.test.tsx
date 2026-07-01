import React from 'react'
import * as THREE from 'three'
import { create } from '@react-three/test-renderer'
import { SubNoteBody } from '../../components/tablature/scene/SubNoteBody'

// Mock the child component to avoid shader/useFrame complexity in unit test
vi.mock('../../components/tablature/scene/PodGradientMaterial', () => ({
  PodGradientMaterial: (props: any) => <primitive object={new THREE.MeshBasicMaterial()} attach="material" {...props} />
}))

describe('SubNoteBody', () => {
  it('renders a mesh with the provided geometry', async () => {
    const mockGeo = new THREE.ShapeGeometry(new THREE.Shape())
    const getNoteGeo = vi.fn(() => mockGeo)
    
    const renderer = await create(
      <SubNoteBody
        w={3.0}
        color="#ff0000"
        colorB="#0000ff"
        isFundamental={true}
        getNoteGeo={getNoteGeo}
        grayTarget={0}
      />
    )
    
    const mesh = renderer.scene.findByType('Mesh')
    expect(mesh.type).toBe('Mesh')
    expect(mesh.props.geometry).toBe(mockGeo)
  })
})
