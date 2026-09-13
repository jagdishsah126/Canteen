# Canteen Tracker PWA — Complete Build Plan

## 1. Project Goal

Build a mobile-first Progressive Web App (PWA) for personally tracking canteen food consumption and calculating the expected monthly canteen bill.

The app is designed for one user and should work entirely offline after installation.

Core principle:

> Record what was actually consumed each day, using the Nepali Bikram Sambat (BS) calendar, and automatically calculate how much should be paid at the end of the month.

There is no backend, account system, login, or cloud synchronization.

---

# 2. Core User Workflow

When the user opens the app:

1. The app identifies today's date.
2. It converts the date to Bikram Sambat for display.
3. If today's record does not exist, it creates one using the configured defaults.
4. The user sees today's food status.
5. The user changes only what differs from the defaults.
6. The app immediately recalculates today's cost.
7. At the end of the month, the user opens Monthly Summary.
8. The app shows item counts, quantities, individual costs, and the expected total bill.

Example:

Default day:

- Morning Food: eaten
- Breakfast: eaten
- Dinner: eaten
- Masu: 0
- Omelette: 0

If the user skips Morning Food and eats 2 omelettes:

- Morning Food: not eaten
- Breakfast: eaten
- Dinner: eaten
- Masu: 0
- Omelette: 2

The bill for that day is then calculated from those actual values.

---

# 3. Food and Billing Model

## 3.1 Morning Food

- Type: boolean
- Default: `true`
- Price: Rs. 72
- If not eaten: Rs. 0
- If eaten: Rs. 72

## 3.2 Dinner

- Type: boolean
- Default: `true`
- Price: Rs. 72
- If not eaten: Rs. 0
- If eaten: Rs. 72

## 3.3 Breakfast

Breakfast is different from the other regular meals.

- Type: object containing `eaten` and `price`
- Default: eaten
- Price varies by what was eaten
- If not eaten: Rs. 0

Examples:

- Chowmein: Rs. 50
- Momo: Rs. 100
- Tea only: Rs. 20
- Any future breakfast item can have its own price
- The price used for a day must be saved with that day's record

Important:

Do NOT store only a global breakfast price because breakfast prices vary by day.

Example:

```text
Bhadra 26:
Breakfast = Chowmein
Price = 50

Bhadra 27:
Breakfast = Momo
Price = 100

Bhadra 28:
Breakfast = Not eaten
Price = 0
```

The historical price must not change if a future breakfast price changes.

## 3.4 Masu

- Type: integer quantity
- Default: `0`
- Price per unit: Rs. 75
- Allowed quantities: 0, 1, 2, 3, ... with no artificial low maximum
- Cost = quantity × 75

Example:

```text
Masu = 2
Cost = 2 × 75 = Rs. 150
```

## 3.5 Omelette

- Type: integer quantity
- Default: `0`
- Price per unit: Rs. 30
- Allowed quantities: 0, 1, 2, 3, ... with no artificial low maximum
- Cost = quantity × 30

Example:

```text
Omelette = 3
Cost = 3 × 30 = Rs. 90
```

---

# 4. Recommended Daily Data Structure

Use Gregorian ISO dates as the internal record key.

Example:

```js
records: {
  "2026-09-12": {
    morningFood: true,
    breakfast: {
      eaten: true,
      item: "Chowmein",
      price: 50
    },
    dinner: true,
    masu: 0,
    omelette: 2
  }
}
```

The Gregorian date is only an internal identifier.

The user-facing interface should display the Nepali BS date.

Do NOT use BS strings as the primary internal date key.

Reason:

- ISO dates are standardized
- easier to sort
- easier to compare
- easier to generate previous/next dates
- easier to calculate month ranges
- easier to avoid date-related bugs

---

# 5. Settings Data

Settings should contain configurable food definitions and app preferences.

Recommended structure:

```js
settings: {
  items: {
    morningFood: {
      label: "Morning Food",
      price: 72,
      defaultEaten: true
    },

    dinner: {
      label: "Dinner",
      price: 72,
      defaultEaten: true
    },

    masu: {
      label: "Masu",
      price: 75,
      defaultQuantity: 0
    },

    omelette: {
      label: "Omelette",
      price: 30,
      defaultQuantity: 0
    }
  },

  breakfast: {
    label: "Breakfast",
    defaultEaten: true
  }
}
```

