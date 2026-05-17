# M010: Composer-First DISCUSS Polish

**Vision:** The Plan Builder composer should feel like the primary guided DISCUSS input, while the question card remains useful context.

**Success Criteria:**

- The composer displays the active question independently from placeholder text.
- The composer keeps focus after submit and park actions.
- Keyboard users can submit the active answer from the composer.
- Existing card controls remain usable and accessible.

---

## Slices

- [x] **S01: Composer Question Context** `risk:low` `depends:[M009]`
  > After this: users can still see the active DISCUSS question inside the composer after they begin typing.

- [ ] **S02: Composer Focus Retention** `risk:medium` `depends:[S01]`
  > After this: saving or parking from the composer returns focus to the composer for the current or next question.

- [ ] **S03: Composer Keyboard Submit** `risk:medium` `depends:[S01,S02]`
  > After this: keyboard users can submit the active composer answer with a standard command/control-enter shortcut.

## Boundary Map

### M009 -> S01

Produces:
  active composer textarea -> shared answer draft and action buttons

Consumes:
  visible question context -> prompt text remains visible outside placeholder state

### S01 -> S02

Produces:
  composer-first layout -> stable input target

Consumes:
  focus retention -> next turn can continue without extra pointer work

### S02 -> S03

Produces:
  focused composer textarea -> reliable keyboard target

Consumes:
  keyboard submit -> command/control-enter calls the existing load-bearing answer path
