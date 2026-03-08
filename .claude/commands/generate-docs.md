---
description: Generate documentation from the project codebase
argument-hint: [markdown|pdf] [folder-or-filename]
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(node *), Bash(which *), WebSearch, WebFetch
model: sonnet
---

Read the codebase and write comprehensive documentation for the project.

> **Write only what you read.** Every claim must trace to code you actually read. If not found, omit it. No guesses, no "likely", no "probably". When in doubt, leave it out.

## Behavior
- No narration. Work silently — no "I will...", "Creating...", "Now I'll..." messages.
- No shell commands. Use Glob (find files), Read (file contents), Grep (search content). Never use `ls`, `find`, `cat`, `head`, `tail`, `grep`.
- No `mkdir`. Write creates parent directories automatically.
- Only ask about the codebase when truly ambiguous. Never assume or skip required arguments (see Arguments).
- **Write in technical documentation style.** Use concise, precise language. Prefer bullet points and short paragraphs over prose. No conversational tone, no filler, no preamble.
- **Do not enumerate files, folders, or classes.** Documentation must describe concepts, layers, and behaviours — never lists of filenames or directory paths.
- **Do not complete partial flows.** If only one side of an interaction is visible, document only what you can see. Do not infer what other services do unless you have read their code.
- **Do not attribute a capability based on circumstantial evidence.** A related constant, config field, or type is not enough — you must find an explicit action (API call, handler, UI trigger) in that code before claiming it does something.
- **Never mix URLs across services.** A URL found in one service's README or config belongs only to that service. Do not assign it to another service, even if the names or contexts seem related.

## Output location
Write all output files relative to the **current working directory**, never to a subdirectory discovered during exploration.

## Arguments

**Resolve before doing anything else.** Do not read the codebase or begin any step until both values are confirmed. Never assume or default them.

Parse $ARGUMENTS: first token = output type, second token (optional) = name.

**Question 1 — if output type is missing:**
Send this message and stop: "Which output format?  1) Markdown (multiple .md files)  2) PDF (single styled document)"
Wait for the user to reply before continuing.

**Question 2 — if name is missing (separate message, after Q1 is answered):**
- Markdown: send "Output folder name? (default: `docs`)" and stop. Wait for reply.
- PDF: send "Output file name? (default: `documentation.pdf`)" and stop. Wait for reply.

**Rules:**
- Output type must be `markdown` or `pdf`
- Markdown: name is the output folder. If it already exists, ask "Folder `<name>` already exists.  1) Proceed and overwrite  2) Cancel"
- PDF: name is the output file path.

## Steps

### 1. Explore the codebase
- Glob the top-level structure to identify language, framework, tooling
- Read the primary README — **treat it as the authoritative source for deployment URLs, environment names, branch-to-environment mappings, and anything explicitly documented there**
- Read: dependency manifest (package.json / requirements.txt / go.mod / etc.), .env.example, deployment config (serverless.yml / docker-compose.yml / Dockerfile / terraform), CI/CD pipelines
- Read 2–3 representative files per major layer (routes, services, models, workers)
- Note any existing docs

**Multi-project repos:** if multiple subdirectories each have their own dependency manifest or Dockerfile, treat as a multi-project repo:
- Read every subproject's README
- Explore each subproject as above
- Check for cross-project links: shared API calls, event contracts, URLs, auth, data stores
- Related subprojects → document cross-project interactions as primary flows in `flows.md`
- Unrelated subprojects → document each separately, labelled by name
- **Ignore dead flows**: if a flow, endpoint, or handler is never called, triggered, or referenced by any visible entry point (HTTP call, event, schedule, queue message, UI action), omit it entirely. Do not document something just because it exists in the code.

### 2. Create `architecture.md`
High-level system overview: what it is, the architectural pattern (e.g. MVC, event-driven, microservices), the main structural layers and their responsibilities, and how those layers communicate. Focus on conceptual structure — **do not enumerate individual files, folders, or classes**.

### 3. Create `infrastructure.md`
Languages and runtime versions, frameworks, core libraries, hosting, cloud services, monitoring/alerting (if present), logging, each environment (dev/staging/prod) and how they differ, secrets management, release and deployment process. Use exact URLs and environment names from READMEs — no placeholders.

For multi-project repos, document each subproject's infrastructure in its own clearly labelled section. Do not merge or mix infrastructure details across subprojects.

### 4. Create `flows.md`
Main system flows, ordered first by importance, then by the natural sequence in which they occur in the system (e.g. authentication before checkout, onboarding before core actions). High-level only — no individual fields or implementation details. Include a Mermaid diagram (sequence or flowchart) per flow.

Only include flows with a confirmed entry point (HTTP route, queue consumer, cron, Lambda invocation, UI action). Omit anything unreachable.

### 5. Create `integrations.md`
Third-party providers that interact with the app at runtime and require API keys or credentials (e.g. payment gateways, email, SMS, analytics, OAuth providers). For each: purpose, how it is integrated (webhook, REST API call, SDK, polling), dependencies (VPN, certs, etc.), and a link to its documentation.

Exclude cloud infrastructure (AWS, GCP, Azure and their services) — those belong in `infrastructure.md`.

### 6. Create `setup.md`
Comprehensive first-time setup instructions covering:
- **Prerequisites**: required tools, runtimes, and versions (e.g. Node.js 18, Docker, etc.)
- **Installation**: how to clone and install dependencies
- **Environment variables**: if `.env.example` exists, reference it with a single instruction (e.g. "Copy `.env.example` to `.env` and fill in the values") — **stop there, do not read, list, or describe any of its variables**. If no `.env.example` exists, list only the variable names visible in committed config files and instruct the reader to request values from a team member.
- **Running locally**: the exact command(s) to start the project
- **Running tests**: the test command, if one exists in the project

### 7. PDF output (skip if format is markdown)

**Do not write individual `.md` files for PDF output.** Instead, compile all section content into a single HTML file by reading `.claude/templates/docs.html` and filling in these placeholders **exactly**. Do not change any CSS, colors, class names, or layout.

| Placeholder | Value |
|---|---|
| `{{TITLE}}` | Project name |
| `{{COVER_TAG}}` | `Technical Documentation` |
| `{{DATE}}` | Today's date |
| `{{TOC_ITEMS}}` | Five `<li>` elements — one per section |
| `{{SECTIONS}}` | Five `.page.section-page` divs |
| `{{MD_SCRIPTS}}` | Five `<script type="text/plain" id="mdN">` tags with raw markdown |
| `{{SECTION_COUNT}}` | `5` |

TOC item:
```html
<li><span class="toc-num">01</span><span class="toc-label">Architecture</span><span class="toc-desc">System structure, layers, and deployment model</span></li>
```

Section page:
```html
<div class="page section-page">
  <div class="section-header"><div class="section-num">Section 01</div><div class="section-title">Architecture</div></div>
  <div class="content" id="s1"></div>
</div>
```

Markdown script:
```html
<script type="text/plain" id="md1">...raw markdown...</script>
```

Sections in order: Architecture, Infrastructure, System Flows, Integrations, Setup Guide.

Pipe the HTML directly to the conversion script — do not write any file:

```
node .claude/scripts/html-to-pdf.js <output-pdf-path> << 'HTMLEOF'
<html content>
HTMLEOF
```

> Use this path verbatim. Do NOT expand `.claude/` to an absolute path. The script handles the temp file and cleanup internally.
