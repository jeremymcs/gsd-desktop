# S03: Composer Keyboard Submit

**Goal:** Let keyboard users submit the active composer answer with command/control-enter.

## Tasks

- [x] Add a composer textarea keyboard handler.
- [x] Submit only on command/control-enter.
- [x] Keep plain enter available for multiline answers.
- [x] Route keyboard submit through the existing load-bearing answer path.
- [x] Add Electron coverage for keyboard submit.

## Acceptance

- Control-enter submits the active composer answer.
- The saved answer is load-bearing DISCUSS memory.
- The active question advances after keyboard submit.
