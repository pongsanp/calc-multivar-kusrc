import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Compass,
  Crosshair,
  Eye,
  Grid3X3,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  Move3D,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  Shapes,
  Sun,
} from 'lucide-react';
import type {
  AppLang,
  CameraPreset,
  CoordsState,
  CourseId,
  CylindersState,
  ModuleTab,
  PlanesState,
  QuadricsState,
  TranslationState,
  ViewerSettings,
} from './types';
import {
  COURSE_SPECS,
  persistCourse,
  persistLang,
  resolveInitialCourse,
  resolveInitialLang,
} from './math/courses';
import { getOctant } from './math/coords';
import {
  buildCylinderEquationLatex,
  buildCylinderGeneralLatex,
  buildPlaneEquationLatex,
  buildQuadricEquationLatex,
  buildQuadricGeneralLatex,
  buildTranslationEquationsLatex,
  fmtPoint,
} from './math/latex';
import {
  CYLINDER_INFO,
  QUADRIC_INFO,
  TRANSLATION_SURFACE_NAMES,
} from './math/presets';
import { computeCylinderTrace, computeQuadricTrace } from './math/traces';
import { KaTeX } from './components/KaTeX';
import { Scene3D } from './components/Scene3D';
import { Trace2DCard } from './components/Trace2DCard';
import { CoordsPanel } from './components/panels/CoordsPanel';
import { PlanesPanel } from './components/panels/PlanesPanel';
import { QuadricsPanel } from './components/panels/QuadricsPanel';
import { CylindersPanel } from './components/panels/CylindersPanel';
import { TranslationPanel } from './components/panels/TranslationPanel';

const TABS: Array<{
  id: ModuleTab;
  th: string;
  en: string;
  icon: typeof Box;
}> = [
  { id: 'coords', th: '1. พิกัด 3 มิติ', en: '1. 3D Coords', icon: Crosshair },
  { id: 'planes', th: '2. ระนาบ', en: '2. Planes', icon: Layers },
  { id: 'quadrics', th: '3. พื้นผิวกำลังสอง', en: '3. Quadrics', icon: Shapes },
  { id: 'cylinders', th: '4. ทรงกระบอก', en: '4. Cylinders', icon: Box },
  { id: 'translation', th: '5. การย้ายแกน', en: '5. Translation', icon: Move3D },
];

function resolveInitialTab(): ModuleTab {
  try {
    const t = new URLSearchParams(window.location.search).get('tab')?.toLowerCase().trim();
    if (
      t === 'coords' ||
      t === 'planes' ||
      t === 'quadrics' ||
      t === 'cylinders' ||
      t === 'translation'
    ) {
      return t;
    }
  } catch {
    // ignore URL errors
  }
  return 'coords';
}

