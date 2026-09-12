import React from 'react';
import { CalendarCheck, FileText, Settings as SettingsIcon } from 'lucide-react';

export type ActiveTab = 'home' | 'monthly' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  incompleteCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  incompleteCount = 0,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-pb"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-14">
        {/* Tab 1: Daily Tracker */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 ${
            activeTab === 'home'
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span className="text-[11px]">Today</span>
        </button>

        {/* Tab 2: Monthly Summary */}
        <button
          onClick={() => onChangeTab('monthly')}
          className={`relative flex flex-col items-center justify-center space-y-1 transition active:scale-95 ${
            activeTab === 'monthly'
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5" />
            {incompleteCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {incompleteCount > 9 ? '9+' : incompleteCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Monthly Bill</span>
        </button>

        {/* Tab 3: Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 ${
            activeTab === 'settings'
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[11px]">Settings</span>
        </button>
      </div>
    </nav>
  );
};
