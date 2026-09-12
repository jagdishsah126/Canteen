import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DailyRecord,
  CanteenPrices,
  CanteenDefaults,
  BreakfastPreset,
  MonthSnapshot,
  BackupPayload,
  CustomFoodOption,
  CustomOptionType,
} from '../types/canteen';
import { isTodayISO } from '../utils/nepaliDate';

export const CURRENT_SCHEMA_VERSION = 2;

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
  customOptions: CustomFoodOption[];
  records: Record<string, DailyRecord>;
  monthSnapshots: Record<string, MonthSnapshot>;

  // Factory to create a record structure
  createDefaultRecord: (date: string) => DailyRecord;

  // Record management
  getRecordForDate: (date: string) => DailyRecord | null;
  saveDayRecord: (record: DailyRecord) => void;
  unsaveDayRecord: (date: string) => void;
  updateRecord: (record: DailyRecord) => void;

  // Direct actions
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

  // Custom Items Actions
  toggleCustomItem: (date: string, optionId: string) => void;
  incrementCustomItem: (date: string, optionId: string) => void;
  decrementCustomItem: (date: string, optionId: string) => void;
  setCustomItemQuantity: (date: string, optionId: string, quantity: number) => void;

  // Custom Options Management (Settings)
  addCustomOption: (
    name: string,
    type: CustomOptionType,
    defaultPrice: number,
    defaultEaten: boolean,
    defaultQuantity: number
  ) => void;
  updateCustomOption: (id: string, updates: Partial<CustomFoodOption>) => void;
  deleteCustomOption: (id: string) => void;

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
      customOptions: [],
      records: {},
      monthSnapshots: {},

      createDefaultRecord: (date: string) => {
        const state = get();
        const now = new Date().toISOString();
        const isToday = isTodayISO(date);

        // Build default custom items values
        const customItems: Record<string, any> = {};
        for (const opt of state.customOptions) {
          customItems[opt.id] = {
            id: opt.id,
            name: opt.name,
            type: opt.type,
            price: opt.defaultPrice,
            eaten: opt.defaultEaten,
            quantity: opt.defaultQuantity,
          };
        }

        return {
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
            isIncomplete: state.settings.defaults.breakfastEaten,
          },
          masu: {
            quantity: 0,
            unitPrice: state.settings.prices.masu,
          },
          omelette: {
            quantity: 0,
            unitPrice: state.settings.prices.omelette,
          },
          customItems,
          isSaved: isToday, // Today is always saved by default; past/future require user tick
          createdAt: now,
          updatedAt: now,
        };
      },

      getRecordForDate: (date: string) => {
        const state = get();
        if (state.records[date]) {
          return state.records[date];
        }
        // If it is today, auto-create and persist it
        if (isTodayISO(date)) {
          const newTodayRecord = state.createDefaultRecord(date);
          set((prev) => ({
            records: {
              ...prev.records,
              [date]: newTodayRecord,
            },
          }));
          return newTodayRecord;
        }
        return null;
      },

      saveDayRecord: (record: DailyRecord) => {
        const now = new Date().toISOString();
        set((state) => ({
          records: {
            ...state.records,
            [record.date]: {
              ...record,
              isSaved: true,
              updatedAt: now,
            },
          },
        }));
      },

      unsaveDayRecord: (date: string) => {
        // Today's date cannot be permanently unsaved, but non-today dates can be removed
        if (isTodayISO(date)) return;
        set((state) => {
          const nextRecords = { ...state.records };
          delete nextRecords[date];
          return { records: nextRecords };
        });
      },

      updateRecord: (record: DailyRecord) => {
        // If today or already saved, persist directly
        if (isTodayISO(record.date) || record.isSaved) {
          get().saveDayRecord(record);
        }
      },

      toggleMorningFood: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const nextEaten = !existing.morningFood.eaten;
        const updated: DailyRecord = {
          ...existing,
          morningFood: {
            ...existing.morningFood,
            eaten: nextEaten,
            price: existing.morningFood.price || state.settings.prices.morningFood,
          },
          updatedAt: new Date().toISOString(),
        };
        // Auto-save if today or already saved
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      toggleDinner: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const nextEaten = !existing.dinner.eaten;
        const updated: DailyRecord = {
          ...existing,
          dinner: {
            ...existing.dinner,
            eaten: nextEaten,
            price: existing.dinner.price || state.settings.prices.dinner,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      toggleBreakfast: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const nextEaten = !existing.breakfast.eaten;
        const updated: DailyRecord = {
          ...existing,
          breakfast: {
            ...existing.breakfast,
            eaten: nextEaten,
            isIncomplete: nextEaten ? (!existing.breakfast.item || existing.breakfast.price <= 0) : false,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      setBreakfast: (date: string, item: string, price: number) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const safePrice = Math.max(0, price);
        const updated: DailyRecord = {
          ...existing,
          breakfast: {
            eaten: true,
            item: item.trim(),
            price: safePrice,
            isIncomplete: !item.trim() || safePrice <= 0,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      incrementMasu: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const updated: DailyRecord = {
          ...existing,
          masu: {
            ...existing.masu,
            quantity: existing.masu.quantity + 1,
            unitPrice: existing.masu.unitPrice || state.settings.prices.masu,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      decrementMasu: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        if (existing.masu.quantity <= 0) return;
        const updated: DailyRecord = {
          ...existing,
          masu: {
            ...existing.masu,
            quantity: Math.max(0, existing.masu.quantity - 1),
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      setMasuQuantity: (date: string, quantity: number) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const updated: DailyRecord = {
          ...existing,
          masu: {
            ...existing.masu,
            quantity: Math.max(0, Math.floor(quantity)),
            unitPrice: existing.masu.unitPrice || state.settings.prices.masu,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      incrementOmelette: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const updated: DailyRecord = {
          ...existing,
          omelette: {
            ...existing.omelette,
            quantity: existing.omelette.quantity + 1,
            unitPrice: existing.omelette.unitPrice || state.settings.prices.omelette,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      decrementOmelette: (date: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        if (existing.omelette.quantity <= 0) return;
        const updated: DailyRecord = {
          ...existing,
          omelette: {
            ...existing.omelette,
            quantity: Math.max(0, existing.omelette.quantity - 1),
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      setOmeletteQuantity: (date: string, quantity: number) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const updated: DailyRecord = {
          ...existing,
          omelette: {
            ...existing.omelette,
            quantity: Math.max(0, Math.floor(quantity)),
            unitPrice: existing.omelette.unitPrice || state.settings.prices.omelette,
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      // Custom Items Actions
      toggleCustomItem: (date: string, optionId: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const option = state.customOptions.find((o) => o.id === optionId);
        const currentVal = existing.customItems?.[optionId] || {
          id: optionId,
          name: option?.name || 'Custom Item',
          type: 'toggle' as CustomOptionType,
          price: option?.defaultPrice || 0,
          eaten: false,
        };

        const updated: DailyRecord = {
          ...existing,
          customItems: {
            ...(existing.customItems || {}),
            [optionId]: {
              ...currentVal,
              eaten: !currentVal.eaten,
              price: currentVal.price || option?.defaultPrice || 0,
            },
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      incrementCustomItem: (date: string, optionId: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const option = state.customOptions.find((o) => o.id === optionId);
        const currentVal = existing.customItems?.[optionId] || {
          id: optionId,
          name: option?.name || 'Custom Item',
          type: 'quantity' as CustomOptionType,
          price: option?.defaultPrice || 0,
          quantity: 0,
        };

        const updated: DailyRecord = {
          ...existing,
          customItems: {
            ...(existing.customItems || {}),
            [optionId]: {
              ...currentVal,
              quantity: (currentVal.quantity || 0) + 1,
              price: currentVal.price || option?.defaultPrice || 0,
            },
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      decrementCustomItem: (date: string, optionId: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const currentVal = existing.customItems?.[optionId];
        if (!currentVal || (currentVal.quantity || 0) <= 0) return;

        const updated: DailyRecord = {
          ...existing,
          customItems: {
            ...(existing.customItems || {}),
            [optionId]: {
              ...currentVal,
              quantity: Math.max(0, (currentVal.quantity || 0) - 1),
            },
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      setCustomItemQuantity: (date: string, optionId: string, quantity: number) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const option = state.customOptions.find((o) => o.id === optionId);
        const currentVal = existing.customItems?.[optionId] || {
          id: optionId,
          name: option?.name || 'Custom Item',
          type: 'quantity' as CustomOptionType,
          price: option?.defaultPrice || 0,
          quantity: 0,
        };

        const updated: DailyRecord = {
          ...existing,
          customItems: {
            ...(existing.customItems || {}),
            [optionId]: {
              ...currentVal,
              quantity: Math.max(0, Math.floor(quantity)),
              price: currentVal.price || option?.defaultPrice || 0,
            },
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      // Custom Options Management in Settings
      addCustomOption: (name, type, defaultPrice, defaultEaten, defaultQuantity) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newOption: CustomFoodOption = {
          id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed,
          type,
          defaultPrice: Math.max(0, defaultPrice),
          defaultEaten: Boolean(defaultEaten),
          defaultQuantity: Math.max(0, defaultQuantity),
        };
        set((state) => ({
          customOptions: [...state.customOptions, newOption],
        }));
      },

      updateCustomOption: (id, updates) => {
        set((state) => ({
          customOptions: state.customOptions.map((opt) =>
            opt.id === id ? { ...opt, ...updates } : opt
          ),
        }));
      },

      deleteCustomOption: (id) => {
        set((state) => ({
          customOptions: state.customOptions.filter((opt) => opt.id !== id),
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
          customOptions: backup.customOptions || backup.settings.customOptions || [],
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
      name: 'wrc_hostel_canteen_store_v2',
      version: CURRENT_SCHEMA_VERSION,
    }
  )
);
