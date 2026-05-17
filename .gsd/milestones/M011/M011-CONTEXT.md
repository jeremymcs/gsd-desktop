# M011: Composer-Driven Phase Handoffs

## Vision

The Plan Builder composer should remain useful after DISCUSS. M009 and M010 made it the primary question input; this milestone makes the same bottom action surface advance explicit workflow handoffs while keeping the existing review cards intact.

## Success Criteria

- The composer can start RESEARCH after DISCUSS is confirmed.
- The composer can start PLAN after research is accepted.
- Composer handoff actions use the same database-backed handlers as the visible card buttons.
- Existing card buttons and tests remain unambiguous.
- Electron coverage proves handoff actions on the real desktop surface.

## Non-Goals

- Replacing research, plan, execute, verify, or ship forms with freeform chat.
- Adding hidden automatic phase advancement.
- Bypassing readiness warnings or user acknowledgement gates.
