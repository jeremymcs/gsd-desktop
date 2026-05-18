# M044: Guardrail Stop/Resume UX

**Vision:** Make guardrail stops operational instead of merely informational.

**Success Criteria:**

- Blocking and informational guardrails are visually distinct.
- Recovery and repair actions are available from the stop surface.
- Restart preserves the same stop explanation.

---

## Slices

- [x] **S01: Stop Surface Actions** `risk:medium` `depends:[M043]`
  > After this: users can act on blocking guardrails directly from EXECUTE.

## Status

- S01 complete: guardrail warnings now distinguish blocking and informational states and expose deterministic repair/resume actions.
