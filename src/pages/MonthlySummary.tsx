import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useCanteenStore } from '../store/canteenStore';
import { aggregateMonthlySummary, MonthlyAggregatedSummary } from '../utils/billing';
import {
  isoToBS,
  NEPALI_MONTH_NAMES_EN,
  getISODatesForBSMonth,
} from '../utils/nepaliDate';
import { ConfirmModal } from '../components/ConfirmModal';

interface MonthlySummaryProps {
  onSelectDateToEdit: (isoDate: string) => void;
}

export const MonthlySummaryPage: React.FC<MonthlySummaryProps> = ({ onSelectDateToEdit }) => {
  const { records, monthSnapshots, saveMonthSnapshot } = useCanteenStore();

  // Current selected BS Month/Year view
  const todayBS = useMemo(() => isoToBS(new Date().toISOString().split('T')[0]), []);
  const [selectedYear, setSelectedYear] = useState(todayBS.year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(todayBS.monthIndex);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const monthName = NEPALI_MONTH_NAMES_EN[selectedMonthIndex];
  const snapshotKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
  const savedSnapshot = monthSnapshots[snapshotKey];

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonthIndex(11);
    } else {
      setSelectedMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonthIndex(0);
    } else {
      setSelectedMonthIndex((prev) => prev + 1);
    }
  };

  // Find all records belonging to this BS month that are saved (or today)
  const monthlyData: MonthlyAggregatedSummary = useMemo(() => {
    const validMonthDates = new Set(getISODatesForBSMonth(selectedYear, selectedMonthIndex));
    
    const matchedRecords = Object.values(records).filter((rec) => {
      // Must be marked as saved
      if (rec.isSaved === false) return false;
      if (validMonthDates.has(rec.date)) return true;
      const bs = isoToBS(rec.date);
      return bs.year === selectedYear && bs.monthIndex === selectedMonthIndex;
    });

    return aggregateMonthlySummary(matchedRecords);
  }, [records, selectedYear, selectedMonthIndex]);

  // Is current calculated bill different from closed snapshot?
  const isSnapshotDiscrepancy =
    savedSnapshot && savedSnapshot.totalAmount !== monthlyData.totalAmount;

  const handleConfirmCloseMonth = () => {
    saveMonthSnapshot({
      bsYear: selectedYear,
      bsMonth: selectedMonthIndex + 1,
      bsMonthName: monthName,
      totalAmount: monthlyData.totalAmount,
      totalDays: monthlyData.totalRecordsCount,
      morningDays: monthlyData.morningFoodDays,
      morningCost: monthlyData.morningFoodTotalCost,
      breakfastDays: monthlyData.breakfastDays,
      breakfastCost: monthlyData.breakfastTotalCost,
      dinnerDays: monthlyData.dinnerDays,
      dinnerCost: monthlyData.dinnerTotalCost,
      masuQuantity: monthlyData.masuTotalQuantity,
      masuCost: monthlyData.masuTotalCost,
      omeletteQuantity: monthlyData.omeletteTotalQuantity,
      omeletteCost: monthlyData.omeletteTotalCost,
      closedAt: new Date().toISOString(),
    });
    setShowCloseModal(false);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Month Picker Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
            🍱 WRC Hostel • Monthly Bill Ledger
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>
                  {monthName} {selectedYear}
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {monthlyData.totalRecordsCount} confirmed days recorded
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Incomplete Records Warning Banner */}
        {monthlyData.incompleteRecordsCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold block">
                ⚠ {monthlyData.incompleteRecordsCount} day(s) have unpriced breakfast!
              </span>
              <p className="text-amber-700/90 dark:text-amber-300/90">
                Some breakfast records are marked eaten but missing prices. Tap on the day below to complete them for an accurate bill.
              </p>
            </div>
          </div>
        )}

        {/* Snapshot Discrepancy Alert */}
        {isSnapshotDiscrepancy && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                Saved snapshot was <strong>Rs. {savedSnapshot.totalAmount}</strong>. Modified since closing!
              </span>
            </div>
          </div>
        )}

        {/* Expected Total Bill Card */}
        <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between text-amber-100 text-xs uppercase tracking-wider font-semibold">
            <span>Expected Monthly Bill</span>
            <span>{monthName} {selectedYear}</span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-1.5 flex items-baseline space-x-2">
            <span>Rs. {monthlyData.totalAmount}</span>
            {monthlyData.incompleteRecordsCount > 0 && (
              <span className="text-xs font-medium text-amber-200">
                (+ pending breakfast)
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-amber-400/40 flex items-center justify-between text-xs text-amber-100">
            <span>Days Recorded: {monthlyData.totalRecordsCount}</span>
            {savedSnapshot && (
              <span className="flex items-center space-x-1 bg-amber-700/40 px-2 py-0.5 rounded-full text-[11px]">
                <FileCheck className="w-3 h-3" />
                <span>Month Closed</span>
              </span>
            )}
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Bill Breakdown
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Morning Food */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Morning Food
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {monthlyData.morningFoodDays} days eaten
                </div>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Rs. {monthlyData.morningFoodTotalCost}
              </div>
            </div>

            {/* Breakfast */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Breakfast
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {monthlyData.breakfastDays} days eaten
                </div>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Rs. {monthlyData.breakfastTotalCost}
              </div>
            </div>

            {/* Dinner */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Dinner
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {monthlyData.dinnerDays} days eaten
                </div>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Rs. {monthlyData.dinnerTotalCost}
              </div>
            </div>

            {/* Masu */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Masu
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {monthlyData.masuTotalQuantity} pieces
                </div>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Rs. {monthlyData.masuTotalCost}
              </div>
            </div>

            {/* Omelette */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Omelette
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  {monthlyData.omeletteTotalQuantity} pieces
                </div>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Rs. {monthlyData.omeletteTotalCost}
              </div>
            </div>

            {/* Custom Hostel Options Breakdown */}
            {Object.values(monthlyData.customItemsSummary).map((cItem) => (
              <div key={cItem.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {cItem.name}
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                    {cItem.type === 'toggle'
                      ? `${cItem.countOrQuantity} days eaten`
                      : `${cItem.countOrQuantity} units consumed`}
                  </div>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Rs. {cItem.totalCost}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Breakdown List (Audit Trail) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Daily Records ({monthlyData.dailyBreakdowns.length})
            </h2>
            <span className="text-[11px] text-slate-400">Tap date to inspect / edit</span>
          </div>

          {monthlyData.dailyBreakdowns.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No confirmed food records found for {monthName} {selectedYear}.
            </p>
          ) : (
            <div className="space-y-2">
              {monthlyData.dailyBreakdowns.map(({ date, record, breakdown }) => {
                const bs = isoToBS(date);
                const isExpanded = expandedDate === date;

                return (
                  <div
                    key={date}
                    className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden transition"
                  >
                    <div
                      onClick={() => setExpandedDate(isExpanded ? null : date)}
                      className="p-3 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {bs.monthName} {bs.date}
                        </span>
                        <span className="text-[11px] text-slate-400">({bs.dayName.slice(0, 3)})</span>
                        {breakdown.isIncomplete && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-sm font-medium">
                            ⚠ Incomplete
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Rs. {breakdown.totalCost}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                          <div>
                            Morning Food:{' '}
                            <span className="font-semibold">
                              {record.morningFood.eaten ? `Yes (Rs. ${record.morningFood.price})` : 'No'}
                            </span>
                          </div>
                          <div>
                            Dinner:{' '}
                            <span className="font-semibold">
                              {record.dinner.eaten ? `Yes (Rs. ${record.dinner.price})` : 'No'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            Breakfast:{' '}
                            <span className="font-semibold">
                              {record.breakfast.eaten
                                ? record.breakfast.item
                                  ? `${record.breakfast.item} (Rs. ${record.breakfast.price})`
                                  : '⚠ Item not selected'
                                : 'No'}
                            </span>
                          </div>
                          <div>
                            Masu:{' '}
                            <span className="font-semibold">
                              {record.masu.quantity} pcs (Rs. {breakdown.masuCost})
                            </span>
                          </div>
                          <div>
                            Omelette:{' '}
                            <span className="font-semibold">
                              {record.omelette.quantity} pcs (Rs. {breakdown.omeletteCost})
                            </span>
                          </div>

                          {/* Dynamic Custom Items in Daily Detail */}
                          {Object.values(breakdown.customBreakdown).map((ci) => (
                            <div key={ci.id} className="col-span-2 sm:col-span-1">
                              {ci.name}:{' '}
                              <span className="font-semibold">
                                {ci.type === 'toggle'
                                  ? (ci.quantityOrEaten ? `Yes (Rs. ${ci.cost})` : 'No')
                                  : `${ci.quantityOrEaten} units (Rs. ${ci.cost})`}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onSelectDateToEdit(date)}
                            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center space-x-1"
                          >
                            <span>Edit this day</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close Month Button (Snapshot) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCloseModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs active:scale-[0.99] transition flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>
              {savedSnapshot ? 'Update Closed Month Snapshot' : 'Close Month & Save Snapshot'}
            </span>
          </button>
        </div>
      </main>

      {/* Close Month Confirmation Modal */}
      <ConfirmModal
        isOpen={showCloseModal}
        title="Close Month & Save Bill Snapshot"
        message={`This will save a formal bill snapshot of ${monthName} ${selectedYear} with total Rs. ${monthlyData.totalAmount}. You can still edit records if needed.`}
        confirmLabel="Save Snapshot"
        cancelLabel="Cancel"
        onConfirm={handleConfirmCloseMonth}
        onCancel={() => setShowCloseModal(false)}
      />
    </div>
  );
};
