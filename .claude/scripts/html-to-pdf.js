#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const [pdfArg] = process.argv.slice(2);

if (!pdfArg) {
  console.error('Usage: node html-to-pdf.js <output.pdf>  (HTML read from stdin)');
  process.exit(1);
}

const pdfPath = path.resolve(pdfArg);
const html = fs.readFileSync('/dev/stdin', 'utf8');
const tmpPath = path.join(os.tmpdir(), `_docs_${Date.now()}.html`);
fs.writeFileSync(tmpPath, html);

const chromeBinaries = [
  'google-chrome',
  'chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

let chromePath = null;
for (const bin of chromeBinaries) {
  try {
    execSync(`"${bin}" --version`, { stdio: 'ignore' });
    chromePath = bin;
    break;
  } catch (_) {}
}

if (!chromePath) {
  fs.unlinkSync(tmpPath);
  console.error('No Chrome binary found. Tried:', chromeBinaries.join(', '));
  process.exit(1);
}

try {
  execSync(
    `"${chromePath}" --headless --disable-gpu --no-sandbox --disable-setuid-sandbox --print-to-pdf="${pdfPath}" --no-pdf-header-footer "file://${tmpPath}"`,
    { stdio: 'inherit' }
  );
  console.log(`PDF saved to: ${pdfPath}`);
} finally {
  fs.unlinkSync(tmpPath);
}
