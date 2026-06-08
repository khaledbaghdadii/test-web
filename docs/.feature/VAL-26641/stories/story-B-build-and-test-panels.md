# Story B — Build + Test Panels (VAL-26641)

> Groups slices **S1 + S2**. Depends on **Story A** (scaffold + env-panel slot must exist first).
> S1 and S2 can be implemented by the same developer in sequence, or in parallel by two developers
> (they live in separate folders). **Migrate to the new domains architecture only — never depend on legacy.**

## Goal
Build the two main content panels inside the Build & Test step:
- **S1 (Build panel):** "Build Environment" env-status-panel with Open Config Editor (flag-gated) +
  Repush-latest-TPK + TPK-Details in the `[extraActions]` slot, plus Jira story chips and the Commits table.
- **S2 (Test panel):** "Environment" env-status-panel with the new Config Audit split-button
  (including a NEW `domains/environment/data-access` service + pact), plus Select/Run TPK and
  TPK Results via `mxevolve-scenario-runs`.

## Scope (what this story delivers)
- New `build-section/` component under `build-and-test-process/` — collapsible Build panel.
- New `open-config-editor-button/` widget under `domains/environment/widget` (port from `features/environment`).
- New `test-section/` component under `build-and-test-process/` — collapsible Test panel.
- New `config-audit-button/` widget under `domains/environment/widget` (port from `features/environment`).
- **New** `SystematicConfigAuditService` + models under `domains/environment/data-access` **with unit + pact tests**.
- All required authorizations, feature flags, and permission warnings preserved and tested.

## Out of scope
- Step scaffold + env-panel slot → **Story A** (prerequisite).
- Technical Reseed section → **Story C**.
- Send-for-review popup → **Story C**.
- MFE deletion → **Story D**.

## Figma & visual references

### S1 — Build panel
| Frame | Local PNG | URL | What it shows |
|-------|-----------|-----|---------------|
| `9769-56255` | `figma/9769-56255.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-56255 | **Build panel** full: "Build" title + chevron; env actions bar with labels/buttons (see visual spec); story chips; Commits table. |
| `5651-143368` | `figma/5651-143368.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5651-143368 | Full page — Build panel in page context. |
| `9629-54091` | `figma/9629-54091.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9629-54091 | Branch Details link with rebase-needed warning tooltip. |

### S2 — Test panel
| Frame | Local PNG | URL | What it shows |
|-------|-----------|-----|---------------|
| `5657-145421` | `figma/5657-145421.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5657-145421 | **Test panel** expanded (empty state): env bar + Config Audit▾; Select TPK + Run TPK; TPK Results empty illustration. |
| `9769-55667` | `figma/9769-55667.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-55667 | Config Audit **dropdown** — CSV Report, HTML Report. |
| `9769-55602` | `figma/9769-55602.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-55602 | Config Audit **Running** — blue, clock icon. |
| `9769-55848` | `figma/9769-55848.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-55848 | Config Audit **Passed** — green, check-circle icon. |
| `9769-56395` | `figma/9769-56395.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-56395 | Config Audit **Failed** — red, x-circle icon. |

> **Open all PNGs with `view_image` before coding.** Match labels, button order, colors, and icons exactly.

## Visual spec

### Build panel (from Figma `9769-56255`)
Panel header: **"Build"** + collapse chevron top-right.
- **Row 1 — Environment actions bar:**
  - Label `Environment` + green `Ready` status tag
  - Blue action buttons: `Services ▾` `Open MX.3 ▾` `Connect DB ▾` `Connect Applicative ▾` `Copy`
  - Then (only when feature flag `workspace-configuration-editor-ui` is ON **and** NOT automerge): `Open Config Editor`
  - Vertical divider `│`, then `Details`
  - Icon buttons far-right: `⟳` (Repush latest TPK) + `▤` (TPK Details/report)
- **Row 2:** "You are working on the following story" + grey chips e.g. `VAL-125` `VAL-127`
- **Row 3:** "Commits on **Branch Name**" (branch name = blue link) + commits table:
  columns: **Commit ID** (short, blue link), **Description**, **User**, **Commit Date** (platform format)
- **Empty state (no commits):** illustration "There are no Commits on this branch"

### Test panel (from Figma `5657-145421`)
Panel header: **"Test"** + collapse chevron top-right.
- **Row 1 — Environment actions bar:**
  - Same base actions as Build EXCEPT no Repush/TPK-Details icons
  - **Config Audit ▾** split-button (see Config Audit button spec below)
  - NO `Open Config Editor` in Test
