# Story C — Technical Reseed + Merge Trigger (VAL-26641)

> Groups slices **S3 + S4**. Depends on **Story A** (scaffold must exist).
> Can run **in parallel with Story B** — different folders, no shared edits between B and C.
> **Migrate to the new domains architecture only — never depend on legacy.**

## Goal
- **S3:** Port the Technical Reseed section from `features/environment` to `domains`, dropping NgRx
  (`ExecutionGroupsStoreModule`) in favour of `rxResource` and replacing the legacy `artifact-manager`
  `FinalProductService` with the domains artifact widget/service.
- **S4:** Port the Send-for-review / Create MR popup with its backport Yes/No toggle and on-demand
  backport run-definition multi-select to a standalone signals component. This is the trigger that hands
  off to the VAL-26642 Merge step.

## Scope (what this story delivers)
- New `technical-reseed-section/` component under `build-and-test-process/` — conditional panel, domains port.
- New `mxevolve-technical-reseed-section` widget under `domains/environment/widget` (or `domains/test/widget` —
  verify naming convention in the codebase before placing).
- New `send-for-review/` component under `build-and-test-process/` — Create MR popup + backport multi-select.
- All required authorizations, gating logic, and launch/submit flows preserved and tested.

## Out of scope
- Step scaffold + env-panel slot → **Story A** (prerequisite).
- Build panel (S1) + Test panel + Config Audit (S2) → **Story B**.
- MFE deletion → **Story D**.

## Figma & visual references

### S3 — Technical Reseed
| Frame | Local PNG | URL | What it shows |
|-------|-----------|-----|---------------|
| `9694-108129` | `figma/9694-108129.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9694-108129 | **Technical Reseed panel** expanded: "Technical Reseed" title + "Technical Reseed" launch button top-right; "List of Technical Reseed Executions"; expandable rows (status / Created On / commit id / dumpIds). |
| `9977-162920` | `figma/9977-162920.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9977-162920 | **Launch Technical Reseed dialog**: title "Technical Reseed", subtitle "Launch a new Technical Reseed operations", fields **Final Product Tag** ("Select a final product"), **Environment Definition** ("Select environment definition"), **Maintenance Level** ("Select maintenance level"), blue **Launch** button. |

### S4 — Merge trigger
| Frame | Local PNG | URL | What it shows |
|-------|-----------|-----|---------------|
| `9766-53383` | `figma/9766-53383.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9766-53383 | **Create MR popup** (Backport = No): Suggested MR Name, Destination Branch, Suggested Reviewers chips, "Do you want to Backport your Changes? *" Yes/No default No, Send button. |
| `9766-54658` | `figma/9766-54658.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9766-54658 | Same popup with **Backport = Yes** → "Select the Run definition for on-demand backport *" searchable checkbox multi-select revealed. |

> **Open all PNGs with `view_image` before coding.** Match the dialog fields and popup layout exactly.

## Visual spec

### Technical Reseed panel (from Figma `9694-108129`)
- Panel header: **"Technical Reseed"** + a blue **"Technical Reseed"** launch button top-right.
- Sub-header: "List of Technical Reseed Executions".
- **Empty state:** illustration "There are no technical reseeds launched".
- **Rows** (expandable via chevron, collapsed by default):
  - Row sub-title = TR name
  - **Status** tag — Passed = green check-circle / Running = blue clock / Failed = red x-circle.
    **Status click → info icon + tooltip (NO dialog — decision D4).**
  - **Created On** = date `|` time (platform format)
  - **Commit ID** = short format (blue link)
  - **dumpIds** = show 1 visible + comma-separated; **"see more / see less"** toggle for the rest.
- Rows are collapsed by default; chevron expands.

### Launch Technical Reseed dialog (from Figma `9977-162920`)
Title: "Technical Reseed" | Sub: "Launch a new Technical Reseed operations"
Fields:
1. **Final Product Tag** — dropdown "Select a final product" (list sourced from domains artifact service)
2. **Environment Definition** — dropdown "Select environment definition"
3. **Maintenance Level** — dropdown "Select maintenance level"
Footer: blue **Launch** button → `POST …/technical-reseed-execution-groups/{egId}/launch-reseed` → on success: page reload.

