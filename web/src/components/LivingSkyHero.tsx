import React from "react";
import { AirNowResponse } from "shared";
import { Wind, AlertTriangle, ShieldCheck, Info } from "lucide-react";

interface LivingSkyHeroProps {
  data: AirNowResponse | null;
  isLoading?: boolean;
}

const CATEGORY_STYLES: Record<
  string,
  {
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    accentColor: string;
  }
> = {
  Good: {
    bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    accentColor: "#2E9E4F",
  },
  Satisfactory: {
    bgGradient: "from-lime-500/20 via-emerald-500/10 to-transparent",
    badgeBg: "bg-lime-100 dark:bg-lime-950/60",
    badgeText: "text-lime-800 dark:text-lime-300",
    accentColor: "#7BC043",
  },
  Moderate: {
    bgGradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeText: "text-amber-800 dark:text-amber-300",
    accentColor: "#F2C230",
  },
  Poor: {
    bgGradient: "from-orange-500/25 via-amber-500/15 to-transparent",
    badgeBg: "bg-orange-100 dark:bg-orange-950/60",
    badgeText: "text-orange-800 dark:text-orange-300",
    accentColor: "#F28C28",
  },
  "Very Poor": {
    bgGradient: "from-red-500/30 via-orange-500/20 to-transparent",
    badgeBg: "bg-red-100 dark:bg-red-950/60",
    badgeText: "text-red-800 dark:text-red-300",
    accentColor: "#E0443E",
  },
  Severe: {
    bgGradient: "from-rose-900/35 via-rose-800/25 to-stone-900/20",
    badgeBg: "bg-rose-100 dark:bg-rose-950/70",
    badgeText: "text-rose-900 dark:text-rose-200",
    accentColor: "#8E1B3A",
  },
};

export const LivingSkyHero: React.FC<LivingSkyHeroProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="w-full rounded-3xl p-8 bg-slate-100 animate-pulse min-h-[320px] flex items-center justify-center">
        <span className="text-slate-500 font-medium">Measuring live atmospheric conditions...</span>
      </div>
    );
  }

  const category = data.category || "Moderate";
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES["Moderate"]!;

  return (
    <section
      aria-label="Current Air Quality Hero"
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 p-4 sm:p-6 md:p-8 bg-gradient-to-b ${style.bgGradient} backdrop-blur-sm transition-colors duration-500`}
    >
      {/* Visual atmospheric haze layers */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.7), transparent 70%)",
        }}
      />

      {/* Top provenance & location strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Live Air Quality
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {data.location.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px] sm:max-w-none">{data.provenance.source}</span>
          <span className="text-slate-300">•</span>
          <span className="flex-shrink-0">Updated just now</span>
        </div>
      </div>

      {/* Primary AQI Display and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
        <div>
          <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
            <span
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tabular-nums tracking-tight text-slate-900"
              style={{ color: style.accentColor }}
            >
              {data.aqi}
            </span>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${style.badgeBg} ${style.badgeText}`}
              >
                {category === "Severe" || category === "Very Poor" ? (
                  <AlertTriangle
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ShieldCheck
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {category} NAQI
              </span>
              <div className="text-xs text-slate-500 mt-1">
                Dominant: <strong className="text-slate-700">{data.dominantPollutant}</strong>
              </div>
            </div>
          </div>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg font-medium text-slate-800 leading-snug">
            {data.summaryHeadline}
          </p>
        </div>

        {/* Health Guidelines & Pollutant Metrics */}
        <div className="bg-white/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-100">
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              PM2.5 Concentration
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                {data.pollutants.pm25} µg/m³
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-900">
                ×{data.whoMultiple} WHO guideline
              </span>
            </div>
          </div>

          {/* Smog Drivers Chips */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Atmospheric Smog Drivers
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {data.smogDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-lg text-xs text-slate-700"
                  title={driver.explanation}
                >
                  <Wind className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[11px] sm:text-xs">{driver.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
