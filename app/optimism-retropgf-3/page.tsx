// import { ProjectsResponse } from "@/types/api/RetroPGF3";

const projectsURL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? `http://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`;

console.log("projectsURL", projectsURL);

const getProjects = async () => {
  console.log("projectsURL", projectsURL);
  const response = await fetch(projectsURL);
  const projects = await response.json();

  return projects;
};

export default async function RetroPGF3Projects() {
  const projects = await getProjects();

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
