"use client";
import React, { useState } from 'react';

interface FilterProps {
  onFilterChange: (filters: Record<string, any>) => void;
  categories: string[];
  projects: string[];
}

export const ProjectFilters: React.FC<FilterProps> = ({ onFilterChange, categories, projects }) => {
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    updateFilters({ address: e.target.value });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    updateFilters({ usage_category: selectedCategories });
  };

  const handleProjectToggle = (project: string) => {
    setSelectedProjects(prev =>
      prev.includes(project)
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
    updateFilters({ owner_project: selectedProjects });
  };

  const updateFilters = (newFilters: Record<string, any>) => {
    onFilterChange({
      address: address,
      usage_category: selectedCategories,
      owner_project: selectedProjects,
      ...newFilters
    });
  };

  return (
    <div>
      <input
        type="text"
        value={address}
        onChange={handleAddressChange}
        placeholder="Filter by address"
      />
      <div>
        {categories && categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryToggle(category)}
            style={{ backgroundColor: selectedCategories.includes(category) ? 'lightblue' : 'white' }}
          >
            {category}
          </button>
        ))}
      </div>
      <div>
        {projects && projects.map(project => (
          <button
            key={project}
            onClick={() => handleProjectToggle(project)}
            style={{ backgroundColor: selectedProjects.includes(project) ? 'lightblue' : 'white' }}
          >
            {project}
          </button>
        ))}
      </div>
    </div>
  );
};