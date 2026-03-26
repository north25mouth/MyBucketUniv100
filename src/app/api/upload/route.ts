import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const id = formData.get('id') as string;

    if (!file || !id) {
      return NextResponse.json({ error: 'Missing file or id' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer);
    let ext = path.extname(file.name).toLowerCase();
    const isVideo = file.type.includes('video') || ['.mp4', '.mov', '.webm'].includes(ext);
    
    if (!ext) ext = isVideo ? '.mp4' : '.jpg';
    
    const photosDir = path.join(process.cwd(), 'public', 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Delete existing files for this ID so we don't overlap extensions (e.g. 5.jpg and 5.mp4)
    const existingFiles = fs.readdirSync(photosDir).filter(f => f.startsWith(`${id}.`));
    for (const f of existingFiles) {
      fs.unlinkSync(path.join(photosDir, f));
    }

    let finalExt = ext;
    let finalBuffer: any = buffer;

    if (!isVideo) {
      if (ext === '.heic') {
        try {
          const tempHeic = path.join(photosDir, `temp_${id}.heic`);
          const tempJpg = path.join(photosDir, `temp_${id}.jpg`);
          fs.writeFileSync(tempHeic, buffer as any);
          
          require('child_process').execSync(`sips -s format jpeg "${tempHeic}" --out "${tempJpg}"`, { stdio: 'ignore' });
          
          const jpgBuffer = fs.readFileSync(tempJpg);
          finalBuffer = await sharp(jpgBuffer).webp({ quality: 80 }).toBuffer();
          finalExt = '.webp';
          
          fs.unlinkSync(tempHeic);
          fs.unlinkSync(tempJpg);
        } catch (err) {
          console.error("HEIC to WebP conversion failed", err);
        }
      } else {
        try {
          finalBuffer = await sharp(buffer as any).webp({ quality: 80 }).toBuffer();
          finalExt = '.webp';
        } catch (err) {
          console.error("WebP conversion failed", err);
        }
      }
    }

    const filePath = path.join(photosDir, `${id}${finalExt}`);
    fs.writeFileSync(filePath, finalBuffer as any);

    return NextResponse.json({ success: true, filePath: `/photos/${id}${finalExt}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
