import { describe, it, expect, afterEach } from 'vitest'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

import { writeChangeMetadata, readChangeMetadata, ChangeMetadataError } from '../src/core/change-metadata.js'
import { createMinimalChange, cleanupTmpDir } from './helpers/scaffold.js'

// ─── writeChangeMetadata ──────────────────────────────────────────────────────

describe('writeChangeMetadata', () => {
  let tmpDir: string
  let changeDir: string

  afterEach(() => {
    if (tmpDir) cleanupTmpDir(tmpDir)
  })

  it('writes metadata and round-trips via readChangeMetadata', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    await writeChangeMetadata(changeDir, { schema: 'synarcx', created: '2026-01-01' })
    const result = readChangeMetadata(changeDir)
    expect(result).not.toBeNull()
    expect(result?.schema).toBe('synarcx')
    expect(result?.created).toBe('2026-01-01')
  })

  it('leaves no .tmp file after a successful write', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    await writeChangeMetadata(changeDir, { schema: 'synarcx' })
    expect(existsSync(join(changeDir, '.synspec.yaml.tmp'))).toBe(false)
    expect(existsSync(join(changeDir, '.synspec.yaml'))).toBe(true)
  })

  it('throws for an unknown schema name', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    await expect(
      writeChangeMetadata(changeDir, { schema: 'nonexistent-schema-xyz' })
    ).rejects.toThrow(/Unknown schema/)
  })

  it('preserves unknown fields via passthrough (forward compat)', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    await writeChangeMetadata(changeDir, { schema: 'synarcx', created: '2026-01-01' })

    // Manually inject a future field into the written file
    const metaPath = join(changeDir, '.synspec.yaml')
    const existing = readFileSync(metaPath, 'utf-8')
    writeFileSync(metaPath, existing + 'future_field: true\n', 'utf-8')

    // readChangeMetadata should succeed and the unknown field passes through
    const result = readChangeMetadata(changeDir) as Record<string, unknown>
    expect(result).not.toBeNull()
    expect(result['future_field']).toBe(true)
  })
})

// ─── readChangeMetadata ───────────────────────────────────────────────────────

describe('readChangeMetadata', () => {
  let tmpDir: string
  let changeDir: string

  afterEach(() => {
    if (tmpDir) cleanupTmpDir(tmpDir)
  })

  it('returns null when no .synspec.yaml exists', () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    // scaffold writes a .synspec.yaml; remove it
    const { rmSync } = require('node:fs')
    rmSync(join(changeDir, '.synspec.yaml'))
    expect(readChangeMetadata(changeDir)).toBeNull()
  })

  it('throws ChangeMetadataError on malformed YAML', () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    writeFileSync(join(changeDir, '.synspec.yaml'), '{ not valid yaml: [unclosed', 'utf-8')
    expect(() => readChangeMetadata(changeDir)).toThrow(ChangeMetadataError)
  })

  it('throws ChangeMetadataError when schema field is missing', () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    writeFileSync(join(changeDir, '.synspec.yaml'), 'created: 2026-01-01\n', 'utf-8')
    expect(() => readChangeMetadata(changeDir)).toThrow(ChangeMetadataError)
  })
})
