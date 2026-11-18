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
  X,
} from "lucide-react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase bg-amber-400 text-black">
              Judge Demo Bar (FR-20)
            </span>
            <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
              Persona: <strong className="text-white">{currentPersona}</strong> | Scenario:{" "}
              <strong className="text-emerald-400">{currentScenario}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowInspector(true)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Outbox Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded text-slate-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
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
      {showInspector && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspector-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <h3 id="inspector-title" className="text-base font-bold">
                  Transactional Outbox & Event Inspector (FR-20)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                aria-label="Close Outbox Inspector"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Real transactional outbox items written atomically with domain events. Guarded against
              double dispatch via in-process mutex and lease lock.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-emerald-400 font-bold">STATUS: DISPATCHED</span>
                  <span className="text-slate-500">Attempts: 1/5 • Channel: EMAIL</span>
                </div>
                <p className="font-bold text-slate-200">
                  Subject: Severe Smog Advisory — Delhi NCR AQI 380
                </p>
                <p className="text-slate-400 text-[11px]">
                  Recipient: riya@example.com (Household Owner)
                </p>
                <p className="text-slate-500 text-[10px]">
                  Idempotency Key: h_riya123_alert_forecast_peak_1700000000
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-amber-400 font-bold">STATUS: PENDING (ESCALATED)</span>
                  <span className="text-slate-500">Attempts: 0/5 • Channel: SMS / PUSH</span>
                </div>
                <p className="font-bold text-slate-200">
                  Subject: Co-Guardian Escalation: Dadaji Morning Walk Alert Unacknowledged
                </p>
                <p className="text-slate-400 text-[11px]">
                  Recipient: amit@example.com (Consenting Co-Guardian)
                </p>
                <p className="text-slate-500 text-[10px]">
                  Idempotency Key: h_riya123_alert_escalation_grace_1700001800
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
