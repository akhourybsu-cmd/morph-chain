// MEASURED - Category Balancing System
// Ensures diversity in daily puzzle categories

export interface CategoryPressure {
  category: string;
  lastUsedDate: string | null;
  usage7d: number;
  usage30d: number;
  pressure: 'low' | 'medium' | 'high' | 'blocked';
  reason?: string;
}

export interface CategoryUsage {
  category: string;
  last_used_date: string | null;
  usage_count_7d: number;
  usage_count_30d: number;
}

/**
 * Calculate pressure level for a category
 * Rules:
 * - Same category cannot be used 2 days in a row → blocked
 * - Category used 2+ times in 7 days → high pressure
 * - Category used 4+ times in 30 days → medium pressure
 * - Otherwise → low pressure (preferred)
 */
export function calculateCategoryPressure(
  usage: CategoryUsage,
  targetDate: string
): CategoryPressure {
  const targetDateObj = new Date(targetDate);
  const yesterday = new Date(targetDateObj);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if used yesterday (blocked)
  if (usage.last_used_date === yesterdayStr) {
    return {
      category: usage.category,
      lastUsedDate: usage.last_used_date,
      usage7d: usage.usage_count_7d,
      usage30d: usage.usage_count_30d,
      pressure: 'blocked',
      reason: 'Used yesterday - cannot repeat consecutive days'
    };
  }

  // Check 7-day usage (high pressure if 2+)
  if (usage.usage_count_7d >= 2) {
    return {
      category: usage.category,
      lastUsedDate: usage.last_used_date,
      usage7d: usage.usage_count_7d,
      usage30d: usage.usage_count_30d,
      pressure: 'high',
      reason: `Used ${usage.usage_count_7d} times in last 7 days`
    };
  }

  // Check 30-day usage (medium pressure if 4+)
  if (usage.usage_count_30d >= 4) {
    return {
      category: usage.category,
      lastUsedDate: usage.last_used_date,
      usage7d: usage.usage_count_7d,
      usage30d: usage.usage_count_30d,
      pressure: 'medium',
      reason: `Used ${usage.usage_count_30d} times in last 30 days`
    };
  }

  // Low pressure - preferred
  return {
    category: usage.category,
    lastUsedDate: usage.last_used_date,
    usage7d: usage.usage_count_7d,
    usage30d: usage.usage_count_30d,
    pressure: 'low',
    reason: 'Available - good diversity'
  };
}

/**
 * Get all category pressures for a target date
 */
export function getAllCategoryPressures(
  usages: CategoryUsage[],
  targetDate: string
): CategoryPressure[] {
  return usages
    .map(usage => calculateCategoryPressure(usage, targetDate))
    .sort((a, b) => {
      // Sort by pressure level (low first)
      const pressureOrder = { low: 0, medium: 1, high: 2, blocked: 3 };
      return pressureOrder[a.pressure] - pressureOrder[b.pressure];
    });
}

/**
 * Get preferred categories (low pressure first)
 */
export function getPreferredCategories(
  usages: CategoryUsage[],
  targetDate: string
): string[] {
  const pressures = getAllCategoryPressures(usages, targetDate);
  return pressures
    .filter(p => p.pressure !== 'blocked')
    .map(p => p.category);
}

/**
 * Check if a category is allowed for a specific date
 */
export function isCategoryAllowed(
  category: string,
  usages: CategoryUsage[],
  targetDate: string
): { allowed: boolean; reason: string } {
  const usage = usages.find(u => u.category === category);
  
  if (!usage) {
    return { allowed: true, reason: 'New category - no usage history' };
  }

  const pressure = calculateCategoryPressure(usage, targetDate);
  
  if (pressure.pressure === 'blocked') {
    return { allowed: false, reason: pressure.reason || 'Category blocked' };
  }

  return { 
    allowed: true, 
    reason: pressure.reason || 'Category available'
  };
}

/**
 * Get pressure badge color for UI display
 */
export function getPressureColor(pressure: CategoryPressure['pressure']): string {
  switch (pressure) {
    case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    case 'blocked': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  }
}

/**
 * Get pressure icon for UI display
 */
export function getPressureIcon(pressure: CategoryPressure['pressure']): string {
  switch (pressure) {
    case 'low': return '✓';
    case 'medium': return '⚠';
    case 'high': return '⚡';
    case 'blocked': return '✕';
  }
}

/**
 * Fetch category pressure from database
 */
export async function getCategoryPressure(): Promise<CategoryPressure[]> {
  const { supabase } = await import('@/integrations/supabase/client');
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('measured_category_usage')
    .select('*');
  
  if (error || !data) {
    console.error('Failed to load category usage:', error);
    return [];
  }
  
  const usages: CategoryUsage[] = data.map(d => ({
    category: d.category,
    last_used_date: d.last_used_date,
    usage_count_7d: d.usage_count_7d,
    usage_count_30d: d.usage_count_30d,
  }));
  
  return getAllCategoryPressures(usages, today);
}
