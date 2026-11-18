import React, { useRef, useEffect, useState } from "react";
import { Wind, Shield, Flame, Sliders } from "lucide-react";
import { StaticRoomSchematic } from "./StaticRoomSchematic";

interface RoomSimulatorCanvasProps {
  outdoorPm25?: number;
}

function calculateSteadyState(
  outdoorPm25: number,
  windowOpen: boolean,
  purifierOn: boolean,
  cookingActive: boolean,
): number {
  const ach = windowOpen ? 2.5 : 0.4;
  const cadr = purifierOn ? 250 : 0;
  const volume = 45;
  const penetration = 0.8;
  const source = cookingActive ? 15000 : 0;
  const kDep = 0.2;

  const steadyState =
    (penetration * ach * outdoorPm25 + source / volume) / (ach + cadr / volume + kDep);
  return Math.round(steadyState);
}

export const RoomSimulatorCanvas: React.FC<RoomSimulatorCanvasProps> = ({ outdoorPm25 = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [windowOpen, setWindowOpen] = useState(false);
  const [purifierOn, setPurifierOn] = useState(true);
  const [cookingActive, setCookingActive] = useState(false);
  const [simMinutes, setSimMinutes] = useState(15);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [forceStaticView, setForceStaticView] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
    return undefined;
  }, []);

  const indoorPm25 = calculateSteadyState(outdoorPm25, windowOpen, purifierOn, cookingActive);

  useEffect(() => {
    if (prefersReducedMotion || forceStaticView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    const height = (canvas.height = 240);

    const particleCount = Math.min(200, Math.max(10, Math.round(indoorPm25 / 1.5)));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (width - 40) + 20,
      y: Math.random() * (height - 40) + 20,
      vx: (Math.random() - 0.5) * (purifierOn ? 1.5 : 0.5),
      vy: (Math.random() - 0.5) * (purifierOn ? 1.5 : 0.5),
      size: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      ctx.fillStyle = indoorPm25 > 150 ? "#e11d48" : indoorPm25 > 60 ? "#f59e0b" : "#10b981";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 15 || p.x > width - 25) p.vx *= -1;
        if (p.y < 15 || p.y > height - 25) p.vy *= -1;
      }
      animId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
    };
    window.addEventListener("resize", handleResize);

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [indoorPm25, prefersReducedMotion, forceStaticView, purifierOn]);

  const cleanPercent = Math.max(0, Math.round(((outdoorPm25 - indoorPm25) / outdoorPm25) * 100));

  return (
    <section
      aria-label="Room Physics Air Simulator"
      className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            Room Physics Simulator
          </h3>
          <p className="text-xs text-slate-500">
            Real-time mass-balance particle physics modeling indoor PM2.5 vs outdoor atmosphere.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setForceStaticView(!forceStaticView)}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={forceStaticView ? "Show animated particle canvas" : "Show static schematic"}
        >
          {forceStaticView ? "Show Animated Canvas" : "Show Static Schematic"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <span className="text-[11px] font-semibold text-slate-500 block">Outdoor PM2.5</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">{outdoorPm25} µg/m³</span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <span className="text-[11px] font-semibold text-emerald-800 block">Modeled Indoor</span>
          <span className="text-lg font-bold text-emerald-900 tabular-nums">
            {indoorPm25} µg/m³
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <span className="text-[11px] font-semibold text-slate-500 block">Air Protection</span>
          <span className="text-lg font-bold text-emerald-700 tabular-nums">
            {cleanPercent}% cleaner
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <span className="text-[11px] font-semibold text-slate-500 block">Simulation Time</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">+{simMinutes} mins</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => setWindowOpen(!windowOpen)}
          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            windowOpen
              ? "bg-sky-500 text-white border-sky-600"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
          aria-pressed={windowOpen}
        >
          <Wind className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>Window: {windowOpen ? "OPEN (2.5 ACH)" : "CLOSED (0.4 ACH)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setPurifierOn(!purifierOn)}
          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            purifierOn
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
          aria-pressed={purifierOn}
        >
          <Shield className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>HEPA Purifier: {purifierOn ? "ON (250 m³/h)" : "OFF"}</span>
        </button>

        <button
          type="button"
          onClick={() => setCookingActive(!cookingActive)}
          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            cookingActive
              ? "bg-orange-500 text-white border-orange-600"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
          aria-pressed={cookingActive}
        >
          <Flame className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>Cooking: {cookingActive ? "ACTIVE (+15 mg/h)" : "IDLE"}</span>
        </button>
      </div>

      {prefersReducedMotion || forceStaticView ? (
        <StaticRoomSchematic
          indoorPm25={indoorPm25}
          outdoorPm25={outdoorPm25}
          windowOpen={windowOpen}
          purifierOn={purifierOn}
          cookingActive={cookingActive}
        />
      ) : (
        <div className="w-full h-60 bg-slate-900/95 rounded-2xl overflow-hidden relative border border-slate-800">
          <canvas
            ref={canvasRef}
            aria-label="Animated room dust particles simulation canvas"
            role="img"
            className="w-full h-full"
          />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md text-[11px] text-white font-mono">
            Modeled Indoor: {indoorPm25} µg/m³
          </div>
        </div>
      )}

      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="sim-time-slider">Time Scrubber (Model Progression)</label>
          <span className="tabular-nums font-bold text-emerald-700">{simMinutes} minutes</span>
        </div>
        <input
          id="sim-time-slider"
          type="range"
          min={5}
          max={60}
          step={5}
          value={simMinutes}
          onChange={(e) => setSimMinutes(Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
      </div>
    </section>
  );
};
