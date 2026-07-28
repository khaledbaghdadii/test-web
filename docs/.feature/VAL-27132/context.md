# VAL-27132: [UI/UX] Activities Landing Pages

## Jira Link
https://mxjira.murex.com/browse/VAL-27132

## Feature Details
- **Type:** Epic
- **Priority:** —
- **Branch:** feature/VAL-27132-activity-landing-pages
- **Workspace:** current repo (`C:\Users\kbaghdadi\Murex Projects\mxevolve\clone2\mxflow`)
- **Strategy:** branch
- **Plan format:** detailed (Large feature)
- **Component:** ATLANTIS

## Parent Chain
- VAL-27132 — [UI/UX] Activities Landing Pages (Epic, Backlog)

## Description
Introduce three new **Activity Landing Pages** under the new Nx domain architecture — one per
business-process activity: **Build & Test (CI Process)**, **Validation Activity**, and **Upgrade
Activity**. Each page gets a **new navigation tab placed first** (before "Business Processes"),
and shows that activity's executions (= "Process Runs") in **two AG Grid tables**:
- **Active Runs** — status `running` + `pending_input`
- **Show History** — every other status, revealed by a "Show History" button.

From each landing page a user can **start a new run** (formerly only possible from the "Available
Processes" page) via a **Build** button that opens a **generic multi-page dialog**:
- **Dialog Page 1** — Available **Process Templates** (BP definitions) for that activity, filtered
  by family, with a **Sub-Family** dropdown filter, paginated (size 5), and a **Run** action.
- **Dialog Page 2** — the selected template's **executor inputs** (per-family form), with internal
  back navigation (single dialog instance, no modal-on-modal).

This is a **re-skin + clean-code migration**, NOT a behaviour change. Legacy pages stay; this ships
as **new routes/components**. The wiki specs the **Build & Test** flow in depth; **Validation and
Upgrade are built to full parity** by extrapolating the same architecture (developer-confirmed).

The "Pending Input / Running" summary **cards** in the screenshots and the **search** icon in the
templates dialog and the "additional settings" panel are **out of scope**.

## Design References
> Real Figma frames and Jira screenshots were captured on 2026-06-30 (previously only treated as
> "design language"). Implementers should open these to match layout/visuals exactly:
- `devo/feature/VAL-27132/designs/jira-1901569.png` — full landing page (with the out-of-scope summary cards).
- `devo/feature/VAL-27132/designs/figma-5164-183241.png` + `devo/feature/VAL-27132/designs/figma-3138-28712.png` —
  high-res landing page (both tables, exact columns; the second shows the breadcrumb row).
- `devo/feature/VAL-27132/designs/figma-5162-181947.png` — landing header bar (title + My Build toggle + primary button).
- `devo/feature/VAL-27132/designs/jira-1901575.png` — Templates dialog (Page 1).
- `devo/feature/VAL-27132/designs/jira-1901576.png` — Executor dialog (Page 2).
> The frames `figma-5626-106812.png`, `figma-5626-106941.png`, `figma-8687-49793.png` rendered **blank**
> (empty container frames) and are ignored.

## Visual & Layout Details (captured designs, 2026-06-30)
> These govern layout/structure for the **Build & Test** screens; **Validation** and **Upgrade** use the
> same structure with per-activity labels. Design language governs styling, **not column completeness** —
> keep every legacy column/filter even when the static Figma omits it (see reconciliation notes per table).

**Top app navigation** — after the project name (e.g. "World Bank"): **Build & Test Activity → Validation
Activity → Upgrade Activity →** then existing Dashboard / Monitoring / Project Setup. Active tab highlighted.
A **breadcrumb** row "🏠 › {Project} › {Activity} Activity" sits above the page title.

**Landing header** — left = page title ("List of Build & Test runs"; Validation/Upgrade analogues); right =
a **"My Build" toggle** (label per activity if legacy differs) immediately left of a primary **"Build" button**
(the Run trigger). The out-of-scope summary cards row sits between header and tables (NOT built — see Out of Scope).

**Active Runs table** — section heading "Active Runs" with a right-aligned **Search** box and a **column-settings
gear** icon. Visible columns in order: **Name · Status · User Stories ID · Current Step · Step Details · Type ·
Branch Name · Actions**. Name + User Stories ID render as links. **Status** = colored badge (Pending Input =
amber/warning, Running = blue/info, history Passed = green/success, Cancelled = red/danger). **Actions** is
**sticky right** with two icon buttons: **repush** (blue refresh/repeat icon) + **abort** (red power icon).
Reconcile against the legacy CI table: keep any legacy columns/filters the Figma omits and flag discrepancies.

**Show History + Inactive Runs** — a **"Show History ⌄"** button below Active Runs toggles the second table.
History heading "Inactive Runs" with its **own Search** box. Visible columns in order: **Name · Status · User
Stories ID · Branch Name · Type · Owner · Start Date** — and per the Figma **NO Actions column** (history rows
are terminal). Reconcile against legacy: if legacy history exposes any row action, keep it and flag the discrepancy.

**Templates dialog (Page 1)** — title "**Build & Test Available Templates**" (analogues per activity) with an X
close. Below the title a "**Select Sub-Activity**" labeled dropdown (default "All"). A table with **Name ·
Description** columns and a per-row primary **Run** button (circle play-icon). Paginated size 5 (UI-side).

**Executor dialog (Page 2)** — header = **back chevron ‹** + the **template name** as the title + X close (the
same generic multi-page dialog navigating internally, not a new modal). Directly under the title a **collapsible
"{template name} Details" panel** with a chevron; expanding it reveals the **prefilled** definition fields (the
new design-language replacement for `input-view-resolver` — this is the "expand-arrow shows prefilled inputs"
requirement). Below it the input form shows only **non-prefilled** fields, grouped under section headings (e.g.
"**User Stories**"). The user-story row = a labeled "**User Story ID**" input with an inline validity-check icon
and a blue **"+" add** button (the magnifier/search icon in the mock is **not** needed — keep the feature-flagged
validation logic). Prefilled fields show read-only-style (e.g. "Run Name" = "Build - 000001", "Configuration Branch
Name" = "Branch-000001 / VAL-123-VAL-124"). An "**Additional settings**" expander near the bottom is OUT OF SCOPE.
A **centered primary "Build" button** submits (the execute endpoint). Horizontal scroll appears when many inputs show.

## Name Mapping (apply consistently in ALL new UI naming/labels)
| Legacy term | New UI term |
|---|---|
| BP Definition | **Process Template** |
| BP Execution / Business Process Execution / Business Process | **Process Run** |
| Process Family / Process Type / Process Name (grouping) | **Process Family** |
| Process Name (sub-grouping) | **Process Sub Family** |

> Code identifiers, enum values, and API payloads keep their existing names (e.g. `family.id`,
> `sourceDefinitionId`); only **user-facing** labels use the new vocabulary.

## Scope Decisions
- **Affected areas:** Frontend only (`web/`). No backend changes — endpoints already exist.
- **Activities (all three, full parity — developer-confirmed):** Build & Test, Validation, Upgrade.
- **Architecture:** NEW Nx domain architecture (`libs/domains/business-process/*`, `libs/shared/*`).
  Prefer **many small components**, each in the correct library type.
- **Design constraints:** Signals everywhere (signal / computed / linkedSignal / rxResource), AG Grid
  for tables, **Signal Forms** (`@angular/forms/signals`) for executor inputs, no `ngOnInit`/`viewchild`
  imperative form init. Errors surfaced via `ToastMessageService.showError` (keep any special-case
  handling verbatim where `showError` doesn't fit).

## Developer-Confirmed Decisions (interview)
1. **Full parity** for all 3 activities: landing tables + Build dialog + clean-code-migrated
   per-family executors (largest scope).
2. **Active/History population:** **two independent backend-paginated queries** to the same
   executions endpoint, each with a `statuses` filter (active = running,pending_input; history = rest).
3. **Generic multi-page dialog** lives in **`@mxevolve/shared/ui/primitive`** (pure presentational
   shell; pages projected by the business-process consumer — respects `scope:shared` dependency rule).
4. **Tables:** AG Grid **serverSide row model** + **custom header filter controls** mapped to the
   **same existing query params**; preserve **column order** and **every filter**; **sticky Actions**
   column. (Not AG Grid's built-in filter UI.)
5. **My Builds** = set `ownerPhrase = logged-in username` on the backend query (not a client filter).
6. **Repush modal opener is LEGACY and must be MIGRATED** to new-architecture code (data-access
   service + composite-widget component), then reused — not merely copied.
7. **Abort** reuses the existing new-arch `mxevolve-execution-abort-button`.
8. **Sub-Family dropdown values:** **derive dynamically for all three activities** (Build & Test,
   Validation, Upgrade) from the returned definitions' readable `name` field (shared `deriveSubFamilies`
   helper); no hardcoded list. (Revised 2026-06-30 — confirmed `DefinitionApiModel.name` /
   `BusinessProcessDefinition.name` is present; the six Build & Test wiki labels equal the base-definition
   `name` values and are kept only as a documented fallback/expected set.)
9. **Templates dialog family filter** (backend-verified): one call to
   `business-process/definitions?extendable=false&executable=true` (NOT paginated), then **UI-filter
   by `family.id`** — Build & Test → `user-story-build-and-test`, Validation → `master-validation`,
   Upgrade → `binary-upgrade`. Sub-family filter = `sourceDefinitionId`.
10. **Per-family executor components** (signals + Signal Forms) replace the generic legacy
    `definition-input` / `input-view-resolver`. Build & Test keeps a **distinct `backport`** component
    (sub-family `on-demand-backport`); each other family gets its own executor.
11. **User-story validation** stays gated behind the existing `user-story-validation-and-transition`
    feature flag via `FeatureFlagResolver` (`@mxflow/feature-flags`, imported as-is during transition).
12. **Feature flag `jira-user-story-archival`** still gates the validation executor's
    `validationScopeStartCommitId` field (keep its full visibility logic).

## Acceptance Criteria
> Each activity (Build & Test / Validation / Upgrade) gets the full set unless noted.

#### Navigation & routing
- AC-1: A new nav tab per activity is added at the **front of the header, before "Business Processes"**,
  in the order "Build & Test Activity", "Validation Activity", "Upgrade Activity" (tab order fixed
  2026-06-30). Each routes to its landing page.

#### Landing page — two tables
- AC-2: Landing page shows an **Active Runs** table (status `running` + `pending_input`) and a
  hidden **Show History** table (all other statuses) revealed by a "Show History" button.
- AC-3: Both tables use **AG Grid** with **backend pagination** (default page size **5** active,
  10 history) and preserve **the exact legacy columns in the exact legacy order**.
- AC-4: **Every legacy filter is preserved** (name, status checkbox, user-story ids, config branch,
  owner, date ranges, definition/process-name checkboxes, etc. per activity) and mapped to the same
  query params; column **sort** behaviour preserved.
- AC-5: A **My Builds** toggle (≡ legacy "My Executions") filters by `ownerPhrase = logged-in user`.
- AC-6: An **Actions** column is **sticky** and contains **Abort** (reused `mxevolve-execution-abort-button`)
  and **Repush** (migrated new-arch repush opener), with the same eligibility/authorization behaviour.
- AC-7: The N+1 bug is fixed — the per-page duplicate `issue-tracking/projects/{id}/project-details`
  calls are de-duplicated to a single shared call.

#### Start a run — generic dialog (Page 1: templates)
- AC-8: A **Build** button opens a **single multi-page dialog** that navigates internally between
  pages with a **back** button and never opens a modal-on-modal.
- AC-9: Dialog Page 1 lists **available Process Templates** for the activity: one call to
  `definitions?extendable=false&executable=true`, **UI-filtered by `family.id`**, **paginated (size 5)**.
- AC-10: A **Sub-Family** dropdown filters the templates — options **derived dynamically for all three
  activities** from each definition's readable `name` (for Build & Test these resolve to Configuration
  Build & Test, RTP Enrichment, RTP Build, RTP Test Adaptation, Technical Reseed, On Demand Backport).
  A per-row **Run** action opens Dialog Page 2 inside the same dialog.

#### Start a run — generic dialog (Page 2: executor)
- AC-11: Dialog title = the **template (definition) name**. Page 2 renders a **per-family executor
  form** (Build & Test, Backport, Validation, Upgrade) built with **signals + Signal Forms** — NO
  `viewchild`/`initializeForm`. **No field is lost** vs. the legacy executors.
- AC-12: An **expand arrow** beside the template name shows the **prefilled** definition fields using
  the **new design language** (a per-family display component replacing `input-view-resolver`); the
  form below shows **only the non-prefilled** fields (display logic migrated from the legacy
  `definition-input` `shouldShow` rules + `InputAccessMode`).
- AC-13: A **Run / Build** action submits to the existing per-family execute endpoint; success/redirect
  and error handling (toast `showError`, plus any special-case handling) preserved.
- AC-14: The **user-story validation** stays gated behind the `user-story-validation-and-transition`
  flag; the validation executor's `validationScopeStartCommitId` stays gated behind
  `jira-user-story-archival` with its full multi-condition visibility logic.

#### Cross-cutting (non-functional)
- AC-15: **No existing functionality is removed or changed** — legacy pages/services/feature-flags/
  authorization remain intact; this is purely additive (new routes/components).
- AC-16: Migrated data-access services have **unit tests + contract (Pact) tests**; every new/changed
  component has **unit tests** (Jest). All component→service calls use **rxResource** over explicit
  `subscribe` where possible.

## Assumptions
- **HIGH** — Active/History split is done with two separate paginated calls each carrying a `statuses`
  filter the `ci-process`/`master-validation`/`binary-upgrade` executions endpoints already accept —
  wrong → table data is incorrect / pagination breaks → confirmed (decision #2).
- **HIGH** — All three executions endpoints (`executions/ci-process`, `executions/master-validation`,
  `executions/binary-upgrade`) accept the same `page/pageSize/statuses/ownerPhrase/hidden/sort` query
  shape as the legacy CI table — wrong → per-activity query mapping must change. (Validated for CI &
  validation via existing services; upgrade mirrors via `UpgradeProcessListingService`.)
- **MED** — The reused sub-input selector components (`InfraGroupSelector`, `ScenarioDefinitionSelector`,
  `NotificationsRecipientsInput`, `FactoryProductSelector`, `UpgradeJumpSelector`, `EnvironmentDefinitionSelector`)
  remain usable as-is from legacy `libs/ui/inputs` (cross old/new imports allowed) rather than being
  re-migrated — wrong → extra migration steps per selector.
- **MED** — The generic dialog shell can satisfy "dialog title = definition name" and the expand-arrow
  prefilled panel purely via projected content / inputs without activity-specific logic — wrong →
  dialog gains per-activity coupling.
- **MED** — AG Grid serverSide row model with custom (non-built-in) header filter controls can
  reproduce every legacy PrimeNG filter 1:1 — wrong → some filters need bespoke renderers.
- **LOW** — Real Figma frames + Jira screenshots are now **captured** (2026-06-30; see Design References &
  Visual & Layout Details) and define concrete layout/columns/dialog chrome; only unspecified runtime states
  (loading/error/empty edge visuals) are extended from the existing new-arch design system.
- **LOW** — Sub-Family dropdown labels for **all three activities** derive readably from each definition's
  `name` field on the returned definitions — ✅ confirmed 2026-06-30 (`DefinitionApiModel.name`).

## Edge Cases & Error Handling
- Empty Active Runs / History tables → AG Grid no-rows overlay (reuse `TableNoRowsOverlayComponent`).
- Executions/definitions/execute call failures → `ToastMessageService.showError`; preserve any legacy
  special-case messaging (e.g. eligibility-denied repush messaging).
- Repush **eligibility**: keep the `getBusinessProcessExecutionEligibility` gate before showing the
  per-family repush modal; disable the action while in-flight (`[(disabled)]`).
- Abort visibility/eligibility driven by `status` + `familyId` (reuse existing button's rules).
- User-story validation: flag OFF → no validation; flag ON → validate via `ValidateUserStoryService`,
  surface `errorMessage` inline (keep behaviour).
- `validationScopeStartCommitId` hidden unless ALL of: flag `jira-user-story-archival` on, `official`,
  `businessProcessQualityLevel === "MQG"`, resolvable parent branch, and the create/parent-branch
  rule — clear validators + reset when hidden.
- Templates dialog: definitions list is **not** backend-paginated → load once, filter + paginate (5)
  on the UI; empty-after-filter → empty-state.
- N+1 jira-details: dedupe to a single shared `getJiraDetails(projectId)` call per page (not per row).

## Integration Points (verified)
**Executions (Active/History tables) — GET, backend-paginated**
- Build & Test: `projects/{projectId}/business-process/executions/ci-process` →
  `BuildAndTestExecutionsService.getBuildAndTestExecutions` (`@mxevolve/domains/business-process/data-access`).
- Validation: `projects/{projectId}/business-process/executions/master-validation` →
  `ValidationProcessListingService.getValidationProcessExecutions`.
- Upgrade: `projects/{projectId}/business-process/executions/binary-upgrade` →
  `UpgradeProcessListingService.getBinaryUpgradeExecutions`.
- Common params: `page, pageSize, statuses, ownerPhrase, hidden=false, sort=startDate,desc` + per-activity filters.

**Templates (Dialog Page 1) — GET, NOT paginated**
- `projects/{projectId}/business-process/definitions?extendable=false&executable=true`
  → legacy `BusinessProcessDefinitionService.getBusinessProcessDefinitions` (to be **migrated** to
  new-arch `data-access` with a contract test). Returns `DefinitionApiModel[]` with `family.id`,
  `sourceDefinitionId`, `processName`, `providedInputs`. UI filters by `family.id` (+ `sourceDefinitionId`).

**Execute (Dialog Page 2 Run/Build) — POST**
- Build & Test: `…/executions/ci-process` → `BuildAndTestProcessExecutorService`.
- Backport: `…/executions/ci-process/backport` → `BackportProcessExecutorService`.
- Validation: `…/executions/master-validation/execute` → `ValidationProcessExecutorService`.
- Upgrade: `…/executions/binary-upgrade/execute` → `UpgradeProcessDefinitionExecutorService`.

**Repush (Actions) — to be migrated**
- Eligibility: `GET …/business-process/executions/eligibility?familyId=&baseDefinitionId=` →
  `BusinessProcessExecutionEligibilityService` (migrate to new-arch data-access + contract test).
- Per-family repush modals (Build&Test / Validation / Upgrade) migrate to new-arch composite-widget.

**Abort (Actions) — reuse as-is**
- `mxevolve-execution-abort-button` (`@mxevolve/domains/business-process/composite-widget`).

**Jira details (N+1 fix)**
- `GET issue-tracking/projects/{projectId}/project-details` → `JiraDetailsService.getJiraDetails`
  (`@mxevolve/domains/business-process/data-access`) — call once per page, share.

**Feature flags**
- `user-story-validation-and-transition` and `jira-user-story-archival` via `FeatureFlagResolver`
  (`@mxflow/feature-flags`).

**Sub-input selectors (reused as-is from `libs/ui/inputs`, cross old/new allowed)**
- `BusinessProcessInfraGroupSelectorComponent` (InfraGroupsService), `BusinessProcessScenarioDefinitionSelectorComponent`
  (TestDefinitionService), `BusinessProcessNotificationsRecipientsInputComponent` (ProjectUsersFetcherService),
  `BusinessProcessFactoryProductSelectorComponent`, `BusinessProcessUpgradeJumpSelectorComponent` (static),
  `BusinessProcessEnvironmentDefinitionSelectorComponent` (EnvironmentService), `UserStoryInputComponent`,
  `ReviewersAutoCompleteComponent` (ReviewersService — backport).

## Codebase Observations
**New-architecture business-process domain** (`web/libs/domains/business-process/`): `feature`,
`composite-widget`, `widget`, `ui`, `data-access`, `util`. Aliases `@mxevolve/domains/business-process/{type}`
and `@mxevolve/shared/{category}/{name}`. `scope:shared` may only depend on `scope:shared`.

**Patterns to follow**
- **AG Grid serverSide:** `web/libs/domains/scm/widget/src/lib/paginated-commits-difference/…` —
  `rowModelType: "serverSide"`, `paginationPageSize`, `cacheBlockSize`, `IServerSideDatasource.getRows`.
- **rxResource:** `branch-details.component.ts`, `keep-environments-table.component.ts` (composite-widget)
  — `{ params: () => …, stream: ({params}) => obs.pipe(catchError → showError) }`.
- **Dialog:** new arch uses PrimeNG `p-dialog` directly (e.g. `management-request-metrics-dialog`,
  `proceed-from-quality-gate-wizard` with internal stepper). No generic multi-page dialog exists yet
  in `libs/shared` → **greenfield** (build in `@mxevolve/shared/ui/primitive`).
- **Signal Forms:** none in the repo yet → greenfield; current code uses reactive forms + `toSignal`.

**Legacy sources of truth to migrate (keep behaviour verbatim)**
- CI table: `…/build-and-test/build-and-test-executions/legacy/ci-process-executions/…` — columns
  (in order): Execution Name, Status, User Stories IDs, Configuration Branch Name, Owner, Start Date,
  End Date, Expiry Date, Days Extended, Duration, Business Process Definition, Process Name. Owner
  hidden when My Executions on. Jira details fetched once in `ngOnInit` (verify dedupe).
- Validation table columns: Execution Name, Status, Official Status, BP Quality Level, Owner,
  Start/End/Expiry Date. Upgrade mirrors via `BinaryUpgradeExecutionsTableComponent`.
- `my-executions-toggle` (`@mxflow` legacy) — filter `ownerPhrase` by username; migrate to a new-arch
  My Builds widget that sets the `ownerPhrase` query param.
- Repush opener: `web/apps/shell/.../business-process-execution-repush-modal-opener/…` — selector
  `mxevolve-business-process-execution-repush-modal-opener`, inputs `projectId, processId, familyId,
  familyName, sourceDefinitionId, [(disabled)]`, eligibility gate then per-family modal (Upgrade /
  Validation / BuildAndTest repushers). **Migrate** service + opener + 3 family modals to new arch.
- Definitions table + execute modal opener: `web/apps/shell/.../business-process-definition/…` —
  `openModalBasedOnFamily()` dispatch by `family.id` + `sourceDefinitionId === "on-demand-backport"`.
- Executors & their input components (legacy `libs/features/business-process`): build-and-test,
  backport, validation, upgrade — full field lists captured (see Integration Points); each uses
  `@ViewChild … initializeForm(projectId, definition.providedInputs)` → migrate to signals + Signal Forms.
- Field display logic: `definition-input.component.ts` `shouldShow` = `forceShow ||
  ACCESS_ALL_INPUTS || (ACCESS_INVALID_INPUTS_ONLY && control.invalid) ||
  (ACCESS_EMPTY_OPTIONAL_INPUTS && empty)` — this drives "show only non-prefilled". `input-view-resolver`
  (`mxevolve-input-view`, `InputField` map + `@switch(resourceType)`) → replace with per-family
  hardcoded display components.

**Backend grounding (verified, no backend changes)**
- `definitions` endpoint NOT paginated; no family filter param → UI filters `family.id`.
- Families (`families.yaml`) & sub-families (`base-definitions.yaml` → `sourceDefinitionId`):
  - `user-story-build-and-test` → configuration-build-and-test, rtp-enrichment, rtp-build,
    rtp-test-adaptation, technical-reseed, on-demand-backport
  - `master-validation` → master-validation, initial-rtp-greening, incremental-rtp-greening
  - `binary-upgrade` → continuous-rtp-greening, patch-upgrade, subsequent-rtp-greening

## Out of Scope
- Removing or modifying legacy pages, routes, services, or MFEs (additive only).
- The "Pending Input / Running / …" summary **cards** at the top of the landing screenshots.
- The **search** box in the templates dialog and the "additional settings" panel in the executor.
- Backend changes (all endpoints already exist).
- Re-migrating the leaf sub-input selector components (reused as-is from `libs/ui/inputs`).
