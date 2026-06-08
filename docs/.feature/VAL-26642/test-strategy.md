# Test Strategy — VAL-26642: CI Merge Step

## Risk-Based Focus
| Area | Risk | Test type(s) | Priority |
|------|------|--------------|----------|
| Legacy v1 backport tabs (copy-as-is) | High | unit (per `cherryPickStatus` branch), visual parity | High |
| Final Product Details states (in-progress/`-`/failure) | High | unit, component | High |
| Button gating (`areActionsDisabled`, `canRepushBackport`, status==FAILED) | High | unit | High |
| CI v1 vs v2 rendering branch (`ciVersion`) | High | unit | High |
| Backports v2 tables + deleted-definition banner placement | Med | unit, component | Med |
| Merge actions (send-for-review / reopen / fix-issues / cherry-pick-done / repush) | Med | unit (service called with correct payload) | Med |
| Final product = same component as Tag stage | Med | unit (input wiring) | Med |
| Route + execution fetch | Low | unit (mapper), smoke | Low |

## Contract / Integration Boundaries
- **All consumed data-access is migrated into the domains data-access libs** (`domains/business-process/data-access`,
  `domains/artifact/data-access`) **with unit tests AND contract (pact) tests** — copied from the legacy equivalents and
  enhanced for the new model shapes. The new code never depends on legacy.
- **Pact convention:** domains data-access libs have no pact tests today. Add new specs to the **shared
  `web/libs/contract-tests/src/lib/`** lib (pattern: `scm-service.spec.pact.ts`), importing the new domains services via
  their barrels. Providers:
  - `business-process-execution-service` — CI execution payload (`ciVersion`, `backportRequested`,
    `willPublishFinalProduct`, final product ids), backport executions, BP definitions, and the user-input POST endpoints.
  - `artifact-management-service` — final product fetch.
- Reuse/enhance matchers from the legacy CI pact
  `web/apps/ci-process-mfe/src/contracts/business-process-execution-service.spec.pact.ts`. Verify with **local-pact-verify**.

## Manual / Exploratory Needs
- Side-by-side comparison of legacy MFE vs new UI for: a v1 process with failed cherry-pick (manual flow), a v1 process with successful backport, a v2 process with mixed backport statuses + a deleted definition, and a process whose final product creation failed.
- Reference executions provided in the wiki (old BP execution with old backports; the failed/succeeded/deleted-definition backports execution link).

## Test Data & Environment Notes
- Need a **v1 (legacy)** CI execution and a **v2** CI execution with backports to exercise both paths.
- Need an execution where `willPublishFinalProduct=true` with a final product in *in-progress* and in *failed* states.
- Reuse existing CI process mocks/fixtures from `ci-process-mfe` specs where possible.
