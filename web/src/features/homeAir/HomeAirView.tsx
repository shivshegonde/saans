import React from "react";
import { RoomSimulatorCanvas } from "./RoomSimulatorCanvas";
import { PurifierCalculator } from "./PurifierCalculator";
import { HacksLibrary } from "./HacksLibrary";
import { Home } from "lucide-react";

interface HomeAirViewProps {
  outdoorPm25?: number;
}

export const HomeAirView: React.FC<HomeAirViewProps> = ({ outdoorPm25 = 185 }) => {
  return (
    <div className="space-y-8">
      {/* Home Air Overview Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Home className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Indoor Air Quality & Physics</h2>
            <p className="text-xs text-slate-500">
              Household indoor air modeling, CADR sizing, and practical dust mitigation.
            </p>
          </div>
        </div>
      </div>

      {/* Signature Feature: Room Physics Particle Simulator */}
      <RoomSimulatorCanvas outdoorPm25={outdoorPm25} />

      {/* Signature Feature: Purifier Sizing Calculator */}
      <PurifierCalculator />

      {/* Signature Feature: Low-Cost Clean Air Hacks Library */}
      <HacksLibrary />
    </div>
  );
};
