# VAL-27132 — Handoff for the next session

> Written 2026-07-29 at the end of a long session. Read this **after**
> `parity-remediation-plan.md`. That document says what was broken; this one says
> what has been done since, what is still open, and how to actually run anything.

---

## 1. Read this first — the workspace does not build

`test-web/` is an **extracted subtree**. There is no `package.json`, `nx.json`,
`tsconfig.base.json` or `node_modules`, and none in any parent directory. `apps/`
and several `libs/` roots were not extracted, so ~75 legacy files import modules
that are simply absent.

You therefore **cannot** run `nx lint`, `nx test` or `tsc` as the plan's §7
assumes. A throwaway harness was built to get around this (§6 below). It is
deliberately **not committed** — only the defects it found are.

Also: **the repo is CRLF.** Any scripted edit that writes files with Python/Node
will silently convert them to LF and produce a diff touching every line. Restore
CRLF before committing. This bit twice.

---

## 2. What has been done (commits on `main`)

| Commit | Contents |
|---|---|
| `e654c74` | **W1** eager prefill resolution in all four executors |
| `deee425` | **R3** honest CVA selectors + `failureEvent` bound; **W3** visibility threaded to nested groups; **V3** single branch error |
| `44657f3` | **W2** `definition-input` adopted in BT/Backport/Upgrade; **REV-1..7** legacy strings restored |
| `98ab9e6` | **REV-8/REV-9** upgrade resets; **W5** generic branch-check error |
| `6cf2322` | **W6** final-product dropdown resolves its own commit labels |
| `b755b57` | **W4** upgrade factory product → four cascading dropdowns |
| `61832c5` | executor specs extended |
| `a244bee` | defects the harness exposed + CRLF restored |
| `1f5c783` | specs brought in line with the unit-testing skill |
| `c97d48c` | parity gaps a review found in the remediation itself |

Every REVERT row REV-1..REV-15 in the plan's §2.5 register was swept and
verified. The six KEEPs were left alone.

---

## 3. Open items — what the next session should pick up

These came from the user on 2026-07-29 and are **not** addressed.

### 3.1 "Archived Scenario Selected" warning (confirmed missing)

Legacy showed, on the Validation run form:

> **Archived Scenario Selected** — The prefilled scenario(s) 'st2' are archived
> and may no longer be valid.

Nothing in the new code produces this. Note this is **not** an existence check —
the scenario resolves fine, it is its *state* that matters. `ScenarioDefinitionService`
has an `activityStatus` parameter and `getScenarioDefinitions(projectId, activityStatus?)`;
find the legacy component that raised this warning and reproduce it.

**Why it matters beyond the warning itself:** it is the third distinct *kind* of
pre-fill check (exists-by-id, branch-exists-with-direction, state-is-archived),
which is the strongest argument yet that the current abstraction is wrong — see 3.4.

### 3.2 User-story validation flag (needs a decision, not a fix)

Current state, verified:

| | new | legacy |
|---|---|---|
| Build & Test | `[shouldValidate]="true"` | `[shouldValidate]="true"` |
| Backport | `[shouldValidate]="false"` | `[shouldValidate]="false"` |

So the new code is **literally faithful to legacy** — both are hardcoded there
too. But `context.md` decision #11 says user-story validation is gated behind the
`user-story-validation-and-transition` flag, and `UserStoryInputComponent`
(`business-process/widget/.../user-story-input`) already resolves that flag
internally at line ~77.

So the real question is whether `shouldValidate` should be a hardcoded per-form
choice *at all*, or whether Backport should also honour the flag. That is a
product decision, not a parity bug. Do not "fix" it silently either way.

### 3.3 Build & Test branch fields at t0 (could not reproduce)

Reported: legacy shows the configuration branches only after a repository is
selected; the new form shows them at t0.

Checked `build-and-test-executor.component.html:67` — the gate is
`@if (visibility().configurationBranchName && form().controls.repositoryId.value)`,
which *does* require a repository. Either the report is about the **Upgrade**
form (its branches gate on `createBranch.value !== null`, not on the repository),
or there is a path not covered by that condition.

**Needs reproduction before changing anything**, with which activity and which
Process Template. Then sweep for similar "condition lost" cases — that is the
class of bug, not the one instance.

