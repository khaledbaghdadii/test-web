# Test Strategy — VAL-26641: CI "Build & Test" step migration

> Guiding principle (Khaled): **lose no behaviour.** Every authorization, feature flag, state guard,
> confirmation, tooltip and empty state in the legacy `ci-process-mfe` must be reproduced **and covered
> by a test**. Tests follow the repo's `unit-testing` + `web-unit-test-runner` skills; contract changes
> follow `local-pact-verify`.

## Test Conventions (mandatory)
- **Framework:** `@testing-library/angular` `render()` + `ng-mocks` `MockComponent`; service mocks as
  plain objects with `jest.fn()`. Mock the state-updater via `componentProviders`
  (`{ reloadProcessDetails: jest.fn() }`). Reference: `convert-binary-stage.component.spec.ts`.
- **No NgRx** in new specs. Drive components by `input()` signals; assert DOM, not internals.
- **Run tests** with the `web-unit-test-runner` skill (avoids the Jest 30 + Nx hang). Run only the
  affected lib's specs while iterating; run affected-project tests before marking a story done.
- **Contract tests** (`*.spec.pact.ts`) for the new Config Audit data-access endpoint and for the
  technical-reseed launch; verify with `local-pact-verify`.

## Risk-Based Focus
| Area | Risk | Test type(s) | Priority |
|------|------|--------------|----------|
| Open Config Editor flag (`workspace-configuration-editor-ui`) + automerge hide | High (silent loss) | unit (flag ON/OFF, automerge) | High |
| Config Audit color/tooltip/dropdown by linting status | High (new component) | unit (PASS/WARNING/FAIL, PENDING/STARTED, INVALID, ENDED-failure) + pact | High |
| Config Audit data-access endpoint (new web consumer) | High | unit + **pact contract** | High |
| `isUserInterventionDisabled` (stage ≠ PENDING_INPUT/RUNNING) disables actions | High | unit (enabled vs disabled) | High |
| `can-repush` (`mergeDevelopmentState.canRepush`) → Repush Backport | High | unit (allowed vs not) | High |
| `ScenarioExecutionGroupPermissionWarningMessage` warning map | Med | unit (warning shown when running TPK) | High |
| Technical Reseed NgRx→rxResource port + drop legacy FinalProductService | High | unit (visibility, list, dumpIds see-more, tooltip-not-dialog, launch request) + pact | High |
| Story chips off NgRx (input/rxResource) | Med | unit (renders from input; no store dep) | Med |
| Commits table = Branch Details table (reuse) | Med | unit (renders + empty state) | Med |
| Cherry-pick running/failed alert parity | Med | unit (running, failed, idle) | Med |
| Loading → create-branch illustration | Med | unit (illustration shown when `!readyForBuildAndTest`) | Med |
| Send-for-review popup + backport Yes/No + multi-select | High | unit (fields, validation, payload, page reload) | High |
| Shared `environment-status-panel` regression (upgrade/prepare) | High (blast radius) | unit **regression** (renders unchanged without `[extraActions]`) | High |
| Stepper "skipped" status interplay | Low (owned by 26634) | smoke | Low |

## Legacy Parity Verification (per story)
Each story MUST include a **parity checklist** diffed against the exact legacy file(s) listed in its slice
(see story-map). The reviewer confirms each legacy behaviour is reproduced and has a corresponding test.
Primary legacy references:
- `build-and-test-stage.component.{ts,html}` (order, states, conditionals)
- `build-environment-details/environment/build-environment-details.component.ts` (Open Config Editor flag)
- `test-section/build-and-test-run-scenario/…` + `…/build-and-test-scenario-executions/…` (TPK select/run/results)
- `build-and-test-action/build-and-test-actions.component.ts` + `send-for-review/…` (merge trigger/backport)
- `features/environment/.../technical-reseed/…` + `…/environment-config-audit/…` (port sources)

## Contract / Integration Boundaries
- **Config Audit:** web → gateway `GET …/environments/{envId}/systematic-config-audit` (confirm path, OQ4).
- **Technical Reseed launch:** web → `POST …/technical-reseed-execution-groups/{egId}/launch-reseed`
  (existing pact `web/pacts/web-mxenv-management.json`).
- **CI user-input:** send-changes-for-review / reopen-merge-request / repush-backport (existing).

## Manual / Exploratory Needs
- Visual diff of Build, Technical Reseed, Test, and Merge popup against Figma frames (`5651-143368`,
  `5657-145421`, `9694-108129`, `9766-53383/54658`).
- Automerge scenario: confirm Open Config Editor is hidden.
- e2e smoke of the full CI run route through the shell after S6 (MFE removal).

## Test Data & Environment Notes
- Reuse upgrade-process spec fixtures as templates for `BuildAndTestProcessExecution` shapes.
- Provide fixtures for each linting status (PASS/WARNING/FAIL) and request status (PENDING/STARTED/ENDED/INVALID).
- Provide technical-reseed fixtures with 0, 1, and many `dumpIds` (see-more behaviour).