The exact implementation can use arrays if that makes dynamic rendering easier.

---

# 6. Breakfast Item Handling

Breakfast should support quick selection of common breakfast items.

Recommended UI:

```text
Breakfast
☑ Eaten

What did you eat?

[ Chowmein ] [ Momo ] [ Tea ]

Price: Rs. 50
```

The user should also be able to enter a custom breakfast item and price.

Example:

```text
Item: Chowmein
Price: Rs. 50
```

For common items, save reusable breakfast presets.

Example:

```js
breakfastPresets: [
  { id: "chowmein", label: "Chowmein", price: 50 },
  { id: "momo", label: "Momo", price: 100 },
  { id: "tea", label: "Tea", price: 20 }
]
```

The user can select a preset with one tap.

The daily record still stores the actual item and price, so historical records remain correct.

---

# 7. Daily Cost Calculation

Create a single pure calculation function.

Conceptually:

```text
morningFoodCost =
  morningFood ? 72 : 0

breakfastCost =
  breakfast.eaten ? breakfast.price : 0

dinnerCost =
  dinner ? 72 : 0

masuCost =
  masu × 75

omeletteCost =
  omelette × 30

dailyTotal =
  morningFoodCost
  + breakfastCost
  + dinnerCost
  + masuCost
  + omeletteCost
```

Do not manually store calculated totals as the primary source of truth.

Calculate totals from the record.

This avoids inconsistent data.

---

# 8. Monthly Summary

Create a dedicated Monthly Summary screen.

The user should be able to select a Nepali month/year.

Example:

```text
Bhadra 2083

Morning Food
27 days × Rs. 72
Rs. 1,944

Breakfast
25 days
Rs. 1,280

Dinner
26 days × Rs. 72
Rs. 1,872

Masu
14 pieces × Rs. 75
Rs. 1,050

Omelette
8 pieces × Rs. 30
Rs. 240

-------------------------
Expected Total
Rs. 6,386
```

Also show:

- Number of days recorded
- Days Morning Food was eaten
- Days Breakfast was eaten
- Days Dinner was eaten
- Total Masu quantity
- Total Omelette quantity
- Total Breakfast cost
- Total monthly cost

---

# 9. Daily Breakdown From Monthly Summary

The monthly summary should allow the user to inspect individual days.

Example:

```text
Bhadra 26
Morning Food: Yes
Breakfast: Chowmein (Rs. 50)
Dinner: Yes
Masu: 1
Omelette: 2

Daily Total: Rs. 254
```

This is useful when checking the canteen's final bill.

---

# 10. Date and Nepali Calendar

Use a reliable Nepali/Bikram Sambat date library.

Requirements:

- Convert Gregorian date to BS
- Display BS year
- Display BS month name
- Display BS day
- Navigate previous/next day
- Navigate previous/next month
- Determine today's BS date
- Determine days in a BS month if supported by the chosen library

The internal record key remains Gregorian ISO.

The UI should prioritize BS dates.

Example:

```text
Bhadra 26, 2083
Saturday
```

Do not make users interact with Gregorian dates unless needed in backup/debug information.

---

# 11. Main Home Screen

The home screen should prioritize today's entry.

Recommended layout:

```text
CANTEEN TRACKER

Bhadra 26, 2083
Saturday

[ Today ]

----------------------------

Morning Food
☑ Eaten
Rs. 72

Breakfast
☑ Eaten
[ Chowmein ]
Rs. 50

Dinner
☑ Eaten
Rs. 72

Masu
[ − ]   0   [ + ]

Omelette
[ − ]   2   [ + ]

----------------------------

Today's Total
Rs. 254
```

Requirements:

- Mobile-first
- Large tap targets
- Minimal typing
- Immediate visual feedback
- Daily total always visible
- Easy editing
- No HTML table for the main daily feed

---

# 12. Date Navigation

Provide:

```text
← Previous Day
Today
Next Day →
```

Also provide month navigation:

```text
← Bhadra 2083 →
```

A calendar/month view can be added if useful.

The Today button should always return to the current date.

---

# 13. Quantity Controls

For Masu and Omelette:

```text
[ − ]  0  [ + ]
```

Rules:

