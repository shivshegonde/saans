import React, { useState } from "react";
import { ActionCard } from "shared";
import {
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Heart,
  Globe2,
  Clock,
  Sparkles,
} from "lucide-react";

interface ActionCardItemProps {
  action: ActionCard;
  onToggleDone: (actionId: string, completed: boolean) => void;
}

const ActionImpactBadges: React.FC<{ action: ActionCard }> = ({ action }) => (
  <div className="flex flex-wrap items-center gap-2 mt-3">
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
      <Heart className="w-3 h-3 text-rose-600" aria-hidden="true" />
      <span>Health: −{action.impact.healthExposureReductionPercent}% inhaled PM2.5</span>
    </span>
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
      <Globe2 className="w-3 h-3 text-teal-600" aria-hidden="true" />
      <span>City: −{action.impact.cityCo2eAvoidedKg} kg CO₂e</span>
    </span>
  </div>
);

const ActionWhyDisclosure: React.FC<{
  action: ActionCard;
  expanded: boolean;
  onToggle: () => void;
}> = ({ action, expanded, onToggle }) => (
  <div className="mt-4 pt-3 border-t border-slate-100">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
      aria-expanded={expanded}
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
      <span>Why this matters</span>
      {expanded ? (
        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
    {expanded && (
      <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
        <p>{action.why}</p>
        {action.evidence?.sources?.[0] && (
          <p className="text-[11px] text-slate-500 italic">
            Scientific source: {action.evidence.sources[0].title} (
            {action.evidence.sources[0].organisation})
          </p>
        )}
      </div>
    )}
  </div>
);

export const ActionCardItem: React.FC<ActionCardItemProps> = ({ action, onToggleDone }) => {
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(action.completed || false);
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    const next = !completed;
    setCompleted(next);
    if (next) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
    onToggleDone(action.id, next);
  };

  const timeLabel = action.recommendedTime || action.timeSlot;

  return (
    <article
      aria-label={action.title}
      className={`rounded-3xl border transition-all duration-300 p-5 ${
        completed
          ? "bg-emerald-50/70 border-emerald-300/80"
          : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={
            completed ? `Mark ${action.title} as incomplete` : `Mark ${action.title} as completed`
          }
          className="flex-shrink-0 min-w-[44px] min-h-[44px] -ml-2 -mt-1 rounded-full flex items-center justify-center transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
              completed
                ? "bg-emerald-600 text-white border-emerald-600 scale-105"
                : "border-slate-300 hover:border-emerald-500 text-transparent"
            } ${animating ? "animate-bounce" : ""}`}
          >
            <CheckCircle2 className="w-4 h-4 fill-current" aria-hidden="true" />
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
              <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
              {timeLabel}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 capitalize">
              Effort: {action.effort}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
              Cost: {action.costBand}
            </span>
          </div>

          <h3
            className={`text-base font-bold text-slate-900 leading-snug ${completed ? "line-through text-slate-500" : ""}`}
          >
            {action.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1">{action.description}</p>
          <ActionImpactBadges action={action} />
        </div>

        <button
          type="button"
          onClick={() => window.open(`/api/v1/plan/calendar.ics?actionId=${action.id}`, "_blank")}
          className="flex-shrink-0 p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Add to calendar (.ics)"
          aria-label={`Add ${action.title} to calendar`}
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <ActionWhyDisclosure
        action={action}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
    </article>
  );
};
