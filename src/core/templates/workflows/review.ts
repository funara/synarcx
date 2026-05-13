import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynReviewSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-review',
    description: 'Quality gate that verifies implementation, runs sanity checks (test/lint/typecheck), and presents a three-way decision: archive, add more work, or start a new change.',
    instructions: `Review a completed change — verify implementation, run sanity checks, and decide next steps.

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
   | A | Archive now | AI moves change to archive/ | Done |
   | B | Add more work | AI appends new tasks, suggests refinement loop | /syn:clarify → /syn:analyze → /syn:apply |
   | C | Start a new change | AI suggests creating a fresh change | /syn:propose |

   **For option B (add more work)**: Ask the user what else is needed. If the new work fits within the existing change's scope (same capabilities, same specs, related code), append unchecked tasks to \`tasks.md\` and say: "Run /syn:clarify to refine the new requirements, then /syn:analyze, then /syn:apply." If the new work involves different capabilities, different specs, or unrelated code, tell the user: "This is outside this change's scope. Start a new change with /syn:propose instead."

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

8. **Archive inline** (when user picks option A)

   - Create \`synspec/changes/archive/\` if it doesn't exist
   - Target name: \`YYYY-MM-DD-<change-name>\`
   - If target already exists: fail with error, suggest renaming existing archive or using a different approach
   - Move: \`mv synspec/changes/<name> synspec/changes/archive/YYYY-MM-DD-<name>\`
   - Confirm: "Archived <change-name> to synspec/changes/archive/YYYY-MM-DD-<name>/"

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

## Output (Archived)

\`\`\`
## Archive Complete

**Change:** <change-name>
**Archived to:** synspec/changes/archive/YYYY-MM-DD-<name>/

All tasks complete. All checks passed. Change archived.
\`\`\`

## Guardrails
- Do NOT run checks if tasks are incomplete — gate at step 3
- Checks are read-only — do not modify project files during checks
- Archive move is the only write operation (step 8)
- Always list ALL findings at once, don't ask "fix one at a time"
- For failed checks, show only summary counts unless user asks for details
- If user picks "add more work," evaluate scope before appending tasks
- Quick bypasses review — do not suggest review to users who used /syn:quick`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '1.0' },
  };
}

export function getSynReviewCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynReviewSkillTemplate(), {
    name: 'syn:review',
    description: 'Review a completed change — verify implementation, run sanity checks, and decide next steps',
    tags: ['workflow', 'review'],
    content: `Review a completed change — verify implementation, run sanity checks, and decide next steps.

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
   - Archive now → AI moves to archive/
   - Add more work → AI appends tasks (scope-checked), suggests \`/syn:clarify\` → \`/syn:analyze\` → \`/syn:apply\`
   - Start a new change → \`/syn:propose\`

   **If issues found:**
   - Show each finding with route: \`/syn:apply\`, \`/syn:clarify\`, \`/syn:analyze\`
   - List all findings at once

8. **Archive inline** (when user picks archive)

   - Create \`synspec/changes/archive/\` if missing
   - Target: \`YYYY-MM-DD-<change-name>\`
   - Fail if target exists
   - Move: \`mv synspec/changes/<name> synspec/changes/archive/YYYY-MM-DD-<name>\`
   - Confirm

---

## Output (Clean)

\`\`\`
Tasks:     7/7  ✓
Files:     5 changed (+124 -12)
Tests:     42/42 passed  ✓
Lint:      0 errors  ✓
Typecheck: clean  ✓

All checks pass. What would you like to do?
[A] Archive now    [B] Add more work    [C] Start a new change
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
- Scope-check before appending tasks
- Quick bypasses review — do not suggest review after /syn:quick`
  })
}
