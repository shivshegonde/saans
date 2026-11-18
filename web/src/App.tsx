import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AirNowResponse, TodayPlanResponse, AirForecastResponse } from "shared";
import { fetchAirNow, fetchAirForecast, fetchTodayPlan } from "./api/client";
import { Header } from "./components/Header";
import { SkipLink } from "./components/SkipLink";
import { NavigationTabs, NavTab } from "./components/NavigationTabs";
import { TabContentRenderer } from "./components/TabContentRenderer";
import { AskSaansSheet } from "./components/AskSaansSheet";
import { ShareCardModal } from "./components/ShareCardModal";
import { JudgeDemoBar } from "./components/JudgeDemoBar";
import { MessageSquare, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export function App() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<NavTab>("today");
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState("100%");
  const [isAskSaansOpen, setIsAskSaansOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [currentPersona, setCurrentPersona] = useState("Riya (Owner)");
  const [currentScenario, setCurrentScenario] = useState("Severe");

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

  const {
    data: airNow,
    isLoading: isAirLoading,
    error: airError,
    refetch: refetchAir,
  } = useQuery<AirNowResponse>({
    queryKey: ["airNow", currentScenario],
    queryFn: fetchAirNow,
    refetchInterval: 60000,
  });

  const { data: airForecast, isLoading: isForecastLoading } = useQuery<AirForecastResponse>({
    queryKey: ["airForecast", currentScenario],
    queryFn: fetchAirForecast,
    refetchInterval: 120000,
  });

  const { data: todayPlan, isLoading: isPlanLoading } = useQuery<TodayPlanResponse>({
    queryKey: ["todayPlan", currentScenario],
    queryFn: () => fetchTodayPlan(),
    refetchInterval: 120000,
  });

  const handlePersonaChange = (p: string) => {
    setCurrentPersona(p);
    if (p.includes("Admin")) setActiveTab("community");
    else if (p.includes("Scoped")) setActiveTab("family");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/60 text-slate-900 pb-16 md:pb-0">
      <SkipLink />

      <JudgeDemoBar
        currentPersona={currentPersona}
        currentScenario={currentScenario}
        onScenarioChange={(s) => {
          setCurrentScenario(s);
          refetchAir();
        }}
        onPersonaChange={handlePersonaChange}
        onTimeAdvance={() => refetchAir()}
        onResetClock={() => refetchAir()}
      />

      <Header
        highContrast={highContrast}
        toggleHighContrast={toggleHighContrast}
        fontScale={fontScale}
        cycleFontScale={cycleFontScale}
        currentPersona={currentPersona}
      />

      <NavigationTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6 outline-none"
      >
        {airError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3"
          >
            <ShieldAlert
              className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-semibold text-sm">Failed to connect to air quality service</h3>
              <p className="text-xs text-rose-700 mt-0.5">{(airError as Error).message}</p>
            </div>
          </div>
        )}

        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          <TabContentRenderer
            activeTab={activeTab}
            airNow={airNow || null}
            airForecast={airForecast || null}
            todayPlan={todayPlan || null}
            isLoadingAir={isAirLoading || isForecastLoading}
            isLoadingPlan={isPlanLoading}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onNavigateToPlan={() => setActiveTab("plan")}
          />
        </div>
      </main>

      <aside aria-label="Quick Ask Assistant">
        <button
          type="button"
          onClick={() => setIsAskSaansOpen(true)}
          className="fixed bottom-20 md:bottom-8 right-5 z-40 px-4 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xl hover:bg-emerald-700 flex items-center gap-2 border-2 border-white focus:outline-none focus:ring-4 focus:ring-emerald-400 transition-transform hover:scale-105"
          aria-label="Open Ask Saans AI assistant dialog"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Ask Saans</span>
        </button>
      </aside>

      <AskSaansSheet isOpen={isAskSaansOpen} onClose={() => setIsAskSaansOpen(false)} />
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        airData={airNow || null}
      />

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Saans. {t("app.disclaimer")}</p>
          <p className="text-[11px] text-slate-400">
            CPCB NAQI Standard • WHO Guidelines 2021 • Pure TS Engines
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
