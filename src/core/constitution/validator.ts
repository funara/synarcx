import { ParsedConstitution, getSection, hasPendingRequired } from './parser.js';

export interface ConstitutionValidationResult {
  valid: boolean;
  pendingRequired: string[];
  missingRequired: string[];
}

export function validateConstitution(parsed: ParsedConstitution): ConstitutionValidationResult {
  if (!parsed.frontmatter) {
    return {
      valid: false,
      pendingRequired: [],
      missingRequired: ['[INV]', '[WFL]'],
    };
  }

  const pendingRequired = hasPendingRequired(parsed);
  const missingRequired: string[] = [];

  const required = ['inv', 'wfl'];
  for (const tag of required) {
    if (!getSection(parsed, tag)) {
      missingRequired.push(`[${tag.toUpperCase()}]`);
    }
  }

  return {
    valid: pendingRequired.length === 0 && missingRequired.length === 0,
    pendingRequired,
    missingRequired,
  };
}

export function isOldConstitutionFormat(content: string): boolean {
  // v0.3.x constitutions do not have a `schema:` field in frontmatter
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') return false;
  const endIdx = lines.indexOf('---', 1);
  if (endIdx < 0) return false;
  const yamlBlock = lines.slice(1, endIdx).join('\n');
  return !yamlBlock.includes('schema:');
}
