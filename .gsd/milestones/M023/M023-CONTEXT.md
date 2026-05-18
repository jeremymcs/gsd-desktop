# M023: Change Proposal Activity History

## Vision

Change-control is append-only, but the UI should make that history understandable. Users need to see why a proposal is draft, edited, deleted, approved, hidden, restored, or modified without reading raw database events.

## Success Criteria

- Proposal cards expose a concise activity history.
- Activity history is derived from the planning event stream.
- Draft edits, withdrawal, approval, hide, restore, and task modification events are represented.
- History survives restart and stays tied to the proposal.
- The active proposal actions remain unchanged.

## Non-Goals

- Editing historical activity entries.
- Showing raw database event payloads.
- Replacing the proposal card action forms.
- Adding cross-project audit search.
