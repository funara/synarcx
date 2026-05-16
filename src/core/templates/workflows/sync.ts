import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynSyncSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-sync',
    description: 'Generate or update synspec/constitution.md — scans codebase, interviews the architect, infers invariants, and writes a structured v0.4 constitution.',
    instructions: `Execute this pipeline now — begin with Step 0. Do not describe the pipeline or ask for instructions.

---

## Step 0: Pending Spec Backstop

Check for pending spec syncs from recently archived changes. This runs before the main sync flow because it is a local filesystem operation and must not be blocked by anything else.

### 0.1 Read \`synspec/.pending-sync.json\`

If the file does not exist, skip this step entirely (no pending syncs).

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

### 0.4 Proceed to main sync flow

Once pending syncs are handled, proceed to Step 0.5.

---

## Step 0.5: Weekly Update Check

Check if a newer version of synarcx is available. Runs at most once every 7 days.

1. Read \`~/.synarcx/version-cache.json\` (skip if missing).
   Format: \`{ "lastCheck": "YYYY-MM-DD", "latestVersion": "x.x.x" }\`
   If \`lastCheck\` is within the last 7 days → skip this step entirely and proceed to Stage 1.

2. Run \`synarcx --version\` to get the installed version string (e.g. \`0.4.0\`).

3. Run \`npm view synarcx version\` to get the latest registry version.
   If the command fails or produces no output → write cache with \`latestVersion: null\` and continue.

4. Write \`~/.synarcx/version-cache.json\`:
   \`{ "lastCheck": "<today YYYY-MM-DD>", "latestVersion": "<result>" }\`
   Create \`~/.synarcx/\` if it doesn't exist. Ignore write errors silently.

5. Compare versions (major.minor.patch). If latest > installed, print:
   \`\`\`
   ┌──────────────────────────────────────────────────┐
   │  Update available: <installed> → <latest>        │
   │  npm install -g synarcx@latest                   │
   │  then: synarcx update                            │
   └──────────────────────────────────────────────────┘
   \`\`\`
   Continue with Stage 1 regardless — never block on this.

---

## Stage 1: Mode Detection

Check whether \`synspec/constitution.md\` exists.

**If it EXISTS:**
- Read the YAML frontmatter at the top of the file.
- If the frontmatter does NOT contain a \`schema:\` key: **HARD STOP.**
  Output exactly: "Old constitution format detected. Delete \`synspec/constitution.md\` and re-run \`/syn:sync\` to generate a v0.4 constitution."
  Do NOT write any files. Do NOT proceed further.
- If the frontmatter DOES contain a \`schema:\` key: set mode = \`update\`.

**If it does NOT exist:**
- Check whether meaningful source code exists in the project. Meaningful source code means any of: a \`src/\` directory, a \`lib/\` directory, an \`app/\` directory, an \`index.*\` or \`main.*\` entry point file, or more than 5 non-config files at the root.
- If meaningful source code IS found: set mode = \`brownfield\`.
- If no meaningful source code is found: set mode = \`greenfield\`.

---

## Stage 2: Scan

**GREENFIELD mode:**
- Read \`README.md\` if it exists. Note the stated project intent.
- Skip directly to Stage 4 (interview). Do not scan further.

**BROWNFIELD mode:**
- Scan the repository for context:
  - Top-level directory structure
  - \`package.json\` (name, dependencies, scripts)
  - Entry points (\`index.*\`, \`main.*\`)
  - Middleware or hook files (any files containing "auth", "middleware", or "interceptor" in their name or path)
  - Test patterns (test directory structure, test file naming conventions)
  - Config files (\`.eslintrc.*\`, \`tsconfig.json\`, \`.prettierrc.*\`, etc.)

**UPDATE mode:**
- Perform all BROWNFIELD scans above.
- Additionally, read the existing \`synspec/constitution.md\` in full to capture the current constitution state before any changes.

---

## Stage 3: Inference (BROWNFIELD and UPDATE modes only)

Assign a confidence level to each inferred item:
- \`HIGH\` — unambiguous, single centralized pattern (e.g., all auth logic in one file/directory)
- \`MEDIUM\` — likely correct, but could be an intentional deviation
- \`LOW\` — weak signal; needs confirmation before writing
- \`PENDING\` — cannot determine from code alone — MUST ask the user in Stage 4

Infer for each constitution section:

**\`[INV]\` Invariants:**
Identify centralized patterns such as: auth/authorization, logging, error handling, database access. Each pattern that appears consistently across the codebase is a candidate invariant. Mark as \`HIGH\` if there is a single canonical location; \`MEDIUM\` if there are 2-3 consistent locations; \`LOW\` or \`PENDING\` if scattered.

**\`[BND]\` Boundaries:**
Identify layer directories (e.g., \`controllers/\`, \`services/\`, \`repositories/\`). Identify import patterns between layers — does code in one layer ever import from another layer directly?

**\`[DFT]\` Drift Signals:**
Identify patterns that, if violated, would indicate architectural drift. Example: "If DB calls appear outside \`/repository\` → violates INV." These become the drift detection rules.

**\`[WFL]\` Workflow:**
Look at git patterns (branch naming, commit style), CI config files (\`.github/workflows/\`, \`Jenkinsfile\`, etc.), and PR rules (\`.github/CODEOWNERS\`, PR templates).

---

## Stage 4: Clarify (MANDATORY — cannot skip under any circumstances)

This stage MUST run. Do not skip it even if you believe all sections are fully inferred.

**GREENFIELD mode — Architect Interview:**

Ask ALL 5 questions, one at a time, using the AskUserQuestion tool. Wait for each answer before asking the next.

1. "What is this system? Describe what it does in 1-2 sentences."
2. "What problem does it solve or who is it for?"
3. "What is one rule about this system that must NEVER change, even as it grows?"
4. "Are there layer or module boundary rules? (e.g., UI never calls DB directly)"
5. "What is explicitly out of scope for the current phase?"

Map each answer to constitution items with \`confidence=explicit, source=user\`.

**BROWNFIELD mode — Targeted Confirmation:**

Ask only about items marked \`PENDING\` from Stage 3, and about any required sections that are still empty (\`[INV]\` or \`[WFL]\`).

Use this deterministic question template for each PENDING item:
"I see [pattern] in [location]. Is this an architectural invariant (must never change) or just the current implementation?"
Offer options: [Mark as Invariant] [Just Implementation] [Skip]

**Both modes — Required check before proceeding:**

\`[INV]\` and \`[WFL]\` MUST each have at least one item before proceeding to Stage 5. If either section is still empty after the interview, ask the user directly: "I still need at least one [invariant / workflow rule] to include in the constitution. Can you describe one?"

---

## Stage 5: Normalize

**Assign stable IDs:**
- Invariants: \`INV-001\`, \`INV-002\`, ... (sequential, zero-padded to 3 digits)
- Decisions: \`DEC-001\`, \`DEC-002\`, ...
- Drift signals: \`DFT-001\`, \`DFT-002\`, ...

**Compute fingerprint:**
Concatenate all \`[INV]\` item texts and all \`[DEC]\` item texts in section order (no separators). Apply djb2 hash: start with \`h = 5381\`; for each character code \`c\` in the string: \`h = ((h << 5) + h) ^ c\`; after all characters: \`result = (h >>> 0).toString(16).padStart(8, '0')\`.

**Assemble YAML frontmatter:**
\`\`\`yaml
---
schema: synarcx/constitution@0.4
version: <1 for new, increment by 1 for update>
last_sync: <today YYYY-MM-DD>
fingerprint: <computed 8-char hex>
mode: <greenfield | brownfield | update>
---
\`\`\`

**Write the \`[QR]\` Quick Reference section (60 tokens or fewer):**
Include:
- Primary layer rule if any boundary rule was inferred
- Primary auth/security invariant if any was identified
- Tech stack as a single line (language + key framework)
- Mode and last_sync date

---

## Stage 6: Write

**GREENFIELD or BROWNFIELD (first run):**
Write the full \`synspec/constitution.md\` file using this 8-section structure:

\`\`\`
---
<YAML frontmatter from Stage 5>
---

## [QR] Quick Reference
<60-token summary>

## [INV] Invariants
<INV-001 through INV-NNN with confidence and source>

## [BND] Boundaries
<Layer and import boundary rules>

## [DEC] Decisions
<DEC-001 through DEC-NNN — architectural decisions and rationale>

## [DFT] Drift Signals
<DFT-001 through DFT-NNN — patterns that indicate drift if violated>

## [WFL] Workflow
<Git, CI, PR rules and conventions>

## [EXC] Exclusions
<Explicit out-of-scope items for current phase>

## [OWN] Ownership
<Module ownership or team responsibility notes if any>
\`\`\`

**UPDATE mode:**
- For each section, compare old content (read in Stage 2) to new content (assembled in Stages 3–5).
- Only rewrite sections that have changed. Preserve unchanged sections byte-for-byte.
- Write atomically: write to \`synspec/constitution.md.tmp\` first, then rename to \`synspec/constitution.md\`.
- Increment the \`version\` field by 1.
- Recompute the fingerprint from the new \`[INV]\` + \`[DEC]\` content.

**Output:**
Summarize what was created or updated. State the version number. List how many items are in each section (e.g., "[INV]: 4 items, [BND]: 2 items, [DFT]: 3 items").`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.4' },
  };
}

