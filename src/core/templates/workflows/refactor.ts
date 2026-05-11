import type { SkillTemplate, CommandTemplate } from '../types.js';

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

When the investigation reaches a clear conclusion, present findings and explicitly prompt:

\`\`\`
### Refactoring Plan

**Current Shape**: <summary of current structure>
**Target Shape**: <proposed structure>
**Key Changes**: <list of structural moves>
**Risks**: <potential issues>

**Ready to formalize?** Run \`/syn:propose\` to create a change with these findings.
\`\`\`

Do NOT create any artifacts or start the pipeline. The user must explicitly run \`/syn:propose\`.`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynRefactorCommandTemplate(): CommandTemplate {
  return {
    name: 'syn:refactor',
    description: 'Investigate structural refactoring — map current vs. target shape, then hands off to /syn:propose',
    category: 'Workflow',
    tags: ['workflow', 'refactor', 'restructure'],
    content: `Investigate a structural refactoring opportunity. Focuses on improving code structure without changing observable behavior. When thinking is clear, explicitly prompts the user to run \`/syn:propose\` — does NOT auto-create artifacts.

**Input**: The argument after \`/syn:refactor\` describes what the user wants to restructure.

---

## Investigation

1. **Map the current shape** — read relevant source files, identify module boundaries, dependencies, duplication.
2. **Identify the target shape** — define what the ideal structure looks like.
3. **Surface risks** — flag implicit dependencies, testing hazards, areas that could get worse.
4. **Visualize** — use ASCII diagrams to show current vs. target structure.

---

## Analyze-Gate Note

When artifacts are created, the analyze phase MUST check for behavior contract violations — no public API changes, no output format changes, no new functionality. If violated, flag and suggest reclassifying as a feature.

---

## Hand-Off

Present a summary with Current Shape, Target Shape, Key Changes, and Risks. Then explicitly prompt: "Ready to formalize? Run \`/syn:propose\` to create a change with these findings."`
  };
}
