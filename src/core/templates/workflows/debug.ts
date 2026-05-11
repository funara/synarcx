import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getSynDebugSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-debug',
    description: 'Investigate a known error or failure — root cause analysis, pattern recognition, and hypothesis formulation. Hands off to /syn:propose for task creation.',
    instructions: `Investigate a known error or failure systematically in 3 phases. Produces a diagnosis and suggests \`/syn:propose\` for creating the fix change.

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

After completing the 3-phase investigation, summarize:

\`\`\`
### Diagnosis

**Root Cause**: <what was found>
**Pattern**: <similar issues or novel>
**Hypothesis**: <proposed fix approach>

**Next Step**: Ready to formalize a change? Run \`/syn:propose\` with these findings.
\`\`\`

If no change exists yet, suggest creating one via \`/syn:propose\` with the diagnosis as the starting context.`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynDebugCommandTemplate(): CommandTemplate {
  return {
    name: 'syn:debug',
    description: 'Investigate a known error — root cause analysis through hypothesis, suggests /syn:propose',
    category: 'Workflow',
    tags: ['workflow', 'debug', 'fix'],
    content: `Investigate a known error or failure systematically in 3 phases. Produces a diagnosis and suggests \`/syn:propose\` for creating the fix change.

**Input**: Error message, symptom, or failure description. The argument after \`/syn:debug\` is what went wrong.

---

## Initial Context

If a change is active, read its artifacts first to understand what was intended vs. what went wrong.

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

After completing, summarize with a diagnosis and suggest \`/syn:propose\` with the findings.`
  };
}
