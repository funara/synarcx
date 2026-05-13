/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */

import type { Profile, GlobalConfig } from './global-config.js';
import { saveGlobalConfig } from './global-config.js';
import { ALL_WORKFLOWS, CORE_WORKFLOWS } from './shared/workflow-registry.js';

/**
 * Resolves which workflows should be active for a given profile configuration.
 *
 * - 'core' profile always returns CORE_WORKFLOWS
 * - 'custom' profile returns the provided customWorkflows, or empty array if not provided
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: readonly string[]
): readonly string[] {
  if (profile === 'custom') {
    return customWorkflows ?? [];
  }
  return CORE_WORKFLOWS;
}

/**
 * Ensures a 'custom' profile always contains all current ALL_WORKFLOWS entries.
 * Called by both `synarcx init` and `synarcx update` so new commands (e.g. syn:review)
 * are never silently dropped for users on a stale custom profile, regardless of which
 * command they run after upgrading.
 * No-op for 'core' profile (it derives its list from ALL_WORKFLOWS directly).
 */
export function syncNewCoreWorkflowsToCustomProfile(config: GlobalConfig): void {
  if (config.profile !== 'custom') return
  const current = config.workflows ?? []
  const currentSet = new Set(current)
  const missing = ALL_WORKFLOWS.filter(w => !currentSet.has(w))
  if (missing.length === 0) return

  config.workflows = [...current, ...missing]
  saveGlobalConfig(config)
}
