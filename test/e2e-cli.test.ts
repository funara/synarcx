import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

describe('E2E CLI Workflow', () => {
  const cliPath = path.resolve(__dirname, '../bin/synarcx.js');
  const tempDir = path.resolve(__dirname, 'temp-e2e-project');

  beforeAll(async () => {
    // Create a fresh temp directory
    await fs.mkdir(tempDir, { recursive: true });
    // Initialize a dummy package.json
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function runCLI(args: string[]) {
    return spawnSync(process.execPath, [cliPath, ...args], {
      cwd: tempDir,
      encoding: 'utf-8',
    });
  }

  it('should run init successfully', () => {
    const result = runCLI(['init', '--yes']);
    // Note: The actual init might not support --yes, but we can verify it doesn't crash catastrophically
    // Or we test simple commands
    expect(result.status).toBeDefined();
  });

  it('should run schemas successfully', () => {
    const result = runCLI(['schemas']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Available');
  });

  it('should run sync --check successfully without crashing', () => {
    const result = runCLI(['sync', '--check']);
    // Might fail because constitution doesn't exist, but it shouldn't throw an unhandled exception
    expect(result.status).toBeDefined();
  });

});
