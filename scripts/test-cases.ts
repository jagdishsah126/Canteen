import { calculateDailyCost, aggregateMonthlySummary } from '../src/utils/billing';
import { isoToBS } from '../src/utils/nepaliDate';
import { DailyRecord } from '../src/types/canteen';
import { INITIAL_DEFAULTS } from '../src/store/canteenStore';

console.log('🧪 Starting WRC Hostel Canteen Tracker Test Suite...\n');

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Test Breakfast Default Setting: must be NOT eaten by default
assert(INITIAL_DEFAULTS.breakfastEaten === false, 'Breakfast must be by default not eaten (false)');

// Helper to make mock daily record
function makeRecord(overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    date: '2026-09-12',
    morningFood: { eaten: true, price: 72 },
    dinner: { eaten: true, price: 72 },
    breakfast: { eaten: false, item: '', price: 0, isIncomplete: false },
    masu: { quantity: 0, unitPrice: 75 },
    omelette: { quantity: 0, unitPrice: 30 },
    createdAt: '2026-09-12T12:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
    isSaved: true,
    ...overrides,
  };
}

// Case 1: Default Day (Breakfast by default not eaten: 72 + 0 + 72 = 144)
const caseDefault = makeRecord();
const resDefault = calculateDailyCost(caseDefault);
assert(resDefault.totalCost === 144, `Case 1 Default Day (no breakfast): expected 144, got ${resDefault.totalCost}`);

// Case 2: Normal Day with Breakfast Chowmein 50
const case2 = makeRecord({
  breakfast: { eaten: true, item: 'Chowmein', price: 50, isIncomplete: false },
});
const res2 = calculateDailyCost(case2);
assert(res2.totalCost === 194, `Case 2 Normal Day with Breakfast: expected 194, got ${res2.totalCost}`);

// Case 3: Multiple extras (Morning Food 72 + Breakfast Momo 100 + Dinner 72 + Masu 2 + Omelette 3)
const case3 = makeRecord({
  breakfast: { eaten: true, item: 'Momo', price: 100, isIncomplete: false },
  masu: { quantity: 2, unitPrice: 75 },
  omelette: { quantity: 3, unitPrice: 30 },
});
const res3 = calculateDailyCost(case3);
assert(res3.totalCost === 484, `Case 3 Multiple Extras: expected 484, got ${res3.totalCost}`);

// Case 4: Custom Multi-Choice Option (e.g. Snacks: Samosa Rs. 35)
const caseMultiChoice = makeRecord({
  customItems: {
    opt_snacks: {
      id: 'opt_snacks',
      name: 'Snacks',
      type: 'multi_choice',
      eaten: true,
      item: 'Samosa',
      price: 35,
      isIncomplete: false,
    },
  },
});
const resMultiChoice = calculateDailyCost(caseMultiChoice);
// 72 + 0 (breakfast skipped) + 72 + 35 = 179
assert(resMultiChoice.totalCost === 179, `Case 4 Multi-Choice Snacks expected 179, got ${resMultiChoice.totalCost}`);
assert(resMultiChoice.customBreakdown['opt_snacks']?.chosenItem === 'Samosa', 'Chosen item Samosa preserved');

// Case 5: Custom Multi-Choice Incomplete (eaten but missing price/item)
const caseMultiIncomplete = makeRecord({
  customItems: {
    opt_snacks: {
      id: 'opt_snacks',
      name: 'Snacks',
      type: 'multi_choice',
      eaten: true,
      item: '',
      price: 0,
      isIncomplete: true,
    },
  },
});
const resMultiIncomplete = calculateDailyCost(caseMultiIncomplete);
assert(resMultiIncomplete.isIncomplete === true, 'Custom multi-choice incomplete should flag warning');

// Monthly Aggregation Test (including multi-choice custom items)
const monthly = aggregateMonthlySummary([caseDefault, case2, case3, caseMultiChoice, caseMultiIncomplete]);
assert(monthly.totalRecordsCount === 5, 'Monthly should count 5 records');
assert(monthly.incompleteRecordsCount === 1, 'Monthly should flag 1 incomplete record');
assert(monthly.customItemsSummary['opt_snacks']?.countOrQuantity === 2, 'Monthly snacks eaten count is 2');
assert(monthly.customItemsSummary['opt_snacks']?.totalCost === 35, 'Monthly snacks cost is 35');

// Bikram Sambat Conversion Test
const bs = isoToBS('2026-09-12');
assert(bs.year > 2080, `BS Year should be Bikram Sambat (> 2080), got ${bs.year}`);
assert(typeof bs.monthName === 'string' && bs.monthName.length > 0, `BS month name exists: ${bs.monthName}`);

// Case 6: getDatesBetween utility
import { getDatesBetween } from '../src/utils/nepaliDate';
const rangeDates = getDatesBetween('2026-09-10', '2026-09-13');
assert(rangeDates.length === 4, `Expected 4 dates in range, got ${rangeDates.length}`);
assert(rangeDates[0] === '2026-09-10' && rangeDates[3] === '2026-09-13', 'Range bounds match');

// Case 7: Core Items Removability & Defaults Reset
import { INITIAL_CORE_ENABLED, useCanteenStore } from '../src/store/canteenStore';
assert(INITIAL_CORE_ENABLED.morningFood === true, 'Morning Food enabled by default');
assert(INITIAL_CORE_ENABLED.dinner === true, 'Dinner enabled by default');
assert(INITIAL_CORE_ENABLED.breakfast === true, 'Breakfast enabled by default');
assert(INITIAL_CORE_ENABLED.masu === true, 'Masu enabled by default');
assert(INITIAL_CORE_ENABLED.omelette === true, 'Omelette enabled by default');

