const notificationTable = "tblA4NwUahsIldb6x";
const baseId = "appZWDvjvDmVnOici";
const CACHE_TTL_SECONDS = 1800; // 30 minutes
let cachedData = null;
let lastFetchTime = 0;

async function fetchData() {
  const url = `https://api.airtable.com/v0/${baseId}/${notificationTable}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error("Error response:", response);
      throw new Error(
        `Failed to fetch data: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    cachedData = data;
    lastFetchTime = Date.now();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function GET() {
  const currentTime = Date.now();

  // Check if data is cached and not expired
  if (cachedData && currentTime - lastFetchTime < CACHE_TTL_SECONDS * 1000) {
    return new Response(JSON.stringify(cachedData), {
      headers: { "content-type": "application/json" },
    });
  }

  // Fetch data if not cached or expired
  const result = await fetchData();

  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
