import { describe, it, expect } from 'vitest'
import { getSynSyncSkillTemplate, getSynSyncCommandTemplate } from '../src/core/templates/workflows/sync.js'
import { getSynClarifySkillTemplate, getSynClarifyCommandTemplate } from '../src/core/templates/workflows/clarify.js'
import { getSynAnalyzeSkillTemplate, getSynAnalyzeCommandTemplate } from '../src/core/templates/workflows/analyze.js'
import { getSynDebugSkillTemplate, getSynDebugCommandTemplate } from '../src/core/templates/workflows/debug.js'
import { getSynExploreSkillTemplate, getSynExploreCommandTemplate } from '../src/core/templates/workflows/explore.js'
import { getSynProposeSkillTemplate, getSynProposeCommandTemplate } from '../src/core/templates/workflows/propose.js'
import { getSynApplySkillTemplate, getSynApplyCommandTemplate } from '../src/core/templates/workflows/apply-change.js'
import { getSynRefactorSkillTemplate, getSynRefactorCommandTemplate } from '../src/core/templates/workflows/refactor.js'
import { getSynQuickSkillTemplate, getSynQuickCommandTemplate } from '../src/core/templates/workflows/quick.js'

const templateFns = [
  ['sync', getSynSyncSkillTemplate],
  ['clarify', getSynClarifySkillTemplate],
  ['analyze', getSynAnalyzeSkillTemplate],
  ['debug', getSynDebugSkillTemplate],
  ['refactor', getSynRefactorSkillTemplate],
  ['quick', getSynQuickSkillTemplate],
] as const

describe('workflow template exports', () => {
  for (const [name, fn] of templateFns) {
    describe(`getSyn${name.charAt(0).toUpperCase() + name.slice(1)}SkillTemplate`, () => {
      const tmpl = fn()

      it('returns an object with non-empty name', () => {
        expect(tmpl.name).toBeTruthy()
        expect(typeof tmpl.name).toBe('string')
      })

      it('name starts with syn-', () => {
        expect(tmpl.name).toMatch(/^syn-/)
      })

      it('returns non-empty description', () => {
        expect(tmpl.description).toBeTruthy()
        expect(typeof tmpl.description).toBe('string')
      })

      it('returns non-empty instructions', () => {
        expect(tmpl.instructions).toBeTruthy()
        expect(typeof tmpl.instructions).toBe('string')
      })
    })
  }
})

describe('workflow labels', () => {
  describe('clarify has no OPTIONAL label', () => {
    it('skill description', () => {
      expect(getSynClarifySkillTemplate().description).not.toContain('OPTIONAL')
    })
    it('skill instructions', () => {
      expect(getSynClarifySkillTemplate().instructions).not.toContain('OPTIONAL')
    })
    it('command description', () => {
      expect(getSynClarifyCommandTemplate().description).not.toContain('OPTIONAL')
    })
    it('command content', () => {
      expect(getSynClarifyCommandTemplate().content).not.toContain('OPTIONAL')
    })
    it('command tags exclude optional', () => {
      expect(getSynClarifyCommandTemplate().tags).not.toContain('optional')
    })
  })

  describe('analyze has no OPTIONAL label', () => {
    it('skill description', () => {
      expect(getSynAnalyzeSkillTemplate().description).not.toContain('OPTIONAL')
    })
    it('skill instructions', () => {
      expect(getSynAnalyzeSkillTemplate().instructions).not.toContain('OPTIONAL')
    })
    it('command description', () => {
      expect(getSynAnalyzeCommandTemplate().description).not.toContain('OPTIONAL')
    })
    it('command content', () => {
      expect(getSynAnalyzeCommandTemplate().content).not.toContain('OPTIONAL')
    })
    it('command tags exclude optional', () => {
      expect(getSynAnalyzeCommandTemplate().tags).not.toContain('optional')
    })
  })

  describe('apply has no EXPERIMENTAL label', () => {
    it('skill description', () => {
      expect(getSynApplySkillTemplate().description.toLowerCase()).not.toContain('experimental')
    })
    it('command description', () => {
      expect(getSynApplyCommandTemplate().description.toLowerCase()).not.toContain('experimental')
    })
    it('command tags exclude experimental', () => {
      expect(getSynApplyCommandTemplate().tags).not.toContain('experimental')
    })
  })

  describe('explore has no experimental tag', () => {
    it('command tags exclude experimental', () => {
      expect(getSynExploreCommandTemplate().tags).not.toContain('experimental')
    })
  })
})

describe('workflow next-step suggestions', () => {
  describe('propose suggests clarify', () => {
    it('skill instructions mention /syn:clarify', () => {
      expect(getSynProposeSkillTemplate().instructions).toContain('/syn:clarify')
    })
    it('command content mentions /syn:clarify', () => {
      expect(getSynProposeCommandTemplate().content).toContain('/syn:clarify')
    })
  })

  describe('clarify suggests apply', () => {
    it('skill instructions mention /syn:apply', () => {
      expect(getSynClarifySkillTemplate().instructions).toContain('/syn:apply')
    })
    it('command content mentions /syn:apply', () => {
      expect(getSynClarifyCommandTemplate().content).toContain('/syn:apply')
    })
  })

  describe('analyze suggests apply', () => {
    it('skill instructions mention /syn:apply', () => {
      expect(getSynAnalyzeSkillTemplate().instructions).toContain('/syn:apply')
    })
    it('command content mentions /syn:apply', () => {
      expect(getSynAnalyzeCommandTemplate().content).toContain('/syn:apply')
    })
  })

  describe('explore suggests propose', () => {
    it('skill instructions mention /syn:propose', () => {
      expect(getSynExploreSkillTemplate().instructions).toContain('/syn:propose')
    })
    it('command content mentions /syn:propose', () => {
      expect(getSynExploreCommandTemplate().content).toContain('/syn:propose')
    })
  })

  describe('debug suggests propose', () => {
    it('skill instructions mention /syn:propose', () => {
      expect(getSynDebugSkillTemplate().instructions).toContain('/syn:propose')
    })
    it('command content mentions /syn:propose', () => {
      expect(getSynDebugCommandTemplate().content).toContain('/syn:propose')
    })
  })
})

