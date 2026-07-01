/**
 * @file PodGradientMaterial.tsx
 * Three.js ShaderMaterial: left-to-right gradient (degree color → disc color)
 * over one measure's width, with an optional 2 Hz pulse on the fundamental note.
 * The gray-out transition (active ↔ inactive note) is eased over ~0.5 s in `useFrame`.
 */
import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LANE_COL_HEX } from './sceneConstants'

const VERT = `
  varying vec2 vPos;
  void main(){
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = `
  uniform vec3  u_colorA;
  uniform vec3  u_colorB;
  uniform vec3  u_laneCol;
  uniform float u_halfW;
  uniform float u_gradWidth;
  uniform float u_time;
  uniform float u_blink;
  uniform float u_gray;
  varying vec2 vPos;
  void main(){
    float t = clamp((vPos.x + u_halfW) / u_gradWidth, 0.0, 1.0);
    vec3 col = mix(u_colorA, u_colorB, t);
    if (u_blink > 0.5) {
      float pulse = (sin(u_time*12.5663706)+1.0)*0.5;
      col = col + (1.0 - col) * 0.40 * pulse;
    }
    col = mix(col, u_laneCol, u_gray);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/**
 * Attaches a gradient shader material to the parent `<mesh>`.
 * Must be a direct child of a Three.js `<mesh>` element.
 */
export function PodGradientMaterial({ colorA, colorB, halfW, gradWidth, blink, grayTarget }: {
  /** Left-edge color (degree/mode hex). */
  colorA: string
  /** Right-edge color (disc background hex). */
  colorB: string
  /** Half-width of the mesh (world units). */
  halfW: number
  /** Width over which the gradient runs, typically `MEASURE_W`. */
  gradWidth: number
  /** Enable 2 Hz pulse for the fundamental note. */
  blink: boolean
  /** Target gray blend factor: 0 = full color, 1 = lane background color. */
  grayTarget: number
}) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      u_colorA:    { value: new THREE.Color(colorA) },
      u_colorB:    { value: new THREE.Color(colorB) },
      u_laneCol:   { value: new THREE.Color(LANE_COL_HEX) },
      u_halfW:     { value: halfW },
      u_gradWidth: { value: gradWidth },
      u_time:      { value: 0 },
      u_blink:     { value: blink ? 1 : 0 },
      u_gray:      { value: grayTarget },
    },
    vertexShader:   VERT,
    fragmentShader: FRAG,
  }), [colorA, colorB, halfW, gradWidth, blink])

  useFrame((state, delta) => {
    if (blink) material.uniforms.u_time.value = state.clock.getElapsedTime()
    const u = material.uniforms.u_gray
    u.value += (grayTarget - u.value) * (1 - Math.pow(0.01, delta / 0.5))
  })

  return <primitive object={material} attach="material" />
}
