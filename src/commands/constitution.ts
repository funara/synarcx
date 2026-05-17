import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { applyPatch } from '../core/constitution/patcher.js';

const PatchEntrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('decision'),
    decision: z.string(),
    rationale: z.string(),
    source: z.string(),
  }),
  z.object({
    type: z.literal('exception'),
    ref: z.string(),
    exception: z.string(),
  }),
]);

const ConstitutionPatchSchema = z.object({
  patches: z.array(PatchEntrySchema),
});

export async function patchConstitutionCommand(): Promise<void> {
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

  const result = applyPatch(constitutionPath, validation.data);

  await fs.unlink(patchPath);

  const { decisionsAdded, exceptionsAdded, versionBefore, versionAfter } = result;
  console.log(
    `Constitution patched: +${decisionsAdded} decisions, +${exceptionsAdded} exceptions. version: ${versionBefore} → ${versionAfter}`,
  );
}
