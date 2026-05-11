/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getSynExploreSkillTemplate,
  getSynApplySkillTemplate,
  getSynArchiveSkillTemplate,
  getSynProposeSkillTemplate,
  getSynSyncSkillTemplate,
  getSynClarifySkillTemplate,
  getSynAnalyzeSkillTemplate,
  getSynDebugSkillTemplate,
  getSynRefactorSkillTemplate,
  getSynQuickSkillTemplate,
  getSynExploreCommandTemplate,
  getSynApplyCommandTemplate,
  getSynArchiveCommandTemplate,
  getSynProposeCommandTemplate,
  getSynSyncCommandTemplate,
  getSynClarifyCommandTemplate,
  getSynAnalyzeCommandTemplate,
  getSynDebugCommandTemplate,
  getSynRefactorCommandTemplate,
  getSynQuickCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

/**
 * Command template with ID mapping.
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getSynExploreCommandTemplate>;
  id: string;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const all: SkillTemplateEntry[] = [
    { template: getSynExploreSkillTemplate(), dirName: 'syn-explore', workflowId: 'explore' },
    { template: getSynApplySkillTemplate(), dirName: 'syn-apply', workflowId: 'apply' },
    { template: getSynArchiveSkillTemplate(), dirName: 'syn-archive', workflowId: 'archive' },
    { template: getSynProposeSkillTemplate(), dirName: 'syn-propose', workflowId: 'propose' },
    { template: getSynSyncSkillTemplate(), dirName: 'syn-sync', workflowId: 'sync' },
    { template: getSynClarifySkillTemplate(), dirName: 'syn-clarify', workflowId: 'clarify' },
    { template: getSynAnalyzeSkillTemplate(), dirName: 'syn-analyze', workflowId: 'analyze' },
    { template: getSynDebugSkillTemplate(), dirName: 'syn-debug', workflowId: 'debug' },
    { template: getSynRefactorSkillTemplate(), dirName: 'syn-refactor', workflowId: 'refactor' },
    { template: getSynQuickSkillTemplate(), dirName: 'syn-quick', workflowId: 'quick' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId));
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getSynExploreCommandTemplate(), id: 'explore' },
    { template: getSynApplyCommandTemplate(), id: 'apply' },
    { template: getSynArchiveCommandTemplate(), id: 'archive' },
    { template: getSynProposeCommandTemplate(), id: 'propose' },
    { template: getSynSyncCommandTemplate(), id: 'sync' },
    { template: getSynClarifyCommandTemplate(), id: 'clarify' },
    { template: getSynAnalyzeCommandTemplate(), id: 'analyze' },
    { template: getSynDebugCommandTemplate(), id: 'debug' },
    { template: getSynRefactorCommandTemplate(), id: 'refactor' },
    { template: getSynQuickCommandTemplate(), id: 'quick' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.id));
}

/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The synarcx version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${template.name}
description: ${template.description}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires synarcx CLI.'}
metadata:
  author: ${template.metadata?.author || 'synarcx'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${instructions}
`;
}
