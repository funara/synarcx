export const SYNSPEC_DIR_NAME = 'synspec';

export const SYNSPEC_MARKERS = {
  start: '<!-- SYNSPEC:START -->',
  end: '<!-- SYNSPEC:END -->'
};

export interface SynspecConfig {
  aiTools: string[];
}

export interface AIToolOption {
  name: string;
  value: string;
  available: boolean;
  successLabel?: string;
  skillsDir?: string; // e.g., '.claude' - /skills suffix per Agent Skills spec
  detectionPaths?: string[]; // Override skillsDir for auto-detection; any path existing triggers detection
  hasCommands?: boolean; // Whether the tool supports slash commands
}

export const AI_TOOLS: AIToolOption[] = [
  { name: 'Amazon Q Developer', value: 'amazon-q', available: true, successLabel: 'Amazon Q Developer', skillsDir: '.amazonq', hasCommands: true },
  { name: 'Antigravity', value: 'antigravity', available: true, successLabel: 'Antigravity', skillsDir: '.agent', hasCommands: true },
  { name: 'Auggie (Augment CLI)', value: 'auggie', available: true, successLabel: 'Auggie', skillsDir: '.augment', hasCommands: true },
  { name: 'Bob Shell', value: 'bob', available: true, successLabel: 'Bob Shell', skillsDir: '.bob', hasCommands: true },
  { name: 'Claude Code', value: 'claude', available: true, successLabel: 'Claude Code', skillsDir: '.claude', hasCommands: true },
  { name: 'Cline', value: 'cline', available: true, successLabel: 'Cline', skillsDir: '.cline', hasCommands: true },
  { name: 'Codex', value: 'codex', available: true, successLabel: 'Codex', skillsDir: '.codex', hasCommands: true },
  { name: 'CodeBuddy Code (CLI)', value: 'codebuddy', available: true, successLabel: 'CodeBuddy Code', skillsDir: '.codebuddy', hasCommands: true },
  { name: 'Continue', value: 'continue', available: true, successLabel: 'Continue (VS Code / JetBrains / Cli)', skillsDir: '.continue', hasCommands: true },
  { name: 'CoStrict', value: 'costrict', available: true, successLabel: 'CoStrict', skillsDir: '.cospec', hasCommands: true },
  { name: 'Crush', value: 'crush', available: true, successLabel: 'Crush', skillsDir: '.crush', hasCommands: true },
  { name: 'Cursor', value: 'cursor', available: true, successLabel: 'Cursor', skillsDir: '.cursor', hasCommands: true },
  { name: 'Factory Droid', value: 'factory', available: true, successLabel: 'Factory Droid', skillsDir: '.factory', hasCommands: true },
  { name: 'Gemini CLI', value: 'gemini', available: true, successLabel: 'Gemini CLI', skillsDir: '.gemini', hasCommands: true },
  { name: 'GitHub Copilot', value: 'github-copilot', available: true, successLabel: 'GitHub Copilot', skillsDir: '.github', detectionPaths: ['.github/copilot-instructions.md', '.github/instructions', '.github/workflows/copilot-setup-steps.yml', '.github/prompts', '.github/agents', '.github/skills', '.github/.mcp.json'], hasCommands: true },
  { name: 'iFlow', value: 'iflow', available: true, successLabel: 'iFlow', skillsDir: '.iflow', hasCommands: true },
  { name: 'Junie', value: 'junie', available: true, successLabel: 'Junie', skillsDir: '.junie', hasCommands: true },
  { name: 'Kilo Code', value: 'kilocode', available: true, successLabel: 'Kilo Code', skillsDir: '.kilocode', hasCommands: true },
  { name: 'Kiro', value: 'kiro', available: true, successLabel: 'Kiro', skillsDir: '.kiro', hasCommands: true },
  { name: 'OpenCode', value: 'opencode', available: true, successLabel: 'OpenCode', skillsDir: '.opencode', hasCommands: true },
  { name: 'Pi', value: 'pi', available: true, successLabel: 'Pi', skillsDir: '.pi', hasCommands: true },
  { name: 'Qoder', value: 'qoder', available: true, successLabel: 'Qoder', skillsDir: '.qoder', hasCommands: true },
  { name: 'Lingma', value: 'lingma', available: true, successLabel: 'Lingma', skillsDir: '.lingma', hasCommands: true },
  { name: 'Qwen Code', value: 'qwen', available: true, successLabel: 'Qwen Code', skillsDir: '.qwen', hasCommands: true },
  { name: 'RooCode', value: 'roocode', available: true, successLabel: 'RooCode', skillsDir: '.roo', hasCommands: true },
  { name: 'Windsurf', value: 'windsurf', available: true, successLabel: 'Windsurf', skillsDir: '.windsurf', hasCommands: true },
  { name: 'AGENTS.md (works with Amp, VS Code, …)', value: 'agents', available: false, successLabel: 'your AGENTS.md-compatible assistant' }
];
