import path from 'path'
import * as fs from 'fs'
import { ALL_WORKFLOWS, WORKFLOW_TO_SKILL_DIR } from './workflow-registry.js'
import { CommandAdapterRegistry } from '../command-generation/index.js'

export async function removeSkillDirs(skillsDir: string): Promise<number> {
  let removed = 0

  for (const workflow of ALL_WORKFLOWS) {
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow]
    if (!dirName) continue

    const skillDir = path.join(skillsDir, dirName)
    try {
      if (fs.existsSync(skillDir)) {
        await fs.promises.rm(skillDir, { recursive: true, force: true })
        removed++
      }
    } catch {
      // Ignore errors
    }
  }

  // Remove empty parent skills directory
  try {
    if (fs.existsSync(skillsDir)) {
      const remaining = await fs.promises.readdir(skillsDir)
      if (remaining.length === 0) {
        await fs.promises.rmdir(skillsDir)
      }
    }
  } catch {
    // Ignore errors
  }

  return removed
}

export async function removeUnselectedSkillDirs(
  skillsDir: string,
  desiredWorkflows: readonly string[]
): Promise<number> {
  const desiredSet = new Set(desiredWorkflows)
  let removed = 0

  for (const workflow of ALL_WORKFLOWS) {
    if (desiredSet.has(workflow)) continue
    const dirName = WORKFLOW_TO_SKILL_DIR[workflow]
    if (!dirName) continue

    const skillDir = path.join(skillsDir, dirName)
    try {
      if (fs.existsSync(skillDir)) {
        await fs.promises.rm(skillDir, { recursive: true, force: true })
        removed++
      }
    } catch {
      // Ignore errors
    }
  }

  return removed
}

export async function removeCommandFiles(
  projectPath: string,
  toolId: string
): Promise<number> {
  let removed = 0
  const adapter = CommandAdapterRegistry.get(toolId)
  if (!adapter) return 0

  for (const workflow of ALL_WORKFLOWS) {
    const cmdPath = adapter.getFilePath(workflow)
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath)

    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
        removed++
      }
    } catch {
      // Ignore errors
    }
  }

  return removed
}

export async function removeUnselectedCommandFiles(
  projectPath: string,
  toolId: string,
  desiredWorkflows: readonly string[]
): Promise<number> {
  let removed = 0
  const adapter = CommandAdapterRegistry.get(toolId)
  if (!adapter) return 0

  const desiredSet = new Set(desiredWorkflows)

  for (const workflow of ALL_WORKFLOWS) {
    if (desiredSet.has(workflow)) continue
    const cmdPath = adapter.getFilePath(workflow)
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath)

    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
        removed++
      }
    } catch {
      // Ignore errors
    }
  }

  return removed
}
