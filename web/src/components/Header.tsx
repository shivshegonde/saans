import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, ZoomIn, Globe } from "lucide-react";
import { changeLanguage } from "../i18n";

interface HeaderProps {
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontScale: string;
  cycleFontScale: () => void;
  currentPersona?: string;
}

export const Header: React.FC<HeaderProps> = ({
  highContrast,
  toggleHighContrast,
  fontScale,
  cycleFontScale,
  currentPersona,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm"
            aria-hidden="true"
          >
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              {t("app.title")}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {t("app.subtitle")}
            </p>
          </div>
          {currentPersona && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 ml-2">
              Persona: {currentPersona}
            </span>
          )}
        </div>

        {/* Accessibility & Localization toolbar */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative inline-flex items-center">
            <label htmlFor="language-select" className="sr-only">
              Select Language
            </label>
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <select
                id="language-select"
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value as "en" | "hi" | "mr")}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
          </div>

          {/* Root rem scaler */}
          <button
            onClick={cycleFontScale}
            type="button"
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={`${t("a11y.fontScale")} is ${fontScale}. Click to cycle size`}
          >
            <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums">{fontScale}</span>
          </button>

          {/* High-contrast mode toggle */}
          <button
            onClick={toggleHighContrast}
            type="button"
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
              highContrast
                ? "bg-yellow-400 text-black border-yellow-500 font-bold"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            aria-label={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{highContrast ? t("a11y.highContrastOn") : t("a11y.highContrast")}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
