# Story A — Merge step + Final Product Details (VAL-26642)

> Groups slices **S1 + S2 + S3 + S6**. Self-contained, AI-implementable. Mirrors the already-migrated
> Upgrade Process integrate-changes stage. **Migrate to the new domains architecture only — never depend on legacy.**

## Goal
Migrate the CI / Build & Test **merge step** (a.k.a. "Integrate Changes") from the legacy MFE
(`web/apps/ci-process-mfe`) into the **domains/business-process** stack, plus add the new **Final Product Details**
section. Visual + behavioural parity with the legacy merge step; new UI per Figma.

## Scope (what this story delivers)
- A new CI execution view + integrate-changes stage under
  `web/libs/domains/business-process/feature/src/lib/build-and-test-process` (NEW).
- Merge tab composed from existing shared widgets (parity with Upgrade).
- A **new Final Product Details widget** in `domains/artifact/widget` (+ new service in `domains/artifact/data-access`).
- Decision / Stopped states + info alerts (S6).
- All required **data-access services + models migrated to domains, with unit tests AND contract (pact) tests.**

## Out of scope
- Backports tabs (v1 legacy + v2 ag-grid) → **Story B**.

## Figma & visual references
| Ref | What it shows |
|-----|---------------|
| [9769-56784](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9769-56784&m=dev) | Merge step — under-review state |
| [9769-57183](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9769-57183&m=dev) | Merge step — review variant |
| [10333-56610](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=10333-56610&m=dev) | Merge step — merged state |
| [9969-144576](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9969-144576&m=dev) | New Final Product Details design |
| `devo/.feature/VAL-26642/wiki-context/img1.png` | FP failure state |

## Architecture conventions (MUST follow — upgrade-process template)
- Standalone components; `input.required<T>()` / `input<T>()`; `rxResource` for fetch; `computed()`/`signal()`/`effect()`.
- `host: { style: "display: contents;" }`; no NgRx; no `ngOnInit` fetch.
- Layout via `mxevolve-stage-container` + `mxevolve-business-process-content-container` (header/footer slots).
- Lazy `loadComponent` route added to `web/apps/shell/.../business-process-routing.module.ts`.
- Cross-domain imports via barrels only: `@mxevolve/domains/business-process/{feature,composite-widget,ui,data-access,util}`,
  `@mxevolve/domains/scm/widget`, `@mxevolve/domains/artifact/{widget,data-access}`.
- **Nx boundary:** a domains lib MUST NOT depend on `web/libs/features/*` (tagged `type:legacy`).

## Verified component signatures to reuse (from real source files)
| Component (barrel) | Selector | Inputs |
|--------------------|----------|--------|
| `IntegrateChangesStageComponent` (upgrade-process) — structural template | — | `projectId`, `processId`, `latestMergeRequestId`, `developmentId`, `stageStatus`, `supportsResourceManagement`, `parentBranchName` |
| scm/widget | `mxevolve-merge-request-stepper` | `mergeRequestId`, `projectId` |
| composite-widget | `mxevolve-retry-merge-request` | `projectId`, `processId`, `developmentId`, `supportsResourceManagement`, `parentBranchName`, `stageStatus` |
| composite-widget | `mxevolve-fix-issues` | `projectId`, `processId`, `stageStatus` |
| feature (template ref) | `UpgradeProcessExecutionViewComponent` | `projectId`, `executionId` — uses `ExecutionFetcherService`, `rxResource`, `steps` computed, `selectedStepId` synced to `?step=` query param |

## Data-access migration (REQUIRED — new architecture, no legacy reliance)
Every service + model this story needs must be **migrated into the new domains data-access libs**, each with its
**unit tests AND contract (pact) tests**. Copy from the legacy CI MFE / `features/*` equivalents, then **enhance** to
match the new code (signal/`inject()` style, new model shapes, new barrels). **Do NOT import or depend on legacy libs.**

**In `domains/business-process/data-access`:**
- **CI execution fetcher service + models** — returns the Build & Test execution including: `ciVersion`,
  `backportRequested`, `willPublishFinalProduct`, `finalProductId`, `backportFinalProductId`,
  `integrateDestinationBranch`, the merge stage + `latestMergeRequestId`, `developmentId`,
  `supportsResourceManagement`, `parentBranchName`, and stage statuses.
  - Source to copy/enhance: legacy `ci-process-execution` state/services in `web/apps/ci-process-mfe`.
