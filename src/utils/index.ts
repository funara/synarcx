// Shared utilities (moved to src/core/)
export { validateChangeName, createChange } from '../core/change-utils.js';
export type { ValidationResult, CreateChangeOptions } from '../core/change-utils.js';

// Change metadata utilities (moved to src/core/)
export {
  readChangeMetadata,
  writeChangeMetadata,
  resolveSchemaForChange,
  validateSchemaName,
  ChangeMetadataError,
} from '../core/change-metadata.js';

// File system utilities
export { FileSystemUtils, removeMarkerBlock } from './file-system.js';

// Command reference utilities
export { transformToHyphenCommands } from './command-references.js';