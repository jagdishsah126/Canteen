import React from 'react';
import { Check, X } from 'lucide-react';

interface MealToggleProps {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  eaten: boolean;
  price: number;
  onToggle: () => void;
}

export const MealToggle: React.FC<MealToggleProps> = ({
  label,
  sublabel,
  icon,
  eaten,
  price,
  onToggle,
}) => {
  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={eaten}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`relative cursor-pointer select-none rounded-2xl p-4 transition-all duration-200 border flex items-center justify-between ${
        eaten
          ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-90'
      }`}
    >
      <div className="flex items-center space-x-3.5">
        <div
          className={`p-2.5 rounded-xl transition-colors ${
            eaten
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          {icon}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {label}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                eaten
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {eaten ? 'Eaten' : 'Skipped'}
            </span>
          </div>
          {sublabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div
            className={`font-bold text-base ${
              eaten
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-500 line-through'
            }`}
          >
            Rs. {eaten ? price : 0}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Rate: Rs. {price}
          </div>
        </div>

        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-colors ${
            eaten
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
          }`}
        >
          {eaten ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
};
