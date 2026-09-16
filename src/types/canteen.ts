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

export type CustomOptionType = 'toggle' | 'quantity' | 'multi_choice';

export interface CustomOptionPreset {
  id: string;
  label: string;
  price: number;
}

export interface CustomFoodOption {
  id: string;
  name: string;
  type: CustomOptionType;
  defaultPrice: number;
  defaultEaten: boolean; // by default false as requested
  defaultQuantity: number;
  presets?: CustomOptionPreset[]; // for multi_choice options like breakfast
}

export interface DailyCustomItemValue {
  id: string;
  name: string;
  type: CustomOptionType;
  eaten?: boolean;
  quantity?: number;
  item?: string; // for multi_choice
  price: number; // Frozen price at record time
  isIncomplete?: boolean; // for multi_choice when eaten is true but price/item missing
}

export interface CoreItemsEnabledConfig {
  morningFood: boolean;
  breakfast: boolean;
  dinner: boolean;
  masu: boolean;
  omelette: boolean;
}

export interface DailyRecord {
  date: string; // ISO format "YYYY-MM-DD"
  morningFood: MealRecord;
  dinner: MealRecord;
  breakfast: BreakfastRecord;
  masu: ExtraItemRecord;
  omelette: ExtraItemRecord;
  customItems?: Record<string, DailyCustomItemValue>;
  isSaved?: boolean; // explicitly saved for past/future days, or auto-saved for today
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
  breakfastEaten: boolean;   // default false (not eaten by default)
}

export type SupportPromptStatus = 'pending' | 'dismissed' | 'supported' | 'remind_later';

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
  customItemsTotals?: Record<string, { name: string; quantityOrDays: number; cost: number }>;
  closedAt: string; // ISO date-time
}

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  settings: {
    prices: CanteenPrices;
    defaults: CanteenDefaults;
    coreItemsEnabled?: CoreItemsEnabledConfig;
    autoSaveDailyDefaults?: boolean;
    customOptions?: CustomFoodOption[];
  };
  breakfastPresets: BreakfastPreset[];
  customOptions?: CustomFoodOption[];
  records: Record<string, DailyRecord>;
  monthSnapshots: Record<string, MonthSnapshot>;
}
