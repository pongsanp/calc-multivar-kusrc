import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  AxisName,
  CameraPreset,
  CoordsState,
  CylindersState,
  ModuleTab,
  PlanesState,
  QuadricsState,
  TraceResult,
  TranslationState,
  ViewerSettings,
} from '../types';
import { BOX_LIMIT, mathVecToThree, type Vec3 } from '../math/coords';
import {
  buildCylinderGeometry,
  buildPlaneGeometry,
  buildQuadricGeometry,
  buildTranslationGeometry,
  type SurfaceBuildResult,
} from '../math/surfaceBuilders';
import { fmtNum, fmtPoint } from '../math/latex';
import {
  addAxesSet,
  addCoordinateBox,
  addLabeledSphere,
  addPolyline,
  addQuadPatch,
  addThickCurve,
  disposeObject3D,
  makeTextSprite,
} from './sceneHelpers';

interface Scene3DProps {
  activeTab: ModuleTab;
  coords: CoordsState;
  planes: PlanesState;
  cylinders: CylindersState;
  quadrics: QuadricsState;
  translation: TranslationState;
  traceResult: TraceResult | null;
  settings: ViewerSettings;
  cameraCommand: { preset: CameraPreset; seq: number } | null;
  onWarningChange?: (warning: { th: string; en: string } | null) => void;
}

function getCameraPositionForPreset(preset: CameraPreset): Vec3 {
  switch (preset) {
    case 'top':
      return [0, -0.01, 16.5];
    case 'front':
      return [16.5, 0, 0];
    case 'side':
      return [0, -16.5, 0];
    case 'isometric':
    default:
      return [11.2, 11.2, 8.6];
  }
}

