export const DEFAULT_SCHEMA = 'synarcx'

export const WORKFLOWS = [
  { id: 'explore', skillDir: 'syn-explore' },
  { id: 'apply', skillDir: 'syn-apply' },
  { id: 'propose', skillDir: 'syn-propose' },
  { id: 'sync', skillDir: 'syn-sync' },
  { id: 'clarify', skillDir: 'syn-clarify' },
  { id: 'analyze', skillDir: 'syn-analyze' },
  { id: 'debug', skillDir: 'syn-debug' },
  { id: 'refactor', skillDir: 'syn-refactor' },
  { id: 'quick', skillDir: 'syn-quick' },
  { id: 'review', skillDir: 'syn-review' },
] as const

export const ALL_WORKFLOWS: readonly string[] = WORKFLOWS.map(w => w.id)
export const CORE_WORKFLOWS: readonly string[] = [...ALL_WORKFLOWS]
export const SKILL_NAMES: readonly string[] = WORKFLOWS.map(w => w.skillDir)
export const COMMAND_IDS: readonly string[] = [...ALL_WORKFLOWS]
export const WORKFLOW_TO_SKILL_DIR: Record<string, string> = Object.fromEntries(
  WORKFLOWS.map(w => [w.id, w.skillDir])
)

export type WorkflowId = string
export type CoreWorkflowId = string
