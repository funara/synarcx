import { readFileSync, writeFileSync, renameSync } from 'fs';
import path from 'path';
import { parseConstitution, getSection, extractDesignDecisions } from './parser.js';
import { computeFingerprint } from '../templates/constitution-template.js';

export interface DecisionPatch {
  title: string;
  decision: string;
  rationale: string;
  source: string;
}

export interface InvariantConfidencePatch {
  id: string;
  newConfidence: 'explicit';
  source: string;
}

export interface ExceptionPatch {
  ref: string;
  exception: string;
  justification: string;
}

export interface ConstitutionPatch {
  decisions?: DecisionPatch[];
  invariantUpgrades?: InvariantConfidencePatch[];
  exceptions?: ExceptionPatch[];
}

export interface PatchResult {
  decisionsAdded: number;
  invariantsConfirmed: number;
  exceptionsAdded: number;
}

export function applyPatch(constitutionPath: string, patch: ConstitutionPatch): PatchResult {
  const content = readFileSync(constitutionPath, 'utf-8');
  const parsed = parseConstitution(content);
  const result: PatchResult = { decisionsAdded: 0, invariantsConfirmed: 0, exceptionsAdded: 0 };

  if (!parsed.frontmatter) return result;

  let updated = content;

  // Apply decision patches
  if (patch.decisions?.length) {
    const decSection = getSection(parsed, 'dec');
    const existing = decSection?.items.join('\n') ?? '';
    const decEntries: string[] = [];

    // Find highest existing DEC ID
    let maxId = 0;
    const idMatches = existing.matchAll(/DEC-(\d+)/g);
    for (const m of idMatches) {
      const n = parseInt(m[1]!, 10);
      if (n > maxId) maxId = n;
    }

    for (const d of patch.decisions) {
      // Deduplicate by decision text
      if (existing.includes(d.decision.slice(0, 40))) continue;
      maxId++;
      const id = `DEC-${String(maxId).padStart(3, '0')}`;
      const date = new Date().toISOString().split('T')[0]!;
      decEntries.push(`| ${id} | ${date} | ${d.decision} | ${d.rationale} | ${d.source} |`);
      result.decisionsAdded++;
    }

    if (decEntries.length > 0) {
      const newRows = decEntries.join('\n');
      const tableHeader = '| ID | Date | Decision | Rationale | Source |';
      const tableSep = '|-----|------|----------|-----------|--------|';

      if (existing.includes(tableHeader)) {
        updated = updated.replace(
          /(\|\s*ID\s*\|[^\n]+\n\|[-| ]+\|)([^\n]|\n(?!\n<!-- SECTION))*?(?=\n<!-- SECTION|$)/s,
          (m) => m.trimEnd() + '\n' + newRows,
        );
      } else {
        const noneComment = '<!-- none yet -->';
        const replacement = `${tableHeader}\n${tableSep}\n${newRows}`;
        updated = updated.replace(
          /<!-- SECTION:dec[^>]*-->\n## \[DEC\][^\n]*\n[^\n]*\n([^\n]*\n)*?(?=<!-- SECTION:|$)/s,
          (m) => m.replace(noneComment, replacement).replace('<!-- none yet -->', replacement),
        );
      }
    }
  }

  // Apply invariant confidence upgrades
  if (patch.invariantUpgrades?.length) {
    for (const upgrade of patch.invariantUpgrades) {
      const idPattern = new RegExp(`(\\|\\s*${upgrade.id}\\s*\\|[^|]*\\|[^|]*)\\bguessed\\b|\\binferred\\b`);
      if (idPattern.test(updated)) {
        updated = updated.replace(idPattern, (_m, p1) => `${p1}${upgrade.newConfidence}`);
        result.invariantsConfirmed++;
      }
    }
  }

  // Apply exception patches
  if (patch.exceptions?.length) {
    const excSection = getSection(parsed, 'exc');
    const existing = excSection?.items.join('\n') ?? '';
    const excEntries: string[] = [];

    for (const e of patch.exceptions) {
      if (existing.includes(e.exception.slice(0, 30))) continue;
      excEntries.push(`| ${e.ref} | ${e.exception} | ${e.justification} | — |`);
      result.exceptionsAdded++;
    }

    if (excEntries.length > 0) {
      const newRows = excEntries.join('\n');
      updated = updated.replace(
        /(<!-- SECTION:exc[^>]*-->\n## \[EXC\][^\n]*\n[^\n]*\n)([\s\S]*?)(?=\n<!-- SECTION:|$)/,
        (_m, header, body) => {
          const trimmed = body.trimEnd();
          return trimmed.includes('<!-- none yet -->')
            ? `${header}| Ref | Exception | Justification | Expires |\n|-----|-----------|---------------|---------||\n${newRows}\n`
            : `${header}${trimmed}\n${newRows}\n`;
        },
      );
    }
  }

  // Increment version and recompute fingerprint
  const invSection = getSection(parsed, 'inv');
  const decSection = getSection(parsed, 'dec');
  const invItems = invSection?.items ?? [];
  const decItems = decSection?.items ?? [];
  const newFingerprint = computeFingerprint(invItems, decItems);
  const newVersion = (parsed.frontmatter.version ?? 0) + 1;
  const today = new Date().toISOString().split('T')[0]!;

  updated = updated
    .replace(/^version:\s*\d+/m, `version: ${newVersion}`)
    .replace(/^fingerprint:\s*\S+/m, `fingerprint: ${newFingerprint}`)
    .replace(/^last_sync:\s*\S+/m, `last_sync: ${today}`);

  // Atomic write
  const tmpPath = constitutionPath.replace(/\.md$/, '.tmp.md');
  writeFileSync(tmpPath, updated, 'utf-8');
  renameSync(tmpPath, constitutionPath);

  return result;
}

export function extractPatchFromChange(
  designContent: string,
  _proposalContent: string,
  _tasksContent: string,
): ConstitutionPatch {
  const decisions = extractDesignDecisions(designContent).map((d) => ({
    ...d,
    source: 'archive',
  }));

  // Exception extraction: look for "Exception to INV-" pattern in tasks/design
  const excPattern = /Exception to (INV-\d+)[:\s]+([^\n.]+)/g;
  const exceptions: ExceptionPatch[] = [];
  for (const content of [designContent, _tasksContent]) {
    let m;
    while ((m = excPattern.exec(content)) !== null) {
      exceptions.push({
        ref: m[1]!,
        exception: m[2]!.trim(),
        justification: 'recorded during implementation',
      });
    }
  }

  return { decisions, exceptions };
}
