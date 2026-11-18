import React, { useRef, useEffect, useState } from "react";
import { X, Download, Share2, Check } from "lucide-react";
import { AirNowResponse } from "shared";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  airData: AirNowResponse | null;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ isOpen, onClose, airData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !airData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render 600x400 WhatsApp card
    canvas.width = 600;
    canvas.height = 400;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Accent line
    ctx.fillStyle = "#10b981";
    ctx.fillRect(40, 40, 6, 40);

    // Header Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Saans — Air Quality Report", 56, 68);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Today in ${airData.location.name} • ${new Date().toLocaleDateString()}`, 40, 120);

    // AQI Big Box
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(40, 140, 220, 140, 16);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 64px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${airData.aqi}`, 64, 230);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${airData.category} NAQI`, 64, 260);

    // Details Column
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`PM2.5: ${airData.pollutants.pm25} µg/m³`, 290, 170);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`×${airData.whoMultiple} WHO Safe Air Guideline`, 290, 200);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Dominant: ${airData.dominantPollutant}`, 290, 230);
    ctx.fillText(`Primary Advice: Keep windows closed until 1 PM`, 290, 260);

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Saans Urban Air Assistant • General guidance only", 40, 360);

    // Generate data URL for download/share
    try {
      const url = canvas.toDataURL("image/png");
      setDownloadUrl(url);
    } catch (e) {
      console.error("Canvas export failed", e);
    }
  }, [isOpen, airData]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h2 id="share-card-title" className="text-base font-bold text-slate-900">
              Share Today's Air Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close share card dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Canvas Display */}
        <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={
              airData
                ? `Today's air in ${airData.location.name}: AQI ${airData.aqi}, ${airData.category} NAQI, PM2.5 ${airData.pollutants.pm25} µg/m³.`
                : "Air quality card preview"
            }
            className="w-full h-auto block"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Link Copied</span>
              </>
            ) : (
              <span>Copy Web Link</span>
            )}
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={`saans-air-${new Date().toISOString().split("T")[0]}.png`}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download PNG for WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
