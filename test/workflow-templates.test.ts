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
import { getSynReviewSkillTemplate, getSynReviewCommandTemplate } from '../src/core/templates/workflows/review.js'

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

describe('sync staged pipeline (v0.4)', () => {
  describe('sync skill template contains 6-stage pipeline', () => {
    it('instructions contain Stage 1: Mode Detection', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Stage 1: Mode Detection')
    })
    it('instructions contain Stage 2: Scan', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Stage 2: Scan')
    })
    it('instructions contain Stage 3: Inference', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Stage 3: Inference')
    })
    it('instructions contain Stage 4: Clarify', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Stage 4: Clarify')
    })
    it('instructions contain Stage 5: Normalize', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Stage 5: Normalize')
    })
    it('instructions contain Stage 6: Write', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Stage 6: Write')
    })
    it('instructions mention greenfield mode', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('greenfield')
    })
    it('instructions mention brownfield mode', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('brownfield')
    })
    it('instructions mention constitution.md', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('constitution.md')
    })
    it('instructions mention pending spec backstop (Step 0)', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Pending Spec Backstop')
    })
    it('instructions mention hard stop for old constitution format', () => {
      expect(getSynSyncSkillTemplate().instructions).toContain('Old constitution format detected')
    })
  })

  describe('sync command template contains 6-stage pipeline', () => {
    it('content mentions Stage 1: Mode Detection', () => {
      expect(getSynSyncCommandTemplate().content).toContain('Stage 1: Mode Detection')
    })
    it('content mentions greenfield mode', () => {
      expect(getSynSyncCommandTemplate().content).toContain('greenfield')
    })
    it('content mentions brownfield mode', () => {
      expect(getSynSyncCommandTemplate().content).toContain('brownfield')
    })
    it('content mentions constitution.md', () => {
      expect(getSynSyncCommandTemplate().content).toContain('constitution.md')
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

describe('constitution gate language — no confidence=pending', () => {
  const allTemplates = [
    ['sync skill', getSynSyncSkillTemplate().instructions],
    ['sync command', getSynSyncCommandTemplate().content],
    ['clarify skill', getSynClarifySkillTemplate().instructions],
    ['clarify command', getSynClarifyCommandTemplate().content],
    ['analyze skill', getSynAnalyzeSkillTemplate().instructions],
    ['analyze command', getSynAnalyzeCommandTemplate().content],
    ['debug skill', getSynDebugSkillTemplate().instructions],
    ['debug command', getSynDebugCommandTemplate().content],
    ['explore skill', getSynExploreSkillTemplate().instructions],
    ['explore command', getSynExploreCommandTemplate().content],
    ['propose skill', getSynProposeSkillTemplate().instructions],
    ['propose command', getSynProposeCommandTemplate().content],
    ['apply skill', getSynApplySkillTemplate().instructions],
    ['apply command', getSynApplyCommandTemplate().content],
    ['quick skill', getSynQuickSkillTemplate().instructions],
    ['quick command', getSynQuickCommandTemplate().content],
    ['review skill', getSynReviewSkillTemplate().instructions],
    ['review command', getSynReviewCommandTemplate().content],
  ] as const

  for (const [name, content] of allTemplates) {
    it(`${name} does not contain confidence=pending`, () => {
      expect(content).not.toContain('confidence=pending')
    })
  }
})

describe('propose clarify-first', () => {
  it('skill instructions mention /syn:clarify as next step', () => {
    expect(getSynProposeSkillTemplate().instructions).toContain('/syn:clarify')
  })
  it('command content mentions /syn:clarify as next step', () => {
    expect(getSynProposeCommandTemplate().content).toContain('/syn:clarify')
  })
  it('skill instructions frame /syn:apply as a bypass, not primary', () => {
    const instructions = getSynProposeSkillTemplate().instructions
    const clarifyIdx = instructions.indexOf('/syn:clarify')
    const applyIdx = instructions.indexOf('/syn:apply')
    expect(clarifyIdx).toBeGreaterThanOrEqual(0)
    expect(applyIdx).toBeGreaterThanOrEqual(0)
    // clarify is mentioned before apply in the completion prompt
    expect(clarifyIdx).toBeLessThan(applyIdx)
  })
})

describe('sync Stage 6 self-validation', () => {
  it('skill instructions mention self-validation before writing', () => {
    expect(getSynSyncSkillTemplate().instructions).toContain('self-validate')
  })
  it('command content mentions self-validation before writing', () => {
    expect(getSynSyncCommandTemplate().content).toContain('self-validate')
  })
  it('skill instructions check for INV items before writing', () => {
    expect(getSynSyncSkillTemplate().instructions).toContain('**INV-NNN**')
  })
  it('skill instructions check for WFL items before writing', () => {
    expect(getSynSyncSkillTemplate().instructions).toContain('**WFL-NNN**')
  })
})

describe('sync post-output — Where to next?', () => {
  it('skill instructions contain "Where to next?"', () => {
    expect(getSynSyncSkillTemplate().instructions).toContain('Where to next?')
  })
  it('command content contains "Where to next?"', () => {
    expect(getSynSyncCommandTemplate().content).toContain('Where to next?')
  })
  it('skill instructions suggest /syn:explore in where-to-next block', () => {
    expect(getSynSyncSkillTemplate().instructions).toContain('/syn:explore')
  })
  it('skill instructions do not contain schema: synarcx/constitution', () => {
    expect(getSynSyncSkillTemplate().instructions).not.toContain('schema: synarcx/constitution')
  })
  it('command content does not contain schema: synarcx/constitution', () => {
    expect(getSynSyncCommandTemplate().content).not.toContain('schema: synarcx/constitution')
  })
  it('skill instructions mention stripping schema: during UPDATE mode', () => {
    expect(getSynSyncSkillTemplate().instructions).toContain('schema:')
    // the word schema: appears only in the context of stripping it, not setting it
    expect(getSynSyncSkillTemplate().instructions).toContain('strip')
  })
})
