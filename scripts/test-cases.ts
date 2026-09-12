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

console.log('\n🎉 ALL WRC HOSTEL TEST CASES INCLUDING MULTI-CHOICE OPTIONS & NOT-EATEN DEFAULTS PASSED!\n');
