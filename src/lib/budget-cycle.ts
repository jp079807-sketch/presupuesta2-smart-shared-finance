// Budget cycle utilities for Presupuesta2
// Handles custom budget cycles based on user's start day

export interface BudgetCycle {
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  totalDays: number;
  progressPercentage: number;
}

/**
 * Calculate the current budget cycle based on the user's cycle start day
 * @param cycleStartDay - The day of the month the cycle starts (1-28)
 * @param referenceDate - Optional reference date (defaults to today)
 */
export function getCurrentCycle(cycleStartDay: number, referenceDate?: Date): BudgetCycle {
  const today = referenceDate || new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= cycleStartDay) {
    // Current cycle started this month
    startDate = new Date(currentYear, currentMonth, cycleStartDay);
    // Cycle ends on cycleStartDay - 1 of next month
    const nextMonth = currentMonth + 1;
    endDate = new Date(currentYear, nextMonth, cycleStartDay - 1);
  } else {
    // Current cycle started last month
    const prevMonth = currentMonth - 1;
    startDate = new Date(currentYear, prevMonth, cycleStartDay);
    endDate = new Date(currentYear, currentMonth, cycleStartDay - 1);
  }

  // Handle edge case: if cycleStartDay is 1, end date should be last day of previous month
  if (cycleStartDay === 1) {
    if (currentDay >= 1) {
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
    } else {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    }
  }

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysRemaining = Math.max(0, totalDays - daysPassed);
  const progressPercentage = Math.min(100, (daysPassed / totalDays) * 100);

  return {
    startDate,
    endDate,
    daysRemaining,
    totalDays,
    progressPercentage,
  };
}

/**
 * Format a date range for display
 */
export function formatCycleRange(cycle: BudgetCycle, locale = 'es-ES'): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const start = cycle.startDate.toLocaleDateString(locale, options);
  const end = cycle.endDate.toLocaleDateString(locale, options);
  return `${start} - ${end}`;
}

/**
 * Check if a date falls within a budget cycle
 */
export function isDateInCycle(date: Date, cycle: BudgetCycle): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = new Date(cycle.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(cycle.endDate);
  end.setHours(23, 59, 59, 999);
  
  return d >= start && d <= end;
}

/**
 * Get cycle dates formatted for database queries
 */
export function getCycleDateStrings(cycle: BudgetCycle): { startDate: string; endDate: string } {
  return {
    startDate: cycle.startDate.toISOString().split('T')[0],
    endDate: cycle.endDate.toISOString().split('T')[0],
  };
}
