# Story A — Foundation: Scaffold + env-panel slot (VAL-26641)

> Groups slices **S0 + S5**. Self-contained, AI-implementable. Must land **before** Story B, C, and D.
> **Migrate to the new domains architecture only — never depend on legacy.**

## Goal
Lay the foundation for the CI "Build & Test" step migration:
1. **S5 (first):** extend the shared `environment-status-panel` with a backward-compatible `[extraActions]`
   projection slot so Build (Story B) and Test (Story B) can each inject their own buttons without forking
   the shared component.
2. **S0 (second):** scaffold the new `build-and-test-process/` feature lib and wire the
   `build-and-test-step` body into the VAL-26634 stepper — with all top-level states (error, loading,
   cherry-pick alert, placeholder panels).

## Scope (what this story delivers)
- **S5:** optional `<ng-content select="[extraActions]">` slot in
  `web/libs/domains/environment/widget/.../environment-status-panel/` rendered after the Details button.
  Backward-compatible (no-op when slot is empty). Regression specs prove upgrade-process and prepare-setup
  env bars render unchanged.
- **S0:** new lib scaffold at
  `web/libs/domains/business-process/feature/src/lib/build-and-test-process/` (if not already created);
  `build-and-test-step.component` wired into the VAL-26634 stepper `"build-and-test"` step slot; all
  top-level conditional states; section ORDER preserved from legacy.

## Out of scope
- Build panel content (env bar, commits, chips) → **Story B**.
- Test panel content (Config Audit, TPK, scenario-runs) → **Story B**.
- Technical Reseed section → **Story C**.
- Send-for-review popup → **Story C**.
- MFE deletion → **Story D**.

