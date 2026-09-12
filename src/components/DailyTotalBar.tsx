import React from 'react';
import { AlertCircle, Wallet } from 'lucide-react';
import { DailyCostBreakdown } from '../utils/billing';

interface DailyTotalBarProps {
  breakdown: DailyCostBreakdown;
}

export const DailyTotalBar: React.FC<DailyTotalBarProps> = ({ breakdown }) => {
  const extrasCost = breakdown.masuCost + breakdown.omeletteCost;

  return (
    <div className="sticky bottom-16 sm:bottom-4 z-20 mx-auto max-w-md px-3 pt-2">
      <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-xl rounded-2xl p-3.5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Daily Total</div>
              <div className="text-xl font-bold tracking-tight text-white flex items-baseline space-x-1.5">
                <span>Rs. {breakdown.totalCost}</span>
                {breakdown.isIncomplete && (
                  <span className="text-[10px] text-amber-400 font-normal">
                    (+ unpriced breakfast)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Breakdown Badges */}
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
              <span>M: {breakdown.morningFoodCost}</span>
              <span>•</span>
              <span>B: {breakdown.breakfastCost}</span>
              <span>•</span>
              <span>D: {breakdown.dinnerCost}</span>
              {extrasCost > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-300">+{extrasCost}</span>
                </>
              )}
            </div>

            {breakdown.isIncomplete ? (
              <div className="flex items-center space-x-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Pending breakfast</span>
              </div>
            ) : (
              <div className="text-[10px] text-emerald-400 font-medium">
                ✓ Ready for monthly bill
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
