import { createWriteStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { createGzip } from 'zlib';
import archiver from 'archiver';

const OUTPUT_FILE = 'talk-to-your-history.zip';
const SOURCE_DIR = 'dist';

async function createZip() {
  const output = createWriteStream(OUTPUT_FILE);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Extension packaged: ${OUTPUT_FILE}`);
      console.log(`📦 Total bytes: ${archive.pointer()}`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files from dist directory
    archive.directory(SOURCE_DIR, false);

    archive.finalize();
  });
}

createZip().catch((error) => {
  console.error('❌ Failed to create zip:', error);
  process.exit(1);
});

