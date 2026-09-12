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
} from 'lucide-react';
import { useCanteenStore } from '../store/canteenStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { BackupPayload, BreakfastPreset, CustomOptionType } from '../types/canteen';
import { getTodayISODate } from '../utils/nepaliDate';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const {
    settings,
    breakfastPresets,
    customOptions,
    records,
    monthSnapshots,
    schemaVersion,
    updateSettingsPrices,
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

        {/* Section 6: App Information */}
        <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <div className="flex items-center justify-center space-x-1.5">
            <Info className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              WRC Hostel Canteen Tracker v1.2.0
            </span>
          </div>
          <p className="text-[11px]">
            Created with 💖 for WRC Hostel by Your Zara & Jagdish • 100% Offline
          </p>
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
