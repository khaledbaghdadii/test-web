# Implementation Prompts — CI Build & Test migration (4 features + MFE tail)

> Paste-ready prompts for your implementation agent (Story Architect / Devo). **Order:**
> **Wave 1:** VAL-26634 (foundation, alone) → **Wave 2 (parallel):** VAL-26641 + VAL-26640 →
> **Wave 3:** VAL-26642 → **Tail:** MFE removal (S6).
>
> Every prompt embeds the **shared rules** below. Keep them in each prompt so any agent picking up a
> single story still gets them.

---

## SHARED RULES (include in every prompt)
```
NON-NEGOTIABLE ENGINEERING RULES (apply to every file you touch):
1. Follow the already-migrated UPGRADE process as the reference implementation:
   web/libs/domains/business-process/feature/src/lib/upgrade-process/ . Match its patterns for the
   view (rxResource fetch), stepper, URL `step` sync via effect(), and the page-reload state-updater.
2. New-architecture only — NO NgRx. Use: standalone components, input()/output() signals, computed(),
   linkedSignal(), rxResource (from @angular/core/rxjs-interop), effect(), takeUntilDestroyed.
   Follow the repo skills `signals-and-observables` and `component-communication`.
3. Error handling via ToastMessageService.showError(...) — never swallow errors. State changes that
   need fresh data trigger the page-reload state-updater (reloadProcessDetails), like upgrade-process.
4. Reuse existing components; do not rebuild. Confirm inputs by reading the component before using it.
5. TESTS ARE MANDATORY and must be written using the repo skills `unit-testing` and
   `web-unit-test-runner`. Use @testing-library/angular render() + ng-mocks MockComponent + plain-object
   service mocks with jest.fn(); mock the state-updater via componentProviders. RUN the affected tests
   with the web-unit-test-runner skill (it avoids the Jest 30 + Nx hang) and make them green before done.
6. For any contract/DTO/endpoint change, add/update *.spec.pact.ts and verify with the
   `local-pact-verify` skill.
7. ZERO BEHAVIOUR LOSS: before implementing, open the exact LEGACY file(s) named in the story and build
   a parity checklist of every behaviour, authorization, feature flag, state guard, tooltip, confirmation
   and empty state. Reproduce ALL of them and cover each with a test. If something exists in code but is
   missing from Figma/wiki, KEEP it and flag it in the PR description. Do not drop anything silently.
8. Match the new Figma. For EVERY UI story you MUST open the design before coding:
   (a) open the committed PNG export with view_image at
       docs/.feature/<FEATURE_ID>/figma/<frame>.png  (these are in the repo, no auth needed), AND/OR
   (b) fetch the live node via the `query-figma` skill using the file key + node id listed in the story.
   For VAL-26641 the file key is 8Z7emdDFkZapK3nmVP2HsA and the index of every frame (local PNG + URL +
   description) is docs/.feature/VAL-26641/figma-reference.md . Each story file in stories/ also embeds a
   textual "Visual spec (from Figma)" — treat it as the contract and match labels, order, colors, icons,
   empty states and tooltips exactly.
9. Before merging the foundation-dependent stories, ensure VAL-26634 is merged. Run nx affected lint +
   unit for your touched projects.
```

---

