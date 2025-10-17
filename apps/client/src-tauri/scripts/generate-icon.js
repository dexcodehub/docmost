const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'icons');
const outFile = path.join(outDir, 'icon.png');
const sourceFile = path.join(__dirname, '..', '..', 'public', 'icons', 'app-icon-512x512.png');

try {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, outFile);
    console.log('Copied icon from public:', sourceFile, '->', outFile);
  } else {
    throw new Error('Source icon not found: ' + sourceFile);
  }
} catch (e) {
  console.error('Failed to prepare icon:', e);
  process.exit(1);
}