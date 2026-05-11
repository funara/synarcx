import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getSynSyncSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-sync',
    description: 'Auto-generate or update synspec/constitution.md from project files (README, AGENTS.md, package.json, src structure) with semver versioning and Sync Impact Report.',
    instructions: `Generate or update the project constitution — a living document in \`synspec/constitution.md\` that captures the project's purpose, principles, tech stack, conventions, architecture, and decision log.

**Input**: The user can specify a description of what to focus on, or just run the command to regenerate from sources.

---

## First Run

1. **Read project sources**
   - \`README.md\` — project description, features, purpose
   - \`AGENTS.md\` — AI agent conventions
   - \`package.json\` — dependencies, scripts, metadata
   - \`src/\` structure — code organization (top-level directories)

2. **Generate \`synspec/constitution.md\`** with these sections:
   - \`# Constitution: <project-name>\` — derived from package.json name
   - \`Version: 0.1.0\`
   - \`## Purpose\` — 2-3 sentences from README
   - \`## Principles\` — key design principles inferred from codebase
   - \`## Tech Stack\` — languages, frameworks, key dependencies
   - \`## Conventions\` — code style, naming, patterns observed
   - \`## Architecture\` — high-level structure overview
   - \`## Decision Log\` — table with Date, Decision, Rationale

3. **Verify** the file was created at \`synspec/constitution.md\`

---

## Re-run (Update)

When re-run, offer a semver bump choice:
- **MAJOR** — constitution structure changed or reorganized
- **MINOR** — new section added
- **PATCH** — content update, typo fixes

Append a Sync Impact Report as an HTML comment at the top:
\`\`\`
<!-- Sync Impact: MAJOR — constitution structure reorganized -->
\`\`\`

---

## Output

After completion, summarize what was created or updated, and note the version.`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.1' },
  };
}

export function getSynSyncCommandTemplate(): CommandTemplate {
  return {
    name: 'syn:sync',
    description: 'Auto-generate or update synspec/constitution.md from project files',
    category: 'Workflow',
    tags: ['workflow', 'sync', 'project'],
    content: `Generate or update the project constitution — a living document in \`synspec/constitution.md\` that captures the project's purpose, principles, tech stack, conventions, architecture, and decision log.

**Input**: The user can specify a description of what to focus on, or just run the command to regenerate from sources.

---

## First Run

1. **Read project sources**
   - \`README.md\` — project description, features, purpose
   - \`AGENTS.md\` — AI agent conventions
   - \`package.json\` — dependencies, scripts, metadata
   - \`src/\` structure — code organization (top-level directories)

2. **Generate \`synspec/constitution.md\`** with these sections:
   - \`# Constitution: <project-name>\` — derived from package.json name
   - \`Version: 0.1.0\`
   - \`## Purpose\` — 2-3 sentences from README
   - \`## Principles\` — key design principles inferred from codebase
   - \`## Tech Stack\` — languages, frameworks, key dependencies
   - \`## Conventions\` — code style, naming, patterns observed
   - \`## Architecture\` — high-level structure overview
   - \`## Decision Log\` — table with Date, Decision, Rationale

3. **Verify** the file was created at \`synspec/constitution.md\`

---

## Re-run (Update)

When re-run, offer a semver bump choice:
- **MAJOR** — constitution structure changed or reorganized
- **MINOR** — new section added
- **PATCH** — content update, typo fixes

Append a Sync Impact Report as an HTML comment at the top:
\`\`\`
<!-- Sync Impact: MAJOR — constitution structure reorganized -->
\`\`\`

---

## Output

After completion, summarize what was created or updated, and note the version.`
  };
}
