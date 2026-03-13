---
description: Generate documentation from the project codebase
argument-hint: [markdown|pdf] [folder-or-filename]
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(node *), Bash(which *), WebSearch, WebFetch
model: sonnet
context: fork
---

Read the codebase and write comprehensive documentation for the project.

> **Write only what you read.** Every claim must trace to code you actually read. If not found, omit it. No guesses, no "likely", no "probably". When in doubt, leave it out.

## Behavior
- No narration. Work silently — no "I will...", "Creating...", "Now I'll..." messages.
- **Never use Bash for file exploration.** The only permitted Bash calls are `node` and `which`. Use Glob to find files, Read to read them, Grep to search content. Never call `ls`, `find`, `cat`, `head`, `tail`, or `grep` via Bash.
- Only ask about the codebase when truly ambiguous. Never assume or skip required arguments (see Arguments).
- **Write in technical documentation style.** Use concise, precise language. Prefer bullet points and short paragraphs over prose. No conversational tone, no filler, no preamble.
- **Do not enumerate files, folders, or classes.** Documentation must describe concepts, layers, and behaviours — never lists of filenames or directory paths.
- **Do not complete partial flows.** If only one side of an interaction is visible, document only what you can see. Do not infer what other services do unless you have read their code.
- **Do not attribute a capability based on circumstantial evidence.** A related constant, config field, or type is not enough — you must find an explicit action (API call, handler, UI trigger) in that code before claiming it does something.
- **Never mix URLs across services.** A URL found in one service's README or config belongs only to that service. Do not assign it to another service, even if the names or contexts seem related.
- **Omit empty sections.** If no relevant data exists for a section (e.g. no integrations, no infrastructure config), skip that file entirely. Do not create a file with placeholder text or "none found" notes.
- **Never write meta-commentary.** Do not include notes about how the document was generated, what was omitted, why, or how the project is structured across services. Documents must contain only content a reader would need — no instructions, no methodology notes, no disclaimers, no preambles explaining what the section covers.

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
- Use Grep to locate relevant code before reading files — read a file only when Grep confirms it contains what you need for a specific section
- Read entry points first per layer (routes, services, models, workers); only go deeper into a layer if the entry point leaves a gap you cannot omit
- Cap: read at most 15 implementation files in total (excluding README, manifests, config files, and existing docs)
- If a gap cannot be filled from the files read within this cap, omit that claim rather than infer it
- Read any existing docs and treat them as authoritative sources alongside the README

**Multi-project repos:** if multiple subdirectories each have their own dependency manifest or Dockerfile, treat as a multi-project repo. Only call it a monorepo if there is a single `.git` folder at the root — if each subdirectory has its own `.git`, they are independent projects; document all of them but do not use the term "monorepo":
- Read every subproject's README
- Explore each subproject as above
- Check for cross-project links: shared API calls, event contracts, URLs, auth, data stores
- Related subprojects → document cross-project interactions as primary flows in `flows.md`
- Unrelated subprojects → document each separately, labelled by name
- **Ignore dead flows**: if a flow, endpoint, or handler is never called, triggered, or referenced by any visible entry point (HTTP call, event, schedule, queue message, UI action), omit it entirely. Do not document something just because it exists in the code.

### 2. Create `architecture.md`
High-level system overview: what it is, the architectural pattern, the main structural layers and their responsibilities, and how those layers communicate. Only name a pattern (e.g. MVC, event-driven, microservices) if it is clearly evident from the code structure — do not assign a label just because a framework is present. Focus on conceptual structure — **do not enumerate individual files, folders, or classes**.

### 3. Create `infrastructure.md`
Use bullet points for every list. Never write multiple items as a comma-separated sentence. Cover:
- **Languages & runtimes**: one bullet per language/runtime with its version
- **Frameworks**: one bullet per framework with its version
- **Core libraries**: one bullet per notable library with its version
- **Hosting & cloud services**: one bullet per service
- **Monitoring & alerting**: one bullet per tool (omit if none found)
- **Logging**: how logs are collected and where they go — only if the logging destination is explicitly configured in code or config; omit if only a logging library is imported
- **Environments**: one subsection per environment (dev/staging/prod) describing what differs
- **Secrets management**: how secrets are stored and injected — only if the mechanism is explicitly visible in code or config, not inferred from a library import or the presence of `.env.example`
- **Release & deployment**: the exact steps or commands to deploy

Use exact URLs and environment names from READMEs — no placeholders. **Never construct a URL** — every URL written must be copied verbatim from the codebase or README.

**Version numbers** must come from a manifest file (package.json, requirements.txt, go.mod, Dockerfile, etc.). If a version is not explicitly stated in a file you read, omit it rather than recall it from memory.

For multi-project repos, document each subproject's infrastructure in its own clearly labelled section. Do not merge or mix infrastructure details across subprojects.

