import type { AxisName, CylindersState, QuadricsState, TraceResult } from '../types';
import { BOX_LIMIT, axisVarNames, type Vec3 } from './coords';
import { fmtFracSq, fmtNum, fmtTerm } from './latex';

function clip2DSegmentsToBox(
  pts: Array<[number, number]>,
  limit: number,
): Array<Array<[number, number]>> {
  const out: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];

  const inside = (p: [number, number]) =>
    Math.abs(p[0]) <= limit + 1e-4 && Math.abs(p[1]) <= limit + 1e-4;

  const clipSegment = (
    a: [number, number],
    b: [number, number],
  ): [[number, number], [number, number]] | null => {
    let t0 = 0;
    let t1 = 1;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const checks: Array<[number, number]> = [
      [-dx, a[0] + limit],
      [dx, limit - a[0]],
      [-dy, a[1] + limit],
      [dy, limit - a[1]],
    ];
    for (const [p, q] of checks) {
      if (Math.abs(p) < 1e-12) {
        if (q < 0) return null;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return null;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return null;
          if (r < t1) t1 = r;
        }
      }
    }
    return [
      [a[0] + t0 * dx, a[1] + t0 * dy],
      [a[0] + t1 * dx, a[1] + t1 * dy],
    ];
  };

  for (let i = 0; i < pts.length - 1; i++) {
    const seg = clipSegment(pts[i], pts[i + 1]);
    if (seg) {
      if (current.length === 0) {
        current.push(seg[0], seg[1]);
      } else {
        const last = current[current.length - 1];
        if (Math.hypot(last[0] - seg[0][0], last[1] - seg[0][1]) < 1e-3) {
          current.push(seg[1]);
        } else {
          out.push(current);
          current = [seg[0], seg[1]];
        }
      }
    } else if (current.length > 1) {
      out.push(current);
      current = [];
    } else {
      current = [];
    }
  }

  if (current.length > 1) {
    out.push(current);
  } else if (pts.length === 1 && inside(pts[0])) {
    out.push([pts[0]]);
  }

  return out;
}

function lift2DTo3D(pt: [number, number], plane: AxisName, k: number): Vec3 {
  if (plane === 'z') return [pt[0], pt[1], k];
  if (plane === 'y') return [pt[0], k, pt[1]];
  return [k, pt[0], pt[1]];
}

