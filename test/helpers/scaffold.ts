import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface ScaffoldOptions {
  schema?: string
  tasks?: string
}

/**
 * Creates a minimal valid change directory structure in a temp dir.
 * Returns the tmpDir root and the change directory path.
 * Caller is responsible for cleanup via rmSync(tmpDir, { recursive: true, force: true }).
 */
export function createMinimalChange(
  changeName: string,
  opts: ScaffoldOptions = {}
): { tmpDir: string; changeDir: string; synspecDir: string } {
  const schema = opts.schema ?? 'synarcx'
  const tmpDir = mkdtempSync(join(tmpdir(), 'synarcx-test-'))

  const synspecDir = join(tmpDir, 'synspec')
  const changesDir = join(synspecDir, 'changes')
  const changeDir = join(changesDir, changeName)
  mkdirSync(changeDir, { recursive: true })

  // .synspec.yaml — minimal valid metadata
  writeFileSync(
    join(changeDir, '.synspec.yaml'),
    `schema: ${schema}\ncreated: ${new Date().toISOString().split('T')[0]}\n`,
    'utf-8'
  )

  // proposal.md — required for archive validation
  writeFileSync(
    join(changeDir, 'proposal.md'),
    `## Why\n\nTest change.\n\n## What Changes\n\n- test\n`,
    'utf-8'
  )

  if (opts.tasks !== undefined) {
    writeFileSync(join(changeDir, 'tasks.md'), opts.tasks, 'utf-8')
  }

  return { tmpDir, changeDir, synspecDir }
}

export function cleanupTmpDir(tmpDir: string): void {
  rmSync(tmpDir, { recursive: true, force: true })
}
