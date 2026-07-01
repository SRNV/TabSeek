import React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { HEADER_H } from '../../../utils/tabUtils'
import { passWheel } from './passWheel'

interface PodHeaderTemplateProps {
  x: number
  y: number
  z: number
  width: number
  color: string
  renderOrder?: number
  
  // Sticky disc props
  stickyRelX: number
  zIndex?: number
  children?: React.ReactNode // Usually the content of the sticky disc (HTML)

  // Handlers
  onPointerDown: (e: any) => void
  onPointerEnter: (e: any) => void
  onPointerLeave: (e: any) => void
  onPointerMove: (e: any) => void
  onContextMenu: (e: any) => void
  
  getPodGeo: (w: number, h: number) => THREE.ShapeGeometry
}

/**
 * PodHeaderTemplate Component
 * A reusable template for Chord and Progression pod headers.
 * Handles the background mesh, interaction hit area, and sticky HTML disc.
 */
export const PodHeaderTemplate: React.FC<PodHeaderTemplateProps> = ({
  x, y, z, width, color, renderOrder = 5,
  stickyRelX, zIndex = 70, children,
  onPointerDown, onPointerEnter, onPointerLeave, onPointerMove, onContextMenu,
  getPodGeo
}) => {
  return (
    <group position={[x, y, z]}>
      {/* Header fill */}
      <mesh geometry={getPodGeo(width, HEADER_H)} renderOrder={renderOrder}>
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Hit area */}
      <mesh position={[0, 0, 0.01]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        onContextMenu={onContextMenu}
      >
        <planeGeometry args={[width, HEADER_H]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Sticky disc / UI */}
      <Html 
        position={[stickyRelX, 0, 0.05]} 
        style={{ pointerEvents: 'auto', transform: 'translateY(-50%)' }} 
        zIndexRange={[zIndex, zIndex]} 
        onWheel={passWheel}
      >
        <div onPointerDown={e => e.stopPropagation()} onWheel={passWheel}>
          {children}
        </div>
      </Html>
    </group>
  )
}
