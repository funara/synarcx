import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynAnalyzeSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-analyze',
    description: 'Cross-artifact consistency check across proposal, specs, design, and tasks. Edits in place to fix inconsistencies.',
    instructions: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first — analyze uses [INV] and [BND] to check artifact compliance."
- If \`[INV]\` or \`[WFL]\` sections have \`confidence=pending\` or are empty → STOP with the list of pending sections.
- If valid → load [INV] and [BND] for checks 6 and 7 below.

---

Run a cross-artifact consistency check for a change. Edits artifacts in place to fix issues found.

---

## Steps

1. **Identify the change**
   - If the user specified a change name, use it
   - Otherwise, run \`synarcx list --json\` to find active changes
   - If multiple, ask which one to analyze

2. **Read all artifacts**
   - \`synspec/changes/<name>/proposal.md\`
   - \`synspec/changes/<name>/specs/**/*.md\`
   - \`synspec/changes/<name>/design.md\`
   - \`synspec/changes/<name>/tasks.md\`

3. **Run consistency checks**

   a. **Terminology consistency** — same terms used across all artifacts
   b. **Scope alignment** — proposal scope matches design and tasks
   c. **Completeness** — no missing sections or dangling references
   d. **Conflict detection** — contradictory statements between artifacts
   e. **Traceability** — every task maps to a spec requirement
   f. **Constitution compliance** — design decisions must not violate any [INV] rule; module boundaries must not cross [BND] lines. For each violation found: report it clearly, never auto-fix, escalate to user for resolution.
   g. **Drift heuristic scan** — compare design patterns against [DFT] drift heuristics. Flag matches as warnings. NEVER auto-fix drift warnings — present them for user decision only.

4. **Fix inconsistencies in place** (checks a–e only)
   - Edit artifacts directly to resolve issues
   - Maximum 5 edits per session across checks a–e
   - Show what was changed and why
   - Checks f and g: report findings to user only — never edit automatically

5. **Generate summary** of changes made

---

## Output

After completing, summarize:
- What was checked
- What inconsistencies were found and fixed
- What artifacts were modified
- Any remaining concerns
- Next step: Run \`/syn:apply\` to start implementation`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.4' },
  };
}

export function getSynAnalyzeCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynAnalyzeSkillTemplate(), {
    name: 'syn:analyze',
    description: 'Cross-artifact consistency check for proposal, specs, design, and tasks',
    tags: ['workflow', 'analyze'],
    content: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first — analyze uses [INV] and [BND] to check artifact compliance."
- If \`[INV]\` or \`[WFL]\` have \`confidence=pending\` or are empty → STOP with pending sections.
- If valid → load [INV] and [BND] for checks 6–7.

---

Run a cross-artifact consistency check for a change. Edits artifacts in place to fix issues found.

---

## Steps

1. **Identify the change**
   - If the user specified a change name, use it
   - Otherwise, run \`synarcx list --json\` to find active changes
   - If multiple, ask which one to analyze

2. **Read all artifacts**
   - \`synspec/changes/<name>/proposal.md\`
   - \`synspec/changes/<name>/specs/**/*.md\`
   - \`synspec/changes/<name>/design.md\`
   - \`synspec/changes/<name>/tasks.md\`

3. **Run consistency checks**
   - **Terminology consistency** — same terms across all artifacts
   - **Scope alignment** — proposal scope matches design and tasks
   - **Completeness** — no missing sections or dangling references
   - **Conflict detection** — contradictory statements between artifacts
   - **Traceability** — every task maps to a spec requirement
   - **Constitution compliance** — [INV] and [BND] violations; never auto-fix, escalate to user
   - **Drift scan** — compare against [DFT] heuristics; warn only, never auto-fix

4. **Fix inconsistencies in place** (checks 1–5 only; checks 6–7 report to user only)
   - Maximum 5 edits total
   - Show what changed and why

5. **Generate summary** of all findings: what was fixed vs. what needs user decision

---

## Output

After completing, summarize:
- What was checked
- What inconsistencies were found and fixed
- What artifacts were modified
- Any remaining concerns
- Next step: Run \`/syn:apply\` to start implementation`
  })
}
