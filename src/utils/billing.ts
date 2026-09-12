import { DailyRecord } from '../types/canteen';

export interface DailyCustomBreakdownItem {
  id: string;
  name: string;
  type: 'toggle' | 'quantity';
  cost: number;
  quantityOrEaten: number | boolean;
}

export interface DailyCostBreakdown {
  morningFoodCost: number;
  breakfastCost: number;
  dinnerCost: number;
  masuCost: number;
  omeletteCost: number;
  customItemsCost: number;
  customBreakdown: Record<string, DailyCustomBreakdownItem>;
  totalCost: number;
  isIncomplete: boolean;
}

/**
 * Pure calculation function for daily meal and extra item costs.
 * Source of truth: The prices recorded in the daily record itself.
 */
export function calculateDailyCost(record?: DailyRecord | null): DailyCostBreakdown {
  if (!record) {
    return {
      morningFoodCost: 0,
      breakfastCost: 0,
      dinnerCost: 0,
      masuCost: 0,
      omeletteCost: 0,
      customItemsCost: 0,
      customBreakdown: {},
      totalCost: 0,
      isIncomplete: false,
    };
  }

  const morningFoodCost = record.morningFood.eaten ? (record.morningFood.price || 0) : 0;
  const dinnerCost = record.dinner.eaten ? (record.dinner.price || 0) : 0;
  
  // Breakfast: if marked eaten, must have item and price.
  const isBreakfastIncomplete = Boolean(
    record.breakfast.eaten && (record.breakfast.isIncomplete || !record.breakfast.item || record.breakfast.price <= 0)
  );

  const breakfastCost = record.breakfast.eaten ? (record.breakfast.price || 0) : 0;

  // Extras: Masu and Omelette
  const masuQuantity = Math.max(0, record.masu.quantity || 0);
  const masuCost = masuQuantity * (record.masu.unitPrice || 0);

  const omeletteQuantity = Math.max(0, record.omelette.quantity || 0);
  const omeletteCost = omeletteQuantity * (record.omelette.unitPrice || 0);

  // Dynamic Custom Options
  let customItemsCost = 0;
  const customBreakdown: Record<string, DailyCustomBreakdownItem> = {};

  if (record.customItems) {
    for (const [id, item] of Object.entries(record.customItems)) {
      if (item.type === 'toggle') {
        const cost = item.eaten ? (item.price || 0) : 0;
        customItemsCost += cost;
        customBreakdown[id] = {
          id,
          name: item.name,
          type: 'toggle',
          cost,
          quantityOrEaten: Boolean(item.eaten),
        };
      } else {
        const qty = Math.max(0, item.quantity || 0);
        const cost = qty * (item.price || 0);
        customItemsCost += cost;
        customBreakdown[id] = {
          id,
          name: item.name,
          type: 'quantity',
          cost,
          quantityOrEaten: qty,
        };
      }
    }
  }

  const totalCost = morningFoodCost + breakfastCost + dinnerCost + masuCost + omeletteCost + customItemsCost;

  return {
    morningFoodCost,
    breakfastCost,
    dinnerCost,
    masuCost,
    omeletteCost,
    customItemsCost,
    customBreakdown,
    totalCost,
    isIncomplete: isBreakfastIncomplete,
  };
}

export interface MonthlyCustomItemSummary {
  id: string;
  name: string;
  type: 'toggle' | 'quantity';
  countOrQuantity: number;
  totalCost: number;
}

export interface MonthlyAggregatedSummary {
  totalRecordsCount: number;
  incompleteRecordsCount: number;
  totalAmount: number;

  morningFoodDays: number;
  morningFoodTotalCost: number;

  breakfastDays: number;
  breakfastTotalCost: number;

  dinnerDays: number;
  dinnerTotalCost: number;

  masuTotalQuantity: number;
  masuTotalCost: number;

  omeletteTotalQuantity: number;
  omeletteTotalCost: number;

  customItemsSummary: Record<string, MonthlyCustomItemSummary>;

  dailyBreakdowns: Array<{
    date: string;
    record: DailyRecord;
    breakdown: DailyCostBreakdown;
  }>;
}

/**
 * Aggregates a list of daily records for a given period.
 */
export function aggregateMonthlySummary(recordsList: DailyRecord[]): MonthlyAggregatedSummary {
  const summary: MonthlyAggregatedSummary = {
    totalRecordsCount: recordsList.length,
    incompleteRecordsCount: 0,
    totalAmount: 0,
    morningFoodDays: 0,
    morningFoodTotalCost: 0,
    breakfastDays: 0,
    breakfastTotalCost: 0,
    dinnerDays: 0,
    dinnerTotalCost: 0,
    masuTotalQuantity: 0,
    masuTotalCost: 0,
    omeletteTotalQuantity: 0,
    omeletteTotalCost: 0,
    customItemsSummary: {},
    dailyBreakdowns: [],
  };

  // Sort ascending by ISO date
  const sorted = [...recordsList].sort((a, b) => a.date.localeCompare(b.date));

  for (const record of sorted) {
    const breakdown = calculateDailyCost(record);
    if (breakdown.isIncomplete) {
      summary.incompleteRecordsCount += 1;
    }

    if (record.morningFood.eaten) {
      summary.morningFoodDays += 1;
      summary.morningFoodTotalCost += breakdown.morningFoodCost;
    }

    if (record.breakfast.eaten) {
      summary.breakfastDays += 1;
      summary.breakfastTotalCost += breakdown.breakfastCost;
    }

    if (record.dinner.eaten) {
      summary.dinnerDays += 1;
      summary.dinnerTotalCost += breakdown.dinnerCost;
    }

    if (record.masu.quantity > 0) {
      summary.masuTotalQuantity += record.masu.quantity;
      summary.masuTotalCost += breakdown.masuCost;
    }

    if (record.omelette.quantity > 0) {
      summary.omeletteTotalQuantity += record.omelette.quantity;
      summary.omeletteTotalCost += breakdown.omeletteCost;
    }

    // Process custom items for monthly aggregation
    for (const [id, item] of Object.entries(breakdown.customBreakdown)) {
      if (!summary.customItemsSummary[id]) {
        summary.customItemsSummary[id] = {
          id,
          name: item.name,
          type: item.type,
          countOrQuantity: 0,
          totalCost: 0,
        };
      }

      if (item.type === 'toggle' && item.quantityOrEaten) {
        summary.customItemsSummary[id].countOrQuantity += 1;
        summary.customItemsSummary[id].totalCost += item.cost;
      } else if (item.type === 'quantity' && typeof item.quantityOrEaten === 'number' && item.quantityOrEaten > 0) {
        summary.customItemsSummary[id].countOrQuantity += item.quantityOrEaten;
        summary.customItemsSummary[id].totalCost += item.cost;
      }
    }

    summary.totalAmount += breakdown.totalCost;

    summary.dailyBreakdowns.push({
      date: record.date,
      record,
      breakdown,
    });
  }

  return summary;
}
