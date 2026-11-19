import React, { useState } from "react";
import {
  Clock,
  RotateCcw,
  Sliders,
  AlertTriangle,
  UserCheck,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OutboxInspectorModal } from "./OutboxInspectorModal";

interface JudgeDemoBarProps {
  onScenarioChange?: (scenario: string) => void;
  onPersonaChange?: (persona: string) => void;
  onTimeAdvance?: (minutes: number) => void;
  onResetClock?: () => void;
  currentPersona?: string;
  currentScenario?: string;
}

export const JudgeDemoBar: React.FC<JudgeDemoBarProps> = ({
  onScenarioChange,
  onPersonaChange,
  onTimeAdvance,
  onResetClock,
  currentPersona = "Riya (Owner)",
  currentScenario = "Severe",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [showInspector, setShowInspector] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTimeTravel = (mins: number) => {
    onTimeAdvance?.(mins);
    showToast(`Simulated Clock advanced by +${mins}m.`);
  };

  const handleReset = () => {
    onResetClock?.();
    showToast("Simulated Clock reset to current local time.");
  };

  const handleScenario = (s: string) => {
    onScenarioChange?.(s);
    showToast(`Atmospheric scenario switched to: ${s}`);
  };

  const handlePersona = (p: string) => {
    let token = "demo-token-riya";
    if (p.includes("Dadaji")) token = "demo-token-dadaji";
    else if (p.includes("Admin") || p.includes("Kulkarni")) token = "demo-token-kulkarni";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("saans.token", token);
      } catch {}
    }
    onPersonaChange?.(p);
    showToast(`Switched active persona to: ${p}`);
  };

  const handleTriggerSevere = () => {
    onScenarioChange?.("Severe");
    onTimeAdvance?.(30);
    showToast("Triggered Severe Smog Event! Forecast peak reached, outbox alerts queued.");
  };

  const handleTriggerGrace = () => {
    onTimeAdvance?.(35);
    showToast("Grace timeout (30 min) passed! Alert escalated to consenting co-guardian.");
  };

  return (
    <>
      {/* Toast Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl border border-slate-700 flex items-center gap-2 animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Bar */}
      <aside
        aria-label="Judge Evaluation Demo Bar"
        className="bg-slate-900 text-white border-b border-slate-800 text-xs z-30 transition-all shadow-md"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="px-1.5 sm:px-2 py-0.5 rounded font-black text-[9px] sm:text-[10px] tracking-wider uppercase bg-amber-400 text-black">
              Demo (FR-20)
            </span>
            <span className="text-slate-400 font-mono text-[10px] sm:text-[11px]">
              <span className="hidden sm:inline">
                Persona: <strong className="text-white">{currentPersona.split(" ")[0]}</strong>{" "}
                |{" "}
              </span>
              <span className="text-slate-400">Scenario: </span>
              <strong className="text-emerald-400">{currentScenario}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowInspector(true)}
              className="px-2 sm:px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-amber-400 min-h-[32px]"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-hidden="true" />
              <span className="hidden xs:inline">Outbox</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 sm:p-1.5 rounded text-slate-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-400 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label={isCollapsed ? "Expand Judge Demo Bar" : "Collapse Judge Demo Bar"}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="border-t border-slate-800/80 bg-slate-950/60 px-4 py-2.5 max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Time Travel */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                Time:
              </span>
              <button
                type="button"
                onClick={() => handleTimeTravel(15)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => handleTimeTravel(30)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => handleTimeTravel(60)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
              >
                +1h
              </button>
              <button
                type="button"
                onClick={() => handleTimeTravel(360)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
              >
                +6h
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
                title="Reset Clock to real time"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            {/* Scenario Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Sliders className="w-3 h-3" aria-hidden="true" />
                Scenario:
              </span>
              {["Clean", "Moderate", "Poor", "Severe"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleScenario(s)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    currentScenario === s
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Personas Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <UserCheck className="w-3 h-3" aria-hidden="true" />
                Persona:
              </span>
              {["Riya (Owner)", "Dadaji (Scoped)", "Mr. Kulkarni (Admin)"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePersona(p)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    currentPersona === p
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {p.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Smog & Grace Triggers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTriggerSevere}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                <span>Severe Smog</span>
              </button>
              <button
                type="button"
                onClick={handleTriggerGrace}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold"
              >
                Grace Timeout
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Outbox Inspector Modal */}
      <OutboxInspectorModal isOpen={showInspector} onClose={() => setShowInspector(false)} />
    </>
  );
};
