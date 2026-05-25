import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { stringify as stringifyYaml } from 'yaml';
import {
  getProjectSchemasDir,
} from '../../core/artifact-graph/resolver.js';
import type { SchemaYaml, Artifact } from '../../core/artifact-graph/types.js';
import { SYNSPEC_DIR_NAME } from '../../core/config.js';
import { isValidSchemaName } from './utils.js';
import { DEFAULT_ARTIFACTS, createDefaultTemplate } from './templates.js';

export function registerInitCommand(schemaCmd: Command): void {
  schemaCmd
    .command('init <name>')
    .description('Create a new project-local schema')
    .option('--json', 'Output as JSON')
    .option('--description <text>', 'Schema description')
    .option('--artifacts <list>', 'Comma-separated artifact IDs (proposal,specs,design,tasks)')
    .option('--default', 'Set as project default schema')
    .option('--no-default', 'Do not prompt to set as default')
    .option('--force', 'Overwrite existing schema')
    .action(async (
      name: string,
      options?: {
        json?: boolean;
        description?: string;
        artifacts?: string;
        default?: boolean;
        force?: boolean;
      }
    ) => {
      const spinner = options?.json ? null : ora();

      try {
        const projectRoot = process.cwd();

        // Validate name
        if (!isValidSchemaName(name)) {
          if (options?.json) {
            console.log(JSON.stringify({
              created: false,
              error: `Invalid schema name '${name}'. Use kebab-case (e.g., my-workflow)`,
            }, null, 2));
          } else {
            console.error(`Error: Invalid schema name '${name}'`);
            console.error('Schema names must be kebab-case (e.g., my-workflow)');
          }
          process.exitCode = 1;
          return;
        }

        const schemaDir = path.join(getProjectSchemasDir(projectRoot), name);

        // Check if exists
        if (fs.existsSync(schemaDir)) {
          if (!options?.force) {
            if (options?.json) {
              console.log(JSON.stringify({
                created: false,
                error: `Schema '${name}' already exists`,
                suggestion: 'Use --force to overwrite or "synarcx schema fork" to copy',
              }, null, 2));
            } else {
              console.error(`Error: Schema '${name}' already exists at ${schemaDir}`);
              console.error('Use --force to overwrite or "synarcx schema fork" to copy');
            }
            process.exitCode = 1;
            return;
          }

          if (spinner) spinner.start(`Removing existing schema '${name}'...`);
          fs.rmSync(schemaDir, { recursive: true });
        }

        // Determine artifacts and description
        let description: string;
        let selectedArtifactIds: string[];

        // Check if we have explicit flags (non-interactive mode)
        const hasExplicitOptions = options?.description !== undefined || options?.artifacts !== undefined;
        const isInteractive = !options?.json && !hasExplicitOptions && process.stdout.isTTY;

        if (isInteractive) {
          // Interactive mode
          const { input, checkbox, confirm } = await import('@inquirer/prompts');

          description = await input({
            message: 'Schema description:',
            default: `Custom workflow schema for ${name}`,
          });

          const artifactChoices = DEFAULT_ARTIFACTS.map((a) => ({
            name: a.id,
            value: a.id,
            checked: true,
          }));

          selectedArtifactIds = await checkbox({
            message: 'Select artifacts to include:',
            choices: artifactChoices,
          });

          if (selectedArtifactIds.length === 0) {
            console.error('Error: At least one artifact must be selected');
            process.exitCode = 1;
            return;
          }

          // Ask about setting as default (unless --no-default was passed)
          if (options?.default === undefined) {
            const setAsDefault = await confirm({
              message: 'Set as project default schema?',
              default: false,
            });

            if (setAsDefault) {
              options = { ...options, default: true };
            }
          }
        } else {
          // Non-interactive mode
          description = options?.description || `Custom workflow schema for ${name}`;

          if (options?.artifacts) {
            selectedArtifactIds = options.artifacts.split(',').map((a) => a.trim());

            // Validate artifact IDs
            const validIds = DEFAULT_ARTIFACTS.map((a) => a.id);
            for (const id of selectedArtifactIds) {
              if (!validIds.includes(id)) {
                if (options?.json) {
                  console.log(JSON.stringify({
                    created: false,
                    error: `Unknown artifact '${id}'`,
                    valid: validIds,
                  }, null, 2));
                } else {
                  console.error(`Error: Unknown artifact '${id}'`);
                  console.error(`Valid artifacts: ${validIds.join(', ')}`);
                }
                process.exitCode = 1;
                return;
              }
            }
          } else {
            // Default to all artifacts
            selectedArtifactIds = DEFAULT_ARTIFACTS.map((a) => a.id);
          }
        }

        // Create schema directory
        if (spinner) spinner.start(`Creating schema '${name}'...`);
        fs.mkdirSync(schemaDir, { recursive: true });

        // Build artifacts array with proper dependencies
        const selectedArtifacts = selectedArtifactIds.map((id) => {
          const template = DEFAULT_ARTIFACTS.find((a) => a.id === id)!;
          const artifact: Artifact = {
            id: template.id,
            generates: template.generates,
            description: template.description,
            template: template.template,
            requires: [],
          };

          // Set up dependencies based on typical workflow
          if (id === 'specs' && selectedArtifactIds.includes('proposal')) {
            artifact.requires = ['proposal'];
          } else if (id === 'design' && selectedArtifactIds.includes('specs')) {
            artifact.requires = ['specs'];
          } else if (id === 'tasks') {
            const requires: string[] = [];
            if (selectedArtifactIds.includes('design')) requires.push('design');
            else if (selectedArtifactIds.includes('specs')) requires.push('specs');
            artifact.requires = requires;
          }

          return artifact;
        });

        // Create schema.yaml
        const schema: SchemaYaml = {
          name,
          version: 1,
          description,
          artifacts: selectedArtifacts,
        };

        // Add apply phase if tasks is included
        if (selectedArtifactIds.includes('tasks')) {
          schema.apply = {
            requires: ['tasks'],
            tracks: 'tasks.md',
          };
        }

        fs.writeFileSync(
          path.join(schemaDir, 'schema.yaml'),
          stringifyYaml(schema)
        );

        // Create template files in templates/ subdirectory (standard location)
        const templatesDir = path.join(schemaDir, 'templates');
        for (const artifact of selectedArtifacts) {
          const templatePath = path.join(templatesDir, artifact.template);
          const templateDir = path.dirname(templatePath);

          if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir, { recursive: true });
          }

          // Create default template content
          const templateContent = createDefaultTemplate(artifact.id);
          fs.writeFileSync(templatePath, templateContent);
        }

        // Update config if --default
        if (options?.default) {
          const configPath = path.join(projectRoot, SYNSPEC_DIR_NAME, 'config.yaml');

          if (fs.existsSync(configPath)) {
            const { parse: parseYaml, stringify: stringifyYaml2 } = await import('yaml');
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const config = parseYaml(configContent) || {};
            config.defaultSchema = name;
            fs.writeFileSync(configPath, stringifyYaml2(config));
          } else {
            // Create config file
            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) {
              fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(configPath, stringifyYaml({ defaultSchema: name }));
          }
        }

        if (spinner) spinner.succeed(`Created schema '${name}'`);

        if (options?.json) {
          console.log(JSON.stringify({
            created: true,
            path: schemaDir,
            schema: name,
            artifacts: selectedArtifactIds,
            setAsDefault: options?.default || false,
          }, null, 2));
        } else {
          console.log(`\nSchema created at: ${schemaDir}`);
          console.log(`\nArtifacts: ${selectedArtifactIds.join(', ')}`);
          if (options?.default) {
            console.log(`\nSet as project default schema.`);
          }
          console.log(`\nNext steps:`);
          console.log(`  1. Edit ${schemaDir}/schema.yaml to customize artifacts`);
          console.log(`  2. Modify templates in the schema directory`);
          console.log(`  3. Use with: synarcx new --schema ${name}`);
        }
      } catch (error) {
        if (spinner) spinner.fail(`Creation failed`);
        if (options?.json) {
          console.log(JSON.stringify({
            created: false,
            error: (error as Error).message,
          }, null, 2));
        } else {
          console.error(`Error: ${(error as Error).message}`);
        }
        process.exitCode = 1;
      }
    });
}
