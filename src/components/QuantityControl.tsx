import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  quantity: number;
  unitPrice: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetQuantity: (val: number) => void;
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  label,
  sublabel,
  icon,
  quantity,
  unitPrice,
  onIncrement,
  onDecrement,
  onSetQuantity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(quantity));

  const totalCost = Math.max(0, quantity) * unitPrice;

  const handleFinishEditing = () => {
    setIsEditing(false);
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onSetQuantity(parsed);
    } else {
      setInputValue(String(quantity));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left item details */}
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {label}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rs. {unitPrice} / piece {sublabel && `• ${sublabel}`}
            </p>
          </div>
        </div>

        {/* Right subtotal */}
        <div className="text-right">
          <div
            className={`font-bold text-base ${
              quantity > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            Rs. {totalCost}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {quantity} × {unitPrice}
          </div>
        </div>
      </div>

      {/* Stepper buttons */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Quantity:
        </span>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onDecrement}
            disabled={quantity <= 0}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition"
            aria-label={`Decrease ${label} quantity`}
          >
            <Minus className="w-4 h-4" />
          </button>

          {isEditing ? (
            <input
              type="number"
              min="0"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFinishEditing();
                }
              }}
              className="w-16 h-10 text-center font-bold text-lg bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-100 border-2 border-amber-500 rounded-xl focus:outline-hidden"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setInputValue(String(quantity));
                setIsEditing(true);
              }}
              title="Click to type number"
              className="w-16 h-10 rounded-xl font-bold text-lg text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition"
              aria-label={`Current ${label} quantity is ${quantity}. Tap to edit.`}
            >
              {quantity}
            </button>
          )}

          <button
            type="button"
            onClick={onIncrement}
            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center shadow-xs transition"
            aria-label={`Increase ${label} quantity`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
