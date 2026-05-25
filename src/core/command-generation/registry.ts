/**
 * Command Adapter Registry
 *
 * Centralized registry for tool command adapters.
 * Adapters are created from the ADAPTERS config table via the factory function.
 */

import type { ToolCommandAdapter } from './types.js';
import { ADAPTERS } from './adapters/config.js';
import { createAdapter } from './adapters/adapter-factory.js';

/**
 * Registry for looking up tool command adapters.
 */
export class CommandAdapterRegistry {
  private static adapters: Map<string, ToolCommandAdapter> = new Map();

  // Static initializer - register all adapters from config table
  static {
    for (const adapter of ADAPTERS.map(createAdapter)) {
      CommandAdapterRegistry.register(adapter);
    }
  }

  /**
   * Register a tool command adapter.
   * @param adapter - The adapter to register
   */
  static register(adapter: ToolCommandAdapter): void {
    CommandAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  /**
   * Get an adapter by tool ID.
   * @param toolId - The tool identifier (e.g., 'claude', 'cursor')
   * @returns The adapter or undefined if not registered
   */
  static get(toolId: string): ToolCommandAdapter | undefined {
    return CommandAdapterRegistry.adapters.get(toolId);
  }

  /**
   * Get all registered adapters.
   * @returns Array of all registered adapters
   */
  static getAll(): ToolCommandAdapter[] {
    return Array.from(CommandAdapterRegistry.adapters.values());
  }

  /**
   * Check if an adapter is registered for a tool.
   * @param toolId - The tool identifier
   * @returns True if an adapter exists
   */
  static has(toolId: string): boolean {
    return CommandAdapterRegistry.adapters.has(toolId);
  }
}
