import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynClarifySkillTemplate(): SkillTemplate {
  return {
    name: 'syn-clarify',
    description: 'Ask up to 5 targeted questions about a change\'s proposal, specs, or design to improve clarity before implementation.',
    instructions: `Ask targeted clarification questions about a change to improve its artifacts before implementation.

---

## Steps

1. **Identify the change**
   - If the user specified a change name, use it
   - Otherwise, run \`synarcx list --json\` to find active changes
   - If multiple, ask which one to clarify

2. **Read the artifacts**
   - \`synspec/changes/<name>/proposal.md\`
   - \`synspec/changes/<name>/specs/**/*.md\` (if exist)
   - \`synspec/changes/<name>/design.md\`

3. **Generate targeted questions (5 default, extendable for critical unknowns)**
   Focus on areas that are:
   - Ambiguous or underspecified
   - Missing edge cases
   - Unclear scope boundaries
   - Unstated assumptions
   - Missing acceptance criteria

   Question categories:
   - **Scope**: What's in/out? Edge cases?
   - **Requirements**: Acceptance criteria? Success metrics?
   - **Design**: Trade-offs considered? Alternatives?
   - **Implementation**: Dependencies? Migration path?
   - **Testing**: How to verify?

   "Critical" = a hole or contradiction that would produce broken or incorrect code if left unaddressed. Not "nice to know" or stylistic preferences.

4. **Ask questions interactively**
   Use the **AskUserQuestion tool** (open-ended) to present each question.
   Present questions one at a time. Wait for each answer before moving to the next.
   Default maximum: 5 questions. If one or more critical unknowns remain after 5, present each remaining critical question with context and ask the user to confirm before continuing.

5. **Encode answers back into artifacts**
   - Edit the relevant artifact in place (proposal.md, design.md, or specs)
   - Do NOT create new files
   - Show what was changed and why
   - Note: tasks.md will be read during the auto-analyze step that follows

6. **Auto-analyze: cross-artifact consistency checks**
   - Read all artifacts including tasks.md
   - Run 5 checks: terminology, scope, completeness, conflicts, traceability
   - Fix up to 5 inconsistencies in place
   - If a fix would contradict a Q&A answer, skip it (user answer wins)
   - If zero issues found, report each check as "OK"

---

## Output

After completing, summarize:
- What was clarified
- Which artifacts were updated
- Consistency check results (each of 5 checks: OK or fix applied)
- Next step: Run \`/syn:apply\` to start implementation`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynClarifyCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynClarifySkillTemplate(), {
    name: 'syn:clarify',
    description: 'Ask up to 5 targeted questions to improve change artifacts',
    tags: ['workflow', 'clarify'],
    content: `Ask targeted clarification questions about a change to improve its artifacts before implementation.

---

## Steps

1. **Identify the change**
   - If the user specified a change name, use it
   - Otherwise, run \`synarcx list --json\` to find active changes
   - If multiple, ask which one to clarify

2. **Read the artifacts**
   - \`synspec/changes/<name>/proposal.md\`
   - \`synspec/changes/<name>/specs/**/*.md\` (if exist)
   - \`synspec/changes/<name>/design.md\`

3. **Generate targeted questions (5 default, extendable for critical unknowns)**
   Focus on areas that are:
   - Ambiguous or underspecified
   - Missing edge cases
   - Unclear scope boundaries
   - Unstated assumptions
   - Missing acceptance criteria

   "Critical" = a hole or contradiction that would produce broken or incorrect code if left unaddressed. Not "nice to know" or stylistic preferences.

4. **Ask questions interactively**
   Present questions one at a time. Wait for each answer before moving to the next.
   Default maximum: 5 questions. If one or more critical unknowns remain after 5, present each remaining critical question with context and ask the user to confirm before continuing.

5. **Encode answers back into artifacts**
   - Edit the relevant artifact in place (proposal.md, design.md, or specs)
   - Do NOT create new files
   - Show what was changed and why
   - Note: tasks.md will be read during the auto-analyze step that follows

6. **Auto-analyze: cross-artifact consistency checks**
   - Read all artifacts including tasks.md
   - Run 5 checks: terminology, scope, completeness, conflicts, traceability
   - Fix up to 5 inconsistencies in place
   - If a fix would contradict a Q&A answer, skip it (user answer wins)
   - If zero issues found, report each check as "OK"

---

## Output

After completing, summarize:
- What was clarified
- Which artifacts were updated
- Consistency check results (each of 5 checks: OK or fix applied)
- Next step: Run \`/syn:apply\` to start implementation`
  })
}
