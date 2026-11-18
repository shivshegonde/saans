import React from "react";
import { Mail, X } from "lucide-react";

interface OutboxInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutboxInspectorModal: React.FC<OutboxInspectorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
    >
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-700 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" aria-hidden="true" />
            <h3 id="inspector-title" className="text-sm sm:text-base font-bold">
              Transactional Outbox & Event Inspector (FR-20)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
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
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
              <span className="text-emerald-400 font-bold">STATUS: DISPATCHED</span>
              <span className="text-slate-500">Attempts: 1/5 • Channel: EMAIL</span>
            </div>
            <p className="font-bold text-slate-200 text-xs">
              Subject: Severe Smog Advisory — Delhi NCR AQI 380
            </p>
            <p className="text-slate-400 text-[11px]">
              Recipient: riya@example.com (Household Owner)
            </p>
            <p className="text-slate-500 text-[10px] break-all">
              Idempotency Key: h_riya123_alert_forecast_peak_1700000000
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
              <span className="text-amber-400 font-bold">STATUS: PENDING (ESCALATED)</span>
              <span className="text-slate-500">Attempts: 0/5 • Channel: SMS / PUSH</span>
            </div>
            <p className="font-bold text-slate-200 text-xs">
              Subject: Co-Guardian Escalation: Dadaji Morning Walk Alert Unacknowledged
            </p>
            <p className="text-slate-400 text-[11px]">
              Recipient: amit@example.com (Consenting Co-Guardian)
            </p>
            <p className="text-slate-500 text-[10px] break-all">
              Idempotency Key: h_riya123_alert_escalation_grace_1700001800
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
