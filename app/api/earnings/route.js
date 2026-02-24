import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      console.error("Missing Airtable Environment Variables");
      return NextResponse.json([], { status: 500 });
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Earnings?sort[0][field]=Date&sort[0][direction]=asc`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 0 },
      }
    );

    const data = await response.json();

    if (!data.records || !Array.isArray(data.records)) {
      console.error("Airtable API Error:", data);
      return NextResponse.json([]);
    }

    const formatted = data.records.map((record) => ({
      id: record.id,
      source: record.fields.Source || "Unknown",
      amount: Number(record.fields.Amount) || 0,
      date: record.fields.Date || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("API Route Crash:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { source, amount, date } = await req.json();

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Earnings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Source: source,
            Amount: parseFloat(amount),
            Date: date,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Airtable Error:", data);
      return NextResponse.json({ error: data.error.message }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
