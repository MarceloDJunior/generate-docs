---
description: Convert existing markdown files to a PDF
argument-hint: [md-file-or-folder] [output.pdf] [--no-cover]
allowed-tools: Bash(node *), Bash(test *), Read, Glob
model: sonnet
context: fork
---

Convert one markdown file or a folder of markdown files into a single styled PDF.

## Arguments

Parse $ARGUMENTS as space-separated tokens:
- First non-flag token: path to a `.md` file or a folder of `.md` files
- Second non-flag token (optional): output PDF path
- `--no-cover`: flag (any position) — omit the cover page

**Resolve before doing anything else.**

- If no path is provided, send: "Path to a markdown file or folder?" and stop.
- If no output path: default to same directory as input, same name with `.pdf` extension (file), or `<folder>/documentation.pdf` (folder).

## Steps

### 1. Resolve document title

Determine the project name to use as the PDF title, in order of preference:
1. If `architecture.md` exists in the input folder, read its first `#` heading — that is the project name.
2. Look for a `package.json` in the input folder, then in its parent. If found, use the `name` field.
3. Use the folder name — but if it is a generic name (`docs`, `documentation`, `output`, `dist`, `build`), use the **parent** folder name instead.
- Title-case the result (hyphens and underscores → spaces).

This value will be passed as `--title "<name>"` to the script.

### 4. Check for existing output

Run: `test -f <output-path> && echo EXISTS`

If it prints `EXISTS`, ask: "File `<path>` already exists. Overwrite? (y/n)" and stop. If yes, add `--overwrite` to the script call. If no, stop.

### 5. Run the conversion script

```
node .claude/scripts/md-to-pdf.js <input-path> <output-path> --title "<resolved-title>" [--no-cover] [--overwrite]
```

> Use this path verbatim. Do NOT expand `.claude/` to an absolute path.

The script handles everything: file discovery, sorting, title/description extraction, cover tag detection, HTML assembly, and PDF generation.
