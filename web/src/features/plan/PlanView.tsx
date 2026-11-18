import React from "react";
import { ActionCard, TodayPlanResponse } from "shared";
import { ActionCardItem } from "./ActionCardItem";
import { Calendar, Sunrise, Sun, Sunset, Moon, Sparkles } from "lucide-react";
import { toggleActionItem } from "../../api/client";

interface PlanViewProps {
  plan: TodayPlanResponse | null;
  isLoading?: boolean;
}

export const PlanView: React.FC<PlanViewProps> = ({ plan, isLoading }) => {
  if (isLoading || !plan) {
    return (
      <div className="w-full h-80 rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center p-6 text-slate-400 font-medium">
        Generating personalized deterministic action plan...
      </div>
    );
  }

  const handleToggleDone = async (actionId: string, completed: boolean) => {
    try {
      await toggleActionItem(actionId, completed);
    } catch (e) {
      console.error("Action toggle failed", e);
    }
  };

  const cards = plan.cards || [];
  const morningActions = cards.filter((a) => a.timeSlot === "morning");
  const afternoonActions = cards.filter((a) => a.timeSlot === "afternoon");
  const eveningActions = cards.filter((a) => a.timeSlot === "evening");
  const nightActions = cards.filter((a) => a.timeSlot === "night" || a.timeSlot === "allDay");

  const renderSlotGroup = (
    title: string,
    actions: ActionCard[],
    icon: React.ReactNode,
    colorClass: string,
  ) => {
    if (actions.length === 0) return null;
    return (
      <section aria-labelledby={`slot-${title.toLowerCase()}`} className="space-y-3">
        <div className={`flex items-center gap-2 pb-1 border-b ${colorClass}`}>
          {icon}
          <h3
            id={`slot-${title.toLowerCase()}`}
            className="text-sm font-bold uppercase tracking-wider text-slate-800"
          >
            {title} ({actions.length})
          </h3>
        </div>
        <div className="space-y-3">
          {actions.map((act) => (
            <ActionCardItem key={act.id} action={act} onToggleDone={handleToggleDone} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      {/* Plan Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Today's Action Plan</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rules P1–P10 prioritized for current NAQI: {plan.naqiCategory} ({plan.currentAqi} AQI)
          </p>
        </div>

        <a
          href="/api/v1/plan/calendar.ics"
          download="saans-daily-plan.ics"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Export All to Calendar (.ics)</span>
        </a>
      </div>

      {/* Grouped Action Slots */}
      <div className="space-y-8">
        {renderSlotGroup(
          "Morning",
          morningActions,
          <Sunrise className="w-5 h-5 text-amber-500" aria-hidden="true" />,
          "border-amber-200",
        )}
        {renderSlotGroup(
          "Afternoon",
          afternoonActions,
          <Sun className="w-5 h-5 text-orange-500" aria-hidden="true" />,
          "border-orange-200",
        )}
        {renderSlotGroup(
          "Evening",
          eveningActions,
          <Sunset className="w-5 h-5 text-indigo-500" aria-hidden="true" />,
          "border-indigo-200",
        )}
        {renderSlotGroup(
          "Night / All Day",
          nightActions,
          <Moon className="w-5 h-5 text-slate-500" aria-hidden="true" />,
          "border-slate-200",
        )}
      </div>
    </div>
  );
};