- **Row 2:** "Select a TPK that you wish to launch to validate your change *" → Select TPK dropdown + **Run TPK** button
- **Row 3:** "TPK Results" heading + helper text "The card will be displaying the most recent run of each TPK…"
  - Empty state: illustration "There are no run Results"
  - Populated: `mxevolve-scenario-runs` TPK cards + **Show Previous Runs ▾** expander

### Config Audit button states (by `resultStatus`)
| State | Button color | Icon |
|-------|-------------|------|
| Running (PENDING/STARTED) | blue | clock |
| Passed (PASS) | green | check-circle |
| Warning (WARNING) | amber | warning triangle |
| Failed (FAIL) | red | x-circle |
| Invalid/no data | grey | — |

Dropdown always shows: **CSV Report**, **HTML Report** (href from `artifacts[]`).
In-progress tooltip: "Config audit is running…"; INVALID tooltip: "Config audit is not available".

## Architecture conventions (MUST follow — upgrade-process template)
- Standalone components; `input.required<T>()` / `input<T>()`; `rxResource` for data; `computed()` / `signal()`.
- `host: { style: 'display: contents;' }`.
- No NgRx; no `ngOnInit` fetch.
- **Nx boundary:** domains libs MUST NOT depend on `web/libs/features/*` (`type:legacy`).
- Cross-domain imports via barrels: `@mxevolve/domains/environment/{widget,data-access}`,
  `@mxevolve/domains/test/widget`, `@mxevolve/domains/scm/widget`, `@mxevolve/domains/business-process/...`.

## Verified component signatures to reuse
| Component | Import barrel | Inputs relevant here |
|-----------|--------------|----------------------|
| `mxevolve-environment-status-panel` | `@mxevolve/domains/environment/widget` | `label`, `environmentId`, `projectId`; use `[extraActions]` slot (from Story A) |
| `mxevolve-merge-request-commits` / `mxevolve-branch-details` | `@mxevolve/domains/scm/widget` or `@mxevolve/domains/business-process/composite-widget` | For the Commits table — read the actual inputs before wiring |
| `mxevolve-commit-id-display` | `@mxevolve/shared/ui/primitive` | Formats short commit IDs |
| `mxevolve-scenario-runs` | `@mxevolve/domains/test/widget` | `projectId` (req), `subContextId`, `scenarioRunIds`, `showEnvironmentDetails`, `showHistory`, `warningMessageMap` |
| `RunScenarioDropdownComponent` | `@mxflow/test-management` (verify barrel) | Select + Run TPK |
| `mxevolve-illustration` | `@mxevolve/shared/ui/primitive` | `variant` — for empty states |
| **Source to PORT (Open Config Editor):** `features/environment/.../environment-workspace-configuration-editor-button/` | — | Port to signals; gate by `workspace-configuration-editor-ui` flag; hide in automerge |
| **Source to PORT (Config Audit):** `features/environment/.../environment-config-audit/button/` | — | Port to split-button widget; color by `resultStatus`; dropdown CSV/HTML |

## Data-access migration — S2 Config Audit (REQUIRED)

### New service: `SystematicConfigAuditService`
Location: `web/libs/domains/environment/data-access/src/lib/systematic-config-audit/`

**Endpoint (confirm exact path against backend before writing the pact — OQ4):**
`GET {gateway}/projects/{projectId}/environments/{environmentId}/systematic-config-audit`

**Models to port** from `features/environment/.../models/systematic-config-audit.models.ts`:
- `SystematicConfigAuditOperationsResponse` — `requestStatus` (PENDING/STARTED/ENDED/INVALID),
  `requestResultStatus` (SUCCESS/FAILURE/TIMEOUT/ABORTED), `configurationLintingResult` object.
- `ConfigurationLintingOperationResult` — `resultStatus` (PASS/WARNING/FAIL), `artifacts[]` (each with
  `type` CSV/HTML + `downloadUrl`), `mode` (FULL/DELTA).

**Unit test:** service method maps response correctly; error propagates.

**Contract test (`*.spec.pact.ts`):** new pact interaction under `web-mxenv-management` provider.
Interaction: `GET /projects/{projectId}/environments/{environmentId}/systematic-config-audit` returns
`SystematicConfigAuditOperationsResponse` shape. Verify with `local-pact-verify` skill.

> **OQ4 is still open** — verify the exact gateway URL path against the backend before writing the pact.
> If the path differs, update `decision-log.md` OQ4 as resolved.

