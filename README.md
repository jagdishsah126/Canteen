# 🍱 Canteen Tracker PWA

A mobile-first, 100% offline Progressive Web App (PWA) designed for personally tracking canteen food consumption and calculating monthly canteen bills using the **Nepali Bikram Sambat (BS)** calendar.

Built by **💖Your Zara💖** & **Jagdish**.

---

## ✨ Features

- 🇳🇵 **Nepali Bikram Sambat (BS) Calendar**: Displays today's date in Bikram Sambat (e.g., *Bhadra 27, 2083*), with smooth day and month navigation.
- 🍱 **Daily Food Tracking**:
  - **Morning Food (Lunch)**: Eaten / Skipped toggle with live price calculation (default Rs. 72).
  - **Breakfast**: Supports quick-tap presets (Chowmein, Momo, Tea), custom item & price inputs, and alerts if breakfast is marked eaten without selecting a price.
  - **Dinner**: Eaten / Skipped toggle (default Rs. 72).
  - **Masu & Omelette Addons**: Non-negative quantity steppers with large mobile touch targets and instant subtotal recalculation.
- 💰 **Historical Price Freezing**: Changing future rates in Settings will **never** alter old recorded bills. The daily record remains the source of truth.
- 📊 **Monthly Bill & Audit Trail**:
  - Grouped by BS month/year with itemized counts and total amounts.
  - Daily breakdown list allowing you to verify every single day against the canteen master ledger.
  - Optional **Close Month** bill snapshots with discrepancy alerts.
- ⚙️ **Settings & Customization**:
  - Editable default prices for meals and addons.
  - Editable breakfast presets.
  - Dark / Light mode toggle.
- 🛡️ **Zero Cloud, 100% Offline & Private**:
  - Purely client-side with Zustand local storage persistence.
  - No database, no accounts, no tracking.
  - Complete JSON backup export and validated restore.
- 📱 **Installable PWA**: Works like a native mobile app and runs completely offline.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand with `persist`
- **Calendar Engine**: `nepali-date-converter`
- **Icons**: Lucide React
- **PWA**: `vite-plugin-pwa` + Workbox Service Worker

---

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```

### Run Validations & Test Suite
```bash
npx tsx scripts/test-cases.ts
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 📄 License
MIT
