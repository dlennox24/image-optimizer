// File: /api/optimize.ts
import archiver from 'archiver';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';

type Metadata = {
  name: string;
  width: number;
  height: number;
  resizeWidth?: number;
  resizeHeight?: number;
};

const app = express();
let upload;
try {
  console.log(`setting up multer 2`);
  upload = multer();
} catch (error) {
  console.log('failed to create upload');
}

// Use this to parse form-data with files + other fields
app.post(
  '/api/optimize',
  // upload.array('files', 20),
  upload.fields([
    { name: 'files', maxCount: 20 }, // accept up to 20 files under 'files' field
    { name: 'metadata', maxCount: 1 }, // accept one metadata field (even though it is not a file)
  ]),
  async (req, res) => {
    console.log('hit /optimize route');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log(JSON.parse(req.files.metadata));

    try {
      // req.files is an array of uploaded files
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded');
      }

      // metadata is a JSON string inside the form field 'metadata'
      // multer does NOT parse non-file fields by default, but
      // since we're using multer with no storage, req.body fields are parsed as strings
      // So we can access req.body.metadata directly
      let metadata: Metadata[] = [];

      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
        } catch (err) {
          console.warn('Invalid metadata JSON', err);
        }
      }

      // Map files with metadata by matching filename
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          // Find metadata for this file by originalname (file.name)
          const meta = metadata.find((m) => m.name === file.originalname);

          // Decide resize options based on metadata
          const resizeOptions: sharp.ResizeOptions = {};

          if (meta) {
            if (meta.resizeWidth) resizeOptions.width = meta.resizeWidth;
            if (meta.resizeHeight) resizeOptions.height = meta.resizeHeight;
          }

          // Default resize to max width 1024 if no resize specified
          if (!resizeOptions.width && !resizeOptions.height) {
            resizeOptions.width = 1024;
            resizeOptions.withoutEnlargement = true;
          }

          const outputBuffer = await sharp(file.buffer)
            .resize(resizeOptions)
            .toFormat('webp', { quality: 80 })
            .toBuffer();

          const filename = file.originalname.replace(/\.[^.]+$/, '.webp');
          return { name: filename, buffer: outputBuffer };
        })
      );

      // If only one image, send it directly as webp blob
      if (processedFiles.length === 1) {
        const file = processedFiles[0];
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
        return res.send(file.buffer);
      }

      // Multiple files: zip and stream
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);

      processedFiles.forEach(({ name, buffer }) => {
        archive.append(buffer, { name });
      });

      await archive.finalize();
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).send('Internal server error');
    }
  }
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
