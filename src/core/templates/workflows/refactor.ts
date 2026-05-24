import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynRefactorSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-refactor',
    description: 'Investigate structural changes that must not alter behavior. Entry point for refactoring — explores, then hands off to /syn:propose.',
    instructions: `Investigate a structural refactoring opportunity. Focuses on improving code structure without changing observable behavior. When thinking is clear, explicitly prompts the user to run \`/syn:propose\` — does NOT auto-create artifacts.

**Input**: The user can describe what they want to restructure, or just run the command to start exploring.

---

## Initial Context

Check for existing context:
\`\`\`bash
synarcx list --json
\`\`\`

If a relevant change exists, read its artifacts. Otherwise, start fresh.

---

## Reframing the Problem

This is a structural-change investigation. The goal is to improve code organization, reduce duplication, increase cohesion, or decrease coupling — without changing what the system does.

### Opening Question

Start by asking (use AskUserQuestion tool, open-ended):
> "What part of the codebase feels like it needs restructuring?"

Let the user describe the pain point before diving in.

---

## Investigation

Explore the codebase to understand the current structure:

1. **Map the current shape** — read relevant source files, identify:
   - Module boundaries and responsibilities
   - Dependency direction
   - Code duplication or overlapping concerns
   - Testing patterns

2. **Identify the target shape** — work with the user to define:
   - What the ideal structure would look like
   - Which modules or files move where
   - How dependencies should flow

3. **Surface risks** — flag areas of concern:
   - Implicit dependencies that aren't visible in imports
   - Areas where refactoring could make things worse
   - Testing hazards (brittle tests, high coupling to internals)

4. **Visualize** — use ASCII diagrams to show:
   - Current vs. target module structure
   - Dependency direction changes
   - File/move relationships

---

## Analyze-Gate Note (for the /syn:analyze phase)

When a proposal is created from this investigation, the analyze phase MUST check:
- Does the proposed change alter any public API signature?
- Does it change output format, error messages, or user-facing behavior?
- Does it add new functionality beyond what existed?

If any of these is true → flag as a **behavior contract violation** and suggest reclassifying as a feature (not a refactor).

---

## Hand-Off

After presenting the refactoring plan under \`### Refactoring Plan\`, assess scope:
- **Small refactor** (rename, move single file, extract function): recommend \`/syn:quick\`
- **Structural refactor** (multi-module, dependency changes): recommend \`/syn:propose\`

Use the **AskUserQuestion tool** to let the user choose:
> "How would you like to proceed?"

Options:
- "Apply quick refactor (\`/syn:quick\`) — small, contained change"
- "Create full proposal (\`/syn:propose\`) — structural, multi-file refactor"

Do NOT create any artifacts or start the pipeline. Wait for the user to pick.`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynRefactorCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynRefactorSkillTemplate(), {
    name: 'syn:refactor',
    description: 'Investigate structural refactoring — map current vs. target shape, then hands off to /syn:propose',
    tags: ['workflow', 'refactor', 'restructure'],
    content: `Investigate a structural refactoring opportunity. Focuses on improving code structure without changing observable behavior. When thinking is clear, explicitly prompts the user to run \`/syn:propose\` — does NOT auto-create artifacts.

**Input**: The argument after \`/syn:refactor\` describes what the user wants to restructure.

---

## Initial Context

Check for existing context:
\`\`\`bash
synarcx list --json
\`\`\`

If a relevant change exists, read its artifacts. Otherwise, start fresh.

---

## Reframing the Problem

This is a structural-change investigation. The goal is to improve code organization, reduce duplication, increase cohesion, or decrease coupling — without changing what the system does.

### Opening Question

Start by asking (use AskUserQuestion tool, open-ended):
> "What part of the codebase feels like it needs restructuring?"

Let the user describe the pain point before diving in.

---

## Investigation

1. **Map the current shape** — read relevant source files, identify:
   - Module boundaries and responsibilities
   - Dependency direction
   - Code duplication or overlapping concerns
   - Testing patterns

2. **Identify the target shape** — work with the user to define:
   - What the ideal structure would look like
   - Which modules or files move where
   - How dependencies should flow

3. **Surface risks** — flag areas of concern:
   - Implicit dependencies that aren't visible in imports
   - Areas where refactoring could make things worse
   - Testing hazards (brittle tests, high coupling to internals)

4. **Visualize** — use ASCII diagrams to show:
   - Current vs. target module structure
   - Dependency direction changes
   - File/move relationships

---

## Analyze-Gate Note

When artifacts are created, the analyze phase MUST check for behavior contract violations — no public API changes, no output format changes, no new functionality. If violated, flag and suggest reclassifying as a feature.

---

## Hand-Off

After presenting the refactoring plan under \`### Refactoring Plan\`, assess scope:
- **Small refactor** (rename, move single file, extract function): recommend \`/syn:quick\`
- **Structural refactor** (multi-module, dependency changes): recommend \`/syn:propose\`

Use the **AskUserQuestion tool** to let the user choose:
> "How would you like to proceed?"

Options:
- "Apply quick refactor (\`/syn:quick\`) — small, contained change"
- "Create full proposal (\`/syn:propose\`) — structural, multi-file refactor"

Do NOT create any artifacts or start the pipeline. Wait for the user to pick.`
  })
}
