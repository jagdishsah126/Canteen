import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DailyRecord,
  CanteenPrices,
  CanteenDefaults,
  BreakfastPreset,
  MonthSnapshot,
  BackupPayload,
} from '../types/canteen';

export const CURRENT_SCHEMA_VERSION = 1;

export const INITIAL_PRICES: CanteenPrices = {
  morningFood: 72,
  dinner: 72,
  masu: 75,
  omelette: 30,
};

export const INITIAL_DEFAULTS: CanteenDefaults = {
  morningFoodEaten: true,
  dinnerEaten: true,
  breakfastEaten: true,
};

export const INITIAL_BREAKFAST_PRESETS: BreakfastPreset[] = [
  { id: 'chowmein', label: 'Chowmein', price: 50 },
  { id: 'momo', label: 'Momo', price: 100 },
  { id: 'tea', label: 'Tea', price: 20 },
];

export interface CanteenState {
  schemaVersion: number;
  settings: {
    prices: CanteenPrices;
    defaults: CanteenDefaults;
  };
  breakfastPresets: BreakfastPreset[];
  records: Record<string, DailyRecord>;
  monthSnapshots: Record<string, MonthSnapshot>;

  // Record Actions
  getOrCreateRecord: (date: string) => DailyRecord;
  toggleMorningFood: (date: string) => void;
  toggleDinner: (date: string) => void;
  toggleBreakfast: (date: string) => void;
  setBreakfast: (date: string, item: string, price: number) => void;
  incrementMasu: (date: string) => void;
  decrementMasu: (date: string) => void;
  setMasuQuantity: (date: string, quantity: number) => void;
  incrementOmelette: (date: string) => void;
  decrementOmelette: (date: string) => void;
  setOmeletteQuantity: (date: string, quantity: number) => void;

  // Settings & Presets Actions
  updateSettingsPrices: (prices: Partial<CanteenPrices>) => void;
  addBreakfastPreset: (label: string, price: number) => void;
  updateBreakfastPreset: (id: string, label: string, price: number) => void;
  deleteBreakfastPreset: (id: string) => void;

  // Snapshots & Backup
  saveMonthSnapshot: (snapshot: MonthSnapshot) => void;
  importBackup: (backup: BackupPayload) => { success: boolean; error?: string };
  clearAllData: () => void;
}

