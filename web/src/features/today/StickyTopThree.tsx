import React from "react";
import { ArrowRight } from "lucide-react";
import { ActionCard } from "shared";

interface StickyTopThreeProps {
  topActions: ActionCard[];
  onActionClick?: (actionId: string) => void;
}

export const StickyTopThree: React.FC<StickyTopThreeProps> = ({ topActions, onActionClick }) => {
  if (!topActions || topActions.length === 0) return null;

  const top3 = topActions.slice(0, 3);

  return (
    <aside
      aria-label="Top 3 actions for today"
      className="p-4 rounded-3xl bg-emerald-900/90 text-white shadow-md border border-emerald-700/60 backdrop-blur"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-200">
            3 Things That Matter Most Today
          </h2>
        </div>
        <span className="text-xs text-emerald-300 font-medium">Prioritized for peak smog</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {top3.map((action, index) => (
          <div
            key={action.id}
            onClick={() => onActionClick?.(action.id)}
            className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/40 text-emerald-200 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold leading-snug line-clamp-2">{action.title}</h3>
              <p className="text-[11px] text-emerald-200 mt-0.5 line-clamp-1">
                −{action.impact.healthExposureReductionPercent}% inhaled PM2.5
              </p>
            </div>
            <ArrowRight
              className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0 mt-1"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </aside>
  );
};
