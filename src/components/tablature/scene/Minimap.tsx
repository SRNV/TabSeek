import React, { useMemo, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTablatureR3FStore } from '../../../stores/useTablatureR3FStore'
import { useShallow } from 'zustand/react/shallow'
import { APPLE_GREEN } from './sceneConstants'
import {
  BEAT_W, MEASURE_W, LEFT_MARGIN_W, BEATS_PER_MEAS,
  CAM_HALF_H_TOP, CAM_HALF_H_BOT, marginY
} from '../../../utils/tabUtils'

interface MinimapProps {
  notes: any[]
  totalMeasures: number
  halfWRef: React.MutableRefObject<number>
  playbackBeatRef: React.MutableRefObject<number>
  scrollTo: (x: number) => void
  applyCameraW: (o: THREE.OrthographicCamera, halfW: number) => void
}

export const Minimap = ({ 
  notes, 
  totalMeasures, 
  halfWRef, 
  playbackBeatRef, 
  scrollTo,
  applyCameraW
}: MinimapProps) => {
  const { gl, camera, scene, size } = useThree()
  const MINIMAP_PX = 56

  const minimapCam = useMemo(() => {
    const cam = new THREE.OrthographicCamera()
    cam.position.set(0, 0, 10)
    cam.near = 0.1
    cam.far = 100
    cam.layers.enable(1) // sees layer 0 (scene) + layer 1 (viewport rect)
    return cam
  }, [])

  const viewportRectRef = useRef<THREE.LineLoop>(null)
  const minimapCursorRef = useRef<THREE.Mesh>(null)
  const minimapTargetXRef = useRef<number | null>(null)

  const { isFollowing, setFollowing, setPlaybackBeat } = useTablatureR3FStore(
    useShallow(s => ({
      isFollowing: s.isFollowing,
      setFollowing: s.setFollowing,
      setPlaybackBeat: s.setPlaybackBeat
    }))
  )

  useEffect(() => {
    if (viewportRectRef.current) viewportRectRef.current.layers.set(1)
    if (minimapCursorRef.current) minimapCursorRef.current.layers.set(1)
  }, [])

  // Minimap drag logic
  useEffect(() => {
    const canvas = gl.domElement
    let dragging = false

    function isInMinimap(e: PointerEvent): boolean {
      const rect = canvas.getBoundingClientRect()
      return (e.clientY - rect.top) > (rect.height - MINIMAP_PX)
    }

    function pointerToWorldX(e: PointerEvent): number {
      const rect = canvas.getBoundingClientRect()
      const frac = (e.clientX - rect.left) / rect.width
      const worldLeft = minimapCam.position.x + minimapCam.left
      const worldRight = minimapCam.position.x + minimapCam.right
      return worldLeft + frac * (worldRight - worldLeft)
    }

    function onPointerDown(e: PointerEvent) {
      if (!isInMinimap(e)) return
      e.stopPropagation()
      dragging = true
      minimapTargetXRef.current = pointerToWorldX(e)
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }

    function onPointerMove(e: PointerEvent) {
      if (dragging) {
        e.stopPropagation()
        minimapTargetXRef.current = pointerToWorldX(e)
        canvas.style.cursor = 'grabbing'
      } else if (isInMinimap(e)) {
        canvas.style.cursor = 'pointer'
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging) return
      dragging = false
      e.stopPropagation()
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
      canvas.style.cursor = isInMinimap(e) ? 'pointer' : 'default'
    }

    function onPointerLeave() {
      if (!dragging) canvas.style.cursor = 'default'
    }

    function onDblClick(e: MouseEvent) {
      if (!isInMinimap(e as any)) return
      e.stopPropagation()
      const worldX = pointerToWorldX(e as any)
      const beat = worldX / BEAT_W
      setPlaybackBeat(Math.max(0, beat))
    }

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true })
    canvas.addEventListener('pointermove', onPointerMove, { capture: true })
    canvas.addEventListener('pointerup', onPointerUp, { capture: true })
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('dblclick', onDblClick, { capture: true })

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true })
      canvas.removeEventListener('pointermove', onPointerMove, { capture: true })
      canvas.removeEventListener('pointerup', onPointerUp, { capture: true })
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('dblclick', onDblClick, { capture: true })
    }
  }, [gl, minimapCam, setPlaybackBeat])

  useFrame(({ gl, scene, size }) => {
    const o = camera as THREE.OrthographicCamera

    // Update minimap camera frustum to show all used content
    const usedBeats = notes.length > 0 ? Math.max(...notes.map(n => n.startBeat + n.duration)) : 0
    const usedMeas = Math.ceil(usedBeats / BEATS_PER_MEAS)
    const viewRight = (o.position.x - LEFT_MARGIN_W + halfWRef.current) / MEASURE_W
    const dispMeas = Math.max(usedMeas + 8, viewRight + 4, 20)
    const totalWorldW = dispMeas * MEASURE_W

    minimapCam.position.x = totalWorldW / 2
    minimapCam.left = -totalWorldW / 2
    minimapCam.right = +totalWorldW / 2
    minimapCam.top = CAM_HALF_H_TOP
    minimapCam.bottom = -CAM_HALF_H_BOT
    minimapCam.updateProjectionMatrix()

    // Update viewport rect geometry (layer 1 — only visible to minimapCam)
    if (viewportRectRef.current) {
      const pos = viewportRectRef.current.geometry.attributes.position as THREE.BufferAttribute
      const vl = o.position.x - LEFT_MARGIN_W - halfWRef.current
      const vr = o.position.x - LEFT_MARGIN_W + halfWRef.current
      pos.setXYZ(0, vl, CAM_HALF_H_TOP, 0.5)
      pos.setXYZ(1, vr, CAM_HALF_H_TOP, 0.5)
      pos.setXYZ(2, vr, -CAM_HALF_H_BOT, 0.5)
      pos.setXYZ(3, vl, -CAM_HALF_H_BOT, 0.5)
      pos.needsUpdate = true
    }

    // Apply minimap drag: move main camera to clicked world X
    if (minimapTargetXRef.current !== null) {
      const targetX = minimapTargetXRef.current
      minimapTargetXRef.current = null
      scrollTo(targetX)
      if (isFollowing) setFollowing(false)
    } else if (isFollowing) {
      const halfW = halfWRef.current
      const cursorX = playbackBeatRef.current * BEAT_W
      const usedBeats = notes.length > 0 ? Math.max(...notes.map(n => n.startBeat + n.duration)) : 0
      const usedMeas = Math.ceil(usedBeats / BEATS_PER_MEAS)
      const lastMeasStart = Math.max(0, (usedMeas - 1) * MEASURE_W)
      
      if (cursorX < lastMeasStart) {
        let targetX = cursorX - (MEASURE_W / 2) + halfW
        scrollTo(targetX)
      }
    }

    // Update minimap cursor position to track playback beat
    if (minimapCursorRef.current) {
      minimapCursorRef.current.position.x = useTablatureR3FStore.getState().playbackBeat * BEAT_W
    }

    gl.autoClear = false

    // 1. Main camera — full canvas
    gl.setScissorTest(false)
    gl.clearColor()
    gl.clearDepth()
    gl.render(scene, o)

    // 2. Minimap camera — overwrites bottom strip
    gl.setScissorTest(true)
    gl.setViewport(0, 0, size.width, MINIMAP_PX)
    gl.setScissor(0, 0, size.width, MINIMAP_PX)
    gl.clearColor()
    gl.clearDepth()
    gl.render(scene, minimapCam)

    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
    gl.autoClear = true
  }, 1)

  return (
    <>
      <lineLoop ref={viewportRectRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(4 * 3)}
            count={4}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </lineLoop>
      <mesh ref={minimapCursorRef} position={[0, marginY, 1]}>
        <planeGeometry args={[1.5, CAM_HALF_H_TOP + CAM_HALF_H_BOT]} />
        <meshBasicMaterial color={APPLE_GREEN} />
      </mesh>
    </>
  )
}