## WAVE 1 — VAL-26634 (foundation) — run ALONE, first
```
You are implementing VAL-26634: the CI (Build & Test) run SHELL for the new domains architecture.
Read docs/.feature/VAL-26634/ for the full design and its stories/ folder (implement in order):
  - stories/story-1-data-access-and-stepper.md
  - stories/story-2-run-details-widget.md
  - stories/story-3-run-header.md
  - stories/story-4-execution-view-and-mfe-wiring.md
This is the foundation all other CI stages depend on.

Scope:
- New CI run view in domains mirroring upgrade-process-execution-view: rxResource fetch of the CI
  execution, a <mxevolve-stepper> with steps Prepare Setup → Build & test → Merge, selectedStepId synced
  to the URL `step` query param via effect(). Run header (name, status tag, Expires chip, Activity Run
  Details link, Branch Details link, abort power button) and run stepper.
- CI data-access: ExecutionFetcherService-style service GET
  /gateway/projects/{projectId}/business-process/executions/ci-process/{id} → BuildAndTestProcessExecution
  model + a CI state-updater (page reload) mirroring UpgradeProcessStateUpdaterService.
- Add the new StepStatus "skipped" to mxevolve-stepper (web/libs/shared/ui/primitive/.../stepper) and the
  step status mapping; keep existing statuses intact.
- Create-branch illustration wiring; remove old header usage from the legacy MFE only where 26634 owns it.

Apply the SHARED RULES above. Specifically:
- Mirror upgrade-process exactly for the view/stepper/state-updater.
- Write unit tests (render()) for: fetch success/error (ToastMessageService), step URL sync, "skipped"
  status rendering, header pieces. Add/adjust the CI data-access pact (business-process-execution-service)
  and verify with local-pact-verify.
- Parity: diff against the legacy ci-process-execution view/header/stepper; preserve every behaviour.

Deliver: working stepper shell with empty step bodies (placeholders), data-access + model + state-updater,
"skipped" status, all tests green. This unblocks 26640/26641/26642.
```

---

## WAVE 2A — VAL-26641 (Build & Test step) — run in PARALLEL with 26640
```
You are implementing VAL-26641: the CI "Build & test" STEP BODY in the new domains architecture.
Read the full design in docs/.feature/VAL-26641/ (feature-spec.md, design.md, story-map.md,
test-strategy.md, decision-log.md), refinement/figma-notes.md, and figma-reference.md.
VAL-26634 must be merged first.

This feature is sliced into 4 self-contained stories under docs/.feature/VAL-26641/stories/ — implement
them in this order:
  1. stories/story-A-foundation.md  (S0 + S5)  -- MUST land first; blocks B and C
  2. stories/story-B-build-and-test-panels.md  (S1 + S2)  -- after A
  3. stories/story-C-technical-reseed-and-merge-trigger.md  (S3 + S4)  -- after A; can run parallel with B
  4. stories/story-D-mfe-removal.md  (S6)  -- LAST; after B, C and sibling features 26640/26642 are merged

Target lib: web/libs/domains/business-process/feature/src/lib/build-and-test-process/ (Story A creates the
scaffold if it does not exist — OQ5). Legacy source of truth to migrate (lose nothing):
web/apps/ci-process-mfe/src/app/ci-process/ci-process-execution/ci-process-execution-stages/build-and-test/ .

BEFORE coding each story, OPEN its Figma: view_image the committed PNGs under
docs/.feature/VAL-26641/figma/ (and/or fetch via the query-figma skill, file key 8Z7emdDFkZapK3nmVP2HsA).
The full frame index is docs/.feature/VAL-26641/figma-reference.md; each story file names its PNGs and
embeds a textual "Visual spec (from Figma)" you must match exactly. Key frames per story:
- Story A (scaffold) ... figma/5651-143368.png, figma/5642-134873.png, figma/9629-54097.png
- Story B (Build) ....... figma/9769-56255.png, figma/5651-143368.png, figma/9629-54091.png
- Story B (Test) ........ figma/5657-145421.png, figma/9769-55667.png, figma/9769-55602.png,
                          figma/9769-55848.png, figma/9769-56395.png
- Story C (Tech Reseed) . figma/9694-108129.png, figma/9977-162920.png
- Story C (Merge trigger) figma/9766-53383.png, figma/9766-54658.png

Each story file contains its OWN legacy parity checklist, verified component signatures to reuse,
data-access migration requirements, test list, and DoD. Follow them exactly. Highlights:
- Story A / S5: extend the SHARED domains/environment/widget environment-status-panel with an OPTIONAL
  [extraActions] content-projection slot; regression-test upgrade-process and prepare-setup env bars.
- Story A / S0: build-and-test-step body wired into the 26634 stepper "build-and-test" step (error /
  loading illustration / cherry-pick alert / placeholder panels), preserving the legacy section ORDER.
- Story B / S1: Build panel — Open Config Editor (NEW domains widget, flag workspace-configuration-editor-ui,
  HIDE in automerge) + Repush + TPK-Details in [extraActions]; Jira story chips (input()/rxResource, NOT NgRx);
  Commits table reusing merge-request-commits/branch-details.
- Story B / S2: Test panel — NEW mxevolve-config-audit-button (color by resultStatus; CSV/HTML dropdown) +
  a NEW SystematicConfigAuditService + models under domains/environment/data-access WITH unit + *.spec.pact.ts
  (VERIFY the gateway path first — OQ4); Select/Run TPK + scenario-runs TPK Results; preserve the
  ScenarioExecutionGroupPermissionWarningMessage map and "A TPK is currently running" guard.
- Story C / S3: Technical Reseed — port features/environment/.../technical-reseed to domains; DROP NgRx
  (ExecutionGroupsStoreModule -> rxResource); REPLACE legacy artifact-manager FinalProductService; status
  click -> info icon + tooltip (NO dialog — decision D4); launch dialog -> launch-reseed -> page reload.
- Story C / S4: Send-for-review / Merge trigger — Create MR popup (name/destination/reviewers, Backport
  Yes/No -> on-demand run-def multi-select); send-changes-for-review; reopen/repush gated by can-repush;
  disable when status != PENDING_INPUT; handoff to the 26642 Merge step.
- Story D / S6: MFE removal — DO LAST (see the TAIL prompt below).

Cross-feature edits you must make/coordinate (see design.md "Cross-Feature Edits"):
- X1: the environment-status-panel [extraActions] slot (Story A / S5) is a shared edit — regression-test
  upgrade-process & prepare-setup.
- X2/OQ6: if BuildAndTestProcessExecution / buildAndTestStage does not expose story ids or the audit env id,
  add those fields ADDITIVELY in the VAL-26634 data-access lib and coordinate with its owner.
- OQ4: verify the systematic-config-audit gateway path against the backend before writing the pact (Story B),
  then mark OQ4 resolved in decision-log.md.

Apply ALL SHARED RULES. For EACH story: build the legacy parity checklist from the named legacy file, cover
every item with a test, run the affected tests with the web-unit-test-runner skill, run local-pact-verify for
the new config-audit endpoint (Story B) and the reseed launch (Story C), and list any code-only behaviours
(missing from Figma/wiki) that you preserved in the PR description.
```