- **Merge / user-input action services** (send-changes-for-review, reopen-merge-request, fix-integration-issues) —
  these already exist in `domains/business-process/data-access` (Upgrade uses them). **Reuse** them; only add a
  CI-specific payload/model if the request body differs. Endpoints unchanged.

**In `domains/artifact/data-access` (only `factory-product` exists today — final-product is NEW):**
- **FinalProductService + models** — fetch a final product by `finalProductId`; expose in-progress / success / failure
  states needed by the FP widget.
  - Source to copy/enhance: legacy final-product service in `web/libs/features/artifact-manager`.

**Contract (pact) tests — convention:**
- New domains data-access libs currently have **no** pact tests. Add them to the **shared
  `web/libs/contract-tests/src/lib/`** lib (pattern: `scm-service.spec.pact.ts`), importing the **new** domains
  services via their barrels. Providers:
  - `business-process-execution-service` (CI execution fetch + user-input actions).
  - `artifact-management-service` (final product fetch).
- Reuse matchers from the legacy CI pact
  `web/apps/ci-process-mfe/src/contracts/business-process-execution-service.spec.pact.ts` and **enhance** for the new
  model fields.
- Verify locally with the **local-pact-verify** skill before merge.

## Tasks (ordered)
1. **Data-access first.** Create the CI execution fetcher service + models in `domains/business-process/data-access`
   (copy/enhance from legacy CI MFE). Add unit tests + pact test in `web/libs/contract-tests`.
2. Create `FinalProductService` + models in `domains/artifact/data-access` (copy/enhance from legacy artifact-manager).
   Add unit tests + pact test in `web/libs/contract-tests`.
3. **S1 — Scaffold:** Create `build-and-test-process` feature lib; CI execution view (`projectId`, `executionId`)
   using `rxResource` + the new fetcher; `steps` computed; `selectedStepId` synced to `?step=`; integrate-changes
   stage shell. Wire lazy route in the shell. Expose `ciVersion`/`backportRequested`/`willPublishFinalProduct`/
   `finalProductId` to the stage.
4. **S2 — Merge tab:** Compose `mxevolve-merge-request-stepper` + branch-details + `mxevolve-retry-merge-request` +
   `mxevolve-fix-issues` + send-for-review/reopen. Replicate state-based button gating (`areActionsDisabled`,
   `ciProcessStatus === FAILED`). Match Figma 9769-56784 / 9769-57183 / 10333-56610.
5. **S3 — Final Product Details:** Build `mxevolve-final-product-details` in `domains/artifact/widget` (`type:widget`,
   `scope:artifact`); render when `willPublishFinalProduct` && `finalProductId`; in-progress shows `-` placeholders;
   success + failure (banner) states. Wire optional `finalProductId` into the stage. Match Figma 9969-144576 + img1.
6. **S6 — Decision/Stopped + alerts:** integrate-changes-decision (Stopped + requester), info alerts wording.

## Acceptance criteria
- CI merge step loads via the shell route in `domains/business-process`, mirroring upgrade-process structure.
- Merge tab is visually + behaviourally at parity with the Upgrade merge step; all actions work; gating is state-based.
- Final Product Details renders **only** when `willPublishFinalProduct` && `finalProductId`; covers in-progress (`-`),
  success, and failure states; lives in `domains/artifact`; **no** dependency on `type:legacy` artifact-manager.
- No feature flags / authorization added to the merge step (parity — it had none).
- **All consumed data-access is migrated to domains** with unit tests + passing contract (pact) tests; nothing imports legacy.

## Tests
- Unit: execution view renders the correct stage by status; fetcher maps CI fields; FP widget state branches; merge
  button enable/disable per state; user-input actions call correct services.
- Contract: pact specs for `business-process-execution-service` (execution + actions) and `artifact-management-service`
  (final product), verified via local-pact-verify.

## Definition of Done
- Lint + Nx module boundaries pass (no domains→legacy edges).
- Unit + contract tests green.
- Visual/behavioural parity confirmed against legacy merge step and the referenced Figma nodes.
