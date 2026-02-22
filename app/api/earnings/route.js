import { NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
export async function POST(request) {
  try {
    const body = await request.json();
    
    const records = await base('Earnings').create([
      {
        fields: {
          "Date": body.date,
          "Amount": Number(body.amount),
          "Source": `${body.company}: ${body.project}`
        }
      }
    ]);
    
    return NextResponse.json({ success: true, id: records[0].id });
  } catch (error) {
    console.error("AIRTABLE ERROR:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const records = await base('Earnings').select({
      sort: [{ field: "Date", direction: "asc" }]
    }).all();

    const formattedData = records.map(record => ({
      date: record.fields.Date,
      amount: record.fields.Amount,
      Source: record.fields.source
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("GET ERROR:", error.message);
    return NextResponse.json([]);
  }
}