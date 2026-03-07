---
description: Generate documentation from the project codebase
argument-hint: [markdown|pdf] [folder-or-filename]
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(node *), Bash(which *), WebSearch, WebFetch
model: sonnet
---

Read the codebase and write comprehensive documentation for the project.

## Output location
All output files must be written relative to the **current working directory** (the directory where this command was invoked), not to any subdirectory discovered during codebase exploration. For example, if the output folder is `docs`, write to `./docs/architecture.md` — never to `./some-subfolder/docs/architecture.md`.

## Behavior
- Work silently through all steps without narrating what you are doing. Do not write messages like "I will create...", "Creating...", "Now I'll...", etc.
- Only ask questions about the **codebase** when information is truly ambiguous and cannot be inferred. Otherwise proceed without prompting. This rule does NOT apply to missing arguments — those must always be asked (see Arguments).
- Do not run `mkdir`. Use the Write tool directly — it creates parent directories automatically.
- Never use `ls`, `find`, `cat`, `head`, `tail`, or `grep` shell commands. Use `Glob` for file discovery, `Read` for file contents, and `Grep` for searching file contents.
- **Never fabricate, assume, or infer information that is not directly supported by the code.** Every claim in the documentation must be traceable to something you actually read. If a piece of information is not found, **omit it entirely** — do not fill the gap with guesses, plausible-sounding details, or vague placeholders.
- **Do not complete partial flows with assumed steps.** If only one side of an interaction is visible in the codebase (e.g. consuming a resource but not creating it), document only what you can see. Do not infer what other actors, services, or packages do unless you have read their code and found explicit evidence.
- **Do not attribute a capability to a package based on circumstantial evidence.** Finding a related constant, config field, or data type is not sufficient — you must find an explicit action (API call, handler, UI trigger) in that package's own code before claiming it performs that action.
- **When in doubt, leave it out.** If you are not 100% certain a fact is supported by code you have read, do not write it. Speculation, educated guesses, and "likely" or "probably" statements are strictly forbidden. Silence is always preferable to a wrong or unverified claim.

## Arguments

**Before doing anything else** — before reading the codebase, before any steps — resolve the output type and name by following the steps below in order. Do not begin Step 1 until the user has answered every required question.

You may never assume or default these values. Each missing value requires a real response from the user.

Parse $ARGUMENTS as space-separated: first word is output type, second word (if present) is the name.

**Question 1 — if output type is missing:**
Send this message and stop: "Which output format?  1) Markdown (multiple .md files)  2) PDF (single styled document)"
Do not ask anything else in the same message. Wait for the user to reply before continuing.

**Question 2 — if name is missing (ask this as a separate message, after Question 1 is answered):**
- For **markdown**: send "Output folder name? (default: `docs`)" and stop. Wait for the user to reply.
- For **pdf**: send "Output file name? (default: `documentation.pdf`)" and stop. Wait for the user to reply.

**Rules:**
- Output type must be `markdown` or `pdf` only
- For **markdown**: the name is the output folder. If it already exists, ask "Folder `<name>` already exists.  1) Proceed and overwrite  2) Cancel" and wait for reply.
- For **pdf**: the name is the output PDF file path. Write the temp HTML to `_temp_docs.html` at the project root.

## Steps

### 1. Explore the project codebase
Gather context before writing anything:
- Use Glob to map the top-level structure and identify what kind of project this is (language, framework, tooling)
- Read the primary README or project description file — **treat the README as the authoritative source for deployment URLs, environment names, branch-to-environment mappings, and any information explicitly documented there**
- Read the dependency manifest (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, etc.)
- Read environment/configuration examples if present (.env.example, config.yml.example, etc.)
- Read the main deployment or infrastructure definition file if present (serverless.yml, docker-compose.yml, Dockerfile, terraform files, etc.)
- Read CI/CD pipeline configs if present
- Read 2-3 representative files from each major layer (controllers/routes, services/handlers, models/entities, background workers)
- Note any existing documentation files at the root or in a /docs folder

