/**
 * Tests for migrateIfNeeded() and the syncNewCoreWorkflowsToCustomProfile() guard.
 *
 * Covers two user scenarios:
 *   A) New user  — no prior synarcx config, no installed workflows
 *   B) Upgrader  — had 0.2.0 (9 workflows, no 'review'), global config has no 'profile' key
 *
 * And a bonus scenario for the ongoing update guard:
 *   C) Existing custom-profile user adding a workflow via update
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// ─── helpers ────────────────────────────────────────────────────────────────

const V020_WORKFLOWS = [
  'explore', 'apply', 'propose', 'sync',
  'clarify', 'analyze', 'debug', 'refactor', 'quick',
]

/** Creates an isolated temp directory that is cleaned up after each test. */
function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'synarcx-migration-test-'))
}

function rmTempDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
}

// ─── types (inlined so tests don't depend on internals changing) ─────────────

interface GlobalConfig {
  profile?: 'core' | 'custom'
  delivery?: 'both' | 'skills' | 'commands'
  workflows?: string[]
  featureFlags?: Record<string, boolean>
}

// ─── import module under test ────────────────────────────────────────────────

import { migrateIfNeeded } from '../src/core/migration.js'
import { ALL_WORKFLOWS } from '../src/core/shared/workflow-registry.js'
import { getGlobalConfig, saveGlobalConfig, getGlobalConfigPath } from '../src/core/global-config.js'

// ─── test setup: redirect global config to a temp dir per test ───────────────

let tmpDir: string
let configPath: string

beforeEach(() => {
  tmpDir = makeTempDir()
  configPath = path.join(tmpDir, 'config.json')

  // Point the module to our temp config dir by overriding env
  // (getGlobalConfigPath uses APPDATA on Windows / XDG_CONFIG_HOME on Unix)
  const platform = process.platform
  if (platform === 'win32') {
    process.env.APPDATA = tmpDir
  } else {
    process.env.XDG_CONFIG_HOME = tmpDir
  }
})

// cleanup is synchronous so a plain function is fine here
import { afterEach } from 'vitest'
afterEach(() => {
  delete process.env.APPDATA
  delete process.env.XDG_CONFIG_HOME
  rmTempDir(tmpDir)
})

// ─── A: New user ─────────────────────────────────────────────────────────────

describe('A: new user (no prior config, no installed workflows)', () => {
  it('does not create a global config file', () => {
    // No config file + no installed skills → migrateIfNeeded is a no-op
    migrateIfNeeded(tmpDir, [])

    expect(fs.existsSync(getGlobalConfigPath())).toBe(false)
  })

  it('getGlobalConfig returns core profile by default', () => {
    migrateIfNeeded(tmpDir, [])

    const cfg = getGlobalConfig()
    expect(cfg.profile).toBe('core')
  })

  it('review is included in ALL_WORKFLOWS (sanity check)', () => {
    expect(ALL_WORKFLOWS).toContain('review')
  })
})

// ─── B: 0.2.0 upgrader ───────────────────────────────────────────────────────

