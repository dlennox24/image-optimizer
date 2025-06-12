import archiver from 'archiver';
import { Buffer } from 'buffer';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { OptimizeApiResponse, ResFileObject, ResizeMetadata } from '../types/TypesImageFileTypes';

const app = express();
const upload = multer();

app.post(
  '/api/optimize',
  upload.fields([
    { name: 'files', maxCount: 20 },
    { name: 'metadata', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = (req.files as any)?.files || [];
      const metadataBlob = (req.files as any)?.metadata?.[0];

      if (!metadataBlob) {
        return res.status(400).json({ error: 'Missing metadata' });
      }

      const metadataJson = metadataBlob.buffer.toString('utf-8');
      const metadata: ResizeMetadata[] = JSON.parse(metadataJson);

      const optimizedImages: ResFileObject[] = [];
      const zipEntries: { name: string; buffer: Buffer }[] = [];

      for (const file of files) {
        const meta = metadata.find((m) => m.name === file.originalname);
        if (!meta) continue;

        const resizeOptions: sharp.ResizeOptions = {};
        if (meta.resizeWidth) resizeOptions.width = meta.resizeWidth;
        if (meta.resizeHeight) resizeOptions.height = meta.resizeHeight;

        const processedBuffer = await sharp(file.buffer)
          .resize({ ...resizeOptions, withoutEnlargement: true })
          .toFormat('webp', { quality: 80 })
          .toBuffer();

        const { width, height } = await sharp(processedBuffer).metadata();

        const base64 = processedBuffer.toString('base64');
        const dataUrl = `data:image/webp;base64,${base64}`;

        optimizedImages.push({
          id: meta.id ?? -1,
          file: dataUrl,
          name: file.originalname.replace(/\.[^.]+$/, '.webp'),
          extension: 'webp',
          mimeType: 'image/webp',
          size: processedBuffer.length,
          width: width || 0,
          height: height || 0,
        });

        zipEntries.push({
          name: file.originalname.replace(/\.[^.]+$/, '.webp'),
          buffer: processedBuffer,
        });
      }

      // ZIP everything
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipChunks: Buffer[] = [];

      archive.on('data', (chunk) => zipChunks.push(chunk));
      archive.on('error', (err) => {
        console.error('ZIP error:', err);
        res.status(500).json({ error: 'Error creating ZIP' });
      });

      zipEntries.forEach(({ name, buffer }) => {
        archive.append(buffer, { name });
      });

      await archive.finalize();
      const zipBuffer = Buffer.concat(zipChunks);
      const zipDataUrl = `data:application/zip;base64,${zipBuffer.toString('base64')}`;

      const zippedImages: ResFileObject = {
        file: zipDataUrl,
        name: 'images.zip',
        extension: 'zip',
        mimeType: 'application/zip',
        size: zipBuffer.length,
        width: -1,
        height: -1,
      };

      const response: OptimizeApiResponse = {
        optimizedImages,
        zippedImages,
      };

      res.json(response);
    } catch (err) {
      console.error('API error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
