import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import exifr from 'exifr';

export async function GET() {
  const metadata: Record<number, { date: string, type: string, src: string }> = {};
  const photosDir = path.join(process.cwd(), 'public', 'photos');

  if (!fs.existsSync(photosDir)) {
    return NextResponse.json(metadata);
  }

  const files = fs.readdirSync(photosDir);
  const imageExts = ['.jpg', '.jpeg', '.heic', '.png', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.webm'];
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const isImage = imageExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    if (isImage || isVideo) {
      const idStr = file.replace(/\.[^/.]+$/, "");
      const id = parseInt(idStr, 10);
      if (isNaN(id)) continue;
      
      const filePath = path.join(photosDir, file);
      
      let dateIso = "";

      // Try EXIF if it's an image
      if (isImage) {
        try {
          const exifData = await exifr.parse(filePath, ['DateTimeOriginal']);
          if (exifData && exifData.DateTimeOriginal) {
            dateIso = new Date(exifData.DateTimeOriginal).toISOString();
          }
        } catch (e) {}
      }

      // Fallback
      if (!dateIso) {
        const stat = fs.statSync(filePath);
        dateIso = (stat.birthtime || stat.mtime).toISOString();
      }

      metadata[id] = {
        date: dateIso,
        src: `/photos/${file}`,
        type: isVideo ? 'video' : 'image'
      };
    }
  }

  return NextResponse.json(metadata);
}
