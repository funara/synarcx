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

3. **Generate up to 5 targeted questions**
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

4. **Ask questions interactively**
   Use the **AskUserQuestion tool** (open-ended) to present each question.
   Present questions one at a time. Wait for each answer before moving to the next.
   Maximum 5 questions per session.

5. **Encode answers back into artifacts**
   - Edit the relevant artifact in place (proposal.md, design.md, or specs)
   - Do NOT create new files
   - Show what was changed and why

---

## Output

After completing, summarize:
- What was clarified
- Which artifacts were updated
- Next step: Run \`/syn:analyze\` to check consistency across artifacts`,
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

3. **Generate up to 5 targeted questions**
   Focus on areas that are:
   - Ambiguous or underspecified
   - Missing edge cases
   - Unclear scope boundaries
   - Unstated assumptions
   - Missing acceptance criteria

4. **Ask questions interactively**
   Present questions one at a time. Wait for each answer before moving to the next.
   Maximum 5 questions per session.

5. **Encode answers back into artifacts**
   - Edit the relevant artifact in place (proposal.md, design.md, or specs)
   - Do NOT create new files
   - Show what was changed and why

---

## Output

After completing, summarize:
- What was clarified
- Which artifacts were updated
- Next step: Run \`/syn:analyze\` to check consistency across artifacts`
  })
}
