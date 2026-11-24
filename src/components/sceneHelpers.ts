import * as THREE from 'three';
import { mathToThree, mathVecToThree, type Vec3 } from '../math/coords';

export function makeTextSprite(
  text: string,
  color: string,
  bgColor?: string,
  scale = 0.65,
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 44;
  ctx.font = `700 ${fontSize}px Inter, "IBM Plex Sans Thai", "Sarabun", sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const isHalo = !bgColor || bgColor === 'halo' || bgColor === 'halo-dark';
  const padX = isHalo ? 14 : 22;
  const padY = isHalo ? 10 : 14;
  canvas.width = Math.max(64, Math.ceil(textWidth + padX * 2));
  canvas.height = Math.ceil(fontSize + padY * 2);

  ctx.font = `700 ${fontSize}px Inter, "IBM Plex Sans Thai", "Sarabun", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (bgColor && !isHalo) {
    ctx.fillStyle = bgColor;
    const r = 14;
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
  }

  if (isHalo) {
    ctx.strokeStyle =
      bgColor === 'halo-dark' ? 'rgba(15,23,42,0.92)' : 'rgba(248,250,252,0.95)';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + 2);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(scale * aspect, scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}

export function addPolyline(
  group: THREE.Group,
  pts: Vec3[],
  color: number | string,
  opacity = 1,
  dashed = false,
) {
  if (pts.length < 2) return;
  const threePts = pts.map((p) => mathVecToThree(p));
  const geom = new THREE.BufferGeometry().setFromPoints(threePts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({
        color,
        dashSize: 0.22,
        gapSize: 0.14,
        transparent: opacity < 1,
        opacity,
      })
    : new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      });
  const line = new THREE.Line(geom, mat);
  if (dashed) line.computeLineDistances();
  group.add(line);
}

export function addThickCurve(
  group: THREE.Group,
  pts: Vec3[],
  color: number | string,
  radius = 0.055,
) {
  if (pts.length < 2) return;
  const threePts = pts.map((p) => mathVecToThree(p));
  const curve =
    threePts.length === 2
      ? new THREE.LineCurve3(threePts[0], threePts[1])
      : new THREE.CatmullRomCurve3(threePts, false, 'centripetal', 0.05);
  const segs = threePts.length === 2 ? 2 : Math.min(140, threePts.length * 2);
  const geom = new THREE.TubeGeometry(curve, segs, radius, 8, false);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.renderOrder = 10;
  group.add(mesh);
}

export function addLabeledSphere(
  group: THREE.Group,
  pt: Vec3,
  color: string,
  label?: string,
  darkMode = false,
  radius = 0.13,
  labelOffsetY = 0.36,
) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 20),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 }),
  );
  const pos3 = mathVecToThree(pt);
  sphere.position.copy(pos3);
  sphere.renderOrder = 12;
  group.add(sphere);

  if (label) {
    const sp = makeTextSprite(
      label,
      color,
      darkMode ? 'halo-dark' : 'halo',
      0.5,
    );
    sp.position.copy(pos3).add(new THREE.Vector3(0, labelOffsetY, 0));
    group.add(sp);
  }
}

export function addCoordinateBox(
  group: THREE.Group,
  pt: Vec3,
  color: string,
  opacity = 0.55,
) {
  const [x, y, z] = pt;
  const edges: Array<[Vec3, Vec3]> = [
    [[x, 0, 0], [x, y, 0]],
    [[0, y, 0], [x, y, 0]],
    [[x, y, 0], [x, y, z]],
    [[0, 0, z], [x, 0, z]],
    [[0, 0, z], [0, y, z]],
    [[x, 0, 0], [x, 0, z]],
    [[0, y, 0], [0, y, z]],
    [[x, 0, z], [x, y, z]],
    [[0, y, z], [x, y, z]],
  ];
  for (const [a, b] of edges) {
    if (Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) > 1e-4) {
      addPolyline(group, [a, b], color, opacity, true);
    }
  }
}

