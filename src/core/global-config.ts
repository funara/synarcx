import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { GlobalConfigSchema, GlobalConfigType, DEFAULT_CONFIG } from './config-schema.js';

// Constants
export const GLOBAL_CONFIG_DIR_NAME = 'synarcx';
export const GLOBAL_CONFIG_FILE_NAME = 'config.json';
export const GLOBAL_DATA_DIR_NAME = 'synarcx';

// TypeScript types
export type Profile = 'core' | 'custom';
export type Delivery = 'both' | 'skills' | 'commands';

// GlobalConfig is an alias for the Zod-inferred type — single source of truth in config-schema.ts
export type GlobalConfig = GlobalConfigType;

export { DEFAULT_CONFIG };

/**
 * Gets the global configuration directory path following XDG Base Directory Specification.
 *
 * - All platforms: $XDG_CONFIG_HOME/synarcx/ if XDG_CONFIG_HOME is set
 * - Unix/macOS fallback: ~/.config/synarcx/
 * - Windows fallback: %APPDATA%/synarcx/
 */
export function getGlobalConfigDir(): string {
  // XDG_CONFIG_HOME takes precedence on all platforms when explicitly set
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, GLOBAL_CONFIG_DIR_NAME);
  }

  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: use %APPDATA%
    const appData = process.env.APPDATA;
    if (appData) {
      return path.join(appData, GLOBAL_CONFIG_DIR_NAME);
    }
    // Fallback for Windows if APPDATA is not set
    return path.join(os.homedir(), 'AppData', 'Roaming', GLOBAL_CONFIG_DIR_NAME);
  }

  // Unix/macOS fallback: ~/.config
  return path.join(os.homedir(), '.config', GLOBAL_CONFIG_DIR_NAME);
}

/**
 * Gets the global data directory path following XDG Base Directory Specification.
 * Used for user data like schema overrides.
 *
 * - All platforms: $XDG_DATA_HOME/synarcx/ if XDG_DATA_HOME is set
 * - Unix/macOS fallback: ~/.local/share/synarcx/
 * - Windows fallback: %LOCALAPPDATA%/synarcx/
 */
export interface GlobalDataDirOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homedir?: string;
}

function joinGlobalDataPath(platform: NodeJS.Platform, ...segments: string[]): string {
  return platform === 'win32'
    ? path.win32.join(...segments)
    : path.posix.join(...segments);
}

export function getGlobalDataDir(options: GlobalDataDirOptions = {}): string {
  const env = options.env ?? process.env;
  const platform = options.platform ?? os.platform();

  // XDG_DATA_HOME takes precedence on all platforms when explicitly set
  const xdgDataHome = env.XDG_DATA_HOME;
  if (xdgDataHome) {
    return joinGlobalDataPath(platform, xdgDataHome, GLOBAL_DATA_DIR_NAME);
  }

  const homedir = options.homedir ?? os.homedir();

  if (platform === 'win32') {
    // Windows: use %LOCALAPPDATA%
    const localAppData = env.LOCALAPPDATA;
    if (localAppData) {
      return joinGlobalDataPath(platform, localAppData, GLOBAL_DATA_DIR_NAME);
    }
    // Fallback for Windows if LOCALAPPDATA is not set
    return joinGlobalDataPath(platform, homedir, 'AppData', 'Local', GLOBAL_DATA_DIR_NAME);
  }

  // Unix/macOS fallback: ~/.local/share
  return joinGlobalDataPath(platform, homedir, '.local', 'share', GLOBAL_DATA_DIR_NAME);
}

/**
 * Gets the path to the global config file.
 */
export function getGlobalConfigPath(): string {
  return path.join(getGlobalConfigDir(), GLOBAL_CONFIG_FILE_NAME);
}

/**
 * Loads the global configuration from disk.
 * Returns default configuration if file doesn't exist or is invalid.
 * Uses GlobalConfigSchema (with passthrough) for validation and defaults.
 */
export function getGlobalConfig(): GlobalConfig {
  const configPath = getGlobalConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    const result = GlobalConfigSchema.safeParse(parsed);
    return result.success ? result.data : { ...DEFAULT_CONFIG };
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Warning: Invalid JSON in ${configPath}, using defaults`);
    }
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the global configuration to disk.
 * Creates the config directory if it doesn't exist.
 */
export function saveGlobalConfig(config: GlobalConfig): void {
  const configDir = getGlobalConfigDir();
  const configPath = getGlobalConfigPath();

  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
