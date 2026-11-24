import type { AppLang, CoordsState, Vec3Tuple } from '../../types';
import { getOctant } from '../../math/coords';
import { fmtNum, fmtPoint } from '../../math/latex';
import { COORD_POINT_PRESETS } from '../../math/presets';
import { SliderControl } from '../SliderControl';

interface CoordsPanelProps {
  state: CoordsState;
  lang: AppLang;
  onChange: (next: CoordsState) => void;
}

export function CoordsPanel({ state, lang, onChange }: CoordsPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<CoordsState>) => onChange({ ...state, ...patch });
  const setCoord = (idx: 0 | 1 | 2, val: number) => {
    const next: Vec3Tuple = [...state.point] as Vec3Tuple;
    next[idx] = val;
    update({ point: next });
  };

  const octant = getOctant(state.point);
  const [x, y, z] = state.point;

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Example Points (Example 1)' : 'ตัวอย่างจุดพิกัด 3 มิติ (ตัวอย่างที่ 1)'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {COORD_POINT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.value)}
              className="text-left px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-xs"
            >
              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {isEn ? p.label.en : p.label.th}
              </div>
              {p.badge && (
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {p.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Point Coordinates */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'Point Coordinates P(x, y, z)' : 'พิกัดของจุด P(x, y, z)'}
          </span>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {fmtPoint(state.point)}
          </span>
        </div>

        <SliderControl
          label={isEn ? 'x-coordinate' : 'พิกัด x'}
          value={x}
          min={-5}
          max={5}
          step={0.5}
          accentColor="#ef4444"
          onChange={(v) => setCoord(0, v)}
        />
        <SliderControl
          label={isEn ? 'y-coordinate' : 'พิกัด y'}
          value={y}
          min={-5}
          max={5}
          step={0.5}
          accentColor="#10b981"
          onChange={(v) => setCoord(1, v)}
        />
        <SliderControl
          label={isEn ? 'z-coordinate' : 'พิกัด z'}
          value={z}
          min={-5}
          max={5}
          step={0.5}
          accentColor="#3b82f6"
          onChange={(v) => setCoord(2, v)}
        />
      </div>

      {/* Step-by-step plotting guide */}
      <div className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/25 space-y-2.5 text-xs">
        <div className="font-bold text-sky-900 dark:text-sky-200">
          {isEn ? 'Step-by-Step Plotting Guide' : 'ลำดับการพล็อตจุดทีละขั้น (Step-by-Step)'}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(isEn
            ? [
                { step: 1, title: 'Step 1: x', sub: 'Along x-axis' },
                { step: 2, title: 'Step 2: xy', sub: 'Parallel to y' },
                { step: 3, title: 'Step 3: P', sub: 'Parallel to z' },
              ]
            : [
                { step: 1, title: 'ขั้น 1: แกน x', sub: 'เดินตาม x' },
                { step: 2, title: 'ขั้น 2: ระนาบ xy', sub: 'เลื่อนตาม y' },
                { step: 3, title: 'ขั้น 3: จุด P', sub: 'ขึ้น-ลงตาม z' },
              ] as const
          ).map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => update({ plotStep: item.step as 1 | 2 | 3 })}
              className={`py-2 px-1.5 rounded-xl border text-center transition ${
                state.plotStep === item.step
                  ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="font-bold">{item.title}</div>
              <div className="text-[10px] opacity-80">{item.sub}</div>
            </button>
          ))}
        </div>
        <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          {state.plotStep === 1 &&
            (isEn
              ? `1) Start at O(0,0,0) and move along the x-axis to (${fmtNum(x)}, 0, 0).`
              : `1) เริ่มจาก O(0,0,0) เดินตามแกน x ไปที่ (${fmtNum(x)}, 0, 0)`)}
          {state.plotStep === 2 &&
            (isEn
              ? `2) Move parallel to the y-axis in the xy-plane to (${fmtNum(x)}, ${fmtNum(y)}, 0).`
              : `2) เลื่อนขนานแกน y บนระนาบ xy ไปที่ (${fmtNum(x)}, ${fmtNum(y)}, 0)`)}
          {state.plotStep === 3 &&
            (isEn
              ? `3) Move parallel to the z-axis to arrive at P${fmtPoint(state.point)}.`
              : `3) ยกขึ้น/ลงขนานแกน z ไปยังตำแหน่งจุด P${fmtPoint(state.point)}`)}
        </div>
      </div>

      {/* Octant & Distance to Coordinate Planes */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
        <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {isEn ? 'Octant Location' : 'อัฐภาค (Octant)'}
          </span>
          <span className="font-bold text-indigo-900 dark:text-indigo-100">
            {isEn ? octant.label.en : `${octant.label.th} (${octant.label.en})`}
          </span>
        </div>

        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
          {isEn ? 'Perpendicular Distance from Coordinate Planes' : 'ระยะตั้งฉากจากระนาบพิกัดฉาก'}
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
              {isEn ? 'xy-plane (z=0)' : 'จากระนาบ xy'}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
              |z| = {fmtNum(Math.abs(z))}
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50">
            <div className="text-[10px] text-sky-700 dark:text-sky-300">
              {isEn ? 'xz-plane (y=0)' : 'จากระนาบ xz'}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
              |y| = {fmtNum(Math.abs(y))}
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/50">
            <div className="text-[10px] text-orange-700 dark:text-orange-300">
              {isEn ? 'yz-plane (x=0)' : 'จากระนาบ yz'}
            </div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
              |x| = {fmtNum(Math.abs(x))}
            </div>
          </div>
        </div>
      </div>

      {/* Coordinate Planes & Visual Guides */}
      <div className="space-y-2 text-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isEn ? 'Coordinate Planes & Guides' : 'ระนาบพิกัดฉากและเส้นช่วย'}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: 'showPlaneXY' as const, label: 'xy (z = 0)', color: 'accent-emerald-600' },
            { key: 'showPlaneXZ' as const, label: 'xz (y = 0)', color: 'accent-sky-600' },
            { key: 'showPlaneYZ' as const, label: 'yz (x = 0)', color: 'accent-orange-500' },
          ].map((pl) => (
            <label
              key={pl.key}
              className="flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="font-mono font-semibold text-[11px] text-slate-700 dark:text-slate-200">
                {pl.label}
              </span>
              <input
                type="checkbox"
                checked={state[pl.key]}
                onChange={(e) => update({ [pl.key]: e.target.checked })}
                className={`w-3.5 h-3.5 ${pl.color}`}
              />
            </label>
          ))}
        </div>

        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Coordinate Box' : 'แสดงกล่องเส้นประพิกัด (Coordinate Box)'}
          </span>
          <input
            type="checkbox"
            checked={state.showCoordBox}
            onChange={(e) => update({ showCoordBox: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Projections on xy, xz, yz' : 'แสดงจุดฉายบนระนาบ xy, xz, yz'}
          </span>
          <input
            type="checkbox"
            checked={state.showPlaneProjections}
            onChange={(e) => update({ showPlaneProjections: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Highlight Active Octant' : 'แรเงาขอบเขตอัฐภาค (Octant Volume)'}
          </span>
          <input
            type="checkbox"
            checked={state.highlightOctant}
            onChange={(e) => update({ highlightOctant: e.target.checked })}
            className="w-4 h-4 accent-indigo-600"
          />
        </label>
      </div>
    </div>
  );
}
