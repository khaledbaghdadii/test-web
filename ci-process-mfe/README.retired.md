# Retired CI Process MFE

This legacy MFE is kept only as migration history and reference material.

The active Build & Test / CI process implementation lives under:

- `domains/business-process/feature/src/lib/build-and-test`
- `domains/business-process/data-access/src/lib/build-and-test`
- `domains/business-process/util/src/lib/build-and-test`

`project.json` was renamed to `project.legacy.json` so Nx project discovery does
not treat this application as an active buildable/servable target. Delete this
folder once the full workspace no longer needs the legacy reference.
