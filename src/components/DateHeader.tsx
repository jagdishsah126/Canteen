import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { isoToBS, isTodayISO } from '../utils/nepaliDate';

interface DateHeaderProps {
  currentDate: string; // ISO format "YYYY-MM-DD"
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export const DateHeader: React.FC<DateHeaderProps> = ({
  currentDate,
  onPrevDay,
  onNextDay,
  onToday,
}) => {
  const bs = isoToBS(currentDate);
  const isCurrentDayToday = isTodayISO(currentDate);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Previous Day Button */}
        <button
          onClick={onPrevDay}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: BS Date Display */}
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center space-x-1.5">
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {bs.monthName} {bs.date}, {bs.year}
            </h1>
          </div>
          <div className="flex items-center space-x-2 mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{bs.dayName}</span>
            <span>•</span>
            <span className="font-mono text-[11px] opacity-75">{currentDate}</span>
          </div>
        </div>

        {/* Right: Next Day and Today Quick Action */}
        <div className="flex items-center space-x-1">
          {!isCurrentDayToday && (
            <button
              onClick={onToday}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 transition active:scale-95 flex items-center space-x-1"
              title="Jump to today"
              aria-label="Jump to today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          )}

          <button
            onClick={onNextDay}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
