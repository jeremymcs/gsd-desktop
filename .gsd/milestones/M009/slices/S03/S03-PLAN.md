# S03: Composer Persistence Coverage

**Goal:** Prove composer-submitted answers and parked drafts restore from the planning database after restart without synthetic records.

## Tasks

- [x] Add restart coverage that uses only visible composer actions.
- [x] Assert restored DISCUSS memory after reopening.
- [x] Assert restored Idea pool state after reopening.
- [x] Assert exact answer and parked-item counts after reopening.
- [x] Keep the active question parked in place after restart.

## Acceptance

- A composer-saved answer persists as load-bearing DISCUSS memory.
- A composer-parked draft persists as one non-load-bearing answer and one parked item.
- The active DISCUSS question remains the parked question after restart.
- No extra synthetic answer records are created.
