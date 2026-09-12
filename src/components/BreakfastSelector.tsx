import React, { useState } from 'react';
import { Coffee, AlertCircle, Check, X, PlusCircle, Edit3 } from 'lucide-react';
import { BreakfastPreset, BreakfastRecord } from '../types/canteen';

interface BreakfastSelectorProps {
  breakfast: BreakfastRecord;
  presets: BreakfastPreset[];
  onToggleEaten: () => void;
  onSelectPreset: (preset: BreakfastPreset) => void;
  onSetCustom: (item: string, price: number) => void;
}

export const BreakfastSelector: React.FC<BreakfastSelectorProps> = ({
  breakfast,
  presets,
  onToggleEaten,
  onSelectPreset,
  onSetCustom,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customItem, setCustomItem] = useState(breakfast.item || '');
  const [customPrice, setCustomPrice] = useState(breakfast.price > 0 ? String(breakfast.price) : '');

  const isEaten = breakfast.eaten;
  const isIncomplete = isEaten && (!breakfast.item || breakfast.price <= 0);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customPrice);
    if (customItem.trim() && !isNaN(priceNum) && priceNum > 0) {
      onSetCustom(customItem.trim(), priceNum);
      setShowCustomInput(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 border ${
        isIncomplete
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600/50 shadow-xs'
          : isEaten
          ? 'bg-white dark:bg-slate-900 border-amber-500/40 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 opacity-75'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-2.5 rounded-xl transition-colors ${
              isEaten
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Coffee className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Breakfast
              </h3>
              <button
                type="button"
                onClick={onToggleEaten}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition ${
                  isEaten
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 hover:bg-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {isEaten ? 'Eaten' : 'Skipped'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEaten
                ? breakfast.item
                  ? `Selected: ${breakfast.item}`
                  : 'Needs item selection'
                : 'Not consumed today'}
            </p>
          </div>
        </div>

        {/* Cost & Checkbox */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div
              className={`font-bold text-base ${
                !isEaten
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : isIncomplete
                  ? 'text-amber-600 dark:text-amber-400 animate-pulse'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isEaten ? (isIncomplete ? 'Rs. ?' : `Rs. ${breakfast.price}`) : 'Rs. 0'}
            </div>
            {isEaten && !isIncomplete && (
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {breakfast.item}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleEaten}
            className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-colors ${
              isEaten
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}
            aria-label={isEaten ? 'Mark breakfast skipped' : 'Mark breakfast eaten'}
          >
            {isEaten ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* When Eaten: Presets & Incomplete Alert */}
      {isEaten && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Incomplete warning alert banner */}
          {isIncomplete && (
            <div className="flex items-center space-x-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-300/60 dark:border-amber-700/60">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Please choose what you had for breakfast to calculate the bill.</span>
            </div>
          )}

          {/* Quick Preset Pills */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Choose from presets:</span>
            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 font-medium"
            >
              {showCustomInput ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{showCustomInput ? 'Close' : 'Custom'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const isSelected =
                breakfast.item === preset.label && breakfast.price === preset.price;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all active:scale-95 flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-700'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span
                    className={`font-semibold ${
                      isSelected ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    Rs.{preset.price}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Breakfast Input Box */}
          {showCustomInput && (
            <form
              onSubmit={handleApplyCustom}
              className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 animate-fade-in"
            >
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Custom Breakfast Item
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="e.g. Samosa"
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Price (Rs.)"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-xs rounded-lg shadow-xs transition flex items-center justify-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save for Today</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
