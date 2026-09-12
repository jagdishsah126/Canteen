import React, { useMemo } from 'react';
import { Sun, Moon, Drumstick, Egg } from 'lucide-react';
import { useCanteenStore } from '../store/canteenStore';
import { calculateDailyCost } from '../utils/billing';
import { offsetISODate, getTodayISODate } from '../utils/nepaliDate';
import { DateHeader } from '../components/DateHeader';
import { MealToggle } from '../components/MealToggle';
import { BreakfastSelector } from '../components/BreakfastSelector';
import { QuantityControl } from '../components/QuantityControl';
import { DailyTotalBar } from '../components/DailyTotalBar';

interface HomePageProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ currentDate, onDateChange }) => {
  const {
    getOrCreateRecord,
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
    breakfastPresets,
  } = useCanteenStore();

  // Ensure record is initialized for the current selected date
  const record = getOrCreateRecord(currentDate);

  // Calculate live breakdown
  const breakdown = useMemo(() => calculateDailyCost(record), [record]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    onDateChange(offsetISODate(currentDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(offsetISODate(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(getTodayISODate());
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Bikram Sambat Date Header */}
      <DateHeader
        currentDate={currentDate}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
      />

      {/* Main Content Feed */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-3.5">
        {/* Morning Food */}
        <MealToggle
          label="Morning Food"
          sublabel="Main meal (Lunch)"
          icon={<Sun className="w-5 h-5" />}
          eaten={record.morningFood.eaten}
          price={record.morningFood.price}
          onToggle={() => toggleMorningFood(currentDate)}
        />

        {/* Breakfast with Presets & Warning */}
        <BreakfastSelector
          breakfast={record.breakfast}
          presets={breakfastPresets}
          onToggleEaten={() => toggleBreakfast(currentDate)}
          onSelectPreset={(preset) => setBreakfast(currentDate, preset.label, preset.price)}
          onSetCustom={(item, price) => setBreakfast(currentDate, item, price)}
        />

        {/* Dinner */}
        <MealToggle
          label="Dinner"
          sublabel="Night meal"
          icon={<Moon className="w-5 h-5" />}
          eaten={record.dinner.eaten}
          price={record.dinner.price}
          onToggle={() => toggleDinner(currentDate)}
        />

        {/* Optional Extra 1: Masu */}
        <QuantityControl
          label="Masu"
          sublabel="Non-veg addon"
          icon={<Drumstick className="w-5 h-5" />}
          quantity={record.masu.quantity}
          unitPrice={record.masu.unitPrice}
          onIncrement={() => incrementMasu(currentDate)}
          onDecrement={() => decrementMasu(currentDate)}
          onSetQuantity={(qty) => setMasuQuantity(currentDate, qty)}
        />

        {/* Optional Extra 2: Omelette */}
        <QuantityControl
          label="Omelette"
          sublabel="Egg addon"
          icon={<Egg className="w-5 h-5" />}
          quantity={record.omelette.quantity}
          unitPrice={record.omelette.unitPrice}
          onIncrement={() => incrementOmelette(currentDate)}
          onDecrement={() => decrementOmelette(currentDate)}
          onSetQuantity={(qty) => setOmeletteQuantity(currentDate, qty)}
        />
      </main>

      {/* Sticky Daily Total */}
      <DailyTotalBar breakdown={breakdown} />
    </div>
  );
};
