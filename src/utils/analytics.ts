import { DailyRecord } from '../types/canteen';
import { calculateDailyCost } from './billing';

export interface HostelBadge {
  id: string;
  icon: string;
  title: string;
  description: string;
  isUnlocked: boolean;
}

export interface MonthlyAnalyticsBreakdown {
  totalCost: number;
  activeDaysCount: number;
  averageDailyCost: number;
  highestCostDay: { date: string; cost: number } | null;

  morningCost: number;
  dinnerCost: number;
  breakfastCost: number;
  extrasCost: number;

  morningPercent: number;
  dinnerPercent: number;
  breakfastPercent: number;
  extrasPercent: number;

  counts: {
    morningEaten: number;
    dinnerEaten: number;
    breakfastEaten: number;
    masuTotal: number;
    omeletteTotal: number;
    skippedMeals: number;
  };

  badges: HostelBadge[];
}

export function calculateMonthlyAnalytics(records: DailyRecord[]): MonthlyAnalyticsBreakdown {
  let totalCost = 0;
  let morningCost = 0;
  let dinnerCost = 0;
  let breakfastCost = 0;
  let extrasCost = 0;

  let morningEaten = 0;
  let dinnerEaten = 0;
  let breakfastEaten = 0;
  let masuTotal = 0;
  let omeletteTotal = 0;
  let skippedMeals = 0;

  let highestCostDay: { date: string; cost: number } | null = null;
  let activeDaysCount = 0;

  for (const record of records) {
    if (!record.isSaved) continue;

    activeDaysCount += 1;
    const daily = calculateDailyCost(record);
    totalCost += daily.totalCost;

    if (!highestCostDay || daily.totalCost > highestCostDay.cost) {
      highestCostDay = { date: record.date, cost: daily.totalCost };
    }

    morningCost += daily.morningFoodCost;
    dinnerCost += daily.dinnerCost;
    breakfastCost += daily.breakfastCost;
    extrasCost += daily.masuCost + daily.omeletteCost + daily.customItemsCost;

    if (record.morningFood.eaten) {
      morningEaten += 1;
    } else {
      skippedMeals += 1;
    }

    if (record.dinner.eaten) {
      dinnerEaten += 1;
    } else {
      skippedMeals += 1;
    }

    if (record.breakfast.eaten) {
      breakfastEaten += 1;
    }

    masuTotal += record.masu.quantity || 0;
    omeletteTotal += record.omelette.quantity || 0;
  }

  const averageDailyCost = activeDaysCount > 0 ? Math.round(totalCost / activeDaysCount) : 0;

  const safeTotal = totalCost > 0 ? totalCost : 1;
  const morningPercent = totalCost > 0 ? Math.round((morningCost / safeTotal) * 100) : 0;
  const dinnerPercent = totalCost > 0 ? Math.round((dinnerCost / safeTotal) * 100) : 0;
  const breakfastPercent = totalCost > 0 ? Math.round((breakfastCost / safeTotal) * 100) : 0;
  const extrasPercent = totalCost > 0 ? Math.max(0, 100 - (morningPercent + dinnerPercent + breakfastPercent)) : 0;

  // Compute hostel badges
  const badges: HostelBadge[] = [
    {
      id: 'masu_lover',
      icon: '🍗',
      title: 'Masu Lover',
      description: 'Ate non-veg masu 4+ times this month',
      isUnlocked: masuTotal >= 4,
    },
    {
      id: 'egg_enthusiast',
      icon: '🍳',
      title: 'Omelette Fan',
      description: 'Powered up with 4+ omelettes',
      isUnlocked: omeletteTotal >= 4,
    },
    {
      id: 'morning_regular',
      icon: '🌅',
      title: 'Morning Regular',
      description: 'Eaten morning food on 85%+ active days',
      isUnlocked: activeDaysCount >= 5 && (morningEaten / activeDaysCount) >= 0.85,
    },
    {
      id: 'dinner_regular',
      icon: '🌙',
      title: 'Night Kitchen Loyal',
      description: 'Eaten dinner on 85%+ active days',
      isUnlocked: activeDaysCount >= 5 && (dinnerEaten / activeDaysCount) >= 0.85,
    },
    {
      id: 'breakfast_king',
      icon: '🥐',
      title: 'Breakfast Connoisseur',
      description: 'Recorded morning breakfast 6+ times',
      isUnlocked: breakfastEaten >= 6,
    },
    {
      id: 'mess_saver',
      icon: '💰',
      title: 'Budget Saver',
      description: 'Skipped 4+ meals when eating outside or away',
      isUnlocked: skippedMeals >= 4,
    },
    {
      id: 'ledger_master',
      icon: '👑',
      title: 'Ledger Master',
      description: 'Logged 12+ days with precision this month',
      isUnlocked: activeDaysCount >= 12,
    },
  ];

  return {
    totalCost,
    activeDaysCount,
    averageDailyCost,
    highestCostDay,
    morningCost,
    dinnerCost,
    breakfastCost,
    extrasCost,
    morningPercent,
    dinnerPercent,
    breakfastPercent,
    extrasPercent,
    counts: {
      morningEaten,
      dinnerEaten,
      breakfastEaten,
      masuTotal,
      omeletteTotal,
      skippedMeals,
    },
    badges,
  };
}
