// server/index.ts
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import cors from 'cors';

const app = express();
const upload = multer();
app.use(cors());

app.post('/api/optimize', upload.array('files'), async (req, res) => {
  const files = req.files as Express.Multer.File[];

  const processedFiles = await Promise.all(
    files.map(async (file) => {
      const outputBuffer = await sharp(file.buffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .toFormat('webp', { quality: 80 })
        .toBuffer();

      const filename = file.originalname.replace(/\.[^.]+$/, '.webp');
      return { name: filename, buffer: outputBuffer };
    })
  );

  if (processedFiles.length === 1) {
    const base64 = processedFiles[0].buffer.toString('base64');
    const url = `data:image/webp;base64,${base64}`;
    return res.json({ urls: [url] });
  }

  const zipStream = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(zipStream);
  processedFiles.forEach(({ name, buffer }) => {
    archive.append(buffer, { name });
  });
  archive.finalize();

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');
  zipStream.pipe(res);
});

app.listen(3000, () => {
  console.log('🚀 Server ready at http://localhost:3000');
});
