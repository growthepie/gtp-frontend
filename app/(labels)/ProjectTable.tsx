"use client";
import React, { useMemo } from 'react';
import { useProjectData } from './useProjectData';
import { ProjectFilters } from './ProjectFilters';

export const ProjectTable: React.FC = () => {
  const { data, isLoading, error, updateFilters } = useProjectData();

  const categories = useMemo(() =>
    [...new Set(data?.map(project => project.usage_category) ?? [])],
    [data]
  );

  const projects = useMemo(() =>
    [...new Set(data?.map(project => project.owner_project) ?? [])],
    [data]
  );


  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error.message}</div>;

  return (
    <div className='select-auto'>
      <ProjectFilters
        onFilterChange={updateFilters}
        categories={categories}
        projects={projects}
      />
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {!data && <div>No data</div>}
      {data && data.length === 0 && <div>No results</div>}
      {data && data.length > 0 && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Origin Key</th>
                <th>Project</th>
                <th>Category</th>
                <th>Description</th>
                <th>Transaction Count</th>
                <th>Gas Fees (USD)</th>
                <th>Sparkline</th>
              </tr>
            </thead>
            <tbody>
              {data.map(project => (
                <tr key={`${project.address}-${project.origin_key}`}>
                  <td>{project.address}</td>
                  <td>{project.origin_key}</td>
                  <td>{project.display_name}</td>
                  <td>{project.usage_category}</td>
                  <td>{project.description}</td>
                  <td>{project.txcount}</td>
                  <td>{project.gas_fees_usd.toFixed(2)}</td>
                  <td>
                    {/* Implement your sparkline visualization here */}
                    {Object.keys(project.sparkline).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};