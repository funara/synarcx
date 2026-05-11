/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_synarcx_complete_changes() {
  local changes
  changes=$(synarcx __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_synarcx_complete_specs() {
  local specs
  specs=$(synarcx __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_synarcx_complete_items() {
  local items
  items=$(synarcx __complete changes 2>/dev/null | cut -f1; synarcx __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}

_synarcx_complete_schemas() {
  local schemas
  schemas=$(synarcx __complete schemas 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$schemas" -- "$cur"))
}`;