### Create MR popup (from Figma `9766-53383` + `9766-54658`)
Centered modal. Fields:
1. **Suggested Merge Request Name** — text input (VAL-prefix pre-filled when `hasPredefinedMergeRequestInputs`)
2. **Destination Branch** — dropdown (e.g. "Master Branch")
3. **Suggested Reviewers Names** — chip-input + search
4. **"Do you want to Backport your Changes? *"** — Yes/No toggle, default **No**
5. When **Yes** → reveal **"Select the Run definition for on-demand backport *"** — searchable checkbox multi-select (`backportMergeConfigurationIds`)
Footer: **Send** button → `POST …/user-input/send-changes-for-review`.

On-demand backport informative banner appears above the popup trigger when applicable.

## Architecture conventions (MUST follow — upgrade-process template)
- Standalone components; `input.required<T>()` / `input<T>()`; `rxResource` for all data fetching.
- `host: { style: 'display: contents;' }`.
- **No NgRx** — this is the core porting requirement for S3 (`ExecutionGroupsStoreModule` → `rxResource`).
- No `ngOnInit` fetch; no `artifact-manager` legacy imports.
- **Nx boundary:** domains libs MUST NOT depend on `web/libs/features/*` (`type:legacy`).
- Page reload on success via VAL-26634 state-updater (`reloadProcessDetails`). Errors via `ToastMessageService.showError(...)`.

## Verified component signatures to reuse / port

### S3 — Technical Reseed
| Source | Where to find | What to do |
|--------|--------------|------------|
| `features/environment/.../technical-reseed/technical-reseed.component.{ts,html}` | Legacy MFE | **Port to domains**: drop NgRx, replace `FinalProductService` |
| `features/environment/.../technical-reseed/technical-reseed-models.ts` | Legacy MFE | **Copy models** — status enum mapping, request/response types |
| `FinalProductService` (legacy `artifact-manager`) | `web/libs/features/artifact-manager/` | **Replace** with the equivalent domains artifact data-access service (read what exists in `domains/artifact/data-access` first) |
| `mxevolve-illustration` | `@mxevolve/shared/ui/primitive` | Empty state illustration |

### S4 — Send-for-review
| Source | Where to find | What to do |
|--------|--------------|------------|
| `ci-process-execution/common/send-for-review/send-for-review.component.ts` | Legacy MFE | **Port to standalone + signals** |
| `build-and-test-actions.component.ts` | Legacy MFE | **Port** merge-trigger, reopen, repush logic |
| `mergeDevelopmentState.canRepush` | From `BuildAndTestProcessExecution` (VAL-26634 model) | Gate Repush Backport button |

## Data-access migration — S3 Technical Reseed
All Technical Reseed API calls use **existing** gateway routes — no new endpoint:
- `GET /projects/{projectId}/technical-reseed-execution-groups/{egId}` — list executions.
- `POST /projects/{projectId}/technical-reseed-execution-groups/{egId}/launch-reseed` — launch a reseed.
  Request: `LaunchTechnicalReseedOperationRequest` (Final Product Tag, Environment Definition, Maintenance Level).

**Existing pact to verify:** `web/pacts/web-mxenv-management.json`.
After porting, run `local-pact-verify` skill to confirm the pact still passes against the new service.

## S3 legacy parity checklist (READ LEGACY FILE FIRST)
Legacy: `features/environment/.../technical-reseed/technical-reseed.component.{ts,html}`

Reproduce ALL of these (cover each with a test):
- [ ] Section only visible when `technicalReseedExecutionGroupId != null`
- [ ] Rows collapsed by default; chevron expands
- [ ] Status tag: Passed (green) / Running (blue) / Failed (red)
- [ ] Status click → **info icon + tooltip** (NOT a dialog — decision D4)
- [ ] `dumpIds`: first one visible; "see more" toggle reveals the rest
- [ ] Created On / commit id format matches legacy
- [ ] Launch button opens dialog with 3 fields (Final Product Tag, Environment Definition, Maintenance Level)
- [ ] Launch submits correct `LaunchTechnicalReseedOperationRequest` payload
- [ ] Success → page reload
- [ ] `infra-group` / `targetBranch` inputs if present in launch request
- [ ] Loading state during list fetch; error state shown via toast

