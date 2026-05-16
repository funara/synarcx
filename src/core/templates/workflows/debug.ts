import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynDebugSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-debug',
    description: 'Investigate a known error or failure — root cause analysis, pattern recognition, and hypothesis formulation. Hands off explicitly to /syn:propose.',
    instructions: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first to establish project rules before debugging."
- If \`[INV]\` or \`[WFL]\` sections have \`confidence=pending\` or are empty → STOP with the list of pending sections.
- If valid → load [INV] and [BND] for Phase 1 context (do the reported symptoms suggest an invariant is being violated?); load [DEC] for Phase 2 pattern matching (is this a known class of issue?).

---

Investigate a known error or failure systematically in 3 phases. Produces a diagnosis and explicitly prompts the user to run \`/syn:propose\` — does NOT auto-create artifacts or auto-hand off.

**Input**: Error message, symptom, or failure description. If no input provided, ask what went wrong.

---

## Initial Context

If a change is active, read its artifacts first:
- \`synspec/changes/<name>/proposal.md\`
- \`synspec/changes/<name>/design.md\`
- \`synspec/changes/<name>/tasks.md\`

Use that context to understand what was intended vs. what went wrong.

---

## The 3 Phases

### Phase 1: Root Cause Analysis
- Reproduce the issue
- Gather context (error messages, logs, state)
- Follow the call stack backward
- Check input assumptions at each layer
- Identify the root cause (not symptoms)
- Document findings under \`### Root Cause\`

### Phase 2: Pattern Recognition
- Is this a known issue or novel?
- Have similar bugs been fixed before?
- Is this a class of issues?
- Check codebase for related patterns
- Document under \`### Pattern\`

### Phase 3: Hypothesis
- Formulate fix hypothesis
- Consider side effects of the fix
- Consider alternative approaches
- Determine minimal change needed
- Document under \`### Hypothesis\`

---

## Output

After completing the 3-phase investigation, present findings and prompt explicitly:

\`\`\`
### Diagnosis

**Root Cause**: <what was found>
**Pattern**: <similar issues or novel>
**Hypothesis**: <proposed fix approach>

**Ready to formalize?** Run \`/syn:propose\` to create a change with these findings.
\`\`\`

Do NOT create any artifacts, do NOT start the pipeline automatically. The user must explicitly run \`/syn:propose\` to formalize.`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.4' },
  };
}

export function getSynDebugCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynDebugSkillTemplate(), {
    name: 'syn:debug',
    description: 'Investigate a known error — root cause analysis through hypothesis, explicitly prompts /syn:propose',
    tags: ['workflow', 'debug', 'fix'],
    content: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first to establish project rules before debugging."
- If \`[INV]\` or \`[WFL]\` have \`confidence=pending\` or are empty → STOP with pending sections.
- If valid → load [INV] and [BND] for Phase 1; load [DEC] for Phase 2 pattern matching.

---

Investigate a known error or failure systematically in 3 phases. Produces a diagnosis and explicitly prompts the user to run \`/syn:propose\` — does NOT auto-create artifacts or auto-hand off.

**Input**: Error message, symptom, or failure description. The argument after \`/syn:debug\` is what went wrong.

---

## Initial Context

If a change is active, read its artifacts first:
- \`synspec/changes/<name>/proposal.md\`
- \`synspec/changes/<name>/design.md\`
- \`synspec/changes/<name>/tasks.md\`

Use that context to understand what was intended vs. what went wrong.

---

## The 3 Phases

### Phase 1: Root Cause Analysis
- Reproduce the issue
- Gather context (error messages, logs, state)
- Follow the call stack backward
- Check input assumptions at each layer
- Identify the root cause (not symptoms)
- Document findings under \`### Root Cause\`

### Phase 2: Pattern Recognition
- Is this a known issue or novel?
- Have similar bugs been fixed before?
- Is this a class of issues?
- Check codebase for related patterns
- Document under \`### Pattern\`

### Phase 3: Hypothesis
- Formulate fix hypothesis
- Consider side effects of the fix
- Consider alternative approaches
- Determine minimal change needed
- Document under \`### Hypothesis\`

---

## Output

After completing the 3-phase investigation, present findings and prompt explicitly:

\`\`\`
### Diagnosis

**Root Cause**: <what was found>
**Pattern**: <similar issues or novel>
**Hypothesis**: <proposed fix approach>

**Ready to formalize?** Run \`/syn:propose\` to create a change with these findings.
\`\`\`

Do NOT create any artifacts, do NOT start the pipeline automatically. The user must explicitly run \`/syn:propose\` to formalize.`
  })
}
