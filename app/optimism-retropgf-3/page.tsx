const getProjects = async () => {
  console.log("process.env.NEXT_PUBLIC_VERCEL_URL", process.env.NEXT_PUBLIC_VERCEL_URL)
  const res = await fetch(process.env.NEXT_PUBLIC_VERCEL_URL + "/api/optimism-retropgf-3/projects",
    // {
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Accept": "application/json",
    //     'Accept-Encoding': 'br',
    //   }
    // }
  );
  const data = await res.json();

  console.log(data);

  return data;
}

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