#### Multi-project detection
If the root contains multiple subdirectories that each look like independent projects (each has its own dependency manifest, Dockerfile, or similar), treat this as a **multi-project repository**:
- Read the README of **every subproject** — do not skip package-level READMEs. They often contain deployment URLs, environment-specific configuration, and context not present in the root README
- Explore each subproject the same way you would explore a single project above
- Determine whether the subprojects are related: look for shared API calls, shared event/message contracts, references to each other's URLs/service names, shared authentication, or shared data stores
- If they are related, document the **cross-project interactions** as the primary flows in `flows.md` (e.g. "Frontend calls Backend API", "Worker consumes queue published by API"), using sequence diagrams that span multiple services
- If they are unrelated, document each subproject's internal flows separately, clearly labelled by subproject name
- **Ignore dead flows**: if a flow, endpoint, or handler exists in one subproject but is never called, triggered, or referenced by any other subproject or by any visible entry point (HTTP call, event, schedule, queue message, UI action), omit it from the documentation entirely. Do not document something just because it exists in the code.

### 2. Create `architecture.md`
High-level overview of the system: what kind of application it is, the main structural layers and their responsibilities, and how those layers communicate. Focus on conceptual structure and the infrastructure model — do not enumerate individual files or folders.

### 3. Create `infrastructure.md`
Technologies used (languages, frameworks, bundlers, core libraries), how the application is hosted, cloud services, logging, how environments are configured and secrets are stored, and the release process if available. For deployment URLs and environment-to-branch mappings, use the exact values from the READMEs — never use placeholder text like "CloudFront (dev)" when the actual URL is available.

### 4. Create `flows.md`
Main system flows ordered by importance first, then by natural execution order within each flow. Stay high-level — no individual fields or low-level implementation details. Include a Mermaid diagram (sequence or flowchart, whichever fits best) for each flow.

**Only include flows with confirmed entry points.** Before adding a flow, verify that it is reachable via an actual entry point — an HTTP route called by the UI, a queue consumer triggered by a producer, a scheduled cron, a Lambda invoked from code, or a UI action backed by a handler. If a flow exists in code but you cannot find evidence that anything calls or triggers it, omit it. Do not document flows speculatively.

### 5. Create `integrations.md`
Third-party providers that interact with the application at runtime and require API keys or credentials (e.g. payment gateways, email providers, SMS services, analytics, OAuth providers). For each: why/how it is used, any dependencies (VPN, certificates, etc.), and a link to its documentation.

Do not include cloud infrastructure services (e.g. AWS, GCP, Azure, or their individual services like S3, SQS, RDS) — those belong in `infrastructure.md` and may be referenced in `flows.md` where relevant.

### 6. Create `setup.md`
Comprehensive instructions for running the project for the first time. Do not list or suggest specific environment variable values.

For environment variables:
- If a `.env.example` file exists in the project: reference it directly (e.g. "Copy `.env.example` to `.env` and fill in the values"). Do not enumerate the variables — the file is the source of truth.
- If no `.env.example` exists: list only the variable names visible in committed config files, and instruct the reader to request the values from a team member.

## PDF Output

If the output format is **pdf**, write all sections into a single HTML file using **exactly** the template below (instead of individual `.md` files), then convert with:

```
node .claude/scripts/html-to-pdf.js <path-to-html> <path-to-output.pdf>
```

> **Important**: Use this path verbatim. Do NOT expand `.claude/` to `~/.claude/` or any absolute path. The working directory is the project root, so `.claude/scripts/html-to-pdf.js` resolves correctly as-is.

Delete the temporary HTML file after the PDF is successfully generated:
```
node .claude/scripts/cleanup.js <path-to-html>
```

### HTML Template

Read `.claude/templates/docs.html` and fill in these placeholders. **Do not change any CSS, colors, class names, or layout in that file.**

| Placeholder | Value |
|---|---|
| `{{TITLE}}` | Project name |
| `{{COVER_TAG}}` | `Technical Documentation` |
| `{{DATE}}` | Today's date |
| `{{TOC_ITEMS}}` | Five `<li>` elements — one per section |
| `{{SECTIONS}}` | Five `.page.section-page` divs with a `.content` div each |
| `{{MD_SCRIPTS}}` | Five `<script type="text/plain" id="mdN">` tags with raw markdown |
| `{{SECTION_COUNT}}` | `5` |

TOC `<li>` format:
```html
<li><span class="toc-num">01</span><span class="toc-label">Architecture</span><span class="toc-desc">System structure, layers, and deployment model</span></li>
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
<script type="text/plain" id="md1">...raw markdown...</script>
```

The five sections in order: Architecture, Infrastructure, System Flows, Integrations, Setup Guide.
