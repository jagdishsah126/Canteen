# Canteen Tracker

A mobile-first Progressive Web App for tracking personal canteen meals and calculating the expected monthly bill.

No accounts. No backend. No frameworks. Data stays in your browser.

## What it does

- Record what you actually ate each day
- Show dates in **Bikram Sambat (BS)**
- Calculate daily and monthly totals automatically
- Keep historical prices even if you change settings later
- Work offline after the first load
- Export / import backups as JSON

## Stack

Plain files only:

| File | Role |
|------|------|
| `index.html` | App shell + screens |
| `style.css` | Mobile-first UI |
| `app.js` | UI wiring |
| `store.js` | State + `localStorage` |
| `billing.js` | Daily / monthly totals |
| `nepaliDate.js` | BS calendar helpers |
| `vendor-ndc.js` | Offline AD ↔ BS converter |
| `backup.js` | Export / import validation |
| `sw.js` + `manifest.json` | PWA / offline |

## Quick start

Service workers need a local server (not `file://`).

```bash
python3 -m http.server 8765
```

Open:

```text
http://localhost:8765
```

Then optionally **Install / Add to Home Screen** from your browser.

## Screens

1. **Today** — edit one day’s meals and see the live total  
2. **Monthly** — Nepali month bill + day breakdown  
3. **Settings** — configure meals, presets, backup, clear data  

### Configurable meals (Settings)

- **Toggle meals** — Morning Food & Dinner by default; add/remove; set price + default eaten  
- **Preset meals** — Breakfast by default; add more categories; presets; default eaten + optional default item/price  
- **Quantity items** — Masu & Omelette by default; add/remove; set price + default quantity  

Defaults apply to **new days only**. Old days keep their saved prices.

## Default prices

| Item | Default |
|------|---------|
| Morning Food | Rs. 72 |
| Dinner | Rs. 72 |
| Breakfast | varies by item |
| Masu | Rs. 75 / piece |
| Omelette | Rs. 30 / piece |

Breakfast presets: Chowmein Rs. 50, Momo Rs. 100, Tea Rs. 20.

## Core rule

> The daily record is the source of truth.

Settings only affect **new** days. Old days keep the prices saved on that day. Totals are always calculated from records.

## Docs

- [User guide](guide.md) — how to use the app day to day
- [Vanilla build plan](VANILLA_PLAN.md) — phased implementation plan
- [Original product plan](Plan%20.md) — full product requirements

## Privacy

- No login
- No analytics
- No cloud sync
- Everything stays in browser `localStorage` unless you export a backup

## Browser support

Works best on modern mobile Chrome / Safari / Firefox. For install + offline, use `localhost` or HTTPS.
