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
  CustomOptionPreset,
  DailyCustomItemValue,
  CoreItemsEnabledConfig,
  SupportPromptStatus,
  UserProfile,
  ReminderConfig,
} from '../types/canteen';
import { isTodayISO, getTodayISODate, getDatesBetween } from '../utils/nepaliDate';

export const CURRENT_SCHEMA_VERSION = 5;

export const INITIAL_PRICES: CanteenPrices = {
  morningFood: 72,
  dinner: 72,
  masu: 75,
  omelette: 30,
};

export const INITIAL_DEFAULTS: CanteenDefaults = {
  morningFoodEaten: true,
  dinnerEaten: true,
  breakfastEaten: false, // For now by default not eaten
};

export const INITIAL_CORE_ENABLED: CoreItemsEnabledConfig = {
  morningFood: true,
  breakfast: true,
  dinner: true,
  masu: true,
  omelette: true,
};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  roomNumber: '',
  hostelBlock: 'WRC Hostel',
  showBadgeOnHome: true,
};

export const INITIAL_REMINDER_CONFIG: ReminderConfig = {
  enabled: false,
  morningTime: '09:30',
  eveningTime: '21:30',
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
    coreItemsEnabled: CoreItemsEnabledConfig;
    autoSaveDailyDefaults: boolean;
    userProfile: UserProfile;
    showDailyNotes: boolean;
    showFoodAnalytics: boolean;
    reminderConfig: ReminderConfig;
  };
  breakfastPresets: BreakfastPreset[];
  customOptions: CustomFoodOption[];
  records: Record<string, DailyRecord>;
  monthSnapshots: Record<string, MonthSnapshot>;

  // Lifecycle, Guide & Support
  lastActiveDate: string;
  hasSeenGuide: boolean;
  firstInstalledAt: string;
  supportPromptStatus: SupportPromptStatus;
  remindSupportAfter?: string;

  // Factory to create a record structure
  createDefaultRecord: (date: string) => DailyRecord;

  // Record management
  getRecordForDate: (date: string) => DailyRecord | null;
  saveDayRecord: (record: DailyRecord) => void;
  unsaveDayRecord: (date: string) => void;
  updateRecord: (record: DailyRecord) => void;

  // Day Notes
  setDayNote: (date: string, note: string) => void;

  // Profile & Display Preferences
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setShowDailyNotes: (show: boolean) => void;
  setShowFoodAnalytics: (show: boolean) => void;
  updateReminderConfig: (config: Partial<ReminderConfig>) => void;

  // Core meal actions
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

  // Core Items Configuration (Removable Options)
  toggleCoreItem: (itemKey: keyof CoreItemsEnabledConfig) => void;
  resetToHostelDefaults: () => void;

  // Auto-Save Management
  setAutoSaveDailyDefaults: (enabled: boolean) => void;
  runAutoSaveCatchup: () => number;

  // Guide & Support Handlers
  setHasSeenGuide: (seen: boolean) => void;
  setSupportPromptStatus: (status: SupportPromptStatus, remindDays?: number) => void;

  // Custom Items Actions
  toggleCustomItem: (date: string, optionId: string) => void;
  incrementCustomItem: (date: string, optionId: string) => void;
  decrementCustomItem: (date: string, optionId: string) => void;
  setCustomItemQuantity: (date: string, optionId: string, quantity: number) => void;
  setCustomMultiChoice: (date: string, optionId: string, item: string, price: number) => void;

  // Custom Options Management (Settings)
  addCustomOption: (
    name: string,
    type: CustomOptionType,
    defaultPrice: number,
    defaultEaten: boolean,
    defaultQuantity: number,
    presets?: CustomOptionPreset[]
  ) => void;
  updateCustomOption: (id: string, updates: Partial<CustomFoodOption>) => void;
  deleteCustomOption: (id: string) => void;
  addPresetToCustomOption: (optionId: string, label: string, price: number) => void;
  deletePresetFromCustomOption: (optionId: string, presetId: string) => void;

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
        coreItemsEnabled: { ...INITIAL_CORE_ENABLED },
        autoSaveDailyDefaults: false, // Default off as requested
        userProfile: { ...INITIAL_USER_PROFILE },
        showDailyNotes: true,
        showFoodAnalytics: true,
        reminderConfig: { ...INITIAL_REMINDER_CONFIG },
      },
      breakfastPresets: [...INITIAL_BREAKFAST_PRESETS],
      customOptions: [],
      records: {},
      monthSnapshots: {},

      lastActiveDate: getTodayISODate(),
      hasSeenGuide: false,
      firstInstalledAt: new Date().toISOString(),
      supportPromptStatus: 'pending',

      createDefaultRecord: (date: string) => {
        const state = get();
        const now = new Date().toISOString();
        const isToday = isTodayISO(date);
        const { coreItemsEnabled } = state.settings;

        // Build default custom items values
        const customItems: Record<string, DailyCustomItemValue> = {};
        for (const opt of state.customOptions) {
          if (opt.type === 'multi_choice') {
            customItems[opt.id] = {
              id: opt.id,
              name: opt.name,
              type: 'multi_choice',
              price: 0,
              eaten: false,
              item: '',
              isIncomplete: false,
            };
          } else {
            customItems[opt.id] = {
              id: opt.id,
              name: opt.name,
              type: opt.type,
              price: opt.defaultPrice,
              eaten: opt.defaultEaten,
              quantity: opt.defaultQuantity,
            };
          }
        }

        const isMorningEnabled = coreItemsEnabled.morningFood !== false;
        const isBreakfastEnabled = coreItemsEnabled.breakfast !== false;
        const isDinnerEnabled = coreItemsEnabled.dinner !== false;
        const isMasuEnabled = coreItemsEnabled.masu !== false;
        const isOmeletteEnabled = coreItemsEnabled.omelette !== false;

        const isBreakfastEaten = isBreakfastEnabled && state.settings.defaults.breakfastEaten;

        return {
          date,
          morningFood: {
            eaten: isMorningEnabled ? state.settings.defaults.morningFoodEaten : false,
            price: state.settings.prices.morningFood,
          },
          dinner: {
            eaten: isDinnerEnabled ? state.settings.defaults.dinnerEaten : false,
            price: state.settings.prices.dinner,
          },
          breakfast: {
            eaten: isBreakfastEaten,
            item: '',
            price: 0,
            isIncomplete: isBreakfastEaten,
          },
          masu: {
            quantity: 0,
            unitPrice: isMasuEnabled ? state.settings.prices.masu : 0,
          },
          omelette: {
            quantity: 0,
            unitPrice: isOmeletteEnabled ? state.settings.prices.omelette : 0,
          },
          customItems,
          note: '',
          isSaved: isToday,
          createdAt: now,
          updatedAt: now,
        };
      },

      getRecordForDate: (date: string) => {
        const state = get();
        if (state.records[date]) {
          return state.records[date];
        }
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
        if (isTodayISO(date)) return;
        set((state) => {
          const nextRecords = { ...state.records };
          delete nextRecords[date];
          return { records: nextRecords };
        });
      },

      updateRecord: (record: DailyRecord) => {
        if (isTodayISO(record.date) || record.isSaved) {
          get().saveDayRecord(record);
        }
      },

      setDayNote: (date: string, note: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const updated: DailyRecord = {
          ...existing,
          note: note,
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
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

      // Core Items Configuration (Removable Options)
      toggleCoreItem: (itemKey) => {
        set((state) => ({
          settings: {
            ...state.settings,
            coreItemsEnabled: {
              ...state.settings.coreItemsEnabled,
              [itemKey]: !state.settings.coreItemsEnabled[itemKey],
            },
          },
        }));
      },

      resetToHostelDefaults: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            prices: { ...INITIAL_PRICES },
            defaults: { ...INITIAL_DEFAULTS },
            coreItemsEnabled: { ...INITIAL_CORE_ENABLED },
          },
          breakfastPresets: [...INITIAL_BREAKFAST_PRESETS],
        }));
      },

      updateUserProfile: (profile) => {
        set((state) => ({
          settings: {
            ...state.settings,
            userProfile: {
              ...state.settings.userProfile,
              ...profile,
            },
          },
        }));
      },

      setShowDailyNotes: (show) => {
        set((state) => ({
          settings: {
            ...state.settings,
            showDailyNotes: show,
          },
        }));
      },

      setShowFoodAnalytics: (show) => {
        set((state) => ({
          settings: {
            ...state.settings,
            showFoodAnalytics: show,
          },
        }));
      },

      updateReminderConfig: (config) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminderConfig: {
              ...state.settings.reminderConfig,
              ...config,
            },
          },
        }));
      },

      // Auto-Save Management
      setAutoSaveDailyDefaults: (enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            autoSaveDailyDefaults: enabled,
          },
        }));
        if (enabled) {
          get().runAutoSaveCatchup();
        }
      },

      runAutoSaveCatchup: () => {
        const state = get();
        const today = getTodayISODate();
        const { lastActiveDate, settings, records } = state;

        if (!settings.autoSaveDailyDefaults) {
          set({ lastActiveDate: today });
          return 0;
        }

        let savedCount = 0;
        const newRecords = { ...records };

        // Check if there are days to backfill between lastActiveDate and today
        const startDate = lastActiveDate || today;
        const datesToFill = getDatesBetween(startDate, today);

        for (const date of datesToFill) {
          if (!newRecords[date] || !newRecords[date].isSaved) {
            const fresh = state.createDefaultRecord(date);
            newRecords[date] = {
              ...fresh,
              isSaved: true,
              updatedAt: new Date().toISOString(),
            };
            savedCount++;
          }
        }

        set({
          records: newRecords,
          lastActiveDate: today,
        });

        return savedCount;
      },

      // Guide & Support Handlers
      setHasSeenGuide: (seen) => {
        set({ hasSeenGuide: seen });
      },

      setSupportPromptStatus: (status, remindDays = 7) => {
        const updates: Partial<CanteenState> = { supportPromptStatus: status };
        if (status === 'remind_later') {
          const remindDate = new Date();
          remindDate.setDate(remindDate.getDate() + remindDays);
          updates.remindSupportAfter = remindDate.toISOString();
        }
        set(updates);
      },

      // Custom Items Actions
      toggleCustomItem: (date: string, optionId: string) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const option = state.customOptions.find((o) => o.id === optionId);
        const currentVal = existing.customItems?.[optionId] || {
          id: optionId,
          name: option?.name || 'Custom Item',
          type: (option?.type || 'toggle') as CustomOptionType,
          price: option?.defaultPrice || 0,
          eaten: false,
        };

        const nextEaten = !currentVal.eaten;
        const isIncomplete = option?.type === 'multi_choice'
          ? (nextEaten ? (!currentVal.item || currentVal.price <= 0) : false)
          : false;

        const updated: DailyRecord = {
          ...existing,
          customItems: {
            ...(existing.customItems || {}),
            [optionId]: {
              ...currentVal,
              eaten: nextEaten,
              price: currentVal.price || (option?.type === 'multi_choice' ? 0 : option?.defaultPrice || 0),
              isIncomplete,
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

      setCustomMultiChoice: (date: string, optionId: string, item: string, price: number) => {
        const state = get();
        const existing = state.getRecordForDate(date) || state.createDefaultRecord(date);
        const option = state.customOptions.find((o) => o.id === optionId);
        const safePrice = Math.max(0, price);

        const updated: DailyRecord = {
          ...existing,
          customItems: {
            ...(existing.customItems || {}),
            [optionId]: {
              id: optionId,
              name: option?.name || 'Custom Option',
              type: 'multi_choice',
              eaten: true,
              item: item.trim(),
              price: safePrice,
              isIncomplete: !item.trim() || safePrice <= 0,
            },
          },
          updatedAt: new Date().toISOString(),
        };
        if (isTodayISO(date) || existing.isSaved) {
          state.saveDayRecord(updated);
        }
      },

      // Custom Options Management in Settings
      addCustomOption: (name, type, defaultPrice, defaultEaten, defaultQuantity, presets = []) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const newOption: CustomFoodOption = {
          id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed,
          type,
          defaultPrice: Math.max(0, defaultPrice),
          defaultEaten: Boolean(defaultEaten),
          defaultQuantity: Math.max(0, defaultQuantity),
          presets: [...presets],
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

      addPresetToCustomOption: (optionId, label, price) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const newPreset: CustomOptionPreset = {
          id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: trimmed,
          price: Math.max(0, price),
        };
        set((state) => ({
          customOptions: state.customOptions.map((opt) =>
            opt.id === optionId
              ? { ...opt, presets: [...(opt.presets || []), newPreset] }
              : opt
          ),
        }));
      },

      deletePresetFromCustomOption: (optionId, presetId) => {
        set((state) => ({
          customOptions: state.customOptions.map((opt) =>
            opt.id === optionId
              ? { ...opt, presets: (opt.presets || []).filter((p) => p.id !== presetId) }
              : opt
          ),
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
          settings: {
            prices: backup.settings.prices || { ...INITIAL_PRICES },
            defaults: backup.settings.defaults || { ...INITIAL_DEFAULTS },
            coreItemsEnabled: backup.settings.coreItemsEnabled || { ...INITIAL_CORE_ENABLED },
            autoSaveDailyDefaults: Boolean(backup.settings.autoSaveDailyDefaults),
            userProfile: backup.settings.userProfile || { ...INITIAL_USER_PROFILE },
            showDailyNotes: backup.settings.showDailyNotes !== false,
            showFoodAnalytics: backup.settings.showFoodAnalytics !== false,
            reminderConfig: backup.settings.reminderConfig || { ...INITIAL_REMINDER_CONFIG },
          },
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
          lastActiveDate: getTodayISODate(),
        });
      },
    }),
    {
      name: 'wrc_hostel_canteen_store_v5',
      version: CURRENT_SCHEMA_VERSION,
    }
  )
);

// Backward-compatible migration from earlier stores to v5
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const v5 = window.localStorage.getItem('wrc_hostel_canteen_store_v5');
    if (!v5) {
      const prev = window.localStorage.getItem('wrc_hostel_canteen_store_v4') ||
                   window.localStorage.getItem('wrc_hostel_canteen_store_v3');
      if (prev) {
        const parsed = JSON.parse(prev);
        if (parsed?.state) {
          parsed.state.settings = {
            ...parsed.state.settings,
            userProfile: { ...INITIAL_USER_PROFILE, ...parsed.state.settings?.userProfile },
            showDailyNotes: parsed.state.settings?.showDailyNotes !== false,
            showFoodAnalytics: parsed.state.settings?.showFoodAnalytics !== false,
            reminderConfig: { ...INITIAL_REMINDER_CONFIG, ...parsed.state.settings?.reminderConfig },
          };
          parsed.state.schemaVersion = CURRENT_SCHEMA_VERSION;
          parsed.version = CURRENT_SCHEMA_VERSION;
          window.localStorage.setItem('wrc_hostel_canteen_store_v5', JSON.stringify(parsed));
        }
      }
    }
  }
} catch {
  // Ignore in non-browser environments
}
