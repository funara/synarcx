import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import {
  getSchemaDir,
  getProjectSchemasDir,
  listSchemas,
} from '../../core/artifact-graph/resolver.js';
import { parseSchema } from '../../core/artifact-graph/schema.js';
import { stringify as stringifyYaml } from 'yaml';
import { getSchemaResolution } from './resolution.js';
import { isValidSchemaName, copyDirRecursive } from './utils.js';

export function registerForkCommand(schemaCmd: Command): void {
  schemaCmd
    .command('fork <source> [name]')
    .description('Copy an existing schema to project for customization')
    .option('--json', 'Output as JSON')
    .option('--force', 'Overwrite existing destination')
    .action(async (source: string, name?: string, options?: { json?: boolean; force?: boolean }) => {
      const spinner = options?.json ? null : ora();

      try {
        const projectRoot = process.cwd();
        const destinationName = name || `${source}-custom`;

        // Validate destination name
        if (!isValidSchemaName(destinationName)) {
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: `Invalid schema name '${destinationName}'. Use kebab-case (e.g., my-workflow)`,
            }, null, 2));
          } else {
            console.error(`Error: Invalid schema name '${destinationName}'`);
            console.error('Schema names must be kebab-case (e.g., my-workflow)');
          }
          process.exitCode = 1;
          return;
        }

        // Find source schema
        const sourceDir = getSchemaDir(source, projectRoot);
        if (!sourceDir) {
          const available = listSchemas(projectRoot);
          if (options?.json) {
            console.log(JSON.stringify({
              forked: false,
              error: `Schema '${source}' not found`,
              available,
            }, null, 2));
          } else {
            console.error(`Error: Schema '${source}' not found`);
            console.error(`Available schemas: ${available.join(', ')}`);
          }
          process.exitCode = 1;
          return;
        }

        // Determine source location
        const sourceResolution = getSchemaResolution(source, projectRoot);
        const sourceLocation = sourceResolution?.source || 'package';

        // Check destination
        const destinationDir = path.join(getProjectSchemasDir(projectRoot), destinationName);

        if (fs.existsSync(destinationDir)) {
          if (!options?.force) {
            if (options?.json) {
              console.log(JSON.stringify({
                forked: false,
                error: `Schema '${destinationName}' already exists`,
                suggestion: 'Use --force to overwrite',
              }, null, 2));
            } else {
              console.error(`Error: Schema '${destinationName}' already exists at ${destinationDir}`);
              console.error('Use --force to overwrite');
            }
            process.exitCode = 1;
            return;
          }

          // Remove existing
          if (spinner) spinner.start(`Removing existing schema '${destinationName}'...`);
          fs.rmSync(destinationDir, { recursive: true });
        }

        // Copy schema
        if (spinner) spinner.start(`Forking '${source}' to '${destinationName}'...`);
        copyDirRecursive(sourceDir, destinationDir);

        // Update name in schema.yaml
        const destSchemaPath = path.join(destinationDir, 'schema.yaml');
        const schemaContent = fs.readFileSync(destSchemaPath, 'utf-8');
        const schema = parseSchema(schemaContent);
        schema.name = destinationName;

        fs.writeFileSync(destSchemaPath, stringifyYaml(schema));

        if (spinner) spinner.succeed(`Forked '${source}' to '${destinationName}'`);

        if (options?.json) {
          console.log(JSON.stringify({
            forked: true,
            source,
            sourcePath: sourceDir,
            sourceLocation,
            destination: destinationName,
            destinationPath: destinationDir,
          }, null, 2));
        } else {
          console.log(`\nSource: ${sourceDir} (${sourceLocation})`);
          console.log(`Destination: ${destinationDir}`);
          console.log(`\nYou can now customize the schema at:`);
          console.log(`  ${destinationDir}/schema.yaml`);
        }
      } catch (error) {
        if (spinner) spinner.fail(`Fork failed`);
        if (options?.json) {
          console.log(JSON.stringify({
            forked: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(`Error: ${(error as Error).message}`);
        }
        process.exitCode = 1;
      }
    });
}
