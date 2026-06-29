import * as THREE from 'three'

// ── Shared GLSL ───────────────────────────────────────────────────────────────
// uInvStretchX: set to 1.0 for isotropic scenes (fretboard), or to the
// inverse horizontal stretch for the tablature view.

export const RIBBON_VERT = /* glsl */`
  attribute vec3  aCenterPos;
  attribute vec3  aPerp;
  attribute vec3  aColor;
  attribute float aGlobalU;
  uniform float   uTime;
  uniform float   uInvStretchX;
  varying vec3    vColor;
  varying float   vV;
  void main() {
    vColor = aColor;
    vV     = uv.y;
    // Traveling wave pulse at 0.8 Hz
    float wavePos = fract(uTime * 0.8);
    float dist    = abs(aGlobalU - wavePos);
    float bell    = max(0.0, 1.0 - dist * 6.0);
    float wScale  = 1.0 + 0.9 * bell * bell;
    vec3  offset  = aPerp * vec3(uInvStretchX, 1.0, 1.0) * wScale;
    gl_Position   = projectionMatrix * modelViewMatrix * vec4(aCenterPos + offset, 1.0);
  }
`

export const RIBBON_FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vV;
  void main() {
    float edge    = abs(vV - 0.5) * 2.0;
    float borderT = smoothstep(0.55, 0.80, edge);
    vec3  orange  = vec3(1.0, 0.584, 0.0);  // #FF9500
    vec3  color   = mix(vColor, orange, borderT);
    float alpha   = (1.0 - smoothstep(0.82, 1.0, edge)) * 0.92;
    gl_FragColor  = vec4(color, alpha);
  }
