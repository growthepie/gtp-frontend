#!/usr/bin/env node
// scripts/generate-qb-mtimes.mjs
//
// Generates lib/quick-bites/_mtimes.generated.json — a map of quick-bite slug
// → ISO timestamp of the most recent git commit that touched the per-article
// source file. Used by articleProcessor to populate JSON-LD `dateModified`
// so freshness reflects actual edits rather than the original `date` field.
//
// Runs as a prebuild step. Vercel deploys include the .git directory in the
// build environment, so `git log` works there. If git fails (e.g. shallow
// clone), we fall back to file mtime, then to "now". Build never errors out.

import { execSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QB_DIR = join(__dirname, "..", "lib", "quick-bites");
const INDEX_FILE = join(QB_DIR, "index.ts");
const OUT = join(QB_DIR, "_mtimes.generated.json");

// Parse lib/quick-bites/index.ts to map: slug → source filename.
// `index.ts` shape:
//   import StablecoinFiat from './qb-stablecoin-fiat';
//   const QUICK_BITES_DATA = { "stablecoins-for-fiat": StablecoinFiat, ... }
const buildSlugToFile = (src) => {
  const importRe = /import\s+(\w+)\s+from\s+['"]\.\/(qb-[a-z0-9-]+)['"]/gi;
  const idToFile = new Map();
  for (const m of src.matchAll(importRe)) idToFile.set(m[1], `${m[2]}.ts`);

  const mapRe = /"([^"]+)"\s*:\s*(\w+)\s*,/g;
  const slugToFile = {};
  for (const m of src.matchAll(mapRe)) {
    const file = idToFile.get(m[2]);
    if (file) slugToFile[m[1]] = file;
  }
  return slugToFile;
};

const gitTimestamp = (filePath) => {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
};

const fileTimestamp = (filePath) => {
  try {
    return new Date(statSync(filePath).mtime).toISOString();
  } catch {
    return null;
  }
};

const main = () => {
  const map = {};
  let slugToFile = {};
  try {
    slugToFile = buildSlugToFile(readFileSync(INDEX_FILE, "utf8"));
  } catch (e) {
    console.warn(`[qb-mtimes] cannot parse ${INDEX_FILE}:`, e.message);
    writeFileSync(OUT, "{}\n");
    return;
  }

  for (const [slug, file] of Object.entries(slugToFile)) {
    const filePath = join(QB_DIR, file);
    const ts = gitTimestamp(filePath) || fileTimestamp(filePath);
    if (ts) map[slug] = ts;
  }

  writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
  console.log(`[qb-mtimes] wrote ${Object.keys(map).length} entries → ${OUT}`);
};

main();