### 3.4 `dead-prefill` is over-abstracted and badly named (agreed)

The user's critique is correct and I share it. `checkPrefilledEntities`,
`checkPrefilledBranch`, `deadPrefillValidator`, `prefilledIds` in
`composite-widget/src/lib/shared/dead-prefill.ts` are hard to follow, and "check
prefilled" says nothing about what is actually checked. With the archived-scenario
case (3.1) there are now three unlike things wearing one name.

Suggested direction — **do not preserve the current shape**:

- Name things after what they check: `assertRepositoryStillExists`,
  `assertBranchMatchesExpectation`, `warnIfScenarioArchived`.
- Let each executor own its own checks inline. An earlier iteration of this
  session concluded that four short `forkJoin`s beat a shared protocol, and then
  drifted back toward the protocol anyway. The user was right the first time.
- The one genuinely shared piece is the validator that keeps a dead value
  reported across revalidation (`deadPrefillValidator`) — that is worth keeping,
  under a clearer name.

### 3.5 Final-product dropdown should be a literal port

The user copied the legacy `features/artifact-manager` final-product component
**as-is**, adapting only imports and splitting the legacy `ScmService` into
`BranchService` + `CommitsService`. The new-arch dropdown here was instead
*adapted*, which is why W6 had to reconstruct commit-label behaviour.

**Do the same: copy the legacy component verbatim**, change only imports and the
service split. Do not carry over the current adaptation. Legacy source:
`features/artifact-manager/src/lib/final-product/**`.

---

## 4. Things decided in this session that you should not silently re-open

