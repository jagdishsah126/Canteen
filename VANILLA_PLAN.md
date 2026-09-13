# Canteen Tracker PWA — Vanilla JS Build Plan

No frameworks. No React, Vite, Tailwind, or Zustand.

Stack:

- `index.html` — structure + pages (sections)
- `style.css` — mobile-first styles
- `app.js` — UI + app logic
- `store.js` — data + localStorage
- `billing.js` — pure cost calculations
- `nepaliDate.js` — BS calendar helpers
- `backup.js` — export / import / validation
- `sw.js` + `manifest.json` — PWA / offline (later)

Core rule stays the same:

> Daily record is the source of truth. Settings only set defaults for new days. Totals are always calculated, never stored as truth.

---

## File layout

```text
/
├── index.html
├── style.css
├── app.js
├── store.js
├── billing.js
├── nepaliDate.js
├── backup.js
├── sw.js
├── manifest.json
└── icons/          (phase 7)
```

One HTML file. Switch screens with show/hide sections (`#home`, `#monthly`, `#settings`). No router library.

---

## Data model (unchanged)

Internal key = Gregorian ISO (`"2026-09-12"`). UI shows Bikram Sambat.

```js
{
  schemaVersion: 1,
  settings: {
    items: {
      morningFood: { label: "Morning Food", price: 72, defaultEaten: true },
      dinner:      { label: "Dinner",       price: 72, defaultEaten: true },
      masu:        { label: "Masu",         price: 75, defaultQuantity: 0 },
      omelette:    { label: "Omelette",     price: 30, defaultQuantity: 0 }
    },
    breakfast: { label: "Breakfast", defaultEaten: true }
  },
  breakfastPresets: [
    { id: "chowmein", label: "Chowmein", price: 50 },
    { id: "momo", label: "Momo", price: 100 },
    { id: "tea", label: "Tea", price: 20 }
  ],
  records: {
    "2026-09-12": {
      morningFood: true,
      breakfast: { eaten: true, item: "Chowmein", price: 50 },
      dinner: true,
      masu: 0,
      omelette: 2,
      // Snapshot prices used when the day was created/edited
      morningFoodPrice: 72,
      dinnerPrice: 72,
      masuPrice: 75,
      omelettePrice: 30
    }
  },
  monthSnapshots: {}
}
```

Important: when creating/updating a meal, copy current setting prices into that day's record so later Settings changes do not rewrite history.

---

## Phase 1 — Shell + storage

Goal: open a blank mobile page that loads/saves data.

- [ ] `index.html` with 3 sections: Home, Monthly, Settings + bottom nav
- [ ] `style.css` mobile-first base (large tap targets, sticky total area)
- [ ] `store.js`
  - load from `localStorage` key `canteen-tracker`
  - save after every change
  - default settings + empty records
  - `schemaVersion: 1`
- [ ] `app.js` wires nav only (switch sections)

Done when: refresh keeps data; nav works on phone-sized viewport.

---

## Phase 2 — Daily tracking (Gregorian date first)

Goal: edit one day and see today's total. Skip BS until Phase 3.

- [ ] `billing.js` — pure `calcDay(record)` returns breakdown + total
- [ ] `getOrCreateRecord(isoDate)` using settings defaults
- [ ] Home UI:
  - Morning Food checkbox
  - Dinner checkbox
  - Breakfast eaten checkbox (item/price later)
  - Masu − / qty / +
  - Omelette − / qty / +
  - Today's total (always visible)
- [ ] Persist on every toggle/quantity change
- [ ] Min quantity = 0; no negative

Done when: Case 1–3 from original plan work with correct totals.

---

## Phase 3 — Nepali calendar UI

Goal: users only see BS dates.

- [ ] `nepaliDate.js`
  - Prefer a small offline BS library (single `.js` file, no npm) **or** a minimal self-contained converter for the years you need
  - Must: AD ↔ BS, BS month name, prev/next day, month length if possible
- [ ] Home header: `Bhadra 26, 2083` + weekday
- [ ] Controls: ← Prev day | Today | Next day →
- [ ] Optional: ← month → navigator
- [ ] Still key records by ISO under the hood

Done when: navigate days by BS; Today jumps to current BS date.

---

## Phase 4 — Breakfast presets + incomplete warnings

Goal: breakfast is usable and bill-safe.

- [ ] Preset chips: Chowmein / Momo / Tea
- [ ] Custom item name + price fields
- [ ] Store `{ eaten, item, price }` on the day record
- [ ] If eaten but no price: show `⚠ Select breakfast` and treat day as incomplete
- [ ] Settings: add / edit / delete presets (does not rewrite old days)

Done when: Case 4–6 work; missing breakfast does not silently bill as Rs. 0.

---

## Phase 5 — Monthly summary + day breakdown

Goal: answer “what should I pay this month?”

- [ ] Pick BS month/year
- [ ] Sum days in that BS month (map each BS day → ISO → record)
- [ ] Show per-category counts, qty, costs, expected total
- [ ] Warn: `⚠ N days have incomplete breakfast`
- [ ] Expand a day → full daily breakdown + daily total
- [ ] Optional: Close Month snapshot (compare later if edited)

Done when: monthly total matches hand-calculated sample month.

---

## Phase 6 — Backup / import / clear

Goal: survive browser wipe.

- [ ] `backup.js`
  - Export JSON download (`canteen-tracker-backup-....json`)
  - Import with confirm dialog
  - Validate structure, dates, booleans, non-negative qty/prices, `schemaVersion`
- [ ] Settings: Export / Import
- [ ] Danger zone: Delete all data (double confirm)

Done when: export → clear → import restores everything.

---

## Phase 7 — PWA + offline

Goal: installable, works offline after first load.

- [ ] `manifest.json` (name, icons, theme, standalone)
- [ ] Icons (simple PNG set)
- [ ] `sw.js` cache-first for app shell files
- [ ] Register SW from `app.js`
- [ ] HTTPS or localhost for install testing

Done when: airplane mode still opens app and edits records.

---

## Phase 8 — Polish + manual test checklist

- [ ] New day auto-creates defaults
- [ ] Price change in Settings does not change old records
- [ ] Incomplete breakfast warning on Home + Monthly
- [ ] Offline + refresh + reinstall-from-backup
- [ ] A11y: labels on −/+, focus states, contrast
- [ ] No wide tables on Home

---

## Screen map (V1 only)

| Screen   | Job                                      |
|----------|------------------------------------------|
| Home     | Today's (or selected day's) meals + total |
| Monthly  | BS month bill + day list                 |
| Settings | Prices, presets, backup, clear data      |

---

## What we drop from the original Plan.md

| Original              | Vanilla replacement              |
|-----------------------|----------------------------------|
| Vite + React          | Static `index.html`              |
| Tailwind              | Plain `style.css`                |
| Zustand + persist     | `store.js` + `localStorage`      |
| Component tree        | DOM sections + small render fns  |
| npm / build step      | Open HTML via local server / SW  |

Keep everything else: billing rules, BS UI, historical prices, incomplete warnings, backup, PWA.

---

## Suggested build order (do in sequence)

1. Phase 1 shell + store  
2. Phase 2 daily tracking  
3. Phase 3 Nepali dates  
4. Phase 4 breakfast  
5. Phase 5 monthly bill  
6. Phase 6 backup  
7. Phase 7 PWA  
8. Phase 8 polish  

Do not start Phase 5 until Phases 2–4 feel solid on a phone.

---

## Definition of done (same as original)

User can install offline, track by BS date, edit meals/quantities, see daily + monthly bill, keep historical prices, and restore from backup — with no backend and no framework.