function solveConicSlice(
  A: number,
  B: number,
  Lh: number,
  Lv: number,
  K: number,
  hName: AxisName,
  vName: AxisName,
  slicePlane: AxisName,
  sliceK: number,
  limit: number,
): TraceResult {
  const curves2D: Array<Array<[number, number]>> = [];
  const points2D: Array<[number, number]> = [];
  let classification = { th: 'ไม่เกิดรอยตัด', en: 'No Intersection' };
  let equationLatex = '\\emptyset';

  const hasLh = Math.abs(Lh) > 1e-8;
  const hasLv = Math.abs(Lv) > 1e-8;

  if (!hasLh && !hasLv) {
    let cA = A;
    let cB = B;
    let cK = K;
    if ((cA < -1e-8 && cB <= 1e-8) || (cA <= 1e-8 && cB < -1e-8)) {
      cA = -cA;
      cB = -cB;
      cK = -cK;
    }

    if (Math.abs(cB) < 1e-8 && cA > 1e-8) {
      // cA * h^2 = cK -> vertical lines h = ±sqrt(cK/cA)
      const val = cK / cA;
      if (val > 1e-4) {
        const rh = Math.sqrt(val);
        classification = { th: 'เส้นตรงขนาน 2 เส้น', en: 'Two Parallel Lines' };
        equationLatex = `${hName} = \\pm ${fmtNum(rh)}`;
        curves2D.push(...clip2DSegmentsToBox([[rh, -limit], [rh, limit]], limit));
        curves2D.push(...clip2DSegmentsToBox([[-rh, -limit], [-rh, limit]], limit));
      } else if (Math.abs(val) <= 1e-4) {
        classification = { th: 'เส้นตรง 1 เส้น', en: 'Single Line' };
        equationLatex = `${hName} = 0`;
        curves2D.push(...clip2DSegmentsToBox([[0, -limit], [0, limit]], limit));
      } else {
        classification = { th: 'ไม่เกิดรอยตัด', en: 'No Intersection' };
        equationLatex = `${hName}^2 = ${fmtNum(val)} < 0 \\;(\\emptyset)`;
      }
    } else if (Math.abs(cA) < 1e-8 && cB > 1e-8) {
      // cB * v^2 = cK -> horizontal lines v = ±sqrt(cK/cB)
      const val = cK / cB;
      if (val > 1e-4) {
        const rv = Math.sqrt(val);
        classification = { th: 'เส้นตรงขนาน 2 เส้น', en: 'Two Parallel Lines' };
        equationLatex = `${vName} = \\pm ${fmtNum(rv)}`;
        curves2D.push(...clip2DSegmentsToBox([[-limit, rv], [limit, rv]], limit));
        curves2D.push(...clip2DSegmentsToBox([[-limit, -rv], [limit, -rv]], limit));
      } else if (Math.abs(val) <= 1e-4) {
        classification = { th: 'เส้นตรง 1 เส้น', en: 'Single Line' };
        equationLatex = `${vName} = 0`;
        curves2D.push(...clip2DSegmentsToBox([[-limit, 0], [limit, 0]], limit));
      } else {
        classification = { th: 'ไม่เกิดรอยตัด', en: 'No Intersection' };
        equationLatex = `${vName}^2 = ${fmtNum(val)} < 0 \\;(\\emptyset)`;
      }
    } else if (cA > 1e-8 && cB > 1e-8) {
      if (cK > 1e-4) {
        const rh2 = cK / cA;
        const rv2 = cK / cB;
        const rh = Math.sqrt(rh2);
        const rv = Math.sqrt(rv2);
        const isCircle = Math.abs(rh - rv) < 1e-4;
        classification = isCircle
          ? { th: 'วงกลม', en: 'Circle' }
          : { th: 'วงรี', en: 'Ellipse' };
        equationLatex = isCircle
          ? `${hName}^2 + ${vName}^2 = ${fmtNum(rh2)}`
          : `${fmtFracSq(hName, rh2)} + ${fmtFracSq(vName, rv2)} = 1`;

        const pts: Array<[number, number]> = [];
        const n = 96;
        for (let i = 0; i <= n; i++) {
          const t = (2 * Math.PI * i) / n;
          pts.push([rh * Math.cos(t), rv * Math.sin(t)]);
        }
        curves2D.push(...clip2DSegmentsToBox(pts, limit));
      } else if (Math.abs(cK) <= 1e-4) {
        classification = { th: 'จุดเดี่ยว', en: 'Single Point' };
        equationLatex = `(${hName}, ${vName}) = (0, 0)`;
        points2D.push([0, 0]);
      } else {
        classification = { th: 'ไม่เกิดรอยตัด', en: 'No Intersection' };
        equationLatex = `${fmtFracSq(hName, 1 / cA)} + ${fmtFracSq(vName, 1 / cB)} = ${fmtNum(cK)} < 0 \\;(\\emptyset)`;
      }
    } else {
      // Opposite signs: cA*h^2 + cB*v^2 = cK
      if (Math.abs(cK) <= 1e-4) {
        classification = { th: 'เส้นตรงตัดกัน 2 เส้น', en: 'Intersecting Lines' };
        const slope = Math.sqrt(Math.abs(cA / cB));
        equationLatex = `${vName} = \\pm ${fmtNum(slope)}${hName}`;
        const diag = limit * 1.4;
        curves2D.push(
          ...clip2DSegmentsToBox(
            [
              [-diag, -slope * diag],
              [diag, slope * diag],
            ],
            limit,
          ),
        );
        curves2D.push(
          ...clip2DSegmentsToBox(
            [
              [-diag, slope * diag],
              [diag, -slope * diag],
            ],
            limit,
          ),
        );
      } else {
        classification = { th: 'ไฮเพอร์โบลา', en: 'Hyperbola' };
        const rh2 = Math.abs(cK / cA);
        const rv2 = Math.abs(cK / cB);
        const rh = Math.sqrt(rh2);
        const rv = Math.sqrt(rv2);
        const opensAlongH = (cA > 0 && cK > 0) || (cA < 0 && cK < 0);

        equationLatex = opensAlongH
          ? `${fmtFracSq(hName, rh2)} - ${fmtFracSq(vName, rv2)} = 1`
          : `${fmtFracSq(vName, rv2)} - ${fmtFracSq(hName, rh2)} = 1`;

        const tMax = 3.4;
        const n = 72;
        for (const sign of [1, -1]) {
          const pts: Array<[number, number]> = [];
          for (let i = 0; i <= n; i++) {
            const t = -tMax + (2 * tMax * i) / n;
            if (opensAlongH) {
              pts.push([sign * rh * Math.cosh(t), rv * Math.sinh(t)]);
            } else {
              pts.push([rh * Math.sinh(t), sign * rv * Math.cosh(t)]);
            }
          }
          curves2D.push(...clip2DSegmentsToBox(pts, limit));
        }
      }
    }
  } else if (hasLv && Math.abs(A) < 1e-8) {
    // Lv * v = K -> horizontal line v = K / Lv
    const vConst = K / Lv;
    classification = { th: 'เส้นตรง 1 เส้น', en: 'Single Line' };
    equationLatex = `${vName} = ${fmtNum(vConst)}`;
    curves2D.push(...clip2DSegmentsToBox([[-limit, vConst], [limit, vConst]], limit));
  } else if (hasLh && Math.abs(B) < 1e-8) {
    // Lh * h = K -> vertical line h = K / Lh
    const hConst = K / Lh;
    classification = { th: 'เส้นตรง 1 เส้น', en: 'Single Line' };
    equationLatex = `${hName} = ${fmtNum(hConst)}`;
    curves2D.push(...clip2DSegmentsToBox([[hConst, -limit], [hConst, limit]], limit));
  } else if (hasLv) {
    classification = { th: 'พาราโบลา', en: 'Parabola' };
    const quadCoeff = -A / Lv;
    const shift = K / Lv;
    const hTerm = fmtTerm(quadCoeff, `${hName}^2`, true);
    const cTerm = Math.abs(shift) < 1e-9 ? '' : fmtTerm(shift, '', false);
    equationLatex = `${vName} = ${hTerm}${cTerm}`;

    const pts: Array<[number, number]> = [];
    const n = 96;
    const span = limit + 0.5;
    for (let i = 0; i <= n; i++) {
      const h = -span + (2 * span * i) / n;
      pts.push([h, quadCoeff * h * h + shift]);
    }
    curves2D.push(...clip2DSegmentsToBox(pts, limit));
  } else {
    classification = { th: 'พาราโบลา', en: 'Parabola' };
    const quadCoeff = -B / Lh;
    const shift = K / Lh;
    const vTerm = fmtTerm(quadCoeff, `${vName}^2`, true);
    const cTerm = Math.abs(shift) < 1e-9 ? '' : fmtTerm(shift, '', false);
    equationLatex = `${hName} = ${vTerm}${cTerm}`;

    const pts: Array<[number, number]> = [];
    const n = 96;
    const span = limit + 0.5;
    for (let i = 0; i <= n; i++) {
      const v = -span + (2 * span * i) / n;
      pts.push([quadCoeff * v * v + shift, v]);
    }
    curves2D.push(...clip2DSegmentsToBox(pts, limit));
  }

  return {
    classification,
    equationLatex,
    hAxisLabel: hName,
    vAxisLabel: vName,
    curves2D,
    points2D,
    curves3D: curves2D.map((poly) => poly.map((pt) => lift2DTo3D(pt, slicePlane, sliceK))),
    points3D: points2D.map((pt) => lift2DTo3D(pt, slicePlane, sliceK)),
  };
}

