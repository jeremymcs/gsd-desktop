# S01: Compute Next Work Items

**Goal:** Derive unblocked next work from accepted plan and execution state.

## Tasks

- [ ] Build a pure queue computation helper.
- [ ] Respect task dependencies, status, verification state, and hidden/restored items.
- [ ] Add package-level tests for blocked, unblocked, done, and verified tasks.
- [ ] Keep computation deterministic.

## Acceptance

- Unblocked pending tasks appear in queue order.
- Blocked tasks explain which dependencies are blocking them.
- Done, verified, hidden, and shipped work is not suggested as next.
