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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm flex-shrink-0"
            aria-hidden="true"
          >
            S
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-tight truncate">
              {t("app.title")}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
              {t("app.subtitle")}
            </p>
          </div>
          {currentPersona && (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 ml-2">
              Persona: {currentPersona}
            </span>
          )}
        </div>

        {/* Accessibility & Localization toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Language selector */}
          <div className="relative inline-flex items-center">
            <label htmlFor="language-select" className="sr-only">
              Select Language
            </label>
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 min-h-[36px] sm:min-h-[40px]">
              <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
              <select
                id="language-select"
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value as "en" | "hi" | "mr")}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
          </div>

          {/* Root rem scaler */}
          <button
            onClick={cycleFontScale}
            type="button"
            className="min-h-[36px] min-w-[36px] sm:min-h-[40px] px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={`${t("a11y.fontScale")} is ${fontScale}. Click to cycle size`}
          >
            <ZoomIn className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="tabular-nums text-[11px] sm:text-xs">{fontScale}</span>
          </button>

          {/* High-contrast mode toggle */}
          <button
            onClick={toggleHighContrast}
            type="button"
            className={`min-h-[36px] min-w-[36px] sm:min-h-[40px] px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
              highContrast
                ? "bg-yellow-400 text-black border-yellow-500 font-bold"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            aria-label={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
          >
            <Eye className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">
              {highContrast ? t("a11y.highContrastOn") : t("a11y.highContrast")}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
