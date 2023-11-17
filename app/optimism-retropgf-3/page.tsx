import { ProjectsResponse } from "@/types/api/RetroPGF3";

const URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? `http://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`;

const getProjects = async (): Promise<ProjectsResponse> => {
  console.log("URL", URL);
  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  return data;
};

export default async function RetroPGF3Projects() {
  //const projects = await getProjects();

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {/* {projects.map((project) => (
          <li key={project.id}>{project.id}</li>
        ))} */}
        {/* <li>{projects && JSON.stringify(projects)}</li> */}
      </ul>
    </div>
  );
}
