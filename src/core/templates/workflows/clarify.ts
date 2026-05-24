import type { SkillTemplate, CommandTemplate } from '../types.js';
import { commandFromSkill } from '../types.js';

export function getSynClarifySkillTemplate(): SkillTemplate {
  return {
    name: 'syn-clarify',
    description: 'Ask up to 5 targeted questions about a change\'s proposal, specs, or design to improve clarity before implementation.',
    instructions: `Ask targeted clarification questions about a change to improve its artifacts before implementation.

---

## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.

- If the file does not exist → STOP with: "Constitution not found. Run /syn:sync first — all workflow commands depend on it to enforce project rules."
- If the file exists but the [INV] or [WFL] sections have no \`**INV-NNN**\` / \`**WFL-NNN**\` items → STOP with: "Constitution has incomplete required sections. Run /syn:sync to complete them." (list which sections)
- If valid → read the [QR] and [INV] sections for context. Use [INV] to filter questions in Step 1.3 — do NOT ask about things already established in [INV].

---

## Phase 1: Clarification

### Step 1.1: Identify the change
- If the user specified a change name, use it
- Otherwise, run \`synarcx list --json\` to find active changes
- If multiple, ask which one to clarify

### Step 1.2: Read the artifacts
- \`synspec/changes/<name>/proposal.md\`
- \`synspec/changes/<name>/specs/**/*.md\` (if exist)
- \`synspec/changes/<name>/design.md\`

### Step 1.3: Generate targeted questions (5 default, extendable for critical unknowns)
Focus on areas that are:
- Ambiguous or underspecified
- Missing edge cases
- Unclear scope boundaries
- Unstated assumptions
- Missing acceptance criteria

Question categories:
- **Scope**: What's in/out? Edge cases?
- **Requirements**: Acceptance criteria? Success metrics?
- **Design**: Trade-offs considered? Alternatives?
- **Implementation**: Dependencies? Migration path?
- **Testing**: How to verify?

"Critical" = a hole or contradiction that would produce broken or incorrect code if left unaddressed. Not "nice to know" or stylistic preferences.

Do NOT ask about anything already established in the [INV] section of \`synspec/constitution.md\`.

### Step 1.4: Ask questions interactively (pick-and-enter UX)

For EACH question, use the **AskUserQuestion tool** with pre-generated answer options.

Rules for question format:
- **Preference/choice questions** (e.g., "Should this be sync or async?"): provide 2-4 specific options. A write-in option is automatically available.
- **Scope questions** (e.g., "Should this include admin users?"): provide Yes/No/Partial options with context.
- **Prioritization** (e.g., "Which edge case matters most?"): list the specific edge cases as options.
- **Truly open-ended questions** (e.g., "Describe the expected user journey"): use open-ended format ONLY when no reasonable options can be pre-generated.

Goal: The user should be able to answer most questions with a single click/selection, not by typing paragraphs.

Present questions one at a time. Wait for each answer before moving to the next.
Default maximum: 5 questions. If critical unknowns remain after 5, ask user to confirm before continuing.

### Step 1.5: Encode answers back into artifacts
- Edit the relevant artifact in place (proposal.md, design.md, or specs)
- Do NOT create new files
- Show what was changed and why

---

## Phase 2: Consistency Analysis

Runs automatically after Phase 1 completes. Inline — not a separate command.

Read all artifacts including \`tasks.md\`. Run the following 6 checks:

1. **Terminology consistency** — verify the same terms are used across all artifacts. Fix discrepancies in place.
2. **Scope alignment** — confirm the proposal scope matches what is described in design and tasks. Fix mismatches in place.
3. **Completeness** — check for missing sections or dangling references. Fill gaps or flag them.
4. **Conflict detection** — identify contradictory statements between artifacts. Resolve or flag.
5. **Traceability** — verify every task maps to a spec requirement. Add missing links or flag orphaned tasks.
6. **Constitution compliance** — read [BND] from \`synspec/constitution.md\` if not already read. Check whether any artifact contradicts [INV] invariants or [BND] boundaries.
   - If a conflict is found: surface it to the user with a clear description. Do NOT auto-fix. Always escalate to the user.

Rules:
- Maximum 5 auto-fixes total across checks 1–5.
- If a fix would contradict a Q&A answer from Phase 1, skip it (user answer wins).
- Check 6 never auto-fixes — always escalates.
- If zero issues found for a check, report it as "OK".

---

## Combined Output

After both phases complete, summarize using this format:

\`\`\`
## Phase 1: Clarification
Questions asked: N
Artifacts updated: [list]

## Phase 2: Consistency Analysis
1. Terminology:     OK / FIXED — [description]
2. Scope alignment: OK / FIXED
3. Completeness:    OK / FIXED
4. Conflicts:       OK / FIXED
5. Traceability:    OK / FIXED
6. Constitution:    OK / CONFLICT — [description, needs user resolution]

Next: /syn:apply to start implementation
\`\`\``,
    license: 'MIT',
    compatibility: 'Requires synarcx CLI.',
    metadata: { author: 'synarcx', version: '0.4' },
  };
}

