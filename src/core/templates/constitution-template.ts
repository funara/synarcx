export { computeFingerprint } from '../constitution/format.js';

export function getConstitutionTemplate(): string {
  return `---
version: 1
last_sync: YYYY-MM-DD
fingerprint: 00000000
mode: greenfield
---

## [QR] Quick Reference

## [INV] Invariants

## [BND] Boundaries

## [DEC] Decisions

## [DFT] Drift Indicators

## [WFL] Workflows

## [EXC] Exclusions

## [OWN] Ownership
`;
}
