import { type ParsedConstitution, getSection } from './parser.js';

export interface ConstitutionValidationResult {
  valid: boolean;
  missingRequired: string[];
  emptyRequired: string[];
  missingFingerprint?: boolean;
}

export function validateConstitution(parsed: ParsedConstitution): ConstitutionValidationResult {
  if (!parsed.frontmatter) {
    return {
      valid: false,
      missingRequired: ['[INV]', '[WFL]'],
      emptyRequired: [],
      missingFingerprint: true,
    };
  }

  const missingRequired: string[] = [];
  const emptyRequired: string[] = [];
  const missingFingerprint = parsed.frontmatter.fingerprint === undefined || parsed.frontmatter.fingerprint === null || String(parsed.frontmatter.fingerprint).trim() === '';

  for (const tag of ['inv', 'wfl']) {
    const section = getSection(parsed, tag);
    if (!section) {
      missingRequired.push(`[${tag.toUpperCase()}]`);
    } else if (section.items.length === 0) {
      emptyRequired.push(`[${tag.toUpperCase()}]`);
    }
  }

  return {
    valid: missingRequired.length === 0 && emptyRequired.length === 0 && !missingFingerprint,
    missingRequired,
    emptyRequired,
    missingFingerprint,
  };
}
