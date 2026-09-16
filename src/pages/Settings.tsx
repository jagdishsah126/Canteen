import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Download,
  Upload,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Edit2,
  X,
  Moon,
  Sun,
  Layers,
  Tag,
  RotateCcw,
  BookOpen,
  Heart,
  ExternalLink,
  User,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { useCanteenStore } from '../store/canteenStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { BackupPayload, BreakfastPreset, CustomOptionType } from '../types/canteen';
import { getTodayISODate } from '../utils/nepaliDate';
import { requestNotificationPermission, testMealNotification } from '../utils/notifications';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenGuide?: () => void;
  onOpenSupport?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onOpenGuide,
  onOpenSupport,
}) => {
  const {
    settings,
    breakfastPresets,
    customOptions,
    records,
    monthSnapshots,
    schemaVersion,
    updateSettingsPrices,
    toggleCoreItem,
    resetToHostelDefaults,
    setAutoSaveDailyDefaults,
    updateUserProfile,
    setShowDailyNotes,
    setShowFoodAnalytics,
    updateReminderConfig,
    addBreakfastPreset,
    updateBreakfastPreset,
    deleteBreakfastPreset,
    addCustomOption,
    deleteCustomOption,
    addPresetToCustomOption,
    deletePresetFromCustomOption,
    importBackup,
    clearAllData,
  } = useCanteenStore();

  // Student Profile state
  const [profileName, setProfileName] = useState(settings.userProfile?.name || '');
  const [profileRoom, setProfileRoom] = useState(settings.userProfile?.roomNumber || '');
  const [profileBlock, setProfileBlock] = useState(settings.userProfile?.hostelBlock || 'WRC Hostel');
  const [profileBadgeOnHome, setProfileBadgeOnHome] = useState(settings.userProfile?.showBadgeOnHome !== false);
  const [profileSaveMessage, setProfileSaveMessage] = useState(false);

  // Reminders state
  const [morningReminderTime, setMorningReminderTime] = useState(settings.reminderConfig?.morningTime || '09:30');
  const [eveningReminderTime, setEveningReminderTime] = useState(settings.reminderConfig?.eveningTime || '21:30');
  const [reminderTestStatus, setReminderTestStatus] = useState<string | null>(null);

  // Local state for default prices form
  const [morningPrice, setMorningPrice] = useState(String(settings.prices.morningFood));
  const [dinnerPrice, setDinnerPrice] = useState(String(settings.prices.dinner));
  const [masuPrice, setMasuPrice] = useState(String(settings.prices.masu));
  const [omelettePrice, setOmelettePrice] = useState(String(settings.prices.omelette));
  const [priceSaveMessage, setPriceSaveMessage] = useState(false);

  // Preset addition / editing state
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const [editPresetPrice, setEditPresetPrice] = useState('');

  // Custom Options addition state
  const [newOptName, setNewOptName] = useState('');
  const [newOptType, setNewOptType] = useState<CustomOptionType>('multi_choice');
  const [newOptPrice, setNewOptPrice] = useState('0');
  const [newOptDefaultEaten, setNewOptDefaultEaten] = useState(false);
  const [newOptDefaultQty, setNewOptDefaultQty] = useState('0');

  // Sub-preset state for multi_choice options
  const [activePresetOptId, setActivePresetOptId] = useState<string | null>(null);
  const [subPresetName, setSubPresetName] = useState('');
  const [subPresetPrice, setSubPresetPrice] = useState('');

  // Modals state
  const [showClearModal, setShowClearModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BackupPayload | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profileName.trim(),
      roomNumber: profileRoom.trim(),
      hostelBlock: profileBlock.trim(),
      showBadgeOnHome: profileBadgeOnHome,
    });
    setProfileSaveMessage(true);
    setTimeout(() => setProfileSaveMessage(false), 3000);
  };

  const handleToggleReminders = async () => {
    const nextEnabled = !settings.reminderConfig?.enabled;
    if (nextEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setReminderTestStatus('Permission denied in browser. Enable notifications in browser settings.');
        setTimeout(() => setReminderTestStatus(null), 4000);
        return;
      }
    }
    updateReminderConfig({
      enabled: nextEnabled,
      morningTime: morningReminderTime,
      eveningTime: eveningReminderTime,
    });
  };

  const handleSaveReminderTimes = (morning: string, evening: string) => {
    setMorningReminderTime(morning);
    setEveningReminderTime(evening);
    updateReminderConfig({
      morningTime: morning,
      eveningTime: evening,
    });
  };

  const handleTestNotification = () => {
    const sent = testMealNotification();
    if (sent) {
      setReminderTestStatus('✓ Test notification sent! Check your notification tray.');
    } else {
      setReminderTestStatus('Notification failed. Check browser permissions.');
    }
    setTimeout(() => setReminderTestStatus(null), 4000);
  };

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsPrices({
      morningFood: Math.max(0, parseFloat(morningPrice) || 0),
      dinner: Math.max(0, parseFloat(dinnerPrice) || 0),
      masu: Math.max(0, parseFloat(masuPrice) || 0),
      omelette: Math.max(0, parseFloat(omelettePrice) || 0),
    });
    setPriceSaveMessage(true);
    setTimeout(() => setPriceSaveMessage(false), 3000);
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPresetName.trim() && parseFloat(newPresetPrice) > 0) {
      addBreakfastPreset(newPresetName.trim(), parseFloat(newPresetPrice));
      setNewPresetName('');
      setNewPresetPrice('');
    }
  };

  const startEditPreset = (preset: BreakfastPreset) => {
    setEditingPresetId(preset.id);
    setEditPresetName(preset.label);
    setEditPresetPrice(String(preset.price));
  };

  const saveEditedPreset = (id: string) => {
    if (editPresetName.trim() && parseFloat(editPresetPrice) > 0) {
      updateBreakfastPreset(id, editPresetName.trim(), parseFloat(editPresetPrice));
      setEditingPresetId(null);
    }
  };

  const handleAddCustomOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptName.trim()) return;
    const priceNum = Math.max(0, parseFloat(newOptPrice) || 0);
    const qtyNum = Math.max(0, parseInt(newOptDefaultQty, 10) || 0);

    addCustomOption(
      newOptName.trim(),
      newOptType,
      priceNum,
      newOptType === 'multi_choice' ? false : newOptDefaultEaten,
      qtyNum,
      []
    );

    setNewOptName('');
    setNewOptPrice('0');
    setNewOptDefaultEaten(false);
    setNewOptDefaultQty('0');
  };

  const handleAddSubPreset = (optId: string) => {
    if (subPresetName.trim() && parseFloat(subPresetPrice) > 0) {
      addPresetToCustomOption(optId, subPresetName.trim(), parseFloat(subPresetPrice));
      setSubPresetName('');
      setSubPresetPrice('');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData: BackupPayload = {
      schemaVersion,
      exportedAt: new Date().toISOString(),
      settings,
      breakfastPresets,
      customOptions,
      records,
      monthSnapshots,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wrc-hostel-canteen-backup-${getTodayISODate()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackupSuccessMessage('Backup file downloaded successfully!');
    setTimeout(() => setBackupSuccessMessage(null), 3500);
  };

  // Import JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object' || !parsed.records) {
          setImportErrorMessage('Invalid backup format: missing records.');
          return;
        }
        setPendingImportData(parsed as BackupPayload);
      } catch {
        setImportErrorMessage('Failed to read file. Please ensure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    const result = importBackup(pendingImportData);
    if (result.success) {
      setBackupSuccessMessage('Data successfully restored from backup!');
      setPendingImportData(null);
      setTimeout(() => setBackupSuccessMessage(null), 3500);
    } else {
      setImportErrorMessage(result.error || 'Failed to restore backup.');
      setPendingImportData(null);
    }
  };

  const handleConfirmClearAll = () => {
    clearAllData();
    setShowClearModal(false);
    setBackupSuccessMessage('All records cleared successfully.');
    setTimeout(() => setBackupSuccessMessage(null), 3500);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Settings Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              🍱 WRC Hostel
            </div>
            <div className="flex items-center space-x-1.5">
              <SettingsIcon className="w-4 h-4 text-amber-500" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Hostel Settings
              </h1>
            </div>
          </div>

          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            aria-label="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Success / Error Notification */}
        {backupSuccessMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center space-x-2.5 text-emerald-800 dark:text-emerald-200 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{backupSuccessMessage}</span>
          </div>
        )}

        {importErrorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 flex items-center space-x-2.5 text-rose-800 dark:text-rose-200 text-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{importErrorMessage}</span>
          </div>
        )}

        {/* Section 0: Student Profile */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Hostel Resident Profile
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Personalize your bill header with your name, room number, and hostel block.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jagdish Sah"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 214"
                  value={profileRoom}
                  onChange={(e) => setProfileRoom(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Hostel Block / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Block B / Boys Hostel"
                value={profileBlock}
                onChange={(e) => setProfileBlock(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileBadgeOnHome}
                  onChange={(e) => setProfileBadgeOnHome(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span>Show profile badge on Home</span>
              </label>

              <div className="flex items-center space-x-2">
                {profileSaveMessage && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Profile saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-xs rounded-xl shadow-xs transition"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Section 1: Default Food Prices */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Core Meal & Addon Prices
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              These prices apply when creating new days. Existing historical records remain frozen at their saved rates. Breakfast is <strong>by default not eaten</strong>.
            </p>
          </div>

          <form onSubmit={handleSavePrices} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Morning Food (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={morningPrice}
                  onChange={(e) => setMorningPrice(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Dinner (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={dinnerPrice}
                  onChange={(e) => setDinnerPrice(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Masu Unit (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={masuPrice}
                  onChange={(e) => setMasuPrice(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Omelette Unit (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={omelettePrice}
                  onChange={(e) => setOmelettePrice(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {priceSaveMessage ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Prices saved!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="py-2 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-xs rounded-xl shadow-xs transition"
              >
                Update Core Prices
              </button>
            </div>
          </form>
        </section>

        {/* Section: Auto-Save Daily Records */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Auto-Save Daily Records
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically log default meals on days you don't open the app.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoSaveDailyDefaults(!settings.autoSaveDailyDefaults)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.autoSaveDailyDefaults ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={settings.autoSaveDailyDefaults}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.autoSaveDailyDefaults ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <p>
              <strong>Status:</strong>{' '}
              {settings.autoSaveDailyDefaults ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Active (Auto-saving missed days with default meals)
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  Inactive (Only saves days you confirm)
                </span>
              )}
            </p>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
              When ON, if you miss visiting the app for a few days, it automatically fills those days with default hostel meals upon opening.
            </p>
          </div>
        </section>

        {/* Section: Removable Hostel Meals */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Hostel Meal Options
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Disable or remove standard hostel meals from your daily feed if you don't consume them.
              </p>
            </div>
            <button
              type="button"
              onClick={resetToHostelDefaults}
              className="px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition flex items-center space-x-1 shrink-0"
              title="Reset all meals and prices to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {[
              {
                key: 'morningFood' as const,
                label: 'Morning Food',
                sublabel: 'Main lunch meal',
                price: settings.prices.morningFood,
                enabled: settings.coreItemsEnabled?.morningFood !== false,
              },
              {
                key: 'breakfast' as const,
                label: 'Breakfast',
                sublabel: 'Morning snacks / tea',
                price: null,
                enabled: settings.coreItemsEnabled?.breakfast !== false,
              },
              {
                key: 'dinner' as const,
                label: 'Dinner',
                sublabel: 'Night dinner meal',
                price: settings.prices.dinner,
                enabled: settings.coreItemsEnabled?.dinner !== false,
              },
              {
                key: 'masu' as const,
                label: 'Masu (Non-veg)',
                sublabel: 'Meat addon',
                price: settings.prices.masu,
                enabled: settings.coreItemsEnabled?.masu !== false,
              },
              {
                key: 'omelette' as const,
                label: 'Omelette',
                sublabel: 'Egg addon',
                price: settings.prices.omelette,
                enabled: settings.coreItemsEnabled?.omelette !== false,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                    {item.price !== null && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        Rs. {item.price}
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500">{item.sublabel}</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCoreItem(item.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition active:scale-95 flex items-center space-x-1 ${
                    item.enabled
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  <span>{item.enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Custom Food Options (Add Multi-Choice Options like Breakfast, or Quantities/Toggles) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Custom Hostel Options
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Add meal options like Breakfast (with presets/choices), quantity steppers, or toggles. (By default set as not eaten).
              </p>
            </div>
          </div>

          {/* List of Custom Options */}
          {customOptions.length > 0 ? (
            <div className="space-y-3">
              {customOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {opt.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold uppercase">
                          {opt.type === 'multi_choice' ? 'Multi-Choice (Like Breakfast)' : opt.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {opt.type === 'multi_choice'
                          ? `Presets: ${(opt.presets || []).length} items • Default: Not eaten`
                          : opt.type === 'toggle'
                          ? `Rate: Rs. ${opt.defaultPrice} • Default: ${opt.defaultEaten ? 'Eaten' : 'Skipped'}`
                          : `Rate: Rs. ${opt.defaultPrice} • Default qty: ${opt.defaultQuantity}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteCustomOption(opt.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete custom option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* For Multi-Choice options: Manage Presets */}
                  {opt.type === 'multi_choice' && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Option Presets:
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivePresetOptId(activePresetOptId === opt.id ? null : opt.id)}
                          className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] font-medium flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{activePresetOptId === opt.id ? 'Close' : 'Add Preset'}</span>
                        </button>
                      </div>

                      {/* Presets Chips */}
                      {(opt.presets || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(opt.presets || []).map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-200">{p.label}</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">Rs.{p.price}</span>
                              <button
                                type="button"
                                onClick={() => deletePresetFromCustomOption(opt.id, p.id)}
                                className="text-slate-400 hover:text-rose-500 ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No presets added yet.</p>
                      )}

                      {/* Add Sub-preset form */}
                      {activePresetOptId === opt.id && (
                        <div className="mt-1 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center space-x-2 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. Samosa"
                            value={subPresetName}
                            onChange={(e) => setSubPresetName(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Rs."
                            value={subPresetPrice}
                            onChange={(e) => setSubPresetPrice(e.target.value)}
                            className="w-16 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSubPreset(opt.id)}
                            className="py-1 px-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded text-xs font-semibold"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">
              No custom options added yet. Create one below!
            </p>
          )}

          {/* Add Custom Option Form */}
          <form
            onSubmit={handleAddCustomOption}
            className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5"
          >
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              + Add New Food Option
            </span>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Option Name (e.g. Snacks, Milk, Tea Addon)"
                value={newOptName}
                onChange={(e) => setNewOptName(e.target.value)}
                className="col-span-2 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-slate-500 block mb-0.5">Option Category Type</label>
                <select
                  value={newOptType}
                  onChange={(e) => setNewOptType(e.target.value as CustomOptionType)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="multi_choice">Multi-Choice (Like Breakfast with presets)</option>
                  <option value="quantity">Quantity Stepper (0, 1, 2...)</option>
                  <option value="toggle">Toggle (Single fixed price)</option>
                </select>
              </div>

              {newOptType !== 'multi_choice' && (
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Default Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={newOptPrice}
                    onChange={(e) => setNewOptPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              )}

              {newOptType === 'toggle' ? (
                <div className="col-span-2 flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="defEaten"
                    checked={newOptDefaultEaten}
                    onChange={(e) => setNewOptDefaultEaten(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <label htmlFor="defEaten" className="text-xs text-slate-700 dark:text-slate-300">
                    Default: Eaten (Yes)
                  </label>
                </div>
              ) : newOptType === 'quantity' ? (
                <div className="col-span-2 flex items-center space-x-2 pt-1">
                  <label className="text-xs text-slate-700 dark:text-slate-300">
                    Default Quantity:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newOptDefaultQty}
                    onChange={(e) => setNewOptDefaultQty(e.target.value)}
                    className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <div className="col-span-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Created as <strong>by default not eaten</strong>. You can add presets after creation.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option to Tracker</span>
            </button>
          </form>
        </section>

        {/* Section 3: Breakfast Presets */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Breakfast Presets
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Quick-tap items available for Breakfast.
              </p>
            </div>
          </div>

          {/* List of Presets */}
          <div className="space-y-2">
            {breakfastPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
              >
                {editingPresetId === preset.id ? (
                  <div className="flex items-center space-x-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editPresetName}
                      onChange={(e) => setEditPresetName(e.target.value)}
                      className="w-1/2 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min="1"
                      value={editPresetPrice}
                      onChange={(e) => setEditPresetPrice(e.target.value)}
                      className="w-1/3 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => saveEditedPreset(preset.id)}
                      className="text-emerald-600 dark:text-emerald-400 font-bold px-1"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPresetId(null)}
                      className="text-slate-400 font-bold px-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {preset.label}
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        Rs. {preset.price}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => startEditPreset(preset)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                        title="Edit preset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBreakfastPreset(preset.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg"
                        title="Delete preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add Preset Form */}
          <form onSubmit={handleAddPreset} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              + Add New Breakfast Preset
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Item (e.g. Samosa)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Rs."
                value={newPresetPrice}
                onChange={(e) => setNewPresetPrice(e.target.value)}
                className="w-20 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
              <button
                type="submit"
                className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl active:scale-95 transition"
                title="Add Preset"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>

        {/* Section: Display & Preferences */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Preferences & Display
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Customize which optional features and widgets are active.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {/* Show Day Notes */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Show Day Notes on Daily Feed
                </span>
                <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block">
                  Add optional reasons or notes for meals (e.g. "Ate at Lamachaur")
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDailyNotes(settings.showDailyNotes === false)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.showDailyNotes !== false ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={settings.showDailyNotes !== false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.showDailyNotes !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Show Food Analytics */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Show Food Analytics & Hostel Badges
                </span>
                <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block">
                  Spending progress bar, daily averages, and fun badges in Monthly Bill
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFoodAnalytics(settings.showFoodAnalytics === false)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.showFoodAnalytics !== false ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={settings.showFoodAnalytics !== false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.showFoodAnalytics !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section: Daily Meal Reminders */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Daily Meal Reminders
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Offline browser notifications to remind you to log meals on time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleReminders}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.reminderConfig?.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={Boolean(settings.reminderConfig?.enabled)}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.reminderConfig?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings.reminderConfig?.enabled && (
            <div className="space-y-3 pt-1 animate-fade-in border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                    Morning Reminder
                  </label>
                  <input
                    type="time"
                    value={morningReminderTime}
                    onChange={(e) => handleSaveReminderTimes(e.target.value, eveningReminderTime)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                    Evening Reminder
                  </label>
                  <input
                    type="time"
                    value={eveningReminderTime}
                    onChange={(e) => handleSaveReminderTimes(morningReminderTime, e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition flex items-center space-x-1.5 active:scale-95"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Notification</span>
                </button>

                {reminderTestStatus && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate ml-2">
                    {reminderTestStatus}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Data Backup & Restore */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Backup & Restore
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your canteen data is stored 100% locally on this device. Export a backup anytime to keep a safe copy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-1.5 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-1.5 transition active:scale-95"
            >
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Import JSON</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </section>

        {/* Section 5: Danger Zone */}
        <section className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
            <AlertOctagon className="w-4 h-4" />
            <h2 className="text-sm font-semibold">Danger Zone</h2>
          </div>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-300/80">
            Permanently deletes all recorded meals and saved monthly snapshots from this browser.
          </p>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            Clear All Stored Records
          </button>
        </section>

        {/* Section 6: Help & Community Support */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Guide & Community Support
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Read the manual, learn features, or help star and improve the project.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenGuide) {
                  onOpenGuide();
                } else {
                  window.open('/guide.html', '_blank');
                }
              }}
              className="p-3 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-500/20 rounded-xl text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between transition active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Open User Guide</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenSupport) {
                  onOpenSupport();
                } else {
                  window.open('/support.html', '_blank');
                }
              }}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-900 dark:text-rose-200 flex items-center justify-between transition active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Support & Suggestions</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </section>

        {/* Section 7: App Information & Contact */}
        <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1.5 pb-4">
          <div className="flex items-center justify-center space-x-1.5">
            <Info className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              WRC Hostel Canteen Tracker v1.2.0
            </span>
          </div>
          <p className="text-[11px]">
            Created with 💖 for WRC Hostel by Jagdish And Zara • 100% Offline
          </p>
          <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
            <a
              href="https://wa.me/9779702406668?text=Hi%20Jagdish,%20regarding%20WRC%20Hostel%20Canteen%20Tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center space-x-1"
            >
              <span>WhatsApp: +977 9702406668</span>
            </a>
            <span>•</span>
            <a
              href="https://jagdishsah.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center space-x-1"
            >
              <span>jagdishsah.com.np</span>
            </a>
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Import */}
      <ConfirmModal
        isOpen={Boolean(pendingImportData)}
        title="Restore Backup Data"
        message="Importing this file will replace your current local records and snapshots. Make sure you have exported your current data if you still need it."
        confirmLabel="Replace & Restore"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImportData(null)}
      />

      {/* Confirmation Modal for Clear All */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Delete All Local Data"
        message="This will permanently remove all locally stored canteen records and snapshots from this device. This action cannot be undone unless you have an exported backup."
        confirmLabel="Delete Everything"
        cancelLabel="Keep My Data"
        isDanger={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
