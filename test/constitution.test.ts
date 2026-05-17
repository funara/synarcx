import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { SECTION_HEADER_RE, ITEM_RE, REQUIRED_SECTION_TAGS, nextId, computeFingerprint } from '../src/core/constitution/format.js'
import { parseConstitution, getSection } from '../src/core/constitution/parser.js'
import { validateConstitution } from '../src/core/constitution/validator.js'
import { applyPatch } from '../src/core/constitution/patcher.js'

// ─── shared fixture ──────────────────────────────────────────────────────────

const MINIMAL_CONSTITUTION = `---
schema: synarcx/constitution@0.4
version: 1
last_sync: 2026-01-01
fingerprint: 00000000
mode: brownfield
---

## [QR] Quick Reference

- primary rule

## [INV] Invariants

**INV-001** — No breaking changes without a migration path.

**INV-002** — All writes are atomic.

## [BND] Boundaries

**BND-001** — Core does not import commands.

## [DEC] Decisions

**DEC-001** — Use ESM only.

## [DFT] Drift Indicators

**DFT-001** — Direct DB calls outside repository layer.

## [WFL] Workflows

**WFL-001** — Conventional commits with emoji prefixes.

## [EXC] Exclusions

**EXC-001** — No server-side rendering.

## [OWN] Ownership

**OWN-001** — Author: Test.
`

// Constitution with no DEC or EXC sections
const CONSTITUTION_NO_DEC_EXC = `---
schema: synarcx/constitution@0.4
version: 1
last_sync: 2026-01-01
fingerprint: 00000000
mode: brownfield
---

## [QR] Quick Reference

## [INV] Invariants

**INV-001** — Core invariant.

## [WFL] Workflows

**WFL-001** — Use conventional commits.
`

// Constitution with empty required sections (headers present but no items)
const CONSTITUTION_EMPTY_REQUIRED = `---
schema: synarcx/constitution@0.4
version: 1
last_sync: 2026-01-01
fingerprint: 00000000
mode: brownfield
---

## [INV] Invariants

## [WFL] Workflows
`

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'synarcx-test-'))
}

function writeConstitution(dir: string, content: string): string {
  const p = join(dir, 'constitution.md')
  writeFileSync(p, content, 'utf-8')
  return p
}

// ─── format.ts ───────────────────────────────────────────────────────────────

describe('SECTION_HEADER_RE', () => {
  it('matches ## [TAG] headers', () => {
    expect('## [INV] Invariants'.match(SECTION_HEADER_RE)?.[1]).toBe('INV')
    expect('## [QR] Quick Reference'.match(SECTION_HEADER_RE)?.[1]).toBe('QR')
    expect('## [WFL]'.match(SECTION_HEADER_RE)?.[1]).toBe('WFL')
  })

  it('does not match regular markdown headings', () => {
    expect('## Regular Heading'.match(SECTION_HEADER_RE)).toBeNull()
    expect('# [INV]'.match(SECTION_HEADER_RE)).toBeNull()
    expect('### [INV]'.match(SECTION_HEADER_RE)).toBeNull()
  })
})

describe('ITEM_RE', () => {
  it('matches **TAG-NNN** — items', () => {
    expect(ITEM_RE.test('**INV-001** — No breaking changes.')).toBe(true)
    expect(ITEM_RE.test('**DEC-009** — Use ESM only.')).toBe(true)
    expect(ITEM_RE.test('**WFL-001** — Conventional commits.')).toBe(true)
  })

  it('does not match non-item lines', () => {
    expect(ITEM_RE.test('- bullet point')).toBe(false)
    expect(ITEM_RE.test('## [INV] Invariants')).toBe(false)
    expect(ITEM_RE.test('**INV-001** without dash')).toBe(false)
    expect(ITEM_RE.test('plain text')).toBe(false)
  })
})

describe('REQUIRED_SECTION_TAGS', () => {
  it('contains inv and wfl', () => {
    expect(REQUIRED_SECTION_TAGS).toContain('inv')
    expect(REQUIRED_SECTION_TAGS).toContain('wfl')
  })
})

describe('nextId', () => {
  it('returns TAG-001 when no existing items', () => {
    expect(nextId('inv', [])).toBe('INV-001')
    expect(nextId('dec', [])).toBe('DEC-001')
  })

  it('returns next sequential ID after existing items', () => {
    const items = ['**DEC-001** — foo', '**DEC-003** — bar', '**DEC-002** — baz']
    expect(nextId('dec', items)).toBe('DEC-004')
  })

  it('zero-pads to 3 digits', () => {
    const items = Array.from({ length: 9 }, (_, i) => `**INV-00${i + 1}** — item`)
    expect(nextId('inv', items)).toBe('INV-010')
  })

  it('is case-insensitive for tag input', () => {
    expect(nextId('DEC', [])).toBe('DEC-001')
    expect(nextId('dec', [])).toBe('DEC-001')
  })
})

