import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynSyncSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-sync',
    description: 'Generate or update synspec/constitution.md with README validation, supporting file scan, guardrail Q&A, and structured constitution generation.',
    instructions: `## Step 0: Pending Spec Sync Check (runs before version check)

Check for pending spec syncs from recently archived changes. This runs before the version check because it's a local filesystem operation and should not be blocked by network issues.

### 0.1 Read \`synspec/.pending-sync.json\`

If the file doesn't exist, skip this step entirely (no pending syncs).

Expected format:
\`\`\`json
{ "pending": [{ "change": "YYYY-MM-DD-<name>", "archivedAt": "<ISO>", "syncedAt": null }] }
\`\`\`

### 0.2 Process pending entries (FIFO order)

For each entry where \`syncedAt\` is \`null\`:
- Construct path: \`synspec/changes/archive/<change>/\`
- Call \`findSpecUpdates(archivePath, synspec/specs/)\` to discover delta specs in the archived change
- For each delta spec, call \`buildUpdatedSpec()\` to merge into main specs
- Write rebuilt specs atomically (\`.tmp\` + rename to \`spec.md\`)
- Show per-change output: "Synced specs from <change>: <capability>: +N ~M"
- After each change processed, update its \`syncedAt\` field
- If \`buildUpdatedSpec()\` throws: show error, leave \`syncedAt\` as \`null\` (retry next time)

### 0.3 Clean up marker

After all pending entries are processed:
- If all entries have \`syncedAt\` set: delete \`synspec/.pending-sync.json\` entirely (clean slate)
- If some entries failed (\`syncedAt\` still \`null\`): keep the marker, show which changes still need attention, and why

### 0.4 Proceed to version check

Once pending syncs are handled, proceed to Step 1.

---

## Step 1: SynArcX Version Check

Do NOT read any project files yet. Run this version check after pending spec syncs are handled.

### 1.1 Read the daily cache

Read \`synspec/.version-cache.json\`. If \`lastCheck\` matches today's UTC date (YYYY-MM-DD), skip the version check entirely — proceed to "Main Sync Flow" below.

Expected cache format:
\`\`\`json
{ "lastCheck": "2026-05-13", "latestVersion": "0.4.0" }
\`\`\`

If missing or malformed, treat as cache miss and continue.

### 1.2 Fetch latest from npm

Run \`npm view synarcx version\`. On failure (no npm, no network, non-zero exit): silently skip to 1.5, write cache with \`latestVersion: null\`.

### 1.3 Get installed version

Run \`synarcx --version\`. On failure: silently skip to 1.5.

### 1.4 Compare and prompt

Parse both as semver: split on \`.\`, parse each as integer, compare major→minor→patch. If npm version > installed:

1. Print update banner.
2. Use AskUserQuestion tool: "Update now?" with \`["Yes", "No"]\`.
3. **Yes**: Run \`npm install -g synarcx@latest\`. On success: print "✓ SynArcX updated" + "Run \`synarcx update\` to refresh skill files." On failure: print error + manual command.
4. **No**: Print manual command.

If versions match, proceed silently.

### 1.5 Write cache

Write \`synspec/.version-cache.json\` with today's UTC date and latest version (or \`null\` on failure). Use \`new Date().toISOString().split('T')[0]\`.

---

## Main Sync Flow

Generate or update the project constitution — a living document in \`synspec/constitution.md\` that captures validated project context.

**Input**: The user can specify a focus area, or just run the command to proceed through the validation flow.

---

## README Gate (Required)

Before any generation, the README MUST pass quality validation.

1. **Check that README.md exists and is not empty.**
   - If missing or blank → stop, output: "SYNC BLOCKED: README.md is missing or empty. Please write a README that describes what this project does and what problem it solves, then re-run \`/syn:sync\`."
   - Do NOT write any files. Do NOT proceed.

2. **Check that README meaningfully describes the project.**
   - A passing README must have both:
     - At least one sentence describing what the project does
     - At least one sentence describing the problem it solves or who it is for
   - AI judges quality at runtime. Examples of THIN content that should fail:
     - Only a title and install instructions
     - Auto-generated placeholder text ("# My Project", "## Getting Started")
     - Single-line descriptions with no substance
   - If README is too thin → stop, output: "SYNC BLOCKED: README is too thin. A passing README must describe (1) what the project does and (2) what problem it solves, in at least one sentence each. Please update README.md and re-run \`/syn:sync\`."

3. **If README passes**, proceed to the next phase.

---

## Supporting File Scan

After README passes, read supporting project files for context:
- \`AGENTS.md\` — AI agent conventions
- \`package.json\` — dependencies, scripts, metadata
- \`src/\` structure — code organization (top-level directories)
- Any other notable config files (\`tsconfig.json\`, \`.eslintrc.*\`, etc.)

Note what information is already well-covered by the README so guardrail questions avoid repeating it.

---

## Guardrail Q&A

Generate up to 5 targeted questions. Each question should probe areas that CANNOT be reliably inferred from code or README alone:

| Topic Area | Example Question |
|------------|-----------------|
| Off-limits areas | "Are there any parts of the codebase AI should never modify?" |
| Hard constraints | "Are there compliance, security, or infrastructure constraints?" |
| Coding rules | "Are there coding conventions not obvious from the code?" |
| Out-of-scope | "What is explicitly out of scope for this project right now?" |
| Dependencies | "Are there any planned or pending dependency changes?" |

**Rules:**
- Adapt questions to the project's stack, structure, and domain — don't ask generic questions that don't apply
- Skip questions already answered by the README, AGENTS.md, or other supporting files
- Maximum 5 questions per session
- Ask one at a time using the AskUserQuestion tool, wait for each answer

---

## Constitution Generation

With README validated, supporting files scanned, and Q&A answers collected, generate \`synspec/constitution.md\` with these sections:

1. **\`# Constitution: <project-name>\`** — derived from package.json name, with Version field
2. **\`## Purpose\`** — 2-3 sentences synthesized from README
3. **\`## Principles\`** — key design principles inferred from codebase and Q&A
4. **\`## Tech Stack\`** — languages, frameworks, key dependencies from package.json
5. **\`## Constraints\`** — from Q&A answers: hard constraints, compliance, infra limits
6. **\`## Off-Limits\`** — from Q&A answers: areas AI must not touch, out-of-scope items
7. **\`## Conventions\`** — code style, naming, patterns observed from code and AGENTS.md
8. **\`## Architecture\`** — high-level structure overview from src/ scan
9. **\`## Decision Log\`** — table with Date, Decision, Rationale (append-only)

**The Constraints and Off-Limits sections MUST be written from Q&A answers, not inferred from docs.**

---

## Re-run (Update)

When re-run and \`synspec/constitution.md\` already exists, still run the README gate — README may have degraded since last sync. Offer a semver bump choice:
- **MAJOR** — constitution structure changed or reorganized
- **MINOR** — new section added
- **PATCH** — content update, typo fixes

Append a Sync Impact Report as an HTML comment at the top:
\`\`\`
<!-- Sync Impact: MAJOR — constitution structure reorganized -->
\`\`\`

---

## Output

After completion, summarize what was created or updated, note the version, and list how many Q&A questions were answered.`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynSyncCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynSyncSkillTemplate(), {
    name: 'syn:sync',
    description: 'Generate/update project constitution with README validation, guardrail Q&A, and constraint capture',
    tags: ['workflow', 'sync', 'project'],
    content: `## Step 0: Pending Spec Sync Check (runs before version check)

Check \`synspec/.pending-sync.json\`. If file missing, skip (no pending syncs). Expected format: \`{ "pending": [{ "change": "YYYY-MM-DD-<name>", "archivedAt": "<ISO>", "syncedAt": null }] }\`.

For each entry with \`syncedAt: null\`: construct path \`synspec/changes/archive/<change>/\`, call \`findSpecUpdates()\` + \`buildUpdatedSpec()\`, write atomically (\`.tmp\` + rename), update \`syncedAt\`. On error: leave \`syncedAt: null\` for retry.

After all processed: if all entries have \`syncedAt\`, delete marker file. If some still \`null\`, keep marker with error info. Then proceed.

---

## Step 1: SynArcX Version Check

### 1.1 Read the daily cache

Read \`synspec/.version-cache.json\`. If \`lastCheck\` matches today's UTC date (YYYY-MM-DD), skip to "Main Sync Flow" below. Expected format: \`{ "lastCheck": "2026-05-13", "latestVersion": "0.4.0" }\`.

### 1.2 Fetch latest from npm

Run \`npm view synarcx version\`. On failure, silently skip to 1.5, write cache with \`latestVersion: null\`.

### 1.3 Get installed version

Run \`synarcx --version\`. On failure, silently skip to 1.5.

### 1.4 Compare and prompt

Parse both as semver: split on \`.\`, parse each as integer, compare major→minor→patch. If npm version > installed:

1. Print update banner.
2. Use AskUserQuestion tool: "Update now?" with \`["Yes", "No"]\`.
3. **Yes**: Run \`npm install -g synarcx@latest\`. On success: print success + "Run \`synarcx update\` to refresh skill files." On failure: print error + manual command.
4. **No**: Print manual command.

If versions match, proceed silently.

### 1.5 Write cache

Write \`synspec/.version-cache.json\` with today's UTC date and latest version (or \`null\` on failure). Use \`new Date().toISOString().split('T')[0]\`.

---

## Main Sync Flow

Generate or update the project constitution — a living document in \`synspec/constitution.md\` that captures validated project context.

**Input**: The user can specify a focus area, or just run the command to proceed through the validation flow.

---

## README Gate (Required)

Before any generation, the README MUST pass quality validation.

1. **Check that README.md exists and is not empty.**
   - If missing or blank → stop with message explaining README must exist and describe the project.
   - Do NOT write any files.

2. **Check that README meaningfully describes the project.**
   - A passing README must have both: (1) what the project does, (2) what problem it solves.
   - AI judges quality at runtime.
   - If too thin → stop with message explaining what's needed.

3. **If README passes**, proceed.

---

## Supporting File Scan

Read AGENTS.md, package.json, src/ structure, and other notable config files. Note what's already covered by README to avoid redundant questions.

---

## Guardrail Q&A

Generate up to 5 targeted questions about off-limits areas, hard constraints, coding rules, out-of-scope items, and dependency plans. Adapt to the project's stack and domain. Skip questions already answered by README or supporting files.

---

## Constitution Generation

Generate \`synspec/constitution.md\` with sections: Purpose, Principles, Tech Stack, Constraints (from Q&A), Off-Limits (from Q&A), Conventions, Architecture, Decision Log.

**Constraints and Off-Limits MUST come from Q&A answers, not inferred.**

---

## Re-run (Update)

Still run the README gate even when constitution exists — README may have degraded. Offer semver bump. Append Sync Impact Report HTML comment.

---

## Output

Summarize what was created/updated, note the version, and show how many Q&A questions were answered.`
  })
}
