import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { HomePage } from './pages/Home';
import { MonthlySummaryPage } from './pages/MonthlySummary';
import { SettingsPage } from './pages/Settings';
import { Navigation, ActiveTab } from './components/Navigation';
import { GuideModal } from './components/GuideModal';
import { SupportModal } from './components/SupportModal';
import { useCanteenStore } from './store/canteenStore';
import { getTodayISODate, isoToBS } from './utils/nepaliDate';
import { calculateDailyCost } from './utils/billing';
import { sendLocalNotification } from './utils/notifications';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentDate, setCurrentDate] = useState<string>(getTodayISODate());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('canteen_theme') === 'dark' ||
      (!('canteen_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const {
    records,
    settings,
    hasSeenGuide,
    setHasSeenGuide,
    firstInstalledAt,
    supportPromptStatus,
    remindSupportAfter,
    setSupportPromptStatus,
    runAutoSaveCatchup,
  } = useCanteenStore();

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isManualSupportModalOpen, setIsManualSupportModalOpen] = useState(false);

  // Daily offline meal reminders check
  const lastReminderFiredRef = useRef<{ morning?: string; evening?: string }>({});

  useEffect(() => {
    if (!settings.reminderConfig?.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      const todayStr = getTodayISODate();

      const { morningTime = '09:30', eveningTime = '21:30' } = settings.reminderConfig;

      if (currentTimeStr === morningTime && lastReminderFiredRef.current.morning !== todayStr) {
        lastReminderFiredRef.current.morning = todayStr;
        sendLocalNotification(
          '☀️ Morning Meal & Breakfast Reminder',
          'Did you have morning meal or breakfast today? Tap to record it in WRC Canteen Tracker!'
        );
      }

      if (currentTimeStr === eveningTime && lastReminderFiredRef.current.evening !== todayStr) {
        lastReminderFiredRef.current.evening = todayStr;
        sendLocalNotification(
          '🌙 Dinner & Night Mess Reminder',
          'Did you have dinner or any extra items tonight? Tap to record it before bed!'
        );
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [settings.reminderConfig]);

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

  // Run auto-save catchup on mount and tab focus / visibility change
  useEffect(() => {
    runAutoSaveCatchup();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        runAutoSaveCatchup();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [runAutoSaveCatchup]);

  // First time auto-display guide modal
  useEffect(() => {
    if (!hasSeenGuide) {
      setIsGuideModalOpen(true);
    }
  }, [hasSeenGuide]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleCloseGuide = () => {
    setHasSeenGuide(true);
    setIsGuideModalOpen(false);
  };

  // 1-month support modal condition
  const isMonthMilestoneDue = useMemo(() => {
    if (supportPromptStatus === 'dismissed' || supportPromptStatus === 'supported') {
      return false;
    }
    const now = Date.now();
    if (supportPromptStatus === 'remind_later' && remindSupportAfter) {
      return now >= new Date(remindSupportAfter).getTime();
    }
    if (firstInstalledAt) {
      const installedTime = new Date(firstInstalledAt).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      return now - installedTime >= thirtyDaysMs;
    }
    return false;
  }, [supportPromptStatus, remindSupportAfter, firstInstalledAt]);

  const isSupportModalVisible = isMonthMilestoneDue || isManualSupportModalOpen;

  const handleStarGitHub = () => {
    window.open('https://github.com/jagdishsah126/Canteen', '_blank');
    setSupportPromptStatus('supported');
    setIsManualSupportModalOpen(false);
  };

  const handleGiveSuggestions = () => {
    window.open('https://github.com/jagdishsah126/Canteen/issues/new', '_blank');
    setSupportPromptStatus('supported');
    setIsManualSupportModalOpen(false);
  };

  const handleRemindLater = () => {
    setSupportPromptStatus('remind_later', 7);
    setIsManualSupportModalOpen(false);
  };

  const handleDismissSupport = () => {
    setSupportPromptStatus('dismissed');
    setIsManualSupportModalOpen(false);
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
          onOpenGuide={() => setIsGuideModalOpen(true)}
          onOpenSupport={() => setIsManualSupportModalOpen(true)}
        />
      )}

      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        incompleteCount={incompleteCountInCurrentMonth}
      />

      {/* Interactive Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={handleCloseGuide}
      />

      {/* 1-Month Milestone & Community Support Modal */}
      <SupportModal
        isOpen={isSupportModalVisible}
        onStarGitHub={handleStarGitHub}
        onGiveSuggestions={handleGiveSuggestions}
        onRemindLater={handleRemindLater}
        onDismiss={handleDismissSupport}
      />

      <Analytics />
    </div>
  );
};

export default App;
