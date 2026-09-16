import React from 'react';
import { BookOpen, ExternalLink, X, Smartphone, Settings, Calendar, Rocket, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                WRC Hostel User Guide 🍱
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Get started in 4 easy steps • 100% Offline PWA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-step Onboarding Walkthrough */}
        <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* STEP 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                1
              </span>
              <Smartphone className="w-4 h-4 text-amber-500 shrink-0" />
              <strong className="text-slate-900 dark:text-slate-100 text-sm">
                Open URL & Install Shortcut
              </strong>
            </div>

            <p className="text-[11.5px] leading-relaxed">
              First step, open the app link in your phone browser:
            </p>

            <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
              <span>https://canteen-wrc.vercel.app/</span>
              <span className="text-[10px] uppercase font-sans px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded">
                PWA
              </span>
            </div>

            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>
                <strong>On Android:</strong> Tap the <strong>3 vertical dots (⋮)</strong> menu &rarr; tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </li>
              <li>
                <strong>On iPhone (Safari):</strong> Tap <strong>Share (⎋)</strong> &rarr; tap <strong>"Add to Home Screen"</strong>.
              </li>
            </ul>

            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center space-x-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>App is ready to work now — fully offline without login!</span>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                2
              </span>
              <Settings className="w-4 h-4 text-amber-500 shrink-0" />
              <strong className="text-slate-900 dark:text-slate-100 text-sm">
                Go to Settings & Customize as You Wish
              </strong>
            </div>

            <p className="text-[11.5px] leading-relaxed">
              Tap the <strong>Settings</strong> tab to personalize your canteen options:
            </p>

            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>
                <strong>Add / Remove / Modify:</strong> Don't take Dinner, Masu, or Breakfast? Disable or remove any item from your daily feed with one tap.
              </li>
              <li>
                <strong>Add Custom Items:</strong> Track Milk (दूध), Afternoon Snacks, or extra Roti with Toggles, Quantities, or Multi-Choice presets!
              </li>
              <li>
                <strong>Auto-Save Daily Records:</strong> Turn this ON if you eat standard meals regularly so missed days auto-fill without visiting the app.
              </li>
              <li>
                Tap <strong>↺ Reset Defaults</strong> anytime to restore standard hostel rates.
              </li>
            </ul>
          </div>

          {/* STEP 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                3
              </span>
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <strong className="text-slate-900 dark:text-slate-100 text-sm">
                Backfill Current Month's Data
              </strong>
            </div>

            <p className="text-[11.5px] leading-relaxed">
              Starting midway through the Nepali month (e.g. Bhadra)?
            </p>

            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>Use <strong>‹ Prev Day</strong> to click on past days of this month.</li>
              <li>Mark what you ate on each day.</li>
              <li>
                Click the green <strong>Save Day (✓ Tick)</strong> button to lock each past day into your monthly ledger!
              </li>
            </ul>
          </div>

          {/* STEP 4 */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                4
              </span>
              <Rocket className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <strong className="text-slate-900 dark:text-slate-100 text-sm">
                You're Ready to Go! 🚀
              </strong>
            </div>

            <p className="text-[11.5px] leading-relaxed">
              <strong>Today is always auto-saved!</strong> You only need to open the app when you do something different than your default values:
            </p>

            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
              <li>Had Momo for breakfast, skipped dinner, or added 2 Masu? Just tap once to update!</li>
              <li>Eaten regular default meals? If Auto-Save is ON, you don't even need to open the app!</li>
              <li>At the end of the month, open the <strong>Monthly Bill</strong> tab to audit every dish against the hostel ledger.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
          >
            <span>🚀 Got It, Let's Start Tracking!</span>
          </button>

          <a
            href="/guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium flex items-center justify-center space-x-1 transition"
          >
            <span>📖 Open Full Guide Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