export function Scene3D({
  activeTab,
  coords,
  planes,
  cylinders,
  quadrics,
  translation,
  traceResult,
  settings,
  cameraCommand,
  onWarningChange,
}: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    const iso = getCameraPositionForPreset('isometric');
    camera.position.copy(mathVecToThree(iso));
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 4;
    controls.maxDistance = 42;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.65);
    scene.add(hemi);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dir1.position.set(10, 16, 12);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xbae6fd, 0.45);
    dir2.position.set(-12, -8, -10);
    scene.add(dir2);

    const axesGroup = new THREE.Group();
    scene.add(axesGroup);
    axesGroupRef.current = axesGroup;

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);
    contentGroupRef.current = contentGroup;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(100, entry.contentRect.width);
        const h = Math.max(100, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const axesGroup = axesGroupRef.current;
    const controls = controlsRef.current;
    if (!scene || !axesGroup || !controls) return;

    scene.background = new THREE.Color(settings.darkMode ? 0x0b1120 : 0xf8fafc);
    controls.autoRotate = settings.autoRotate;
    controls.autoRotateSpeed = 1.4;

    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current.geometry.dispose();
      const mat = gridHelperRef.current.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
      gridHelperRef.current = null;
    }

    if (settings.showGrid) {
      const gridSize = activeTab === 'translation' ? 14 : 12;
      const grid = new THREE.GridHelper(
        gridSize,
        gridSize,
        settings.darkMode ? 0x334155 : 0xcbd5e1,
        settings.darkMode ? 0x1e293b : 0xe2e8f0,
      );
      grid.position.y = -0.002;
      scene.add(grid);
      gridHelperRef.current = grid;
    }

    while (axesGroup.children.length > 0) {
      const child = axesGroup.children[0];
      axesGroup.remove(child);
      disposeObject3D(child);
    }
    const isTranslation = activeTab === 'translation';
    const posSpan = isTranslation ? 6.8 : 6.1;
    const negSpan = isTranslation ? 6.0 : 5.2;
    addAxesSet(axesGroup, [0, 0, 0], posSpan, negSpan, false, settings.darkMode);
  }, [settings.darkMode, settings.showGrid, settings.autoRotate, activeTab]);

  useEffect(() => {
    if (!cameraCommand || !cameraRef.current || !controlsRef.current) return;
    const pos = getCameraPositionForPreset(cameraCommand.preset);
    cameraRef.current.position.copy(mathVecToThree(pos));
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [cameraCommand]);

  useEffect(() => {
    const contentGroup = contentGroupRef.current;
    if (!contentGroup) return;

    while (contentGroup.children.length > 0) {
      const child = contentGroup.children[0];
      contentGroup.remove(child);
      disposeObject3D(child);
    }

    const renderSurfaceResult = (
      res: SurfaceBuildResult,
      options: { isGhost?: boolean } = {},
    ) => {
      const { isGhost = false } = options;
      const mat = isGhost
        ? new THREE.MeshPhongMaterial({
            color: settings.darkMode ? 0x818cf8 : 0x6366f1,
            transparent: true,
            opacity: 0.16,
            wireframe: false,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        : new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.45,
            metalness: 0.08,
            side: THREE.DoubleSide,
            wireframe: settings.wireframe,
            transparent: settings.transparent,
            opacity: settings.transparent ? 0.58 : 0.94,
            depthWrite: !settings.transparent,
          });

      for (const geom of res.geometries) {
        const mesh = new THREE.Mesh(geom, mat.clone());
        contentGroup.add(mesh);
      }
      mat.dispose();

      if (!settings.wireframe) {
        const gridColor = isGhost
          ? settings.darkMode
            ? 0xa5b4fc
            : 0x6366f1
          : settings.darkMode
            ? 0xe2e8f0
            : 0x0f172a;
        const gridOp = isGhost ? 0.3 : 0.16;
        for (const linePts of res.gridLines) {
          addPolyline(contentGroup, linePts, gridColor, gridOp, isGhost);
        }
      }
    };

    const renderSlicePlaneAndTrace = (pAxis: AxisName, k: number, tr: TraceResult | null) => {
      const L = BOX_LIMIT;
      const cornersMath: [Vec3, Vec3, Vec3, Vec3] =
        pAxis === 'z'
          ? [
              [-L, -L, k],
              [L, -L, k],
              [L, L, k],
              [-L, L, k],
            ]
          : pAxis === 'y'
            ? [
                [-L, k, -L],
                [L, k, -L],
                [L, k, L],
                [-L, k, L],
              ]
            : [
                [k, -L, -L],
                [k, L, -L],
                [k, L, L],
                [k, -L, L],
              ];
      addQuadPatch(contentGroup, cornersMath, '#f59e0b', 0.14, 0.75, false);

      if (tr) {
        for (const c3 of tr.curves3D) {
          addThickCurve(contentGroup, c3, '#fbbf24', 0.068);
        }
        for (const pt3 of tr.points3D) {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 20, 20),
            new THREE.MeshBasicMaterial({ color: '#fbbf24' }),
          );
          dot.position.copy(mathVecToThree(pt3));
          contentGroup.add(dot);
        }
      }
    };

    let nextWarning: { th: string; en: string } | null = null;

    if (activeTab === 'coords') {
      const PL = BOX_LIMIT - 0.5;
      if (coords.showPlaneXY) {
        addQuadPatch(
          contentGroup,
          [
            [-PL, -PL, 0],
            [PL, -PL, 0],
            [PL, PL, 0],
            [-PL, PL, 0],
          ],
          '#22c55e',
          0.16,
          0.55,
        );
      }
      if (coords.showPlaneXZ) {
        addQuadPatch(
          contentGroup,
          [
            [-PL, 0, -PL],
            [PL, 0, -PL],
            [PL, 0, PL],
            [-PL, 0, PL],
          ],
          '#0ea5e9',
          0.16,
          0.55,
        );
      }
      if (coords.showPlaneYZ) {
        addQuadPatch(
          contentGroup,
          [
            [0, -PL, -PL],
            [0, PL, -PL],
            [0, PL, PL],
            [0, -PL, PL],
          ],
          '#f97316',
          0.16,
          0.55,
        );
      }

      const [x, y, z] = coords.point;
      if (
        coords.highlightOctant &&
        Math.abs(x) > 1e-4 &&
        Math.abs(y) > 1e-4 &&
        Math.abs(z) > 1e-4
      ) {
        const sx = x > 0 ? PL : -PL;
        const sy = y > 0 ? PL : -PL;
        const sz = z > 0 ? PL : -PL;
        const octMesh = new THREE.Mesh(
          new THREE.BoxGeometry(Math.abs(sy), Math.abs(sz), Math.abs(sx)),
          new THREE.MeshBasicMaterial({
            color: '#6366f1',
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
          }),
        );
        octMesh.position.copy(mathVecToThree([sx / 2, sy / 2, sz / 2]));
        contentGroup.add(octMesh);
      }

      const pX: Vec3 = [x, 0, 0];
      const pXY: Vec3 = [x, y, 0];
      if (coords.plotStep >= 1) {
        if (Math.abs(x) > 1e-4) addThickCurve(contentGroup, [[0, 0, 0], pX], '#ef4444', 0.055);
        addLabeledSphere(
          contentGroup,
          pX,
          '#ef4444',
          coords.plotStep === 1 ? `(${fmtNum(x)}, 0, 0)` : undefined,
          settings.darkMode,
          coords.plotStep === 1 ? 0.14 : 0.095,
          0.36,
        );
      }
      if (coords.plotStep >= 2) {
        if (Math.abs(y) > 1e-4) addThickCurve(contentGroup, [pX, pXY], '#10b981', 0.055);
        addLabeledSphere(
          contentGroup,
          pXY,
          '#10b981',
          coords.plotStep === 2 ? `(${fmtNum(x)}, ${fmtNum(y)}, 0)` : undefined,
          settings.darkMode,
          coords.plotStep === 2 ? 0.14 : 0.095,
          0.36,
        );
      }
      if (coords.plotStep >= 3) {
        if (Math.abs(z) > 1e-4) addThickCurve(contentGroup, [pXY, coords.point], '#3b82f6', 0.055);
        addLabeledSphere(
          contentGroup,
          coords.point,
          '#f59e0b',
          `P${fmtPoint(coords.point)}`,
          settings.darkMode,
          0.17,
          0.42,
        );

        if (coords.showCoordBox) {
          addCoordinateBox(contentGroup, coords.point, '#64748b', 0.55);
        }
        if (coords.showPlaneProjections) {
          addLabeledSphere(
            contentGroup,
            [x, y, 0],
            '#10b981',
            `xy(${fmtNum(x)},${fmtNum(y)},0)`,
            settings.darkMode,
            0.09,
            -0.35,
          );
          addLabeledSphere(
            contentGroup,
            [x, 0, z],
            '#0ea5e9',
            `xz(${fmtNum(x)},0,${fmtNum(z)})`,
            settings.darkMode,
            0.09,
            0.32,
          );
          addLabeledSphere(
            contentGroup,
            [0, y, z],
            '#f97316',
            `yz(0,${fmtNum(y)},${fmtNum(z)})`,
            settings.darkMode,
            0.09,
            0.32,
          );
        }
      }
    } else if (activeTab === 'planes') {
      const planeRes = buildPlaneGeometry(planes, BOX_LIMIT);
      if (planeRes.warning) nextWarning = planeRes.warning;

      if (planes.showRefPlane && planeRes.refPlaneType) {
        const L = BOX_LIMIT;
        const corners: [Vec3, Vec3, Vec3, Vec3] =
          planeRes.refPlaneType === 'x0'
            ? [
                [0, -L, -L],
                [0, L, -L],
                [0, L, L],
                [0, -L, L],
              ]
            : planeRes.refPlaneType === 'y0'
              ? [
                  [-L, 0, -L],
                  [L, 0, -L],
                  [L, 0, L],
                  [-L, 0, L],
                ]
              : [
                  [-L, -L, 0],
                  [L, -L, 0],
                  [L, L, 0],
                  [-L, L, 0],
                ];
        addQuadPatch(contentGroup, corners, '#f97316', 0.11, 0.72, true);
        const refLbl =
          planeRes.refPlaneType === 'x0'
            ? 'x = 0 (yz)'
            : planeRes.refPlaneType === 'y0'
              ? 'y = 0 (xz)'
              : 'z = 0 (xy)';
        const lblPos: Vec3 =
          planeRes.refPlaneType === 'x0'
            ? [0, L - 0.8, L - 0.5]
            : planeRes.refPlaneType === 'y0'
              ? [L - 0.8, 0, L - 0.5]
              : [L - 0.8, L - 0.8, 0];
        const sp = makeTextSprite(
          refLbl,
          '#f97316',
          settings.darkMode ? 'halo-dark' : 'halo',
          0.48,
        );
        sp.position.copy(mathVecToThree(lblPos));
        contentGroup.add(sp);
      }

      if (planeRes.geometry) {
        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.45,
          metalness: 0.05,
          side: THREE.DoubleSide,
          wireframe: settings.wireframe,
          transparent: true,
          opacity: settings.transparent ? 0.55 : 0.82,
          depthWrite: !settings.transparent,
        });
        contentGroup.add(new THREE.Mesh(planeRes.geometry, mat));
        addPolyline(
          contentGroup,
          planeRes.boundaryPoints,
          settings.darkMode ? 0x93c5fd : 0x1d4ed8,
          0.9,
        );
      }

      if (planes.showIntercepts) {
        const { x, y, z } = planeRes.intercepts;
        const items: Array<{ pt: Vec3; label: string; color: string }> = [];
        if (x !== null && Math.abs(x) <= BOX_LIMIT + 1) {
          items.push({ pt: [x, 0, 0], label: `(${fmtNum(x)}, 0, 0)`, color: '#ef4444' });
        }
        if (y !== null && Math.abs(y) <= BOX_LIMIT + 1) {
          items.push({ pt: [0, y, 0], label: `(0, ${fmtNum(y)}, 0)`, color: '#10b981' });
        }
        if (z !== null && Math.abs(z) <= BOX_LIMIT + 1) {
          items.push({ pt: [0, 0, z], label: `(0, 0, ${fmtNum(z)})`, color: '#3b82f6' });
        }
        for (const item of items) {
          addLabeledSphere(contentGroup, item.pt, item.color, item.label, settings.darkMode, 0.13, 0.38);
        }
      }

      if (planes.showCoordTraces) {
        for (const tr of planeRes.coordTraces) {
          for (const seg of tr.segments) {
            addThickCurve(contentGroup, seg, tr.color, 0.045);
          }
        }
      }
    } else if (activeTab === 'cylinders') {
      const cylRes = buildCylinderGeometry(cylinders, BOX_LIMIT);
      if (cylRes.warning) nextWarning = cylRes.warning;
      renderSurfaceResult(cylRes);

      if (cylinders.showGeneratingCurve && cylRes.generatingCurve) {
        for (const branchPts of cylRes.generatingCurve) {
          addThickCurve(contentGroup, branchPts, '#f59e0b', 0.065);
        }
      }

      if (cylinders.showRulings && cylRes.rulingLines) {
        for (const seg of cylRes.rulingLines) {
          addPolyline(
            contentGroup,
            seg,
            settings.darkMode ? 0xfda4af : 0xe11d48,
            0.85,
            true,
          );
        }
      }

      if (cylinders.slicingEnabled) {
        renderSlicePlaneAndTrace(cylinders.slicePlane, cylinders.sliceK, traceResult);
      }
    } else if (activeTab === 'quadrics') {
      const quadRes = buildQuadricGeometry(quadrics, { limit: BOX_LIMIT });
      if (quadRes.warning) nextWarning = quadRes.warning;
      renderSurfaceResult(quadRes);

      if (quadrics.slicingEnabled) {
        renderSlicePlaneAndTrace(quadrics.slicePlane, quadrics.sliceK, traceResult);
      }
    } else {
      const { shifted, ghost } = buildTranslationGeometry(translation);
      if (shifted.warning) nextWarning = shifted.warning;
      if (ghost) renderSurfaceResult(ghost, { isGhost: true });
      renderSurfaceResult(shifted);

      const oPrime: Vec3 = [translation.x0, translation.y0, translation.z0];
      if (translation.showShiftedAxes) {
        addAxesSet(contentGroup, oPrime, 3.6, 2.4, true, settings.darkMode);
        addLabeledSphere(
          contentGroup,
          oPrime,
          '#f97316',
          `O'${fmtPoint(oPrime)}`,
          settings.darkMode,
          0.14,
          0.42,
        );
        if (Math.hypot(oPrime[0], oPrime[1], oPrime[2]) > 0.1) {
          addPolyline(contentGroup, [[0, 0, 0], oPrime], '#f97316', 0.8, true);
        }
      }
    }

    onWarningChange?.(nextWarning);
  }, [
    activeTab,
    coords,
    planes,
    cylinders,
    quadrics,
    translation,
    traceResult,
    settings,
    onWarningChange,
  ]);

  return <div ref={containerRef} className="w-full h-full touch-none cursor-grab active:cursor-grabbing" />;
}
