/**
 * Agent Skill Templates
 *
 * Compatibility facade that re-exports split workflow template modules.
 */

export type { SkillTemplate, CommandTemplate } from './types.js';

export { getSynExploreSkillTemplate, getSynExploreCommandTemplate } from './workflows/explore.js';
export { getSynApplySkillTemplate, getSynApplyCommandTemplate } from './workflows/apply-change.js';
export { getSynArchiveSkillTemplate, getSynArchiveCommandTemplate } from './workflows/archive-change.js';
export { getSynProposeSkillTemplate, getSynProposeCommandTemplate } from './workflows/propose.js';
export { getSynSyncSkillTemplate, getSynSyncCommandTemplate } from './workflows/sync.js';
export { getSynClarifySkillTemplate, getSynClarifyCommandTemplate } from './workflows/clarify.js';
export { getSynAnalyzeSkillTemplate, getSynAnalyzeCommandTemplate } from './workflows/analyze.js';
export { getSynDebugSkillTemplate, getSynDebugCommandTemplate } from './workflows/debug.js';
