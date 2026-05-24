import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { readPendingSync, writePendingSync, processPendingEntries } from '../src/core/pending-sync.js';

describe('pending-sync module', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'synarcx-ps-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null if pending-sync file does not exist', async () => {
    const data = await readPendingSync(tmpDir);
    expect(data).toBeNull();
  });

  it('reads and writes pending-sync file correctly', async () => {
    const mockData = {
      pending: [
        { change: '2026-05-24-test-change', archivedAt: '2026-05-24T10:00:00Z', syncedAt: null }
      ]
    };
    await writePendingSync(tmpDir, mockData);
    const readData = await readPendingSync(tmpDir);
    expect(readData).not.toBeNull();
    expect(readData?.pending).toHaveLength(1);
    expect(readData?.pending[0]?.change).toBe('2026-05-24-test-change');
  });

  it('processes and deletes pending-sync file', async () => {
    const mockData = {
      pending: [
        { change: '2026-05-24-test-change', archivedAt: '2026-05-24T10:00:00Z', syncedAt: null }
      ]
    };
    await writePendingSync(tmpDir, mockData);
    await processPendingEntries(tmpDir);
    const dataAfter = await readPendingSync(tmpDir);
    expect(dataAfter).toBeNull();
  });
});