## S1 legacy parity checklist (READ LEGACY FILE FIRST)
Legacy: `web/apps/ci-process-mfe/src/app/ci-process/ci-process-execution/ci-process-execution-stages/build-and-test/`
Specifically: `build-environment-details.component.{ts,html}` and `jira-user-stories.component.ts`

Reproduce ALL of these (cover each with a test):
- [ ] `workspace-configuration-editor-ui` feature flag ON → Open Config Editor button visible
- [ ] `workspace-configuration-editor-ui` feature flag OFF → button hidden
- [ ] Automerge mode → Open Config Editor hidden even when flag is ON
- [ ] `isUserInterventionDisabled` (stage status ≠ PENDING_INPUT/RUNNING) → Repush/Details icons disabled
- [ ] Commits table renders; empty state illustration when no commits
- [ ] Story chips render from `input()`/`rxResource` (NOT NgRx)
- [ ] Branch name in commits heading is a blue link to the branch

## S2 legacy parity checklist (READ LEGACY FILES FIRST)
Legacy: `build-and-test-run-scenario.component.{ts,html}`, `build-and-test-scenario-executions.component.{ts,html}`

Reproduce ALL of these:
- [ ] `config-audit` feature flag ON → Config Audit button visible
- [ ] Config Audit button color/icon correct per `resultStatus` (PASS/WARNING/FAIL)
- [ ] Config Audit button color correct per `requestStatus` (PENDING/STARTED/ENDED/INVALID)
- [ ] CSV Report and HTML Report links in dropdown
- [ ] `ScenarioExecutionGroupPermissionWarningMessage` — warning map passed to `scenario-runs`
- [ ] "A TPK is currently running…" guard (disable Run TPK when one is already running)
- [ ] Select TPK dropdown populated; Run TPK fires correct service
- [ ] TPK Results (`scenario-runs`) renders in-progress + populated + empty states
- [ ] Show Previous Runs expander works
- [ ] DumpIds visible in scenario-runs results

## Tests (MANDATORY)

### S1 tests
- Flag ON → Open Config Editor renders; flag OFF → hidden; automerge → hidden.
- `isUserInterventionDisabled` true → Repush/Details disabled.
- Chips render from input; empty when no stories.
- Commits table renders rows; empty-state illustration when no commits.
- Repush icon button wired to correct service call.

### S2 tests
- Config Audit service unit test (maps DTO → model; error propagates).
- Config Audit button: each `resultStatus` → correct color class; each `requestStatus` → correct state.
- Dropdown: CSV Report + HTML Report links resolve from `artifacts[]`.
- `can-run-tpk` flag (if present) gates Run TPK button.
- `ScenarioExecutionGroupPermissionWarningMessage` map passed to `scenario-runs`.
- `scenario-runs` renders; empty-state illustration when no results.
- **Pact:** new Config Audit interaction green (`local-pact-verify` skill).

Run all tests with `web-unit-test-runner` skill.

## Definition of Done

### S1
- Build panel pixel-matches Figma `9769-56255`; flags/permissions preserved & tested.
- Commits table matches Branch Details table (same component).
- Affected tests green; `nx lint` clean.

### S2
- Test panel pixel-matches Figma `5657-145421` + Config Audit states `9769-55602/55848/56395`.
- New `SystematicConfigAuditService` has unit tests + **passing pact** (local-pact-verify green).
- OQ4 resolved (gateway path confirmed) and noted in `decision-log.md`.
- Affected tests green; `nx lint` clean.

---

## NON-NEGOTIABLE ENGINEERING RULES
```
1. Follow upgrade-process as the reference implementation (view rxResource, stepper, page-reload state-updater).
2. No NgRx. Use: standalone, input()/output(), computed(), rxResource, effect(), takeUntilDestroyed.
3. Errors via ToastMessageService.showError(...). State changes → reloadProcessDetails.
4. Reuse existing components. Read the component signature before wiring it.
5. Tests MANDATORY: @testing-library/angular render() + ng-mocks MockComponent + plain-object service
   mocks with jest.fn(). Run with web-unit-test-runner skill.
6. For Config Audit endpoint: add *.spec.pact.ts and verify with local-pact-verify skill.
7. ZERO BEHAVIOUR LOSS: build parity checklists from the named legacy files and cover every item with a test.
   If something exists in code but not in Figma/wiki — KEEP it and flag it in the PR description.
8. Match Figma: view_image all PNGs listed above before coding. Match labels, order, colors, icons exactly.
```