---

## WAVE 2B — VAL-26640 (Prepare Setup step) — run in PARALLEL with 26641
```
You are implementing VAL-26640: the CI "Prepare Setup" STEP BODY in the new domains architecture.
Read docs/.feature/VAL-26640/ for the full design. VAL-26634 must be merged first.

BEFORE coding, OPEN the Figma for this feature: view_image any PNGs under docs/.feature/VAL-26640/figma/
(and/or fetch via the query-figma skill using that feature's file key/frames named in its design), and match
the textual visual specs in its story map exactly.

Scope (per its design): mirror the upgrade-process convert-binary-stage. Wrap mxevolve-scenario-runs with
subContextId="PREPARE_BUILD_ENVIRONMENT", collapsed by default. Drop the legacy
repush-/stop-prepare-build-environment endpoints in favour of the scenario-runs widget Rerun/Abort actions.
Render inside the VAL-26634 stepper "prepare-setup" step.

Coordination with VAL-26641 (running in parallel):
- The new feature lib build-and-test-process/ scaffold is owned by VAL-26641 (OQ5). If you need it before
  it lands, sync with the 26641 implementer; keep your stage body in its own folder to avoid conflicts.
- Do NOT modify environment-status-panel; 26641 owns the [extraActions] slot edit (S5). If you need it,
  rebase onto it.

Apply ALL SHARED RULES. Mirror convert-binary-stage for structure and its spec for tests. Parity-check
against the legacy prepare-build stage; preserve every behaviour, flag and guard; run affected tests with the
web-unit-test-runner skill; update/verify any affected pact with local-pact-verify.
```