export default function App() {
  const [course, setCourse] = useState<CourseId>(() => resolveInitialCourse());
  const [lang, setLang] = useState<AppLang>(() => resolveInitialLang());
  const [activeTab, setActiveTab] = useState<ModuleTab>(() => resolveInitialTab());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cameraCommand, setCameraCommand] = useState<{
    preset: CameraPreset;
    seq: number;
  } | null>(null);
  const [sceneWarning, setSceneWarning] = useState<{ th: string; en: string } | null>(null);

  const [coords, setCoords] = useState<CoordsState>({
    point: [1, 4, 2],
    plotStep: 3,
    showCoordBox: true,
    showPlaneProjections: true,
    showPlaneXY: true,
    showPlaneXZ: false,
    showPlaneYZ: false,
    highlightOctant: false,
  });

  const [planes, setPlanes] = useState<PlanesState>({
    a: 3,
    b: 6,
    c: 2,
    d: 6,
    showIntercepts: true,
    showCoordTraces: true,
    showRefPlane: true,
  });

  const [cylinders, setCylinders] = useState<CylindersState>({
    type: 'elliptic',
    missingAxis: 'x',
    hyperbolicSign: -1,
    a: 4,
    b: 2,
    c: 0,
    extrusionLength: 8,
    isAnimatingExtrusion: false,
    showGeneratingCurve: true,
    showRulings: true,
    slicingEnabled: false,
    slicePlane: 'x',
    sliceK: 0,
    quizMode: false,
    quizRevealed: false,
  });

  const [quadrics, setQuadrics] = useState<QuadricsState>({
    mode: 'ellipsoid',
    symmetryAxis: 'z',
    paraboloidSign: 1,
    a: 1,
    b: 2,
    c: 3,
    slicingEnabled: true,
    slicePlane: 'z',
    sliceK: 0,
    quizMode: false,
    quizRevealed: false,
  });

  const [translation, setTranslation] = useState<TranslationState>({
    surfaceType: 'hyperboloid_2',
    symmetryAxis: 'x',
    paraboloidSign: 1,
    x0: -1,
    y0: 1,
    z0: 2,
    a: Math.sqrt(2),
    b: Math.sqrt(6),
    c: Math.sqrt(3),
    showGhost: true,
    showShiftedAxes: true,
    quizMode: false,
    quizRevealed: false,
  });

  const [settings, setSettings] = useState<ViewerSettings>({
    darkMode: false,
    wireframe: false,
    transparent: false,
    showGrid: true,
    autoRotate: false,
    presentationMode: false,
  });

  const handleChangeCourse = useCallback((nextCourse: CourseId) => {
    setCourse(nextCourse);
    persistCourse(nextCourse);
    const spec = COURSE_SPECS[nextCourse];
    setQuadrics((prev) =>
      spec.quadricModes.includes(prev.mode)
        ? prev
        : { ...prev, mode: spec.quadricModes[0], quizRevealed: false },
    );
    setTranslation((prev) =>
      spec.translationTypes.includes(prev.surfaceType)
        ? prev
        : { ...prev, surfaceType: spec.translationTypes[0], quizRevealed: false },
    );
  }, []);

  const handleChangeLang = useCallback((nextLang: AppLang) => {
    setLang(nextLang);
    persistLang(nextLang);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    const titlePrefix = COURSE_SPECS[course].title;
    document.title =
      lang === 'en'
        ? `${titlePrefix} — 3D Surfaces Dashboard`
        : `${titlePrefix} — พื้นผิวในปริภูมิสามมิติ`;
  }, [course, lang]);

  // Cylinder extrusion animation loop
  useEffect(() => {
    if (activeTab !== 'cylinders' || !cylinders.isAnimatingExtrusion) return;
    let rafId = 0;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setCylinders((prev) => {
        if (!prev.isAnimatingExtrusion) return prev;
        let nextLen = prev.extrusionLength + dt * 2.8;
        if (nextLen > 10) nextLen = 0.25;
        return { ...prev, extrusionLength: Number(nextLen.toFixed(2)) };
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab, cylinders.isAnimatingExtrusion]);

  const activeTrace = useMemo(() => {
    if (activeTab === 'quadrics' && quadrics.slicingEnabled) {
      return {
        slicePlane: quadrics.slicePlane,
        sliceK: quadrics.sliceK,
        trace: computeQuadricTrace(quadrics),
      };
    }
    if (activeTab === 'cylinders' && cylinders.slicingEnabled) {
      return {
        slicePlane: cylinders.slicePlane,
        sliceK: cylinders.sliceK,
        trace: computeCylinderTrace(cylinders),
      };
    }
    return null;
  }, [activeTab, quadrics, cylinders]);

  const bannerContent = useMemo(() => {
    if (activeTab === 'coords') {
      const oct = getOctant(coords.point);
      return {
        titleTh: `พิกัด 3 มิติ (${oct.label.th})`,
        titleEn: `3D Coordinates (${oct.label.en})`,
        latex: `P = ${fmtPoint(coords.point)}`,
      };
    }
    if (activeTab === 'planes') {
      return {
        titleTh: 'สมการระนาบใน 3 มิติ',
        titleEn: 'Plane in 3D Space',
        latex: buildPlaneEquationLatex(planes),
      };
    }
    if (activeTab === 'quadrics') {
      const hideSol = quadrics.quizMode && !quadrics.quizRevealed;
      if (hideSol) {
        return {
          titleTh: 'โหมดควิซ: ทายชื่อรูปทรง & จุดตัดแกน',
          titleEn: 'Quiz Mode: Identify Surface & Intercepts',
          latex: buildQuadricGeneralLatex(quadrics),
        };
      }
      const info = QUADRIC_INFO[quadrics.mode];
      return {
        titleTh: info.name.th,
        titleEn: info.name.en,
        latex: buildQuadricEquationLatex(quadrics),
      };
    }
    if (activeTab === 'cylinders') {
      const hideSol = cylinders.quizMode && !cylinders.quizRevealed;
      if (hideSol) {
        return {
          titleTh: 'โหมดควิซ: ทายชื่อทรงกระบอก & จุดตัดแกน',
          titleEn: 'Quiz Mode: Identify Cylinder & Intercepts',
          latex: buildCylinderGeneralLatex(cylinders),
        };
      }
      const info = CYLINDER_INFO[cylinders.type];
      return {
        titleTh: info.name.th,
        titleEn: info.name.en,
        latex: buildCylinderEquationLatex(cylinders),
      };
    }
    const eqs = buildTranslationEquationsLatex(translation);
    const hideSol = translation.quizMode && !translation.quizRevealed;
    return {
      titleTh: hideSol
        ? 'โหมดควิซ: จัดกำลังสองสมบูรณ์และหาจุดกำเนิดใหม่'
        : `การย้ายแกน: ${TRANSLATION_SURFACE_NAMES[translation.surfaceType].th}`,
      titleEn: hideSol
        ? 'Quiz Mode: Complete the Square'
        : `Translation: ${TRANSLATION_SURFACE_NAMES[translation.surfaceType].en}`,
      latex: hideSol ? eqs.expanded : eqs.standard,
    };
  }, [activeTab, coords, planes, quadrics, cylinders, translation]);

  const triggerCamera = useCallback((preset: CameraPreset) => {
    setCameraCommand((prev) => ({ preset, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const toggleSetting = (key: keyof ViewerSettings) => {
    setSettings((prev) => {
      const nextVal = !prev[key];
      if (key === 'presentationMode') {
        setSidebarOpen(!nextVal);
      }
      return { ...prev, [key]: nextVal };
    });
  };

  const isEn = lang === 'en';
  const courseSpec = COURSE_SPECS[course];

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Top Navbar */}
      <header className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            title={
              sidebarOpen
                ? isEn
                  ? 'Hide control panel'
                  : 'ซ่อนแถบควบคุม'
                : isEn
                  ? 'Show control panel'
                  : 'แสดงแถบควบคุม'
            }
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600 text-white tracking-wide shrink-0">
                {courseSpec.code}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {courseSpec.title}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {isEn
                ? 'Chapter 1: Surfaces in 3D Space — Faculty of Science at Sriracha, Kasetsart University'
                : 'บทที่ 1: พื้นผิวในปริภูมิสามมิติ — คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์'}
            </p>
          </div>
        </div>

        {/* Course Switcher + Chapter 1 Tabs */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <div
            className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 p-1 rounded-2xl shrink-0 max-w-full overflow-x-auto"
            title={isEn ? 'Switch course profile' : 'สลับรายวิชา'}
          >
            {(['01417112', '02731112'] as CourseId[]).map((cid) => (
              <button
                key={cid}
                type="button"
                onClick={() => handleChangeCourse(cid)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  course === cid
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                }`}
              >
                {COURSE_SPECS[cid].shortLabel}
              </button>
            ))}
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto max-w-full">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? tab.en : tab.th}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Display Actions */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-bold"
            title={isEn ? 'Switch language (TH / EN)' : 'สลับภาษา (ไทย / อังกฤษ)'}
          >
            <button
              type="button"
              onClick={() => handleChangeLang('th')}
              className={`px-2 py-1 rounded-lg transition ${
                lang === 'th'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => handleChangeLang('en')}
              className={`px-2 py-1 rounded-lg transition ${
                lang === 'en'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleSetting('darkMode')}
            title={
              settings.darkMode
                ? isEn
                  ? 'Light Mode'
                  : 'โหมดสว่าง'
                : isEn
                  ? 'Dark Mode'
                  : 'โหมดมืด'
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            {settings.darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden md:inline">
              {settings.darkMode ? (isEn ? 'Light' : 'สว่าง') : isEn ? 'Dark' : 'มืด'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleSetting('presentationMode')}
            title={isEn ? 'Presentation Mode' : 'โหมดสอนหน้าห้อง'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
              settings.presentationMode
                ? 'border-sky-500 bg-sky-600 text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {settings.presentationMode ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">{isEn ? 'Present' : 'โหมดสอน'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Sidebar */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[375px] xl:w-[405px] shrink-0 max-h-[42dvh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto overscroll-contain custom-scrollbar p-4 select-text">
            {activeTab === 'coords' && (
              <CoordsPanel state={coords} lang={lang} onChange={setCoords} />
            )}
            {activeTab === 'planes' && (
              <PlanesPanel state={planes} course={course} lang={lang} onChange={setPlanes} />
            )}
            {activeTab === 'quadrics' && (
              <QuadricsPanel
                state={quadrics}
                course={course}
                lang={lang}
                onChange={setQuadrics}
              />
            )}
            {activeTab === 'cylinders' && (
              <CylindersPanel
                state={cylinders}
                course={course}
                lang={lang}
                onChange={setCylinders}
              />
            )}
            {activeTab === 'translation' && (
              <TranslationPanel
                state={translation}
                course={course}
                lang={lang}
                onChange={setTranslation}
              />
            )}
          </aside>
        )}

        {/* Right 3D Canvas */}
        <main className="relative flex-1 min-h-0 overflow-hidden">
          <Scene3D
            activeTab={activeTab}
            coords={coords}
            planes={planes}
            cylinders={cylinders}
            quadrics={quadrics}
            translation={translation}
            traceResult={activeTrace?.trace ?? null}
            settings={settings}
            cameraCommand={cameraCommand}
            onWarningChange={setSceneWarning}
          />

          {/* Floating KaTeX Equation Banner (Top-Left) */}
          <div
            className={`pointer-events-none absolute top-3 left-3 right-3 sm:right-auto max-w-xl transition-all ${
              settings.presentationMode ? 'sm:max-w-2xl' : ''
            }`}
          >
            <div className="pointer-events-auto inline-block max-w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isEn ? (
                  <span className="text-sky-700 dark:text-sky-300">{bannerContent.titleEn}</span>
                ) : (
                  <>
                    <span className="text-sky-700 dark:text-sky-300">{bannerContent.titleTh}</span>
                    <span className="hidden sm:inline opacity-75">• {bannerContent.titleEn}</span>
                  </>
                )}
              </div>
              <div
                className={`mt-1 overflow-x-auto overflow-y-hidden leading-normal text-slate-900 dark:text-white ${
                  settings.presentationMode ? 'text-lg sm:text-2xl py-2' : 'text-sm sm:text-base py-1'
                }`}
              >
                <KaTeX math={bannerContent.latex} />
              </div>
            </div>

            {sceneWarning && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/95 dark:bg-amber-950/90 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 shadow-md">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{isEn ? sceneWarning.en : sceneWarning.th}</span>
              </div>
            )}
          </div>

          {/* Axis Legend (Top-Right) */}
          <div className="hidden sm:flex items-center gap-2.5 absolute top-3 right-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-3 py-1.5 text-[11px] font-semibold shadow-sm">
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> +x
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> +y
            </span>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> +z
            </span>
          </div>

          {/* 2D Trace Cross-Section Card */}
          {activeTrace && (
            <div className="absolute bottom-20 md:bottom-3 right-3 z-10">
              <Trace2DCard
                slicePlane={activeTrace.slicePlane}
                sliceK={activeTrace.sliceK}
                trace={activeTrace.trace}
                lang={lang}
              />
            </div>
          )}

          {/* Camera & View Toolbar */}
          <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg p-1.5 text-xs">
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200 dark:border-slate-700">
              <Compass className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
              {(
                [
                  { id: 'isometric', label: '3D Iso' },
                  { id: 'top', label: isEn ? 'Top (xy)' : 'บน (xy)' },
                  { id: 'front', label: isEn ? 'Front (yz)' : 'หน้า (yz)' },
                  { id: 'side', label: isEn ? 'Side (xz)' : 'ข้าง (xz)' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => triggerCamera(cam.id)}
                  className="px-2 py-1 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 transition"
                >
                  {cam.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleSetting('wireframe')}
                title={isEn ? 'Wireframe Mode' : 'โหมดโครงลวด'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.wireframe
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isEn ? 'Wireframe' : 'โครงลวด'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('transparent')}
                title={isEn ? 'Transparent Mode' : 'โปร่งแสง'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.transparent
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isEn ? 'Transparent' : 'โปร่งแสง'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('showGrid')}
                title={isEn ? 'Toggle xy-plane Grid' : 'ตาราง xy'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.showGrid
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{isEn ? 'xy Grid' : 'ตาราง xy'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('autoRotate')}
                title={isEn ? 'Auto-rotate Camera' : 'หมุนอัตโนมัติ'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.autoRotate
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${settings.autoRotate ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isEn ? 'Rotate' : 'หมุน'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
