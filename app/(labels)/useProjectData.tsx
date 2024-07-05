// hooks/useProjectData.ts
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useDuckDB } from './DuckDBContext';

interface ProjectData {
  address: string;
  origin_key: string;
  owner_project: string;
  usage_category: string;
  display_name: string;
  description: string;
  txcount: number;
  gas_fees_usd: number;
  sparkline: Array<{ date: string; txcount: number }>;
}

interface UseProjectDataResult {
  data: ProjectData[] | null;
  isLoading: boolean;
  error: Error | null;
  // refetch: (filters?: Record<string, any>) => Promise<void>;
  updateFilters: (newFilters: Record<string, any>) => void;
}

export const useProjectData = (initialFilters?: Record<string, any>): UseProjectDataResult => {
  const { db, isLoading: isDBLoading, error: dbError } = useDuckDB();
  const [data, setData] = useState<ProjectData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});


  console.log(`db: ${db}, isDBLoading: ${isDBLoading}, dbError: ${dbError}`)

  const fetchData = useCallback(async () => {
    if (!db) return;

    setIsLoading(true);
    try {
      let query = `
      SELECT 
        f.address,
        f.origin_key,
        f.owner_project, 
        f.usage_category,
        p.display_name, 
        p.description, 
        f.txcount, 
        f.gas_fees_usd,
        (
          SELECT json_group_array(json_object('date', s.date, 'txcount', s.txcount))
          FROM (
            SELECT date, SUM(txcount) as txcount
            FROM read_parquet('sparkline.parquet') s
            WHERE s.address = f.address
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30
          ) s
        ) as sparkline
      FROM read_parquet('full.parquet') f
      JOIN read_parquet('projects.parquet') p ON f.owner_project = p.owner_project
      WHERE 1=1
    `;

      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.address) {
        whereConditions.push(`f.address LIKE ?`);
        params.push(`%${filters.address}%`);
      }

      if (filters.usage_category && filters.usage_category.length > 0) {
        whereConditions.push(`f.usage_category IN (${filters.usage_category.map(() => '?').join(',')})`);
        params.push(...filters.usage_category);
      }

      if (filters.owner_project && filters.owner_project.length > 0) {
        whereConditions.push(`f.owner_project IN (${filters.owner_project.map(() => '?').join(',')})`);
        params.push(...filters.owner_project);
      }

      if (whereConditions.length > 0) {
        query += ` AND ${whereConditions.join(' AND ')}`;
      }

      query += ' ORDER BY f.txcount DESC LIMIT 100';

      console.log('Query:', query, JSON.stringify(params));

      const conn = await db.connect();
      const statement = await conn.prepare(query);
      const result = await statement.query(...params);

      await conn.close();

      setData(result.toArray().map(row => ({
        ...row,
        sparkline: JSON.parse(row.sparkline)
      })));
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      setIsLoading(false);
    }
  }, [db, filters]);

  useEffect(() => {
    if (!isDBLoading && !dbError) {
      fetchData();
    }
  }, [fetchData, isDBLoading, dbError]);

  const updateFilters = (newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    data,
    isLoading: isDBLoading || isLoading,
    error: dbError || error,
    // refetch: fetchData,
    updateFilters,
  };
};