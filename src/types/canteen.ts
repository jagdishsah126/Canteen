export interface BreakfastRecord {
  eaten: boolean;
  item: string;
  price: number;
  isIncomplete?: boolean; // True if eaten is true, but item or price hasn't been selected yet
}

export interface MealRecord {
  eaten: boolean;
  price: number;
}

export interface ExtraItemRecord {
  quantity: number;
  unitPrice: number;
}

export interface DailyRecord {
  date: string; // ISO format "YYYY-MM-DD"
  morningFood: MealRecord;
  dinner: MealRecord;
  breakfast: BreakfastRecord;
  masu: ExtraItemRecord;
  omelette: ExtraItemRecord;
  createdAt: string;
  updatedAt: string;
}

export interface BreakfastPreset {
  id: string;
  label: string;
  price: number;
}

export interface CanteenPrices {
  morningFood: number; // default 72
  dinner: number;      // default 72
  masu: number;        // default 75
  omelette: number;    // default 30
}

export interface CanteenDefaults {
  morningFoodEaten: boolean; // default true
  dinnerEaten: boolean;      // default true
  breakfastEaten: boolean;   // default true
}

export interface MonthSnapshot {
  bsYear: number;
  bsMonth: number; // 1 to 12
  bsMonthName: string;
  totalAmount: number;
  totalDays: number;
  morningDays: number;
  morningCost: number;
  breakfastDays: number;
  breakfastCost: number;
  dinnerDays: number;
  dinnerCost: number;
  masuQuantity: number;
  masuCost: number;
  omeletteQuantity: number;
  omeletteCost: number;
  closedAt: string; // ISO date-time
}

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  settings: {
    prices: CanteenPrices;
    defaults: CanteenDefaults;
  };
  breakfastPresets: BreakfastPreset[];
  records: Record<string, DailyRecord>;
  monthSnapshots: Record<string, MonthSnapshot>;
}
