import React, { useState, useEffect, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { HomePage } from './pages/Home';
import { MonthlySummaryPage } from './pages/MonthlySummary';
import { SettingsPage } from './pages/Settings';
import { Navigation, ActiveTab } from './components/Navigation';
import { useCanteenStore } from './store/canteenStore';
import { getTodayISODate, isoToBS } from './utils/nepaliDate';
import { calculateDailyCost } from './utils/billing';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentDate, setCurrentDate] = useState<string>(getTodayISODate());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('canteen_theme') === 'dark' ||
      (!('canteen_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const { records } = useCanteenStore();

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('canteen_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('canteen_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Calculate incomplete records count for the current BS month
  const incompleteCountInCurrentMonth = useMemo(() => {
    const todayBS = isoToBS(getTodayISODate());
    let count = 0;
    for (const record of Object.values(records)) {
      const bs = isoToBS(record.date);
      if (bs.year === todayBS.year && bs.monthIndex === todayBS.monthIndex) {
        const cost = calculateDailyCost(record);
        if (cost.isIncomplete) {
          count += 1;
        }
      }
    }
    return count;
  }, [records]);

  const handleSelectDateToEdit = (isoDate: string) => {
    setCurrentDate(isoDate);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {activeTab === 'home' && (
        <HomePage currentDate={currentDate} onDateChange={setCurrentDate} />
      )}

      {activeTab === 'monthly' && (
        <MonthlySummaryPage onSelectDateToEdit={handleSelectDateToEdit} />
      )}

      {activeTab === 'settings' && (
        <SettingsPage
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      )}

      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        incompleteCount={incompleteCountInCurrentMonth}
      />
      <Analytics />
    </div>
  );
};

export default App;
