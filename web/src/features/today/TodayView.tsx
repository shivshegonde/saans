import React from "react";
import { AirNowResponse } from "shared";
import { LivingSkyHero } from "../../components/LivingSkyHero";
import { TimelineChart } from "../../components/TimelineChart";
import { StickyTopThree } from "./StickyTopThree";
import { ActionCard, AirForecastResponse } from "shared";
import { Share2 } from "lucide-react";

interface TodayViewProps {
  airNow: AirNowResponse | null;
  airForecast: AirForecastResponse | null;
  topActions: ActionCard[];
  isLoading?: boolean;
  onOpenShareModal: () => void;
  onNavigateToPlan?: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  airNow,
  airForecast,
  topActions,
  isLoading,
  onOpenShareModal,
  onNavigateToPlan,
}) => {
  return (
    <div className="space-y-6">
      {/* Top action bar: Share Today's Air */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenShareModal}
          className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Share Today's Air report as an image"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>Share Today's Air</span>
        </button>
      </div>

      {/* Signature Screen 1: Living Sky Hero */}
      <LivingSkyHero data={airNow} isLoading={isLoading} />

      {/* Signature Screen: Sticky 3 Things That Matter Most */}
      <StickyTopThree topActions={topActions} onActionClick={() => onNavigateToPlan?.()} />

      {/* Signature Screen 2: 72-Hour Timeline Chart */}
      <TimelineChart data={airForecast} isLoading={isLoading} />
    </div>
  );
};
