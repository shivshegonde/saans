import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Table, BarChart2, ShieldCheck, Clock } from "lucide-react";
import { AirForecastResponse, ForecastPoint } from "shared";

interface TimelineChartProps {
  data: AirForecastResponse | null;
  isLoading?: boolean;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data, isLoading }) => {
  const [showTable, setShowTable] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (isLoading || !data || !data.series || data.series.length === 0) {
    return (
      <div className="w-full h-72 rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center p-6 text-slate-400 font-medium">
        Loading 72-hour air forecast timeline...
      </div>
    );
  }

  const series = data.series.slice(0, 72);
  const bestWindowPoint = series.find((p) => p.isBestWindow);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setSelectedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, series.length - 1)));
    } else if (e.key === "ArrowLeft") {
      setSelectedIndex((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
    }
  };

  const chartData = series.map((h: ForecastPoint, i: number) => {
    const d = new Date(h.time);
    const label = isNaN(d.getTime())
      ? h.time
      : `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:00`;
    return {
      index: i,
      time: label,
      rawTime: h.time,
      aqi: h.aqi,
      pm25: h.pm25,
      category: h.category,
      isBestWindow: h.isBestWindow,
    };
  });

  const selectedPoint = selectedIndex !== null ? chartData[selectedIndex] : null;

  return (
    <section
      aria-label="72-Hour Air Quality Timeline"
      className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            72-Hour Air Quality Timeline
          </h2>
          <p className="text-xs text-slate-500">
            CPCB NAQI forecast. Use Left/Right arrow keys to scrub timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bestWindowPoint && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Best window: {bestWindowPoint.time}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={showTable ? "Switch to chart view" : "Switch to accessible data table view"}
          >
            {showTable ? (
              <>
                <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Chart View</span>
              </>
            ) : (
              <>
                <Table className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Data Table</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selected point callout for keyboard scrub */}
      {selectedPoint && (
        <div
          role="status"
          aria-live="polite"
          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-medium text-slate-700"
        >
          <span>
            Selected Time: <strong className="text-slate-900">{selectedPoint.time}</strong>
          </span>
          <span>
            Forecast AQI: <strong className="text-slate-900">{selectedPoint.aqi}</strong> (
            {selectedPoint.category})
          </span>
          <span>
            PM2.5: <strong className="text-slate-900">{selectedPoint.pm25} µg/m³</strong>
          </span>
        </div>
      )}

      {showTable ? (
        /* Accessible data table for screen readers */
        <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <caption className="sr-only">72-Hour Air Quality Forecast Table</caption>
            <thead className="bg-slate-100 text-slate-900 uppercase font-bold sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-2 border-b">
                  Time
                </th>
                <th scope="col" className="px-4 py-2 border-b">
                  Forecast AQI
                </th>
                <th scope="col" className="px-4 py-2 border-b">
                  Category
                </th>
                <th scope="col" className="px-4 py-2 border-b">
                  PM2.5 (µg/m³)
                </th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row: (typeof chartData)[0]) => (
                <tr key={row.rawTime} className="hover:bg-slate-50 border-b border-slate-100">
                  <td className="px-4 py-2 font-medium">{row.time}</td>
                  <td className="px-4 py-2 tabular-nums font-bold">{row.aqi}</td>
                  <td className="px-4 py-2">{row.category}</td>
                  <td className="px-4 py-2 tabular-nums">{row.pm25}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts visual area chart */
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Interactive timeline graph. Focus and press arrow keys to navigate hours."
          className="w-full h-72 outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f28c28" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2e9e4f" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} interval={8} />
              <YAxis
                domain={[0, "dataMax + 40"]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                unit=" AQI"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0]?.payload as (typeof chartData)[0];
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                        <p className="font-bold">{d.time}</p>
                        <p>
                          AQI: <strong className="text-emerald-400">{d.aqi}</strong> ({d.category})
                        </p>
                        <p>PM2.5: {d.pm25} µg/m³</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Category thresholds */}
              <ReferenceArea y1={0} y2={50} fill="#2E9E4F" fillOpacity={0.05} />
              <ReferenceArea y1={51} y2={100} fill="#7BC043" fillOpacity={0.05} />
              <ReferenceArea y1={101} y2={200} fill="#F2C230" fillOpacity={0.06} />
              <ReferenceArea y1={201} y2={300} fill="#F28C28" fillOpacity={0.08} />
              <ReferenceArea y1={301} y2={400} fill="#E0443E" fillOpacity={0.09} />
              <ReferenceArea y1={401} y2={500} fill="#8E1B3A" fillOpacity={0.12} />
              {/* 'Now' marker */}
              <ReferenceLine
                x={chartData[0]?.time}
                stroke="#0284c7"
                strokeWidth={2}
                label={{ value: "Now", fill: "#0284c7", fontSize: 11, position: "top" }}
              />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#ea580c"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#aqiAreaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
