/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/syn:` patterns to `/syn-` for tools that use hyphen syntax.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to hyphen format
 *
 * @example
 * transformToHyphenCommands('/syn:sync') // returns '/syn-sync'
 * transformToHyphenCommands('Use /syn:apply to implement') // returns 'Use /syn-apply to implement'
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/syn:/g, '/syn-');
}
