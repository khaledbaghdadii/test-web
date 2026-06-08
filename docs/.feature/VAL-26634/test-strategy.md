# Test Strategy — VAL-26634: [UI/UX][CI] Build & Test Run Page Header & Run Stepper

## Risk-Based Focus
| Area | Risk | Test type(s) | Priority |
|------|------|--------------|----------|
| Shared `mxevolve-stepper` `skipped` status | High — shared primitive used by other steppers | unit (all 5 statuses), regression compile of existing consumers | High |
| CI data-access fetcher + DTO mapping | High — wrong endpoint/mapping breaks the whole page | unit, contract alignment | High |
| Run Details field renames (`buildAndTestInfraGroup` → "Test Environment Infra Group") | Med — mislabeled infra groups confuse users | unit (DOM assertions on labels) | High |
| Stepper start/end date tooltips | Med — required for CI, absent in Upgrade | unit (tooltip content per stage) | Med |
| Skip-step rendering (greyed checkmark, non-clickable) | Med — new behaviour | unit (icon + click guard) | Med |
| Expiry chip visibility (always unless finished) | Low — reused atom | unit | Low |
| Branch Details reuse (same commits logic) | Low — reused composite-widget | unit (smoke) | Low |
| MFE wiring + legacy removal | Med — integration seam | unit/smoke, dead-import check | Med |

## Contract / Integration Boundaries
- CI fetcher → gateway `GET .../executions/ci-process/{id}`: align with existing Pact contract in
  `web/apps/ci-process-mfe/src/contracts/business-process-execution-service.spec.pact.ts`. No new
  contract unless a response field is newly consumed; if so, follow the `local-pact-verify` skill.
- User-input `POST .../ci-process/{id}/user-input/*`: not exercised by header/stepper; only copy/test
  if a later stage story needs them (out of scope here, but the service is migrated in S1).

## Manual / Exploratory Needs
- Visual check of the run header against the Figma node `9615-68110` and the 3 wiki/Jira screenshots.
- Verify the skipped-step look matches the Jira screenshot (`Prepare Setup - Skipped`).
- Verify create-branch illustration appears on a freshly created CI process.

## Test Data & Environment Notes
- Reuse existing CI execution fixtures from the legacy MFE specs as the basis for new data-access tests.
- Run web unit tests via the `web-unit-test-runner` skill to avoid the Jest 30 + Nx hang.
- Follow `unit-testing` skill conventions for component specs (Testing Library + signals).