export function getSynClarifyCommandTemplate(): CommandTemplate {
  return commandFromSkill(getSynClarifySkillTemplate(), {
    name: 'syn:clarify',
    description: 'Ask up to 5 targeted questions to improve change artifacts',
    tags: ['workflow', 'clarify'],
    content: `Ask targeted clarification questions about a change to improve its artifacts before implementation.

---

## Step 0: Constitution Gate

Read \`synspec/constitution.md\`.

- If the file does not exist → STOP with: "Constitution not found. Run /syn:sync first — all workflow commands depend on it to enforce project rules."
- If the file exists but [INV] or [WFL] sections have no \`**INV-NNN**\` / \`**WFL-NNN**\` items → STOP with: "Constitution has incomplete required sections. Run /syn:sync to complete them." (list which sections)
- If valid → read [QR] and [INV] sections for context. Use [INV] to filter questions in Step 1.3 — do NOT ask about things already established in [INV].

---

## Phase 1: Clarification

### Step 1.1: Identify the change
- Use the specified change name, or run \`synarcx list --json\` and ask if multiple

### Step 1.2: Read the artifacts
- \`synspec/changes/<name>/proposal.md\`
- \`synspec/changes/<name>/specs/**/*.md\` (if exist)
- \`synspec/changes/<name>/design.md\`

### Step 1.3: Generate targeted questions (5 default, extendable for critical unknowns)
Focus on: ambiguity, missing edge cases, unclear scope, unstated assumptions, missing acceptance criteria.
Do NOT ask about anything already established in [INV].

"Critical" = a hole that would produce broken or incorrect code if left unaddressed.

### Step 1.4: Ask questions interactively (pick-and-enter UX)
Use the **AskUserQuestion tool** with pre-generated answer options (e.g., preference choices, scope options, yes/no with context). Present one at a time. Wait for each answer. Max 5 questions. Ask about additional critical unknowns only with user confirmation. Goal: single-click responses instead of typing.

### Step 1.5: Encode answers back into artifacts
Edit proposal.md, design.md, or specs in place. Do NOT create new files. Show what changed and why.

---

## Phase 2: Consistency Analysis

Runs automatically after Phase 1. Read all artifacts including \`tasks.md\`. Also read [BND] from \`synspec/constitution.md\`.

Run 6 checks:
1. **Terminology** — same terms across all artifacts. Auto-fix if needed.
2. **Scope alignment** — proposal scope matches design and tasks. Auto-fix if needed.
3. **Completeness** — no missing sections or dangling references. Auto-fix if needed.
4. **Conflict detection** — no contradictions between artifacts. Auto-fix if needed.
5. **Traceability** — every task maps to a spec requirement. Auto-fix if needed.
6. **Constitution compliance** — no artifacts contradict [INV] or [BND]. NEVER auto-fix — always escalate to user.

Max 5 auto-fixes total across checks 1–5. If a fix contradicts a Phase 1 Q&A answer, skip it (user answer wins).

---

## Combined Output

\`\`\`
## Phase 1: Clarification
Questions asked: N
Artifacts updated: [list]

## Phase 2: Consistency Analysis
1. Terminology:     OK / FIXED — [description]
2. Scope alignment: OK / FIXED
3. Completeness:    OK / FIXED
4. Conflicts:       OK / FIXED
5. Traceability:    OK / FIXED
6. Constitution:    OK / CONFLICT — [description, needs user resolution]

Next: /syn:apply to start implementation
\`\`\``
  })
}
