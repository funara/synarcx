import { describe, it, expect, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildUpdatedSpec, writeUpdatedSpec, type SpecUpdate } from '../src/core/specs-apply.js'
import { createMinimalChange, cleanupTmpDir } from './helpers/scaffold.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

const EXISTING_SPEC = `# Spec: capability

## Requirements

### Requirement: Existing Feature
The system SHALL support the existing feature.

#### Scenario: Happy path
- **WHEN** user triggers existing feature
- **THEN** system responds correctly
`

function makeUpdate(source: string, target: string, exists: boolean): SpecUpdate {
  return { source, target, exists }
}

// ─── buildUpdatedSpec ─────────────────────────────────────────────────────────

describe('buildUpdatedSpec', () => {
  let tmpDir: string
  let changeDir: string
  let mainSpecsDir: string

  afterEach(() => {
    if (tmpDir) cleanupTmpDir(tmpDir)
  })

  it('ADDED — appends new requirement to a new spec', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `## ADDED Requirements\n\n### Requirement: New Feature\nThe system SHALL support new feature.\n\n#### Scenario: Basic\n- **WHEN** user does action\n- **THEN** system responds\n`, 'utf-8')

    const target = join(mainSpecsDir, 'capability', 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, false)
    const result = await buildUpdatedSpec(update, 'test-change')

    expect(result.counts.added).toBe(1)
    expect(result.rebuilt).toContain('### Requirement: New Feature')
  })

  it('MODIFIED — replaces existing requirement content', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const targetDir = join(mainSpecsDir, 'capability')
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'spec.md'), EXISTING_SPEC, 'utf-8')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `## MODIFIED Requirements\n\n### Requirement: Existing Feature\nThe system SHALL support the UPDATED existing feature.\n\n#### Scenario: Happy path\n- **WHEN** user triggers feature\n- **THEN** system responds with new behavior\n`, 'utf-8')

    const target = join(targetDir, 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, true)
    const result = await buildUpdatedSpec(update, 'test-change')

    expect(result.counts.modified).toBe(1)
    expect(result.rebuilt).toContain('UPDATED existing feature')
  })

  it('REMOVED — deletes requirement from spec', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const targetDir = join(mainSpecsDir, 'capability')
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'spec.md'), EXISTING_SPEC, 'utf-8')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `## REMOVED Requirements\n\n### Requirement: Existing Feature\n`, 'utf-8')

    const target = join(targetDir, 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, true)
    const result = await buildUpdatedSpec(update, 'test-change')

    expect(result.counts.removed).toBe(1)
    expect(result.rebuilt).not.toContain('Existing Feature')
  })

  it('RENAMED — renames requirement header', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const targetDir = join(mainSpecsDir, 'capability')
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(join(targetDir, 'spec.md'), EXISTING_SPEC, 'utf-8')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `## RENAMED Requirements\n\nFROM: ### Requirement: Existing Feature\nTO: ### Requirement: Renamed Feature\n`, 'utf-8')

    const target = join(targetDir, 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, true)
    const result = await buildUpdatedSpec(update, 'test-change')

    expect(result.counts.renamed).toBe(1)
    expect(result.rebuilt).toContain('### Requirement: Renamed Feature')
    expect(result.rebuilt).not.toContain('### Requirement: Existing Feature')
  })

  it('MODIFIED on non-existent spec throws', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `## MODIFIED Requirements\n\n### Requirement: Ghost\nThe system SHALL do something.\n\n#### Scenario: s\n- **WHEN** x\n- **THEN** y\n`, 'utf-8')

    const target = join(mainSpecsDir, 'capability', 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, false)
    await expect(buildUpdatedSpec(update, 'test-change')).rejects.toThrow()
  })

  it('cross-section conflict (ADDED + REMOVED same name) throws', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(
      join(specDir, 'spec.md'),
      `## ADDED Requirements\n\n### Requirement: Conflict\nShall conflict.\n\n#### Scenario: s\n- **WHEN** x\n- **THEN** y\n\n## REMOVED Requirements\n\n### Requirement: Conflict\n`,
      'utf-8'
    )

    const target = join(mainSpecsDir, 'capability', 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, false)
    await expect(buildUpdatedSpec(update, 'test-change')).rejects.toThrow()
  })

  it('empty delta (no operations) throws', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `# Spec with no delta sections\n\nJust prose.\n`, 'utf-8')

    const target = join(mainSpecsDir, 'capability', 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, false)
    await expect(buildUpdatedSpec(update, 'test-change')).rejects.toThrow()
  })
})

// ─── writeUpdatedSpec ─────────────────────────────────────────────────────────

describe('writeUpdatedSpec', () => {
  let tmpDir: string
  let changeDir: string
  let mainSpecsDir: string

  afterEach(() => {
    if (tmpDir) cleanupTmpDir(tmpDir)
  })

  it('writes file and leaves no .tmp behind', async () => {
    ;({ tmpDir, changeDir } = createMinimalChange('test-change'))
    mainSpecsDir = join(tmpDir, 'synspec', 'specs')

    const specDir = join(changeDir, 'specs', 'capability')
    mkdirSync(specDir, { recursive: true })
    writeFileSync(join(specDir, 'spec.md'), `## ADDED Requirements\n\n### Requirement: New\nShall work.\n\n#### Scenario: s\n- **WHEN** x\n- **THEN** y\n`, 'utf-8')

    const target = join(mainSpecsDir, 'capability', 'spec.md')
    const update = makeUpdate(join(specDir, 'spec.md'), target, false)
    const { rebuilt, counts } = await buildUpdatedSpec(update, 'test-change')
    await writeUpdatedSpec(update, rebuilt, counts)

    expect(existsSync(target)).toBe(true)
    expect(existsSync(target + '.tmp')).toBe(false)
  })
})
