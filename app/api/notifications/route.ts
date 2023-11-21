const notificationTable = "tblA4NwUahsIldb6x";
const baseId = "appZWDvjvDmVnOici";
const table = "tblU8WV0sxYUz6Kcp";
const CACHE_TTL_SECONDS = 1800; // 30 minutes

async function fetchData() {
  const url = `https://api.airtable.com/v0/${baseId}/${notificationTable}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Cache-Control": "max-age=" + CACHE_TTL_SECONDS,
      },
    });

    if (!response.ok) {
      console.error("Error response:", response);
      throw new Error(
        `Failed to fetch data: ${response.status} - ${response.statusText}`,
      );
    }
    // console.log("Pass 1");
    const data = await response.json();
    // console.log("Pass 2");
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function GET() {
  const result = await fetchData();
  // console.log("Pass 3");
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