### 4. Create `flows.md`
Write all eligible main system flows. **Finish all flows in one group before starting the next** — do not interleave groups:
1. Core product flows (the main thing the product does)
2. Auth flows (login, logout, token refresh, password reset)
3. Onboarding flows (registration, first-time setup)
4. Supporting flows (notifications, background jobs, webhooks)
5. Admin flows

Within each group, follow natural sequence (e.g. registration before login, login before checkout). High-level only — no individual fields or implementation details. Include a Mermaid diagram (sequence or flowchart) per flow.

**Never mention file names, function names, or class names in flow descriptions.** Describe behaviour and actors only — what happens, who initiates it, what system responds. Use layer or service names (e.g. "API", "Auth Service", "Database"), not the names of the files or functions that implement them.

**Mermaid diagrams — syntax rules:**
- Always declare every participant/node before using it in an edge or message
- Use `-->` for sequence diagrams, `-->` or `---` for flowcharts — never mix arrow styles across diagram types
- Close every bracket: `{}`, `[]`, `()`
- If unsure about a diagram's correctness, use a simpler diagram type rather than risk broken syntax

**Self-check after writing `flows.md`:**
Re-read every `mermaid` block and verify:
- Every node or participant referenced in an edge or message was declared earlier in the same block
- All brackets (`{}`, `[]`, `()`) are closed
- Arrow syntax matches the diagram type (`-->` for sequenceDiagram, `-->` / `---` for flowchart)
- The diagram type keyword is valid

Fix any issue found before moving to the next step. If a diagram cannot be fixed without inventing content, remove the block entirely.

**Reachability gate — apply before writing any flow:**
A flow is eligible only if you can trace an unbroken chain from a concrete entry point to each step you describe:
1. Identify the entry point: a registered HTTP route, a queue/topic consumer, a scheduled cron expression, a Lambda/function handler wired to a trigger, or a UI action that calls real code.
2. Follow the call chain from that entry point through the actual code you read. Every step in the flow must appear in that chain.
3. If any step relies on a function, handler, or service you have not read, or whose wiring to the entry point you cannot confirm, stop the chain there and omit the unconfirmed steps.
4. If no entry point can be found for a function or module — even if it looks important — omit the flow entirely.

Do not document a flow because a handler exists. Document it only because a confirmed trigger calls that handler.

### 5. Create `integrations.md`
Third-party providers that interact with the app at runtime and require API keys or credentials (e.g. payment gateways, email, SMS, analytics, OAuth providers). For each: purpose, how it is integrated (webhook, REST API call, SDK, polling — only state the method if you found the corresponding code, not just a URL or config key), dependencies (VPN, certs, etc.), and a link to its documentation.

For each integration's documentation link: use a URL found in the codebase first. If none is found, only search the web if the provider is a well-known public service (e.g. Stripe, Twilio, SendGrid, Firebase) — skip the search for internal tools, obscure libraries, or anything that looks custom. If no authoritative URL is found or the result is ambiguous, omit the link entirely.

Exclude cloud infrastructure (AWS, GCP, Azure and their services) — those belong in `infrastructure.md`.

**Integration names — accuracy rules:**
- Use the exact name as it appears in the code or config — copy it, do not paraphrase, expand acronyms, or infer a full product name from a partial string.
- If the code uses an acronym (e.g. `SES`, `SNS`), use that acronym. If it uses a full name, use the full name. Never mix or invent a variation not present in the code.

**Self-check after writing `integrations.md`:**
For each integration heading, run a case-insensitive Grep (`output_mode: files_with_matches`) for that exact name against the codebase. If no files match, remove that integration's section entirely. This must be done before moving to the next step.

### 6. Create `setup.md`
Comprehensive first-time setup instructions covering:
- **Prerequisites**: required tools, runtimes, and versions (e.g. Node.js 18, Docker, etc.)
- **Installation**: instruct the reader to clone the repository (do not guess the URL) and install dependencies
- **Environment variables**: if `.env.example` exists, reference it with a single instruction (e.g. "Copy `.env.example` to `.env` and fill in the values") — **stop there, do not read, list, or describe any of its variables**. If no `.env.example` exists, list only the variable names visible in committed config files and instruct the reader to request values from a team member.
- **Running locally**: the exact command(s) to start the project — must come from `package.json` scripts, a Makefile, or README. Never guess a command from convention.
- **Running tests**: the test command — same rule, must be explicitly found. Omit if not found.

### 7. PDF output (skip if format is markdown)

First, resolve the OS temp directory:

```
node -e "console.log(require('os').tmpdir())"
```

Write each included section as a `.md` file into `<tmpdir>/docs-<timestamp>/`, using the canonical filenames: `architecture.md`, `infrastructure.md`, `flows.md`, `integrations.md`, `setup.md`.

Then run:

```
node .claude/scripts/md-to-pdf.js <tmpdir>/docs-<timestamp>/ <output-pdf-path> --title "<project name>"
```

Then delete the temporary folder:

```
node .claude/scripts/cleanup.js <tmpdir>/docs-<timestamp>/
```

> Use these paths verbatim. Do NOT expand `.claude/` to an absolute path.