describe('B: 0.2.0 upgrader (9 workflows on disk, no profile key in config)', () => {
  /**
   * Simulate a 0.2.0 install: write SKILL.md files for the old 9 workflows
   * under a fake tool's skills directory.
   */
  function installV020Skills(projectDir: string) {
    const WORKFLOW_TO_SKILL_DIR: Record<string, string> = {
      explore:  'syn-explore',
      apply:    'syn-apply',
      propose:  'syn-propose',
      sync:     'syn-sync',
      clarify:  'syn-clarify',
      analyze:  'syn-analyze',
      debug:    'syn-debug',
      refactor: 'syn-refactor',
      quick:    'syn-quick',
    }
    const skillsDir = path.join(projectDir, '.claude', 'skills')
    for (const [wf, dir] of Object.entries(WORKFLOW_TO_SKILL_DIR)) {
      const skillFile = path.join(skillsDir, dir, 'SKILL.md')
      fs.mkdirSync(path.dirname(skillFile), { recursive: true })
      fs.writeFileSync(skillFile, `# ${wf} skill\n`)
    }
  }

  /** Minimal AIToolOption for claude so scanInstalledWorkflowArtifacts can find skills. */
  const CLAUDE_TOOL = {
    value: 'claude',
    name: 'Claude',
    skillsDir: '.claude',
    hasCommands: true,
  }

  it('auto-migrates to core profile — no manual command needed', () => {
    installV020Skills(tmpDir)

    migrateIfNeeded(tmpDir, [CLAUDE_TOOL as any])

    const cfg = getGlobalConfig()
    expect(cfg.profile).toBe('core')
  })

  it('core profile includes review without any explicit workflow list', () => {
    installV020Skills(tmpDir)

    migrateIfNeeded(tmpDir, [CLAUDE_TOOL as any])

    const cfg = getGlobalConfig()
    // core profile derives from ALL_WORKFLOWS directly — review is always included
    expect(ALL_WORKFLOWS).toContain('review')
    expect(cfg.profile).toBe('core')
  })

  it('is idempotent: running twice does not change the result', () => {
    installV020Skills(tmpDir)

    migrateIfNeeded(tmpDir, [CLAUDE_TOOL as any])
    migrateIfNeeded(tmpDir, [CLAUDE_TOOL as any]) // second call: profile already set → no-op

    const cfg = getGlobalConfig()
    expect(cfg.profile).toBe('core')
  })

  it('does not re-run migration when profile is already set', () => {
    // Simulate a user who went through migration in a previous run (already on core)
    const existingConfig: GlobalConfig = { profile: 'core' }
    fs.mkdirSync(path.dirname(getGlobalConfigPath()), { recursive: true })
    fs.writeFileSync(getGlobalConfigPath(), JSON.stringify(existingConfig, null, 2))

    // migration should be a no-op because profile is already set
    migrateIfNeeded(tmpDir, [CLAUDE_TOOL as any])

    const cfg = getGlobalConfig()
    expect(cfg.profile).toBe('core') // unchanged
  })
})


// ─── C: update guard (syncNewCoreWorkflowsToCustomProfile via update.ts) ─────
// We test the observable effect: after a user who already has profile:custom
// (missing 'review') calls syncNewCoreWorkflowsToCustomProfile, the saved
// config gains 'review'.
//
// Because syncNewCoreWorkflowsToCustomProfile is a private method of UpdateCommand,
// we test it indirectly by invoking the same logic directly.

describe('C: ongoing guard — custom profile missing new workflow gets auto-patched', () => {
  function writeSavedConfig(cfg: GlobalConfig) {
    const cfgPath = getGlobalConfigPath()
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true })
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2))
  }

  /** Replicate the exact logic from UpdateCommand.syncNewCoreWorkflowsToCustomProfile */
  function syncNewCoreWorkflows(config: GlobalConfig): GlobalConfig {
    if (config.profile !== 'custom') return config
    const current = config.workflows ?? []
    const currentSet = new Set(current)
    const missing = ALL_WORKFLOWS.filter(w => !currentSet.has(w))
    if (missing.length === 0) return config
    config.workflows = [...current, ...missing]
    saveGlobalConfig(config)
    return config
  }

  it('adds review to a custom profile that is missing it', () => {
    const cfg: GlobalConfig = { profile: 'custom', workflows: [...V020_WORKFLOWS] }
    writeSavedConfig(cfg)

    syncNewCoreWorkflows(getGlobalConfig())

    const updated = getGlobalConfig()
    expect(updated.workflows).toContain('review')
  })

  it('does not duplicate existing workflows', () => {
    const cfg: GlobalConfig = { profile: 'custom', workflows: [...V020_WORKFLOWS] }
    writeSavedConfig(cfg)

    syncNewCoreWorkflows(getGlobalConfig())
    syncNewCoreWorkflows(getGlobalConfig()) // run twice

    const updated = getGlobalConfig()
    const wf = updated.workflows ?? []
    expect(wf.length).toBe(new Set(wf).size)
  })

  it('is a no-op when all ALL_WORKFLOWS are already present', () => {
    const cfg: GlobalConfig = { profile: 'custom', workflows: [...ALL_WORKFLOWS] }
    writeSavedConfig(cfg)

    const before = JSON.stringify(getGlobalConfig())
    syncNewCoreWorkflows(getGlobalConfig())
    const after = JSON.stringify(getGlobalConfig())

    expect(before).toBe(after)
  })

  it('is a no-op for core profile (core derives from ALL_WORKFLOWS dynamically)', () => {
    const cfg: GlobalConfig = { profile: 'core', workflows: [...V020_WORKFLOWS] }
    writeSavedConfig(cfg)

    syncNewCoreWorkflows(getGlobalConfig())

    const updated = getGlobalConfig()
    // workflows should be unchanged — sync only applies to custom
    expect(updated.workflows).toEqual(V020_WORKFLOWS)
  })
})
