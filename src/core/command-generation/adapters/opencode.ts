/**
 * OpenCode Command Adapter
 *
 * Formats commands for OpenCode following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * OpenCode adapter for command generation.
 * File path: .opencode/commands/syn/<id>.md
 * Frontmatter: name, description
 */
export const opencodeAdapter: ToolCommandAdapter = {
  toolId: 'opencode',

  getFilePath(commandId: string): string {
    return path.join('.opencode', 'commands', 'syn', `${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: "syn:${content.id}"
description: ${content.description}
---

${content.body}
`;
  },
};