- Minimum = 0
- Never allow negative quantity
- No unnecessary artificial maximum
- Optional direct numeric input for larger quantities
- Update cost immediately

Example:

```text
Omelette
[ − ]  3  [ + ]

Cost: Rs. 90
```

---

# 14. Default Record Creation

When a date is opened for the first time:

```js
{
  morningFood: true,
  breakfast: {
    eaten: true,
    item: "",
    price: 0
  },
  dinner: true,
  masu: 0,
  omelette: 0
}
```

However, because Breakfast cannot have a valid price until an item is selected, the UI should clearly show that the breakfast item/price still needs to be selected.

The app should NOT pretend an unknown breakfast price is Rs. 0 and silently include that as a final bill.

Better UI:

```text
Breakfast
☑ Eaten
⚠ Select breakfast
```

Once selected:

```text
Breakfast
☑ Chowmein
Rs. 50
```

If the user marks Breakfast as not eaten:

```text
Breakfast
☐ Not eaten
Rs. 0
```

---

# 15. Missing/Incomplete Data Handling

The app should detect incomplete days.

Example:

```text
Bhadra 26
Breakfast: ⚠ Price not selected
```

Monthly Summary should warn:

```text
⚠ 2 days have incomplete breakfast information.
```

Do not silently calculate an inaccurate bill.

This is particularly important because the app's purpose is bill verification.

---

# 16. Monthly Closing / Bill Snapshot

Recommended feature.

At the end of a month:

```text
[ Close Month ]
```

This creates a snapshot containing:

- Nepali month/year
- Total quantities
- Total amount
- Breakdown by category
- Date/time of closing

Example:

```text
Bhadra 2083
Final Recorded Bill
Rs. 6,386
Closed on 2026-10-...
```

Closing should NOT destroy or prevent editing records.

If the user edits a closed month later, clearly indicate that the current calculation differs from the saved snapshot.

---

# 17. Data Storage

Use:

- Zustand
- Zustand `persist`
- browser `localStorage`

No backend.

No:

- Firebase
- Supabase
- Neon
- PostgreSQL
- authentication
- cloud account

The app should function without an internet connection after the application assets have been cached.

---

# 18. State Architecture

Recommended Zustand store sections:

```js
{
  settings: {
    ...
  },

  records: {
    ...
  },

  breakfastPresets: [
    ...
  ],

  monthSnapshots: {
    ...
  }
}
```

Actions should include:

```text
getOrCreateRecord(date)
toggleMorningFood(date)
toggleBreakfast(date)
setBreakfast(date, item, price)
toggleDinner(date)
incrementMasu(date)
decrementMasu(date)
setMasu(date, quantity)
incrementOmelette(date)
decrementOmelette(date)
setOmelette(date, quantity)
addBreakfastPreset(...)
updateBreakfastPreset(...)
deleteBreakfastPreset(...)
exportData(...)
importData(...)
closeMonth(...)
```

Keep calculation functions separate from UI components.

---

# 19. Data Validation

Because data lives locally, validate imported JSON.

Check:

- correct object structure
- valid dates
- boolean fields are actually boolean
- quantities are non-negative integers
- breakfast prices are valid numbers
- no invalid negative prices
- version number exists

Do not blindly merge arbitrary imported data into the store.

---

# 20. Backup and Restore

Provide:

## Export

Download a JSON file such as:

```text
canteen-tracker-backup-2083-05.json
```

The backup should include:

- settings
- records
- breakfast presets
- month snapshots
- schema version

## Import

Allow the user to select a previously exported backup.

Before replacing existing data:

```text
This will replace the current local data.

Cancel
Import
```

Do not silently overwrite data.

---

# 21. Schema Versioning

Add:

```js
schemaVersion: 1
```

to the persisted data.

This makes future migrations possible.

For example:

```text
Version 1
Version 2
Version 3
```

If the app's structure changes later, migration functions can convert old local data.

This is cheap to add now and painful to add after users have accumulated months of records.

---

# 22. PWA Requirements

Use:

- Vite
- React
- Tailwind CSS
- vite-plugin-pwa

Configure:

- Web app manifest
- App name
- Short name
- Icons
- Theme color
- Background color
- Standalone display
- Service worker
- Offline asset caching

The app should be installable from a supported mobile browser.

After installation, it should behave like a normal mobile application.

