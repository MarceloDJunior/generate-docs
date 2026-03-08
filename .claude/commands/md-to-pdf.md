---
description: Convert existing markdown files to a PDF
argument-hint: [md-file-or-folder] [output.pdf] [--no-cover]
allowed-tools: Read, Glob, Bash(node *)
model: sonnet
---

Convert one markdown file or a folder of markdown files into a single styled PDF.

## Behavior
- No narration. Work silently — no "I will...", "Reading...", "Converting..." messages.
- Only ask about file contents when truly ambiguous. This rule does NOT apply to missing required arguments — those must always be asked (see Arguments).
- No `mkdir`. Write creates parent directories automatically.

## Arguments

**Resolve before doing anything else.** Do not read any files or begin any step until the path is confirmed.

Parse $ARGUMENTS as space-separated tokens:
- First non-flag token: path to a `.md` file or a folder of `.md` files
- Second non-flag token (optional): output PDF path
- `--no-cover`: flag (any position) — omit the cover page

- If no path is provided, send this message and stop: "Path to a markdown file or folder?" Do not begin any step until the user replies.
- If no output path: default to same directory as input, same name with `.pdf` extension (file), or `<folder>/documentation.pdf` (folder).
- If the output PDF already exists, ask the user whether to overwrite it.

## Steps

### 1. Discover files
- **File input**: use only that file.
- **Folder input**: Glob all `*.md` files. Sort: architecture → infrastructure → flows → integrations → setup, then remaining alphabetically. If none found, tell the user and stop.

### 2. Read files
For each file derive:
- **Section title**: filename without extension, hyphens/underscores → spaces, title-cased
- **Section description**: first sentence of the first non-heading paragraph (omit if not found)

### 3. Determine document title
Use the parent directory name, title-cased. Use `package.json` `name` field if present nearby.

### 4. Detect content type
Classify the content with a short cover label (2–4 words, title-cased) based on the content itself, not filenames:

| Content signals | Cover label |
|---|---|
| Code architecture, APIs, services, infrastructure, setup | `Technical Documentation` |
| Action items, attendees, decisions | `Meeting Notes` |
| Goals, timeline, budget, stakeholders | `Project Proposal` |
| Findings, methodology, conclusions | `Research Report` |
| Step-by-step instructions, how-to | `User Guide` |
| Changelog, release notes, versions | `Release Notes` |
| Anything else | Infer a fitting 2–4 word label |

### 5. Build the HTML

Read `.claude/templates/docs.html` and replace these placeholders **exactly**. Do not change any CSS, colors, class names, or layout.

| Placeholder | Value |
|---|---|
| `{{TITLE}}` | Document title |
| `{{COVER_TAG}}` | Cover label from step 4 |
| `{{DATE}}` | Today's date |
| `{{TOC_ITEMS}}` | One `<li>` per file |
| `{{SECTIONS}}` | One `.page.section-page` div per file |
| `{{MD_SCRIPTS}}` | One `<script type="text/plain" id="mdN">` per file |
| `{{SECTION_COUNT}}` | Total number of files |

- `--no-cover`: remove the entire `<div class="page cover">...</div>` block
- Single section: remove the entire `<div class="page toc-page">...</div>` block

TOC item:
```html
<li><span class="toc-num">01</span><span class="toc-label">Title</span><span class="toc-desc">First sentence...</span></li>
```

Section page:
```html
<div class="page section-page">
  <div class="section-header"><div class="section-num">Section 01</div><div class="section-title">Title</div></div>
  <div class="content" id="s1"></div>
</div>
```

Markdown script:
```html
<script type="text/plain" id="md1">...raw markdown...</script>
```

### 6. Convert

Pipe the HTML directly to the conversion script — do not write any file:

```
node .claude/scripts/html-to-pdf.js <output-pdf-path> << 'HTMLEOF'
<html content>
HTMLEOF
```

The script handles the temp file and cleanup internally.
