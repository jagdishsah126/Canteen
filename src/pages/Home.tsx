import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Drumstick,
  Egg,
  Utensils,
  Layers,
  Check,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useCanteenStore } from '../store/canteenStore';
import { calculateDailyCost } from '../utils/billing';
import { offsetISODate, getTodayISODate, isTodayISO } from '../utils/nepaliDate';
import { DateHeader } from '../components/DateHeader';
import { MealToggle } from '../components/MealToggle';
import { BreakfastSelector } from '../components/BreakfastSelector';
import { MultiChoiceMealSelector } from '../components/MultiChoiceMealSelector';
import { QuantityControl } from '../components/QuantityControl';
import { DailyTotalBar } from '../components/DailyTotalBar';
import { DailyRecord } from '../types/canteen';

interface HomePageProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ currentDate, onDateChange }) => {
  const {
    records,
    settings,
    customOptions,
    breakfastPresets,
    createDefaultRecord,
    getRecordForDate,
    saveDayRecord,
    unsaveDayRecord,
    toggleMorningFood,
    toggleDinner,
    toggleBreakfast,
    setBreakfast,
    incrementMasu,
    decrementMasu,
    setMasuQuantity,
    incrementOmelette,
    decrementOmelette,
    setOmeletteQuantity,
    toggleCustomItem,
    incrementCustomItem,
    decrementCustomItem,
    setCustomItemQuantity,
    setCustomMultiChoice,
  } = useCanteenStore();

  const isCurrentDayToday = isTodayISO(currentDate);

  // Draft state for unsaved past/future days
  const [draftRecord, setDraftRecord] = useState<DailyRecord>(() => {
    return records[currentDate] || getRecordForDate(currentDate) || createDefaultRecord(currentDate);
  });

  // Whenever currentDate changes, synchronize draftRecord with store or fresh blank
  useEffect(() => {
    if (records[currentDate]) {
      setDraftRecord(records[currentDate]);
    } else if (isTodayISO(currentDate)) {
      const todayRecord = getRecordForDate(currentDate);
      if (todayRecord) setDraftRecord(todayRecord);
    } else {
      setDraftRecord(createDefaultRecord(currentDate));
    }
  }, [currentDate, records, isCurrentDayToday]);

  // Is this day saved in the store?
  const isSaved = isCurrentDayToday || Boolean(records[currentDate]?.isSaved);

  // Active record to display: if saved, prefer store's record, otherwise draft
  const activeRecord: DailyRecord = isSaved && records[currentDate] ? records[currentDate] : draftRecord;

  // Calculate live breakdown
  const breakdown = useMemo(() => calculateDailyCost(activeRecord), [activeRecord]);

  // Action to commit/save past or future day
  const handleSaveDay = () => {
    saveDayRecord(draftRecord);
  };

  const handleUnsaveDay = () => {
    unsaveDayRecord(currentDate);
    setDraftRecord(createDefaultRecord(currentDate));
  };

  // Helper wrappers that either update store directly (if saved or today) or update local draft
  const handleToggleMorning = () => {
    if (isSaved) {
      toggleMorningFood(currentDate);
    } else {
      const nextEaten = !draftRecord.morningFood.eaten;
      setDraftRecord((prev) => ({
        ...prev,
        morningFood: { ...prev.morningFood, eaten: nextEaten },
      }));
    }
  };

  const handleToggleDinner = () => {
    if (isSaved) {
      toggleDinner(currentDate);
    } else {
      const nextEaten = !draftRecord.dinner.eaten;
      setDraftRecord((prev) => ({
        ...prev,
        dinner: { ...prev.dinner, eaten: nextEaten },
      }));
    }
  };

  const handleToggleBreakfast = () => {
    if (isSaved) {
      toggleBreakfast(currentDate);
    } else {
      const nextEaten = !draftRecord.breakfast.eaten;
      setDraftRecord((prev) => ({
        ...prev,
        breakfast: {
          ...prev.breakfast,
          eaten: nextEaten,
          isIncomplete: nextEaten ? (!prev.breakfast.item || prev.breakfast.price <= 0) : false,
        },
      }));
    }
  };

