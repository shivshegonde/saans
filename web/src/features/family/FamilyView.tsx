import React, { useState } from "react";
import { Users, Heart, GraduationCap, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  sensitivity: "Elderly / Cardiac" | "Child / Asthma" | "Healthy Adult";
  avatar: string;
  personalAdvisory: string;
  schoolOutdoorSafe: boolean;
  schoolPeReason: string;
  recommendedMask: string;
}

const DEMO_MEMBERS: FamilyMember[] = [
  {
    id: "mem-dadaji",
    name: "Dadaji (Grandfather)",
    relation: "Grandparent",
    age: 74,
    sensitivity: "Elderly / Cardiac",
    avatar: "👴",
    personalAdvisory:
      "High cardiac and pulmonary vulnerability during winter thermal inversion. Morning walk strictly indoor only before 11:30 am.",
    schoolOutdoorSafe: false,
    schoolPeReason: "Not applicable. Morning brisk walking postponed.",
    recommendedMask: "N95 / FFP2 with exhalation valve or comfort seal.",
  },
  {
    id: "mem-aarav",
    name: "Aarav (Son)",
    relation: "Child",
    age: 9,
    sensitivity: "Child / Asthma",
    avatar: "👦",
    personalAdvisory:
      "Lungs developing; breathing volume per kg body weight is 2x that of adults. Keep rescue inhaler in school bag.",
    schoolOutdoorSafe: false,
    schoolPeReason:
      "Outdoor PE today? NOT recommended before 1 pm — morning surface boundary layer traps high diesel exhaust near school ground.",
    recommendedMask: "Small-profile certified pediatric N95.",
  },
  {
    id: "mem-riya",
    name: "Riya (Household Head)",
    relation: "Self",
    age: 38,
    sensitivity: "Healthy Adult",
    avatar: "👩",
    personalAdvisory:
      "Switch commute from open auto/bike to Delhi Metro. Wear N95 during transit intervals.",
    schoolOutdoorSafe: true,
    schoolPeReason: "Moderate outdoor exercise acceptable during 1 pm – 4 pm ventilation window.",
    recommendedMask: "Standard N95 headband mask.",
  },
];

export const FamilyView: React.FC = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("mem-aarav");

  const member = DEMO_MEMBERS.find((m) => m.id === selectedMemberId) || DEMO_MEMBERS[0]!;

  return (
    <div className="space-y-6">
      {/* Family Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Family Health & Activity Advisory</h2>
            <p className="text-xs text-slate-500">
              Personalized guidance tailored to age groups, sensitivity flags, and daily school
              runs.
            </p>
          </div>
        </div>
      </div>

      {/* Member Selection Chips */}
      <div
        role="tablist"
        aria-label="Family Member Selection"
        className="flex items-center gap-3 overflow-x-auto pb-1"
      >
        {DEMO_MEMBERS.map((m) => {
          const isSelected = m.id === selectedMemberId;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedMemberId(m.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0 ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {m.avatar}
              </span>
              <div className="text-left">
                <span className="block leading-tight">{m.name}</span>
                <span
                  className={`text-[10px] font-normal ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                >
                  {m.sensitivity}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Member Detail Advisory Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">Selected Profile</span>
            <h3 className="text-lg font-bold text-slate-900">
              {member.name} ({member.age} yrs)
            </h3>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>{member.sensitivity}</span>
          </span>
        </div>

        {/* Personalized Health Guidance */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Tailored Smog Advisory
          </h4>
          <p className="text-sm font-medium text-slate-800">{member.personalAdvisory}</p>
          <div className="pt-2 text-xs text-slate-600">
            Recommended Mask: <strong className="text-slate-900">{member.recommendedMask}</strong>
          </div>
        </div>

        {/* School-Run & Outdoor Activity Advisor */}
        <div
          role="region"
          aria-label="School & Outdoor Activity Advisor"
          className="p-5 rounded-2xl border bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200 space-y-3"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rose-700" aria-hidden="true" />
            <h4 className="text-sm font-bold text-slate-900">
              School-Run & Outdoor Activity Guidance
            </h4>
          </div>

          <div className="flex items-start gap-3">
            {member.schoolOutdoorSafe ? (
              <CheckCircle2
                className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{member.schoolPeReason}</p>
              <p className="text-xs text-slate-600">
                School bus windows should remain shut on arterial roads. If school PE cannot be
                moved indoors, request sedentary library study.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
