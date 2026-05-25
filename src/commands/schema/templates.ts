import type { Artifact } from '../../core/artifact-graph/types.js';

/**
 * Default artifacts with descriptions for schema init.
 */
export const DEFAULT_ARTIFACTS: Array<{
  id: string;
  description: string;
  generates: string;
  template: string;
}> = [
  {
    id: 'proposal',
    description: 'High-level description of the change, its motivation, and scope',
    generates: 'proposal.md',
    template: 'proposal.md',
  },
  {
    id: 'specs',
    description: 'Detailed specifications with requirements and scenarios',
    generates: 'specs/**/*.md',
    template: 'specs/spec.md',
  },
  {
    id: 'design',
    description: 'Technical design decisions and implementation approach',
    generates: 'design.md',
    template: 'design.md',
  },
  {
    id: 'tasks',
    description: 'Implementation checklist with trackable tasks',
    generates: 'tasks.md',
    template: 'tasks.md',
  },
];

/**
 * Create default template content for an artifact.
 */
export function createDefaultTemplate(artifactId: string): string {
  switch (artifactId) {
    case 'proposal':
      return `## Why

<!-- Describe the motivation for this change -->

## What Changes

<!-- Describe what will change -->

## Capabilities

### New Capabilities
<!-- List new capabilities -->

### Modified Capabilities
<!-- List modified capabilities -->

## Impact

<!-- Describe the impact on existing functionality -->
`;

    case 'specs':
      return `## ADDED Requirements

### Requirement: Example requirement

Description of the requirement.

#### Scenario: Example scenario
- **WHEN** some condition
- **THEN** some outcome
`;

    case 'design':
      return `## Context

<!-- Background and context -->

## Goals / Non-Goals

**Goals:**
<!-- List goals -->

**Non-Goals:**
<!-- List non-goals -->

## Decisions

### 1. Decision Name

Description and rationale.

**Alternatives considered:**
- Alternative 1: Rejected because...

## Risks / Trade-offs

<!-- List risks and trade-offs -->
`;

    case 'tasks':
      return `## Implementation Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`;

    default:
      return `## ${artifactId}

<!-- Add content here -->
`;
  }
}
