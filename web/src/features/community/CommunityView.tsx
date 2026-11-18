import React, { useState } from "react";
import { ShieldAlert, Users, Award, Lock, Trees, CheckCircle2 } from "lucide-react";
import { AdminDashboard } from "./AdminDashboard";

interface CommunityPledge {
  id: string;
  title: string;
  category: string;
  targetCount: number;
  currentCount: number;
  joined: boolean;
}

export const CommunityView: React.FC = () => {
  const [joinCode, setJoinCode] = useState("");
  const [communityName, setCommunityName] = useState("Vasant Kunj Sector C RWA");
  const memberHouseholdsCount = 8;
  const [isAdmin, setIsAdmin] = useState(false);

  const [pledges, setPledges] = useState<CommunityPledge[]>([
    {
      id: "pl-1",
      title: "Zero Waste Burning Pledge",
      category: "Emissions",
      targetCount: 20,
      currentCount: 14,
      joined: true,
    },
    {
      id: "pl-2",
      title: "Shared School Carpool Pool",
      category: "Transport",
      targetCount: 15,
      currentCount: 9,
      joined: false,
    },
    {
      id: "pl-3",
      title: "Generator Ban During Peak Smog",
      category: "Energy",
      targetCount: 30,
      currentCount: 22,
      joined: false,
    },
  ]);

  const kAnonymityMet = memberHouseholdsCount >= 5;

  const handleJoinPledge = (id: string) => {
    setPledges((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              joined: !p.joined,
              currentCount: p.joined ? p.currentCount - 1 : p.currentCount + 1,
            }
          : p,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{communityName}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Community-driven clean air action, collective pledges, and local RWA coordination.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="join-code-input" className="sr-only">
            Community Join Code
          </label>
          <input
            id="join-code-input"
            type="text"
            placeholder="Enter Join Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 sm:w-36 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono min-h-[40px]"
          />
          <button
            type="button"
            onClick={() => {
              if (joinCode) {
                setCommunityName(`Joined Community (${joinCode.toUpperCase()})`);
                setJoinCode("");
              }
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] flex-shrink-0"
          >
            Join
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
        <span className="text-xs font-bold text-slate-600 px-3">View Perspective:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              !isAdmin ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resident View
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              isAdmin ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            RWA Admin Dashboard
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Collective Community Impact
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{memberHouseholdsCount} active households</span>
          </span>
        </div>

        {kAnonymityMet ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="text-xs uppercase font-bold text-emerald-800">CO₂e Avoided</span>
              <div className="text-3xl font-extrabold text-emerald-900 tabular-nums my-1">
                −418 kg
              </div>
              <p className="text-[11px] text-emerald-700">Through metro shifts & carpooling</p>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
              <span className="text-xs uppercase font-bold text-teal-800">Trees Equivalent</span>
              <div className="text-3xl font-extrabold text-teal-900 tabular-nums my-1 flex items-center justify-center gap-1">
                <Trees className="w-7 h-7 text-teal-700" aria-hidden="true" />
                <span>19</span>
              </div>
              <p className="text-[11px] text-teal-700">Annual carbon sequestration matched</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
              <span className="text-xs uppercase font-bold text-indigo-800">
                Pledges Accomplished
              </span>
              <div className="text-3xl font-extrabold text-indigo-900 tabular-nums my-1">
                45 / 65
              </div>
              <p className="text-[11px] text-indigo-700">Household commitments met</p>
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
          >
            <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900">
                Privacy Protection Active (k-Anonymity)
              </h4>
              <p className="text-xs text-amber-800">
                To guarantee zero leakage of individual household habits, collective aggregates
                require at least 5 participating households (current: {memberHouseholdsCount}).
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-900">Neighborhood Smog Pledges</h3>
        </div>

        <div className="space-y-3">
          {pledges.map((pledge) => {
            const progress = Math.min(
              100,
              Math.round((pledge.currentCount / pledge.targetCount) * 100),
            );
            return (
              <div
                key={pledge.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {pledge.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{pledge.title}</h4>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 max-w-md">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {pledge.currentCount} of {pledge.targetCount} households joined ({progress}%)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinPledge(pledge.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    pledge.joined
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
                  }`}
                >
                  {pledge.joined ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      <span>Joined Pledge</span>
                    </>
                  ) : (
                    <span>Join Pledge</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {isAdmin && <AdminDashboard communityName={communityName} />}
    </div>
  );
};
