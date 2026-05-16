export const CONSTITUTION_SCHEMA_VERSION = 1;

export function computeFingerprint(invItems: string[], decItems: string[]): string {
  const str = [...invItems, ...decItems].join('\n');
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function getConstitutionTemplate(): string {
  return `---
schema: synarcx/constitution@${CONSTITUTION_SCHEMA_VERSION}
version: 1
last_sync: YYYY-MM-DD
fingerprint: 00000000
mode: greenfield
---

<!-- SECTION:qr confidence=explicit -->
## [QR] Quick Reference
<!-- Max 60 tokens. First thing every command reads. -->
<!-- none yet -->

<!-- SECTION:inv confidence=pending -->
## [INV] Invariants
<!-- REQUIRED. At least one explicit item. Rules that must NEVER change. -->
<!-- Format: | ID | Rule | Confidence | Source | -->
<!-- none yet -->

<!-- SECTION:bnd confidence=pending -->
## [BND] Boundaries
<!-- Optional. Module/layer boundaries and crossing rules. -->
<!-- none yet -->

<!-- SECTION:dec confidence=pending -->
## [DEC] Stable Decisions
<!-- Optional. Append-only ADR log. -->
<!-- Format: | ID | Date | Decision | Rationale | Source | -->
<!-- none yet -->

<!-- SECTION:dft confidence=pending -->
## [DFT] Drift Heuristics
<!-- Optional. Patterns that signal architectural drift. -->
<!-- none yet -->

<!-- SECTION:wfl confidence=pending -->
## [WFL] Workflow Rules
<!-- REQUIRED. At least one item. -->
<!-- none yet -->

<!-- SECTION:exc confidence=pending -->
## [EXC] Exceptions
<!-- Optional. Known deviations from invariants. -->
<!-- Format: | Ref | Exception | Justification | Expires | -->
<!-- none yet -->

<!-- SECTION:own confidence=pending -->
## [OWN] Ownership
<!-- Optional. Relevant for teams. -->
<!-- none yet -->
`;
}