const store = useCanteenStore.getState();
store.toggleCoreItem('morningFood');
assert(useCanteenStore.getState().settings.coreItemsEnabled.morningFood === false, 'Morning food should be disabled after toggle');
store.resetToHostelDefaults();
assert(useCanteenStore.getState().settings.coreItemsEnabled.morningFood === true, 'Morning food should be restored after resetToHostelDefaults');

// Case 8: Auto-Save Catchup Engine
store.setAutoSaveDailyDefaults(false);
const caughtUpDisabled = store.runAutoSaveCatchup();
assert(caughtUpDisabled === 0, `When autoSave is false, catchup returns 0, got ${caughtUpDisabled}`);

// Case 9: Day Notes (Diary) Feature
const savedDay = makeRecord({ date: '2026-09-12', isSaved: true });
store.saveDayRecord(savedDay);
store.setDayNote('2026-09-12', 'Ate outside at Lamachaur with friends');
const dayNoteRecord = store.getRecordForDate('2026-09-12');
assert(dayNoteRecord !== null && dayNoteRecord.note === 'Ate outside at Lamachaur with friends', 'Day note saved correctly');

// Case 10: Student Profile & Room Number
store.updateUserProfile({
  name: 'Jagdish Sah',
  roomNumber: '214',
  hostelBlock: 'Block B',
  showBadgeOnHome: true,
});
const currentProfile = useCanteenStore.getState().settings.userProfile;
assert(currentProfile.name === 'Jagdish Sah', 'Profile name updated');
assert(currentProfile.roomNumber === '214', 'Profile room number updated');
assert(currentProfile.hostelBlock === 'Block B', 'Profile hostel block updated');
assert(currentProfile.showBadgeOnHome === true, 'Profile badge visibility preserved');

// Case 11: Preferences & Meal Reminders Config
store.setShowDailyNotes(false);
assert(useCanteenStore.getState().settings.showDailyNotes === false, 'showDailyNotes toggled off');
store.setShowDailyNotes(true);
assert(useCanteenStore.getState().settings.showDailyNotes === true, 'showDailyNotes toggled on');

store.setShowFoodAnalytics(false);
assert(useCanteenStore.getState().settings.showFoodAnalytics === false, 'showFoodAnalytics toggled off');
store.setShowFoodAnalytics(true);
assert(useCanteenStore.getState().settings.showFoodAnalytics === true, 'showFoodAnalytics toggled on');

store.updateReminderConfig({
  enabled: true,
  morningTime: '08:45',
  eveningTime: '21:15',
});
const currentReminder = useCanteenStore.getState().settings.reminderConfig;
assert(currentReminder.enabled === true, 'Reminder enabled');
assert(currentReminder.morningTime === '08:45', 'Reminder morning time updated');
assert(currentReminder.eveningTime === '21:15', 'Reminder evening time updated');

// Case 12: Food Analytics & Hostel Badges Engine
import { calculateMonthlyAnalytics } from '../src/utils/analytics';

const testRecordsForAnalytics: DailyRecord[] = [
  makeRecord({ date: '2026-09-01', masu: { quantity: 2, unitPrice: 75 } }),
  makeRecord({ date: '2026-09-02', masu: { quantity: 2, unitPrice: 75 } }),
  makeRecord({ date: '2026-09-03', omelette: { quantity: 4, unitPrice: 30 } }),
  makeRecord({ date: '2026-09-04', morningFood: { eaten: false, price: 72 }, dinner: { eaten: false, price: 72 } }),
  makeRecord({ date: '2026-09-05', morningFood: { eaten: false, price: 72 }, dinner: { eaten: false, price: 72 } }),
];

const analytics = calculateMonthlyAnalytics(testRecordsForAnalytics);
assert(analytics.activeDaysCount === 5, `Analytics active days count is 5, got ${analytics.activeDaysCount}`);
assert(analytics.totalCost > 0, 'Analytics total cost calculated');
assert(analytics.averageDailyCost > 0, 'Analytics average daily cost calculated');
assert(analytics.counts.masuTotal === 4, `Analytics masu count is 4, got ${analytics.counts.masuTotal}`);
assert(analytics.counts.omeletteTotal === 4, `Analytics omelette count is 4, got ${analytics.counts.omeletteTotal}`);
assert(analytics.counts.skippedMeals === 4, `Analytics skipped meals count is 4, got ${analytics.counts.skippedMeals}`);

const masuBadge = analytics.badges.find(b => b.id === 'masu_lover');
assert(masuBadge !== undefined && masuBadge.isUnlocked === true, 'Masu Lover badge unlocked when masu >= 4');

const eggBadge = analytics.badges.find(b => b.id === 'egg_enthusiast');
assert(eggBadge !== undefined && eggBadge.isUnlocked === true, 'Omelette Fan badge unlocked when omelettes >= 4');

const budgetSaverBadge = analytics.badges.find(b => b.id === 'mess_saver');
assert(budgetSaverBadge !== undefined && budgetSaverBadge.isUnlocked === true, 'Budget Saver badge unlocked when skipped >= 4');

console.log('\n🎉 ALL WRC HOSTEL TEST CASES (PROFILE, NOTES, ANALYTICS, BADGES, REMINDERS) PASSED!\n');

