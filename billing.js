(function (global) {
  "use strict";

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function isPresetIncomplete(entry) {
    if (!entry) return true;
    if (!entry.eaten) return false;
    return toNumber(entry.price, 0) <= 0 || !(entry.item || "").trim();
  }

  function calcDay(record, settings) {
    var result = {
      total: 0,
      incompleteCount: 0,
      incompletePresetDays: false,
      breakfastIncomplete: false,
      categories: [],
    };

    if (!record) return result;
    settings = settings || {};

    (settings.toggleMeals || []).forEach(function (meal) {
      var entry = (record.toggles && record.toggles[meal.id]) || { eaten: false, price: 0 };
      var cost = entry.eaten ? toNumber(entry.price, 0) : 0;
      result.total += cost;
      result.categories.push({
        type: "toggle",
        id: meal.id,
        label: meal.label,
        detail: entry.eaten ? "Eaten" : "Not eaten",
        cost: cost,
        count: entry.eaten ? 1 : 0,
      });
    });

    (settings.presetMeals || []).forEach(function (meal) {
      var entry = (record.presets && record.presets[meal.id]) || {
        eaten: false,
        item: "",
        price: 0,
      };
      var incomplete = isPresetIncomplete(entry);
      if (incomplete) result.incompleteCount += 1;
      var cost = entry.eaten && !incomplete ? toNumber(entry.price, 0) : 0;
      result.total += cost;
      result.categories.push({
        type: "preset",
        id: meal.id,
        label: meal.label,
        detail: !entry.eaten ? "Not eaten" : incomplete ? "Incomplete" : entry.item,
        cost: cost,
        count: entry.eaten && !incomplete ? 1 : 0,
        incomplete: incomplete,
      });
    });

    (settings.quantityItems || []).forEach(function (item) {
      var entry = (record.quantities && record.quantities[item.id]) || { qty: 0, price: 0 };
      var qty = Math.max(0, Math.floor(toNumber(entry.qty, 0)));
      var unit = toNumber(entry.price, 0);
      var cost = qty * unit;
      result.total += cost;
      result.categories.push({
        type: "quantity",
        id: item.id,
        label: item.label,
        detail: qty + " × Rs. " + unit,
        cost: cost,
        count: qty,
      });
    });

    result.incompletePresetDays = result.incompleteCount > 0;
    result.breakfastIncomplete = result.incompleteCount > 0;
    return result;
  }

  function formatRs(amount) {
    return "Rs. " + Math.round(toNumber(amount, 0)).toLocaleString("en-NP");
  }

  function calcMonth(dayEntries, settings) {
    var summary = {
      daysInMonth: dayEntries.length,
      recordedDays: 0,
      incompletePresetDays: 0,
      incompleteBreakfastDays: 0,
      total: 0,
      categoryTotals: {},
      days: [],
    };

    dayEntries.forEach(function (entry) {
      if (!entry.record) return;
      var bill = calcDay(entry.record, settings);
      summary.recordedDays += 1;
      summary.total += bill.total;
      if (bill.incompleteCount > 0) {
        summary.incompletePresetDays += 1;
        summary.incompleteBreakfastDays += 1;
      }
      bill.categories.forEach(function (cat) {
        if (!summary.categoryTotals[cat.id]) {
          summary.categoryTotals[cat.id] = {
            id: cat.id,
            type: cat.type,
            label: cat.label,
            cost: 0,
            count: 0,
          };
        }
        summary.categoryTotals[cat.id].cost += cat.cost;
        summary.categoryTotals[cat.id].count += cat.count;
      });
      summary.days.push({
        iso: entry.iso,
        bsDay: entry.bsDay,
        label: entry.label,
        record: entry.record,
        bill: bill,
        incomplete: bill.incompleteCount > 0,
      });
    });

    return summary;
  }

  global.CanteenBilling = {
    calcDay: calcDay,
    calcMonth: calcMonth,
    isPresetIncomplete: isPresetIncomplete,
    formatRs: formatRs,
  };
})(window);
