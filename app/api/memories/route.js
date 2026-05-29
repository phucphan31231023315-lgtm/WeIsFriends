import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'data', 'memories.json');

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    return NextResponse.json(JSON.parse(fileContents));
  } catch (error) {
    console.error('Error reading memories.json:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newData = await request.json();
    await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing memories.json:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
