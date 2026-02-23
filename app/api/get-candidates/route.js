import { NextResponse } from 'next/server';

export async function GET() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Applicants'; // Make sure this matches your Airtable table name!

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      next: { revalidate: 0 } // Ensures it doesn't cache old data
    });

    const data = await response.json();

    // Clean up the Airtable data for our Dashboard
    const candidates = data.records.map(record => ({
      id: record.id,
      name: record.fields.Name || "Anonymous",
      email: record.fields.Email || "No Email",
      experience: record.fields.Experience || "No details provided",
      resumeUrl: record.fields.Resume?.[0]?.url || "#", // Grabs the first attachment link
    }));

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Airtable Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}