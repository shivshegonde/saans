import React from "react";

interface StaticRoomSchematicProps {
  indoorPm25: number;
  outdoorPm25: number;
  windowOpen: boolean;
  purifierOn: boolean;
  cookingActive: boolean;
}

export const StaticRoomSchematic: React.FC<StaticRoomSchematicProps> = ({
  indoorPm25,
  outdoorPm25,
  windowOpen,
  purifierOn,
  cookingActive,
}) => {
  return (
    <div
      role="img"
      aria-label={`Static room schematic: Indoor modeled PM2.5 is ${indoorPm25} µg/m³, outdoor ambient is ${outdoorPm25} µg/m³. Window is ${windowOpen ? "open" : "closed"}, purifier is ${purifierOn ? "on" : "off"}, cooking is ${cookingActive ? "active" : "inactive"}.`}
      className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-300 p-6 flex flex-col justify-between bg-slate-50"
    >
      <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
        <span>Outdoor Air: {outdoorPm25} µg/m³</span>
        <span>Window: {windowOpen ? "Open (2.5 ACH)" : "Closed (0.4 ACH)"}</span>
      </div>

      <div className="text-center my-auto">
        <span className="text-xs uppercase font-bold text-slate-500">
          Modeled Indoor Atmosphere
        </span>
        <div className="text-4xl font-extrabold text-slate-900 tabular-nums my-1">
          {indoorPm25} µg/m³
        </div>
        <p className="text-xs font-medium text-emerald-700">
          {purifierOn ? "HEPA active · Air cleaned at 250 m³/h" : "Purifier idle"}
        </p>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>Room Volume: 45 m³ (~180 sq ft)</span>
        <span>Sources: {cookingActive ? "High (Cooking Active)" : "Zero indoor emission"}</span>
      </div>
    </div>
  );
};
