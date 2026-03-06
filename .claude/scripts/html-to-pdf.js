#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const [htmlArg, pdfArg] = process.argv.slice(2);

if (!htmlArg || !pdfArg) {
  console.error('Usage: node html-to-pdf.js <input.html> <output.pdf>');
  process.exit(1);
}

const htmlPath = path.resolve(htmlArg);
const pdfPath = path.resolve(pdfArg);

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
  console.error('No Chrome binary found. Tried:', chromeBinaries.join(', '));
  process.exit(1);
}

execSync(
  `"${chromePath}" --headless --disable-gpu --no-sandbox --disable-setuid-sandbox --print-to-pdf="${pdfPath}" --no-pdf-header-footer "file://${htmlPath}"`,
  { stdio: 'inherit' }
);

console.log(`PDF saved to: ${pdfPath}`);