- **"User Stories"** as the group heading (not legacy's "User Story IDs") —
  `context.md` › Visual & Layout Details names it, and KEEP-4 makes the section
  design-mandated. Flagged late; it stands unless the user says otherwise.
- **Analytics label on the BT skip toggle** reports the state the user *just
  selected*. Legacy read the binding from the previous change-detection pass and
  so reported the state *before* the click. Deliberately not reproduced.
- **`shared/ui/primitive/src/index.ts`** gained six exports (Skeleton, WarningAlert,
  CopyToClipboard, ExpandableMessage, MultiPageDialog, MultiPageDialogPage). They
  exist on disk and are imported through the barrel elsewhere; without them the
  libraries do not compile. Plan §0 says ask before touching this file — the user
  has been told, but the zip-barrel-wholesale option was **not** taken.
- **`validation-executor.component.html`** radios: `name` was
  `officialUnofficialInput` while `formControlName` was `official`. PrimeNG throws
  on a mismatch, which killed all 13 Validation tests. Aligned to `official`.
  Came in with `c8dc421`, so it predates the remediation.

---

## 5. The systemic trap, worth understanding before touching visibility

Executors compute per-field visibility **once**, from a definition-only probe
form, mirroring legacy's `ngOnInit` assignment of `shouldShow`. That equivalence
holds only while validators are fixed — and several are not:

- Validation makes `parentBranchName` required on MQG + create-branch.
- Upgrade clears both configuration branches when create-branch changes.
- Build & Test moves `required` on/off `buildScenarioDefinitionId` with the skip toggle.

Legacy never hit this: projected fields were always **mounted**, so `shouldShow`
only decided whether a field was on screen, never whether it existed. Gating
those subtrees (W3) turned that into a **deadlock** — a required field that can
never be shown.

`mustStayReachable` (`business-process/util/.../input-visibility.ts`) is the
guard: required + empty ⇒ shown regardless of the snapshot. Each executor bumps a
`formRevision` signal where it applies validators, because they all use
`emitEvent: false` and nothing else would signal the change. **If you add a
dynamically-applied validator anywhere, bump that signal too.**

---

## 6. Rebuilding the test harness

Not committed. To recreate:

1. `package.json` with devDeps: `@angular/{animations,common,compiler,compiler-cli,core,forms,platform-browser,platform-browser-dynamic,router,cdk}@^21`,
   `jest@^30`, `jest-environment-jsdom@^30`, `jest-preset-angular@^17`, `ts-jest`,
   `@testing-library/{angular@^17.3,dom,jest-dom,user-event}`, `ng-mocks`,
   `primeng@^19`, `@primeuix/themes`, `rxjs`, `zone.js`, `tslib`, `typescript~5.9`,
   `@ngrx/{store,effects,entity}`, `ag-grid-{angular,community,enterprise}`,
   `ag-charts-{angular,community}`, `luxon`, `uuid`, `tailwindcss`,
   `eslint@^9`, `typescript-eslint@^8`, `angular-eslint@^19`.
   Install with `--legacy-peer-deps`.
2. `tsconfig.base.json` mapping `@mxevolve/domains/<d>/<t>` → `domains/<d>/<t>/src/index.ts`,
   `@mxevolve/shared/**` → `shared/**/src/index.ts`, `@mxflow/ui/*` → `ui/*/src/index.ts`,
   `@mxflow/features/*` → `features/*/src/index.ts`, and a `@mxflow/*` catch-all → a stub.
3. Stubs for the libs that were not extracted: `@mxflow/config` (`APP_CONFIG`,
   `AppConfig`), `@mxflow/core/analytics-tracker` (`AnalyticsTrackerService`,
   `EventCategory`, `EventAction`), `@mxflow/feature-flags` (`FeatureFlagResolver`
   — **two** args: `isFeatureEnabled(projectId, flag)`), and a permissive Proxy
   stub for everything else. The Proxy must carry **no** Angular `ɵ` metadata, or
   Angular treats every stub as an NgModule and scope computation explodes.
4. `jest.config.js` from `createCjsPreset({ tsconfig, diagnostics: false })` —
   diagnostics **off**, because the missing roots produce unfixable type errors.
5. A custom `resolver` that falls back to the stub when resolution fails — but
   **must not** stub bare packages (those need installing) or relative imports
   inside `domains/`/`shared/` (those are genuinely wrong paths). An earlier
   version stubbed everything and silently hid five broken imports.

Typecheck separately with `tsc -p tsconfig.harness.json --noEmit`, filtered to
changed files. Five errors in the touched files are pre-existing at baseline —
compare before believing any of them are new.

**Always diff against a baseline worktree** at the pre-work commit (`b87c44d`),
with the `shared/ui/primitive` barrel fix applied so only behaviour differs.
Roughly 17 suites fail identically before and after this work (fakeAsync/zone,
PrimeNG, ag-grid, Pact) — without the baseline you will chase ghosts.

Current state, `composite-widget` + `artifact/widget` + `business-process/util`:
**721/753 passing** vs 664/709 at baseline, no suite failing that did not already fail.

---

## 7. Testing conventions

`.agents/skills/unit-testing/` — `SKILL.md` **and** the 11 files under
`examples/`. It is not registered as an invocable skill, so read it directly.
Key points that were learned the hard way:

- `ngMocks.findInstance` does **not** reach components projected through
  `<ng-content>`, which is where every selector now lives. Use
  `ngMocks.find(fixture, X).componentInstance` / `ngMocks.findAll(X)`.
- No `detectChanges()` — use `waitFor()`, and wait on something the interaction
  actually *reveals*, not on a field already on screen.
- `document.querySelector` only for asserting a mocked child rendered. To
  disambiguate text that appears twice (e.g. "Build Scenario" is both a group
  heading and a field label, faithfully to legacy) use
  `screen.getByText(text, { selector: "label" })`.
- All four executor specs still lack `provideNoopAnimations()`, which the skill
  says to always add for PrimeNG components with animations. Pre-existing.

---

## 8. Still unverified in any environment

- **Module boundaries.** `composite-widget` now imports
  `@mxevolve/domains/infra/data-access` and `@mxevolve/domains/user/data-access`
  for the first time. The root eslint config with `depConstraints` is not in this
  subtree, so `@nx/enforce-module-boundaries` has never run on this work.
- **New component-level providers.** The executors now provide `RepositoryService`,
  `ScenarioDefinitionService`, `InfraGroupService`, `EnvironmentDefinitionService`,
  `MergeConfigurationService` and `UserService` — none are `providedIn: "root"`.
  Any spec elsewhere that renders an executor will need `HttpClient`/`APP_CONFIG`.
- Whether the legacy **rerun** dialog passed a repository id to its final-product
  selector. The new one has none in scope; the reviewer says legacy did. Confirm
  before wiring.
