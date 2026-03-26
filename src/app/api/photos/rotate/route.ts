import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const destDir = path.join(process.cwd(), 'public', 'photos');
    const existingFiles = fs.readdirSync(destDir).filter(f => f.startsWith(`${id}.`) && !fs.statSync(path.join(destDir, f)).isDirectory());

    if (existingFiles.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const file = existingFiles[0];
    const ext = path.extname(file).toLowerCase();
    
    // Check if it's an image
    if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
      return NextResponse.json({ error: 'Cannot rotate this file type' }, { status: 400 });
    }

    const filePath = path.join(destDir, file);
    const tempPath = path.join(destDir, `temp_${file}`);

    // Rename original file to a temp file
    fs.renameSync(filePath, tempPath);

    try {
      // Rotate by 90 degrees and save to the original path
      await sharp(tempPath)
        .rotate(90)
        .toFile(filePath);

      // Delete the temp file
      fs.unlinkSync(tempPath);
      
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("Rotation failed", err);
      // Restore the original file if rotation fails
      fs.renameSync(tempPath, filePath);
      return NextResponse.json({ error: 'Rotation failed' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
