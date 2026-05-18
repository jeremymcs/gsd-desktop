# M021: Single Active Question Surface

**Vision:** Keep the active planning question anchored in one composer-first surface while preserving context and memory.

**Success Criteria:**

- Active prompt duplication is covered by a regression test.
- Upper phase guidance and follow-up cards stay contextual, not duplicative.
- Saved memory continues to show the original question text.

---

## Slices

- [ ] **S01: Active Prompt Regression Guard** `risk:low` `depends:[]`
  > After this: the Electron Plan Builder spec proves the current active prompt is visible in one active input surface and does not reappear as a duplicate question form.

- [ ] **S02: Prompt Context Cleanup** `risk:low` `depends:[S01]`
  > After this: Plan Builder copy and test ids distinguish active composer prompt, follow-up prompt, and saved memory prompt so future changes do not blur them.

## Boundary Map

### Current composer-first DISCUSS -> S01

Produces:
  composer prompt context -> the only active answer location

Consumes:
  regression coverage -> guard against reintroducing a second active question form

### S01 -> S02

Produces:
  prompt visibility contract -> active prompt, follow-up prompt, and memory prompt each have distinct semantics

Consumes:
  cleanup pass -> clearer code and tests for future questioning work
