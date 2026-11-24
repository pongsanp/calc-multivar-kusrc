import type { AppLang, BilingualLabel, CourseId, PlanesState } from '../../types';
import { getPlaneInterceptRows } from '../../math/intercepts';
import { PLANE_PRESETS, filterPresetsByCourse } from '../../math/presets';
import { AxisInterceptsBox } from '../AxisInterceptsBox';
import { SliderControl } from '../SliderControl';

interface PlanesPanelProps {
  state: PlanesState;
  course: CourseId;
  lang: AppLang;
  onChange: (next: PlanesState) => void;
}

export function PlanesPanel({ state, course, lang, onChange }: PlanesPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<PlanesState>) => onChange({ ...state, ...patch });
  const presets = filterPresetsByCourse(PLANE_PRESETS, course);

  const zeroCount = [state.a, state.b, state.c].filter((v) => Math.abs(v) < 1e-6).length;
  let specialBadge: BilingualLabel | null = null;
  if (zeroCount === 3) {
    specialBadge = { th: 'ไม่ใช่สมการระนาบ (A = B = C = 0)', en: 'Degenerate (A = B = C = 0)' };
  } else if (zeroCount === 2) {
    if (Math.abs(state.c) > 1e-6) {
      specialBadge = { th: 'ขนานระนาบ xy (ตัดเฉพาะแกน z)', en: 'Parallel to xy-plane (cuts z-axis only)' };
    } else if (Math.abs(state.b) > 1e-6) {
      specialBadge = { th: 'ขนานระนาบ xz (ตัดเฉพาะแกน y)', en: 'Parallel to xz-plane (cuts y-axis only)' };
    } else {
      specialBadge = { th: 'ขนานระนาบ yz (ตัดเฉพาะแกน x)', en: 'Parallel to yz-plane (cuts x-axis only)' };
    }
  } else if (zeroCount === 1) {
    const missing = Math.abs(state.a) < 1e-6 ? 'x' : Math.abs(state.b) < 1e-6 ? 'y' : 'z';
    specialBadge = {
      th: `ขนานแกน ${missing} (ไม่ตัดแกน ${missing})`,
      en: `Parallel to ${missing}-axis (no ${missing}-intercept)`,
    };
  } else if (Math.abs(state.d) < 1e-6) {
    specialBadge = { th: 'ระนาบผ่านจุดกำเนิด (0, 0, 0)', en: 'Passes through Origin (0, 0, 0)' };
  }

  const interceptRows = getPlaneInterceptRows(state);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Examples (Example 2)' : 'ตัวอย่างสมการระนาบ (ตัวอย่างที่ 2)'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.value)}
              className="text-left px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-xs"
            >
              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {isEn ? p.label.en : p.label.th}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {p.badge ?? (isEn ? p.label.th : p.label.en)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'Plane Coefficients' : 'สัมประสิทธิ์ของสมการระนาบ'}
          </span>
          <span className="text-[11px] font-mono text-slate-400">Ax + By + Cz = D</span>
        </div>

        <SliderControl
          label={isEn ? 'A (x-coefficient)' : 'A (สัมประสิทธิ์ x)'}
          value={state.a}
          min={-6}
          max={6}
          step={0.5}
          accentColor="#ef4444"
          onChange={(a) => update({ a })}
        />
        <SliderControl
          label={isEn ? 'B (y-coefficient)' : 'B (สัมประสิทธิ์ y)'}
          value={state.b}
          min={-6}
          max={6}
          step={0.5}
          accentColor="#10b981"
          onChange={(b) => update({ b })}
        />
        <SliderControl
          label={isEn ? 'C (z-coefficient)' : 'C (สัมประสิทธิ์ z)'}
          value={state.c}
          min={-6}
          max={6}
          step={0.5}
          accentColor="#3b82f6"
          onChange={(c) => update({ c })}
        />
        <SliderControl
          label={isEn ? 'D (RHS constant)' : 'D (ค่าคงตัวฝั่งขวา)'}
          value={state.d}
          min={-12}
          max={12}
          step={0.5}
          onChange={(d) => update({ d })}
        />
      </div>

      {specialBadge && (
        <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/70 text-xs">
          <div className="font-semibold text-indigo-800 dark:text-indigo-200">
            {isEn ? specialBadge.en : specialBadge.th}
          </div>
          {!isEn && (
            <div className="text-[11px] text-indigo-600 dark:text-indigo-300">
              {specialBadge.en}
            </div>
          )}
        </div>
      )}

      <AxisInterceptsBox rows={interceptRows} lang={lang} />

      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Reference Plane (x=0 / y=0 / z=0)' : 'แสดงระนาบอ้างอิงเทียบ (x=0 / y=0 / z=0)'}
          </span>
          <input
            type="checkbox"
            checked={state.showRefPlane}
            onChange={(e) => update({ showRefPlane: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Axis Intercepts' : 'แสดงจุดตัดแกนพิกัด'}
          </span>
          <input
            type="checkbox"
            checked={state.showIntercepts}
            onChange={(e) => update({ showIntercepts: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Traces on xy, xz, yz Planes' : 'แสดงรอยตัดระนาบพิกัด (xy, xz, yz Traces)'}
          </span>
          <input
            type="checkbox"
            checked={state.showCoordTraces}
            onChange={(e) => update({ showCoordTraces: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
      </div>
    </div>
  );
}
