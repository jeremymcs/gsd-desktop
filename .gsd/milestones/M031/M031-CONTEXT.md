# M031: Projection/Database Drift Repair

Generated Markdown projections can be missing, stale, or manually edited. The database remains canonical, but users need a repair path that detects drift and safely regenerates generated projections.

## Success Criteria

- The app detects missing or stale generated projections.
- Manual legacy files are still protected.
- Users can repair generated projection drift from the UI.

