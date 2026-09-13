(function (global) {
  "use strict";

  var STORAGE_KEY = "canteen-tracker";
  var CURRENT_SCHEMA = 2;

  function makeId(prefix, label) {
    var base = String(label || prefix)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!base) base = prefix;
    return prefix + "-" + base + "-" + Date.now().toString(36);
  }

  function defaultState() {
    return {
      schemaVersion: CURRENT_SCHEMA,
      settings: {
        toggleMeals: [
          { id: "morningFood", label: "Morning Food", price: 72, defaultEaten: true },
          { id: "dinner", label: "Dinner", price: 72, defaultEaten: true },
        ],
        presetMeals: [
          {
            id: "breakfast",
            label: "Breakfast",
            defaultEaten: true,
            defaultPresetId: "",
            defaultItem: "",
            defaultPrice: 0,
            presets: [
              { id: "chowmein", label: "Chowmein", price: 50 },
              { id: "momo", label: "Momo", price: 100 },
              { id: "tea", label: "Tea", price: 20 },
            ],
          },
        ],
        quantityItems: [
          { id: "masu", label: "Masu", price: 75, defaultQuantity: 0 },
          { id: "omelette", label: "Omelette", price: 30, defaultQuantity: 0 },
        ],
      },
      records: {},
      monthSnapshots: {},
      meta: {
        lastOpenedIso: null,
        selectedDateIso: null,
        selectedBsYear: null,
        selectedBsMonth: null,
      },
    };
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function migrateV1ToV2(raw) {
    var next = defaultState();
    var items = (raw.settings && raw.settings.items) || {};
    var breakfast = (raw.settings && raw.settings.breakfast) || {};
    var presets = Array.isArray(raw.breakfastPresets)
      ? raw.breakfastPresets
      : next.settings.presetMeals[0].presets;

    next.settings.toggleMeals = [];
    if (items.morningFood) {
      next.settings.toggleMeals.push({
        id: "morningFood",
        label: items.morningFood.label || "Morning Food",
        price: Number(items.morningFood.price) || 72,
        defaultEaten: items.morningFood.defaultEaten !== false,
      });
    }
    if (items.dinner) {
      next.settings.toggleMeals.push({
        id: "dinner",
        label: items.dinner.label || "Dinner",
        price: Number(items.dinner.price) || 72,
        defaultEaten: items.dinner.defaultEaten !== false,
      });
    }
    if (!next.settings.toggleMeals.length) {
      next.settings.toggleMeals = defaultState().settings.toggleMeals;
    }

    next.settings.quantityItems = [];
    ["masu", "omelette"].forEach(function (key) {
      if (!items[key]) return;
      next.settings.quantityItems.push({
        id: key,
        label: items[key].label || (key === "masu" ? "Masu" : "Omelette"),
        price: Number(items[key].price) || (key === "masu" ? 75 : 30),
        defaultQuantity: Math.max(0, Math.floor(Number(items[key].defaultQuantity) || 0)),
      });
    });
    if (!next.settings.quantityItems.length) {
      next.settings.quantityItems = defaultState().settings.quantityItems;
    }

    next.settings.presetMeals = [
      {
        id: "breakfast",
        label: breakfast.label || "Breakfast",
        defaultEaten: breakfast.defaultEaten !== false,
        defaultPresetId: "",
        defaultItem: "",
        defaultPrice: 0,
        presets: presets.map(function (p) {
          return { id: p.id, label: p.label, price: Number(p.price) || 0 };
        }),
      },
    ];

    next.records = {};
    Object.keys(raw.records || {}).forEach(function (iso) {
      var old = raw.records[iso];
      if (!isObject(old)) return;
      var rec = { toggles: {}, presets: {}, quantities: {} };
      if (typeof old.morningFood === "boolean") {
        rec.toggles.morningFood = {
          eaten: old.morningFood,
          price: Number(old.morningFoodPrice) || 0,
        };
      }
      if (typeof old.dinner === "boolean") {
        rec.toggles.dinner = {
          eaten: old.dinner,
          price: Number(old.dinnerPrice) || 0,
        };
      }
      if (old.breakfast) {
        rec.presets.breakfast = {
          eaten: !!old.breakfast.eaten,
          item: old.breakfast.item || "",
          price: Number(old.breakfast.price) || 0,
        };
      }
      if (old.masu !== undefined) {
        rec.quantities.masu = {
          qty: Math.max(0, Math.floor(Number(old.masu) || 0)),
          price: Number(old.masuPrice) || 0,
        };
      }
      if (old.omelette !== undefined) {
        rec.quantities.omelette = {
          qty: Math.max(0, Math.floor(Number(old.omelette) || 0)),
          price: Number(old.omelettePrice) || 0,
        };
      }
      next.records[iso] = rec;
    });

    next.monthSnapshots = isObject(raw.monthSnapshots) ? raw.monthSnapshots : {};
    next.meta = Object.assign({}, next.meta, raw.meta || {});
    return next;
  }

  function normalizeState(raw) {
    if (!isObject(raw)) return defaultState();
    if (!raw.schemaVersion || raw.schemaVersion < 2) return migrateV1ToV2(raw);

    var base = defaultState();
    if (Array.isArray(raw.settings && raw.settings.toggleMeals)) {
      base.settings.toggleMeals = raw.settings.toggleMeals;
    }
    if (Array.isArray(raw.settings && raw.settings.presetMeals)) {
      base.settings.presetMeals = raw.settings.presetMeals;
    }
    if (Array.isArray(raw.settings && raw.settings.quantityItems)) {
      base.settings.quantityItems = raw.settings.quantityItems;
    }
    if (isObject(raw.records)) base.records = raw.records;
    if (isObject(raw.monthSnapshots)) base.monthSnapshots = raw.monthSnapshots;
    if (isObject(raw.meta)) base.meta = Object.assign({}, base.meta, raw.meta);
    return base;
  }

  var state = defaultState();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state = defaultState();
        save();
        return state;
      }
      state = normalizeState(JSON.parse(raw));
      save();
      return state;
    } catch (err) {
      console.error("Failed to load canteen store", err);
      state = defaultState();
      return state;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error("Failed to save canteen store", err);
      return false;
    }
  }

  function getState() {
    return state;
  }

  function getRecordCount() {
    return Object.keys(state.records).length;
  }

  function todayIso() {
    var now = new Date();
    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")
    );
  }

  function shiftIso(isoDate, deltaDays) {
    var parts = String(isoDate).split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() + deltaDays);
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function getSelectedDate() {
    return state.meta.selectedDateIso || todayIso();
  }

  function setSelectedDate(isoDate) {
    state.meta.selectedDateIso = isoDate;
    state.meta.lastOpenedIso = isoDate;
    save();
    return isoDate;
  }

  function findToggle(id) {
    return state.settings.toggleMeals.find(function (m) {
      return m.id === id;
    });
  }
  function findPresetMeal(id) {
    return state.settings.presetMeals.find(function (m) {
      return m.id === id;
    });
  }
  function findQty(id) {
    return state.settings.quantityItems.find(function (m) {
      return m.id === id;
    });
  }

  function resolvePresetDefault(meal) {
    if (meal.defaultPresetId) {
      var preset = (meal.presets || []).find(function (p) {
        return p.id === meal.defaultPresetId;
      });
      if (preset) {
        return {
          eaten: !!meal.defaultEaten,
          item: preset.label,
          price: Number(preset.price) || 0,
        };
      }
    }
    if (meal.defaultItem && Number(meal.defaultPrice) > 0) {
      return {
        eaten: !!meal.defaultEaten,
        item: meal.defaultItem,
        price: Number(meal.defaultPrice) || 0,
      };
    }
    return {
      eaten: !!meal.defaultEaten,
      item: "",
      price: 0,
    };
  }

  function createDefaultRecord() {
    var record = { toggles: {}, presets: {}, quantities: {} };
    state.settings.toggleMeals.forEach(function (meal) {
      record.toggles[meal.id] = {
        eaten: !!meal.defaultEaten,
        price: Number(meal.price) || 0,
      };
    });
    state.settings.presetMeals.forEach(function (meal) {
      record.presets[meal.id] = resolvePresetDefault(meal);
    });
    state.settings.quantityItems.forEach(function (item) {
      record.quantities[item.id] = {
        qty: Math.max(0, Math.floor(Number(item.defaultQuantity) || 0)),
        price: Number(item.price) || 0,
      };
    });
    return record;
  }

  function ensureRecordShape(record) {
    if (!record.toggles) record.toggles = {};
    if (!record.presets) record.presets = {};
    if (!record.quantities) record.quantities = {};

    state.settings.toggleMeals.forEach(function (meal) {
      if (!record.toggles[meal.id]) {
        record.toggles[meal.id] = {
          eaten: !!meal.defaultEaten,
          price: Number(meal.price) || 0,
        };
      }
    });
    state.settings.presetMeals.forEach(function (meal) {
      if (!record.presets[meal.id]) {
        record.presets[meal.id] = resolvePresetDefault(meal);
      }
    });
    state.settings.quantityItems.forEach(function (item) {
      if (!record.quantities[item.id]) {
        record.quantities[item.id] = {
          qty: Math.max(0, Math.floor(Number(item.defaultQuantity) || 0)),
          price: Number(item.price) || 0,
        };
      }
    });
    return record;
  }

  function getOrCreateRecord(isoDate) {
    var key = isoDate || getSelectedDate();
    if (!state.records[key]) {
      state.records[key] = createDefaultRecord();
    } else {
      ensureRecordShape(state.records[key]);
    }
    save();
    return state.records[key];
  }

  function getRecord(isoDate) {
    var record = state.records[isoDate] || null;
    if (record) ensureRecordShape(record);
    return record;
  }

  function ensureRecord(isoDate) {
    return getOrCreateRecord(isoDate || getSelectedDate());
  }

  function getSelectedBsMonth() {
    if (state.meta.selectedBsYear && state.meta.selectedBsMonth) {
      return { year: state.meta.selectedBsYear, month: state.meta.selectedBsMonth };
    }
    return null;
  }

  function setSelectedBsMonth(year, month) {
    state.meta.selectedBsYear = year;
    state.meta.selectedBsMonth = month;
    save();
    return getSelectedBsMonth();
  }

  function closeMonth(year, month, summary) {
    var key = year + "-" + String(month).padStart(2, "0");
    state.monthSnapshots[key] = {
      year: year,
      month: month,
      closedAt: new Date().toISOString(),
      recordedDays: summary.recordedDays,
      incompletePresetDays: summary.incompletePresetDays,
      total: summary.total,
      categoryTotals: summary.categoryTotals,
    };
    save();
    return state.monthSnapshots[key];
  }

  function getMonthSnapshot(year, month) {
    return state.monthSnapshots[year + "-" + String(month).padStart(2, "0")] || null;
  }

  function toggleMeal(isoDate, mealId) {
    var record = ensureRecord(isoDate);
    var entry = record.toggles[mealId];
    if (!entry) {
      var meal = findToggle(mealId);
      if (!meal) return record;
      entry = { eaten: !!meal.defaultEaten, price: Number(meal.price) || 0 };
      record.toggles[mealId] = entry;
    }
    entry.eaten = !entry.eaten;
    save();
    return record;
  }

  function togglePresetMeal(isoDate, mealId) {
    var record = ensureRecord(isoDate);
    var entry = record.presets[mealId];
    if (!entry) {
      var meal = findPresetMeal(mealId);
      entry = meal ? resolvePresetDefault(meal) : { eaten: false, item: "", price: 0 };
      record.presets[mealId] = entry;
    }
    entry.eaten = !entry.eaten;
    save();
    return record;
  }

  function setPresetMeal(isoDate, mealId, item, price) {
    var record = ensureRecord(isoDate);
    var cleanPrice = Number(price);
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) cleanPrice = 0;
    record.presets[mealId] = {
      eaten: true,
      item: String(item || "").trim(),
      price: cleanPrice,
    };
    save();
    return record;
  }

  function applyPresetOption(isoDate, mealId, presetId) {
    var meal = findPresetMeal(mealId);
    if (!meal) return ensureRecord(isoDate);
    var preset = (meal.presets || []).find(function (p) {
      return p.id === presetId;
    });
    if (!preset) return ensureRecord(isoDate);
    return setPresetMeal(isoDate, mealId, preset.label, preset.price);
  }

  function normalizeQty(value) {
    var n = Math.floor(Number(value));
    return !Number.isFinite(n) || n < 0 ? 0 : n;
  }

  function setQuantity(isoDate, itemId, quantity) {
    var record = ensureRecord(isoDate);
    if (!record.quantities[itemId]) {
      var item = findQty(itemId);
      record.quantities[itemId] = { qty: 0, price: item ? Number(item.price) || 0 : 0 };
    }
    record.quantities[itemId].qty = normalizeQty(quantity);
    save();
    return record;
  }

  function incrementQuantity(isoDate, itemId) {
    var record = ensureRecord(isoDate);
    var current = (record.quantities[itemId] && record.quantities[itemId].qty) || 0;
    return setQuantity(isoDate, itemId, current + 1);
  }

  function decrementQuantity(isoDate, itemId) {
    var record = ensureRecord(isoDate);
    var current = (record.quantities[itemId] && record.quantities[itemId].qty) || 0;
    return setQuantity(isoDate, itemId, current - 1);
  }

  function addToggleMeal(label, price, defaultEaten) {
    var cleanLabel = String(label || "").trim();
    var cleanPrice = Number(price);
    if (!cleanLabel) throw new Error("Meal needs a name.");
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) throw new Error("Meal needs a valid price.");
    var meal = {
      id: makeId("toggle", cleanLabel),
      label: cleanLabel,
      price: cleanPrice,
      defaultEaten: !!defaultEaten,
    };
    state.settings.toggleMeals.push(meal);
    save();
    return meal;
  }

  function updateToggleMeal(id, label, price, defaultEaten) {
    var meal = findToggle(id);
    if (!meal) throw new Error("Meal not found.");
    var cleanLabel = String(label || "").trim();
    var cleanPrice = Number(price);
    if (!cleanLabel) throw new Error("Meal needs a name.");
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) throw new Error("Meal needs a valid price.");
    meal.label = cleanLabel;
    meal.price = cleanPrice;
    meal.defaultEaten = !!defaultEaten;
    save();
    return meal;
  }

  function deleteToggleMeal(id) {
    state.settings.toggleMeals = state.settings.toggleMeals.filter(function (m) {
      return m.id !== id;
    });
    save();
    return state.settings.toggleMeals;
  }

  function addPresetMeal(label, defaultEaten, defaultItem, defaultPrice) {
    var cleanLabel = String(label || "").trim();
    if (!cleanLabel) throw new Error("Preset meal needs a name.");
    var cleanPrice = Number(defaultPrice);
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) cleanPrice = 0;
    var meal = {
      id: makeId("preset", cleanLabel),
      label: cleanLabel,
      defaultEaten: !!defaultEaten,
      defaultPresetId: "",
      defaultItem: String(defaultItem || "").trim(),
      defaultPrice: cleanPrice,
      presets: [],
    };
    state.settings.presetMeals.push(meal);
    save();
    return meal;
  }

  function updatePresetMeal(id, fields) {
    var meal = findPresetMeal(id);
    if (!meal) throw new Error("Preset meal not found.");
    var cleanLabel = String(fields.label || "").trim();
    if (!cleanLabel) throw new Error("Preset meal needs a name.");
    meal.label = cleanLabel;
    meal.defaultEaten = !!fields.defaultEaten;
    meal.defaultPresetId = String(fields.defaultPresetId || "");
    meal.defaultItem = String(fields.defaultItem || "").trim();
    var cleanPrice = Number(fields.defaultPrice);
    meal.defaultPrice = Number.isFinite(cleanPrice) && cleanPrice >= 0 ? cleanPrice : 0;
    save();
    return meal;
  }

  function deletePresetMeal(id) {
    state.settings.presetMeals = state.settings.presetMeals.filter(function (m) {
      return m.id !== id;
    });
    save();
    return state.settings.presetMeals;
  }

  function addPresetOption(mealId, label, price) {
    var meal = findPresetMeal(mealId);
    if (!meal) throw new Error("Preset meal not found.");
    var cleanLabel = String(label || "").trim();
    var cleanPrice = Number(price);
    if (!cleanLabel) throw new Error("Preset needs a name.");
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) throw new Error("Preset needs a valid price.");
    var preset = { id: makeId("opt", cleanLabel), label: cleanLabel, price: cleanPrice };
    meal.presets.push(preset);
    save();
    return preset;
  }

  function updatePresetOption(mealId, presetId, label, price) {
    var meal = findPresetMeal(mealId);
    if (!meal) throw new Error("Preset meal not found.");
    var preset = meal.presets.find(function (p) {
      return p.id === presetId;
    });
    if (!preset) throw new Error("Preset not found.");
    var cleanLabel = String(label || "").trim();
    var cleanPrice = Number(price);
    if (!cleanLabel) throw new Error("Preset needs a name.");
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) throw new Error("Preset needs a valid price.");
    preset.label = cleanLabel;
    preset.price = cleanPrice;
    save();
    return preset;
  }

  function deletePresetOption(mealId, presetId) {
    var meal = findPresetMeal(mealId);
    if (!meal) throw new Error("Preset meal not found.");
    meal.presets = meal.presets.filter(function (p) {
      return p.id !== presetId;
    });
    if (meal.defaultPresetId === presetId) meal.defaultPresetId = "";
    save();
    return meal.presets;
  }

  function addQuantityItem(label, price, defaultQuantity) {
    var cleanLabel = String(label || "").trim();
    var cleanPrice = Number(price);
    if (!cleanLabel) throw new Error("Item needs a name.");
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) throw new Error("Item needs a valid price.");
    var item = {
      id: makeId("qty", cleanLabel),
      label: cleanLabel,
      price: cleanPrice,
      defaultQuantity: normalizeQty(defaultQuantity),
    };
    state.settings.quantityItems.push(item);
    save();
    return item;
  }

  function updateQuantityItem(id, label, price, defaultQuantity) {
    var item = findQty(id);
    if (!item) throw new Error("Item not found.");
    var cleanLabel = String(label || "").trim();
    var cleanPrice = Number(price);
    if (!cleanLabel) throw new Error("Item needs a name.");
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) throw new Error("Item needs a valid price.");
    item.label = cleanLabel;
    item.price = cleanPrice;
    item.defaultQuantity = normalizeQty(defaultQuantity);
    save();
    return item;
  }

  function deleteQuantityItem(id) {
    state.settings.quantityItems = state.settings.quantityItems.filter(function (item) {
      return item.id !== id;
    });
    save();
    return state.settings.quantityItems;
  }

  function touchLastOpened() {
    var today = todayIso();
    if (!state.meta.selectedDateIso) state.meta.selectedDateIso = today;
    state.meta.lastOpenedIso = today;
    save();
    return state.meta.lastOpenedIso;
  }

  function replaceState(nextState) {
    state = normalizeState(nextState);
    save();
    return state;
  }

  function clearAllData() {
    state = defaultState();
    state.meta.lastOpenedIso = todayIso();
    state.meta.selectedDateIso = todayIso();
    save();
    return state;
  }

  global.CanteenStore = {
    STORAGE_KEY: STORAGE_KEY,
    CURRENT_SCHEMA: CURRENT_SCHEMA,
    defaultState: defaultState,
    load: load,
    save: save,
    getState: getState,
    getRecordCount: getRecordCount,
    todayIso: todayIso,
    shiftIso: shiftIso,
    getSelectedDate: getSelectedDate,
    setSelectedDate: setSelectedDate,
    getOrCreateRecord: getOrCreateRecord,
    getRecord: getRecord,
    getSelectedBsMonth: getSelectedBsMonth,
    setSelectedBsMonth: setSelectedBsMonth,
    closeMonth: closeMonth,
    getMonthSnapshot: getMonthSnapshot,
    toggleMeal: toggleMeal,
    togglePresetMeal: togglePresetMeal,
    setPresetMeal: setPresetMeal,
    applyPresetOption: applyPresetOption,
    setQuantity: setQuantity,
    incrementQuantity: incrementQuantity,
    decrementQuantity: decrementQuantity,
    addToggleMeal: addToggleMeal,
    updateToggleMeal: updateToggleMeal,
    deleteToggleMeal: deleteToggleMeal,
    addPresetMeal: addPresetMeal,
    updatePresetMeal: updatePresetMeal,
    deletePresetMeal: deletePresetMeal,
    addPresetOption: addPresetOption,
    updatePresetOption: updatePresetOption,
    deletePresetOption: deletePresetOption,
    addQuantityItem: addQuantityItem,
    updateQuantityItem: updateQuantityItem,
    deleteQuantityItem: deleteQuantityItem,
    touchLastOpened: touchLastOpened,
    replaceState: replaceState,
    clearAllData: clearAllData,
  };
})(window);