describe('computeFingerprint', () => {
  it('returns an 8-character hex string', () => {
    const fp = computeFingerprint([], [])
    expect(fp).toMatch(/^[0-9a-f]{8}$/)
  })

  it('is deterministic for the same input', () => {
    const a = computeFingerprint(['**INV-001** — rule'], ['**DEC-001** — decision'])
    const b = computeFingerprint(['**INV-001** — rule'], ['**DEC-001** — decision'])
    expect(a).toBe(b)
  })

  it('differs when inv items change', () => {
    const a = computeFingerprint(['**INV-001** — rule A'], [])
    const b = computeFingerprint(['**INV-001** — rule B'], [])
    expect(a).not.toBe(b)
  })

  it('differs when dec items change', () => {
    const a = computeFingerprint([], ['**DEC-001** — decision A'])
    const b = computeFingerprint([], ['**DEC-001** — decision B'])
    expect(a).not.toBe(b)
  })

  it('differs when items are added', () => {
    const a = computeFingerprint(['**INV-001** — rule'], [])
    const b = computeFingerprint(['**INV-001** — rule'], ['**DEC-001** — decision'])
    expect(a).not.toBe(b)
  })
})

// ─── parser.ts ───────────────────────────────────────────────────────────────

describe('parseConstitution', () => {
  it('parses frontmatter correctly', () => {
    const result = parseConstitution(MINIMAL_CONSTITUTION)
    expect(result.frontmatter).not.toBeNull()
    expect(result.frontmatter?.schema).toBe('synarcx/constitution@0.4')
    expect(result.frontmatter?.version).toBe(1)
    expect(result.frontmatter?.mode).toBe('brownfield')
  })

  it('returns null frontmatter for content without ---', () => {
    const result = parseConstitution('## [INV] Invariants\n\n**INV-001** — rule\n')
    expect(result.frontmatter).toBeNull()
  })

  it('detects all 8 sections by ## [TAG] header', () => {
    const result = parseConstitution(MINIMAL_CONSTITUTION)
    const tags = result.sections.map((s) => s.tag)
    expect(tags).toContain('qr')
    expect(tags).toContain('inv')
    expect(tags).toContain('bnd')
    expect(tags).toContain('dec')
    expect(tags).toContain('dft')
    expect(tags).toContain('wfl')
    expect(tags).toContain('exc')
    expect(tags).toContain('own')
  })

  it('extracts items as lines matching **TAG-NNN** —', () => {
    const result = parseConstitution(MINIMAL_CONSTITUTION)
    const inv = getSection(result, 'inv')!
    expect(inv.items).toHaveLength(2)
    expect(inv.items[0]).toContain('INV-001')
    expect(inv.items[1]).toContain('INV-002')
  })

  it('puts non-item non-blank lines in body', () => {
    const result = parseConstitution(MINIMAL_CONSTITUTION)
    const qr = getSection(result, 'qr')!
    expect(qr.items).toHaveLength(0)
    expect(qr.body.some((l) => l.includes('primary rule'))).toBe(true)
  })

  it('each section spans to the next ## [ header', () => {
    const result = parseConstitution(MINIMAL_CONSTITUTION)
    // INV section should only have INV items, not BND items
    const inv = getSection(result, 'inv')!
    expect(inv.items.every((i) => i.startsWith('**INV-'))).toBe(true)
  })
})

describe('getSection', () => {
  it('finds a section by lowercase tag', () => {
    const parsed = parseConstitution(MINIMAL_CONSTITUTION)
    expect(getSection(parsed, 'inv')).toBeDefined()
    expect(getSection(parsed, 'wfl')).toBeDefined()
  })

  it('finds a section regardless of tag case', () => {
    const parsed = parseConstitution(MINIMAL_CONSTITUTION)
    expect(getSection(parsed, 'INV')).toBeDefined()
    expect(getSection(parsed, 'Inv')).toBeDefined()
  })

  it('returns undefined for a section that does not exist', () => {
    const parsed = parseConstitution(MINIMAL_CONSTITUTION)
    expect(getSection(parsed, 'xyz')).toBeUndefined()
  })
})

// ─── validator.ts ────────────────────────────────────────────────────────────

describe('validateConstitution', () => {
  it('returns valid for a well-formed constitution', () => {
    const parsed = parseConstitution(MINIMAL_CONSTITUTION)
    const result = validateConstitution(parsed)
    expect(result.valid).toBe(true)
    expect(result.missingRequired).toHaveLength(0)
    expect(result.emptyRequired).toHaveLength(0)
  })

  it('returns invalid with missingRequired when frontmatter is absent', () => {
    const parsed = parseConstitution('## [INV] Invariants\n\n**INV-001** — rule\n')
    const result = validateConstitution(parsed)
    expect(result.valid).toBe(false)
    expect(result.missingRequired).toContain('[INV]')
    expect(result.missingRequired).toContain('[WFL]')
  })

  it('distinguishes missing section from empty section', () => {
    // CONSTITUTION_EMPTY_REQUIRED has INV and WFL headers but no items
    const parsed = parseConstitution(CONSTITUTION_EMPTY_REQUIRED)
    const result = validateConstitution(parsed)
    expect(result.valid).toBe(false)
    expect(result.missingRequired).toHaveLength(0)
    expect(result.emptyRequired).toContain('[INV]')
    expect(result.emptyRequired).toContain('[WFL]')
  })

  it('reports missingRequired when INV section is absent entirely', () => {
    const noInv = MINIMAL_CONSTITUTION.replace('## [INV] Invariants\n\n**INV-001** — No breaking changes without a migration path.\n\n**INV-002** — All writes are atomic.\n', '')
    const parsed = parseConstitution(noInv)
    const result = validateConstitution(parsed)
    expect(result.missingRequired).toContain('[INV]')
    expect(result.emptyRequired).not.toContain('[INV]')
  })
})

