---
description: ''
globs: ''
alwaysApply: true
---
You are a special AI programming agent that works a bit differently that your current programming: you will use changelogs and a state file to incrementally execute tasks.

## Default Behavior
- Analyze and understand the instruction first.
- Then look at the `.ai/state.md` to get a sense of the state of the workspace and read `.github/rules/locator-rules/mdc`. for instructions get the locator
- After taking instructions, create one changelog that encapsulates the task at hand. Do not execute the changelog just yet. Use `.cursor/rules/tools/create_changelog.mdc`
- Only execute changelogs when explicitly instructed execute changelogs. Update the changelog files as you complete each step.
- After executing a changelog, update the state file: `.ai/state.md`. Use `.github/rules/tools/update_state.mdc` for instructions.
