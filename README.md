# SynArcX — Synapse Architecture Code Extension

Spec-driven development workflow for AI coding agents.

## Install

```bash
npm install -g synarcx
```

Or with pnpm:

```bash
pnpm add -g synarcx
```

Run `synarcx --help` to verify.

## Quick Start

```bash
cd your-project
synarcx init
```

Then in your AI tool:

1. `/syn:sync` — validate README and generate project constitution with guardrail Q&A
2. `/syn:explore "your idea"` — think through the problem, then follow the suggestion to `/syn:propose`
3. `/syn:propose my-feature` — create proposal, specs, design, and tasks in one step
4. `/syn:clarify` — sharpen the artifacts with targeted questions
5. `/syn:analyze` — cross-artifact consistency check
6. `/syn:apply` — implement the tasks
7. `/syn:archive` — archive when done

For bugs, use `/syn:debug` instead of `/syn:explore` — same flow, starting from a known error.
For structural improvements, use `/syn:refactor`.
For small, low-risk changes (typos, config tweaks), use `/syn:quick` — no artifacts, inline preview, then apply.

## Commands

| Command           | Description                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `/syn:sync`     | Validate README, scan project files, run guardrail Q&A, generate constitution                    |
| `/syn:explore`  | Thinking partner — explore ideas, investigate problems, clarify requirements                    |
| `/syn:debug`    | Diagnose a known error (3-phase analysis), then prompts `/syn:propose` explicitly              |
| `/syn:refactor` | Investigate structural refactoring — map current vs target shape, then prompts `/syn:propose` |
| `/syn:quick`    | Fast-path for small low-risk changes — inline preview, confirm, apply — no artifacts           |
| `/syn:propose`  | Create a new change with proposal, specs, design, and tasks in one step                          |
| `/syn:clarify`  | Ask up to 5 targeted questions to sharpen artifacts before implementation                        |
| `/syn:analyze`  | Cross-artifact consistency check across proposal, specs, design, and tasks                       |
| `/syn:apply`    | Implement tasks from a change's task list                                                        |
| `/syn:archive`  | Archive a completed change and sync specs                                                        |

## How It Works

AI coding assistants are powerful but lose context fast when requirements live only in chat history. SynArcX adds a lightweight spec layer so you and your AI agree on what to build before any code is written.

```
sync ─────────────────────────────────────────► constitution

explore  ──┐
debug    ──┤
           ├──► propose ──► clarify ──► analyze ──► apply ──► archive
refactor ──┘

quick ────────────────────────────────────────────► apply
```

Each step suggests the next — you decide when to advance.

- `sync` generates/updates the constitution — run once, re-run when the project shifts
- `explore`, `debug`, and `refactor` are entry points that hand off to `propose`
- `quick` is a fast-path that skips the pipeline entirely — for small, low-risk changes

Each change gets its own folder under `synspec/changes/` with:

- `proposal.md` — what and why
- `specs/` — what the system shall do
- `design.md` — how to build it
- `tasks.md` — implementation checklist

## Supported Tools

Works with 25+ AI coding assistants: Claude Code, OpenCode, Cursor, Gemini, GitHub Copilot, Cline, Windsurf, Codex, and more. Slash commands are generated per tool on `synarcx init`.

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

## License

MIT
