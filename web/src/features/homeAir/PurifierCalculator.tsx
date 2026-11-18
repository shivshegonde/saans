import React, { useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";

export const PurifierCalculator: React.FC = () => {
  const [areaSqFt, setAreaSqFt] = useState(180);
  const [ceilingHeightFt, setCeilingHeightFt] = useState(9);
  const [targetAch, setTargetAch] = useState(4.8); // AHAM standard 4.8 ACH

  // Sizing formula from core/indoor.ts
  // Volume (m3) = area (sq ft) * 0.092903 * height (ft) * 0.3048
  // CADR (m3/h) = Volume * target ACH
  // CADR (CFM) = CADR (m3/h) / 1.699
  const volumeM3 = areaSqFt * 0.092903 * ceilingHeightFt * 0.3048;
  const requiredCadrM3h = Math.round(volumeM3 * targetAch);
  const requiredCadrCfm = Math.round(requiredCadrM3h / 1.699);

  return (
    <section
      aria-label="Air Purifier CADR Sizing Calculator"
      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
    >
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        <div>
          <h3 className="text-base font-bold text-slate-900">Purifier CADR Sizing Calculator</h3>
          <p className="text-xs text-slate-500">
            Right-size your clean air delivery rate (CADR) to achieve AHAM-grade protection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Room Area */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="area-input">Room Area</label>
            <span className="tabular-nums font-bold text-emerald-700">{areaSqFt} sq ft</span>
          </div>
          <input
            id="area-input"
            type="range"
            min={50}
            max={600}
            step={10}
            value={areaSqFt}
            onChange={(e) => setAreaSqFt(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Ceiling Height */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="ceiling-input">Ceiling Height</label>
            <span className="tabular-nums font-bold text-emerald-700">{ceilingHeightFt} ft</span>
          </div>
          <input
            id="ceiling-input"
            type="range"
            min={7}
            max={14}
            step={0.5}
            value={ceilingHeightFt}
            onChange={(e) => setCeilingHeightFt(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Target ACH */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="ach-select">Target Air Changes / Hr</label>
            <span className="tabular-nums font-bold text-emerald-700">{targetAch} ACH</span>
          </div>
          <select
            id="ach-select"
            value={targetAch}
            onChange={(e) => setTargetAch(Number(e.target.value))}
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={3.0}>3.0 ACH (Moderate Protection)</option>
            <option value={4.8}>4.8 ACH (AHAM Recommended Standard)</option>
            <option value={6.0}>6.0 ACH (High Risk / Vulnerable)</option>
          </select>
        </div>
      </div>

      {/* Sizing Output Box */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
            Recommended Clean Air Delivery Rate (CADR)
          </span>
          <div className="text-3xl font-extrabold text-emerald-900 tabular-nums mt-0.5">
            {requiredCadrM3h} m³/h{" "}
            <span className="text-base font-semibold text-emerald-700">
              ({requiredCadrCfm} CFM)
            </span>
          </div>
        </div>

        <div className="text-xs text-emerald-800 space-y-1 max-w-xs">
          <p className="flex items-center gap-1.5 font-medium">
            <CheckCircle2
              className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
              aria-hidden="true"
            />
            Covers {Math.round(volumeM3)} m³ room volume at {targetAch} air turns/hr.
          </p>
          <p className="text-[11px] text-emerald-700">
            Look for true H13/H14 HEPA filters. Avoid uncertified ionizers that emit ozone.
          </p>
        </div>
      </div>
    </section>
  );
};