`

// ── Material factory ──────────────────────────────────────────────────────────

export function createRibbonMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime:        { value: 0 },
      uInvStretchX: { value: 1.0 },
    },
    vertexShader:   RIBBON_VERT,
    fragmentShader: RIBBON_FRAG,
    transparent: true,
    depthTest:   false,
    depthWrite:  false,
    side: THREE.DoubleSide,
  })
}

// ── Pre-allocated geometry ────────────────────────────────────────────────────
// Each segment = 4 vertices (2 quads strips). Fill via fillRibbonGeoLinear.

export function createRibbonGeometry(maxSegments: number): THREE.BufferGeometry {
  const nV  = maxSegments * 4
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position',   new THREE.BufferAttribute(new Float32Array(nV * 3), 3))
  geo.setAttribute('aCenterPos', new THREE.BufferAttribute(new Float32Array(nV * 3), 3))
  geo.setAttribute('aPerp',      new THREE.BufferAttribute(new Float32Array(nV * 3), 3))
  geo.setAttribute('aColor',     new THREE.BufferAttribute(new Float32Array(nV * 3), 3))
  geo.setAttribute('aGlobalU',   new THREE.BufferAttribute(new Float32Array(nV), 1))
  geo.setAttribute('uv',         new THREE.BufferAttribute(new Float32Array(nV * 2), 2))
  const idx: number[] = []
  for (let s = 0; s < maxSegments; s++) {
    const b = s * 4
    idx.push(b, b+1, b+2,  b+2, b+1, b+3)
  }
  geo.setIndex(idx)
  return geo
}

// ── Linear in-place fill ──────────────────────────────────────────────────────

export interface RibbonWaypoint {
  x: number
  y: number
  z?: number
  color: THREE.Color
}

/**
 * Fill a pre-allocated ribbon geometry with linear segments between waypoints.
 * Colors are linearly interpolated across each pair of consecutive waypoints.
 * Unused segments are zeroed out.
 * Returns the number of active segments written.
 */
export function fillRibbonGeoLinear(
  geo: THREE.BufferGeometry,
  waypoints: RibbonWaypoint[],
  halfWidth: number,
  subdivisions: number,
  maxSegments: number,
): number {
  const posAttr = geo.attributes.position   as THREE.BufferAttribute
  const cpAttr  = geo.attributes.aCenterPos as THREE.BufferAttribute
  const prpAttr = geo.attributes.aPerp      as THREE.BufferAttribute
  const colAttr = geo.attributes.aColor     as THREE.BufferAttribute
  const guAttr  = geo.attributes.aGlobalU   as THREE.BufferAttribute
  const uvAttr  = geo.attributes.uv         as THREE.BufferAttribute

  const nPts   = waypoints.length
  let   segIdx = 0

  if (nPts >= 2) {
    const totalSegs = (nPts - 1) * subdivisions
    for (let i = 0; i < nPts - 1 && segIdx < maxSegments; i++) {
      const wp0 = waypoints[i]
      const wp1 = waypoints[i + 1]
      const z   = wp0.z ?? 0.001
      for (let s = 0; s < subdivisions && segIdx < maxSegments; s++) {
        const b  = segIdx * 4
        const t0 = s / subdivisions
        const t1 = (s + 1) / subdivisions
        const ax = wp0.x + (wp1.x - wp0.x) * t0
        const ay = wp0.y + (wp1.y - wp0.y) * t0
        const bx = wp0.x + (wp1.x - wp0.x) * t1
        const by = wp0.y + (wp1.y - wp0.y) * t1
        const dx  = bx - ax;  const dy = by - ay
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const px  = -dy / len * halfWidth
        const py  =  dx / len * halfWidth
        const gu0 = segIdx / totalSegs
        const gu1 = (segIdx + 1) / totalSegs
        const cA  = wp0.color.clone().lerp(wp1.color, t0)
        const cB  = wp0.color.clone().lerp(wp1.color, t1)

        cpAttr.setXYZ(b,   ax, ay, z); cpAttr.setXYZ(b+1, ax, ay, z)
        cpAttr.setXYZ(b+2, bx, by, z); cpAttr.setXYZ(b+3, bx, by, z)
        prpAttr.setXYZ(b,   -px, -py, 0); prpAttr.setXYZ(b+1, px, py, 0)
        prpAttr.setXYZ(b+2, -px, -py, 0); prpAttr.setXYZ(b+3, px, py, 0)
        posAttr.setXYZ(b,   ax-px, ay-py, z); posAttr.setXYZ(b+1, ax+px, ay+py, z)
        posAttr.setXYZ(b+2, bx-px, by-py, z); posAttr.setXYZ(b+3, bx+px, by+py, z)
        guAttr.setX(b,   gu0); guAttr.setX(b+1, gu0)
        guAttr.setX(b+2, gu1); guAttr.setX(b+3, gu1)
        uvAttr.setXY(b,   0, 0); uvAttr.setXY(b+1, 0, 1)
        uvAttr.setXY(b+2, 1, 0); uvAttr.setXY(b+3, 1, 1)
        colAttr.setXYZ(b,   cA.r, cA.g, cA.b); colAttr.setXYZ(b+1, cA.r, cA.g, cA.b)
        colAttr.setXYZ(b+2, cB.r, cB.g, cB.b); colAttr.setXYZ(b+3, cB.r, cB.g, cB.b)
        segIdx++
      }
    }
  }

  for (let s = segIdx; s < maxSegments; s++) {
    const b = s * 4
    for (let v = 0; v < 4; v++) {
      posAttr.setXYZ(b+v, 0, 0, 0); cpAttr.setXYZ(b+v, 0, 0, 0)
      prpAttr.setXYZ(b+v, 0, 0, 0); colAttr.setXYZ(b+v, 0, 0, 0)
      guAttr.setX(b+v, 0);           uvAttr.setXY(b+v, 0, 0)
    }
  }

  posAttr.needsUpdate = true;  cpAttr.needsUpdate  = true
  prpAttr.needsUpdate = true;  colAttr.needsUpdate = true
  guAttr.needsUpdate  = true;  uvAttr.needsUpdate  = true

  return segIdx
}

// ── CatmullRom geometry builder ───────────────────────────────────────────────
// Builds a new BufferGeometry each call (use when the path changes reactively).

export function buildRibbonGeoCatmullRom(
  chain: THREE.Vector3[],
  chainColors: THREE.Color[],
  halfWidth: number,
  subdivisions: number,
  z = -0.02,
): THREE.BufferGeometry | null {
  if (chain.length < 2) return null
  const curve   = new THREE.CatmullRomCurve3(chain, false, 'centripetal')
  const nV      = (subdivisions + 1) * 2
  const pos       = new Float32Array(nV * 3)
  const centerPos = new Float32Array(nV * 3)
  const perpArr   = new Float32Array(nV * 3)
  const colorArr  = new Float32Array(nV * 3)
  const globalU   = new Float32Array(nV)
  const uvs       = new Float32Array(nV * 2)
  const indices: number[] = []
  const tmpCol = new THREE.Color()

  for (let i = 0; i <= subdivisions; i++) {
    const t       = i / subdivisions
    const p       = curve.getPoint(t)
    const tangent = curve.getTangent(t).normalize()
    const colorT  = t * (chainColors.length - 1)
    const cIdx    = Math.min(chainColors.length - 2, Math.floor(colorT))
    const cFrac   = colorT - cIdx
    tmpCol.copy(chainColors[cIdx]).lerp(chainColors[cIdx + 1] ?? chainColors[cIdx], cFrac)
    const ux = -tangent.y;  const uy = tangent.x
    const base = i * 2
    for (let j = 0; j < 2; j++) {
      const side = j === 0 ? -1 : 1
      const vi   = base + j
      pos.set([p.x + ux * halfWidth * side, p.y + uy * halfWidth * side, z], vi * 3)
      centerPos.set([p.x, p.y, z], vi * 3)
      perpArr.set([ux * halfWidth * side, uy * halfWidth * side, 0], vi * 3)
      colorArr.set([tmpCol.r, tmpCol.g, tmpCol.b], vi * 3)
      globalU[vi] = t
      uvs.set([t, j], vi * 2)
    }
  }
  for (let i = 0; i < subdivisions; i++) {
    const b = i * 2
    indices.push(b, b+1, b+2,  b+2, b+1, b+3)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position',   new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aCenterPos', new THREE.BufferAttribute(centerPos, 3))
  geo.setAttribute('aPerp',      new THREE.BufferAttribute(perpArr, 3))
  geo.setAttribute('aColor',     new THREE.BufferAttribute(colorArr, 3))
  geo.setAttribute('aGlobalU',   new THREE.BufferAttribute(globalU, 1))
  geo.setAttribute('uv',         new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  return geo
}
