import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynQuickSkillTemplate(): SkillTemplate {
  return {
    name: 'syn-quick',
    description: 'Fast-path for small, low-risk changes — reads context, shows change inline, asks confirmation, applies. No artifacts created.',
    instructions: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first to establish project rules before making changes."
- If \`[INV]\` or \`[WFL]\` sections have no \`**INV-NNN**\` / \`**WFL-NNN**\` items → STOP with: "Constitution [TAG] section is empty. Run /syn:sync to complete it." (list which sections)
- If valid → after scope check, cross-reference the proposed change against [INV]. If the change would violate any invariant, warn the user with the specific invariant before asking for confirmation.

---

Apply a small, low-risk change directly — no proposal, no specs, no artifacts. Describes the change inline, asks the user to confirm, then applies after confirmation.

**Input**: The user describes the change to make. If no description provided, ask what they want to change.

---

## Scope Check

Before proceeding, evaluate whether the described change is small enough for the quick path:

**Good for /syn:quick:**
- Typo fixes
- Single-line config changes
- Renaming a variable or function (single file, no callers to update across modules)
- Simple dependency version bump
- One-off formatting fix
- Small comment or documentation fix

**Too large for /syn:quick (warn and suggest alternative):**
- Multi-file changes
- Changes that add new behavior or logic
- Architectural or structural changes
- Changes requiring design decisions
- Refactoring that touches multiple modules
- Any change that would normally warrant a proposal

If the change description implies multi-file, new behavior, or architectural impact:
1. Warn: "This looks too large for \`/syn:quick\`. Consider \`/syn:explore\` to think it through or \`/syn:propose\` to create a full change."
2. If the user acknowledges and chooses to proceed anyway, continue with the quick apply.

---

## Read Context

Read the relevant source files to understand current state.

---

## Show Change Inline

Present the proposed change clearly:

\`\`\`
### Proposed Change

**File**: path/to/file.ts
**Current**: <existing code or content>
**Proposed**: <modified code or content>
**Reason**: <brief explanation>
\`\`\`

---

## Ask Confirmation

Use the AskUserQuestion tool to confirm:
> "Apply this change?"

Options: Yes (proceed), No (cancel).

Apply only after explicit confirmation.

---

## Apply

Make the change. Commit is optional based on user preference.

---

## Output

After applying:
- Summarize what was changed
- Note that no synspec artifacts were created`,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.4' },
  };
}

export function getSynQuickCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynQuickSkillTemplate(), {
    name: 'syn:quick',
    description: 'Apply a small, low-risk change directly — no artifacts, inline preview, confirmation step',
    tags: ['workflow', 'quick', 'fast'],
    content: `## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.
- If missing → STOP. Reply: "Constitution not found. Run \`/syn:sync\` first to establish project rules before making changes."
- If \`[INV]\` or \`[WFL]\` have no \`**INV-NNN**\` / \`**WFL-NNN**\` items → STOP with: "Constitution [TAG] section is empty. Run /syn:sync to complete it."
- If valid → after scope check, cross-reference the change against [INV]. If it would violate an invariant, warn the user before asking for confirmation.

---

Apply a small, low-risk change directly — no proposal, no specs, no artifacts. Describes the change inline, asks the user to confirm, then applies after confirmation.

**Input**: The argument after \`/syn:quick\` describes the change to make.

---

## Scope Check

- **Good for**: typo fixes, single-line config changes, renames (single file), dep bumps, minor formatting, comment fixes.
- **Too large**: multi-file changes, new behavior, architectural changes, design decisions, multi-module refactoring.

If too large → warn and suggest \`/syn:explore\` or \`/syn:propose\`. If user confirms anyway, proceed.

---

## Read Context

Read the relevant source files to understand current state.

---

## Show Change Inline

Present: file, current content, proposed content, reason.

---

## Ask Confirmation

Ask "Apply this change?" with Yes/No options. Apply only after confirmation.

---

## Apply

Make the change. No synspec artifacts are created.`
  })
}
