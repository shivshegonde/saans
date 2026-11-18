import React from "react";

interface ImpactControlsCardProps {
  commuteMode: string;
  setCommuteMode: (val: string) => void;
  distanceKm: number;
  setDistanceKm: (val: number) => void;
  maskHours: number;
  setMaskHours: (val: number) => void;
  purifierHours: number;
  setPurifierHours: (val: number) => void;
  cookingMinutes: number;
  setCookingMinutes: (val: number) => void;
}

export const ImpactControlsCard: React.FC<ImpactControlsCardProps> = ({
  commuteMode,
  setCommuteMode,
  distanceKm,
  setDistanceKm,
  maskHours,
  setMaskHours,
  purifierHours,
  setPurifierHours,
  cookingMinutes,
  setCookingMinutes,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
        Action Toggles & Parameters
      </h3>

      <div className="space-y-1.5">
        <label htmlFor="commute-mode-select" className="block text-xs font-semibold text-slate-700">
          Commute Mode Shift
        </label>
        <select
          id="commute-mode-select"
          value={commuteMode}
          onChange={(e) => setCommuteMode(e.target.value)}
          className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="metro">Delhi Metro (Zero Tailpipe)</option>
          <option value="bus">Electric / CNG Bus</option>
          <option value="ev">Electric Scooter / 4W</option>
          <option value="carpool">Carpool (Petrol 4W)</option>
          <option value="soloCar">Solo Petrol Car (Baseline)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="distance-slider">Commute Distance</label>
          <span className="tabular-nums font-bold text-emerald-700">{distanceKm} km</span>
        </div>
        <input
          id="distance-slider"
          type="range"
          min={2}
          max={50}
          step={1}
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="mask-hours-slider">N95 Mask Worn Outdoors</label>
          <span className="tabular-nums font-bold text-emerald-700">{maskHours} hours</span>
        </div>
        <input
          id="mask-hours-slider"
          type="range"
          min={0}
          max={8}
          step={0.5}
          value={maskHours}
          onChange={(e) => setMaskHours(Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="purifier-hours-slider">HEPA Air Purifier Runtime</label>
          <span className="tabular-nums font-bold text-emerald-700">{purifierHours} hours</span>
        </div>
        <input
          id="purifier-hours-slider"
          type="range"
          min={0}
          max={24}
          step={1}
          value={purifierHours}
          onChange={(e) => setPurifierHours(Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="cooking-slider">Kitchen Exhaust Runtime</label>
          <span className="tabular-nums font-bold text-emerald-700">{cookingMinutes} mins</span>
        </div>
        <input
          id="cooking-slider"
          type="range"
          min={0}
          max={60}
          step={5}
          value={cookingMinutes}
          onChange={(e) => setCookingMinutes(Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
      </div>
    </div>
  );
};