## Figma & visual references
| Frame | Local PNG | URL | What it shows |
|-------|-----------|-----|---------------|
| `5651-143368` | `figma/5651-143368.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5651-143368 | Full page: run header + stepper (Prepare Setup → **Build & test** → Merge), Build panel expanded, Test collapsed — use to match the step layout and section order. |
| `5642-134873` | `figma/5642-134873.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5642-134873 | Overview variant showing the stepper state. |
| `9629-54097` | `figma/9629-54097.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9629-54097 | Run header: "Run - 000001" + amber **Pending Input** tag + red abort button. |

> **Open the PNGs with `view_image` before coding.** `5651-143368` shows the section order you must preserve.

## Visual spec (section ORDER — from Figma `5651-143368`)
The "Build & test" step body stacks sections top-to-bottom:
1. Error alert (if `errorMessage`)
2. Loading illustration (`create-branch`) when `!readyForBuildAndTest` (replaces legacy "please refresh" info-alert)
3. Cherry-pick alert (inline) when `cherryPickRunning` or `cherryPickFailed` — text SAME AS LEGACY
4. **Build** collapsible panel (placeholder in this story)
5. **Technical Reseed** collapsible panel — conditional, placeholder
6. **Test** collapsible panel (placeholder)
7. **Merge action** section (placeholder)

## Architecture conventions (MUST follow — upgrade-process template)
- Standalone components; `input.required<T>()` / `input<T>()`; `rxResource` for fetch; `computed()` / `signal()` / `effect()`.
- `host: { style: 'display: contents;' }` on step bodies.
- No NgRx; no `ngOnInit` fetch.
- Layout via `mxevolve-stage-container` + `mxevolve-business-process-content-container` (header/footer slots).
- Lazy `loadComponent` step body wired in the VAL-26634 run view's stepper (not a route — a step slot).
- Cross-domain imports via barrels only:
  `@mxevolve/domains/business-process/{feature,composite-widget,ui,data-access,util}`,
  `@mxevolve/domains/environment/widget`.
- **Nx boundary:** a domains lib MUST NOT depend on `web/libs/features/*` (tagged `type:legacy`).
- State changes → page-reload via the VAL-26634 state-updater (`reloadProcessDetails`). Errors → `ToastMessageService.showError(...)`.

## Verified component signatures to reuse
| Component / file | Selector / import | Relevant inputs |
|-----------------|-------------------|-----------------|
| `upgrade-process-execution-view.component.ts` | structural template | `rxResource` fetch pattern + `effect()` URL sync — copy this |
| `convert-binary-stage.component.ts` | structural template | step body with content-container + illustration pattern |
| `mxevolve-business-process-content-container` | `business-process/composite-widget` | collapsible panel; `title` input |
| `mxevolve-stage-container` | `business-process/composite-widget` | stage outer wrapper |
| `mxevolve-illustration` | `shared/ui/primitive` | `variant="create-branch"` for loading state |
| `environment-status-panel` (`domains/environment/widget`) | `mxevolve-environment-status-panel` | `label`, `environmentId`, `projectId` — **you are editing this in S5** |

## S5 — `environment-status-panel` slot extension

### What to build
- In `environment-status-panel.component.html`, add `<ng-content select="[extraActions]"></ng-content>`
  immediately **after** the Details button (in the same actions row), **inside the existing
  `*ngIf="!isLoading"` guard**.
- No changes to `@Input()` or `@Output()` of the component — pure slot addition.
- Document the slot contract in the component JSDoc/comment: `[extraActions]` = additional icon buttons or
  split-buttons projected by the consumer into the actions row.

### Tests (MANDATORY)
- **Slot present:** when consumer projects a `<button extraActions>`, it renders inside the actions row.
- **Slot absent / backward-compat:** when no `[extraActions]` content is projected, the panel renders
  **pixel-identically** to before (no empty `<ng-content>` gap). Cover this with:
  - A regression spec for the **upgrade-process** `environment-status-panel` usage.
  - A regression spec for the **prepare-setup** `environment-status-panel` usage.
- Run with `web-unit-test-runner` skill.

### DoD
- Slot renders extra content when provided; renders nothing when absent.
- Upgrade-process and prepare-setup regression specs green.
- Nx lint green (boundary not affected — purely additive).

---

## S0 — Feature scaffold + step shell

### Legacy source of truth (READ FIRST)
`web/apps/ci-process-mfe/src/app/ci-process/ci-process-execution/ci-process-execution-stages/build-and-test/build-and-test-stage.component.{ts,html}`

Build a **legacy parity checklist** by reading this file before writing a single line of new code.
Key items to preserve (already known):
- `errorMessage` → red error alert.
- `!readyForBuildAndTest` → loading (create-branch illustration), replacing the legacy info-alert "please refresh".
- `cherryPickRunning` → inline cherry-pick alert; text SAME AS EXISTING legacy text.
- `cherryPickFailed` → separate cherry-pick failed alert.
- Section ORDER: cherry-pick alert → Build → Technical Reseed → Test → Merge action.
- `skipEnvironmentDeployment` flag → when true, **hide** the Build Environment panel (Build section still visible but no env bar).
- `technicalReseedExecutionGroupId != null` → show Technical Reseed section (conditional).

### What to build
1. **Scaffold** `web/libs/domains/business-process/feature/src/lib/build-and-test-process/` (create if
   absent): `index.ts`, `build-and-test-process.routes.ts`, `build-and-test-step/` folder.
2. **`build-and-test-step.component.ts`** — standalone component with inputs:
   ```
   execution = input.required<BuildAndTestProcessExecution>()    // from VAL-26634 data-access
   stageStatus = input.required<StepStatus>()
   ```
   Renders the section-ordered body described in "Visual spec" above. Panel sub-components in this story
   are placeholder `<div>` stubs with `TODO: Story B` / `TODO: Story C` comments — actual panels land in
   B and C.
3. Wire the component into the VAL-26634 run view's stepper `"build-and-test"` step slot (a `loadComponent`
   assignment or equivalent — match the pattern used for other steps in the 26634 view).

### Tests (MANDATORY)
Unit spec via `render()` covering each top-level conditional branch:
- `errorMessage` set → error alert renders; loading illustration hidden.
- `!readyForBuildAndTest` + no error → loading illustration renders; panels hidden.
- `cherryPickRunning` + ready → cherry-pick running alert renders; text matches legacy exactly.
- `cherryPickFailed` + ready → cherry-pick failed alert renders.
- All conditions false → placeholder panel stubs render; no error/loading/cherry-pick alert.
- `skipEnvironmentDeployment=true` → Build panel stub hidden (env bar will also be hidden in Story B).

Mock: `BuildAndTestStateUpdaterService` via `componentProviders`. No NgRx in test module.

### DoD
- Step appears in the stepper when "build-and-test" is the active step.
- All top-level conditional states render correctly.
- Section ORDER matches Figma `5651-143368`.
- `nx lint` + affected unit tests green.

---

## Cross-feature edits (this story)
| What | Where | Status |
|------|-------|--------|
| **S5 slot** | `domains/environment/widget` `environment-status-panel` | This story adds it |
| Wiring step slot | VAL-26634 run view (owns the stepper) | Coordinate with 26634 owner; additive change |

---

## NON-NEGOTIABLE ENGINEERING RULES
```
1. Follow upgrade-process as the reference implementation (view rxResource, stepper, URL step sync,
   page-reload state-updater).
2. No NgRx. Use: standalone, input()/output(), computed(), rxResource, effect(), takeUntilDestroyed.
3. Errors via ToastMessageService.showError(...). State changes → reloadProcessDetails.
4. Reuse existing components. Read before using.
5. Tests MANDATORY: @testing-library/angular render() + ng-mocks MockComponent + plain-object service
   mocks with jest.fn(). Run with web-unit-test-runner skill.
6. For any contract/endpoint change add *.spec.pact.ts and verify with local-pact-verify skill.
7. ZERO BEHAVIOUR LOSS: build a legacy parity checklist from the named legacy files and cover every item.
8. Match Figma: view_image the PNGs listed above; match labels, order, colors, icons, empty states exactly.
```
