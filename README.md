# generate-docs

Claude Code slash commands for generating styled project documentation — as Markdown files or a single PDF.

## Commands

### `/generate-docs`

Reads your codebase and writes comprehensive documentation covering architecture, infrastructure, system flows, external integrations, and setup instructions.

```
/generate-docs [markdown|pdf] [folder-or-filename]
```

**Examples:**
```
/generate-docs markdown docs
/generate-docs pdf documentation.pdf
/generate-docs          # prompts for format and name
```

**Outputs (Markdown):**
- `architecture.md` — system layers and how they communicate
- `infrastructure.md` — technologies, hosting, CI/CD, environments
- `flows.md` — main system flows with Mermaid diagrams
- `integrations.md` — external services requiring API keys
- `setup.md` — first-time setup instructions

**Output (PDF):** A single styled document with a cover page, table of contents, and all five sections.

---

### `/md-to-pdf`

Converts an existing Markdown file or folder of Markdown files into a single styled PDF.

```
/md-to-pdf [md-file-or-folder] [output.pdf]
```

**Examples:**
```
/md-to-pdf docs/                  # converts all .md files in docs/
/md-to-pdf docs/ report.pdf
/md-to-pdf README.md              # converts a single file
```

---

## Requirements

- [Claude Code](https://claude.ai/code)
- Node.js (any recent version)
- Google Chrome or Chromium (required for PDF output only)

## Installation

Run this from your project root:

```bash
curl -fsSL https://raw.githubusercontent.com/MarceloDJunior/generate-docs/main/install.sh | bash
```

That's it. The `/generate-docs` and `/md-to-pdf` commands will be available the next time you open Claude Code in that project.

**No `curl`?** Download the [ZIP archive](https://github.com/MarceloDJunior/generate-docs/archive/refs/heads/main.zip), extract it, and copy the `.claude` folder into your project root.
