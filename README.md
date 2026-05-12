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

SynArcX structures *how you get there*  from exploration to proposal to implementation, and helps keep AI-generated changes aligned with the evolving codebase at every stage, not just at planning time.

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

1. `/syn:sync` — scan the project and generate the `constitution.md` (persistent project memory)
2. `/syn:explore "your idea"` — think through the problem with your AI
3. `/syn:propose "my-feature"` — create proposal, specs, design, and tasks in one step
4. `/syn:clarify` — sharpen artifacts with targeted questions
5. `/syn:analyze` — cross-artifact consistency check
6. `/syn:apply` — implement the tasks
7. `/syn:archive` — archive when done

For specific cases, use these instead of `/syn:explore`:

* For bugs: use `/syn:debug`.
* For structural improvements: use `/syn:refactor`.
* For small low-risk changes (typos, config tweaks): use `/syn:quick` with no artifacts, just apply.

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
sync ──────────────────────────────────────────────────► constitution

explore  ──┐
debug    ──┤
           ├──► propose ──► clarify ──► analyze ──► apply ──► archive
refactor ──┘

quick ────────────────────────────────────────────────────────► apply
```

Each step suggests the next — you decide when to advance. Works in Claude Code, Cursor, Cline, and any AI coding tool that supports slash commands.

- `sync` generates the `constitution.md` — run once, re-run when the project shifts
- `explore`, `debug`, and `refactor` are entry points that hand off to `propose`
- `quick` skips the pipeline for small, low-risk changes

Each change gets its own folder under `synspec/changes/` with:

```
synspec/changes/my-feature/
├── proposal.md     # what and why
├── design.md       # how to build it
├── tasks.md        # implementation checklist
└── specs/
    └── *.md        # what the system shall do
```

### Persistent Project Memory

`constitution.md` is the core of SynArcX. Generated by `/syn:sync`, it preserves architectural intent, conventions, constraints, and engineering decisions across AI sessions — keeping specifications, architecture, and implementation in sync.

Unlike documentation, the constitution is optimized for AI operational context — not human reading.

A typical `constitution.md` includes:

```markdown
## Architecture Principles
- All API routes are RESTful, no GraphQL
- Business logic lives in /services, not controllers

## Module Boundaries
- auth/ owns all token lifecycle — nothing else touches JWTs

## Known Pitfalls
- DB migrations must be backwards-compatible (rolling deploys)

## Coding Patterns
- Use Result<T, E> for fallible operations, never throw in services
```

---

## Commands

Used inside your AI coding tool (Claude Code, Cursor, Cline, etc.):

| Command           | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| `/syn:sync`     | Scan project, run guardrail Q&A, generate/update `constitution.md`     |
| `/syn:explore`  | Think through ideas, investigate problems, clarify requirements          |
| `/syn:debug`    | Diagnose a known error (3-phase analysis), then prompts `/syn:propose` |
| `/syn:refactor` | Map current vs target structure, then prompts `/syn:propose`           |
| `/syn:quick`    | Fast-path for small low-risk changes — inline preview, confirm, apply   |
| `/syn:propose`  | Create a new change with proposal, specs, design, and tasks              |
| `/syn:clarify`  | Ask up to 5 targeted questions to sharpen artifacts                      |
| `/syn:analyze`  | Cross-artifact consistency check across all change artifacts             |
| `/syn:apply`    | Implement tasks from a change's task list                                |
| `/syn:archive`  | Archive a completed change and sync specs                                |

### CLI Commands

Used in your terminal:

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `synarcx init`    | Set up SynArcX workflow structure in your repository |
| `synarcx sync`    | Regenerate `constitution.md`                       |
| `synarcx explore` | Open explore session                                 |
| `synarcx propose` | Create a structured change proposal                  |
| `synarcx clarify` | Refine requirements into explicit specifications     |
| `synarcx analyze` | Evaluate architecture impact and tradeoffs           |
| `synarcx apply`   | Execute implementation tasks                         |
| `synarcx quick`   | Fast-path execution for small changes                |

---

## Artifacts

Each workflow stage produces explicit, reviewable files:

| Artifact            | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `proposal.md`     | Problem framing : what, why, and scope             |
| `specs/*.md`      | Clarified requirements : what the system shall do |
| `design.md`       | Architectural reasoning : how to build it          |
| `tasks.md`        | Implementation checklist                           |
| `constitution.md` | Persistent project memory for AI agents            |

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

**v0.2.x** — core workflow stable (init, sync, propose, clarify, analyze, apply, archive, quick)

Active development roadmap:

- stronger repository cognition
- architecture-aware execution validation
- workflow guardrails
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
