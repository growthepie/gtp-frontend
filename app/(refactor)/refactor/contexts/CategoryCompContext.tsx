"use client";
import React, {
  createContext,
  useMemo,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  CategoryComparisonResponse,
  Aggregated,
  AggregatedData,
  Subcategories,
} from "@/types/api/CategoryComparisonResponse";
import { BlockspaceURLs, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";

type CategoryContextType = {
  data: CategoryComparisonResponse;
  categories: { [key: string]: string };
};

const CategoryContext = createContext<CategoryContextType | null>(null);

export const CategoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data } = useSWR<CategoryComparisonResponse>(
    BlockspaceURLs["category-comparison"],
  );
  const { data: masterData, isLoading: masterLoading } =
    useSWR<MasterResponse>(MasterURL);

  const categories: { [key: string]: string } = useMemo(() => {
    if (masterData) {
      const result: { [key: string]: string } = {};

      result.categories = "Categories";
      const categoryKeys = Object.keys(
        masterData.blockspace_categories.main_categories,
      );

      // Remove "unlabeled" if present and store it for later
      const unlabeledIndex = categoryKeys.indexOf("unlabeled");
      let unlabeledCategory = "";
      if (unlabeledIndex !== -1) {
        unlabeledCategory = categoryKeys.splice(unlabeledIndex, 1)[0];
      }

      categoryKeys.forEach((key) => {
        const words =
          masterData.blockspace_categories.main_categories[key].split(" ");
        const formatted = words
          .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
        result[key] = formatted;
      });

      // Add "unlabeled" to the end if it was present
      if (unlabeledCategory) {
        const words =
          masterData.blockspace_categories.main_categories[
            unlabeledCategory
          ].split(" ");
        const formatted = words
          .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
        result[unlabeledCategory] = formatted;
      }

      return result;
    }

    return {};
  }, [masterData]);

  if (!data || !categories) {
    return <div>Loading...</div>;
  }

  return (
    <CategoryContext.Provider
      value={{
        data: data,
        categories: categories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const ctx = useContext(CategoryContext);

  if (!ctx) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }

  return ctx;
};
