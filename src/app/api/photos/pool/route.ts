import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function GET() {
  const poolDir = path.join(process.cwd(), 'public', 'photos', '100');
  
  if (!fs.existsSync(poolDir)) {
    return NextResponse.json([]);
  }

  const files = fs.readdirSync(poolDir);
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm', '.heic'];
  
  const poolFiles = files
    .filter(file => validExts.includes(path.extname(file).toLowerCase()) && !file.startsWith('.'))
    .map(file => `/photos/100/${file}`);

  return NextResponse.json(poolFiles);
}

// POST to link a photo from the pool to an ID
export async function POST(request: Request) {
  try {
    const { id, src } = await request.json(); // src: '/photos/100/IMG_123.jpg'
    
    if (!id || !src) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const sourceSegments = src.split('/').filter(Boolean);
    const sourcePath = path.join(process.cwd(), 'public', ...sourceSegments);
    
    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const ext = path.extname(sourcePath).toLowerCase();
    const destDir = path.join(process.cwd(), 'public', 'photos');
    
    // Delete existing mapped file for this ID
    const existing = fs.readdirSync(destDir).filter(f => f.startsWith(`${id}.`) && !fs.statSync(path.join(destDir, f)).isDirectory());
    for (const f of existing) fs.unlinkSync(path.join(destDir, f));

    const isVideo = ['.mp4', '.mov', '.webm'].includes(ext);

    if (!isVideo && ext !== '.webp') {
      if (ext === '.heic') {
        try {
          const tempJpg = path.join(destDir, `temp_${id}.jpg`);
          require('child_process').execSync(`sips -s format jpeg "${sourcePath}" --out "${tempJpg}"`, { stdio: 'ignore' });
          const jpgBuffer = fs.readFileSync(tempJpg);
          const destPath = path.join(destDir, `${id}.webp`);
          await sharp(jpgBuffer).webp({ quality: 80 }).toFile(destPath);
          fs.unlinkSync(tempJpg);
          fs.unlinkSync(sourcePath);
        } catch (err) {
          console.error("Pool HEIC conversion failed", err);
          fs.renameSync(sourcePath, path.join(destDir, `${id}${ext}`));
        }
      } else {
        try {
          const destPath = path.join(destDir, `${id}.webp`);
          await sharp(sourcePath).webp({ quality: 80 }).toFile(destPath);
          fs.unlinkSync(sourcePath);
        } catch (err) {
          console.error("Pool WebP conversion failed", err);
          fs.renameSync(sourcePath, path.join(destDir, `${id}${ext}`));
        }
      }
    } else {
      // It's already a webp or a video, just move it perfectly
      const destPath = path.join(destDir, `${id}${ext}`);
      fs.renameSync(sourcePath, destPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
