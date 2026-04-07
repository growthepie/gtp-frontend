import { NextResponse } from "next/server";

type SurveyRequestBody = {
  projectName?: string;
  walletAddress?: string;
  teamSize?: string;
  goal?: string;
  metric?: string;
  other?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as SurveyRequestBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_SURVEY_TABLE_ID;

    console.log("[survey] env check:", { hasApiKey: !!apiKey, hasBaseId: !!baseId, hasTableId: !!tableId });

    if (!apiKey || !baseId || !tableId) {
      return NextResponse.json({ error: "Airtable is not configured." }, { status: 500 });
    }

    const payload = {
      fields: {
        "Project Name": body.projectName?.trim() || "",
        "Wallet Address": body.walletAddress?.trim() || "",
        "Team Size": body.teamSize?.trim() || "",
        "Goal": body.goal?.trim() || "",
        "Key Metric": body.metric?.trim() || "",
        "Other Feedback": body.other?.trim() || "",
        "Submitted At": new Date().toISOString(),
      },
    };

    console.log("[survey] posting to Airtable:", `https://api.airtable.com/v0/${baseId}/${tableId}`);

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[survey] Airtable response:", response.status, responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Airtable error: ${response.status} ${responseText}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[survey] caught error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit survey." },
      { status: 500 },
    );
  }
}
