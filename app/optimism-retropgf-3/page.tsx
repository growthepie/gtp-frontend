"use client";
import { ProjectsResponse } from "@/types/api/RetroPGF3";
import useSWR from "swr";

const baseURL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;

export default function Page() {
  const {
    data: projects,
    isLoading,
    isValidating,
  } = useSWR<ProjectsResponse>(baseURL + "/api/optimism-retropgf-3/projects", {
    refreshInterval: 300,
  });

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {/* {projects.map((project) => (
          <li key={project.id}>{project.id}</li>
        ))} */}
        <li>{projects && JSON.stringify(projects)}</li>
      </ul>
    </div>
  );
}
