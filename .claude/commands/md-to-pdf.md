---
description: Convert existing markdown files to a PDF
argument-hint: [md-file-or-folder] [output.pdf] [--no-cover]
allowed-tools: Read, Write, Glob, Bash(node *), Bash(rm *)
model: sonnet
---

Convert one markdown file or all markdown files in a folder to a single styled PDF document.

## Behavior
- Work silently through all steps without narrating what you are doing. Do not write messages like "I will read...", "Reading files...", "Now I'll build...", "Converting...", etc.
- Only ask questions about **file contents or ambiguous input** when they cannot be inferred. Otherwise proceed without prompting. This rule does NOT apply to missing required arguments — those must always be asked (see Arguments).
- Do not run `mkdir`. The Write tool creates parent directories automatically.

## Arguments

**Before doing anything else** — before reading any files, before any steps — resolve the input path. Do not begin Step 1 until the path is confirmed.

Parse $ARGUMENTS as space-separated tokens:
- First non-flag token: path to a single `.md` file **or** a folder containing `.md` files
- Second non-flag token (optional): output PDF path
- `--no-cover`: flag (any position) — omit the cover page from the output

- If no path is provided, **stop and ask the user**: "Path to a markdown file or folder?"
- Determine whether the path is a file or a folder:
  - **File**: use that single `.md` file as the only section.
  - **Folder**: discover all `.md` files inside it (see Step 1).
- If no output path is provided:
  - For a **file** input: default to the same directory as the file, same name but `.pdf` extension (e.g. `docs/guide.md` → `docs/guide.pdf`).
  - For a **folder** input: default to `<folder>/documentation.pdf`.
- If the output PDF already exists, ask the user whether to overwrite it.

## Steps

### 1. Discover files

- **Single file input**: the file list contains only that one file.
- **Folder input**: use Glob to list all `*.md` files in the folder. Sort them in this preferred order if the filenames match (case-insensitive): architecture, infrastructure, flows, integrations, setup. Place any remaining files after, in alphabetical order. If no `.md` files are found, tell the user and stop.

### 2. Read files

Read each `.md` file. For each file derive:
- **Section title**: filename without extension, hyphens/underscores replaced with spaces, title-cased (e.g. `system-flows.md` → `System Flows`)
- **Section description**: first sentence of the first non-heading paragraph. Omit if not found.

### 3. Determine document title

Use the folder's parent directory name, title-cased. If a `package.json` exists nearby with a `name` field, use that instead.

### 4. Detect content type

Read all file contents and classify the document with a short cover label (2–4 words, title-cased). Use the content itself as the signal — do not rely on filenames alone. Examples:

| Content signals | Cover label |
|---|---|
| Code architecture, APIs, services, infrastructure, setup instructions | `Technical Documentation` |
| Action items, attendees, date, decisions | `Meeting Notes` |
| Goals, timeline, budget, stakeholders | `Project Proposal` |
| Findings, methodology, conclusions | `Research Report` |
| Step-by-step guide, instructions, how-to | `User Guide` |
| Changelog, release notes, version history | `Release Notes` |
| Anything else | Infer a fitting 2–4 word label from the content |

### 5. Build and write the HTML file

Read `.claude/templates/docs.html` and replace these placeholders:

| Placeholder | Value |
|---|---|
| `{{TITLE}}` | Document title from step 3 |
| `{{COVER_TAG}}` | Cover label from step 4 |
| `{{DATE}}` | Today's date |
| `{{TOC_ITEMS}}` | One `<li>` per file |
| `{{SECTIONS}}` | One `.page.section-page` div per file |
| `{{MD_SCRIPTS}}` | One `<script type="text/plain" id="mdN">` per file with raw markdown |
| `{{SECTION_COUNT}}` | Total number of files |

**Cover page**: if `--no-cover` was passed, remove the entire `<div class="page cover">...</div>` block from the HTML.

**TOC page**: if there is only one section, remove the entire `<div class="page toc-page">...</div>` block from the HTML.

TOC `<li>` format (zero-padded number, title, description):
```html
<li><span class="toc-num">01</span><span class="toc-label">Architecture</span><span class="toc-desc">First sentence from file...</span></li>
```

Section page format:
```html
<div class="page section-page">
  <div class="section-header"><div class="section-num">Section 01</div><div class="section-title">Architecture</div></div>
  <div class="content" id="s1"></div>
</div>
```

Markdown script format:
```html
<script type="text/plain" id="md1">...raw markdown content...</script>
```

Write the resulting HTML to `<parent-dir>/_temp_docs.html`, where `<parent-dir>` is:
- The folder itself, for folder input.
- The directory containing the file, for single-file input.

### 5. Convert and clean up

Run:
```
node .claude/scripts/html-to-pdf.js <parent-dir>/_temp_docs.html <output-pdf-path>
```

Then delete the temp file using:
```
node .claude/scripts/cleanup.js <parent-dir>/_temp_docs.html
```
