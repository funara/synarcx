# SynArcX (Synapse Architecture Code Extension) — Agent Guide

This file helps AI agents understand the SynArcX project conventions.

## Project Overview

SynArcX is a spec-driven development workflow with sync, explore, propose, clarify, analyze, apply, review, debug, refactor, and quick commands. Install globally via `npm install -g synarcx` or `pnpm add -g synarcx`.

## Workflow

The intended user flow is:

```
quick ─────────────────────────────────────┐
                                           │
explore  ──┐                               │
debug    ──┤                               ▼
           ├───► propose ──► clarify ──► apply ──► review
           │        ▲           ▲                     │
refactor ──┘        │           │                     │
                    │           │                     │
                    │           │     ┌───────────────┼───────────────┐
                    │           │     ▼               ▼               ▼
                    │        add more work        new change       archive
                    │                                 │               │
                    └─────────────────────────────────┘               ▼
sync ──────────────────────────────────────────────────────────► constitution
```

- `syn:explore`, `syn:debug`, and `syn:refactor` are entry points — all hand off to `syn:propose`
- `syn:debug` investigates a known error (3-phase: root cause → pattern → hypothesis), produces a diagnosis, then suggests `syn:propose` with the findings. It does NOT write to `tasks.md` directly.
- `syn:refactor` investigates structural changes (current shape vs target shape) with a behavior-contract gate during analyze, then hands off to `syn:propose`
- `syn:quick` is a fast-path for small, low-risk changes — no artifacts created, inline preview with confirmation, then applies directly
- `syn:clarify` runs targeted Q&A (adaptive limit, up to 5 then extends for critical unknowns) then auto-analyzes consistency — all in one command
- `syn:analyze` is auto-run by clarify, but also available standalone for manual use
- `syn:review` is the terminal quality gate — verifies tasks are complete, runs sanity checks (test/lint/typecheck), and presents a three-way fork:
  - **Archive now**: moves change to archive/, auto-runs `buildUpdatedSpec()` to merge delta specs into main specs, writes `.pending-sync.json` marker. Spec sync runs after the move — if it fails, the change is already safely archived; the marker stays for backstop retry.
  - **Add more work**: scope gate reads proposal capabilities + design goals/non-goals. In scope → update artifacts, MUST run `/syn:clarify` then `/syn:apply` then `/syn:review` again (refinement loop). Out of scope → offer archive first, then route to `/syn:propose`.
  - **Start a new change**: routes to `/syn:propose`.
- `syn:sync` runs a daily version check (first run of each UTC day): if a newer synarcx is available on npm, it prompts the user to auto-update inline. Results cached in `synspec/.version-cache.json`. Silent when up-to-date, no cache miss penalty. **Also checks pending spec syncs**: before the version check, reads `.pending-sync.json` and processes any entries without `syncedAt` using `buildUpdatedSpec()` — catches archives that completed outside review.
- Run `synarcx update` in your terminal to refresh all skill and command files after installing a new version — this ensures all configured AI tools stay current.
- Each command ends by suggesting the next step; the user decides when to advance

## Schema

The project uses the `synarcx` schema at `schemas/synarcx/`. The artifact graph is: proposal → specs → design → tasks. `syn:clarify` operates on existing artifacts in place (Q&A + auto-analyze). `syn:analyze` is available standalone.

Workflow templates live in `src/core/templates/workflows/`. Each template exports two functions:

- `getSyn<Name>SkillTemplate()` — returns a SkillTemplate used for agent skill files
- `getSyn<Name>CommandTemplate()` — returns a CommandTemplate used for slash command files

New templates must be registered in:

1. `src/core/templates/skill-templates.ts` — add export
2. `src/core/shared/workflow-registry.ts` — add to WORKFLOWS array
3. `src/core/shared/skill-generation.ts` — add to getSkillTemplates() and getCommandTemplates()

(ALL_WORKFLOWS, CORE_WORKFLOWS, SKILL_NAMES, and COMMAND_IDS in tool-detection.ts are derived from WORKFLOWS automatically.)

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

Test files live in `test/`.

## Upgrade Migration

When a user runs `synarcx init` or `synarcx update` and their global config has no `profile` field (pre-profile-era install), `migrateIfNeeded()` in `src/core/migration.ts` runs a one-time migration:

- Scans installed workflow artifacts on disk
- If any found: sets `profile: 'core'` in global config — so the user automatically receives all current and future commands with no manual steps
- If none found: no-op (brand-new user, defaults apply)

For users who already have `profile: 'custom'` set, `UpdateCommand.syncNewCoreWorkflowsToCustomProfile()` in `src/core/update.ts` runs on every `synarcx update` and auto-adds any missing `ALL_WORKFLOWS` entries to their `workflows` list. This prevents any newly added command from being silently dropped on upgrade.

The invariant: **no user should ever be missing a command because of a version upgrade**.

## Conventions

- TypeScript with strict mode
- ESM modules (type: "module" in package.json)
- PascalCase for exported class names
- camelCase for functions and variables
- kebab-case for file names
- No semicolons in source code
