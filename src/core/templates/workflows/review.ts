import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynReviewSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-review',
    description: 'Quality gate that verifies implementation, runs sanity checks (test/lint/typecheck), and presents a three-way decision: archive, add more work, or start a new change.',
    instructions: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first — review uses [INV] and [DFT] to verify the implementation upholds project rules."
- If \`[INV]\` or \`[WFL]\` sections have no \`**INV-NNN**\` / \`**WFL-NNN**\` items → STOP with: "Constitution [TAG] section is empty. Run /syn:sync to complete it." (list which sections)
- If valid → read [QR], [INV], [BND], [DFT], and [DEC]. Use these to verify the implementation against invariants and boundary rules.

---

Review a completed change — verify implementation, run sanity checks, and decide next steps.

---

## Steps

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run \`synarcx list --json\` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Reviewing change: <name>" and how to override (e.g., \`/syn:review <other>\`).

2. **Check status**

   \`\`\`bash
   synarcx status --change "<name>" --json
   \`\`\`

   Parse the JSON to get \`schemaName\` and \`artifacts\` status.

   **Verify artifact completion**: If all apply-required artifacts are not done, stop and tell the user to use \`/syn:propose\` or \`/syn:apply\` first.

3. **Gate on task completion**

   Read \`tasks.md\` and count checkboxes. If any tasks remain unchecked:
   - Show progress: "N/M tasks complete"
   - Do NOT run any checks
   - Suggest: "/syn:apply to finish the remaining tasks, then run /syn:review again"
   - Stop here

4. **Collect change state**

   - \`git diff --stat\` to get files changed, additions, deletions
   - Read \`tasks.md\` for complete/incomplete counts

5. **Discover and run sanity checks**

   Probe the project for check commands. Discovery order:
   1. Check \`package.json\` scripts for \`test\`, \`lint\`, \`typecheck\`
   2. If \`Cargo.toml\` exists, check for \`cargo test\`
   3. If no check commands found, skip with a note

   For each discovered command, run it and capture:
   - **Pass**: note the pass count
   - **Fail**: capture error details, route to \`/syn:apply\`
   - **Crash/error**: note "command crashed" with error message, do NOT block the fork

   **Important**: For any failed check, capture only summary counts (pass/fail), not full logs — unless user asks for details.

6. **Build the output**

   **Structured summary first** (scanable at a glance):

   \`\`\`
   Tasks:     N/M  ✓
   Files:     N changed (+A -D)
   Tests:     N/N passed  ✓  (or "N failed" or "ERR — command crashed" or "skipped")
   Lint:      0 errors  ✓   (or "N errors" or "ERR — command crashed" or "skipped")
   Typecheck: clean  ✓      (or "N errors" or "ERR — command crashed" or "skipped")
   \`\`\`

   **Then a narrative paragraph** (context):

   "Change <name> completed N of N tasks across N files (+A -D). All N tests pass, lint is clean, type checking passes. No issues detected."

   Or for failures: "Change <name> completed N of N tasks. N tests failed, lint found N errors. Review the findings below."

7. **Present the fork**

   **If ALL checks pass** (clean):

    Present three options:

    | Option | Label | What happens | Next |
    |---|---|---|---|
    | A | Archive now | AI moves change to archive/ with auto spec sync | Done (specs merged to main) |
    | B | Add more work | AI reads proposal+design for scope boundary, checks scope gate | Scope check → update or route |
    | C | Start a new change | AI suggests creating a fresh change | /syn:propose |

   **For option B (add more work)**: Use the scope gate protocol:

   1. Read \`proposal.md\` capabilities section and \`design.md\` goals/non-goals to establish scope boundary
   2. Ask the user what additional work is needed
   3. **IN SCOPE** (same capabilities, same concern, no non-goal violation):
      - Update \`proposal.md\` if scope description needs widening
      - Update spec with ADDED requirements
      - Update \`design.md\` if new technical decisions
      - Append unchecked tasks to \`tasks.md\`
      - MUST run \`/syn:clarify\` then \`/syn:apply\` — no skipping refinement, no escape hatch for trivial changes
   4. **OUT OF SCOPE** (new capability, different concern, violates non-goal):
      - Inform user: "This is outside the current change's scope."
      - Offer: "Archive current change first?" — YES archives with spec sync, NO leaves active
      - Route: "Start a new change with \`/syn:propose\`"

   **If any checks failed** (dirty):

   Show each finding with context and route to the correct command:

   | Finding | Route |
   |---|---|
   | Test failures | /syn:apply — fix implementation |
   | Lint errors | /syn:apply — fix implementation |
   | Artifact inconsistency | /syn:analyze — reconcile |
   | Unclear requirement | /syn:clarify — refine |
   | Incomplete artifacts | /syn:analyze — complete artifacts |

   List ALL findings in a single output. Let the user decide which to address first.

   **Note**: /syn:quick bypasses review entirely. Quick is the low-risk fast path.

 8. **Archive inline** (when user picks option A, or in Option B out-of-scope with "yes" to archive)

    a. **Check for delta specs**: Look for any \`synspec/changes/<name>/specs/<capability>/spec.md\` files. If any exist, proceed with spec sync. If none exist (infrastructure, doc-only change), skip the marker and just do the directory move.

    b. **Write marker** (only if delta specs exist):
       - Create \`synspec/.pending-sync.json\` if it doesn't exist
       - Add entry: \`{ change: "YYYY-MM-DD-<change-name>", archivedAt: "<ISO timestamp>", syncedAt: null }\`
       - Use the full archive directory name (with date prefix) in the \`change\` field

    c. **Move to archive**:
       - Create \`synspec/changes/archive/\` if missing
       - Target: \`YYYY-MM-DD-<change-name>\`
       - If target already exists: fail with error, suggest renaming
       - Move: \`mv synspec/changes/<name> synspec/changes/archive/YYYY-MM-DD-<name>\`

    d. **Sync specs** (only if delta specs existed):
       - Call \`findSpecUpdates(archivePath, synspec/specs/)\` to discover delta specs
       - For each delta: call \`buildUpdatedSpec()\`, write atomically (\`.tmp\` + rename)
       - Show per-capability progress: "Syncing specs for <capability>: +N added, ~M modified"
       - Update marker entry with \`syncedAt\` timestamp
       - On failure: change is already safely archived, show error, marker stays \`null\` for backstop retry

    e. **Update marker** with \`syncedAt\` timestamp.

    f. **Constitution patch** (archive→constitution):
       - Read \`design.md\` and \`tasks.md\` from the archive directory
       - Extract design decisions matching the strict format:
           \`\`\`
           ### D<N>: <title>
           **Decision**: <text>
           **Rationale**: <text>
           \`\`\`
       - Scan \`design.md\` and \`tasks.md\` for "Exception to INV-NNN:" patterns to collect exceptions
       - Write \`synspec/.constitution-patch.json\` in this format:
           \`\`\`json
           { "patches": [
             { "type": "decision", "decision": "...", "rationale": "...", "source": "archive" },
             { "type": "exception", "ref": "INV-NNN", "exception": "..." }
           ] }
           \`\`\`
       - Call \`synarcx patch constitution\` — the command appends entries, deduplicates by first 60 chars, and auto-deletes the patch file on success
       - Report the command output (e.g., "Constitution patched: +N decisions, +N exceptions. version: X → Y")

    g. **Final confirm**:
       - "Archived <change-name> to synspec/changes/archive/YYYY-MM-DD-<name>/"
       - If specs were synced: "Specs synced: <capability>: +N ~M"
       - Constitution patch summary

---

## Output (Clean)

\`\`\`
Tasks:     7/7  ✓
Files:     5 changed (+124 -12)
Tests:     42/42 passed  ✓
Lint:      0 errors  ✓
Typecheck: clean  ✓

Change add-user-auth completed 7 of 7 tasks across 5 files (+124 -12). All 42 tests pass, lint is clean, type checking passes. No issues detected.

This change is clean. What would you like to do?
[A] Archive now    [B] Add more work    [C] Start a new change
\`\`\`

## Output (Dirty)

\`\`\`
Tasks:     7/7  ✓
Files:     5 changed (+124 -12)
Tests:     38/42 passed  ⚠  4 failing
Lint:      3 errors  ⚠
Typecheck: clean  ✓

Change add-user-auth completed 7 of 7 tasks. 4 tests failing in auth.test.ts, lint found 3 style issues. Type checking passes.

Findings:
╳ 4 tests failing in auth.test.ts
  → Try /syn:apply to fix the implementation

╳ 3 lint errors in src/auth.ts
  → Try /syn:apply to fix the implementation
\`\`\`

## Output (Tasks Incomplete — Gate)

\`\`\`
Tasks:     4/7 tasks complete

This change still has 3 tasks remaining.
→ Use /syn:apply to finish the remaining tasks, then run /syn:review again.
\`\`\`

## Output (Archived with Spec Sync)

\`\`\`
## Archive Complete

**Change:** <change-name>
**Archived to:** synspec/changes/archive/YYYY-MM-DD-<name>/

Specs synced:
  review-command: +2 added, ~1 modified

All tasks complete. All checks passed. Change archived.
\`\`\`

## Output (Archived — No Delta Specs)

\`\`\`
## Archive Complete

**Change:** <change-name>
**Archived to:** synspec/changes/archive/YYYY-MM-DD-<name>/

No delta specs to sync. Change archived.
\`\`\`

## Guardrails
- Do NOT run checks if tasks are incomplete — gate at step 3
- Checks are read-only — do not modify project files during checks
- Archive happens BEFORE spec sync — if sync fails, change is safely archived
- Always list ALL findings at once, don't ask "fix one at a time"
- For failed checks, show only summary counts unless user asks for details
- If user picks "add more work," use scope gate protocol: read proposal capabilities + design goals/non-goals before acting
- MUST run clarify after any in-scope expansion — no escape hatch for trivial changes
- Out-of-scope work: offer to archive first, then route to \`/syn:propose\`
- Quick bypasses review — do not suggest review to users who used /syn:quick`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.4' },
  };
}

