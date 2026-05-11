import { describe, it, expect } from 'vitest'
import { getSkillTemplates } from '../src/core/shared/skill-generation.js'
import { CORE_WORKFLOWS } from '../src/core/profiles.js'

describe('skill-generation', () => {
  describe('getSkillTemplates', () => {
    const entries = getSkillTemplates()

    it('returns exactly 8 entries', () => {
      expect(entries).toHaveLength(8)
    })

    it('all entries have syn-* dirName', () => {
      for (const entry of entries) {
        expect(entry.dirName).toMatch(/^syn-/)
      }
    })

    it('every CORE_WORKFLOWS ID has a matching entry', () => {
      const workflowIds = new Set(entries.map(e => e.workflowId))
      for (const id of CORE_WORKFLOWS) {
        expect(workflowIds.has(id)).toBe(true)
      }
    })
  })
})
