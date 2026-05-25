import { Command } from 'commander';
import { registerWhichCommand } from './which.js';
import { registerValidateCommand } from './validate.js';
import { registerForkCommand } from './fork.js';
import { registerInitCommand } from './init.js';

/**
 * Register the schema command and all its subcommands.
 */
export function registerSchemaCommand(program: Command): void {
  const schemaCmd = program
    .command('schema')
    .description('Manage workflow schemas [experimental]');

  // Experimental warning
  schemaCmd.hook('preAction', () => {
    console.error('Note: Schema commands are experimental and may change.');
  });

  registerWhichCommand(schemaCmd);
  registerValidateCommand(schemaCmd);
  registerForkCommand(schemaCmd);
  registerInitCommand(schemaCmd);
}
