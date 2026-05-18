# M053: App-Wide GSD Workbench Redesign

**Vision:** Make every primary app surface feel like one GSD command center, not a generic chat shell with one designed planning page.

**Success Criteria:**

- Global chrome, launch state, composer, settings, skills, extensions, and review surfaces use the same workbench tokens.
- Existing desktop navigation and tests remain stable.
- The app keeps dark/light mode parity.

---

## Slices

- [x] **S01: Global Workbench Shell** `risk:medium` `depends:[M052]`
  > After this: users see GSD identity, phase language, and source-review styling across the whole app shell.
- [ ] **S02: Session Timeline Redesign** `risk:medium` `depends:[S01]`
  > Refine assistant/user/tool timeline states around GSD run evidence, queued work, and verification.
- [ ] **S03: Settings And Model Routing Console** `risk:medium` `depends:[S01]`
  > Make model, phase, and runtime settings feel like a compact operations console.
- [ ] **S04: Skills And Extensions Capability Matrix** `risk:medium` `depends:[S01]`
  > Replace generic lists with GSD capability, command, and tool grouping.
- [ ] **S05: Full Electron Visual Sweep** `risk:medium` `depends:[S02,S03,S04]`
  > Capture desktop screenshots in dark and light mode and fix remaining visual drift.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- Focused desktop navigation, settings, and Plan Builder tests
- `pnpm lint`
- `pnpm simplify`
