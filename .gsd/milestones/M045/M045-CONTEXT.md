# M045: Multi-plan Conflict Detection

The dashboard shows multiple plans, but it does not yet detect when active plans are likely to collide over generated projections, task scope, or shared execution assumptions. Multi-plan conflict detection should catch local conflicts before users start work in the wrong plan.

## Success Criteria

- Dashboard rows surface cross-plan conflicts from local state.
- Conflict detection avoids model judgment and uses deterministic signals.
- Users can switch to the conflicting plan to inspect the cause.