  const handleSetBreakfast = (item: string, price: number) => {
    if (isSaved) {
      setBreakfast(currentDate, item, price);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        breakfast: {
          eaten: true,
          item,
          price,
          isIncomplete: !item || price <= 0,
        },
      }));
    }
  };

  const handleIncrementMasu = () => {
    if (isSaved) {
      incrementMasu(currentDate);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        masu: { ...prev.masu, quantity: prev.masu.quantity + 1 },
      }));
    }
  };

  const handleDecrementMasu = () => {
    if (isSaved) {
      decrementMasu(currentDate);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        masu: { ...prev.masu, quantity: Math.max(0, prev.masu.quantity - 1) },
      }));
    }
  };

  const handleSetMasuQuantity = (qty: number) => {
    if (isSaved) {
      setMasuQuantity(currentDate, qty);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        masu: { ...prev.masu, quantity: Math.max(0, qty) },
      }));
    }
  };

  const handleIncrementOmelette = () => {
    if (isSaved) {
      incrementOmelette(currentDate);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        omelette: { ...prev.omelette, quantity: prev.omelette.quantity + 1 },
      }));
    }
  };

  const handleDecrementOmelette = () => {
    if (isSaved) {
      decrementOmelette(currentDate);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        omelette: { ...prev.omelette, quantity: Math.max(0, prev.omelette.quantity - 1) },
      }));
    }
  };

  const handleSetOmeletteQuantity = (qty: number) => {
    if (isSaved) {
      setOmeletteQuantity(currentDate, qty);
    } else {
      setDraftRecord((prev) => ({
        ...prev,
        omelette: { ...prev.omelette, quantity: Math.max(0, qty) },
      }));
    }
  };

  // Custom Items Handlers
  const handleToggleCustom = (optId: string) => {
    if (isSaved) {
      toggleCustomItem(currentDate, optId);
    } else {
      const opt = customOptions.find((o) => o.id === optId);
      const currentVal = draftRecord.customItems?.[optId] || {
        id: optId,
        name: opt?.name || 'Custom Item',
        type: opt?.type || 'toggle',
        price: opt?.defaultPrice || 0,
        eaten: false,
      };
      const nextEaten = !currentVal.eaten;
      const isIncomplete = opt?.type === 'multi_choice'
        ? (nextEaten ? (!currentVal.item || currentVal.price <= 0) : false)
        : false;

      setDraftRecord((prev) => ({
        ...prev,
        customItems: {
          ...(prev.customItems || {}),
          [optId]: {
            ...currentVal,
            eaten: nextEaten,
            price: currentVal.price || (opt?.type === 'multi_choice' ? 0 : opt?.defaultPrice || 0),
            isIncomplete,
          },
        },
      }));
    }
  };

  const handleIncrementCustom = (optId: string) => {
    if (isSaved) {
      incrementCustomItem(currentDate, optId);
    } else {
      const opt = customOptions.find((o) => o.id === optId);
      const currentVal = draftRecord.customItems?.[optId] || {
        id: optId,
        name: opt?.name || 'Custom Item',
        type: 'quantity' as const,
        price: opt?.defaultPrice || 0,
        quantity: 0,
      };
      setDraftRecord((prev) => ({
        ...prev,
        customItems: {
          ...(prev.customItems || {}),
          [optId]: {
            ...currentVal,
            quantity: (currentVal.quantity || 0) + 1,
            price: currentVal.price || opt?.defaultPrice || 0,
          },
        },
      }));
    }
  };

  const handleDecrementCustom = (optId: string) => {
    if (isSaved) {
      decrementCustomItem(currentDate, optId);
    } else {
      const currentVal = draftRecord.customItems?.[optId];
      if (!currentVal || (currentVal.quantity || 0) <= 0) return;
      setDraftRecord((prev) => ({
        ...prev,
        customItems: {
          ...(prev.customItems || {}),
          [optId]: {
            ...currentVal,
            quantity: Math.max(0, (currentVal.quantity || 0) - 1),
          },
        },
      }));
    }
  };

  const handleSetCustomQuantity = (optId: string, qty: number) => {
    if (isSaved) {
      setCustomItemQuantity(currentDate, optId, qty);
    } else {
      const opt = customOptions.find((o) => o.id === optId);
      const currentVal = draftRecord.customItems?.[optId] || {
        id: optId,
        name: opt?.name || 'Custom Item',
        type: 'quantity' as const,
        price: opt?.defaultPrice || 0,
        quantity: 0,
      };
      setDraftRecord((prev) => ({
        ...prev,
        customItems: {
          ...(prev.customItems || {}),
          [optId]: {
            ...currentVal,
            quantity: Math.max(0, Math.floor(qty)),
            price: currentVal.price || opt?.defaultPrice || 0,
          },
        },
      }));
    }
  };

  const handleSetCustomMultiChoice = (optId: string, item: string, price: number) => {
    if (isSaved) {
      setCustomMultiChoice(currentDate, optId, item, price);
    } else {
      const opt = customOptions.find((o) => o.id === optId);
      const currentVal = draftRecord.customItems?.[optId] || {
        id: optId,
        name: opt?.name || 'Custom Option',
        type: 'multi_choice' as const,
        eaten: true,
        item: '',
        price: 0,
      };
      setDraftRecord((prev) => ({
        ...prev,
        customItems: {
          ...(prev.customItems || {}),
          [optId]: {
            ...currentVal,
            eaten: true,
            item,
            price,
            isIncomplete: !item || price <= 0,
          },
        },
      }));
    }
  };

  return (
    <div className="min-h-screen pb-36">
      {/* Date Header with Save / Tick status */}
      <DateHeader
        currentDate={currentDate}
        isSaved={isSaved}
        onPrevDay={() => onDateChange(offsetISODate(currentDate, -1))}
        onNextDay={() => onDateChange(offsetISODate(currentDate, 1))}
        onToday={() => onDateChange(getTodayISODate())}
        onSaveDay={handleSaveDay}
      />

      {/* Draft Unsaved Notice for Past/Future Dates */}
      {!isSaved && (
        <div className="max-w-md mx-auto px-4 pt-3">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Unsaved day:</strong> Viewing or editing does not save until you click the tick button.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveDay}
              className="ml-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1 shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save (Tick)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Feed */}
      <main className="max-w-md mx-auto px-4 py-3.5 space-y-3.5">
        {/* Core Option 1: Morning Food */}
        {settings.coreItemsEnabled?.morningFood !== false && (
          <MealToggle
            label="Morning Food"
            sublabel="Main meal (Lunch)"
            icon={<Sun className="w-5 h-5" />}
            eaten={activeRecord.morningFood.eaten}
            price={activeRecord.morningFood.price}
            onToggle={handleToggleMorning}
          />
        )}

        {/* Core Option 2: Breakfast (By Default Skipped / Not Eaten) */}
        {settings.coreItemsEnabled?.breakfast !== false && (
          <BreakfastSelector
            breakfast={activeRecord.breakfast}
            presets={breakfastPresets}
            onToggleEaten={handleToggleBreakfast}
            onSelectPreset={(preset) => handleSetBreakfast(preset.label, preset.price)}
            onSetCustom={(item, price) => handleSetBreakfast(item, price)}
          />
        )}

        {/* Core Option 3: Dinner */}
        {settings.coreItemsEnabled?.dinner !== false && (
          <MealToggle
            label="Dinner"
            sublabel="Night meal"
            icon={<Moon className="w-5 h-5" />}
            eaten={activeRecord.dinner.eaten}
            price={activeRecord.dinner.price}
            onToggle={handleToggleDinner}
          />
        )}

        {/* Core Option 4 & 5: Masu & Omelette */}
        {settings.coreItemsEnabled?.masu !== false && (
          <QuantityControl
            label="Masu"
            sublabel="Non-veg addon"
            icon={<Drumstick className="w-5 h-5" />}
            quantity={activeRecord.masu.quantity}
            unitPrice={activeRecord.masu.unitPrice}
            onIncrement={handleIncrementMasu}
            onDecrement={handleDecrementMasu}
            onSetQuantity={handleSetMasuQuantity}
          />
        )}

        {settings.coreItemsEnabled?.omelette !== false && (
          <QuantityControl
            label="Omelette"
            sublabel="Egg addon"
            icon={<Egg className="w-5 h-5" />}
            quantity={activeRecord.omelette.quantity}
            unitPrice={activeRecord.omelette.unitPrice}
            onIncrement={handleIncrementOmelette}
            onDecrement={handleDecrementOmelette}
            onSetQuantity={handleSetOmeletteQuantity}
          />
        )}

        {/* Empty state when all core items and custom options are disabled */}
        {settings.coreItemsEnabled?.morningFood === false &&
          settings.coreItemsEnabled?.breakfast === false &&
          settings.coreItemsEnabled?.dinner === false &&
          settings.coreItemsEnabled?.masu === false &&
          settings.coreItemsEnabled?.omelette === false &&
          customOptions.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-200">No Meals Configured</p>
              <p>All core options are currently disabled. You can re-enable them or reset to defaults in Settings.</p>
            </div>
          )}

        {/* Dynamic Custom Options (Created by User in Settings) */}
        {customOptions.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Custom Hostel Options</span>
            </div>

            {customOptions.map((opt) => {
              const currentVal = activeRecord.customItems?.[opt.id];

              if (opt.type === 'toggle') {
                const isEaten = currentVal ? Boolean(currentVal.eaten) : Boolean(opt.defaultEaten);
                const price = currentVal?.price || opt.defaultPrice;
                return (
                  <MealToggle
                    key={opt.id}
                    label={opt.name}
                    sublabel="Custom food option"
                    icon={<Utensils className="w-5 h-5" />}
                    eaten={isEaten}
                    price={price}
                    onToggle={() => handleToggleCustom(opt.id)}
                  />
                );
              }

              if (opt.type === 'multi_choice') {
                const isEaten = currentVal ? Boolean(currentVal.eaten) : Boolean(opt.defaultEaten);
                const price = currentVal?.price || 0;
                return (
                  <MultiChoiceMealSelector
                    key={opt.id}
                    label={opt.name}
                    icon={<Utensils className="w-5 h-5" />}
                    eaten={isEaten}
                    selectedItem={currentVal?.item || ''}
                    price={price}
                    presets={opt.presets || []}
                    onToggleEaten={() => handleToggleCustom(opt.id)}
                    onSelectPreset={(preset) => handleSetCustomMultiChoice(opt.id, preset.label, preset.price)}
                    onSetCustom={(item, p) => handleSetCustomMultiChoice(opt.id, item, p)}
                  />
                );
              }

              const price = currentVal?.price || opt.defaultPrice;
              const qty = currentVal ? (currentVal.quantity || 0) : opt.defaultQuantity;
              return (
                <QuantityControl
                  key={opt.id}
                  label={opt.name}
                  sublabel="Custom extra"
                  icon={<Utensils className="w-5 h-5" />}
                  quantity={qty}
                  unitPrice={price}
                  onIncrement={() => handleIncrementCustom(opt.id)}
                  onDecrement={() => handleDecrementCustom(opt.id)}
                  onSetQuantity={(val) => handleSetCustomQuantity(opt.id, val)}
                />
              );
            })}
          </div>
        )}

        {/* Saved Day Management Options (for non-today saved records) */}
        {!isCurrentDayToday && isSaved && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleUnsaveDay}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove this day from bill</span>
            </button>
          </div>
        )}
      </main>

      {/* Sticky Daily Total Bar */}
      <DailyTotalBar breakdown={breakdown} />
    </div>
  );
};
