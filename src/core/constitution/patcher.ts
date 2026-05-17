import { readFileSync, writeFileSync, renameSync } from 'fs';
import { parseConstitution, getSection } from './parser.js';
import { SECTION_HEADER_RE, ITEM_RE, nextId, computeFingerprint } from './format.js';

export type PatchEntry =
  | { type: 'decision'; decision: string; rationale: string; source: string }
  | { type: 'exception'; ref: string; exception: string };

export interface ConstitutionPatch {
  patches: PatchEntry[];
}

export interface PatchResult {
  decisionsAdded: number;
  decisionsSkipped: number;
  exceptionsAdded: number;
  versionBefore: number;
  versionAfter: number;
}

function findSectionHeaderIdx(lines: string[], tag: string): number {
  const upperTag = tag.toUpperCase();
  return lines.findIndex((line) => {
    const m = line.match(SECTION_HEADER_RE);
    return m && m[1]!.toUpperCase() === upperTag;
  });
}

function collectSectionItems(lines: string[], headerIdx: number, tag: string): string[] {
  const prefix = tag.toUpperCase();
  const idRe = new RegExp(`^\\*\\*${prefix}-\\d+\\*\\* —`);
  const items: string[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (SECTION_HEADER_RE.test(lines[i]!)) break;
    if (idRe.test(lines[i]!)) items.push(lines[i]!);
  }
  return items;
}

function findLastItemIdx(lines: string[], headerIdx: number, tag: string): number {
  const prefix = tag.toUpperCase();
  const idRe = new RegExp(`^\\*\\*${prefix}-\\d+\\*\\* —`);
  let lastIdx = -1;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (SECTION_HEADER_RE.test(lines[i]!)) break;
    if (idRe.test(lines[i]!)) lastIdx = i;
  }
  return lastIdx;
}

function applyDecisionEntry(
  lines: string[],
  decision: string,
): [lines: string[], added: boolean] {
  const headerIdx = findSectionHeaderIdx(lines, 'dec');
  const existingItems = headerIdx >= 0 ? collectSectionItems(lines, headerIdx, 'dec') : [];

  const prefix60 = decision.slice(0, 60);
  if (existingItems.some((item) => item.includes(prefix60))) {
    return [lines, false];
  }

  const newId = nextId('dec', existingItems);
  const newItem = `**${newId}** — ${decision}`;
  const newLines = [...lines];

  if (headerIdx < 0) {
    newLines.push('', '## [DEC] Decisions', '', newItem);
  } else {
    const lastItemIdx = findLastItemIdx(newLines, headerIdx, 'dec');
    if (lastItemIdx < 0) {
      newLines.splice(headerIdx + 1, 0, '', newItem);
    } else {
      newLines.splice(lastItemIdx + 1, 0, '', newItem);
    }
  }

  return [newLines, true];
}

function applyExceptionEntry(lines: string[], ref: string, exception: string): string[] {
  const headerIdx = findSectionHeaderIdx(lines, 'exc');
  const existingItems = headerIdx >= 0 ? collectSectionItems(lines, headerIdx, 'exc') : [];

  const newId = nextId('exc', existingItems);
  const newItem = `**${newId}** — Exception to ${ref}: ${exception}`;
  const newLines = [...lines];

  if (headerIdx < 0) {
    newLines.push('', '## [EXC] Exclusions', '', newItem);
  } else {
    const lastItemIdx = findLastItemIdx(newLines, headerIdx, 'exc');
    if (lastItemIdx < 0) {
      newLines.splice(headerIdx + 1, 0, '', newItem);
    } else {
      newLines.splice(lastItemIdx + 1, 0, '', newItem);
    }
  }

  return newLines;
}

export function applyPatch(constitutionPath: string, patch: ConstitutionPatch): PatchResult {
  const content = readFileSync(constitutionPath, 'utf-8');
  const parsed = parseConstitution(content);

  if (!parsed.frontmatter) {
    return { decisionsAdded: 0, decisionsSkipped: 0, exceptionsAdded: 0, versionBefore: 0, versionAfter: 0 };
  }

  const versionBefore = parsed.frontmatter.version ?? 0;
  const result: PatchResult = {
    decisionsAdded: 0,
    decisionsSkipped: 0,
    exceptionsAdded: 0,
    versionBefore,
    versionAfter: versionBefore + 1,
  };

  let lines = content.split('\n');

  for (const entry of patch.patches) {
    if (entry.type === 'decision') {
      const [newLines, added] = applyDecisionEntry(lines, entry.decision);
      lines = newLines;
      if (added) result.decisionsAdded++;
      else result.decisionsSkipped++;
    } else if (entry.type === 'exception') {
      lines = applyExceptionEntry(lines, entry.ref, entry.exception);
      result.exceptionsAdded++;
    }
  }

  const updatedContent = lines.join('\n');
  const reparsed = parseConstitution(updatedContent);
  const invItems = getSection(reparsed, 'inv')?.items ?? [];
  const decItems = getSection(reparsed, 'dec')?.items ?? [];
  const newFingerprint = computeFingerprint(invItems, decItems);
  const today = new Date().toISOString().split('T')[0]!;

  const final = updatedContent
    .replace(/^version:\s*\d+/m, `version: ${result.versionAfter}`)
    .replace(/^fingerprint:\s*\S+/m, `fingerprint: ${newFingerprint}`)
    .replace(/^last_sync:\s*\S+/m, `last_sync: ${today}`);

  const tmpPath = `${constitutionPath}.tmp`;
  writeFileSync(tmpPath, final, 'utf-8');
  renameSync(tmpPath, constitutionPath);

  return result;
}