---

# 23. Offline Requirement

The following should work offline:

- Open app
- View records
- Add records
- Edit records
- Calculate daily totals
- Calculate monthly totals
- Navigate dates
- View settings
- Export data
- Import data

No feature in the core tracker should require a server request.

---

# 24. UI Pages

Keep V1 small.

## Page 1: Today / Records

Main daily tracking interface.

## Page 2: Monthly Summary

Bill calculation and daily breakdown.

## Page 3: Settings

Configure:

- Morning Food price
- Dinner price
- Masu price
- Omelette price
- Breakfast presets
- Backup/restore
- App information

Do not create unnecessary pages.

---

# 25. Settings UI

Example:

```text
SETTINGS

Regular Food

Morning Food
Rs. 72
[ Edit ]

Dinner
Rs. 72
[ Edit ]

Optional

Masu
Rs. 75 / piece
[ Edit ]

Omelette
Rs. 30 / piece
[ Edit ]

Breakfast Presets

Chowmein    Rs. 50
Momo        Rs. 100
Tea         Rs. 20

[ + Add Breakfast ]

Data

[ Export Backup ]
[ Import Backup ]

[ Danger Zone ]
```

Changing a future default price must NOT rewrite historical records.

For historical records, the price stored inside the record is authoritative.

---

# 26. Important Billing Rule

Historical records must preserve historical prices.

Example:

```text
September 12
Breakfast: Chowmein
Price saved: Rs. 50
```

Later:

```text
Chowmein preset price changes to Rs. 60
```

The September 12 record must remain:

```text
Rs. 50
```

The new price only applies when creating/selecting a new breakfast record.

Same principle applies to:

- Morning Food
- Dinner
- Masu
- Omelette

If prices are changed in Settings, do not recalculate old records using the new price.

---

# 27. Error Prevention

The app should prevent common mistakes.

Examples:

### Negative quantity

Impossible:

```text
Omelette = -2
```

### Accidental reset

Confirm destructive actions.

### Empty breakfast price

If Breakfast is marked eaten but has no price:

```text
⚠ Breakfast price missing
```

### Data deletion

Require confirmation before clearing all data.

---

# 28. Clear All Data

Include a clearly separated danger-zone action:

```text
Delete All Local Data
```

Require confirmation.

Example confirmation:

```text
This will permanently remove all locally stored
canteen records from this browser.

This cannot be undone unless you have a backup.

Cancel
Delete Everything
```

---

# 29. Security / Privacy

Since the app is local-only:

- No account required
- No personal data needs to leave the device
- No analytics required
- No tracking required
- No external database

Do not add analytics in V1 unless there is an actual reason.

---

# 30. Responsive Design

Primary target:

- Mobile phone

Secondary:

- Desktop browser

Do not sacrifice the mobile experience to make desktop look like a spreadsheet.

Use:

- cards
- buttons
- compact controls
- sticky/visible daily total where useful
- large touch targets
- clear typography

Avoid:

- wide tables
- tiny controls
- excessive animations
- unnecessary modal dialogs

---

# 31. Accessibility

Use:

- proper button labels
- keyboard support
- visible focus states
- sufficient contrast
- semantic HTML
- labels for form inputs
- accessible checkbox controls

Quantity buttons should have meaningful labels:

```text
Decrease omelette quantity
Increase omelette quantity
```

not just unexplained symbols.

---

# 32. Suggested Folder Structure

```text
src/
├── components/
│   ├── DailyRecordCard.jsx
│   ├── MealToggle.jsx
│   ├── QuantityControl.jsx
│   ├── BreakfastSelector.jsx
│   ├── DailyTotal.jsx
│   ├── MonthSummary.jsx
│   └── ConfirmDialog.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── MonthlySummary.jsx
│   └── Settings.jsx
│
├── store/
│   └── canteenStore.js
│
├── utils/
│   ├── billing.js
│   ├── nepaliDate.js
│   ├── validation.js
│   └── backup.js
│
├── hooks/
│   └── ...
│
├── App.jsx
├── main.jsx
└── index.css
```

Adjust the exact structure if the implementation benefits from a simpler organization.

---

# 33. Development Order

Do NOT try to build everything simultaneously.

## Phase 1 — Basic App