describe('sync version check', () => {
  describe('sync skill template contains version check', () => {
    it('instructions mention Step 1 version check header', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Step 1: SynArcX Version Check')
    })
    it('instructions mention .version-cache.json', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('.version-cache.json')
    })
    it('instructions mention AskUserQuestion', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('AskUserQuestion')
    })
    it('instructions mention npm install -g synarcx@latest', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('npm install -g synarcx@latest')
    })
    it('instructions mention synarcx update (post-update suggestion)', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('synarcx update')
    })
    it('instructions mention segment comparison', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('.')
    })
    it('instructions mention latestVersion: null (cache-on-failure)', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('latestVersion: null')
    })
  })

  describe('sync command template contains version check', () => {
    it('content mentions Step 1 version check header', () => {
      expect(getSynSyncCommandTemplate().content).toContain('Step 1: SynArcX Version Check')
    })
    it('content mentions .version-cache.json', () => {
      expect(getSynSyncCommandTemplate().content).toContain('.version-cache.json')
    })
    it('content mentions AskUserQuestion', () => {
      expect(getSynSyncCommandTemplate().content).toContain('AskUserQuestion')
    })
    it('content mentions npm install -g synarcx@latest', () => {
      expect(getSynSyncCommandTemplate().content).toContain('npm install -g synarcx@latest')
    })
    it('content mentions synarcx update (post-update suggestion)', () => {
      expect(getSynSyncCommandTemplate().content).toContain('synarcx update')
    })
    it('content mentions latestVersion: null (cache-on-failure)', () => {
      expect(getSynSyncCommandTemplate().content).toContain('latestVersion: null')
    })
  })
})

describe('debug command behavior', () => {
  describe('is 3-phase, not 4-phase', () => {
    it('skill instructions have no Phase 4', () => {
      expect(getSynDebugSkillTemplate().instructions).not.toContain('Phase 4')
    })
    it('command content has no Phase 4', () => {
      expect(getSynDebugCommandTemplate().content).not.toContain('Phase 4')
    })
    it('skill instructions mention 3 phases', () => {
      expect(getSynDebugSkillTemplate().instructions).toContain('3')
    })
  })

  describe('does not write to tasks.md', () => {
    it('skill instructions have no tasks.md append behavior', () => {
      const instructions = getSynDebugSkillTemplate().instructions
      expect(instructions).not.toMatch(/append.*tasks\.md/i)
      expect(instructions).not.toMatch(/tasks\.md.*append/i)
      expect(instructions).not.toContain('Implementation Tasks')
    })
    it('command content has no tasks.md append behavior', () => {
      const content = getSynDebugCommandTemplate().content
      expect(content).not.toMatch(/append.*tasks\.md/i)
      expect(content).not.toMatch(/tasks\.md.*append/i)
    })
  })

  describe('reads existing change artifacts', () => {
    it('skill instructions mention reading proposal.md', () => {
      expect(getSynDebugSkillTemplate().instructions).toContain('proposal.md')
    })
    it('skill instructions mention reading design.md', () => {
      expect(getSynDebugSkillTemplate().instructions).toContain('design.md')
    })
  })

  describe('has strong closing guardrails', () => {
    it('command template contains "do NOT start the pipeline"', () => {
      expect(getSynDebugCommandTemplate().content).toContain('do NOT start the pipeline')
    })
    it('command template contains "must explicitly run /syn:propose"', () => {
      expect(getSynDebugCommandTemplate().content).toContain('must explicitly run `/syn:propose`')
    })
  })

  describe('snapshot matches command template', () => {
    it('command template content matches snapshot', () => {
      expect(getSynDebugCommandTemplate().content).toMatchSnapshot()
    })
  })
})

describe('refactor command behavior', () => {
  describe('does not create artifacts or start pipeline', () => {
    it('command template contains "Do NOT create any artifacts or start the pipeline"', () => {
      expect(getSynRefactorCommandTemplate().content).toContain('Do NOT create any artifacts or start the pipeline')
    })
    it('command template contains "must explicitly run /syn:propose"', () => {
      expect(getSynRefactorCommandTemplate().content).toContain('must explicitly run `/syn:propose`')
    })
  })

  describe('has initial context section', () => {
    it('command template mentions synarcx list --json', () => {
      expect(getSynRefactorCommandTemplate().content).toContain('synarcx list --json')
    })
  })

  describe('has opening question', () => {
    it('command template mentions AskUserQuestion tool', () => {
      expect(getSynRefactorCommandTemplate().content).toContain('AskUserQuestion')
    })
    it('command template mentions restructuring question', () => {
      expect(getSynRefactorCommandTemplate().content).toContain('What part of the codebase feels like it needs restructuring')
    })
  })

  describe('snapshot matches command template', () => {
    it('command template content matches snapshot', () => {
      expect(getSynRefactorCommandTemplate().content).toMatchSnapshot()
    })
  })
})
