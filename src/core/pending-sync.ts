import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

export const PendingSyncEntrySchema = z.object({
  change: z.string(),
  archivedAt: z.string(),
  syncedAt: z.string().nullable().optional(),
});

export const PendingSyncSchema = z.object({
  pending: z.array(PendingSyncEntrySchema),
});

export type PendingSyncEntry = z.infer<typeof PendingSyncEntrySchema>;
export type PendingSync = z.infer<typeof PendingSyncSchema>;

export function getPendingSyncPath(cwd: string): string {
  return path.join(cwd, 'synspec', '.pending-sync.json');
}

export async function readPendingSync(cwd: string): Promise<PendingSync | null> {
  const filePath = getPendingSyncPath(cwd);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = PendingSyncSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

export async function writePendingSync(cwd: string, data: PendingSync): Promise<void> {
  const filePath = getPendingSyncPath(cwd);
  const dirPath = path.dirname(filePath);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function processPendingEntries(cwd: string): Promise<void> {
  const filePath = getPendingSyncPath(cwd);
  await fs.unlink(filePath).catch(() => {});
}
