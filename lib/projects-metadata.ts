import { unstable_noStore as noStore } from 'next/cache'; // Use noStore during the fetch itself
import { LabelsProjectsResponse } from '@/types/Labels/ProjectsResponse';
import { LabelsURLS } from '@/lib/urls';
import { NextResponse } from 'next/server';

// --- Project Data Type ---
type ProjectData = {
  displayName: string;
  description: string;
  mainGithub: string;
  twitter: string;
  website: string;
  logoPath: string;
  subCategory: string;
  mainCategory: string;
}


// --- Custom Cache Variables ---
let cachedMetadata: { [key: string]: ProjectData } | null = null;

// Store the timestamp (in milliseconds UTC) of the START of the cache validity window
// This will be the timestamp for 6:00 AM UTC of the day the data was fetched.
let cacheValidFromTimestamp: number = 0;

// --- Helper Function to Calculate Cache Window Start ---
/**
 * Calculates the timestamp (ms UTC) for 6:00 AM UTC on the current or previous day,
 * defining the start of the current validity window.
 */
function getUtcCacheWindowStart(): number {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-11
  const currentDay = now.getUTCDate(); // 1-31

  // Calculate 6:00 AM UTC for *today*
  const today6AM_UTC = Date.UTC(currentYear, currentMonth, currentDay, 6, 0, 0, 0);

  // If the current time is *before* 6:00 AM UTC today, the valid window started yesterday at 6:00 AM UTC.
  if (now.getTime() < today6AM_UTC) {
    // Calculate yesterday 6:00 AM UTC
    const yesterday = new Date(today6AM_UTC);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1); // Go back one day
    return yesterday.getTime(); // Return timestamp for yesterday 6:00 AM UTC
  } else {
    // Otherwise, the valid window started today at 6:00 AM UTC.
    return today6AM_UTC;
  }
}

// --- Fetch Function (modified slightly) ---
async function fetchAndProcessMetadata(): Promise<{ [key: string]: ProjectData }> {
  // Use noStore to ensure this specific fetch call isn't cached by Next.js fetch
  // We are handling the caching manually based on our custom time logic.
  noStore();

  console.log('Fetching fresh projects metadata from api...');
  const projectsData = await fetch(LabelsURLS.projectsFiltered).then((res) => res.json()) as LabelsProjectsResponse;

  const typesArr = projectsData.data.types;
  const ownerProjectIndex = typesArr.indexOf("owner_project");
  const displayNameIndex = typesArr.indexOf("display_name");
  const descriptionIndex = typesArr.indexOf("description");
  const mainGithubIndex = typesArr.indexOf("main_github");
  const twitterIndex = typesArr.indexOf("twitter");
  const websiteIndex = typesArr.indexOf("website");
  const logoPathIndex = typesArr.indexOf("logo_path");
  const subCategoryIndex = typesArr.indexOf("sub_category");
  const mainCategoryIndex = typesArr.indexOf("main_category");

  const ownerProjectToProjectData: { [key: string]: ProjectData } = projectsData.data.data.reduce((acc, project) => {
    acc[project[ownerProjectIndex]] = {
      displayName: project[displayNameIndex],
      description: project[descriptionIndex],
      mainGithub: project[mainGithubIndex],
      twitter: project[twitterIndex],
      website: project[websiteIndex],
      logoPath: project[logoPathIndex],
      subCategory: project[subCategoryIndex],
      mainCategory: project[mainCategoryIndex],
    };
    return acc;
  }, {});
  return ownerProjectToProjectData;

}

// --- Main Function to Get Metadata with Custom Cache Logic ---
export async function getAllProjectsMetadata(): Promise<{ [key: string]: ProjectData }> {
  const currentWindowStart = getUtcCacheWindowStart();

  // Check if cache exists AND if it's still valid for the current window
  if (cachedMetadata && cacheValidFromTimestamp === currentWindowStart) {
    console.log('Using cached metadata (valid from UTC 6:00 AM).');
    return cachedMetadata;
  }

  // If cache is missing or stale (belongs to a previous 6:00 AM window)
  console.log(`Cache stale or missing. Current window started at: ${new Date(currentWindowStart).toISOString()}`);
  const freshMetadata = await fetchAndProcessMetadata();

  // Update cache only if fetch was successful (returned non-empty map or handle appropriately)
  // You might want stricter checks here depending on how you handle Airtable errors
  if (Object.keys(freshMetadata).length > 0 || !cachedMetadata) { // Update if fetch is good, OR if cache was initially null
      cachedMetadata = freshMetadata;
      cacheValidFromTimestamp = currentWindowStart; // Set the validity start time for the new cache
      console.log(`Cache updated. Valid from: ${new Date(cacheValidFromTimestamp).toISOString()}`);
  } else if (cachedMetadata) {
      // Fetch failed, but we have old cache data. Log and potentially return the old data.
      console.warn("Failed to fetch fresh metadata, returning potentially stale cache.");
      return cachedMetadata;
  } else {
      // Fetch failed and there's no old cache.
      console.error("Failed to fetch fresh metadata and no previous cache exists.");
      // Return the empty map from the failed fetch attempt
      return freshMetadata;
  }


  return cachedMetadata; // Return the newly fetched (and cached) data or the stale cache if fetch failed
}