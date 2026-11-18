import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AirNowResponse } from "shared";
import { LivingSkyHero } from "./components/LivingSkyHero";
import { Eye, ZoomIn, ShieldAlert } from "lucide-react";

async function fetchAirNow(): Promise<AirNowResponse> {
  const res = await fetch("/api/v1/air/now");
  if (!res.ok) {
    throw new Error(`Failed to load air quality: ${res.statusText}`);
  }
  return res.json();
}

export function App() {
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState("100%");

  useEffect(() => {
    const isHc = document.documentElement.getAttribute("data-contrast") === "high";
    setHighContrast(isHc);
    const scale = document.documentElement.style.fontSize || "100%";
    setFontScale(scale);
  }, []);

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.setAttribute("data-contrast", "high");
      localStorage.setItem("saans.contrast", "high");
    } else {
      document.documentElement.removeAttribute("data-contrast");
      localStorage.removeItem("saans.contrast");
    }
  };

  const cycleFontScale = () => {
    const next = fontScale === "100%" ? "120%" : fontScale === "120%" ? "140%" : "100%";
    setFontScale(next);
    document.documentElement.style.fontSize = next;
    localStorage.setItem("saans.fontScale", next);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["airNow"],
    queryFn: fetchAirNow,
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Application Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Saans
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Urban Air Quality Assistant
              </p>
            </div>
          </div>

          {/* Accessibility controls: High contrast and font scaler */}
          <div className="flex items-center gap-2">
            <button
              onClick={cycleFontScale}
              type="button"
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={`Current font scale is ${fontScale}. Click to cycle size`}
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{fontScale}</span>
            </button>

            <button
              onClick={toggleHighContrast}
              type="button"
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                highContrast
                  ? "bg-yellow-400 text-black border-yellow-500 font-bold"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              aria-label={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{highContrast ? "High Contrast: ON" : "High Contrast"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8 outline-none"
      >
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Failed to connect to air quality service</h3>
              <p className="text-xs text-rose-700 mt-0.5">{(error as Error).message}</p>
            </div>
          </div>
        )}

        <LivingSkyHero data={data || null} isLoading={isLoading} />
      </main>

      {/* Minimal Accessible Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4">
          <p>© 2026 Saans. General environmental guidance only; not medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
export default App;
