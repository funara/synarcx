export { SECTION_HEADER_RE, ITEM_RE, REQUIRED_SECTION_TAGS, nextId, computeFingerprint } from './format.js';

export type { ConstitutionSection, ParsedConstitution, DesignDecision } from './parser.js';
export { parseConstitution, getSection, extractDesignDecisions } from './parser.js';

export type { ConstitutionValidationResult } from './validator.js';
export { validateConstitution } from './validator.js';

export type { PatchEntry, ConstitutionPatch, PatchResult } from './patcher.js';
export { applyPatch } from './patcher.js';
