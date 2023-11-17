// import { ProjectsResponse } from "@/types/api/RetroPGF3";

const projectsURL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? `http://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`;

console.log("projectsURL", projectsURL);

const getProjects = async () => {
  console.log("projectsURL", projectsURL);
  const res = await fetch(projectsURL);
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return res.json();
};

export default async function Page() {
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
