import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseSchema, SchemaValidationError } from '../../core/artifact-graph/schema.js';
import type { ValidationIssue } from './types.js';

/**
 * Validate a schema and return issues.
 */
export function validateSchema(
  schemaDir: string,
  verbose: boolean = false
): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const schemaPath = path.join(schemaDir, 'schema.yaml');

  // Check schema.yaml exists
  if (verbose) {
    console.log('  Checking schema.yaml exists...');
  }
  if (!fs.existsSync(schemaPath)) {
    issues.push({
      level: 'error',
      path: 'schema.yaml',
      message: 'schema.yaml not found',
    });
    return { valid: false, issues };
  }

  // Parse YAML
  if (verbose) {
    console.log('  Parsing YAML...');
  }
  let content: string;
  try {
    content = fs.readFileSync(schemaPath, 'utf-8');
  } catch (err) {
    issues.push({
      level: 'error',
      path: 'schema.yaml',
      message: `Failed to read file: ${(err as Error).message}`,
    });
    return { valid: false, issues };
  }

  // Validate against Zod schema
  if (verbose) {
    console.log('  Validating schema structure...');
  }
  let schema;
  try {
    schema = parseSchema(content);
  } catch (err) {
    if (err instanceof SchemaValidationError) {
      issues.push({
        level: 'error',
        path: 'schema.yaml',
        message: err.message,
      });
    } else {
      issues.push({
        level: 'error',
        path: 'schema.yaml',
        message: `Parse error: ${(err as Error).message}`,
      });
    }
    return { valid: false, issues };
  }

  // Check template files exist
  // Templates can be in schemaDir directly or in a templates/ subdirectory
  if (verbose) {
    console.log('  Checking template files...');
  }
  for (const artifact of schema.artifacts) {
    // Try templates subdirectory first (standard location), then root
    const templatePathInTemplates = path.join(schemaDir, 'templates', artifact.template);
    const templatePathInRoot = path.join(schemaDir, artifact.template);

    if (!fs.existsSync(templatePathInTemplates) && !fs.existsSync(templatePathInRoot)) {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: `Template file '${artifact.template}' not found for artifact '${artifact.id}'`,
      });
    }
  }

  // Dependency graph validation is already done by parseSchema
  // (it throws on cycles and invalid references)
  if (verbose) {
    console.log('  Dependency graph validation passed (via parseSchema)');
  }

  return { valid: issues.length === 0, issues };
}