- Create Vite React project
- Install Tailwind
- Create mobile UI
- Create Zustand store
- Implement local persistence

## Phase 2 — Daily Tracking

Implement:

- Morning Food
- Breakfast
- Dinner
- Masu
- Omelette
- Default values
- Quantity controls
- Daily total

## Phase 3 — Nepali Calendar

Implement:

- BS conversion
- BS display
- Today
- Previous/next day
- Month navigation

## Phase 4 — Breakfast

Implement:

- Breakfast selection
- Presets
- Custom breakfast
- Price storage
- Missing-price warning

## Phase 5 — Monthly Billing

Implement:

- Monthly totals
- Item quantities
- Cost breakdown
- Daily breakdown
- Incomplete-record warning

## Phase 6 — Backup

Implement:

- Export
- Import
- Validation
- Schema versioning

## Phase 7 — PWA

Implement:

- Manifest
- Icons
- Service worker
- Offline caching
- Installability

## Phase 8 — Polish

Test:

- New day creation
- Date changes
- Month changes
- Price changes
- Quantity changes
- Offline mode
- Browser refresh
- PWA reopening
- Backup/restore
- Invalid imports
- Clearing data
- Historical price preservation

---

# 34. Testing Scenarios

Before calling V1 complete, manually test these cases.

### Case 1: Normal day

```text
Morning Food ✓
Breakfast ✓ Chowmein Rs.50
Dinner ✓
Masu 0
Omelette 0

Total = Rs.194
```

### Case 2: Skip morning food

```text
Morning Food ✗
Breakfast ✓ Chowmein Rs.50
Dinner ✓
Masu 0
Omelette 0

Total = Rs.122
```

### Case 3: Multiple extras

```text
Morning Food ✓
Breakfast ✓ Momo Rs.100
Dinner ✓
Masu 2
Omelette 3

Total =
72 + 100 + 72 + 150 + 90
= Rs.484
```

### Case 4: No breakfast

```text
Breakfast ✗

Breakfast cost = Rs.0
```

### Case 5: Tea only

```text
Breakfast ✓
Item = Tea
Price = Rs.20
```

### Case 6: Price changes

Old Chowmein = Rs.50

Later preset changes to Rs.60.

Old record must remain Rs.50.

### Case 7: Offline

Turn off internet.

The application must still open and records must still work.

### Case 8: Backup

Export → clear data → import → all records restored.

---

# 35. V1 Definition of Done

V1 is complete when the user can:

- Install the app as a PWA
- Open it without internet
- See today's BS date
- Automatically receive today's default meal values
- Mark Morning Food as eaten/not eaten
- Mark Dinner as eaten/not eaten
- Mark Breakfast as eaten/not eaten
- Select breakfast and its actual price
- Add any number of Masu
- Add any number of Omelettes
- See today's total immediately
- Edit previous days
- Navigate Nepali dates/months
- View a complete monthly bill
- Inspect the daily records contributing to the bill
- Export all data
- Import a backup
- Change future prices without changing historical records
- Recover from accidental browser/app reinstall using a backup

---

# 36. Features Explicitly Excluded From V1

Do NOT add:

- User accounts
- Login
- Backend
- Cloud database
- Cloud synchronization
- Multi-user support
- Social features
- AI features
- Ads
- Unnecessary analytics
- Complex charts
- Payment integration

Build the boring useful thing first.

---

# 37. Future V2 Ideas

Only consider these after V1 has been used successfully:

- CSV export
- PDF monthly bill report
- More detailed statistics
- Calendar heatmap
- Multiple canteens
- Cloud backup
- Device synchronization
- Expense trends
- Bill discrepancy tracker
- Custom meal categories
- Import/export to spreadsheet
- Optional PIN/app lock

V2 should be based on actual problems discovered while using V1, not features imagined while procrastinating on V1.

---

# 38. Final Architecture Principle

The most important design rule is:

> The daily record is the source of truth.

Prices and settings provide defaults for new records.

Historical records keep their actual consumed quantities and actual prices.

Monthly totals are calculated from those records.

The application should always be able to answer:

1. What did I consume on this BS date?
2. How much did that day cost?
3. How much did I consume this month?
4. How much should my monthly bill be?
5. Which individual days produced that total?

If those five questions can be answered quickly and reliably, the app has solved its actual purpose.
