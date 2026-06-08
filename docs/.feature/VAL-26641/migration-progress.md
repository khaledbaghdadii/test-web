# VAL-26641 Migration Progress

Last updated: 2026-06-08

## Scope
- Complete the CI Build & Test migration under `domains/business-process`.
- Preserve legacy CI behaviour, flags, authorization gates, warnings, tooltips, and backend contracts.
- Finish sibling CI migration pieces documented in VAL-26640 and VAL-26642 where missing.

## Findings
- `domains/business-process/feature/src/lib/build-and-test` already contains the CI execution view and partial Build/Test sections.
- Build/Test step no longer has the Technical Reseed placeholder; it now renders the ported rxResource Technical Reseed section.
- Test section now renders the legacy Select TPK / Run TPK row before Config Audit and TPK results.
- Build section now renders commits and the Figma scenario/TPK details icon. Open Config Editor is a first-class environment-panel action behind an opt-in flag.
- `features/environment/src/lib/technical-reseed` is available as the legacy Technical Reseed reference.
- `domains/environment/data-access` already has `SystematicConfigAuditService` and unit tests, but no pact interaction was found.
- `mxevolve-environment-status-panel` already has an `[extraActions]` projection slot after Details.
- Existing legacy Build Environment details renders `mxevolve-view-environment-details-button` in the environment action row plus the aggregated scenario executions table; no dedicated scenario details icon exists there. For the new Figma right-side scenario details action, use the existing view/details affordance (`visibility`), not the guessed document/description icon. A regression spec now asserts `visibility` and rejects `description`.

## Work Log
- [x] Read VAL-26641 feature spec, design, story map, and test strategy.
- [x] Read VAL-26640 and VAL-26642 feature specs/story maps/test strategies.
- [x] Compared current domains Build/Test implementation with legacy MFE references.
- [x] Move Open Config Editor into `environment-status-panel` as opt-in main action.
- [x] Add Build details icon action using the existing view/details icon convention.
- [x] Add Test Select TPK / Run TPK row.
- [x] Implement Technical Reseed section and data-access from the `features/environment` reference.
- [x] Add Config Audit pact.
- [x] Implement or wire missing VAL-26640 Prepare Setup stage.
- [x] Implement VAL-26641 Send-for-review / Create MR trigger with CI-specific endpoints.
- [x] Implement VAL-26642 Merge stage shell, final product details widget, v2 backport summary, and v1 legacy backport states.
- [x] Add/adjust focused unit tests for the new data-access, Build/Test panels, Technical Reseed, Prepare Setup, Merge, Send for Review, Final Product Details, and Backports.
- [x] Attempt available test command and document the workspace blocker.

## Verification
- Attempted `npx nx test domains-business-process-feature --runInBand` from `/Users/khaledbaghdadi/Desktop/Active/web evolve/test-web`.
- Blocked before project discovery because this folder is not an Nx workspace: no `package.json`, `nx.json`, or `angular.json` exists under the scanned parent tree.

## Open Questions / Risks
- The docs still mark the exact systematic config-audit backend path as open. Current domains service uses `GET /projects/{projectId}/environments/{environmentId}/systematic-config-audit`, which matches the design assumption.
- Technical Reseed source parity notes:
  - Preserve legacy routes: `GET /projects/{projectId}/technical-reseed-execution-groups/{executionGroupId}` and `POST /projects/{projectId}/technical-reseed-execution-groups/{executionGroupId}/launch-reseed`.
  - Preserve launch gating from `launchesAllowed` and `reason`.
  - Preserve operation sorting by `createdOn` descending.
  - Intentional new-design difference from legacy: VAL-26641 requires all rows collapsed by default and status details shown with an info tooltip, not the legacy dialog.
- Current CI execution contract exposes `prepareBuildStage.latestScenarioExecutionId`; I did not find a separate Build/Test latest TPK details id on `buildAndTestStage`. The new details action is therefore guarded by the available scenario execution id instead of assuming a hidden field.
- Current CI execution contract and legacy MFE use `integrateChangesStage.latestMergeJobId`; docs sometimes say `latestMergeRequestId`. The new Merge stage keeps the backend/legacy field name and passes it to `mxevolve-merge-request-stepper` as its merge request id.
- VAL-26642 says the Merge step has no local feature flags/authorization of its own; behavior is preserved by keeping gating state-based and leaving route/host authorization untouched.
- This workspace is a sliced repo without a root `package.json`; test execution depends on the parent/full monorepo tooling being available outside this folder.
