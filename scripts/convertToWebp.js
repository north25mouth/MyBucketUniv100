const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.heic'].includes(ext);
    if (isImage) {
      const filePath = path.join(dir, file);
      const base = path.basename(file, path.extname(file));
      const webpPath = path.join(dir, `${base}.webp`);
      
      try {
        if (ext === '.heic') {
          // macOS native sips can't write webp directly, so we do HEIC -> JPG -> WebP
          const tempJpgPath = path.join(dir, `${base}_temp.jpg`);
          require('child_process').execSync(`sips -s format jpeg "${filePath}" --out "${tempJpgPath}"`, { stdio: 'ignore' });
          
          await sharp(tempJpgPath).webp({ quality: 80 }).toFile(webpPath);
          
          fs.unlinkSync(tempJpgPath); // delete temp jpg
          fs.unlinkSync(filePath); // delete original heic
          console.log(`Converted ${file} to ${base}.webp via sips+sharp`);
        } else {
          await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
          fs.unlinkSync(filePath); // delete original
          console.log(`Converted ${file} to ${base}.webp using sharp`);
        }
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err.message);
      }
    }
  }
}

async function run() {
  await convertDir(path.join(process.cwd(), 'public', 'photos'));
  await convertDir(path.join(process.cwd(), 'public', 'photos', '100'));
}

run();