export function getSynSyncCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynSyncSkillTemplate(), {
    name: 'syn:sync',
    description: 'Generate/update project constitution with codebase scan, architect interview, and structured v0.4 constitution output',
    tags: ['workflow', 'sync', 'project'],
    content: `Execute this pipeline now — begin with Step 0. Do not describe the pipeline or ask for instructions.

---

## Step 0: Pending Spec Backstop

Check \`synspec/.pending-sync.json\`. If missing, skip (no pending syncs). Expected format: \`{ "pending": [{ "change": "YYYY-MM-DD-<name>", "archivedAt": "<ISO>", "syncedAt": null }] }\`.

For each entry with \`syncedAt: null\`: construct path \`synspec/changes/archive/<change>/\`, call \`findSpecUpdates()\` + \`buildUpdatedSpec()\`, write atomically (\`.tmp\` + rename), update \`syncedAt\`. On error: leave \`syncedAt: null\` for retry.

After all processed: if all entries have \`syncedAt\`, delete marker file. If some still \`null\`, keep marker with error info. Then proceed to Step 0.5.

---

## Step 0.5: Weekly Update Check

Read \`~/.synarcx/version-cache.json\`. If \`lastCheck\` is within the last 7 days → skip entirely. Otherwise: run \`synarcx --version\` (installed), run \`npm view synarcx version\` (latest). Write cache \`{ lastCheck, latestVersion }\`. If latest > installed, print update banner. Never block — always continue to Stage 1.

---

## Stage 1: Mode Detection

Check if \`synspec/constitution.md\` exists.
- EXISTS + no \`schema:\` in frontmatter → **HARD STOP**: "Old constitution format detected. Delete \`synspec/constitution.md\` and re-run \`/syn:sync\` to generate a v0.4 constitution."
- EXISTS + \`schema:\` present → mode = \`update\`
- NOT exists + meaningful source code (src/, lib/, app/, index.*, main.*, or >5 non-config files) → mode = \`brownfield\`
- NOT exists + no meaningful source code → mode = \`greenfield\`

---

## Stage 2: Scan

- **GREENFIELD**: Read README.md if it exists. Note project intent. Skip to Stage 4.
- **BROWNFIELD**: Scan top-level dirs, package.json (name, deps, scripts), entry points, middleware/auth/interceptor files, test patterns, config files (.eslint, tsconfig, etc.).
- **UPDATE**: Same as BROWNFIELD + read existing \`synspec/constitution.md\` in full.

---

## Stage 3: Inference (BROWNFIELD/UPDATE only)

Assign confidence per item: \`HIGH\` (unambiguous), \`MEDIUM\` (likely), \`LOW\` (weak signal), \`PENDING\` (must ask user).

Infer:
- \`[INV]\`: Centralized auth, logging, error handling, DB access patterns.
- \`[BND]\`: Layer directories and cross-layer import patterns.
- \`[DFT]\`: Rules whose violation signals drift (e.g., "DB calls outside /repository → violates INV").
- \`[WFL]\`: Git branch/commit style, CI config, PR rules.

---

## Stage 4: Clarify (MANDATORY)

Cannot skip. Must run regardless of inferred confidence.

**GREENFIELD** — ask ALL 5, one at a time:
1. "What is this system? Describe what it does in 1-2 sentences."
2. "What problem does it solve or who is it for?"
3. "What is one rule about this system that must NEVER change, even as it grows?"
4. "Are there layer or module boundary rules? (e.g., UI never calls DB directly)"
5. "What is explicitly out of scope for the current phase?"

**BROWNFIELD** — ask only about PENDING items and empty required sections. Template: "I see [pattern] in [location]. Is this an architectural invariant or just the current implementation?" Options: [Mark as Invariant] [Just Implementation] [Skip].

**Both modes**: \`[INV]\` and \`[WFL]\` MUST each have at least one item before proceeding. If empty after interview, ask again.

---

## Stage 5: Normalize

- Assign stable IDs: \`INV-001\`, \`DEC-001\`, \`DFT-001\` (sequential, zero-padded to 3 digits).
- Compute fingerprint: concatenate all \`[INV]\` + \`[DEC]\` item texts in order, apply djb2 (\`h=5381; h=((h<<5)+h)^c per char; (h>>>0).toString(16).padStart(8,'0')\`).
- Assemble frontmatter: \`schema: synarcx/constitution@0.4\`, \`version\` (1 for new, increment for update), \`last_sync\` (YYYY-MM-DD), \`fingerprint\`, \`mode\`.
- Write \`[QR]\` (≤60 tokens): primary layer rule, primary auth/security invariant, tech stack one-liner, mode + last_sync.

---

## Stage 6: Write

- **First run (greenfield/brownfield)**: Write full \`synspec/constitution.md\` with all 8 sections: \`[QR]\`, \`[INV]\`, \`[BND]\`, \`[DEC]\`, \`[DFT]\`, \`[WFL]\`, \`[EXC]\`, \`[OWN]\`.
- **UPDATE**: Compare old vs new per section. Only rewrite changed sections; preserve unchanged sections byte-for-byte. Write atomically (.tmp + rename). Increment version. Recompute fingerprint.

**Output**: Summarize what was created/updated, state version, list item count per section.`,
  });
}
