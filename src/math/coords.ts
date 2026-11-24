import * as THREE from 'three';
import type { AxisName, BilingualLabel, Vec3Tuple } from '../types';

export const BOX_LIMIT = 5.5;

export type Vec3 = [number, number, number];

export interface MathVertex {
  p: Vec3;
  n: Vec3;
}

/**
 * Maps textbook math coordinates (+x forward-left, +y right, +z up)
 * to Three.js world coordinates (+X right, +Y up, +Z forward).
 */
export function mathToThree(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(y, z, x);
}

export function mathVecToThree(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[1], v[2], v[0]);
}

export function axisPermute(u: number, v: number, w: number, axis: AxisName): Vec3 {
  if (axis === 'x') return [w, u, v];
  if (axis === 'y') return [u, w, v];
  return [u, v, w];
}

export function axisVarNames(axis: AxisName): { u: AxisName; v: AxisName; w: AxisName } {
  if (axis === 'x') return { u: 'y', v: 'z', w: 'x' };
  if (axis === 'y') return { u: 'x', v: 'z', w: 'y' };
  return { u: 'x', v: 'y', w: 'z' };
}

export function getOctant(p: Vec3Tuple): { roman: string | null; label: BilingualLabel } {
  const [x, y, z] = p;
  const eps = 1e-6;
  if (Math.abs(x) < eps && Math.abs(y) < eps && Math.abs(z) < eps) {
    return {
      roman: null,
      label: { th: 'จุดกำเนิด (0, 0, 0)', en: 'Origin (0, 0, 0)' },
    };
  }
  if (Math.abs(x) < eps || Math.abs(y) < eps || Math.abs(z) < eps) {
    const zeros: string[] = [];
    if (Math.abs(x) < eps) zeros.push('x=0');
    if (Math.abs(y) < eps) zeros.push('y=0');
    if (Math.abs(z) < eps) zeros.push('z=0');
    return {
      roman: null,
      label: {
        th: `อยู่บนแกน/ระนาบ (${zeros.join(', ')})`,
        en: `On Plane/Axis (${zeros.join(', ')})`,
      },
    };
  }

  let roman = 'I';
  if (z > 0) {
    if (x > 0 && y > 0) roman = 'I';
    else if (x < 0 && y > 0) roman = 'II';
    else if (x < 0 && y < 0) roman = 'III';
    else roman = 'IV';
  } else {
    if (x > 0 && y > 0) roman = 'V';
    else if (x < 0 && y > 0) roman = 'VI';
    else if (x < 0 && y < 0) roman = 'VII';
    else roman = 'VIII';
  }
  return {
    roman,
    label: {
      th: `อัฐภาคที่ ${roman}`,
      en: `Octant ${roman}`,
    },
  };
}

function clipPolygonHalfSpace(
  poly: MathVertex[],
  coordIdx: 0 | 1 | 2,
  bound: number,
  isMin: boolean,
): MathVertex[] {
  if (poly.length === 0) return [];
  const out: MathVertex[] = [];

  const inside = (v: MathVertex) =>
    isMin ? v.p[coordIdx] >= bound - 1e-6 : v.p[coordIdx] <= bound + 1e-6;

  const intersect = (a: MathVertex, b: MathVertex): MathVertex => {
    const va = a.p[coordIdx];
    const vb = b.p[coordIdx];
    const denom = vb - va;
    const t = Math.abs(denom) < 1e-12 ? 0 : Math.max(0, Math.min(1, (bound - va) / denom));
    const p: Vec3 = [
      a.p[0] + t * (b.p[0] - a.p[0]),
      a.p[1] + t * (b.p[1] - a.p[1]),
      a.p[2] + t * (b.p[2] - a.p[2]),
    ];
    p[coordIdx] = bound;
    const nx = a.n[0] + t * (b.n[0] - a.n[0]);
    const ny = a.n[1] + t * (b.n[1] - a.n[1]);
    const nz = a.n[2] + t * (b.n[2] - a.n[2]);
    const len = Math.hypot(nx, ny, nz) || 1;
    return { p, n: [nx / len, ny / len, nz / len] };
  };

  for (let i = 0; i < poly.length; i++) {
    const curr = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const currIn = inside(curr);
    const prevIn = inside(prev);

    if (currIn) {
      if (!prevIn) out.push(intersect(prev, curr));
      out.push(curr);
    } else if (prevIn) {
      out.push(intersect(prev, curr));
    }
  }
  return out;
}

