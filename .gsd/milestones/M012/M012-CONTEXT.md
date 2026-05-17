# M012: Composer-Driven Completion Handoffs

## Vision

The Plan Builder composer should keep acting as the primary workflow control after EXECUTE begins. M011 made the composer advance RESEARCH, PLAN, and EXECUTE; this milestone carries that pattern through VERIFY and SHIP while preserving the existing task cards and readiness gates.

## Success Criteria

- The composer can start VERIFY after all active tasks are marked done with evidence.
- The composer can start SHIP after all active task verifications pass.
- Composer handoffs use the same database-backed handlers as the visible card buttons.
- The composer never bypasses task evidence or verification readiness gates.
- Electron coverage proves the handoffs on the real desktop surface.

## Non-Goals

- Replacing task execution editors with freeform chat.
- Auto-marking tasks done or verified from composer text.
- Changing ship summary capture.
