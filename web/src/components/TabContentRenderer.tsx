import React from "react";
import { AirNowResponse, TodayPlanResponse, AirForecastResponse } from "shared";
import { NavTab } from "./NavigationTabs";
import { TodayView } from "../features/today/TodayView";
import { PlanView } from "../features/plan/PlanView";
import { ImpactLabView } from "../features/impact/ImpactLabView";
import { HomeAirView } from "../features/homeAir/HomeAirView";
import { FamilyView } from "../features/family/FamilyView";
import { CommunityView } from "../features/community/CommunityView";

interface TabContentRendererProps {
  activeTab: NavTab;
  airNow: AirNowResponse | null;
  airForecast: AirForecastResponse | null;
  todayPlan: TodayPlanResponse | null;
  isLoadingAir: boolean;
  isLoadingPlan: boolean;
  onOpenShareModal: () => void;
  onNavigateToPlan: () => void;
}

export const TabContentRenderer: React.FC<TabContentRendererProps> = ({
  activeTab,
  airNow,
  airForecast,
  todayPlan,
  isLoadingAir,
  isLoadingPlan,
  onOpenShareModal,
  onNavigateToPlan,
}) => {
  switch (activeTab) {
    case "today":
      return (
        <TodayView
          airNow={airNow}
          airForecast={airForecast}
          topActions={todayPlan?.cards || []}
          isLoading={isLoadingAir}
          onOpenShareModal={onOpenShareModal}
          onNavigateToPlan={onNavigateToPlan}
        />
      );
    case "plan":
      return <PlanView plan={todayPlan} isLoading={isLoadingPlan} />;
    case "impact":
      return <ImpactLabView />;
    case "homeAir":
      return <HomeAirView outdoorPm25={airNow?.pollutants.pm25 || 185} />;
    case "family":
      return <FamilyView />;
    case "community":
      return <CommunityView />;
    default:
      return null;
  }
};
