import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No files received.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename to clean ASCII to prevent Unicode Next.js asset routing bugs
    const sanitizedBase = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');

    const filename = Date.now() + '-' + sanitizedBase;
    const isAudio = file.type?.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name);
    const subfolder = isAudio ? 'audio' : 'memories';
    const uploadDir = path.join(process.cwd(), 'public', subfolder);
    
    // Ensure dir exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);

    return NextResponse.json({ url: `/${subfolder}/${filename}` });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
