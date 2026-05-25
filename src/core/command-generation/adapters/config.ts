/**
 * Adapter Configuration
 *
 * Centralized config table and body-transform helpers for all 26 AI tool adapters.
 */

import type { CommandContent } from '../types.js';
import { escapeYamlValue, formatTagsArray } from '../yaml-utils.js';

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/syn:` patterns to `/syn-` for tools that use hyphen syntax.
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/syn:/g, '/syn-');
}

const PI_INPUT_HEADING = /^\*\*Input\*\*:[^\n]*$/m;

/**
 * Injects `$@` argument placeholder into Pi prompt bodies.
 * Adds a "Provided arguments" line after the Input heading if not already present.
 */
export function injectPiArgs(body: string): string {
  if (body.includes('$@') || body.includes('$ARGUMENTS')) {
    return body;
  }
  return body.replace(
    PI_INPUT_HEADING,
    (heading) => `${heading}\n**Provided arguments**: $@`
  );
}

export interface AdapterConfig {
  toolId: string;
  pathTemplate: string;
  format: 'yaml-frontmatter' | 'toml' | 'markdown-header' | 'body-only';
  fields?: Array<{ key: string; value: (content: CommandContent) => string }>;
  bodyTransforms?: Array<'hyphen-commands' | 'pi-args-inject'>;
  globalDirEnv?: string;
}

export const ADAPTERS: AdapterConfig[] = [
  // YAML frontmatter family
  {
    toolId: 'amazon-q',
    pathTemplate: '.amazonq/prompts/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [{ key: 'description', value: (c) => c.description }],
  },
  {
    toolId: 'antigravity',
    pathTemplate: '.agent/workflows/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [{ key: 'description', value: (c) => c.description }],
  },
  {
    toolId: 'auggie',
    pathTemplate: '.augment/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'description', value: (c) => c.description },
      { key: 'argument-hint', value: () => 'command arguments' },
    ],
  },
  {
    toolId: 'bob',
    pathTemplate: '.bob/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'description', value: (c) => escapeYamlValue(c.description) },
      { key: 'argument-hint', value: () => 'command arguments' },
    ],
    bodyTransforms: ['hyphen-commands'],
  },
  {
    toolId: 'claude',
    pathTemplate: '.claude/commands/syn/{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => escapeYamlValue(c.name) },
      { key: 'description', value: (c) => escapeYamlValue(c.description) },
      { key: 'category', value: (c) => escapeYamlValue(c.category) },
      { key: 'tags', value: (c) => formatTagsArray(c.tags) },
    ],
  },
  {
    toolId: 'codebuddy',
    pathTemplate: '.codebuddy/commands/syn/{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => c.name },
      { key: 'description', value: (c) => `"${c.description}"` },
      { key: 'argument-hint', value: () => '[command arguments]' },
    ],
  },
  {
    toolId: 'codex',
    pathTemplate: '{global}/prompts/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'description', value: (c) => c.description },
      { key: 'argument-hint', value: () => 'command arguments' },
    ],
    globalDirEnv: 'CODEX_HOME',
  },
  {
    toolId: 'continue',
    pathTemplate: '.continue/prompts/syn-{id}.prompt',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => `syn-${c.id}` },
      { key: 'description', value: (c) => c.description },
      { key: 'invokable', value: () => 'true' },
    ],
  },
  {
    toolId: 'costrict',
    pathTemplate: '.cospec/synarcx/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'description', value: (c) => `"${c.description}"` },
      { key: 'argument-hint', value: () => 'command arguments' },
    ],
  },
  {
    toolId: 'crush',
    pathTemplate: '.crush/commands/syn/{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => c.name },
      { key: 'description', value: (c) => c.description },
      { key: 'category', value: (c) => c.category },
      { key: 'tags', value: (c) => `[${c.tags.join(', ')}]` },
    ],
  },
  {
    toolId: 'cursor',
    pathTemplate: '.cursor/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => `/syn-${c.id}` },
      { key: 'id', value: (c) => `syn-${c.id}` },
      { key: 'category', value: (c) => escapeYamlValue(c.category) },
      { key: 'description', value: (c) => escapeYamlValue(c.description) },
    ],
  },
  {
    toolId: 'factory',
    pathTemplate: '.factory/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'description', value: (c) => c.description },
      { key: 'argument-hint', value: () => 'command arguments' },
    ],
  },
  {
    toolId: 'github-copilot',
    pathTemplate: '.github/prompts/syn-{id}.prompt.md',
    format: 'yaml-frontmatter',
    fields: [{ key: 'description', value: (c) => c.description }],
  },
  {
    toolId: 'iflow',
    pathTemplate: '.iflow/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => `/syn-${c.id}` },
      { key: 'id', value: (c) => `syn-${c.id}` },
      { key: 'category', value: (c) => c.category },
      { key: 'description', value: (c) => c.description },
    ],
  },
  {
    toolId: 'junie',
    pathTemplate: '.junie/commands/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [{ key: 'description', value: (c) => c.description }],
  },
  {
    toolId: 'kiro',
    pathTemplate: '.kiro/prompts/syn-{id}.prompt.md',
    format: 'yaml-frontmatter',
    fields: [{ key: 'description', value: (c) => c.description }],
  },
  {
    toolId: 'lingma',
    pathTemplate: '.lingma/commands/syn/{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => c.name },
      { key: 'description', value: (c) => c.description },
      { key: 'category', value: (c) => c.category },
      { key: 'tags', value: (c) => `[${c.tags.join(', ')}]` },
    ],
  },
  {
    toolId: 'opencode',
    pathTemplate: '.opencode/commands/syn/{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => `"syn:${c.id}"` },
      { key: 'description', value: (c) => c.description },
    ],
  },
  {
    toolId: 'pi',
    pathTemplate: '.pi/prompts/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [{ key: 'description', value: (c) => escapeYamlValue(c.description) }],
    bodyTransforms: ['hyphen-commands', 'pi-args-inject'],
  },
  {
    toolId: 'qoder',
    pathTemplate: '.qoder/commands/syn/{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => c.name },
      { key: 'description', value: (c) => c.description },
      { key: 'category', value: (c) => c.category },
      { key: 'tags', value: (c) => `[${c.tags.join(', ')}]` },
    ],
  },
  {
    toolId: 'windsurf',
    pathTemplate: '.windsurf/workflows/syn-{id}.md',
    format: 'yaml-frontmatter',
    fields: [
      { key: 'name', value: (c) => escapeYamlValue(c.name) },
      { key: 'description', value: (c) => escapeYamlValue(c.description) },
      { key: 'category', value: (c) => escapeYamlValue(c.category) },
      { key: 'tags', value: (c) => formatTagsArray(c.tags) },
    ],
  },
  // TOML family
  {
    toolId: 'gemini',
    pathTemplate: '.gemini/commands/syn/{id}.toml',
    format: 'toml',
  },
  {
    toolId: 'qwen',
    pathTemplate: '.qwen/commands/syn-{id}.toml',
    format: 'toml',
  },
  // Markdown header family
  {
    toolId: 'cline',
    pathTemplate: '.clinerules/workflows/syn-{id}.md',
    format: 'markdown-header',
  },
  {
    toolId: 'roocode',
    pathTemplate: '.roo/commands/syn-{id}.md',
    format: 'markdown-header',
  },
  // Body only family
  {
    toolId: 'kilocode',
    pathTemplate: '.kilocode/workflows/syn-{id}.md',
    format: 'body-only',
  },
];
