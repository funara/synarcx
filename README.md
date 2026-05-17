# SynArcX

![npm version](https://img.shields.io/npm/v/synarcx) ![license](https://img.shields.io/npm/l/synarcx) ![node](https://img.shields.io/node/v/synarcx)

> Structured engineering workflows for AI coding assistants — persistent project memory, spec-driven development, and architecture drift prevention across every session.

Works with **Claude Code, Cursor, GitHub Copilot, Cline, Windsurf, Codex**, and more AI coding tools.

---

## The Problem: Architecture Drift in AI-Assisted Development

AI coding assistants like Claude Code and Cursor lose context fast. Requirements live in chat history. Architecture decisions vanish between sessions. Generated code drifts from design intent.

Without an explicit workflow, AI-generated code gradually drifts from your architecture — each session introduces small misalignments that compound into structural debt. This is architecture drift, and it gets worse the longer the project runs.

SynArcX fixes this by adding a lightweight spec layer between you and your AI — so both you and the assistant agree on what to build before any code is written.

---

## Why Not Just Prompt Better?

Better prompts help, but they don't survive session resets, tool switches, or team handoffs. Every new session starts cold. Every new contributor re-explains the same constraints.

SynArcX makes your engineering decisions durable. The `constitution.md` is always there. The specs don't live in someone's chat history.

---

## Why Not Just Use Another Spec Format?

Spec formats describe *what* to build.

SynArcX structures *how you get there* — from exploration to proposal to implementation — and keeps AI-generated changes aligned with the evolving codebase at every stage, not just at planning time.

If you already have markdown specs in your repo, `/syn:sync` will incorporate them into the `constitution.md`.

---

## What Happens If You Ignore SynArcX?

Nothing breaks immediately. That's the problem.

```
Week 1   AI reads the codebase, builds the feature correctly.

Week 3   New session. AI re-derives context from code alone.
         Small assumptions diverge from your actual design.

Week 6   Three sessions in. The auth module now does things
         no spec ever said it should. The AI was "helpful."

Week 10  You're untangling AI-introduced architecture violations
         instead of shipping features. The specs live in a chat
         log nobody can find.
```

SynArcX makes the spec the source of truth, not the chat history.

---

## Install

Requires **Node.js 20+**

```bash
npm install -g synarcx
```

```bash
pnpm add -g synarcx
```

Verify:

```bash
synarcx --help
```

---

## Quick Start

```bash
cd your-project
synarcx init
```

Then in your AI coding tool:

1. `/syn:sync` — scan the project and generate `constitution.md` (persistent project memory)
2. `/syn:explore "your idea"` — think through the problem with your AI
3. `/syn:propose "my-feature"` — create proposal, specs, design, and tasks in one step
4. `/syn:clarify` — sharpen artifacts with targeted Q&A and an automatic consistency check
5. `/syn:apply` — implement the tasks
6. `/syn:review` — verify implementation, run sanity checks, then choose: archive (auto spec sync), add more work (scope-gated), or start a new change

For specific cases, use these instead of `/syn:explore`:

- For bugs: use `/syn:debug`
- For structural improvements: use `/syn:refactor`
- For small low-risk changes (typos, config tweaks): use `/syn:quick` — no artifacts, just apply

---

## How It Works: Spec-Driven AI Coding Workflow

**Without SynArcX, development drift compounds silently:**

```
Session 1  ──►  Session 2  ──►  Session 3  ──►  Session N
✓ correct       ~ close        ✗ diverged     ✗✗ structural debt
                             (nobody noticed)
```

**With SynArcX — alignment is maintained explicitly:**

```
Session 1  ──►  constitution.md  ──►  Session 2  ──►  constitution.md  ──►  Session N
✓ correct          (updated)          ✓ correct         (updated)          ✓ correct

         specs · architecture · intent preserved across every reset
```

---

**The workflow:**

```
quick ─────────────────────────────────────┐
                                           │
explore  ──┐                               │
debug    ──┤                               ▼
           ├───► propose ──► clarify ──► apply ──► review
           │        ▲           ▲                    │
refactor ──┘        │           │                    │
                    │           │     ┌──────────────┼───────────────┐
                    │           │     ▼              ▼               ▼
                    │        add more work       new change       archive
                    │                                │               │
                    └────────────────────────────────┘               ▼
sync ──────────────────────────────────────────────────────────► constitution
```

Each step suggests the next — you decide when to advance. Works in Claude Code, Cursor, Cline, and any AI coding tool that supports slash commands.

- **`sync`** runs a 6-stage pipeline: mode detection → codebase scan → inference → architect interview → normalize → write. Checks for pending spec syncs from archived changes first, and checks for synarcx updates weekly (printed as a banner, never blocks).
- **`explore`**, **`debug`**, and **`refactor`** are entry points that hand off to `propose`.
- **`propose`** creates all artifacts in one step. Always follow it with `/syn:clarify` to catch gaps before implementation.
- **`quick`** skips the full pipeline for small, low-risk changes.
- **`review`** is a three-way fork:
  - **Archive now** — auto-syncs delta specs, writes `.pending-sync.json` marker, moves to archive, patches `constitution.md` with design decisions. If spec sync fails, the change is already safely archived; retry on next sync run.
  - **Add more work** — scope gate reads proposal capabilities + design goals/non-goals. In-scope → update artifacts, `/syn:clarify` then `/syn:apply` then `/syn:review` (loop). Out-of-scope → offer archive first, then route to `/syn:propose`.
  - **Start a new change** — routes to `/syn:propose`.

Run `synarcx update` in your terminal to refresh command files after installing a new version.

Each change gets its own folder under `synspec/changes/` with:

```
synspec/changes/my-feature/
├── proposal.md     # what and why
├── design.md       # how to build it
├── tasks.md        # implementation checklist
└── specs/
    └── *.md        # what the system shall do
```

---

### Persistent Project Memory

`constitution.md` is the core of SynArcX. Generated by `/syn:sync`, it preserves architectural intent, conventions, constraints, and engineering decisions across AI sessions — keeping specifications, architecture, and implementation in sync.

Unlike documentation, the constitution is optimized for AI operational context, not human reading. Every workflow command gates on the constitution: if it is missing or its required sections have no items, the command stops and prompts `/syn:sync`.

A `constitution.md` uses YAML frontmatter and tagged sections:

```markdown
---
version: 3
last_sync: 2026-05-17
fingerprint: a3f1c2e8
mode: brownfield
---

## [QR] Quick Reference
TypeScript CLI · Node 20+ · auth via middleware/ · last sync 2026-05-17

## [INV] Invariants
**INV-001** — All auth/token logic lives in middleware/ — nothing else may touch JWTs.
**INV-002** — Business logic lives in services/, never in controllers/.

## [BND] Boundaries
controllers/ → services/ → repositories/ (no layer may skip)

## [DEC] Decisions
**DEC-001** — REST over GraphQL for public API surface.

## [DFT] Drift Indicators
**DFT-001** — DB calls outside repositories/ → violates INV-002.

## [WFL] Workflows
**WFL-001** — Feature branches → PR → squash merge. Conventional commits required.

## [EXC] Exclusions
Real-time features (WebSocket) out of scope for current phase.

## [OWN] Ownership
auth/ → security team. services/ → backend team.
```

When `/syn:review` archives a completed change, it extracts engineering decisions from `design.md` and calls `synarcx patch constitution` to append them to `[DEC]` automatically. The constitution's `version` increments and its `fingerprint` is recomputed on every patch.

---

## Commands

### Workflow Commands

Used inside your AI coding tool (Claude Code, Cursor, Cline, etc.):

| Command           | Description                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/syn:sync`     | 6-stage pipeline: scan project → infer invariants → interview architect → normalize → write v0.4 constitution. Processes pending spec syncs first. Checks for updates weekly (banner only, never blocks).                        |
| `/syn:explore`  | Think through ideas, investigate problems, and clarify requirements. Gates on constitution.                                                                                                                                          |
| `/syn:debug`    | Diagnose a known error (3-phase: root cause → pattern → hypothesis), then prompts `/syn:propose`. Gates on constitution.                                                                                                         |
| `/syn:refactor` | Map current vs. target structure, then prompts `/syn:propose`. Gates on constitution.                                                                                                                                              |
| `/syn:quick`    | Fast-path for small low-risk changes — inline preview, invariant check, confirm, apply. Gates on constitution.                                                                                                                      |
| `/syn:propose`  | Create a new change with proposal, specs, design, and tasks. Reads [QR][INV][BND][WFL] to inform scope. Always follow with `/syn:clarify`. Gates on constitution.                                                                  |
| `/syn:clarify`  | Phase 1: targeted Q&A (up to 5 questions, critical unknowns first). Phase 2: automatic consistency check (6 checks including constitution compliance). One command, runs both phases.                                                |
| `/syn:analyze`  | Standalone cross-artifact consistency check (6 checks including constitution compliance and drift scan). Auto-run by `/syn:clarify`.                                                                                               |
| `/syn:apply`    | Implement tasks from a change's task list. Pauses before any task that would violate an [INV] rule. Gates on constitution.                                                                                                           |
| `/syn:review`   | Verify implementation, run sanity checks, three-way fork:**archive** (auto spec sync + constitution patch from design decisions), **add more work** (scope-gated), or **start new change**. Gates on constitution. |

> These workflow commands are AI skills invoked via slash commands inside your AI coding tool — they are not terminal commands.

---

### CLI Commands

Used in your terminal:

| Command                             | Description                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| `synarcx init`                    | Initialize SynArcX in your project and configure AI tool integrations                   |
| `synarcx update`                  | Refresh command files for all configured tools after a version upgrade                  |
| `synarcx list`                    | List active changes or specs (`--specs` flag; `--json` for machine-readable output) |
| `synarcx view`                    | Open an interactive dashboard of specs and changes                                      |
| `synarcx new change <name>`       | Create a new change directory with scaffolded artifacts                                 |
| `synarcx status`                  | Show artifact completion status for a change (`--json` for machine-readable output)   |
| `synarcx instructions [artifact]` | Output enriched instructions for creating an artifact or applying tasks                 |
| `synarcx show`                    | Display a change or spec (`--json` for machine-readable output)                       |
| `synarcx validate`                | Validate changes and specs                                                              |
| `synarcx archive`                 | Archive a completed change and sync delta specs to main specs                           |
| `synarcx patch constitution`      | Apply a JSON patch from `synspec/.constitution-patch.json` to `constitution.md`     |
| `synarcx schemas`                 | List available workflow schemas                                                         |
| `synarcx completion`              | Manage shell completions (`generate`, `install`, `uninstall` subcommands)         |
| `synarcx feedback <message>`      | Submit feedback                                                                         |

---

## Artifacts

Each workflow stage produces explicit, reviewable files:

| Artifact            | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `proposal.md`     | Problem framing: what, why, and scope            |
| `specs/*.md`      | Clarified requirements: what the system shall do |
| `design.md`       | Architectural reasoning: how to build it         |
| `tasks.md`        | Implementation checklist                         |
| `constitution.md` | Persistent project memory for AI agents          |

Artifacts create a traceable chain from requirements → reasoning → implementation → architecture decisions.

---

## SynArcX vs. Unstructured AI Coding

| Capability                            | AI Coding Without SynArcX | With SynArcX                         |
| ------------------------------------- | ------------------------- | ------------------------------------ |
| Persistent engineering memory         | Lost between sessions     | Preserved in `constitution.md`     |
| Structured specification flow         | Informal, chat-based      | Explicit staged workflow             |
| Architecture-aware changes            | Inconsistent              | Built into every step                |
| Artifact traceability                 | None                      | Proposal → spec → design → tasks  |
| Session continuity                    | Weak                      | Persistent across tools and sessions |
| Structured, traceable workflow stages | Rare                      | Core design                          |
| Low-risk fast path                    | Manual                    | `/syn:quick`                       |

---

## Supported AI Coding Tools

SynArcX works with Claude Code, Cursor, GitHub Copilot, Cline, Windsurf, Codex, Gemini, OpenCode, and more. Slash commands are generated per tool on `synarcx init` — each tool gets its own command syntax automatically.

---

## Built for AI-Assisted Software Engineering Teams

SynArcX is evolving toward an architecture-aware workflow system for long-running AI-assisted software engineering. It is designed for:

- long-running projects with evolving requirements
- architecture-sensitive systems where drift is costly
- AI-assisted engineering teams
- spec-driven development practices
- multi-session and multi-tool workflows
- controlled implementation pipelines

---

## Status

**v0.4.x** — Constitution lifecycle closed and sync experience overhauled.

- **Constitution-driven workflow with rigid v0.4 schema.** All workflow commands gate on `constitution.md` — a missing or incomplete constitution blocks the command and prompts `/syn:sync`.
- **Constitution lifecycle**: parser, validator, and patcher rewritten to use plain `## [TAG]` / `**TAG-NNN** —` format. `synarcx patch constitution` CLI command registered and called by `/syn:review` on archive. All skill gates check for item presence instead of `confidence=pending`. `/syn:propose` now directs to `/syn:clarify` before `/syn:apply`.
- **Constitution frontmatter**: `schema:` field removed — `fingerprint:` is now the identity marker. Stage 1 detects constitutions by `fingerprint:` key; old-format HTML markers trigger HARD STOP. UPDATE mode auto-strips any legacy `schema:` line.
- **Post-sync guidance**: `/syn:sync` prints a context-aware "Where to next?" block after every run — adapts to whether there are no changes, changes in progress, or changes ready to review. Each suggestion includes the command and a one-line description.
- **Silent sync execution**: the pipeline runs without narrating stage transitions. Only the final constitution summary and "Where to next?" block are printed.

**v0.3.x** — `syn:review` three-way fork (archive with auto spec sync, scope-gated add-more-work, or start new change); `syn:sync` extended with pending spec sync backstop for recently archived changes; archive writes `.pending-sync.json` marker consumed by sync; atomic spec writes prevent half-written corruption.

Active development roadmap:

- stronger repository cognition
- architecture-aware execution validation
- context continuity across tool switches
- structured, traceable AI engineering pipelines

---

## Development

```bash
git clone https://github.com/funara/synarcx
cd synarcx
pnpm install
pnpm build
pnpm link --global

# rebuild after edits:
pnpm build
```

---

## License

MIT
