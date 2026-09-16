# 🍱 WRC Hostel Canteen Tracker

A mobile-first, 100% offline Progressive Web App (PWA) designed for students & residents of **WRC Hostel** (Paschimanchal Campus, IOE) to personally record canteen food consumption and calculate monthly canteen bills using the **Nepali Bikram Sambat (BS)** calendar.

Built with 💖 by **Jagdish And Zara**.

---

## ✨ Features

- 🇳🇵 **Nepali Bikram Sambat (BS) Calendar**: Displays today's date in Bikram Sambat (e.g., *Bhadra 27, 2083*), with smooth day and month navigation.
- 🍱 **Hostel Food Tracking**:
  - **Today Auto-Save**: Today's entry is continuously auto-saved.
  - **Past & Future Days Confirmation**: Browsing past or future days does not pollute your records unless you explicitly confirm by tapping the **Tick (✓ Save Day)** button!
  - **Core Meals**: Morning Food (Lunch) & Dinner with live price calculation (default Rs. 72).
  - **Breakfast**: Supports quick-tap presets (Chowmein, Momo, Tea), custom item & price inputs, and alerts if breakfast is marked eaten without selecting a price.
  - **Addons & Extras**: Masu & Omelette non-negative quantity steppers with large touch targets.
  - ➕ **Custom Hostel Options**: Add ANY number of custom options (e.g. Milk, Afternoon Snacks, Roti) with custom types (Toggle or Quantity), custom default prices, and initial default values!
- 💰 **Historical Price Freezing**: Changing future rates in Settings will **never** alter old recorded bills. The daily record remains the source of truth.
- 📊 **Monthly Bill & Audit Trail**:
  - Grouped by BS month/year with itemized counts and total amounts.
  - Day-by-day expandable audit trail to verify every single meal against the hostel master bill.
  - Optional **Close Month** bill snapshots with discrepancy alerts.
- ⚙️ **Settings & Customization**:
  - Add/modify/delete Custom Food Options.
  - Editable core meal prices.
  - Editable breakfast presets.
  - Dark / Light mode toggle.
- 🛡️ **Zero Cloud, 100% Offline & Private**:
  - Purely client-side with Zustand local storage persistence.
  - Complete JSON backup export and validated restore.
- 📱 **Installable PWA**: Works like a native mobile app on Android & iOS and runs completely offline.

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
