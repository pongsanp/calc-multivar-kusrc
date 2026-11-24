import { Eye, EyeOff, Pause, Play } from 'lucide-react';
import type { AppLang, AxisName, CourseId, CylinderType, CylindersState } from '../../types';
import { getCylinderInterceptRows } from '../../math/intercepts';
import {
  buildCylinderEquationLatex,
  buildCylinderGeneralLatex,
} from '../../math/latex';
import { CYLINDER_INFO, CYLINDER_PRESETS, filterPresetsByCourse } from '../../math/presets';
import { axisVarNames } from '../../math/coords';
import { AxisInterceptsBox } from '../AxisInterceptsBox';
import { KaTeX } from '../KaTeX';
import { SliderControl } from '../SliderControl';

interface CylindersPanelProps {
  state: CylindersState;
  course: CourseId;
  lang: AppLang;
  onChange: (next: CylindersState) => void;
}

const CYLINDER_TYPES: CylinderType[] = ['elliptic', 'parabolic', 'hyperbolic'];
const AXES: AxisName[] = ['x', 'y', 'z'];

export function CylindersPanel({ state, course, lang, onChange }: CylindersPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<CylindersState>) => onChange({ ...state, ...patch });
  const { u, v } = axisVarNames(state.missingAxis);
  const info = CYLINDER_INFO[state.type];
  const presets = filterPresetsByCourse(CYLINDER_PRESETS, course);

  const hideSolution = state.quizMode && !state.quizRevealed;
  const generalLatex = buildCylinderGeneralLatex(state);
  const standardLatex = buildCylinderEquationLatex(state);
  const interceptRows = getCylinderInterceptRows(state);

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Sheet Examples & Quiz (Presets)' : 'โจทย์ในชีต & ควิซ (Presets)'}
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                update({
                  ...p.value,
                  isAnimatingExtrusion: false,
                  quizRevealed: state.quizMode ? false : state.quizRevealed,
                })
              }
              className="text-left px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-xs flex items-center justify-between gap-2"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {isEn ? p.label.en : p.label.th}
              </span>
              {p.badge && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  {p.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* General Equation & Quiz Mode */}
      <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            {isEn ? 'Equation & Classification' : 'สมการและการจำแนกทรงกระบอก'}
          </span>
          <button
            type="button"
            onClick={() => update({ quizMode: !state.quizMode, quizRevealed: false })}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
              state.quizMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
            }`}
          >
            {isEn
              ? state.quizMode
                ? 'Quiz Mode: ON'
                : 'Quiz Mode'
              : state.quizMode
                ? 'โหมดทายรูปทรง: เปิด'
                : 'โหมดควิซ (ทายรูปทรง)'}
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {isEn ? 'General Form (Given Problem)' : 'สมการรูปทั่วไป (โจทย์)'}
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal py-1 text-slate-800 dark:text-slate-100">
            <KaTeX math={generalLatex} />
          </div>
        </div>

        {hideSolution ? (
          <button
            type="button"
            onClick={() => update({ quizRevealed: true })}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Eye className="w-4 h-4" />{' '}
            {isEn ? 'Reveal Cylinder Type, Standard Form & Intercepts' : 'เฉลยชื่อทรงกระบอก รูปมาตรฐาน และจุดตัดแกน'}
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-sky-200/80 dark:border-sky-900/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {isEn ? 'Standard Form' : 'สมการรูปมาตรฐาน (Standard Form)'}
              </span>
              {state.quizMode && (
                <button
                  type="button"
                  onClick={() => update({ quizRevealed: false })}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <EyeOff className="w-3 h-3" /> {isEn ? 'Hide' : 'ซ่อนเฉลย'}
                </button>
              )}
            </div>
            <div className="overflow-x-auto overflow-y-hidden leading-normal py-1 text-sky-700 dark:text-sky-300">
              <KaTeX math={standardLatex} />
            </div>
          </div>
        )}
      </div>

      {/* Cylinder Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          {isEn ? 'Cylinder Type (3 Forms)' : 'รูปแบบพื้นผิวทรงกระบอก (3 ชนิด)'}
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {CYLINDER_TYPES.map((t) => {
            const active = state.type === t && !hideSolution;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  const basePatch: Partial<CylindersState> =
                    t === 'parabolic'
                      ? { type: t, a: 1, c: 0 }
                      : { type: t, a: Math.max(0.5, state.a), b: Math.max(0.5, state.b) };
                  update({
                    ...basePatch,
                    quizRevealed: state.quizMode ? false : state.quizRevealed,
                  });
                }}
                className={`px-3 py-2 rounded-xl border text-left transition text-xs flex items-center justify-between gap-2 ${
                  active
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="truncate">
                  {isEn ? CYLINDER_INFO[t].name.en : CYLINDER_INFO[t].name.th}
                </span>
                {!isEn && (
                  <span className="text-[10px] opacity-75 shrink-0">{CYLINDER_INFO[t].name.en}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!hideSolution && (
        <>
          <div className="px-3 py-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-0.5">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              {isEn ? info.name.en : info.name.th}
            </div>
            <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              {isEn ? info.desc.en : info.desc.th}
            </div>
          </div>

          <AxisInterceptsBox rows={interceptRows} lang={lang} />
        </>
      )}

      {/* Missing Variable / Ruling Axis */}
      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Missing Variable (Extrusion Axis)' : 'ตัวแปรที่หายไป / แนวยืดขนาน'}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {AXES.map((ax) => {
            const active = state.missingAxis === ax;
            return (
              <button
                key={ax}
                type="button"
                onClick={() => update({ missingAxis: ax })}
                className={`py-2 rounded-xl border font-semibold text-xs transition ${
                  active
                    ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                }`}
              >
                {isEn ? `No ${ax} (${ax}-axis)` : `ไม่มี ${ax} (แกน ${ax})`}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {isEn ? (
            <>
              Equation uses only <span className="font-mono font-semibold">{u}, {v}</span> (missing{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>) → trace in the{' '}
              <span className="font-mono font-semibold">{u}{v}</span>-plane extruded along the{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>-axis.
            </>
          ) : (
            <>
              สมการมีเฉพาะตัวแปร <span className="font-mono font-semibold">{u}, {v}</span> (ขาดตัวแปร{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>) จึงยืดเส้นโค้งในระนาบ{' '}
              <span className="font-mono font-semibold">{u}{v}</span> ขนานตามแกน{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>
            </>
          )}
        </p>
      </div>

      {/* Parameters */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Generating Curve Parameters' : 'พารามิเตอร์เส้นโค้งฐาน'}
        </div>

        {state.type === 'parabolic' ? (
          <>
            <SliderControl
              label={isEn ? 'a (parabola curvature)' : 'a (ความโค้งพาราโบลา)'}
              value={state.a}
              min={-3}
              max={3}
              step={0.25}
              onChange={(a) => update({ a: Math.abs(a) < 0.1 ? 0.25 : a })}
            />
            <SliderControl
              label={isEn ? 'c (vertex shift)' : 'c (ระยะเลื่อนจุดยอด)'}
              value={state.c}
              min={-3.5}
              max={3.5}
              step={0.5}
              onChange={(c) => update({ c })}
            />
          </>
        ) : (
          <>
            <SliderControl
              label={isEn ? `a (${u}-semi-axis)` : `a (กึ่งแกน ${u})`}
              value={state.a}
              min={0.5}
              max={5}
              step={0.25}
              onChange={(a) => update({ a })}
            />
            <SliderControl
              label={isEn ? `b (${v}-semi-axis)` : `b (กึ่งแกน ${v})`}
              value={state.b}
              min={0.5}
              max={5}
              step={0.25}
              onChange={(b) => update({ b })}
            />
            {state.type === 'hyperbolic' && (
              <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isEn ? 'Hyperbola Opening Axis' : 'ทิศทางเปิดของไฮเพอร์โบลา'}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ hyperbolicSign: 1 })}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-xs transition ${
                      state.hyperbolicSign === 1
                        ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isEn ? `Opens along ${u} (${u}² - ${v}²)` : `เปิดตามแกน ${u} (${u}² - ${v}²)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ hyperbolicSign: -1 })}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-xs transition ${
                      state.hyperbolicSign === -1
                        ? 'border-rose-500 bg-rose-600 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isEn ? `Opens along ${v} (${v}² - ${u}²)` : `เปิดตามแกน ${v} (${v}² - ${u}²)`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Coordinate-plane traces & Slicing */}
      <div className="p-3.5 rounded-2xl border border-amber-300/80 dark:border-amber-800/70 bg-amber-50/60 dark:bg-amber-950/30 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {isEn ? 'Coordinate Traces & Slicing Plane' : 'รอยตัดบนระนาบพิกัดและระนาบตัด'}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300/80">
              {isEn ? 'Inspect 2D trace (e.g. xy, xz, yz)' : 'เช็กรอยตัดระนาบ xy, xz, yz คู่กราฟ 2 มิติ'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={state.slicingEnabled}
            onChange={(e) => update({ slicingEnabled: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>

        {state.slicingEnabled && (
          <div className="space-y-2.5 pt-1 border-t border-amber-200/70 dark:border-amber-800/50">
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { ax: 'z' as AxisName, label: 'xy (z = 0)' },
                  { ax: 'y' as AxisName, label: 'xz (y = 0)' },
                  { ax: 'x' as AxisName, label: 'yz (x = 0)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.ax}
                  type="button"
                  onClick={() => update({ slicePlane: item.ax, sliceK: 0 })}
                  className={`py-1.5 rounded-xl border font-semibold text-[11px] transition ${
                    state.slicePlane === item.ax && Math.abs(state.sliceK) < 1e-6
                      ? 'border-amber-600 bg-amber-500 text-white shadow-sm'
                      : 'border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <SliderControl
              label={isEn ? `Slice Level (${state.slicePlane} = k)` : `ระดับระนาบตัด (${state.slicePlane} = k)`}
              value={state.sliceK}
              min={-5}
              max={5}
              step={0.25}
              accentColor="#f59e0b"
              onChange={(sliceK) => update({ sliceK })}
            />
          </div>
        )}
      </div>

      {/* Extrusion Length & Animation */}
      <div className="p-3.5 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/30 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
            {isEn ? 'Extrusion Length' : 'ความยาวยืดผิว (Extrusion Length)'}
          </span>
          <button
            type="button"
            onClick={() => update({ isAnimatingExtrusion: !state.isAnimatingExtrusion })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition"
          >
            {state.isAnimatingExtrusion ? (
              <>
                <Pause className="w-3.5 h-3.5" /> {isEn ? 'Pause' : 'หยุด'}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> {isEn ? 'Animate Extrusion' : 'เล่นยืดผิว 3 มิติ'}
              </>
            )}
          </button>
        </div>

        <SliderControl
          label={isEn ? 'Extrusion Length along Axis' : 'ระยะยืดตามแกน'}
          value={state.extrusionLength}
          min={0}
          max={10}
          step={0.25}
          onChange={(extrusionLength) => update({ extrusionLength, isAnimatingExtrusion: false })}
        />
      </div>

      {/* Guides */}
      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Highlight Generating Curve' : 'ไฮไลต์เส้นโค้งฐาน (Generating Curve)'}
          </span>
          <input
            type="checkbox"
            checked={state.showGeneratingCurve}
            onChange={(e) => update({ showGeneratingCurve: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Ruling Lines' : 'แสดงเส้นตรงกำเนิดผิว (Ruling Lines)'}
          </span>
          <input
            type="checkbox"
            checked={state.showRulings}
            onChange={(e) => update({ showRulings: e.target.checked })}
            className="w-4 h-4 accent-rose-500"
          />
        </label>
      </div>
    </div>
  );
}
