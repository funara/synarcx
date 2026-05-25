/**
 * Adapter Factory
 *
 * Creates ToolCommandAdapter instances from AdapterConfig entries.
 * Supports 4 format families: yaml-frontmatter, toml, markdown-header, body-only.
 */

import os from 'os';
import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { type AdapterConfig, transformToHyphenCommands, injectPiArgs } from './config.js';

/**
 * Resolve the global home directory for tools that use absolute paths.
 * Respects the env var override if set, defaulting to ~/.<tool>.
 */
function resolveGlobalHome(envVar?: string): string {
  const envHome = envVar ? process.env[envVar]?.trim() : undefined;
  return path.resolve(envHome ? envHome : path.join(os.homedir(), '.codex'));
}

/**
 * Build the file path from a path template.
 * Replaces `{id}` with the commandId and `{global}` with the resolved global directory.
 */
function buildFilePath(template: string, commandId: string, globalDirEnv?: string): string {
  const resolved = template.replace('{id}', commandId);
  if (resolved.includes('{global}')) {
    const globalDir = resolveGlobalHome(globalDirEnv);
    return resolved.replace('{global}', globalDir);
  }
  return resolved;
}

/**
 * Apply configured body transforms in order.
 */
function applyBodyTransforms(body: string, transforms?: Array<'hyphen-commands' | 'pi-args-inject'>): string {
  let result = body;
  if (!transforms) return result;
  for (const t of transforms) {
    if (t === 'hyphen-commands') {
      result = transformToHyphenCommands(result);
    } else if (t === 'pi-args-inject') {
      result = injectPiArgs(result);
    }
  }
  return result;
}

/**
 * YAML frontmatter format generator.
 */
function generateYamlFrontmatter(content: CommandContent, config: AdapterConfig): string {
  const lines: string[] = ['---'];
  if (config.fields) {
    for (const field of config.fields) {
      lines.push(`${field.key}: ${field.value(content)}`);
    }
  }
  lines.push('---', '');
  const body = applyBodyTransforms(content.body, config.bodyTransforms);
  lines.push(body);
  return lines.join('\n') + '\n';
}

/**
 * TOML format generator.
 */
function generateToml(content: CommandContent, config: AdapterConfig): string {
  const body = applyBodyTransforms(content.body, config.bodyTransforms);
  return `description = "${content.description}"\n\nprompt = """\n${body}\n"""\n`;
}

/**
 * Markdown header format generator.
 */
function generateMarkdownHeader(content: CommandContent, config: AdapterConfig): string {
  const body = applyBodyTransforms(content.body, config.bodyTransforms);
  return `# ${content.name}\n\n${content.description}\n\n${body}\n`;
}

/**
 * Body-only format generator.
 */
function generateBodyOnly(content: CommandContent, config: AdapterConfig): string {
  const body = applyBodyTransforms(content.body, config.bodyTransforms);
  return `${body}\n`;
}

/**
 * Create a ToolCommandAdapter from an AdapterConfig.
 */
export function createAdapter(config: AdapterConfig): ToolCommandAdapter {
  const formatGenerators: Record<string, (content: CommandContent, config: AdapterConfig) => string> = {
    'yaml-frontmatter': generateYamlFrontmatter,
    'toml': generateToml,
    'markdown-header': generateMarkdownHeader,
    'body-only': generateBodyOnly,
  };

  const generator = formatGenerators[config.format];
  if (!generator) {
    throw new Error(`Unknown adapter format: ${config.format}`);
  }

  return {
    toolId: config.toolId,
    getFilePath(commandId: string): string {
      return buildFilePath(config.pathTemplate, commandId, config.globalDirEnv);
    },
    formatFile(content: CommandContent): string {
      return generator(content, config);
    },
  };
}
