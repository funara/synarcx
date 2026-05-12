/**
 * Core template types for skills and slash commands.
 */

export interface SkillTemplate {
  name: string;
  description: string;
  instructions: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

export interface CommandTemplate {
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
}

export function commandFromSkill(
  skill: SkillTemplate,
  overrides: {
    content: string
    name?: string
    description?: string
    tags?: string[]
    category?: string
  }
): CommandTemplate {
  return {
    name: overrides.name ?? skill.name,
    description: overrides.description ?? skill.description,
    category: overrides.category ?? 'Workflow',
    tags: overrides.tags ?? ['synarcx', skill.name.replace('syn-', '')],
    content: overrides.content,
  }
}
