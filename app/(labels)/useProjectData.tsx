// hooks/useProjectData.ts
"use client";
import {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
} from "react";
import { useDuckDB } from "./DuckDBContext";

interface ProjectData {
  origin_key: string;
  address: string;
  owner_project: string;
  owner_project_clear: string;
  usage_category: string;
  display_name: string;
  description: string;
  txcount: number;
  txcount_change: number;
  gas_fees_usd: number;
  gas_fees_usd_change: number;
  daa: number;
  daa_change: number;
  sparkline: Array<{
    date: string;
    unix: number;
    txcount: number;
    gas_fees_usd: number;
    daa: number;
  }>;
}

interface ProjectDataContextType {
  data: ProjectData[] | null;
  isLoading: boolean;
  error: Error | null;
  // refetch: (filters?: Record<string, any>) => Promise<void>;
  filters: Record<string, any>;
  sort: Record<string, any>;
  updateFilters: (newFilters: Record<string, any>) => void;
  updateSort: (newSort: Record<string, any>) => void;
}

const ProjectDataContext = createContext<ProjectDataContextType>({
  data: null,
  isLoading: true,
  error: null,
  // refetch: () => Promise.resolve(),
  filters: {},
  sort: {},
  updateFilters: () => {},
  updateSort: () => {},
});

type ProjectDataProviderProps = {
  children: React.ReactNode;
};

export const ProjectDataProvider: React.FC<ProjectDataProviderProps> = ({
  children,
}) => {
  const { db, isLoading: isDBLoading, error: dbError } = useDuckDB();
  const [data, setData] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({
    origin_key: [],
    address: "",
    usage_category: [],
    owner_project: [],
  });
  const [sort, setSort] = useState<Record<string, any>>({});

  // console.log(`db: ${db}, isDBLoading: ${isDBLoading}, dbError: ${dbError}`);

  console.log("useProjectData::isLoading", isLoading);

  useEffect(() => {
    if (!db) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        //     let query = `
        //   SELECT
        //     f.origin_key,
        //     f.address,
        //     f.owner_project,
        //     f.owner_project_clear,
        //     f.usage_category,
        //     f.txcount,
        //     f.txcount_change,
        //     f.gas_fees_usd,
        //     f.gas_fees_usd_change,
        //     f.daa,
        //     f.daa_change,
        //     p.display_name,
        //     p.description,
        //     p.main_github,
        //     (
        //       SELECT json_group_array(json_object('date', s.date, 'txcount', s.txcount, 'gas_fees_usd', s.gas_fees_usd, 'daa', s.daa, 'unix', s.unix))
        //       FROM (
        //         SELECT date, unix, SUM(txcount) as txcount, SUM(gas_fees_usd) as gas_fees_usd, SUM(daa) as daa
        //         FROM 'sparkline.parquet' s
        //         WHERE s.address = f.address AND s.origin_key = f.origin_key
        //         GROUP BY date, unix
        //         ORDER BY date DESC
        //         LIMIT 30
        //       ) s
        //     ) as sparkline
        //   FROM 'full.parquet' f
        //   JOIN 'projects.parquet' p ON f.owner_project = p.owner_project
        // `;

        let query = `
      SELECT 
        origin_key,
        address,
        owner_project,
        owner_project_clear,
        usage_category,
        txcount,
        txcount_change,
        gas_fees_usd,
        gas_fees_usd_change,
        daa,
        daa_change,
        display_name, 
        description,
        main_github,
        sparkline
      FROM 'labels'
    `;

        const whereConditions: string[] = [];
        const sortConditions: string[] = [];
        const params: any[] = [];

        // filters
        if (filters.origin_key && filters.origin_key.length > 0) {
          whereConditions.push(
            `origin_key IN (${filters.origin_key.map(() => "?").join(",")})`,
          );
          params.push(...filters.origin_key);
        }

        if (filters.address) {
          whereConditions.push(`address LIKE ?`);
          params.push(`%${filters.address}%`);
        }

        if (filters.usage_category && filters.usage_category.length > 0) {
          whereConditions.push(
            `usage_category IN (${filters.usage_category
              .map(() => "?")
              .join(",")})`,
          );
          params.push(...filters.usage_category);
        }

        if (filters.owner_project && filters.owner_project.length > 0) {
          whereConditions.push(
            `owner_project IN (${filters.owner_project
              .map(() => "?")
              .join(",")})`,
          );
          params.push(...filters.owner_project);
        }

        // sorting
        const sortKeys = Object.keys(sort);
        if (sortKeys.length > 0) {
          sortKeys.forEach((key) => {
            sortConditions.push(`${key} ${sort[key]}`);
          });
        } else {
          sortConditions.push(`txcount DESC`);
        }

        // Apply where conditions
        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(" AND ")}`;
        }

        // Apply sorting
        if (sortConditions.length > 0) {
          query += ` ORDER BY ${sortConditions.join(", ")}`;
        }

        query += "";

        console.log("Query:", query, JSON.stringify(params));

        const conn = await db.connect();
        const statement = await conn.prepare(query);
        const result = await statement.query(...params);

        await conn.close();

        const d = result.toArray().map((row) => ({
          ...row,
          sparkline: JSON.parse(row.sparkline),
        }));

        console.log("Result:", d);

        setData(d);
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data"),
        );
        setIsLoading(false);
      }
    };

    fetchData();
  }, [db, filters, sort]);

  // useEffect(() => {
  //   if (!isDBLoading && !dbError) {
  //     fetchData();
  //   }
  // }, [fetchData, isDBLoading, dbError]);

  const updateFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const updateSort = (newSort: Record<string, any>) => {
    setSort(newSort);
  };

  return (
    <ProjectDataContext.Provider
      value={{
        data,
        isLoading,
        error,
        filters,
        sort,
        updateFilters,
        updateSort,
      }}
    >
      {children}
    </ProjectDataContext.Provider>
  );
};

export const useProjectData = () => useContext(ProjectDataContext);
