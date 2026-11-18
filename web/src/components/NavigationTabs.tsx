import React from "react";
import { useTranslation } from "react-i18next";
import { SunMedium, CalendarCheck, Activity, Wind, Users, ShieldAlert } from "lucide-react";

export type NavTab = "today" | "plan" | "impact" | "homeAir" | "family" | "community";

interface NavigationTabsProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useTranslation();

  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    {
      id: "today",
      label: t("nav.today"),
      icon: <SunMedium className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: "plan",
      label: t("nav.plan"),
      icon: <CalendarCheck className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: "impact",
      label: t("nav.impact"),
      icon: <Activity className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: "homeAir",
      label: t("nav.homeAir"),
      icon: <Wind className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: "family",
      label: t("nav.family"),
      icon: <Users className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: "community",
      label: t("nav.community"),
      icon: <ShieldAlert className="w-5 h-5" aria-hidden="true" />,
    },
  ];

  return (
    <>
      {/* Desktop Horizontal Navigation */}
      <nav
        aria-label="Main Navigation"
        className="hidden md:flex items-center gap-1 border-b border-slate-200 bg-white/70 px-4 py-1.5"
      >
        <div
          role="tablist"
          aria-label="Sections"
          className="flex items-center gap-2 max-w-6xl mx-auto w-full"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Fixed Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg px-2 py-1"
      >
        <div role="tablist" aria-label="Mobile Sections" className="grid grid-cols-6 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`mob-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[48px] py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isActive
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                <span className="truncate max-w-[52px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
