// Types
export enum SortType {
  NUMBER = "number",
  STRING = "string",
  STRING_ARRAY = "stringArray",
  DATE = "date",
  BOOLEAN = "boolean",
  VERSION = "version",     // For semantic versioning
  MIXED_ARRAY = "mixedArray"  // For arrays containing different types
}

export type SortOrder = "asc" | "desc";

export type SortMetric<T> = keyof T;

export type SortConfig<T> = {
  metric: SortMetric<T>;
  sortOrder: SortOrder;
  type: SortType;
  /**
   * Optional function to access nested or computed values
   * @param item The current item being sorted
   * @param metric The metric key to sort by
   * @returns The value to use for sorting
   */
  valueAccessor?: (item: T, metric: SortMetric<T>) => any;
  mixedArrayConfig?: {
    /**
     * Defines the priority order of different types when sorting mixed arrays
     * Types listed first have higher priority
     */
    priorityOrder: SortType[];
  };
};

// Utility functions for different sort types
const sortNumber = (a: number | null | undefined, b: number | null | undefined, sortOrder: SortOrder): number => {
  if (!a && !b) return 0;
  if (!a || a === Infinity) return 1;
  if (!b || b === Infinity) return -1;
  
  return sortOrder === "asc" ? a - b : b - a;
};

const sortString = (a: string | null | undefined, b: string | null | undefined, sortOrder: SortOrder): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  
  return sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a);
};

const sortStringArray = (a: string[], b: string[], sortOrder: SortOrder): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // First sort by length
  const lengthDiff = sortOrder === "asc" 
    ? a.length - b.length 
    : b.length - a.length;
  
  if (lengthDiff !== 0) return lengthDiff;

  // If lengths are equal, sort alphabetically by comparing joined sorted arrays
  const aSorted = [...a].sort().join(',');
  const bSorted = [...b].sort().join(',');
  
  return sortOrder === "asc" 
    ? aSorted.localeCompare(bSorted)
    : bSorted.localeCompare(aSorted);
};

const sortDate = (a: Date | string | null | undefined, b: Date | string | null | undefined, sortOrder: SortOrder): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const dateA = a instanceof Date ? a : new Date(a);
  const dateB = b instanceof Date ? b : new Date(b);
  
  return sortOrder === "asc" 
    ? dateA.getTime() - dateB.getTime()
    : dateB.getTime() - dateA.getTime();
};

const sortBoolean = (a: boolean | null | undefined, b: boolean | null | undefined, sortOrder: SortOrder): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const aNum = a ? 1 : 0;
  const bNum = b ? 1 : 0;
  
  return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
};

const sortVersion = (a: string | null | undefined, b: string | null | undefined, sortOrder: SortOrder): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // Validate version string format
  const isValidVersion = (v: string) => /^\d+(\.\d+)*$/.test(v);
  if (!isValidVersion(a) || !isValidVersion(b)) {
    throw new Error(`Invalid version format. Expected format: x.y.z (e.g., 1.2.3). Got: ${!isValidVersion(a) ? a : b}`);
  }

  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    
    if (aVal !== bVal) {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
  }
  
  return 0;
};

const sortMixedArray = (
  a: any[],
  b: any[],
  sortOrder: SortOrder,
  priorityOrder: SortType[]
): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // First sort by type priority
  const getTypeIndex = (val: any): number => {
    if (typeof val === 'number') return priorityOrder.indexOf(SortType.NUMBER);
    if (typeof val === 'string') return priorityOrder.indexOf(SortType.STRING);
    if (typeof val === 'boolean') return priorityOrder.indexOf(SortType.BOOLEAN);
    if (val instanceof Date) return priorityOrder.indexOf(SortType.DATE);
    if (Array.isArray(val)) return priorityOrder.indexOf(SortType.STRING_ARRAY);
    return Infinity;
  };

  const aTypeIndex = Math.min(...a.map(getTypeIndex));
  const bTypeIndex = Math.min(...b.map(getTypeIndex));

  if (aTypeIndex !== bTypeIndex) {
    return sortOrder === "asc" ? aTypeIndex - bTypeIndex : bTypeIndex - aTypeIndex;
  }

  // If same type priority, sort by length
  if (a.length !== b.length) {
    return sortOrder === "asc" ? a.length - b.length : b.length - a.length;
  }

  // If same length, sort by values
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    const type = typeof aVal;

    if (type !== typeof bVal) continue;

    let comparison = 0;
    switch (type) {
      case 'number':
        comparison = sortNumber(aVal, bVal, sortOrder);
        break;
      case 'string':
        comparison = sortString(aVal, bVal, sortOrder);
        break;
      case 'boolean':
        comparison = sortBoolean(aVal, bVal, sortOrder);
        break;
    }

    if (comparison !== 0) return comparison;
  }

  return 0;
};

/**
 * Sorts an array of items based on the provided configuration.
 * @param items The array of items to sort
 * @param config The sorting configuration including metric, order, and type
 * @returns A new sorted array of items
 * @throws {Error} If valueAccessor throws or if invalid data is provided
 */
export const sortItems = <T extends Record<string, any>>(
  items: T[],
  config: SortConfig<T>
): T[] => {
  type MetricType = SortMetric<T>;
  const { metric, sortOrder, type, valueAccessor, mixedArrayConfig } = config;

  // Validate inputs
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  if (type === SortType.MIXED_ARRAY && !mixedArrayConfig?.priorityOrder?.length) {
    throw new Error('Priority order must be provided for mixed array sorting');
  }

  return [...items].sort((a, b) => {
    let aVal = valueAccessor ? valueAccessor(a, metric) : a[metric];
    let bVal = valueAccessor ? valueAccessor(b, metric) : b[metric];

    switch (type) {
      case SortType.NUMBER:
        return sortNumber(aVal, bVal, sortOrder);
      case SortType.STRING:
        return sortString(aVal, bVal, sortOrder);
      case SortType.STRING_ARRAY:
        if (Array.isArray(aVal) && Array.isArray(bVal)) {
          return sortStringArray(aVal, bVal, sortOrder);
        }
        return 0;
      case SortType.DATE:
        return sortDate(aVal, bVal, sortOrder);
      case SortType.BOOLEAN:
        return sortBoolean(aVal, bVal, sortOrder);
      case SortType.VERSION:
        return sortVersion(aVal, bVal, sortOrder);
      case SortType.MIXED_ARRAY:
        if (Array.isArray(aVal) && Array.isArray(bVal) && mixedArrayConfig?.priorityOrder) {
          return sortMixedArray(aVal, bVal, sortOrder, mixedArrayConfig.priorityOrder);
        }
        return 0;
      default:
        return 0;
    }
  });
};