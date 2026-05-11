# SynArcX (Synapse Architecture Code Extension) — Agent Guide

This file helps AI agents understand the SynArcX project conventions.

## Project Overview

SynArcX is a spec-driven development workflow with sync, explore, propose, clarify, analyze, apply, debug, and archive commands. Install globally via `npm install -g synarcx` or `pnpm add -g synarcx`.

## Workflow

The intended user flow is:

```
explore ──┐
           ├──► propose ──► clarify ──► analyze ──► apply ──► archive
debug   ──┘
```

- `syn:explore` and `syn:debug` are entry points — both hand off to `syn:propose`
- `syn:debug` investigates a known error (3-phase: root cause → pattern → hypothesis), produces a diagnosis, then suggests `syn:propose` with the findings. It does NOT write to `tasks.md` directly.
- `syn:clarify` and `syn:analyze` refine artifacts before implementation — they are not optional gates but recommended steps
- Each command ends by suggesting the next step; the user decides when to advance

## Schema

The project uses the `synarcx` schema at `schemas/synarcx/`. The artifact graph is: proposal → specs → design → tasks. Commands `syn:clarify` and `syn:analyze` operate on existing artifacts in place.

Workflow templates live in `src/core/templates/workflows/`. Each template exports two functions:
- `getSyn<Name>SkillTemplate()` — returns a SkillTemplate used for agent skill files
- `getSyn<Name>CommandTemplate()` — returns a CommandTemplate used for slash command files

New templates must be registered in:
1. `src/core/templates/skill-templates.ts` — add export
2. `src/core/shared/skill-generation.ts` — add to getSkillTemplates() and getCommandTemplates()
3. `src/core/shared/tool-detection.ts` — add to SKILL_NAMES and COMMAND_IDS
4. `src/core/profiles.ts` — add to ALL_WORKFLOWS

## Slash Commands

Commands use the `syn:` prefix (not `opp:`). All 26 adapters in `src/core/command-generation/adapters/` handle command generation. To add a new command to all adapters, add it to the workflow template list and register it in the shared workflow arrays.

## No Telemetry

Telemetry (`src/telemetry/`) has been removed entirely. There is no tracking, no posthog-node dependency, and no data collection.

## No Release Pipeline

Changesets and the automated release pipeline have been removed. Versioning is manual. No npm publish.

## Binary

The binary is `synarcx` (not `openspec`). The entry point is `bin/synarcx.js`.

## Build

```bash
pnpm install
pnpm build          # runs build.js → outputs to dist/
pnpm link --global  # makes binary available system-wide for local dev
npm publish         # publish to npm (bump version in package.json first)
```

## Tests

```bash
pnpm test           # vitest
```

Test files live alongside source code.

## Conventions

- TypeScript with strict mode
- ESM modules (type: "module" in package.json)
- PascalCase for exported class names
- camelCase for functions and variables
- kebab-case for file names
- No semicolons in source code
