# M017: Idea Pool Proposal Review Handoff

## Vision

The idea pool should not strand users after a parked idea becomes a drafted change proposal. Composer-origin review already hands users to the existing proposal approval form; the side-pane idea pool should provide the same handoff instead of showing an inert drafted state.

## Success Criteria

- A promotion-ready idea with a saved change proposal shows `Review proposal`.
- The old disabled `Drafted` state is removed from the idea pool action row.
- Clicking `Review proposal` focuses the existing proposal approval form.
- No duplicate approval path is introduced.
- Electron coverage proves the side-pane handoff on the real desktop surface.

## Non-Goals

- Approving proposals directly from the idea pool.
- Changing proposal persistence or projection semantics.
- Changing composer proposal review behavior.
