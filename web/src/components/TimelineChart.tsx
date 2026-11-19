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
import { AirForecastResponse } from "shared";

interface TimelineChartProps {
  data: AirForecastResponse | null;
  isLoading?: boolean;
}

interface ChartPointItem {
  time?: string;
  timeIso?: string;
  aqi: number;
  pm25: number;
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  isBestWindow?: boolean;
}

interface ProcessedChartData {
  index: number;
  time: string;
  rawTime: string;
  aqi: number;
  pm25: number;
  category: string;
  isBestWindow: boolean;
}

interface ForecastPayload {
  series?: ChartPointItem[];
  hours?: ChartPointItem[];
}

function formatChartLabel(rawTime: string): string {
  const d = new Date(rawTime);
  return isNaN(d.getTime()) ? rawTime : `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:00`;
}

function processSeriesData(series: ChartPointItem[]): ProcessedChartData[] {
  return series.map((h, i) => {
    const rawTime = h.time ?? h.timeIso ?? "";
    return {
      index: i,
      time: formatChartLabel(rawTime),
      rawTime,
      aqi: h.aqi,
      pm25: h.pm25,
      category: h.category,
      isBestWindow: Boolean(h.isBestWindow),
    };
  });
}

interface TimelineTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ProcessedChartData }>;
}

const TimelineTooltip: React.FC<TimelineTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
      <p className="font-bold">{d.time}</p>
      <p>
        AQI: <strong className="text-emerald-400">{d.aqi}</strong> ({d.category})
      </p>
      <p>PM2.5: {d.pm25} µg/m³</p>
    </div>
  );
};

interface TableViewProps {
  chartData: ProcessedChartData[];
}

const TimelineTableView: React.FC<TableViewProps> = ({ chartData }) => (
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
        {chartData.map((row) => (
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
);

interface AreaGraphViewProps {
  chartData: ProcessedChartData[];
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const TimelineAreaGraphView: React.FC<AreaGraphViewProps> = ({ chartData, onKeyDown }) => {
  const firstTime = chartData[0]?.time ?? "";
  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
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
          <Tooltip content={<TimelineTooltip />} />
          <ReferenceArea y1={0} y2={50} fill="#2E9E4F" fillOpacity={0.05} />
          <ReferenceArea y1={51} y2={100} fill="#7BC043" fillOpacity={0.05} />
          <ReferenceArea y1={101} y2={200} fill="#F2C230" fillOpacity={0.06} />
          <ReferenceArea y1={201} y2={300} fill="#F28C28" fillOpacity={0.08} />
          <ReferenceArea y1={301} y2={400} fill="#E0443E" fillOpacity={0.09} />
          <ReferenceArea y1={401} y2={500} fill="#8E1B3A" fillOpacity={0.12} />
          <ReferenceLine
            x={firstTime}
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
  );
};

function extractRawList(data: unknown): ChartPointItem[] {
  if (!data || typeof data !== "object") return [];
  const p = data as ForecastPayload;
  if (Array.isArray(p.series)) return p.series;
  if (Array.isArray(p.hours)) return p.hours;
  return [];
}

function computeKeyStep(key: string, prev: number | null, maxIndex: number): number | null {
  if (key === "ArrowRight") {
    return prev === null ? 0 : Math.min(prev + 1, maxIndex);
  }
  if (key === "ArrowLeft") {
    return prev === null ? 0 : Math.max(prev - 1, 0);
  }
  return prev;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data, isLoading }) => {
  const [showTable, setShowTable] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const rawList = extractRawList(data);

  if (isLoading || rawList.length === 0) {
    return (
      <div className="w-full h-72 rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center p-6 text-slate-400 font-medium">
        Loading 72-hour air forecast timeline...
      </div>
    );
  }

  const series = rawList.slice(0, 72);
  const bestWindowPoint = series.find((p) => p.isBestWindow);
  const chartData = processSeriesData(series);
  const selectedPoint = selectedIndex !== null ? chartData[selectedIndex] : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setSelectedIndex((prev) => computeKeyStep(e.key, prev, series.length - 1));
  };

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
              <span>Best window: {bestWindowPoint.time ?? bestWindowPoint.timeIso}</span>
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
        <TimelineTableView chartData={chartData} />
      ) : (
        <TimelineAreaGraphView chartData={chartData} onKeyDown={handleKeyDown} />
      )}
    </section>
  );
};