## S4 legacy parity checklist (READ LEGACY FILES FIRST)
Legacy: `ci-process-execution/common/send-for-review/`, `build-and-test-actions.component.ts`

Reproduce ALL of these:
- [ ] Merge/"Send changes for review" button visible at bottom of the step
- [ ] Button disabled when stage status ≠ PENDING_INPUT (`isUserInterventionDisabled`)
- [ ] Create MR popup opens with correct default values
- [ ] `hasPredefinedMergeRequestInputs` true → MR name + destination pre-filled
- [ ] Backport toggle default = No; selecting Yes reveals on-demand run-definition multi-select
- [ ] `backportMergeConfigurationIds` array sent when backport = Yes
- [ ] On-demand backport informative banner (when applicable)
- [ ] `can-repush` (`mergeDevelopmentState.canRepush`) → Repush Backport button visible
- [ ] Repush Backport calls `POST …/repush-backport-merge-job`
- [ ] Reopen MR calls `POST …/reopen-merge-request`
- [ ] Success → page reload

## Tests (MANDATORY)

### S3 tests
- Visibility on (`technicalReseedExecutionGroupId` present) / off (null).
- Rows collapsed by default; expand on chevron click.
- Status tag: each status value → correct color + icon.
- Status click → tooltip renders (NOT a dialog; no `<p-dialog>` in DOM).
- dumpIds: 1 visible; "see more" reveals all; "see less" collapses.
- Launch dialog: 3 dropdowns render; submit fires `POST launch-reseed` with correct payload.
- Success → state-updater `reloadProcessDetails` called.
- Error → `ToastMessageService.showError` called.
- **Pact:** `web-mxenv-management` launch interaction still passes (`local-pact-verify` skill).

### S4 tests
- Merge button disabled when `isUserInterventionDisabled`.
- Popup opens; MR name pre-filled when `hasPredefinedMergeRequestInputs`.
- Backport Yes → multi-select revealed; No → hidden.
- Submit sends correct payload including `backportMergeConfigurationIds` when backport = Yes.
- `can-repush` false → Repush button hidden; true → visible + wired.
- Success → `reloadProcessDetails` called.
- Error → `ToastMessageService.showError` called.

Run all tests with `web-unit-test-runner` skill.

## Definition of Done

### S3
- Technical Reseed section matches Figma `9694-108129`; launch dialog matches `9977-162920`.
- **No NgRx** — `ExecutionGroupsStoreModule` completely gone; `rxResource` in place.
- **No `artifact-manager` import** — legacy `FinalProductService` replaced with domains equivalent.
- Pact (`web-mxenv-management`) passes locally.
- Affected tests green; `nx lint` clean.

### S4
- Popup matches Figma `9766-53383` (No) + `9766-54658` (Yes).
- All legacy auth/gating behaviours preserved and tested.
- Handoff to VAL-26642 Merge step works (send-for-review triggers the merge flow).
- Affected tests green; `nx lint` clean.

---

## NON-NEGOTIABLE ENGINEERING RULES
```
1. Follow upgrade-process as the reference implementation (rxResource, page-reload state-updater).
2. No NgRx. Use: standalone, input()/output(), computed(), rxResource, effect(), takeUntilDestroyed.
   S3: ExecutionGroupsStoreModule must be completely removed — this is non-negotiable.
3. Errors via ToastMessageService.showError(...). State changes → reloadProcessDetails.
4. Reuse existing components. Read the component signature before wiring it.
5. Tests MANDATORY: @testing-library/angular render() + ng-mocks MockComponent + plain-object service
   mocks with jest.fn(). Run with web-unit-test-runner skill.
6. For Technical Reseed launch pact: verify with local-pact-verify skill.
7. ZERO BEHAVIOUR LOSS: build parity checklists from the named legacy files and cover every item with a test.
   If something exists in code but not in Figma/wiki — KEEP it and flag it in the PR description.
8. Match Figma: view_image all PNGs listed above before coding. Match labels, order, colors, icons,
   dialog fields, and tooltip vs dialog distinction exactly (status click = tooltip, NOT dialog).
```
