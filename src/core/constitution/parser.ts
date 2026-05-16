import { parse as parseYaml } from 'yaml';

export interface ConstitutionSection {
  tag: string;
  confidence: 'explicit' | 'inferred' | 'guessed' | 'pending';
  items: string[];
}

export interface ParsedConstitution {
  frontmatter: {
    schema: string;
    version: number;
    last_sync: string;
    fingerprint: string;
    mode: 'greenfield' | 'brownfield' | 'update';
  } | null;
  sections: ConstitutionSection[];
}

export interface DesignDecision {
  title: string;
  decision: string;
  rationale: string;
}

const SECTION_MARKER_RE = /^<!--\s*SECTION:(\w+)\s+confidence=(\w+)\s*-->/;
const CONFIDENCE_VALUES = new Set(['explicit', 'inferred', 'guessed', 'pending']);

export function parseConstitution(content: string): ParsedConstitution {
  const lines = content.split('\n');
  let frontmatter: ParsedConstitution['frontmatter'] = null;
  let i = 0;

  // Parse YAML frontmatter
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.indexOf('---', 1);
    if (endIdx > 0) {
      const yamlContent = lines.slice(1, endIdx).join('\n');
      try {
        const raw = parseYaml(yamlContent);
        if (raw && typeof raw === 'object') {
          frontmatter = raw as ParsedConstitution['frontmatter'];
        }
      } catch {
        // Invalid frontmatter — treat as none
      }
      i = endIdx + 1;
    }
  }

  const sections: ConstitutionSection[] = [];
  let currentSection: ConstitutionSection | null = null;
  let currentItems: string[] = [];

  const flushSection = () => {
    if (currentSection) {
      currentSection.items = currentItems.filter((l) => l.trim() && !l.trim().startsWith('<!--'));
      sections.push(currentSection);
      currentSection = null;
      currentItems = [];
    }
  };

  for (; i < lines.length; i++) {
    const line = lines[i]!;
    const markerMatch = line.match(SECTION_MARKER_RE);
    if (markerMatch) {
      flushSection();
      const tag = markerMatch[1]!;
      const conf = markerMatch[2]!;
      const confidence = CONFIDENCE_VALUES.has(conf)
        ? (conf as ConstitutionSection['confidence'])
        : 'pending';
      currentSection = { tag, confidence, items: [] };
      currentItems = [];
    } else if (currentSection) {
      // Skip the ## [TAG] heading line
      if (!line.match(/^##\s+\[/)) {
        currentItems.push(line);
      }
    }
  }
  flushSection();

  return { frontmatter, sections };
}

export function getSection(parsed: ParsedConstitution, tag: string): ConstitutionSection | undefined {
  return parsed.sections.find((s) => s.tag === tag);
}

export function hasPendingRequired(parsed: ParsedConstitution): string[] {
  const required = ['inv', 'wfl'];
  const pending: string[] = [];
  for (const tag of required) {
    const section = getSection(parsed, tag);
    if (!section || section.confidence === 'pending' || section.items.length === 0) {
      pending.push(`[${tag.toUpperCase()}]`);
    }
  }
  return pending;
}

/**
 * Strictly extract design decisions matching the synarcx design.md template format:
 * ### D<N>: <title>
 * **Decision**: <text>
 * **Rationale**: <text>
 */
export function extractDesignDecisions(designContent: string): DesignDecision[] {
  const decisions: DesignDecision[] = [];
  const lines = designContent.split('\n');

  let i = 0;
  while (i < lines.length) {
    const headingMatch = lines[i]?.match(/^###\s+D(\d+):\s+(.+)$/);
    if (headingMatch) {
      const title = headingMatch[2]!.trim();
      let decision = '';
      let rationale = '';
      let j = i + 1;

      // Scan next lines for **Decision**: and **Rationale**: within same block
      while (j < lines.length && !lines[j]!.match(/^###\s+D\d+:/)) {
        const decMatch = lines[j]!.match(/^\*\*Decision\*\*:\s*(.+)$/);
        const ratMatch = lines[j]!.match(/^\*\*Rationale\*\*:\s*(.+)$/);
        if (decMatch) decision = decMatch[1]!.trim();
        if (ratMatch) rationale = ratMatch[1]!.trim();
        j++;
      }

      if (decision && rationale) {
        decisions.push({ title, decision, rationale });
      }
      i = j;
    } else {
      i++;
    }
  }

  return decisions;
}
