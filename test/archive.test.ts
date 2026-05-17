import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { ArchiveCommand } from '../src/core/archive.js'
import { createMinimalChange, cleanupTmpDir } from './helpers/scaffold.js'

// ─── setup ────────────────────────────────────────────────────────────────────

let tmpDir: string
let changeDir: string
let originalCwd: string

beforeEach(() => {
  originalCwd = process.cwd()
})

afterEach(() => {
  try {
    process.chdir(originalCwd)
  } finally {
    if (tmpDir) cleanupTmpDir(tmpDir)
  }
})

// ─── happy path ───────────────────────────────────────────────────────────────

describe('ArchiveCommand', () => {
  it('moves change to archive/<date>-<name> on happy path', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('my-change'))
    process.chdir(tmpDir)

    const cmd = new ArchiveCommand()
    await cmd.execute('my-change', { yes: true, skipSpecs: true, noValidate: true })

    const today = new Date().toISOString().split('T')[0]
    const archivePath = join(tmpDir, 'synspec', 'changes', 'archive', `${today}-my-change`)

    expect(existsSync(changeDir)).toBe(false)
    expect(existsSync(archivePath)).toBe(true)
  })

  it('proceeds with incomplete tasks when yes=true', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('incomplete-change', {
      tasks: '## Tasks\n\n- [ ] 1.1 Incomplete task\n',
    }))
    process.chdir(tmpDir)

    const cmd = new ArchiveCommand()
    await cmd.execute('incomplete-change', { yes: true, skipSpecs: true, noValidate: true })

    const today = new Date().toISOString().split('T')[0]
    const archivePath = join(tmpDir, 'synspec', 'changes', 'archive', `${today}-incomplete-change`)
    expect(existsSync(archivePath)).toBe(true)
  })

  it('throws a clear error for a non-existent change', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('exists'))
    process.chdir(tmpDir)

    const cmd = new ArchiveCommand()
    await expect(
      cmd.execute('does-not-exist', { yes: true, skipSpecs: true, noValidate: true })
    ).rejects.toThrow(/not found/)
  })
})