export function addQuadPatch(
  group: THREE.Group,
  cornersMath: [Vec3, Vec3, Vec3, Vec3],
  color: string | number,
  opacity = 0.18,
  borderOpacity = 0.65,
  dashedBorder = false,
) {
  const cThree = cornersMath.map((c) => mathVecToThree(c));
  const geom = new THREE.BufferGeometry().setFromPoints([
    cThree[0],
    cThree[1],
    cThree[2],
    cThree[0],
    cThree[2],
    cThree[3],
  ]);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));
  addPolyline(
    group,
    [cornersMath[0], cornersMath[1], cornersMath[2], cornersMath[3], cornersMath[0]],
    color,
    borderOpacity,
    dashedBorder,
  );
}

export function addAxesSet(
  group: THREE.Group,
  origin: Vec3,
  posLen: number,
  negLen: number,
  isShifted: boolean,
  darkMode: boolean,
) {
  const ox = origin[0];
  const oy = origin[1];
  const oz = origin[2];
  const oThree = mathToThree(ox, oy, oz);

  const axisDefs: Array<{
    dirMath: Vec3;
    label: string;
    color: string;
    negColor: string;
  }> = isShifted
    ? [
        { dirMath: [1, 0, 0], label: "x'", color: '#f97316', negColor: '#fb923c' },
        { dirMath: [0, 1, 0], label: "y'", color: '#f97316', negColor: '#fb923c' },
        { dirMath: [0, 0, 1], label: "z'", color: '#f97316', negColor: '#fb923c' },
      ]
    : [
        { dirMath: [1, 0, 0], label: 'x', color: '#ef4444', negColor: darkMode ? '#7f1d1d' : '#fca5a5' },
        { dirMath: [0, 1, 0], label: 'y', color: '#10b981', negColor: darkMode ? '#064e3b' : '#6ee7b7' },
        { dirMath: [0, 0, 1], label: 'z', color: '#3b82f6', negColor: darkMode ? '#1e3a8a' : '#93c5fd' },
      ];

  for (const ax of axisDefs) {
    const dirThree = mathVecToThree(ax.dirMath).normalize();
    const arrow = new THREE.ArrowHelper(
      dirThree,
      oThree,
      posLen,
      ax.color,
      0.34,
      0.16,
    );
    group.add(arrow);

    if (negLen > 0) {
      const pNeg: Vec3 = [
        ox - ax.dirMath[0] * negLen,
        oy - ax.dirMath[1] * negLen,
        oz - ax.dirMath[2] * negLen,
      ];
      addPolyline(group, [origin, pNeg], ax.negColor, isShifted ? 0.55 : 0.7, true);
    }

    const labelPos = oThree.clone().addScaledVector(dirThree, posLen + 0.35);
    const sprite = makeTextSprite(
      ax.label,
      ax.color,
      darkMode ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.85)',
      isShifted ? 0.55 : 0.62,
    );
    sprite.position.copy(labelPos);
    group.add(sprite);

    if (!isShifted) {
      const tickColor = darkMode ? 0x64748b : 0x94a3b8;
      const perp: Vec3 = ax.dirMath[2] === 1 ? [0.08, 0, 0] : [0, 0, 0.08];
      const tickLim = Math.floor(negLen);
      for (let t = -tickLim; t <= tickLim; t++) {
        if (t === 0) continue;
        const base: Vec3 = [
          ox + ax.dirMath[0] * t,
          oy + ax.dirMath[1] * t,
          oz + ax.dirMath[2] * t,
        ];
        addPolyline(
          group,
          [
            [base[0] - perp[0], base[1] - perp[1], base[2] - perp[2]],
            [base[0] + perp[0], base[1] + perp[1], base[2] + perp[2]],
          ],
          tickColor,
          0.85,
        );
      }
    }
  }
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) m?.dispose();
    } else if (obj instanceof THREE.Sprite) {
      obj.material.map?.dispose();
      obj.material.dispose();
    }
  });
}
