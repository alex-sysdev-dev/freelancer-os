import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Get the data from the form
    const formData = await req.formData();
    const file = formData.get('resume');
    const name = formData.get('name');
    const email = formData.get('email');
    const address = formData.get('address');
    const role = formData.get('role');
    const experience = formData.get('experience');
    const about = formData.get('about');

    // 2. Upload the Resume to your Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // 3. Send everything to Airtable
    const airtableData = {
      records: [
        {
          fields: {
            Name: name,
            Email: email,
            Address: address,
            Role: role,
            Experience: experience,
            About: about,
            Status: 'New',
            Resume: [{ url: blob.url }] // This tells Airtable where to "grab" the file from
          },
        },
      ],
    };

    const res = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Applicants`, {
      method: 'POST',
      headers: {
        // Change Line 39 to this:
Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error('Airtable Error:', errorMsg);
      return NextResponse.json({ error: 'Airtable Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