export function clipTriangleToBounds(
  a: MathVertex,
  b: MathVertex,
  c: MathVertex,
  bounds: [number, number, number, number, number, number] = [
    -BOX_LIMIT,
    BOX_LIMIT,
    -BOX_LIMIT,
    BOX_LIMIT,
    -BOX_LIMIT,
    BOX_LIMIT,
  ],
): Array<[MathVertex, MathVertex, MathVertex]> {
  let poly: MathVertex[] = [a, b, c];
  poly = clipPolygonHalfSpace(poly, 0, bounds[0], true);
  poly = clipPolygonHalfSpace(poly, 0, bounds[1], false);
  poly = clipPolygonHalfSpace(poly, 1, bounds[2], true);
  poly = clipPolygonHalfSpace(poly, 1, bounds[3], false);
  poly = clipPolygonHalfSpace(poly, 2, bounds[4], true);
  poly = clipPolygonHalfSpace(poly, 2, bounds[5], false);

  if (poly.length < 3) return [];

  const tris: Array<[MathVertex, MathVertex, MathVertex]> = [];
  for (let i = 1; i < poly.length - 1; i++) {
    tris.push([poly[0], poly[i], poly[i + 1]]);
  }
  return tris;
}

function colorForHeight(
  z: number,
  limit: number,
  scheme: 'teal' | 'indigo' | 'amber' = 'teal',
): [number, number, number] {
  const t = Math.max(0, Math.min(1, (z + limit) / (2 * limit)));
  if (scheme === 'amber') {
    const r = 0.85 + 0.12 * t;
    const g = 0.35 + 0.45 * t;
    const b = 0.18 + 0.18 * (1 - t);
    return [r, g, b];
  }
  if (scheme === 'indigo') {
    const r = 0.22 + 0.14 * t;
    const g = 0.34 + 0.48 * t;
    const b = 0.78 + 0.16 * t;
    return [r, g, b];
  }
  const r = 0.08 + 0.18 * t;
  const g = 0.36 + 0.46 * t;
  const b = 0.68 + 0.26 * (1 - Math.abs(t - 0.5));
  return [r, g, b];
}

export function buildBufferGeometryFromTriangles(
  triangles: Array<[MathVertex, MathVertex, MathVertex]>,
  colorScheme: 'teal' | 'indigo' | 'amber' = 'teal',
  colorLimit: number = BOX_LIMIT,
): THREE.BufferGeometry {
  const positions = new Float32Array(triangles.length * 9);
  const normals = new Float32Array(triangles.length * 9);
  const colors = new Float32Array(triangles.length * 9);

  let idx = 0;
  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    for (let j = 0; j < 3; j++) {
      const v = tri[j];
      positions[idx] = v.p[1];
      positions[idx + 1] = v.p[2];
      positions[idx + 2] = v.p[0];

      normals[idx] = v.n[1];
      normals[idx + 1] = v.n[2];
      normals[idx + 2] = v.n[0];

      const [r, g, b] = colorForHeight(v.p[2], colorLimit, colorScheme);
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;

      idx += 3;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.computeBoundingSphere();
  return geom;
}

export function clipSegmentToBox(
  p0: Vec3,
  p1: Vec3,
  limit: number = BOX_LIMIT,
): [Vec3, Vec3] | null {
  let t0 = 0;
  let t1 = 1;
  const d: Vec3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];

  for (let i = 0; i < 3; i++) {
    const p = [-d[i], d[i]];
    const q = [p0[i] + limit, limit - p0[i]];
    for (let k = 0; k < 2; k++) {
      if (Math.abs(p[k]) < 1e-12) {
        if (q[k] < 0) return null;
      } else {
        const r = q[k] / p[k];
        if (p[k] < 0) {
          if (r > t1) return null;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return null;
          if (r < t1) t1 = r;
        }
      }
    }
  }

  return [
    [p0[0] + t0 * d[0], p0[1] + t0 * d[1], p0[2] + t0 * d[2]],
    [p0[0] + t1 * d[0], p0[1] + t1 * d[1], p0[2] + t1 * d[2]],
  ];
}
