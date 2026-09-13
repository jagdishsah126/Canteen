# Canteen Tracker — User Guide

How to use the app for daily tracking and monthly bill checks.

## Configurable meals

In **Settings** you can:

- **Toggle meals** (Morning Food, Dinner by default) — add / remove / edit name, price, default eaten
- **Preset meals** (Breakfast by default) — add more breakfast-like categories, with presets, default eaten, and optional default item/price
- **Quantity items** (Masu, Omelette by default) — add / remove / edit price and default quantity

Defaults only apply to **new days**. Old day records keep the prices saved on that day.

---

## 1. Open the app


1. Start a local server in the project folder:

```bash
python3 -m http.server 8765
```

2. Open `http://localhost:8765` on your phone or computer.
3. Optional: install it with **Add to Home Screen / Install app**.
4. After the first successful load, core tracking works offline.

---

## 2. Track today

Open the **Today** tab.

You’ll see the current **Bikram Sambat** date, for example:

```text
Bhadra 28, 2083
Sunday
```

When you open a day for the first time, the app creates defaults:

- Morning Food: eaten
- Breakfast: eaten (item/price still needed)
- Dinner: eaten
- Masu: 0
- Omelette: 0

Change only what is different from reality.

### Meals

- **Morning Food** / **Dinner** — tap the checkbox if eaten or not eaten
- **Breakfast** — mark eaten, then choose a preset or enter a custom item + price
- **Masu / Omelette** — use − / + or type a quantity

The **Day total** at the bottom updates immediately and is saved automatically.

### Breakfast warning

If Breakfast is marked eaten but has no item/price:

```text
⚠ Select breakfast item and price
```

That day is treated as **incomplete**. The missing breakfast is not silently billed as Rs. 0.

### Date navigation

- **← Prev / Next →** — move one day
- **Today** — jump back to the current date
- **← Month →** — jump by Nepali month

Records are stored internally by Gregorian date. You only see BS dates in the UI.

---

## 3. Check the monthly bill

Open the **Monthly** tab.

1. Use ← → to pick a Nepali month (for example **Bhadra 2083**).
2. Review:
   - Expected total
   - Morning Food / Breakfast / Dinner costs
   - Masu and Omelette quantities
3. Expand any recorded day for a full breakdown.
4. Tap **Open this day** to edit it on the Today screen.

Only **recorded** days count toward the bill.

If some days still need breakfast details:

```text
⚠ N days have incomplete breakfast information.
```

Fix those days before trusting the final bill.

### Close month

**Close month** saves a snapshot of the current totals.

- It does **not** lock or delete records
- If you edit that month later, the app tells you when the live total differs from the snapshot

---

## 4. Settings

### Regular food prices

Edit:

- Morning Food
- Dinner
- Masu per piece
- Omelette per piece

Tap **Save prices**.

These prices apply to **future / newly created days only**.  
Old day records keep their original saved prices.

### Breakfast presets

Default presets:

- Chowmein — Rs. 50
- Momo — Rs. 100
- Tea — Rs. 20

You can:

- Add a new preset
- Edit name/price and save
- Delete a preset

Changing a preset does **not** rewrite old breakfast records.

### Backup

**Export backup**

Downloads a JSON file such as:

```text
canteen-tracker-backup-2083-05-2026-09-13.json
```

Keep this file somewhere safe (Drive, Files, email to yourself).

**Import backup**

1. Choose a previously exported JSON file
2. Confirm replacement
3. Current local data is replaced by the backup

Invalid files are rejected.

### Delete all local data

Under **Danger zone**:

1. Confirm once
2. Confirm again

Everything in this browser is wiped unless you have a backup.

---

## 5. Typical day examples

### Normal day

```text
Morning Food ✓
Breakfast ✓ Chowmein Rs. 50
Dinner ✓
Masu 0
Omelette 0

Total = Rs. 194
```

### Skipped morning food

```text
Morning Food ✗
Breakfast ✓ Chowmein Rs. 50
Dinner ✓

Total = Rs. 122
```

### Extras

```text
Morning Food ✓
Breakfast ✓ Momo Rs. 100
Dinner ✓
Masu 2
Omelette 3

Total = Rs. 484
```

### No breakfast

```text
Breakfast ✗
Breakfast cost = Rs. 0
```

---

## 6. Important billing rules

1. **Daily record wins** — what you saved that day is what the bill uses.
2. **Historical prices stay frozen** — changing Settings later does not rewrite old days.
3. **Incomplete breakfast is visible** — do not ignore the warning when verifying a canteen bill.
4. **No internet needed after install/first load** — tracking, totals, backup export/import all work locally.

---

## 7. Suggested monthly routine

1. Each day: open the app and adjust only what differed from defaults.
2. Always select a real breakfast item/price when breakfast was eaten.
3. At month end: open **Monthly**, fix any incomplete days, then note the expected total.
4. Optional: tap **Close month** and **Export backup**.

---

## 8. Troubleshooting

| Problem | What to try |
|---------|-------------|
| Install / offline not working | Use `http://localhost...` or HTTPS, then reload once |
| Totals look too low | Check incomplete breakfast warnings |
| Old day changed after Settings edit | It shouldn’t — export a backup and re-check that day’s stored item/price |
| Lost data after clearing browser | Restore from an exported JSON backup |
| Wrong month shown | Use month arrows on Monthly, or open the correct day on Today first |

---

## 5 questions the app should always answer

1. What did I consume on this BS date?
2. How much did that day cost?
3. How much did I consume this month?
4. How much should my monthly bill be?
5. Which individual days produced that total?

If those are clear, the app is doing its job.
