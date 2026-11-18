import React from "react";
import { X, BookOpen } from "lucide-react";
import { ImpactCalculationResponse } from "shared";

interface CalculationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  impactData: ImpactCalculationResponse | null;
}

export const CalculationDrawer: React.FC<CalculationDrawerProps> = ({
  isOpen,
  onClose,
  impactData,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calc-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h2 id="calc-drawer-title" className="text-lg font-bold text-slate-900">
              How We Calculated This
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close calculation sheet"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-600">
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Inhaled Dose Exposure Formula</h3>
            <p className="font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-900">
              {impactData?.formulaSheet.exposureFormula ||
                "Dose (µg) = Σ [ C_i × VE × T_i × (1 - η_mask) ]"}
            </p>
            <p>
              Where <strong>C_i</strong> is microenvironment PM2.5 (µg/m³), <strong>VE</strong> is
              ventilation rate (~0.45 m³/h for resting adult, 1.2 m³/h for active), and{" "}
              <strong>η_mask</strong> is certified N95 penetration resistance (~95%).
            </p>
          </section>

          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Avoided City Emissions Factors</h3>
            <p className="font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-900">
              {impactData?.formulaSheet.emissionsFormula ||
                "Avoided CO₂e (g) = Distance (km) × (EF_baseline - EF_alternative)"}
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Petrol Car Baseline: <strong>140 g CO₂e/km</strong> (ICCT India 2023)
              </li>
              <li>
                Delhi Metro / EV: <strong>15 g CO₂e/passenger-km</strong> (DMRC 2022)
              </li>
              <li>
                Avoided Tailpipe PM2.5: <strong>0.012 g PM2.5/km</strong>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Honest Uncertainty Range</h3>
            <p>
              Real-world inhaled dose varies by facial mask seal leak (5–20%) and infiltration rates
              (0.4–1.2 ACH). Saans presents a 90% confidence uncertainty band:
            </p>
            {impactData && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold">
                Estimated avoidance: {impactData.familyExposure.pointEstimateUg} µg (range:{" "}
                {impactData.familyExposure.uncertaintyRangeUg.min} –{" "}
                {impactData.familyExposure.uncertaintyRangeUg.max} µg)
              </div>
            )}
          </section>

          <section className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Sources:{" "}
              {impactData?.formulaSheet.sources.join(", ") ||
                "CPCB (2018), WHO (2021), ICCT (2023)"}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
