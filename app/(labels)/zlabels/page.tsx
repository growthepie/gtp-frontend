"use client";
import { DuckDBProvider } from "../DuckDBContext";
import { ProjectFilters } from "../ProjectFilters";
import { ProjectTable } from "../ProjectTable";

export default function LabelsPage() {
  return (
    <DuckDBProvider>
      <ProjectTable />
    </DuckDBProvider>
  );
}