import React from 'react';
import { Heart, Star, MessageSquare, X, Clock, ExternalLink, MessageCircle, Globe } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onStarGitHub: () => void;
  onGiveSuggestions: () => void;
  onRemindLater: () => void;
  onDismiss: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onStarGitHub,
  onGiveSuggestions,
  onRemindLater,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-center">
        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Support & Community 💖🍱
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            Thank you for using WRC Hostel Canteen Tracker! If this tool helps you manage your canteen expenses, please star the project, give feedback, or connect directly.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onStarGitHub}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 active:scale-95"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Star on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            type="button"
            onClick={onGiveSuggestions}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Give Suggestions (GitHub Issue)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Direct Developer Contact */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-left">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
              Direct Contact & Support
            </div>

            <a
              href="https://wa.me/9779702406668?text=Hi%20Jagdish,%20regarding%20WRC%20Hostel%20Canteen%20Tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-medium text-xs rounded-xl transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">WhatsApp: +977 9702406668</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
            </a>

            <a
              href="https://jagdishsah.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-950/40 border border-blue-500/20 text-blue-800 dark:text-blue-300 font-medium text-xs rounded-xl transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Website: jagdishsah.com.np</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
            </a>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={onRemindLater}
              className="flex-1 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center space-x-1"
            >
              <Clock className="w-3 h-3" />
              <span>Remind Later</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2 text-xs font-medium rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
