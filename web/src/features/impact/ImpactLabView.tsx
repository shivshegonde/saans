import React, { useState, useEffect } from "react";
import { ImpactCalculationResponse } from "shared";
import { calculateImpact, recordLedger } from "../../api/client";
import { CalculationDrawer } from "./CalculationDrawer";
import { ImpactControlsCard } from "./ImpactControlsCard";
import { Activity, HelpCircle, PlusCircle, Check } from "lucide-react";

interface LensCardsProps {
  impactData: ImpactCalculationResponse | null;
}

const FamilyExposureCard: React.FC<LensCardsProps> = ({ impactData }) => {
  const reduction = impactData?.familyExposure.reductionPercent || 40;
  const point = impactData ? impactData.familyExposure.pointEstimateUg : "...";
  const baseline = impactData ? impactData.familyExposure.baselineDoseUg : 120;
  const remaining = Math.round(100 - reduction);

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
        <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
          Avoided Inhaled Dose
        </span>
        <div className="text-4xl md:text-5xl font-extrabold text-emerald-900 tabular-nums my-1">
          {point !== "..." ? `−${point}` : point} µg
        </div>
        <p className="text-xs text-emerald-700 font-medium">
          Uncertainty range: {impactData?.familyExposure.uncertaintyRangeUg.min ?? 0} –{" "}
          {impactData?.familyExposure.uncertaintyRangeUg.max ?? 0} µg
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>Baseline Exposure (No Action)</span>
            <span className="tabular-nums">100% (~{baseline} µg)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-rose-500 h-3 rounded-full w-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-emerald-800 mb-1">
            <span>With Selected Safeguards</span>
            <span className="tabular-nums">~{remaining}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(15, 100 - reduction)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CityEmissionsCard: React.FC<LensCardsProps> = ({ impactData }) => {
  const co2Avoided = impactData ? impactData.cityEmissions.co2eAvoidedKg.toFixed(2) : "...";
  const pm25Avoided = impactData
    ? `${impactData.cityEmissions.pm25AvoidedGrams.toFixed(3)} grams`
    : "...";

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
        <span className="text-xs uppercase font-bold tracking-wider text-teal-800">
          Avoided Community Carbon
        </span>
        <div className="text-4xl md:text-5xl font-extrabold text-teal-900 tabular-nums my-1">
          {co2Avoided !== "..." ? `−${co2Avoided}` : co2Avoided} kg
        </div>
        <p className="text-xs text-teal-700 font-medium">CO₂e greenhouse emissions averted today</p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Avoided Tailpipe PM2.5:</span>
          <strong className="text-slate-900 tabular-nums">{pm25Avoided}</strong>
        </div>
        <div className="flex justify-between">
          <span>Metro Energy Efficiency:</span>
          <strong className="text-slate-900">89% cleaner than car</strong>
        </div>
      </div>
    </div>
  );
};

export const ImpactLabView: React.FC = () => {
  const [lens, setLens] = useState<"family" | "city">("family");
  const [commuteMode, setCommuteMode] = useState<string>("metro");
  const [distanceKm, setDistanceKm] = useState<number>(14);
  const [maskHours, setMaskHours] = useState<number>(3);
  const [purifierHours, setPurifierHours] = useState<number>(10);
  const [cookingMinutes, setCookingMinutes] = useState<number>(20);

  const [impactData, setImpactData] = useState<ImpactCalculationResponse | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [addedToLedger, setAddedToLedger] = useState(false);

  useEffect(() => {
    let active = true;
    calculateImpact({
      commuteMode,
      commuteDistanceKm: distanceKm,
      maskWornHours: maskHours,
      purifierHours,
      stovetopCookingMinutes: cookingMinutes,
    })
      .then((res) => {
        if (active) setImpactData(res);
      })
      .catch((err) => {
        console.error("Impact calculation failed", err);
      });

    return () => {
      active = false;
    };
  }, [commuteMode, distanceKm, maskHours, purifierHours, cookingMinutes]);

  const handleAddToLedger = async () => {
    if (!impactData) return;
    try {
      await recordLedger({
        actionId: "custom-simulation",
        date: new Date().toISOString().split("T")[0]!,
        avoidedDoseUg: impactData.familyExposure.pointEstimateUg,
        avoidedEmissionsGramsCo2: impactData.cityEmissions.co2eAvoidedKg * 1000,
      });
      setAddedToLedger(true);
      setTimeout(() => setAddedToLedger(false), 3000);
    } catch (e) {
      console.error("Ledger record failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            Impact Lab
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulate family exposure reduction & community emission savings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label="Impact Perspective Lens"
            className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200"
          >
            <button
              type="button"
              onClick={() => setLens("family")}
              aria-pressed={lens === "family"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                lens === "family"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Family (Exposure)
            </button>
            <button
              type="button"
              onClick={() => setLens("city")}
              aria-pressed={lens === "city"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                lens === "city"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My City (Emissions)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Open 'How we calculated this' documentation"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImpactControlsCard
          commuteMode={commuteMode}
          setCommuteMode={setCommuteMode}
          distanceKm={distanceKm}
          setDistanceKm={setDistanceKm}
          maskHours={maskHours}
          setMaskHours={setMaskHours}
          purifierHours={purifierHours}
          setPurifierHours={setPurifierHours}
          cookingMinutes={cookingMinutes}
          setCookingMinutes={setCookingMinutes}
        />

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                {lens === "family" ? "Family Exposure Reduction" : "City Emissions Savings"}
              </h3>
              <span className="text-[11px] text-slate-400">Pure mass-balance engine</span>
            </div>

            {lens === "family" ? (
              <FamilyExposureCard impactData={impactData} />
            ) : (
              <CityEmissionsCard impactData={impactData} />
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToLedger}
            disabled={addedToLedger}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              addedToLedger
                ? "bg-emerald-700 text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            }`}
          >
            {addedToLedger ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Recorded in Household Ledger!</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>Add Simulation to My Ledger</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CalculationDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        impactData={impactData}
      />
    </div>
  );
};
