/**
 * Schema source location type
 */
export type SchemaSource = 'project' | 'user' | 'package';

/**
 * Result of checking a schema location
 */
export interface SchemaLocation {
  source: SchemaSource;
  path: string;
  exists: boolean;
}

/**
 * Schema resolution info with shadowing details
 */
export interface SchemaResolution {
  name: string;
  source: SchemaSource;
  path: string;
  shadows: Array<{ source: SchemaSource; path: string }>;
}

/**
 * Validation issue structure
 */
export interface ValidationIssue {
  level: 'error' | 'warning';
  path: string;
  message: string;
}
