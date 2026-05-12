import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynAnalyzeSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-analyze',
    description: 'Cross-artifact consistency check across proposal, specs, design, and tasks. Edits in place to fix inconsistencies.',
    instructions: `Run a cross-artifact consistency check for a change. Edits artifacts in place to fix issues found.

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

4. **Fix inconsistencies in place**
   - Edit artifacts directly to resolve issues
   - Maximum 5 edits per session
   - Show what was changed and why

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
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynAnalyzeCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynAnalyzeSkillTemplate(), {
    name: 'syn:analyze',
    description: 'Cross-artifact consistency check for proposal, specs, design, and tasks',
    tags: ['workflow', 'analyze'],
    content: `Run a cross-artifact consistency check for a change. Edits artifacts in place to fix issues found.

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

4. **Fix inconsistencies in place**
   - Edit artifacts directly to resolve issues
   - Maximum 5 edits per session
   - Show what was changed and why

5. **Generate summary** of changes made

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
