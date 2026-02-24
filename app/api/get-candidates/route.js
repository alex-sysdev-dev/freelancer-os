import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    // Check if variables exist at all
    if (!apiKey || !baseId || !tableName) {
      console.error("❌ Missing Airtable Environment Variables");
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 0 }, 
      }
    );

    const data = await response.json();

    // The Fix: Check if records exists before mapping
    if (!data.records || !Array.isArray(data.records)) {
      console.error("❌ Airtable API Error:", data);
      return NextResponse.json([]); // Return empty list instead of crashing
    }

    const formatted = data.records.map(record => ({
      id: record.id,
      name: record.fields.Name || "Anonymous",
      email: record.fields.Email || "No Email",
      experience: record.fields.Experience || "No details provided",
      resumeUrl: record.fields.Resume?.[0]?.url || "#",
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("❌ API Route Crash:", error);
    return NextResponse.json([], { status: 500 });
  }
}
