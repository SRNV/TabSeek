/**
 * @file useTablatureCamera.ts
 * Custom hook for managing the R3F OrthographicCamera in the tablature view.
 * Handles zooming (toward cursor), scrolling, and infinite measure expansion.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useTablatureR3FStore } from '../stores/useTablatureR3FStore'
import {
  MEASURE_W, LEFT_MARGIN_W, CAM_HALF_H_TOP, CAM_HALF_H_BOT,
  stringY, N_STRINGS
} from '../utils/tabUtils'
import {
  INITIAL_MEASURES, TRIGGER_FRAC, EXTEND_FRAC, SCROLL_SPEED
} from '../components/tablature/scene/sceneConstants'

const ZOOM_MIN = 1
const ZOOM_MAX = 10

interface UseTablatureCameraParams {
  tuningArr: string[]
  onStringYPcts: (pcts: number[]) => void
}

export function useTablatureCamera({ tuningArr, onStringYPcts }: UseTablatureCameraParams) {
  const { camera, size, gl } = useThree()
  
  const [totalMeasures, setTotalMeasures] = useState(INITIAL_MEASURES)
  const totalMeasRef = useRef(INITIAL_MEASURES)
  const [scrollX, setScrollX] = useState(0)
  const halfWRef = useRef(50)
  const visibleMeasRef = useRef(0)

  const applyCameraW = useCallback((o: THREE.OrthographicCamera, halfW: number) => {
    halfWRef.current = halfW
    o.left = -halfW - LEFT_MARGIN_W
    o.right = halfW - LEFT_MARGIN_W
    const maxX = totalMeasRef.current * MEASURE_W + halfW
    o.position.x = Math.max(halfW, Math.min(maxX, o.position.x))
    o.updateProjectionMatrix()
    setScrollX(o.position.x)
  }, [])

  const scrollTo = useCallback((targetX: number) => {
    const o = camera as THREE.OrthographicCamera
    const halfW = halfWRef.current
    const maxX = totalMeasRef.current * MEASURE_W + halfW
    o.position.x = Math.max(halfW, Math.min(maxX, targetX))
    o.updateProjectionMatrix()
    setScrollX(o.position.x)
  }, [camera])

  // Initial setup and resize
  useEffect(() => {
    const o = camera as THREE.OrthographicCamera
    const aspect = size.width / size.height
    const camH = CAM_HALF_H_TOP + CAM_HALF_H_BOT

    if (visibleMeasRef.current === 0) {
      const autoHalfW = (camH * aspect) / 2
      visibleMeasRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (autoHalfW * 2) / MEASURE_W))
    }
    
    const halfW = (visibleMeasRef.current * MEASURE_W) / 2
    o.top    = CAM_HALF_H_TOP
    o.bottom = -CAM_HALF_H_BOT
    o.left   = -halfW - LEFT_MARGIN_W
    o.right  = +halfW - LEFT_MARGIN_W
    o.zoom   = 1
    o.position.y = 0
    if (!o.position.x || o.position.x < halfW) o.position.x = halfW
    o.position.z = 10
    
    o.updateProjectionMatrix()
    setScrollX(o.position.x)
    halfWRef.current = halfW

    const pcts = Array.from({ length: N_STRINGS }, (_, si) => {
      const wy = stringY(si); return (o.top - wy) / camH * 100
    })
    onStringYPcts(pcts)
  }, [camera, size, onStringYPcts, tuningArr])

  // Wheel events (zoom/scroll)
  useEffect(() => {
    const canvas = gl.domElement
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const o = camera as THREE.OrthographicCamera
      const state = useTablatureR3FStore.getState()

      if (e.ctrlKey || e.metaKey) {
        const norm = e.deltaMode === 0 ? e.deltaY / 100 : e.deltaY
        const oldHalfW = halfWRef.current
        visibleMeasRef.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, visibleMeasRef.current + norm * 0.5))
        const newHalfW = (visibleMeasRef.current * MEASURE_W) / 2
        const rect = canvas.getBoundingClientRect()
        const ndx = ((e.clientX - rect.left) / rect.width) * 2 - 1
        o.position.x += ndx * (oldHalfW - newHalfW)
        applyCameraW(o, newHalfW)
        if (state.isFollowing) state.setFollowing(false)
      } else {
        const dX = e.deltaX !== 0 ? e.deltaX : e.deltaY
        const halfW = halfWRef.current
        const maxX = totalMeasRef.current * MEASURE_W + halfW
        o.position.x = Math.max(halfW, Math.min(maxX, o.position.x + dX * SCROLL_SPEED))
        o.updateProjectionMatrix()
        setScrollX(o.position.x)
        const prog = (o.position.x - halfW) / (totalMeasRef.current * MEASURE_W)
        if (prog >= TRIGGER_FRAC) {
          const next = Math.ceil(totalMeasRef.current * (1 + EXTEND_FRAC))
          if (next > totalMeasRef.current) { totalMeasRef.current = next; setTotalMeasures(next) }
        }
        if (state.isFollowing) state.setFollowing(false)
      }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [camera, gl, applyCameraW])

  return {
    totalMeasures,
    scrollX,
    halfWRef,
    setTotalMeasures,
    totalMeasRef,
    scrollTo,
    applyCameraW
  }
}
