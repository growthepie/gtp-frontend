// lib/quick-bites/authors.ts
//
// Centralised author profile registry. Enriches the per-article `author[]`
// (which only carries `name` + `xUsername`) with `description`, `jobTitle`,
// `image`, and additional `sameAs` URLs (LinkedIn, GitHub, personal site)
// so JSON-LD `Person` nodes carry full E-E-A-T signal without per-article
// duplication.
//
// Lookup is by lowercase `xUsername` first, then by lowercase `name`.

export type AuthorProfile = {
  name: string;
  xUsername?: string;
  description?: string;
  jobTitle?: string;
  image?: string;
  url?: string;
  sameAs?: string[];
};

export const AUTHORS: AuthorProfile[] = [
  {
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
    jobTitle: "Data Analyst",
    description:
      "Data analyst at growthepie focused on Ethereum L2 economics, stablecoins, and on-chain activity.",
    sameAs: ["https://www.linkedin.com/in/lorenz-lehmann/"],
  },
  {
    name: "Matthias Seidl",
    xUsername: "web3_data",
    jobTitle: "Co-founder & Data Lead",
    description:
      "Co-founder of growthepie. Builds the Ethereum ecosystem analytics that power the platform.",
    sameAs: ["https://www.linkedin.com/in/matthias-seidl/"],
  },
  {
    name: "Michael Eulenpfennig",
    xUsername: "MEulenpfennig",
    jobTitle: "Co-founder",
    description:
      "Co-founder of growthepie, focused on Ethereum scaling research and ecosystem outreach.",
    sameAs: ["https://www.linkedin.com/in/michael-eulenpfennig/"],
  },
  {
    name: "Tobias Schreier",
    xUsername: "tobschreier",
    jobTitle: "Co-founder & Engineering Lead",
    description:
      "Co-founder of growthepie. Leads engineering on the platform's data pipelines and visualizations.",
    sameAs: ["https://www.linkedin.com/in/tobias-schreier/"],
  },
];

const byHandle = new Map<string, AuthorProfile>();
const byName = new Map<string, AuthorProfile>();
for (const a of AUTHORS) {
  if (a.xUsername) byHandle.set(a.xUsername.toLowerCase(), a);
  byName.set(a.name.toLowerCase(), a);
}

export function lookupAuthor(opts: { xUsername?: string; name?: string }): AuthorProfile | undefined {
  if (opts.xUsername) {
    const hit = byHandle.get(opts.xUsername.toLowerCase());
    if (hit) return hit;
  }
  if (opts.name) {
    const hit = byName.get(opts.name.toLowerCase());
    if (hit) return hit;
  }
  return undefined;
}