---

## WAVE 3 — VAL-26642 (Merge step) — run AFTER Wave 2
```
You are implementing VAL-26642: the CI "Merge" STEP BODY in the new domains architecture.
Read docs/.feature/VAL-26642/ and its stories/ folder:
  - stories/story-A-merge-and-final-product.md  (S1 + S2 + S3 + S6)
  - stories/story-B-backports.md  (S4 + S5)
VAL-26634 must be merged; VAL-26641's send-for-review handoff (Story C / S4) should be in place.
Story B depends on Story A (the CI execution view + integrate-changes stage shell from Story A must exist).

BEFORE coding, OPEN the Figma for this feature: view_image any PNGs under docs/.feature/VAL-26642/figma/
(and/or fetch via the query-figma skill using that feature's file key/frames named in its design), and match
the textual visual specs in its story map exactly.

Scope (per its design): mirror upgrade-process integrate-changes-stage + add Final Product Details (new
domains/artifact/widget component). CI v2 = two ag-grid backport tables + banner; CI v1 legacy = copy as-is
under legacy/. Target lib = build-and-test-process. Reuse merge-request-stepper, retry-merge-request,
fix-issues from business-process/composite-widget. Render inside the VAL-26634 stepper "merge" step and accept
the send-for-review handoff from VAL-26641.

Apply ALL SHARED RULES. Parity-check against the legacy integrate-changes / merge UI; preserve every
behaviour (backport tables, fix-issues, retry, banners); cover with tests run via web-unit-test-runner;
verify affected pacts with local-pact-verify.
```

---

## TAIL — MFE removal (VAL-26641 Story D / S6) — run LAST, after ALL of the above are merged
```
You are implementing the CI MFE-removal cleanup: docs/.feature/VAL-26641/stories/story-D-mfe-removal.md .
Pre-req: VAL-26634, 26640, 26641 (Stories A+B+C), 26642 ALL merged and the CI process fully runs on domains.

Remove the legacy CI MFE and switch the shell route to the domains CI view. Edit/remove these ~8 references
(pattern: upgrade-process-mfe and validation-process-mfe were already deleted the same way):
- web/apps/shell/src/app/business-process/business-process-routing.module.ts — CI route now uses
  loadComponent(() => import("@mxevolve/domains/business-process/feature").then(m => the CI view)).
- web/apps/shell/src/decl.d.ts — remove `declare module "ci-process-mfe/Module"`.
- web/apps/shell/tailwind.config.js — remove the ci-process-mfe content path.
- web/apps/shell/.../app-layout.component.ts — remove CI_PROCESS_ROUTE MFE usage.
- web/apps/shell/.../environment.ts — remove ciProcessMfeUrl.
- web/tools/local-dev/project.json — remove the ci-process-mfe serve target.
- web/apps/.../business-process-execution-service.spec.pact.ts — remove CI MFE refs.
- web/libs/config/src/lib/mfe-urls.ts — remove CI_PROCESS_MFE_PATH.
Then delete web/apps/ci-process-mfe entirely.

Apply ALL SHARED RULES. After removal: run nx affected build + lint + unit for all touched projects; run ALL
pacts and verify with local-pact-verify; run an e2e smoke of the CI run route through the shell. Confirm no
dangling references remain (grep ci-process-mfe / CI_PROCESS_MFE_PATH / ciProcessMfeUrl). Do not use --no-verify.
```

---

## Quick reference — execution order
| Wave | Feature(s) | Parallel? | Gate |
|------|-----------|-----------|------|
| 1 | VAL-26634 (shell/foundation) | No | — |
| 2 | VAL-26641 (Build & Test) + VAL-26640 (Prepare Setup) | **Yes** | 26634 merged |
| 3 | VAL-26642 (Merge) | No | 26634 merged; 26641 S4 handoff in place |
| Tail | MFE removal (S6) | No | all of 1–3 merged |
