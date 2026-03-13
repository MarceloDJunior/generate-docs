#!/usr/bin/env node
'use strict';

/**
 * md-to-pdf.js  <input> <output.pdf> [--no-cover] [--overwrite] [--title "..."] [--tag "..."]
 *
 * input  — path to a single .md file or a folder of .md files
 * output — destination PDF path
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Arg parsing ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const flags = { noCover: false, overwrite: false, title: null, tag: null };
const positional = [];

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--no-cover')           { flags.noCover = true; }
  else if (argv[i] === '--overwrite')     { flags.overwrite = true; }
  else if (argv[i] === '--title')         { flags.title = argv[++i]; }
  else if (argv[i] === '--tag')           { flags.tag = argv[++i]; }
  else                                    { positional.push(argv[i]); }
}

const [inputArg, outputArg] = positional;

if (!inputArg || !outputArg) {
  console.error('Usage: node md-to-pdf.js <input> <output.pdf> [--no-cover] [--overwrite] [--title "..."] [--tag "..."]');
  process.exit(1);
}

const absInput = path.resolve(inputArg);
const pdfPath  = path.resolve(outputArg);

if (!fs.existsSync(absInput)) {
  console.error('Input not found:', absInput);
  process.exit(1);
}

if (fs.existsSync(pdfPath) && !flags.overwrite) {
  console.error(`OUTPUT_EXISTS:${pdfPath}`);
  process.exit(2);
}

// ── File discovery ────────────────────────────────────────────────────────────

const ORDER = ['architecture', 'infrastructure', 'flows', 'integrations', 'setup'];

function sortMdFiles(names) {
  return names.sort((a, b) => {
    const al = a.toLowerCase();
    const bl = b.toLowerCase();
    const ai = ORDER.findIndex(k => al.startsWith(k));
    const bi = ORDER.findIndex(k => bl.startsWith(k));
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

let filePaths = [];
const inputStat = fs.statSync(absInput);

if (inputStat.isFile()) {
  filePaths = [absInput];
} else {
  const names = fs.readdirSync(absInput).filter(f => f.endsWith('.md'));
  filePaths = sortMdFiles(names).map(f => path.join(absInput, f));
}

if (filePaths.length === 0) {
  console.error('No .md files found in:', absInput);
  process.exit(1);
}

// ── Section extraction ────────────────────────────────────────────────────────

function extractSection(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const base    = path.basename(filePath, '.md');
  const title   = base.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return { title, content };
}

const sections = filePaths.map(extractSection);

// ── Document title ────────────────────────────────────────────────────────────

function getTitle() {
  if (flags.title) return flags.title;

  const dir = inputStat.isFile() ? path.dirname(absInput) : absInput;
  for (const candidate of [dir, path.dirname(dir)]) {
    const pkg = path.join(candidate, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        const { name } = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        if (name) return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } catch (_) {}
    }
  }

  const dirName = inputStat.isFile() ? path.basename(path.dirname(absInput)) : path.basename(absInput);
  return dirName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Cover tag detection ───────────────────────────────────────────────────────

function detectTag() {
  if (flags.tag) return flags.tag;
  const combined = sections.map(s => s.content).join('\n').toLowerCase();
  if (/architecture|api|service|infrastructure|setup|deployment/.test(combined)) return 'Technical Documentation';
  if (/action item|attendee|decision/.test(combined))                            return 'Meeting Notes';
  if (/goal|timeline|budget|stakeholder/.test(combined))                         return 'Project Proposal';
  if (/finding|methodology|conclusion/.test(combined))                           return 'Research Report';
  if (/step-by-step|how.to/.test(combined))                                      return 'User Guide';
  if (/changelog|release note|version/.test(combined))                           return 'Release Notes';
  return 'Technical Documentation';
}

// ── HTML assembly ─────────────────────────────────────────────────────────────

const templatePath = path.join(__dirname, '..', 'templates', 'docs.html');
let html = fs.readFileSync(templatePath, 'utf8');

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// cover(1) + toc(1) + sections start at page 3
// if --no-cover: toc(1) + sections start at page 2
// if single section (no toc): cover(1) + section at page 2, or just page 1 if no cover
const hasCover = !flags.noCover;
const hasToc   = sections.length > 1;
const firstSectionPage = (hasCover ? 1 : 0) + (hasToc ? 1 : 0) + 1;

const tocItems = sections.map((s, i) => {
  const n    = String(i + 1).padStart(2, '0');
  const page = String(firstSectionPage + i).padStart(2, '0');
  return `<li><span class="toc-num">${n}</span><span class="toc-label">${s.title}</span><span class="toc-pg">${page}</span></li>`;
}).join('\n');

const sectionPages = sections.map((s, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `<div class="page section-page">
  <div class="section-header"><div class="section-num">Section ${n}</div><div class="section-title">${s.title}</div></div>
  <div class="content" id="s${i + 1}"></div>
</div>`;
}).join('\n');

const mdScripts = sections.map((s, i) =>
  `<script type="text/plain" id="md${i + 1}">${s.content}</script>`
).join('\n');

html = html
  .replace(/\{\{TITLE\}\}/g,    getTitle())
  .replace('{{COVER_TAG}}',     detectTag())
  .replace('{{DATE}}',          today)
  .replace('{{TOC_ITEMS}}',     tocItems)
  .replace('{{SECTIONS}}',      sectionPages)
  .replace('{{MD_SCRIPTS}}',    mdScripts)
  .replace('{{SECTION_COUNT}}', String(sections.length));

if (flags.noCover) {
  html = html.replace(/<div class="page cover">[\s\S]*?<\/div>(?=\s*<div)/, '');
}
if (sections.length === 1) {
  html = html.replace(/<div class="page toc-page">[\s\S]*?<\/div>(?=\s*<div)/, '');
}

// ── PDF conversion ────────────────────────────────────────────────────────────

const tmpPath = path.join(os.tmpdir(), `_docs_${Date.now()}.html`);
fs.writeFileSync(tmpPath, html);

const chromeBinaries = [
  'google-chrome',
  'chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

let chromePath = null;
for (const bin of chromeBinaries) {
  try { execSync(`"${bin}" --version`, { stdio: 'ignore' }); chromePath = bin; break; }
  catch (_) {}
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
