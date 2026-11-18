import React, { useState } from "react";
import { FileText, Send, CheckCircle2 } from "lucide-react";

interface AdminDashboardProps {
  communityName: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ communityName }) => {
  const [advisoryTitle, setAdvisoryTitle] = useState("");
  const [advisoryBody, setAdvisoryBody] = useState("");
  const [advisorySent, setAdvisorySent] = useState(false);
  const [showCivicComplaint, setShowCivicComplaint] = useState(false);

  const handleSendAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryTitle || !advisoryBody) return;
    setAdvisorySent(true);
    setTimeout(() => {
      setAdvisorySent(false);
      setAdvisoryTitle("");
      setAdvisoryBody("");
    }, 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-900">RWA Administrator Operations</h3>
      </div>

      <form onSubmit={handleSendAdvisory} className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Compose Community Smog Advisory
        </h4>

        <div>
          <label htmlFor="adv-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Advisory Headline
          </label>
          <input
            id="adv-title"
            type="text"
            required
            value={advisoryTitle}
            onChange={(e) => setAdvisoryTitle(e.target.value)}
            placeholder="e.g. Winter Smog Protocol: Postpone Sweeping to 12 PM"
            className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="adv-body" className="block text-xs font-semibold text-slate-700 mb-1">
            Advisory Message
          </label>
          <textarea
            id="adv-body"
            required
            rows={3}
            value={advisoryBody}
            onChange={(e) => setAdvisoryBody(e.target.value)}
            placeholder="Detail instructions for society maintenance, guard room heaters, and leaf disposal..."
            className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Dispatches notification to participating households.
          </span>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Publish Advisory</span>
          </button>
        </div>

        {advisorySent && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Advisory successfully published to society members!</span>
          </div>
        )}
      </form>

      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Municipal Civic Complaint Drafter
            </h4>
            <p className="text-xs text-slate-500">
              Generate formal representation to MCD / CPCB for biomass burning violations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCivicComplaint(!showCivicComplaint)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {showCivicComplaint ? "Hide Draft" : "Draft Complaint"}
          </button>
        </div>

        {showCivicComplaint && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 font-mono">
            <p>
              <strong>To:</strong> Zonal Deputy Commissioner, Municipal Corporation of Delhi
            </p>
            <p>
              <strong>Subject:</strong> Urgent Complaint: Illegal Biomass Incineration under Section
              19, Air Act 1981
            </p>
            <p>
              On behalf of residents of {communityName}, we draw your attention to persistent
              burning under current Severe NAQI conditions.
            </p>
            <button
              type="button"
              onClick={() => alert("Draft copied!")}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-sans font-bold text-xs hover:bg-slate-800"
            >
              Copy Official Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