export const useCanteenStore = create<CanteenState>()(
  persist(
    (set, get) => ({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: {
        prices: { ...INITIAL_PRICES },
        defaults: { ...INITIAL_DEFAULTS },
      },
      breakfastPresets: [...INITIAL_BREAKFAST_PRESETS],
      records: {},
      monthSnapshots: {},

      getOrCreateRecord: (date: string) => {
        const state = get();
        if (state.records[date]) {
          return state.records[date];
        }

        const now = new Date().toISOString();
        const newRecord: DailyRecord = {
          date,
          morningFood: {
            eaten: state.settings.defaults.morningFoodEaten,
            price: state.settings.prices.morningFood,
          },
          dinner: {
            eaten: state.settings.defaults.dinnerEaten,
            price: state.settings.prices.dinner,
          },
          breakfast: {
            eaten: state.settings.defaults.breakfastEaten,
            item: '',
            price: 0,
            isIncomplete: state.settings.defaults.breakfastEaten, // Eaten by default, but item needs picking
          },
          masu: {
            quantity: 0,
            unitPrice: state.settings.prices.masu,
          },
          omelette: {
            quantity: 0,
            unitPrice: state.settings.prices.omelette,
          },
          createdAt: now,
          updatedAt: now,
        };

        set((prev) => ({
          records: {
            ...prev.records,
            [date]: newRecord,
          },
        }));

        return newRecord;
      },

      toggleMorningFood: (date: string) => {
        const record = get().getOrCreateRecord(date);
        const nextEaten = !record.morningFood.eaten;
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              morningFood: {
                ...record.morningFood,
                eaten: nextEaten,
                // Ensure price is assigned from settings if it was 0
                price: record.morningFood.price || state.settings.prices.morningFood,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      toggleDinner: (date: string) => {
        const record = get().getOrCreateRecord(date);
        const nextEaten = !record.dinner.eaten;
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              dinner: {
                ...record.dinner,
                eaten: nextEaten,
                price: record.dinner.price || state.settings.prices.dinner,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      toggleBreakfast: (date: string) => {
        const record = get().getOrCreateRecord(date);
        const nextEaten = !record.breakfast.eaten;
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              breakfast: {
                ...record.breakfast,
                eaten: nextEaten,
                // If not eaten, cost is 0 and not incomplete. If eaten, flag incomplete if no price/item
                isIncomplete: nextEaten ? (!record.breakfast.item || record.breakfast.price <= 0) : false,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      setBreakfast: (date: string, item: string, price: number) => {
        const record = get().getOrCreateRecord(date);
        const safePrice = Math.max(0, price);
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              breakfast: {
                eaten: true,
                item: item.trim(),
                price: safePrice,
                isIncomplete: !item.trim() || safePrice <= 0,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      incrementMasu: (date: string) => {
        const record = get().getOrCreateRecord(date);
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              masu: {
                ...record.masu,
                quantity: record.masu.quantity + 1,
                unitPrice: record.masu.unitPrice || state.settings.prices.masu,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      decrementMasu: (date: string) => {
        const record = get().getOrCreateRecord(date);
        if (record.masu.quantity <= 0) return;
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              masu: {
                ...record.masu,
                quantity: Math.max(0, record.masu.quantity - 1),
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      setMasuQuantity: (date: string, quantity: number) => {
        const record = get().getOrCreateRecord(date);
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              masu: {
                ...record.masu,
                quantity: Math.max(0, Math.floor(quantity)),
                unitPrice: record.masu.unitPrice || state.settings.prices.masu,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      incrementOmelette: (date: string) => {
        const record = get().getOrCreateRecord(date);
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              omelette: {
                ...record.omelette,
                quantity: record.omelette.quantity + 1,
                unitPrice: record.omelette.unitPrice || state.settings.prices.omelette,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      decrementOmelette: (date: string) => {
        const record = get().getOrCreateRecord(date);
        if (record.omelette.quantity <= 0) return;
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              omelette: {
                ...record.omelette,
                quantity: Math.max(0, record.omelette.quantity - 1),
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      setOmeletteQuantity: (date: string, quantity: number) => {
        const record = get().getOrCreateRecord(date);
        set((state) => ({
          records: {
            ...state.records,
            [date]: {
              ...record,
              omelette: {
                ...record.omelette,
                quantity: Math.max(0, Math.floor(quantity)),
                unitPrice: record.omelette.unitPrice || state.settings.prices.omelette,
              },
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateSettingsPrices: (newPrices: Partial<CanteenPrices>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            prices: {
              ...state.settings.prices,
              ...newPrices,
            },
          },
        }));
      },

      addBreakfastPreset: (label: string, price: number) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const newPreset: BreakfastPreset = {
          id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: trimmed,
          price: Math.max(0, price),
        };
        set((state) => ({
          breakfastPresets: [...state.breakfastPresets, newPreset],
        }));
      },

      updateBreakfastPreset: (id: string, label: string, price: number) => {
        set((state) => ({
          breakfastPresets: state.breakfastPresets.map((preset) =>
            preset.id === id
              ? { ...preset, label: label.trim(), price: Math.max(0, price) }
              : preset
          ),
        }));
      },

      deleteBreakfastPreset: (id: string) => {
        set((state) => ({
          breakfastPresets: state.breakfastPresets.filter((preset) => preset.id !== id),
        }));
      },

      saveMonthSnapshot: (snapshot: MonthSnapshot) => {
        const key = `${snapshot.bsYear}-${String(snapshot.bsMonth).padStart(2, '0')}`;
        set((state) => ({
          monthSnapshots: {
            ...state.monthSnapshots,
            [key]: snapshot,
          },
        }));
      },

      importBackup: (backup: BackupPayload) => {
        if (!backup || typeof backup !== 'object') {
          return { success: false, error: 'Invalid backup file format.' };
        }
        if (!backup.schemaVersion || !backup.settings || !backup.records) {
          return { success: false, error: 'Incomplete backup data structure.' };
        }
        set({
          schemaVersion: backup.schemaVersion,
          settings: backup.settings,
          breakfastPresets: backup.breakfastPresets || [...INITIAL_BREAKFAST_PRESETS],
          records: backup.records || {},
          monthSnapshots: backup.monthSnapshots || {},
        });
        return { success: true };
      },

      clearAllData: () => {
        set({
          records: {},
          monthSnapshots: {},
        });
      },
    }),
    {
      name: 'canteen_tracker_store_v1',
      version: CURRENT_SCHEMA_VERSION,
    }
  )
);
