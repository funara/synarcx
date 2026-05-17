import { parse as parseYaml } from 'yaml';
import { SECTION_HEADER_RE, ITEM_RE } from './format.js';

export interface ConstitutionSection {
  tag: string;
  items: string[];
  body: string[];
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

export function parseConstitution(content: string): ParsedConstitution {
  const lines = content.split('\n');
  let frontmatter: ParsedConstitution['frontmatter'] = null;
  let i = 0;

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

  const bodyLines = lines.slice(i);
  const sectionStarts: { index: number; tag: string }[] = [];

  for (let j = 0; j < bodyLines.length; j++) {
    const m = bodyLines[j]!.match(SECTION_HEADER_RE);
    if (m) {
      sectionStarts.push({ index: j, tag: m[1]!.toLowerCase() });
    }
  }

  const sections: ConstitutionSection[] = [];
  for (let k = 0; k < sectionStarts.length; k++) {
    const start = sectionStarts[k]!;
    const end = sectionStarts[k + 1]?.index ?? bodyLines.length;
    const sectionLines = bodyLines.slice(start.index + 1, end);

    const items: string[] = [];
    const body: string[] = [];

    for (const line of sectionLines) {
      if (ITEM_RE.test(line)) {
        items.push(line);
      } else if (line.trim()) {
        body.push(line);
      }
    }

    sections.push({ tag: start.tag, items, body });
  }

  return { frontmatter, sections };
}

export function getSection(parsed: ParsedConstitution, tag: string): ConstitutionSection | undefined {
  return parsed.sections.find((s) => s.tag === tag.toLowerCase());
}

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
