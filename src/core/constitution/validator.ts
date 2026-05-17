import { type ParsedConstitution, getSection } from './parser.js';

export interface ConstitutionValidationResult {
  valid: boolean;
  missingRequired: string[];
  emptyRequired: string[];
}

export function validateConstitution(parsed: ParsedConstitution): ConstitutionValidationResult {
  if (!parsed.frontmatter) {
    return {
      valid: false,
      missingRequired: ['[INV]', '[WFL]'],
      emptyRequired: [],
    };
  }

  const missingRequired: string[] = [];
  const emptyRequired: string[] = [];

  for (const tag of ['inv', 'wfl']) {
    const section = getSection(parsed, tag);
    if (!section) {
      missingRequired.push(`[${tag.toUpperCase()}]`);
    } else if (section.items.length === 0) {
      emptyRequired.push(`[${tag.toUpperCase()}]`);
    }
  }

  return {
    valid: missingRequired.length === 0 && emptyRequired.length === 0,
    missingRequired,
    emptyRequired,
  };
}
