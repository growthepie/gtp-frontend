// Data access for the blockspace category-comparison view, using the split
// files only (no fallback to the combined category_comparison.json — that file
// is being retired, so this path must stand on its own).
//
// Two layers, both backed by SWR (so fetches dedupe across the page and the
// CategoryMetrics component that both call these hooks):
//
//   useCategoryComparisonIndex()
//     Loads the lightweight split `index.json` (main categories + their
//     subcategory lists) — enough to render the category menu and size the
//     layout without downloading any timeseries.
//
//   useCategoryComparisonCategory(category, index)
//     Loads the heavy per-category file on demand for the *selected* category
//     only, recomputing `daily_7d_rolling` from `daily` (see
//     lib/blockspace/categoryComparison) when the backend has dropped it.
//
// All heavy reads in the view are scoped to the selected category, so loading
// one category file at a time is sufficient.

import { useMemo } from "react";
import useSWR from "swr";
import { CategoryComparisonSplitURLs } from "@/lib/urls";
import { ensureRolling7d, RollingNode } from "@/lib/blockspace/categoryComparison";

type SplitIndexFile = {
  data?: Record<string, { type?: string; subcategories?: string[] }>;
};

type PerCategoryFile = { data?: Record<string, RollingNode> };

export type CategoryComparisonIndex = {
  ready: boolean;
  error: unknown;
  isValidating: boolean;
  // Main categories in publish order, plus each one's subcategory list.
  categoryList: string[];
  subcategoryLists: Record<string, string[]>;
};

export function useCategoryComparisonIndex(): CategoryComparisonIndex {
  const {
    data: indexFile,
    error,
    isValidating,
  } = useSWR<SplitIndexFile>(CategoryComparisonSplitURLs.index);

  return useMemo<CategoryComparisonIndex>(() => {
    if (indexFile?.data) {
      const entries = indexFile.data;
      const categoryList = Object.keys(entries);
      const subcategoryLists: Record<string, string[]> = {};
      for (const cat of categoryList) {
        subcategoryLists[cat] = entries[cat]?.subcategories ?? [];
      }
      return {
        ready: true,
        error: undefined,
        isValidating,
        categoryList,
        subcategoryLists,
      };
    }

    return {
      ready: false,
      error,
      isValidating,
      categoryList: [],
      subcategoryLists: {},
    };
  }, [indexFile, error, isValidating]);
}

export type SelectedCategory = {
  node: RollingNode | undefined;
  isLoading: boolean;
  error: unknown;
};

export function useCategoryComparisonCategory(
  category: string | null | undefined,
  index: CategoryComparisonIndex,
): SelectedCategory {
  // Fetch the per-category file only once the index is ready and a real
  // category is selected.
  const { data: file, error } = useSWR<PerCategoryFile>(
    index.ready && category
      ? CategoryComparisonSplitURLs.category(category)
      : null,
  );

  return useMemo<SelectedCategory>(() => {
    if (!category) return { node: undefined, isLoading: false, error: undefined };
    if (!index.ready) return { node: undefined, isLoading: true, error: undefined };

    const raw = file?.data?.[category];
    return {
      node: raw ? ensureRolling7d(raw) : undefined,
      isLoading: !file && !error,
      error,
    };
  }, [category, index.ready, file, error]);
}
