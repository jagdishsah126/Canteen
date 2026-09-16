import React from 'react';
import { BookOpen, Check, ExternalLink, Calendar, Wallet, Layers, ShieldCheck, X } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Welcome to WRC Hostel
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Quick Guide for Canteen Meal Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">
                Nepali Bikram Sambat (BS) Dates
              </strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Navigate by BS days and months. Matches your hostel's official ledger.
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">
                Auto-Save vs. Manual Confirmation
              </strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Today is continuously auto-saved. Browsing past/future days does not save until you click the <strong>Tick (✓)</strong> button. You can also turn on the Auto-Save catchup in Settings!
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <Layers className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">
                100% Customizable & Removable Options
              </strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Don't eat Dinner or Masu? You can remove or disable ANY meal in Settings, or add custom options like Milk and Snacks with presets!
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <Wallet className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">
                Monthly Audit & Snapshots
              </strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                View your itemized monthly bill, check each individual day, and save monthly closing snapshots.
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block">
                100% Offline & Private
              </strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                No server, no login, and no internet required. Your records live safely on your device.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
          >
            <span>🚀 Got It, Let's Start!</span>
          </button>

          <a
            href="/guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium flex items-center justify-center space-x-1"
          >
            <span>View Full Guide Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
