import { calculateDailyCost, aggregateMonthlySummary } from '../src/utils/billing';
import { isoToBS } from '../src/utils/nepaliDate';
import { DailyRecord } from '../src/types/canteen';

console.log('🧪 Starting WRC Hostel Canteen Tracker Test Suite...\n');

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Helper to make mock daily record
function makeRecord(overrides: Partial<DailyRecord> = {}): DailyRecord {
  return {
    date: '2026-09-12',
    morningFood: { eaten: true, price: 72 },
    dinner: { eaten: true, price: 72 },
    breakfast: { eaten: true, item: 'Chowmein', price: 50, isIncomplete: false },
    masu: { quantity: 0, unitPrice: 75 },
    omelette: { quantity: 0, unitPrice: 30 },
    createdAt: '2026-09-12T12:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
    isSaved: true,
    ...overrides,
  };
}

// Case 1: Normal Day
const case1 = makeRecord();
const res1 = calculateDailyCost(case1);
assert(res1.totalCost === 194, `Case 1 Normal Day: expected 194, got ${res1.totalCost}`);

// Case 2: Skip morning food
const case2 = makeRecord({
  morningFood: { eaten: false, price: 72 },
});
const res2 = calculateDailyCost(case2);
assert(res2.totalCost === 122, `Case 2 Skip Morning Food: expected 122, got ${res2.totalCost}`);

// Case 3: Multiple extras (Morning Food 72 + Breakfast Momo 100 + Dinner 72 + Masu 2 + Omelette 3)
const case3 = makeRecord({
  breakfast: { eaten: true, item: 'Momo', price: 100, isIncomplete: false },
  masu: { quantity: 2, unitPrice: 75 },
  omelette: { quantity: 3, unitPrice: 30 },
});
const res3 = calculateDailyCost(case3);
assert(res3.totalCost === 484, `Case 3 Multiple Extras: expected 484, got ${res3.totalCost}`);

// Case 4: No breakfast
const case4 = makeRecord({
  breakfast: { eaten: false, item: '', price: 0, isIncomplete: false },
});
const res4 = calculateDailyCost(case4);
assert(res4.breakfastCost === 0, `Case 4 Breakfast skipped cost: expected 0, got ${res4.breakfastCost}`);
assert(res4.totalCost === 144, `Case 4 Daily total: expected 144, got ${res4.totalCost}`);

// Case 5: Tea only
const case5 = makeRecord({
  breakfast: { eaten: true, item: 'Tea', price: 20, isIncomplete: false },
});
const res5 = calculateDailyCost(case5);
assert(res5.breakfastCost === 20, `Case 5 Tea cost: expected 20, got ${res5.breakfastCost}`);
assert(res5.totalCost === 164, `Case 5 Daily total: expected 164, got ${res5.totalCost}`);

// Incomplete record test
const caseIncomplete = makeRecord({
  breakfast: { eaten: true, item: '', price: 0, isIncomplete: true },
});
const resIncomplete = calculateDailyCost(caseIncomplete);
assert(resIncomplete.isIncomplete === true, 'Incomplete breakfast must be flagged');

// Case 6: Dynamic Custom Food Options (Milk quantity + Afternoon snack toggle)
const caseCustom = makeRecord({
  customItems: {
    opt_milk: {
      id: 'opt_milk',
      name: 'Milk',
      type: 'quantity',
      quantity: 2,
      price: 25,
    },
    opt_snack: {
      id: 'opt_snack',
      name: 'Afternoon Snack',
      type: 'toggle',
      eaten: true,
      price: 40,
    },
  },
});
const resCustom = calculateDailyCost(caseCustom);
// Base: 72 + 50 + 72 = 194. Milk: 2*25 = 50. Snack: 40. Total = 194 + 50 + 40 = 284
assert(resCustom.customItemsCost === 90, `Custom items cost expected 90, got ${resCustom.customItemsCost}`);
assert(resCustom.totalCost === 284, `Daily total with custom items expected 284, got ${resCustom.totalCost}`);

// Monthly Aggregation Test (including custom items)
const monthly = aggregateMonthlySummary([case1, case2, case3, case4, case5, caseIncomplete, caseCustom]);
assert(monthly.totalRecordsCount === 7, 'Monthly should count 7 records');
assert(monthly.incompleteRecordsCount === 1, 'Monthly should flag 1 incomplete record');
assert(monthly.masuTotalQuantity === 2, 'Monthly masu total count is 2');
assert(monthly.omeletteTotalQuantity === 3, 'Monthly omelette total count is 3');
assert(monthly.customItemsSummary['opt_milk']?.countOrQuantity === 2, 'Monthly milk count is 2');
assert(monthly.customItemsSummary['opt_milk']?.totalCost === 50, 'Monthly milk cost is 50');
assert(monthly.customItemsSummary['opt_snack']?.countOrQuantity === 1, 'Monthly snack count is 1');
assert(monthly.customItemsSummary['opt_snack']?.totalCost === 40, 'Monthly snack cost is 40');

// Bikram Sambat Conversion Test
const bs = isoToBS('2026-09-12');
assert(bs.year > 2080, `BS Year should be Bikram Sambat (> 2080), got ${bs.year}`);
assert(typeof bs.monthName === 'string' && bs.monthName.length > 0, `BS month name exists: ${bs.monthName}`);

console.log('\n🎉 ALL 10 WRC HOSTEL TEST CASES AND CUSTOM OPTION VALIDATIONS PASSED PERFECTLY!\n');
