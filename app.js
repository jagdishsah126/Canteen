(function () {
  "use strict";

  var screens = {
    home: document.getElementById("home"),
    monthly: document.getElementById("monthly"),
    settings: document.getElementById("settings"),
  };

  var navButtons = Array.prototype.slice.call(
    document.querySelectorAll(".nav-btn[data-screen]")
  );

  var expandedDayIso = null;

  var els = {
    storageStatus: document.getElementById("storage-status"),
    homeDateTitle: document.getElementById("home-date-title"),
    homeDateSub: document.getElementById("home-date-sub"),
    homeMonthLabel: document.getElementById("home-month-label"),
    homeTodayChip: document.getElementById("home-today-chip"),
    homeTotal: document.getElementById("home-total"),
    homeStatusLive: document.getElementById("home-status-live"),
    mealList: document.getElementById("meal-list"),
    monthlyMonthLabel: document.getElementById("monthly-month-label"),
    monthlySummaryCopy: document.getElementById("monthly-summary-copy"),
    monthlyWarning: document.getElementById("monthly-warning"),
    monthlyTotal: document.getElementById("monthly-total"),
    monthlyRecorded: document.getElementById("monthly-recorded"),
    monthlyBreakdown: document.getElementById("monthly-breakdown"),
    monthlyDayList: document.getElementById("monthly-day-list"),
    monthlyEmptyNote: document.getElementById("monthly-empty-note"),
    monthlySnapshotNote: document.getElementById("monthly-snapshot-note"),
    btnMonthlyPrev: document.getElementById("btn-monthly-prev"),
    btnMonthlyNext: document.getElementById("btn-monthly-next"),
    btnCloseMonth: document.getElementById("btn-close-month"),
    settingsSchema: document.getElementById("settings-schema"),
    settingsPresets: document.getElementById("settings-presets"),
    settingsRecordCount: document.getElementById("settings-record-count"),
    settingsOfflineNote: document.getElementById("settings-offline-note"),
    settingsToggleList: document.getElementById("settings-toggle-list"),
    settingsPresetMealList: document.getElementById("settings-preset-meal-list"),
    settingsQtyList: document.getElementById("settings-qty-list"),
    settingsToggleNote: document.getElementById("settings-toggle-note"),
    settingsPresetMealNote: document.getElementById("settings-presetmeal-note"),
    settingsQtyNote: document.getElementById("settings-qty-note"),
    settingsBackupNote: document.getElementById("settings-backup-note"),
    settingsClearNote: document.getElementById("settings-clear-note"),
    btnAddToggle: document.getElementById("btn-add-toggle"),
    btnAddPresetMeal: document.getElementById("btn-add-presetmeal"),
    btnAddQty: document.getElementById("btn-add-qty"),
    inputNewToggleLabel: document.getElementById("input-new-toggle-label"),
    inputNewTogglePrice: document.getElementById("input-new-toggle-price"),
    inputNewToggleDefault: document.getElementById("input-new-toggle-default"),
    inputNewPresetMealLabel: document.getElementById("input-new-presetmeal-label"),
    inputNewPresetMealDefault: document.getElementById("input-new-presetmeal-default"),
    inputNewPresetMealItem: document.getElementById("input-new-presetmeal-item"),
    inputNewPresetMealPrice: document.getElementById("input-new-presetmeal-price"),
    inputNewQtyLabel: document.getElementById("input-new-qty-label"),
    inputNewQtyPrice: document.getElementById("input-new-qty-price"),
    inputNewQtyDefault: document.getElementById("input-new-qty-default"),
    btnExportBackup: document.getElementById("btn-export-backup"),
    btnImportBackup: document.getElementById("btn-import-backup"),
    inputImportBackup: document.getElementById("input-import-backup"),
    btnClearAll: document.getElementById("btn-clear-all"),
    btnPrevDay: document.getElementById("btn-prev-day"),
    btnNextDay: document.getElementById("btn-next-day"),
    btnToday: document.getElementById("btn-today"),
    btnPrevMonth: document.getElementById("btn-prev-month"),
    btnNextMonth: document.getElementById("btn-next-month"),
  };

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      var section = screens[key];
      var active = key === name;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });

    navButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-screen") === name;
      btn.classList.toggle("is-active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });

    if (name === "settings") renderSettings();
    if (name === "monthly") {
      ensureMonthlyMonthFromSelectedDay();
      renderMonthly();
    }
  }

  function statusLine(monthLabel) {
    var online = typeof navigator === "undefined" || navigator.onLine !== false;
    return online
      ? "Saved locally · " + monthLabel
      : "Offline · saved on this device · " + monthLabel;
  }

  function ensureMonthlyMonthFromSelectedDay() {
    var selected = CanteenStore.getSelectedBsMonth();
    if (selected) return selected;
    var bs = CanteenNepali.adToBs(CanteenStore.getSelectedDate());
    return CanteenStore.setSelectedBsMonth(bs.year, bs.month);
  }

  function getMonthlySummary() {
    var month = ensureMonthlyMonthFromSelectedDay();
    var settings = CanteenStore.getState().settings;
    var days = CanteenNepali.listBsMonthDays(month.year, month.month);
    var entries = days.map(function (day) {
      return {
        iso: day.iso,
        bsDay: day.day,
        label: day.label,
        record: CanteenStore.getRecord(day.iso),
      };
    });
    return {
      month: month,
      label: CanteenNepali.monthName(month.month) + " " + month.year,
      summary: CanteenBilling.calcMonth(entries, settings),
    };
  }

  function renderHome() {
    var iso = CanteenStore.getSelectedDate();
    var today = CanteenStore.todayIso();
    var settings = CanteenStore.getState().settings;
    var record = CanteenStore.getOrCreateRecord(iso);
    var bill = CanteenBilling.calcDay(record, settings);
    var bsView = CanteenNepali.formatBsFull(iso);

    els.homeDateTitle.textContent = bsView.title;
    els.homeDateSub.textContent = bsView.subtitle;
    els.homeMonthLabel.textContent = bsView.monthLabel;
    els.homeTodayChip.hidden = iso !== today;
    els.homeTotal.textContent = CanteenBilling.formatRs(bill.total);
    els.storageStatus.textContent = statusLine(bsView.monthLabel);
    if (els.homeStatusLive) {
      els.homeStatusLive.textContent = "Day total " + CanteenBilling.formatRs(bill.total);
    }

    els.mealList.innerHTML = "";

    settings.toggleMeals.forEach(function (meal) {
      var entry = record.toggles[meal.id] || { eaten: false, price: meal.price };
      var row = document.createElement("div");
      row.className = "meal-row";
      var id = "toggle-" + meal.id;
      row.innerHTML =
        '<div class="meal-row-main"><label class="meal-check" for="' +
        id +
        '"><input type="checkbox" id="' +
        id +
        '" /><span class="meal-check-ui" aria-hidden="true"></span><span class="meal-text"><span class="meal-name"></span><span class="meal-meta"></span></span></label></div>';
      row.querySelector(".meal-name").textContent = meal.label;
      row.querySelector(".meal-meta").textContent = entry.eaten
        ? CanteenBilling.formatRs(entry.price)
        : "Not eaten · Rs. 0";
      var input = row.querySelector("input");
      input.checked = !!entry.eaten;
      input.addEventListener("change", function () {
        CanteenStore.toggleMeal(null, meal.id);
        renderHome();
      });
      els.mealList.appendChild(row);
    });

    settings.presetMeals.forEach(function (meal) {
      var entry = record.presets[meal.id] || { eaten: false, item: "", price: 0 };
      var incomplete = CanteenBilling.isPresetIncomplete(entry);
      var row = document.createElement("div");
      row.className = "meal-row";
      var id = "preset-" + meal.id;

      var main = document.createElement("div");
      main.className = "meal-row-main";
      main.innerHTML =
        '<label class="meal-check" for="' +
        id +
        '"><input type="checkbox" id="' +
        id +
        '" /><span class="meal-check-ui" aria-hidden="true"></span><span class="meal-text"><span class="meal-name"></span><span class="meal-meta"></span></span></label>';
      main.querySelector(".meal-name").textContent = meal.label;
      var meta = main.querySelector(".meal-meta");
      if (!entry.eaten) meta.textContent = "Not eaten · Rs. 0";
      else if (incomplete) meta.textContent = "⚠ Select item";
      else meta.textContent = entry.item + " · " + CanteenBilling.formatRs(entry.price);

      var checkbox = main.querySelector("input");
      checkbox.checked = !!entry.eaten;
      checkbox.addEventListener("change", function () {
        CanteenStore.togglePresetMeal(null, meal.id);
        renderHome();
      });
      row.appendChild(main);

      var warning = document.createElement("p");
      warning.className = "meal-warning";
      warning.setAttribute("role", "status");

      if (entry.eaten) {
        var panel = document.createElement("div");
        panel.className = "breakfast-panel";
        var label = document.createElement("p");
        label.className = "breakfast-panel-label";
        label.textContent = "What did you eat?";
        panel.appendChild(label);

        var chips = document.createElement("div");
        chips.className = "preset-chips";
        chips.setAttribute("role", "group");
        (meal.presets || []).forEach(function (preset) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "preset-chip";
          btn.textContent = preset.label + " · Rs. " + preset.price;
          if (entry.item === preset.label && Number(entry.price) === Number(preset.price)) {
            btn.classList.add("is-selected");
          }
          btn.addEventListener("click", function () {
            CanteenStore.applyPresetOption(null, meal.id, preset.id);
            renderHome();
          });
          chips.appendChild(btn);
        });
        panel.appendChild(chips);

        var custom = document.createElement("div");
        custom.className = "custom-breakfast";
        custom.innerHTML =
          '<label class="field"><span class="field-label">Custom item</span><input type="text" class="field-input js-custom-item" placeholder="e.g. Samosa" /></label>' +
          '<label class="field"><span class="field-label">Price (Rs.)</span><input type="number" class="field-input js-custom-price" min="0" step="1" placeholder="0" /></label>' +
          '<button type="button" class="btn btn-secondary btn-compact js-custom-apply">Use custom</button>';
        var itemInput = custom.querySelector(".js-custom-item");
        var priceInput = custom.querySelector(".js-custom-price");
        itemInput.value = entry.item || "";
        priceInput.value = entry.price > 0 ? String(entry.price) : "";
        function applyCustom() {
          var item = itemInput.value.trim();
          var price = Number(priceInput.value);
          if (!item || !Number.isFinite(price) || price <= 0) {
            warning.hidden = false;
            warning.textContent = "⚠ Enter item name and valid price";
            return;
          }
          CanteenStore.setPresetMeal(null, meal.id, item, price);
          renderHome();
        }
        custom.querySelector(".js-custom-apply").addEventListener("click", applyCustom);
        itemInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            applyCustom();
          }
        });
        priceInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            applyCustom();
          }
        });
        panel.appendChild(custom);
        row.appendChild(panel);
      }

      if (entry.eaten && incomplete) {
        warning.hidden = false;
        warning.textContent = "⚠ Select " + meal.label.toLowerCase() + " item and price";
      } else {
        warning.hidden = true;
      }
      row.appendChild(warning);
      els.mealList.appendChild(row);
    });

    settings.quantityItems.forEach(function (item) {
      var entry = record.quantities[item.id] || { qty: 0, price: item.price };
      var row = document.createElement("div");
      row.className = "meal-row meal-row-qty";
      row.innerHTML =
        '<div class="meal-text"><span class="meal-name"></span><span class="meal-meta"></span></div>' +
        '<div class="qty-control">' +
        '<button type="button" class="qty-btn js-dec" aria-label="Decrease">−</button>' +
        '<input class="qty-input js-qty" type="number" inputmode="numeric" min="0" step="1" />' +
        '<button type="button" class="qty-btn js-inc" aria-label="Increase">+</button>' +
        "</div>";
      row.querySelector(".meal-name").textContent = item.label;
      row.querySelector(".meal-meta").textContent =
        entry.qty + " × Rs. " + entry.price + " = " + CanteenBilling.formatRs(entry.qty * entry.price);
      var qtyInput = row.querySelector(".js-qty");
      qtyInput.value = String(entry.qty);
      qtyInput.setAttribute("aria-label", item.label + " quantity");
      row.querySelector(".js-dec").setAttribute("aria-label", "Decrease " + item.label);
      row.querySelector(".js-inc").setAttribute("aria-label", "Increase " + item.label);
      row.querySelector(".js-dec").addEventListener("click", function () {
        CanteenStore.decrementQuantity(null, item.id);
        renderHome();
      });
      row.querySelector(".js-inc").addEventListener("click", function () {
        CanteenStore.incrementQuantity(null, item.id);
        renderHome();
      });
      qtyInput.addEventListener("change", function () {
        CanteenStore.setQuantity(null, item.id, qtyInput.value);
        renderHome();
      });
      els.mealList.appendChild(row);
    });
  }

  function addBreakdownRow(title, detail, amount) {
    var row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = "<div><strong></strong><span></span></div><div class='breakdown-amount'></div>";
    row.querySelector("strong").textContent = title;
    row.querySelector("span").textContent = detail;
    row.querySelector(".breakdown-amount").textContent = amount;
    els.monthlyBreakdown.appendChild(row);
  }

  function renderMonthly() {
    var packed = getMonthlySummary();
    var summary = packed.summary;
    var snapshot = CanteenStore.getMonthSnapshot(packed.month.year, packed.month.month);

    els.monthlyMonthLabel.textContent = packed.label;
    els.monthlySummaryCopy.textContent =
      summary.daysInMonth + " days in " + packed.label + ". Only recorded days count toward the bill.";
    els.monthlyTotal.textContent = CanteenBilling.formatRs(summary.total);
    els.monthlyRecorded.textContent =
      summary.recordedDays + " day" + (summary.recordedDays === 1 ? "" : "s") + " recorded";

    if (summary.incompletePresetDays > 0) {
      els.monthlyWarning.hidden = false;
      els.monthlyWarning.textContent =
        "⚠ " +
        summary.incompletePresetDays +
        " day" +
        (summary.incompletePresetDays === 1 ? "" : "s") +
        " have incomplete preset-meal information.";
    } else {
      els.monthlyWarning.hidden = true;
      els.monthlyWarning.textContent = "";
    }

    els.monthlyBreakdown.innerHTML = "";
    Object.keys(summary.categoryTotals).forEach(function (id) {
      var cat = summary.categoryTotals[id];
      var detail =
        cat.type === "quantity"
          ? cat.count + " pieces"
          : cat.count + " days";
      addBreakdownRow(cat.label, detail, CanteenBilling.formatRs(cat.cost));
    });

    els.monthlyDayList.innerHTML = "";
    els.monthlyEmptyNote.hidden = summary.days.length > 0;

    summary.days.forEach(function (day) {
      var item = document.createElement("div");
      item.className = "day-item";
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "day-item-toggle";
      toggle.setAttribute("aria-expanded", day.iso === expandedDayIso ? "true" : "false");
      var left = document.createElement("span");
      left.textContent = day.label;
      var right = document.createElement("span");
      right.className = "day-item-meta";
      if (day.incomplete) {
        right.classList.add("is-warn");
        right.textContent = "Incomplete";
      } else {
        right.textContent = CanteenBilling.formatRs(day.bill.total);
      }
      toggle.appendChild(left);
      toggle.appendChild(right);
      item.appendChild(toggle);

      if (day.iso === expandedDayIso) {
        var body = document.createElement("div");
        body.className = "day-item-body";
        day.bill.categories.forEach(function (cat) {
          var p = document.createElement("p");
          p.textContent = cat.label + ": " + cat.detail + " · " + CanteenBilling.formatRs(cat.cost);
          body.appendChild(p);
        });
        var total = document.createElement("p");
        total.className = "day-total";
        total.textContent = "Daily total: " + CanteenBilling.formatRs(day.bill.total);
        body.appendChild(total);
        var openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "btn btn-secondary btn-compact btn-linkish";
        openBtn.textContent = "Open this day";
        openBtn.addEventListener("click", function () {
          CanteenStore.setSelectedDate(day.iso);
          showScreen("home");
          renderHome();
        });
        body.appendChild(openBtn);
        item.appendChild(body);
      }

      toggle.addEventListener("click", function () {
        expandedDayIso = expandedDayIso === day.iso ? null : day.iso;
        renderMonthly();
      });
      els.monthlyDayList.appendChild(item);
    });

    if (snapshot) {
      var differs = Number(snapshot.total) !== Number(summary.total);
      els.monthlySnapshotNote.textContent =
        "Closed on " +
        new Date(snapshot.closedAt).toLocaleString() +
        " at " +
        CanteenBilling.formatRs(snapshot.total) +
        (differs
          ? ". Current calculation differs from the saved snapshot."
          : ". Current calculation matches the snapshot.");
    } else {
      els.monthlySnapshotNote.textContent =
        "Save a snapshot of this month's bill without locking edits.";
    }
  }

  function renderShellMeta() {
    var state = CanteenStore.getState();
    var presetCount = state.settings.presetMeals.reduce(function (sum, meal) {
      return sum + (meal.presets ? meal.presets.length : 0);
    }, 0);
    els.settingsSchema.textContent = String(state.schemaVersion);
    els.settingsPresets.textContent = String(presetCount);
    els.settingsRecordCount.textContent = String(CanteenStore.getRecordCount());
    if (els.settingsOfflineNote) {
      var swReady = "serviceWorker" in navigator && navigator.serviceWorker.controller;
      els.settingsOfflineNote.textContent = swReady
        ? "Service worker active. After the first online load, core tracking works offline."
        : "Open over http://localhost (or HTTPS), reload once so the service worker can install.";
    }
  }

  function renderSettings() {
    renderShellMeta();
    var settings = CanteenStore.getState().settings;

    els.settingsToggleList.innerHTML = "";
    settings.toggleMeals.forEach(function (meal) {
      var card = document.createElement("div");
      card.className = "settings-card";
      card.innerHTML =
        '<label class="field"><span class="field-label">Name</span><input type="text" class="field-input js-label" /></label>' +
        '<label class="field"><span class="field-label">Price (Rs.)</span><input type="number" class="field-input js-price" min="0" step="1" /></label>' +
        '<label class="check-inline"><input type="checkbox" class="js-default" /><span>Default eaten</span></label>' +
        '<div class="settings-card-actions"><button type="button" class="btn btn-secondary btn-compact js-save">Save</button><button type="button" class="btn btn-secondary btn-compact btn-danger-soft js-del">Remove</button></div>';
      card.querySelector(".js-label").value = meal.label;
      card.querySelector(".js-price").value = String(meal.price);
      card.querySelector(".js-default").checked = !!meal.defaultEaten;
      card.querySelector(".js-save").addEventListener("click", function () {
        try {
          CanteenStore.updateToggleMeal(
            meal.id,
            card.querySelector(".js-label").value,
            card.querySelector(".js-price").value,
            card.querySelector(".js-default").checked
          );
          els.settingsToggleNote.textContent = "Saved. New days use these defaults; old days keep saved prices.";
          renderSettings();
          renderHome();
        } catch (err) {
          els.settingsToggleNote.textContent = err.message;
        }
      });
      card.querySelector(".js-del").addEventListener("click", function () {
        if (!window.confirm('Remove "' + meal.label + '"? Existing day values stay in old records.')) return;
        CanteenStore.deleteToggleMeal(meal.id);
        els.settingsToggleNote.textContent = "Removed " + meal.label + ".";
        renderSettings();
        renderHome();
      });
      els.settingsToggleList.appendChild(card);
    });

    els.settingsPresetMealList.innerHTML = "";
    settings.presetMeals.forEach(function (meal) {
      var card = document.createElement("div");
      card.className = "settings-card";

      var header = document.createElement("div");
      header.innerHTML =
        '<label class="field"><span class="field-label">Name</span><input type="text" class="field-input js-label" /></label>' +
        '<label class="check-inline"><input type="checkbox" class="js-default" /><span>Default eaten</span></label>' +
        '<label class="field"><span class="field-label">Default preset</span><select class="field-input js-default-preset"></select></label>' +
        '<label class="field"><span class="field-label">Or default custom item</span><input type="text" class="field-input js-default-item" /></label>' +
        '<label class="field"><span class="field-label">Default custom price</span><input type="number" class="field-input js-default-price" min="0" step="1" /></label>' +
        '<div class="settings-card-actions"><button type="button" class="btn btn-secondary btn-compact js-save-meal">Save meal</button><button type="button" class="btn btn-secondary btn-compact btn-danger-soft js-del-meal">Remove meal</button></div>';
      header.querySelector(".js-label").value = meal.label;
      header.querySelector(".js-default").checked = !!meal.defaultEaten;
      header.querySelector(".js-default-item").value = meal.defaultItem || "";
      header.querySelector(".js-default-price").value = String(meal.defaultPrice || 0);
      var select = header.querySelector(".js-default-preset");
      var none = document.createElement("option");
      none.value = "";
      none.textContent = "None";
      select.appendChild(none);
      (meal.presets || []).forEach(function (preset) {
        var opt = document.createElement("option");
        opt.value = preset.id;
        opt.textContent = preset.label + " (Rs. " + preset.price + ")";
        if (meal.defaultPresetId === preset.id) opt.selected = true;
        select.appendChild(opt);
      });
      header.querySelector(".js-save-meal").addEventListener("click", function () {
        try {
          CanteenStore.updatePresetMeal(meal.id, {
            label: header.querySelector(".js-label").value,
            defaultEaten: header.querySelector(".js-default").checked,
            defaultPresetId: select.value,
            defaultItem: header.querySelector(".js-default-item").value,
            defaultPrice: header.querySelector(".js-default-price").value,
          });
          els.settingsPresetMealNote.textContent = "Saved meal defaults.";
          renderSettings();
          renderHome();
        } catch (err) {
          els.settingsPresetMealNote.textContent = err.message;
        }
      });
      header.querySelector(".js-del-meal").addEventListener("click", function () {
        if (!window.confirm('Remove "' + meal.label + '" and its presets?')) return;
        CanteenStore.deletePresetMeal(meal.id);
        els.settingsPresetMealNote.textContent = "Removed " + meal.label + ".";
        renderSettings();
        renderHome();
      });
      card.appendChild(header);

      var nested = document.createElement("div");
      nested.className = "nested-presets";
      var nestedLabel = document.createElement("p");
      nestedLabel.className = "panel-label";
      nestedLabel.textContent = "Presets";
      nested.appendChild(nestedLabel);

      (meal.presets || []).forEach(function (preset) {
        var row = document.createElement("div");
        row.className = "nested-preset-row";
        row.innerHTML =
          '<input type="text" class="field-input js-plabel" />' +
          '<input type="number" class="field-input js-pprice" min="0" step="1" />' +
          '<button type="button" class="btn btn-secondary btn-compact js-psave">Save</button>' +
          '<button type="button" class="btn btn-secondary btn-compact btn-danger-soft js-pdel">Del</button>';
        row.querySelector(".js-plabel").value = preset.label;
        row.querySelector(".js-pprice").value = String(preset.price);
        row.querySelector(".js-psave").addEventListener("click", function () {
          try {
            CanteenStore.updatePresetOption(
              meal.id,
              preset.id,
              row.querySelector(".js-plabel").value,
              row.querySelector(".js-pprice").value
            );
            els.settingsPresetMealNote.textContent = "Preset updated. Old days keep saved prices.";
            renderSettings();
            renderHome();
          } catch (err) {
            els.settingsPresetMealNote.textContent = err.message;
          }
        });
        row.querySelector(".js-pdel").addEventListener("click", function () {
          CanteenStore.deletePresetOption(meal.id, preset.id);
          renderSettings();
          renderHome();
        });
        nested.appendChild(row);
      });

      var addRow = document.createElement("div");
      addRow.className = "nested-preset-row";
      addRow.innerHTML =
        '<input type="text" class="field-input js-new-plabel" placeholder="New preset" />' +
        '<input type="number" class="field-input js-new-pprice" min="0" step="1" placeholder="Price" />' +
        '<button type="button" class="btn btn-secondary btn-compact js-new-padd" style="grid-column: span 2;">+ Add preset</button>';
      addRow.querySelector(".js-new-padd").addEventListener("click", function () {
        try {
          CanteenStore.addPresetOption(
            meal.id,
            addRow.querySelector(".js-new-plabel").value,
            addRow.querySelector(".js-new-pprice").value
          );
          renderSettings();
          renderHome();
        } catch (err) {
          els.settingsPresetMealNote.textContent = err.message;
        }
      });
      nested.appendChild(addRow);
      card.appendChild(nested);
      els.settingsPresetMealList.appendChild(card);
    });

    els.settingsQtyList.innerHTML = "";
    settings.quantityItems.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "settings-card";
      card.innerHTML =
        '<label class="field"><span class="field-label">Name</span><input type="text" class="field-input js-label" /></label>' +
        '<label class="field"><span class="field-label">Price / piece</span><input type="number" class="field-input js-price" min="0" step="1" /></label>' +
        '<label class="field"><span class="field-label">Default qty</span><input type="number" class="field-input js-default" min="0" step="1" /></label>' +
        '<div class="settings-card-actions"><button type="button" class="btn btn-secondary btn-compact js-save">Save</button><button type="button" class="btn btn-secondary btn-compact btn-danger-soft js-del">Remove</button></div>';
      card.querySelector(".js-label").value = item.label;
      card.querySelector(".js-price").value = String(item.price);
      card.querySelector(".js-default").value = String(item.defaultQuantity);
      card.querySelector(".js-save").addEventListener("click", function () {
        try {
          CanteenStore.updateQuantityItem(
            item.id,
            card.querySelector(".js-label").value,
            card.querySelector(".js-price").value,
            card.querySelector(".js-default").value
          );
          els.settingsQtyNote.textContent = "Saved. New days use these defaults.";
          renderSettings();
          renderHome();
        } catch (err) {
          els.settingsQtyNote.textContent = err.message;
        }
      });
      card.querySelector(".js-del").addEventListener("click", function () {
        if (!window.confirm('Remove "' + item.label + '"?')) return;
        CanteenStore.deleteQuantityItem(item.id);
        renderSettings();
        renderHome();
      });
      els.settingsQtyList.appendChild(card);
    });
  }

  function initNav() {
    navButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        showScreen(btn.getAttribute("data-screen"));
      });
    });
  }

  function initDateNav() {
    els.btnPrevDay.addEventListener("click", function () {
      CanteenStore.setSelectedDate(CanteenStore.shiftIso(CanteenStore.getSelectedDate(), -1));
      renderHome();
    });
    els.btnNextDay.addEventListener("click", function () {
      CanteenStore.setSelectedDate(CanteenStore.shiftIso(CanteenStore.getSelectedDate(), 1));
      renderHome();
    });
    els.btnToday.addEventListener("click", function () {
      CanteenStore.setSelectedDate(CanteenStore.todayIso());
      renderHome();
    });
    els.btnPrevMonth.addEventListener("click", function () {
      CanteenStore.setSelectedDate(CanteenNepali.shiftBsMonth(CanteenStore.getSelectedDate(), -1));
      renderHome();
    });
    els.btnNextMonth.addEventListener("click", function () {
      CanteenStore.setSelectedDate(CanteenNepali.shiftBsMonth(CanteenStore.getSelectedDate(), 1));
      renderHome();
    });
  }

  function initMonthlyControls() {
    els.btnMonthlyPrev.addEventListener("click", function () {
      var current = ensureMonthlyMonthFromSelectedDay();
      var next = CanteenNepali.shiftBsYearMonth(current.year, current.month, -1);
      CanteenStore.setSelectedBsMonth(next.year, next.month);
      expandedDayIso = null;
      renderMonthly();
    });
    els.btnMonthlyNext.addEventListener("click", function () {
      var current = ensureMonthlyMonthFromSelectedDay();
      var next = CanteenNepali.shiftBsYearMonth(current.year, current.month, 1);
      CanteenStore.setSelectedBsMonth(next.year, next.month);
      expandedDayIso = null;
      renderMonthly();
    });
    els.btnCloseMonth.addEventListener("click", function () {
      var packed = getMonthlySummary();
      if (packed.summary.recordedDays === 0) {
        els.monthlySnapshotNote.textContent = "Nothing to close — no recorded days in this month.";
        return;
      }
      CanteenStore.closeMonth(packed.month.year, packed.month.month, packed.summary);
      renderMonthly();
    });
  }

  function initSettingsControls() {
    els.btnAddToggle.addEventListener("click", function () {
      try {
        CanteenStore.addToggleMeal(
          els.inputNewToggleLabel.value,
          els.inputNewTogglePrice.value,
          els.inputNewToggleDefault.checked
        );
        els.inputNewToggleLabel.value = "";
        els.inputNewTogglePrice.value = "";
        els.inputNewToggleDefault.checked = true;
        els.settingsToggleNote.textContent = "Toggle meal added.";
        renderSettings();
        renderHome();
      } catch (err) {
        els.settingsToggleNote.textContent = err.message;
      }
    });

    els.btnAddPresetMeal.addEventListener("click", function () {
      try {
        CanteenStore.addPresetMeal(
          els.inputNewPresetMealLabel.value,
          els.inputNewPresetMealDefault.checked,
          els.inputNewPresetMealItem.value,
          els.inputNewPresetMealPrice.value
        );
        els.inputNewPresetMealLabel.value = "";
        els.inputNewPresetMealItem.value = "";
        els.inputNewPresetMealPrice.value = "";
        els.inputNewPresetMealDefault.checked = true;
        els.settingsPresetMealNote.textContent = "Preset meal added. Add presets under it.";
        renderSettings();
        renderHome();
      } catch (err) {
        els.settingsPresetMealNote.textContent = err.message;
      }
    });

    els.btnAddQty.addEventListener("click", function () {
      try {
        CanteenStore.addQuantityItem(
          els.inputNewQtyLabel.value,
          els.inputNewQtyPrice.value,
          els.inputNewQtyDefault.value
        );
        els.inputNewQtyLabel.value = "";
        els.inputNewQtyPrice.value = "";
        els.inputNewQtyDefault.value = "0";
        els.settingsQtyNote.textContent = "Quantity item added.";
        renderSettings();
        renderHome();
      } catch (err) {
        els.settingsQtyNote.textContent = err.message;
      }
    });

    els.btnExportBackup.addEventListener("click", function () {
      CanteenBackup.downloadBackup(CanteenStore.getState());
      els.settingsBackupNote.textContent = "Backup downloaded.";
    });

    els.btnImportBackup.addEventListener("click", function () {
      els.inputImportBackup.value = "";
      els.inputImportBackup.click();
    });

    els.inputImportBackup.addEventListener("change", function () {
      var file = els.inputImportBackup.files && els.inputImportBackup.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = CanteenBackup.parseBackupText(String(reader.result || ""));
        if (!parsed.ok) {
          els.settingsBackupNote.textContent = "Import blocked: " + parsed.errors[0];
          return;
        }
        if (!window.confirm("This will replace the current local data.\n\nOK to import?")) {
          els.settingsBackupNote.textContent = "Import cancelled.";
          return;
        }
        CanteenStore.replaceState(parsed.data);
        els.settingsBackupNote.textContent =
          "Backup imported. " + CanteenStore.getRecordCount() + " record(s) restored.";
        renderSettings();
        renderHome();
      };
      reader.readAsText(file);
    });

    els.btnClearAll.addEventListener("click", function () {
      if (!window.confirm("This will permanently remove all local data.\n\nContinue?")) return;
      if (!window.confirm("Final confirmation: delete everything?")) return;
      CanteenStore.clearAllData();
      expandedDayIso = null;
      els.settingsClearNote.textContent = "All local data deleted.";
      renderSettings();
      renderHome();
    });
  }

  function initConnectivity() {
    window.addEventListener("online", function () {
      renderHome();
      if (!screens.settings.hidden) renderShellMeta();
    });
    window.addEventListener("offline", function () {
      renderHome();
      if (!screens.settings.hidden) renderShellMeta();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function (err) {
        console.warn("Service worker registration failed.", err);
      });
    });
  }

  function init() {
    CanteenStore.load();
    CanteenStore.touchLastOpened();
    if (!CanteenStore.getState().meta.selectedDateIso) {
      CanteenStore.setSelectedDate(CanteenStore.todayIso());
    }
    initNav();
    initDateNav();
    initMonthlyControls();
    initSettingsControls();
    initConnectivity();
    registerServiceWorker();
    showScreen("home");
    renderHome();
    renderShellMeta();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
