import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { applyPatch } from '../core/constitution/patcher.js';

const PatchEntrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('decision'),
    decision: z.string(),
    rationale: z.string().optional(),
    source: z.string().optional(),
  }),
  z.object({
    type: z.literal('exception'),
    ref: z.string(),
    exception: z.string(),
  }),
  z.object({
    type: z.literal('invariant'),
    invariant: z.string(),
    rationale: z.string().optional(),
  }),
  z.object({
    type: z.literal('boundary'),
    boundary: z.string(),
    rationale: z.string().optional(),
  }),
]);

const ConstitutionPatchSchema = z.object({
  patches: z.array(PatchEntrySchema),
});

export async function patchConstitutionCommand(options?: { dryRun?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const constitutionPath = path.join(cwd, 'synspec', 'constitution.md');
  const patchPath = path.join(cwd, 'synspec', '.constitution-patch.json');

  try {
    await fs.access(constitutionPath);
  } catch {
    console.error('Constitution not found. Run /syn:sync first.');
    process.exit(1);
  }

  let raw: string;
  try {
    raw = await fs.readFile(patchPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('Error: synspec/.constitution-patch.json not found.');
    } else {
      console.error(`Error reading patch file: ${(err as Error).message}`);
    }
    process.exit(1);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw!);
  } catch {
    console.error('Error: synspec/.constitution-patch.json contains invalid JSON.');
    process.exit(1);
  }

  const validation = ConstitutionPatchSchema.safeParse(parsedJson);
  if (!validation.success) {
    console.error(`Error: synspec/.constitution-patch.json has invalid format: ${validation.error.message}`);
    process.exit(1);
  }

  if (options?.dryRun) {
    console.log('Dry run: Validating and previewing constitution patch...');
    const tempPath = `${constitutionPath}.dryrun.tmp`;
    try {
      await fs.copyFile(constitutionPath, tempPath);
      const result = applyPatch(tempPath, validation.data);
      const original = await fs.readFile(constitutionPath, 'utf-8');
      const modified = await fs.readFile(tempPath, 'utf-8');

      console.log('\n--- Patch Preview ---');
      const { decisionsAdded, exceptionsAdded, invariantsAdded, boundariesAdded, versionBefore, versionAfter } = result;
      console.log(`Summary: +${decisionsAdded} decisions, +${exceptionsAdded} exceptions, +${invariantsAdded} invariants, +${boundariesAdded} boundaries`);
      console.log(`Version: ${versionBefore} → ${versionAfter}`);

      const origLines = original.split('\n');
      const modLines = modified.split('\n');
      console.log('\nAdded lines:');
      for (const line of modLines) {
        if (line.trim().startsWith('**') && !origLines.includes(line)) {
          console.log(`  + ${line}`);
        }
      }
      console.log('--- End of Preview ---\n');
      console.log('Dry run completed. No files were modified.');
    } finally {
      try {
        await fs.unlink(tempPath);
      } catch {}
    }
    return;
  }

  const result = applyPatch(constitutionPath, validation.data);

  await fs.unlink(patchPath);

  const { decisionsAdded, exceptionsAdded, invariantsAdded, boundariesAdded, versionBefore, versionAfter } = result;
  console.log(
    `Constitution patched: +${decisionsAdded} decisions, +${exceptionsAdded} exceptions, +${invariantsAdded} invariants, +${boundariesAdded} boundaries. version: ${versionBefore} → ${versionAfter}`,
  );
}
