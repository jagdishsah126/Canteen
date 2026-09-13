(function (global) {
  "use strict";

  var SUPPORTED_SCHEMA = 2;
  var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isNonNegNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  }

  function isNonNegInt(value) {
    return isNonNegNumber(value) && Math.floor(value) === value;
  }

  function fail(errors, message) {
    errors.push(message);
  }

  function validateToggleMeal(meal, path, errors) {
    if (!isObject(meal)) return fail(errors, path + " must be an object");
    if (typeof meal.id !== "string" || !meal.id) fail(errors, path + ".id required");
    if (typeof meal.label !== "string" || !meal.label.trim()) fail(errors, path + ".label required");
    if (!isNonNegNumber(meal.price)) fail(errors, path + ".price invalid");
    if (typeof meal.defaultEaten !== "boolean") fail(errors, path + ".defaultEaten must be boolean");
  }

  function validatePresetMeal(meal, path, errors) {
    if (!isObject(meal)) return fail(errors, path + " must be an object");
    if (typeof meal.id !== "string" || !meal.id) fail(errors, path + ".id required");
    if (typeof meal.label !== "string" || !meal.label.trim()) fail(errors, path + ".label required");
    if (typeof meal.defaultEaten !== "boolean") fail(errors, path + ".defaultEaten must be boolean");
    if (!Array.isArray(meal.presets)) return fail(errors, path + ".presets must be an array");
    meal.presets.forEach(function (preset, i) {
      var p = path + ".presets[" + i + "]";
      if (!isObject(preset)) return fail(errors, p + " must be an object");
      if (typeof preset.id !== "string" || !preset.id) fail(errors, p + ".id required");
      if (typeof preset.label !== "string" || !preset.label.trim()) fail(errors, p + ".label required");
      if (!isNonNegNumber(preset.price)) fail(errors, p + ".price invalid");
    });
  }

  function validateQuantityItem(item, path, errors) {
    if (!isObject(item)) return fail(errors, path + " must be an object");
    if (typeof item.id !== "string" || !item.id) fail(errors, path + ".id required");
    if (typeof item.label !== "string" || !item.label.trim()) fail(errors, path + ".label required");
    if (!isNonNegNumber(item.price)) fail(errors, path + ".price invalid");
    if (!isNonNegInt(item.defaultQuantity)) fail(errors, path + ".defaultQuantity invalid");
  }

  function validateRecord(record, dateKey, errors) {
    var path = "records[" + dateKey + "]";
    if (!isObject(record)) return fail(errors, path + " must be an object");
    if (!isObject(record.toggles)) fail(errors, path + ".toggles must be an object");
    if (!isObject(record.presets)) fail(errors, path + ".presets must be an object");
    if (!isObject(record.quantities)) fail(errors, path + ".quantities must be an object");

    Object.keys(record.toggles || {}).forEach(function (id) {
      var entry = record.toggles[id];
      var p = path + ".toggles." + id;
      if (!isObject(entry)) return fail(errors, p + " must be an object");
      if (typeof entry.eaten !== "boolean") fail(errors, p + ".eaten must be boolean");
      if (!isNonNegNumber(entry.price)) fail(errors, p + ".price invalid");
    });

    Object.keys(record.presets || {}).forEach(function (id) {
      var entry = record.presets[id];
      var p = path + ".presets." + id;
      if (!isObject(entry)) return fail(errors, p + " must be an object");
      if (typeof entry.eaten !== "boolean") fail(errors, p + ".eaten must be boolean");
      if (typeof entry.item !== "string") fail(errors, p + ".item must be string");
      if (!isNonNegNumber(entry.price)) fail(errors, p + ".price invalid");
    });

    Object.keys(record.quantities || {}).forEach(function (id) {
      var entry = record.quantities[id];
      var p = path + ".quantities." + id;
      if (!isObject(entry)) return fail(errors, p + " must be an object");
      if (!isNonNegInt(entry.qty)) fail(errors, p + ".qty invalid");
      if (!isNonNegNumber(entry.price)) fail(errors, p + ".price invalid");
    });
  }

  function validateBackup(data) {
    var errors = [];
    if (!isObject(data)) return { ok: false, errors: ["Backup must be a JSON object."] };

    if (data.schemaVersion !== SUPPORTED_SCHEMA) {
      fail(
        errors,
        "Unsupported schemaVersion. Expected " +
          SUPPORTED_SCHEMA +
          ", got " +
          String(data.schemaVersion)
      );
    }

    if (!isObject(data.settings)) {
      fail(errors, "settings must be an object");
    } else {
      if (!Array.isArray(data.settings.toggleMeals)) fail(errors, "settings.toggleMeals must be an array");
      else data.settings.toggleMeals.forEach(function (m, i) {
        validateToggleMeal(m, "settings.toggleMeals[" + i + "]", errors);
      });

      if (!Array.isArray(data.settings.presetMeals)) fail(errors, "settings.presetMeals must be an array");
      else data.settings.presetMeals.forEach(function (m, i) {
        validatePresetMeal(m, "settings.presetMeals[" + i + "]", errors);
      });

      if (!Array.isArray(data.settings.quantityItems)) fail(errors, "settings.quantityItems must be an array");
      else data.settings.quantityItems.forEach(function (m, i) {
        validateQuantityItem(m, "settings.quantityItems[" + i + "]", errors);
      });
    }

    if (!isObject(data.records)) fail(errors, "records must be an object");
    else {
      Object.keys(data.records).forEach(function (dateKey) {
        if (!ISO_DATE_RE.test(dateKey)) fail(errors, "Invalid record date key: " + dateKey);
        else validateRecord(data.records[dateKey], dateKey, errors);
      });
    }

    if (data.monthSnapshots !== undefined && !isObject(data.monthSnapshots)) {
      fail(errors, "monthSnapshots must be an object");
    }
    if (data.meta !== undefined && !isObject(data.meta)) {
      fail(errors, "meta must be an object");
    }

    return { ok: errors.length === 0, errors: errors };
  }

  function buildExportPayload(state) {
    return {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      records: state.records,
      monthSnapshots: state.monthSnapshots || {},
      meta: state.meta || {},
    };
  }

  function backupFileName(state) {
    var stamp = new Date().toISOString().slice(0, 10);
    var bsLabel = "";
    try {
      if (global.CanteenNepali && state.meta && state.meta.selectedDateIso) {
        var bs = global.CanteenNepali.adToBs(state.meta.selectedDateIso);
        bsLabel = "-" + bs.year + "-" + String(bs.month).padStart(2, "0");
      }
    } catch (err) {}
    return "canteen-tracker-backup" + bsLabel + "-" + stamp + ".json";
  }

  function downloadBackup(state) {
    var payload = buildExportPayload(state);
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(state);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return payload;
  }

  function parseBackupText(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { ok: false, errors: ["File is not valid JSON."], data: null };
    }
    var result = validateBackup(data);
    return { ok: result.ok, errors: result.errors, data: result.ok ? data : null };
  }

  global.CanteenBackup = {
    SUPPORTED_SCHEMA: SUPPORTED_SCHEMA,
    validateBackup: validateBackup,
    buildExportPayload: buildExportPayload,
    downloadBackup: downloadBackup,
    parseBackupText: parseBackupText,
  };
})(window);
