import { promises as fs } from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { parseConstitution } from '../core/constitution/parser.js';
import { validateConstitution } from '../core/constitution/validator.js';
import { readPendingSync, processPendingEntries } from '../core/pending-sync.js';

export interface SyncOptions {
  check?: boolean;
  processPending?: boolean;
}

export async function syncCommand(options?: SyncOptions): Promise<void> {
  const cwd = process.cwd();
  const constitutionPath = path.join(cwd, 'synspec', 'constitution.md');

  console.log(chalk.bold.cyan('\n⬡ SynArcX Sync'));
  console.log(chalk.dim('====================\n'));

  const scanSpinner = ora('Scanning constitution and pending syncs...').start();

  let constitutionExists = false;
  let rawConstitution = '';
  try {
    rawConstitution = await fs.readFile(constitutionPath, 'utf-8');
    constitutionExists = true;
  } catch {}

  const pendingSync = await readPendingSync(cwd);
  const pendingCount = pendingSync?.pending.filter((p) => !p.syncedAt).length ?? 0;

  let mode: 'greenfield' | 'brownfield' | 'update' = 'greenfield';
  let isValid = false;
  let validationMsg = '';

  if (constitutionExists) {
    const parsed = parseConstitution(rawConstitution);
    const validation = validateConstitution(parsed);
    isValid = validation.valid;

    if (!isValid) {
      validationMsg = `Invalid (missing: ${validation.missingRequired.join(', ') || 'none'}, empty: ${validation.emptyRequired.join(', ') || 'none'}${validation.missingFingerprint ? ', missing fingerprint' : ''})`;
    } else {
      validationMsg = 'Valid';
      if (parsed.frontmatter) {
        if (parsed.frontmatter.mode === 'greenfield' && (String(parsed.frontmatter.fingerprint) === '00000000' || Number(parsed.frontmatter.fingerprint) === 0)) {
          mode = 'brownfield';
        } else {
          mode = parsed.frontmatter.mode || 'update';
        }
      }
    }
  } else {
    validationMsg = 'Not found (constitution.md does not exist)';
    mode = 'greenfield';
  }

  scanSpinner.stop();

  console.log(`  Constitution Status: ${isValid ? chalk.green('✓ ' + validationMsg) : chalk.yellow('⚠ ' + validationMsg)}`);
  console.log(`  Detected Sync Mode:  ${chalk.cyan(mode.toUpperCase())}`);
  console.log(`  Pending Syncs:       ${pendingCount > 0 ? chalk.red(`⚠ ${pendingCount} change(s) pending`) : chalk.green('✓ None')}`);

  if (pendingSync && pendingCount > 0) {
    console.log('\n  ' + chalk.bold('Pending changes to sync:'));
    for (const p of pendingSync.pending) {
      if (!p.syncedAt) {
        console.log(`    ${chalk.yellow('→')} ${p.change} ${chalk.dim(`(archived: ${p.archivedAt})`)}`);
      }
    }
  }

  if (options?.processPending) {
    console.log(); // Spacing
    if (pendingCount > 0) {
      const processSpinner = ora('Processing pending entries...').start();
      await processPendingEntries(cwd);
      processSpinner.succeed(chalk.green('All pending entries processed and cleared.'));
    } else {
      console.log(chalk.dim('  No pending syncs to process.'));
    }
    return;
  }

  if (options?.check) {
    console.log(); // Spacing
    if (!isValid) {
      console.error(chalk.red('  ✖ Error: Constitution is invalid.'));
      process.exit(1);
    }
    if (pendingCount > 0) {
      console.error(chalk.yellow('  ⚠ Warning: There are pending syncs. Run with --process-pending to clear them.'));
      process.exit(1);
    }
    console.log(chalk.green('  ✓ Check passed. Constitution is valid and synchronized.'));
  }
  
  console.log(); // Final spacing
}
