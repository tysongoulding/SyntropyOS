import React, { useState } from "react";
import { Clock, DollarSign, Star, TrendingUp, Sparkles, Check } from "lucide-react";
import { useFtaStore } from "@/stores/useFtaStore";

export const FtaCounter: React.FC = () => {
  const { hoursSaved, blendedHourlyRate, userRating, recordCalibration } = useFtaStore();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [calibrated, setCalibrated] = useState(false);

  const costSaved = Math.round(hoursSaved * blendedHourlyRate);

  const handleRate = (stars: number) => {
    recordCalibration("ws-active", stars, 1.5);
    setCalibrated(true);
    setTimeout(() => setCalibrated(false), 3000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">Full-Time Agent (FTA) Valuation</span>
            <p className="text-[10px] text-slate-400">Continuous Human-Calibrated ROI</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3 h-3" /> Real-time
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Labor Hours Saved</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {hoursSaved.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Blended ROI Value</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${costSaved.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-300 font-medium">Calibrate Agent Quality:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
              title={`Rate ${star} Star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  (hoverRating !== null ? star <= hoverRating : userRating && star <= userRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-600"
                }`}
              />
            </button>
          ))}
          {calibrated && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 ml-1.5 animate-in fade-in">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