export function getSynReviewCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynReviewSkillTemplate(), {
    name: 'syn:review',
    description: 'Review a completed change — verify implementation, run sanity checks, and decide next steps',
    tags: ['workflow', 'review'],
    content: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first — review uses [INV] and [DFT] to verify the implementation upholds project rules."
- If \`[INV]\` or \`[WFL]\` have no \`**INV-NNN**\` / \`**WFL-NNN**\` items → STOP with: "Constitution [TAG] section is empty. Run /syn:sync to complete it."
- If valid → read [QR], [INV], [BND], [DFT], [DEC].

---

Review a completed change — verify implementation, run sanity checks, and decide next steps.

---

## Steps

1. **Select the change**

   If a name is provided (e.g., \`/syn:review add-auth\`), use it. Otherwise:
   - Infer from conversation context
   - Auto-select if only one active change exists
   - If ambiguous, run \`synarcx list --json\` and prompt

2. **Check status**

   \`\`\`bash
   synarcx status --change "<name>" --json
   \`\`\`

   Verify all apply-required artifacts are done. If not, stop.

3. **Gate on task completion**

   Read \`tasks.md\`. If any tasks remain unchecked:
   - Show "N/M tasks complete"
   - Suggest \`/syn:apply\` to finish
   - Stop

4. **Collect change state**
   - \`git diff --stat\` for file summary
   - Read tasks.md for progress

5. **Discover and run sanity checks**

   Probe \`package.json\` scripts for \`test\`, \`lint\`, \`typecheck\`. Fall back to known tools (cargo test, ruff, etc.). Omit if none found.

   For each command: capture pass/fail/crash. Summary only, not full logs.

6. **Build output**

   Structured summary first:
   \`\`\`
   Tasks:     N/M  ✓
   Files:     N changed (+A -D)
   Tests:     N/N passed  ✓
   Lint:      0 errors  ✓
   Typecheck: clean  ✓
   \`\`\`

   Then narrative paragraph.

 7. **Present the fork**

   **If all checks pass:**
   - Archive now → write marker, move to archive, sync specs, update marker
   - Add more work → scope gate: read proposal capabilities + design goals/non-goals. If in scope: update artifacts, MUST run \`/syn:clarify\` then \`/syn:apply\`. If out of scope: offer to archive first (with spec sync), route to \`/syn:propose\`.
   - Start a new change → \`/syn:propose\`

   **If issues found:**
   - Show each finding with route: \`/syn:apply\`, \`/syn:clarify\`, \`/syn:analyze\`
   - List all findings at once

 8. **Archive inline** (when user picks archive)

    a. Check for delta specs. If none, skip marker and just move.
    b. Write \`synspec/.pending-sync.json\` with \`syncedAt: null\` using full \`YYYY-MM-DD-<name>\` as change field
    c. Move: \`mv synspec/changes/<name> synspec/changes/archive/YYYY-MM-DD-<name>\`
    d. Sync specs: \`findSpecUpdates(archivePath)\` → \`buildUpdatedSpec()\` → atomic write (\`.tmp\` + rename) → per-capability output
    e. Update marker with \`syncedAt\` timestamp
    f. **Constitution patch**: extract \`### D<N>:\` decisions from archived \`design.md\`, scan for "Exception to INV-NNN:" patterns in design+tasks. Write \`synspec/.constitution-patch.json\` with \`{ "patches": [...] }\` format. Call \`synarcx patch constitution\` — auto-deletes the file on success. Report command output.
    g. On failure: archive is already moved, marker stays \`null\`, backstop retries on next sync

---

## Output (Clean)

\`\`\`
Tasks:     7/7  ✓
Files:     5 changed (+124 -12)
Tests:     42/42 passed  ✓
Lint:      0 errors  ✓
Typecheck: clean  ✓

All checks pass. What would you like to do?
[A] Archive now (with spec sync)    [B] Add more work (scope-gated)    [C] Start a new change
\`\`\`

## Output (Dirty)

\`\`\`
Tasks:     7/7  ✓
Files:     5 changed (+124 -12)
Tests:     38/42 passed  ⚠
Lint:      3 errors  ⚠

Findings:
╳ 4 tests failing → /syn:apply to fix
╳ 3 lint errors → /syn:apply to fix
\`\`\`

## Guardrails
- Gate on task completion — no checks until all tasks are done
- Summary only for failed checks (not full logs)
- Scope gate for Option B: read proposal capabilities + design goals/non-goals before acting
- In-scope expansion MUST run clarify then apply — no escape hatch
- Out-of-scope work: offer archive first, then route to /syn:propose
- Archive happens before spec sync — if sync fails, change is safely archived
- Quick bypasses review — do not suggest review after /syn:quick`
  })
}