export function computeQuadricTrace(s: QuadricsState, limit = BOX_LIMIT): TraceResult {
  const { mode, symmetryAxis, a, b, c, slicePlane, sliceK: k } = s;
  const hName: AxisName = slicePlane === 'x' ? 'y' : 'x';
  const vName: AxisName = slicePlane === 'z' ? 'y' : 'z';

  const C: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  const L: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  let R = 0;
  const rhsC = Math.max(0.2, c);

  if (mode === 'ellipsoid') {
    C.x = 1 / (a * a);
    C.y = 1 / (b * b);
    C.z = 1 / (c * c);
    R = 1;
  } else {
    const { u, v, w } = axisVarNames(symmetryAxis);
    if (mode === 'cone') {
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      C[w] = -1 / (c * c);
      R = 0;
    } else if (mode === 'elliptic_paraboloid') {
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      L[w] = -s.paraboloidSign * rhsC;
      R = 0;
    } else if (mode === 'hyperbolic_paraboloid') {
      C[u] = 1 / (a * a);
      C[v] = -1 / (b * b);
      L[w] = -s.paraboloidSign * rhsC;
      R = 0;
    } else if (mode === 'hyperboloid_1') {
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      C[w] = -1 / (c * c);
      R = 1;
    } else {
      C[u] = -1 / (a * a);
      C[v] = -1 / (b * b);
      C[w] = 1 / (c * c);
      R = 1;
    }
  }

  const K = R - C[slicePlane] * k * k - L[slicePlane] * k;
  return solveConicSlice(
    C[hName],
    C[vName],
    L[hName],
    L[vName],
    K,
    hName,
    vName,
    slicePlane,
    k,
    limit,
  );
}

export function computeCylinderTrace(s: CylindersState, limit = BOX_LIMIT): TraceResult {
  const { type, missingAxis, hyperbolicSign, a, b, c, slicePlane, sliceK: k } = s;
  const hName: AxisName = slicePlane === 'x' ? 'y' : 'x';
  const vName: AxisName = slicePlane === 'z' ? 'y' : 'z';

  const C: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  const L: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  let R = 0;

  const { u, v } = axisVarNames(missingAxis);
  if (type === 'elliptic') {
    C[u] = 1 / (a * a);
    C[v] = 1 / (b * b);
    R = 1;
  } else if (type === 'hyperbolic') {
    C[u] = hyperbolicSign === 1 ? 1 / (a * a) : -1 / (a * a);
    C[v] = hyperbolicSign === 1 ? -1 / (b * b) : 1 / (b * b);
    R = 1;
  } else {
    // parabolic: a * u^2 - v = -c
    C[u] = a;
    L[v] = -1;
    R = -c;
  }

  const K = R - C[slicePlane] * k * k - L[slicePlane] * k;
  return solveConicSlice(
    C[hName],
    C[vName],
    L[hName],
    L[vName],
    K,
    hName,
    vName,
    slicePlane,
    k,
    limit,
  );
}
