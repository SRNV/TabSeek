/**
 * @file ModeZoneGradientMaterial.tsx
 * Three.js ShaderMaterial: solid tint wash for a Mode pod's influence zone.
 * Driven by local vertex position (not UV) to avoid PlaneGeometry UV direction ambiguity.
 * The tint is fully opaque for 80 % of the zone width, then ramps out to transparent
 * over the final `ramp` fraction so the eye anticipates the next Mode pod boundary.
 */
import React, { useMemo } from 'react'
import * as THREE from 'three'

const VERT = `
  varying vec2 vPos;
  void main(){
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = `
  uniform vec3 u_color;
  uniform float u_opacity;
  uniform float u_halfW;
  uniform float u_rampWidth;
  varying vec2 vPos;
  void main(){
    float t = 1.0 - clamp((vPos.x - (u_halfW - u_rampWidth)) / u_rampWidth, 0.0, 1.0);
    gl_FragColor = vec4(u_color, t * u_opacity);
    #include <colorspace_fragment>
  }
`

/**
 * Attaches a transparent tint shader material to the parent `<mesh>`.
 * Must be a direct child of a Three.js `<mesh>` element.
 *
 * @param color   Hex color of the tint wash.
 * @param width   Full width of the plane mesh in world units.
 * @param ramp    Fraction of `width` over which the tint fades to transparent at the right edge.
 * @param opacity Peak opacity of the tint (reached over the first `1 - ramp` fraction).
 */
export function ModeZoneGradientMaterial({ color, width, ramp, opacity }: {
  color: string
  width: number
  ramp: number
  opacity: number
}) {
  const halfW     = width / 2
  const rampWidth = Math.max(0.001, width * ramp)
  const material  = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      u_color:     { value: new THREE.Color(color) },
      u_halfW:     { value: halfW },
      u_rampWidth: { value: rampWidth },
      u_opacity:   { value: opacity },
    },
    vertexShader:   VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
  }), [color, halfW, rampWidth, opacity])
  return <primitive object={material} attach="material" />
}