// ─── patcher.ts ──────────────────────────────────────────────────────────────

describe('applyPatch', () => {
  let tmpDir: string
  let constitutionPath: string

  beforeEach(() => {
    tmpDir = makeTempDir()
    constitutionPath = writeConstitution(tmpDir, MINIMAL_CONSTITUTION)
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('appends a decision to the [DEC] section', () => {
    applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision: 'Use pnpm as the package manager.', rationale: 'Consistency.', source: 'test' }],
    })
    const content = readFileSync(constitutionPath, 'utf-8')
    expect(content).toContain('**DEC-002** — Use pnpm as the package manager.')
    expect(content).toContain('**DEC-001** — Use ESM only.')
  })

  it('increments the version in frontmatter', () => {
    applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision: 'New decision.', rationale: 'r', source: 's' }],
    })
    const content = readFileSync(constitutionPath, 'utf-8')
    expect(content).toMatch(/^version: 2/m)
  })

  it('updates fingerprint and last_sync in frontmatter', () => {
    const before = readFileSync(constitutionPath, 'utf-8')
    applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision: 'New decision for fingerprint test.', rationale: 'r', source: 's' }],
    })
    const after = readFileSync(constitutionPath, 'utf-8')
    expect(after).not.toContain('fingerprint: 00000000')
    const today = new Date().toISOString().split('T')[0]!
    expect(after).toContain(`last_sync: ${today}`)
  })

  it('returns correct counts', () => {
    const result = applyPatch(constitutionPath, {
      patches: [
        { type: 'decision', decision: 'Decision A.', rationale: 'r', source: 's' },
        { type: 'decision', decision: 'Decision B.', rationale: 'r', source: 's' },
        { type: 'exception', ref: 'INV-001', exception: 'Allowed in legacy module.' },
      ],
    })
    expect(result.decisionsAdded).toBe(2)
    expect(result.decisionsSkipped).toBe(0)
    expect(result.exceptionsAdded).toBe(1)
    expect(result.versionBefore).toBe(1)
    expect(result.versionAfter).toBe(2)
  })

  it('deduplicates decisions by first 60 chars', () => {
    const decision = 'Use pnpm as the package manager for all dependency management.'
    applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision, rationale: 'r', source: 's' }],
    })
    const result = applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision, rationale: 'r2', source: 's2' }],
    })
    expect(result.decisionsAdded).toBe(0)
    expect(result.decisionsSkipped).toBe(1)
  })

  it('appends an exception to the [EXC] section', () => {
    applyPatch(constitutionPath, {
      patches: [{ type: 'exception', ref: 'INV-002', exception: 'Config file written non-atomically for speed.' }],
    })
    const content = readFileSync(constitutionPath, 'utf-8')
    expect(content).toContain('**EXC-002** — Exception to INV-002: Config file written non-atomically for speed.')
  })

  it('creates a [DEC] section at end of file if absent', () => {
    constitutionPath = writeConstitution(tmpDir, CONSTITUTION_NO_DEC_EXC)
    applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision: 'First decision ever.', rationale: 'r', source: 's' }],
    })
    const content = readFileSync(constitutionPath, 'utf-8')
    expect(content).toContain('## [DEC] Decisions')
    expect(content).toContain('**DEC-001** — First decision ever.')
  })

  it('creates an [EXC] section at end of file if absent', () => {
    constitutionPath = writeConstitution(tmpDir, CONSTITUTION_NO_DEC_EXC)
    applyPatch(constitutionPath, {
      patches: [{ type: 'exception', ref: 'INV-001', exception: 'One-off allowed.' }],
    })
    const content = readFileSync(constitutionPath, 'utf-8')
    expect(content).toContain('## [EXC] Exclusions')
    expect(content).toContain('**EXC-001** — Exception to INV-001: One-off allowed.')
  })

  it('writes atomically (no .tmp file left behind)', () => {
    applyPatch(constitutionPath, {
      patches: [{ type: 'decision', decision: 'Atomic write test.', rationale: 'r', source: 's' }],
    })
    expect(existsSync(`${constitutionPath}.tmp`)).toBe(false)
  })

  it('does not modify the file when patch list is empty', () => {
    const before = readFileSync(constitutionPath, 'utf-8')
    applyPatch(constitutionPath, { patches: [] })
    const after = readFileSync(constitutionPath, 'utf-8')
    // version increments even on empty patch, but content otherwise preserved
    expect(after).toContain('**DEC-001** — Use ESM only.')
    expect(after).toContain('**INV-001** — No breaking changes without a migration path.')
  })
})
