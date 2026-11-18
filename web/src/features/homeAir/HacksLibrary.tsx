import React, { useState } from "react";
import { Sparkles, Tag, Clock } from "lucide-react";

interface Hack {
  id: string;
  title: string;
  category: "Free" | "Under ₹500" | "5 Minutes";
  description: string;
  efficacy: string;
  timeEstimate: string;
  cost: string;
}

const HACKS_DATA: Hack[] = [
  {
    id: "hack-wet-mop",
    title: "Damp Microfiber Wet-Mopping",
    category: "Free",
    description:
      "Dry sweeping aerosolizes settled PM10 and PM2.5. Wet mopping binds respirable dust without resuspension.",
    efficacy: "~40% less resuspended indoor dust",
    timeEstimate: "10 mins",
    cost: "₹0 (Free)",
  },
  {
    id: "hack-door-draft",
    title: "Rolled Towel Door Bottom Draft Stopper",
    category: "Free",
    description:
      "External gaps under entry doors allow heavy nighttime outdoor smog infiltration into living quarters.",
    efficacy: "Cuts gap air leakage by up to 60%",
    timeEstimate: "2 mins",
    cost: "₹0 (Free)",
  },
  {
    id: "hack-weather-tape",
    title: "Self-Adhesive Window Foam Weatherstrip",
    category: "Under ₹500",
    description:
      "Seal perimeter frame cracks on older wooden or aluminum sliding windows using EVA foam tape.",
    efficacy: "Reduces infiltration rate from 1.5 to 0.4 ACH",
    timeEstimate: "15 mins",
    cost: "₹180",
  },
  {
    id: "hack-exhaust-fan",
    title: "Kitchen Exhaust Fan While Frying",
    category: "5 Minutes",
    description:
      "Mustard oil and tempering spices emit ultra-fine PM2.5 peaks up to 800 µg/m³. Run exhaust with kitchen door shut.",
    efficacy: "Prevents 85% spread to bedrooms",
    timeEstimate: "5 mins",
    cost: "₹0 (Free)",
  },
  {
    id: "hack-corsic-box",
    title: "DIY Box Fan MERV-13 Purifier",
    category: "Under ₹500",
    description:
      "Attach a high-grade pleated AC filter sheet to a standard square exhaust/table fan with painter's tape.",
    efficacy: "Delivers ~120 m³/h CADR at 1/10th cost",
    timeEstimate: "10 mins",
    cost: "₹450",
  },
  {
    id: "hack-prefilter-rinse",
    title: "Bi-Weekly Purifier Mesh Rinse",
    category: "5 Minutes",
    description:
      "Vacuuming or washing the coarse outer mesh filter prevents premature clogging of the dense HEPA core.",
    efficacy: "Restores airflow and reduces power draw",
    timeEstimate: "5 mins",
    cost: "₹0 (Free)",
  },
];

export const HacksLibrary: React.FC = () => {
  const [filter, setFilter] = useState<"All" | "Free" | "Under ₹500" | "5 Minutes">("All");

  const filteredHacks =
    filter === "All" ? HACKS_DATA : HACKS_DATA.filter((h) => h.category === filter);

  return (
    <section
      aria-label="Clean Air Hacks Library"
      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />
            Low-Cost Clean Air Hacks Library
          </h3>
          <p className="text-xs text-slate-500">
            Scientifically backed practical interventions for high-smog periods.
          </p>
        </div>

        {/* Filter Pills */}
        <div role="group" aria-label="Filter Hacks" className="flex items-center gap-1.5 flex-wrap">
          {(["All", "Free", "Under ₹500", "5 Minutes"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                filter === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHacks.map((hack) => (
          <article
            key={hack.id}
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex flex-col justify-between space-y-3 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  <Tag className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  {hack.category}
                </span>
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {hack.timeEstimate}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{hack.title}</h4>
              <p className="text-xs text-slate-600 mt-1.5">{hack.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800">{hack.efficacy}</span>
              <span className="text-slate-500 font-medium">{hack.cost}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
