import { NextRequest, NextResponse } from 'next/server';
const pdf = require('pdf-parse/lib/pdf-parse.js');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdf(buffer);
    
    return NextResponse.json({ text: data.text });
  } catch (err: any) {
    console.error('PDF Parse Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
