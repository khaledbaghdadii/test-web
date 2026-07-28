# VAL-27132 — Run-Form Parity Remediation Plan

> Written 2026-07-28 after a full legacy-vs-new investigation of the four executors.
> This document supersedes nothing in `spec.md` / `implementation-log.md` / `open-points.md` —
> it records **regressions introduced during the VAL-27132 migration** and how to fix them.
>
> Read `context.md` and `spec.md` first for what the feature is. Read this for what is broken.

---

## GOVERNING PRINCIPLE

**Match legacy behaviour exactly, everywhere, in the run forms.** Where the current
implementation diverges from legacy, revert to legacy — *unless* the divergence appears in the
**Divergence Register (§2.5)** with a ruling of KEEP. There are only six KEEPs, and each is
there because the user explicitly asked for it or a captured design mandates it.

If you find a divergence that is *not* in §2.5, the default is **revert to legacy** — then add
it to §2.5 so the register stays complete.

---

## SYMPTOM INDEX — "where is my issue handled?"

| Reported symptom | Handled by |
|---|---|
| Quality Gate / BP Quality Level shows in the Validation run form **already filled** even though the definition prefilled it (legacy hid it) | **V1** (§5.1) + **W3**. Root cause R1/leak. |
| Same for Create Branch?, archival branch, parent branch, final product, config/RTP commit in Validation | **V2** (§5.1) + **W3** |
| A prefilled field points at something that **no longer exists** → must show an error on open and keep the form **unsubmittable**. **All four run forms.** | **W1** + decision **D1**. Field→resolver audit for BT / Backport / Upgrade / Validation is inside W1. |
| Broken prefill shows **no toast / nothing at all** | **W1** (bind `failureEvent`) + root cause **R3** |
| Upgrade factory product is a dumb single dropdown instead of MX Version / MX Build ID / BIP Version / BIP Build ID | **U1** (§5.4) + **W4**. Both instances (Conversion + Reference). |
| Factory product "shown twice" | **U8** (§5.4) — the two selectors are correct; the duplication is form↔details-panel, and the panel is out of scope (§3) |
| Missing labels / descriptions / inline validation messages in the run forms | **B1, K3, U7** + **W2** (root cause R2) |
| Branch validation error appears twice | **V3** (§5.1) + **W2** |
| Raw backend 500 shown as the branch error | **W5** |
| Final product dropdown doesn't show the commit message | **W6** |
| Fields shown at t0 that should depend on earlier selections | **W3** (Validation), **U3/U6** (Upgrade), **W4** (factory-product cascade) |

---

## 0. Orientation — repo layout

Paths in the older VAL-27132 docs are written as `web/libs/domains/...`. **In this repo the
`web/libs/` prefix does not exist.** Actual roots:

| Docs say | Actually |
|---|---|
| `web/libs/domains/business-process/*` | `domains/business-process/*` |
| `web/libs/features/business-process/*` | `features/business-process/*` (LEGACY, still live) |
| `web/libs/ui/inputs` | `ui/inputs` (LEGACY) |
| `web/libs/shared/*` | `shared/*` |

- **Legacy** (the behaviour of record): `features/business-process`, `features/scm`,
  `features/artifact-manager`, `ui/inputs`, `ui/mxevolve-dropdown`, `ui/alert`.
- **New arch**: `domains/{business-process,scm,test,artifact,environment,infra,user}/{data-access,util,ui,widget,composite-widget,feature}`,
  `shared/ui/*`.
- `apps/shell` is **not** in this workspace. Nav tabs and routing are out of scope.

### Working-tree state (uncommitted, important)

`ui/` was added and `shared/` was merged **additively** (`rsync --ignore-existing`) from two zips
committed as `shared.zip` / `ui.zip`. Consequences to be aware of:

- `shared/ui/layout` exists only in the repo, not in the zip — it was preserved.
- These files **diverge** between zip and repo and the **repo version was kept**:
  `shared/core/config/src/index.ts`, `shared/core/config/src/lib/microfrontend-paths.ts`,
  `shared/ui/primitive/src/index.ts`, `shared/ui/table/src/index.ts`, the icon set
  (`icons/**`), and `stepper/*`.
- **Therefore**: newly-copied `shared/ui/primitive/src/lib/{multi-page-dialog,alert,skeleton,copy-to-clipboard,expandable-message}`
  are **not exported** from `shared/ui/primitive/src/index.ts`. If you need them, take the zip's
  barrel (and icons + stepper) wholesale, as one dedicated commit. Ask the user first.

### Code style (from `open-points.md` #6 — still binding)

- **Never run `:web:spotlessApply`.** It reformats 40+ committed files (printWidth 80 vs the
  committed 120).
- `composite-widget`, `data-access`, `util`, `feature`: **double quotes, printWidth 120**.
- `widget` lib: **single quotes** (matches surrounding files).
- Barrel exports: one per line.

---

## 1. The three root causes

Almost every symptom traces to one of these. Fix these and the symptom list collapses.

### R1 — Visibility gating moved from content-projection to structural `@if`

**Legacy** `features/business-process/src/lib/definition-input/definition-input.component.html`:

```html
@if (shouldShow) { <div> … <ng-content></ng-content> … </div> }
```

`<ng-content>` is a *projection slot*. The projected child (infra-group selector, scenario
dropdown, branch input…) is instantiated as part of the **parent's** view, so it ran
`ngOnInit` **whether or not `shouldShow` was true**. A field hidden because it was prefilled
still: fetched its entity, hit 404, fired `ToastMessageService.showError(...)`, and set its
control to `undefined` → invalid → **Execute button never enabled**.

Legacy's good behaviour was an *accident of content projection*, at the cost of one HTTP call
per hidden field on every dialog open.

**New** `domains/business-process/ui/src/lib/definition-input/definition-input.component.ts`
deliberately does not decide visibility. Executors gate with a structural `@if` in their own
template. Hidden field ⇒ component never created ⇒ never fetches ⇒ no toast ⇒ the stale
prefilled id passes `Validators.required` ⇒ **form valid, button enabled, backend rejects.**

**Decision (locked): keep visibility in the executor. Do NOT merge it into `definition-input`.**
Rationale: merging re-imports the accident and its wasted fetches, and turns a deep
presentational module into a policy-carrying one. The replacement for the lost side effect is
workstream **W1 (eager prefill resolution)**.

### R2 — `definition-input` not adopted in BT / Backport / Upgrade

Only the **Validation** executor imports `DefinitionInputComponent`. BT, Backport and Upgrade
hand-roll `<label>` + control. Lost across those three:

- every field **description** (~20 strings, listed per-executor below)
- every **inline validation error message** (required / whitespace / invalid characters /
  missing factory-product attributes / minlength)
- the tooltip slot

`DefinitionInputComponent` already has the `showValidationErrors` input needed to suppress
double branch errors (see V3).

### R3 — CVA selectors silently keep a stale prefilled id

Five components share this shape:

```ts
private resolvePrefilledId(items: T[]): void {
  const match = items.find(i => i.id === id);
  this.stateProvider.setSelectedItem(match ?? null);   // onChange() is NEVER called
}
```

| Component | Path |
|---|---|
| `RepositorySelectorComponent` | `domains/scm/widget/src/lib/repository-selector/` |
| `ScenarioDefinitionDropdownComponent` | `domains/test/widget/src/lib/scenario-definition-dropdown/` |
| `ScenarioDefinitionMultiselectDropdownComponent` | `domains/test/widget/src/lib/scenario-definition-multiselect-dropdown/` |
| `EnvironmentDefinitionSelectorComponent` | `domains/environment/widget/src/lib/environment-definition-selector/` |
| `FactoryProductSelectorComponent` | `domains/artifact/widget/src/lib/factory-product-form-selector/` |

When the prefilled entity no longer exists: dropdown renders **blank**, the form control keeps
the **dead id**, the form stays **valid and submittable**, nothing is shown. The multiselect
additionally drops *partial* misses from the array silently.

Each also exposes a `failureEvent` / `errorEvent` output for fetch failures. **No executor
template binds any of them** (verified by grep across `domains/**/*.html`). Fetch errors are
swallowed entirely.

> Note: legacy also swallowed the factory-product `errorOutput` — `ui/inputs`'s
> `BusinessProcessFactoryProductSelectorComponent` never bound it either. That specific one is
> parity, not regression.

---

## 2. Locked decisions

| # | Decision |
|---|---|
| D1 | **Eager prefill resolution.** On dialog open, resolve every prefilled id against its source. On a miss: surface an error immediately and keep the form **unsubmittable** until fixed. |
| D2 | **Factory product cascade: visible-but-disabled, NOT hidden.** Legacy hid the BIP pair until MX Version + MX Build ID were chosen; the user explicitly prefers disabled. `FactoryProductSelectionStateService` already implements this. |
| D3 | **Backport: promote the 3 prefilled ids to real form controls** so eager resolution can flag them. |
| D4 | **Keep `shouldShowInForm` in the executors** (see R1). |
| D5 | **Final-product commit-message + HEAD- logic moves INTO the dropdown**, matching legacy. |
| D6 | **Restore legacy conditional-show semantics everywhere in the run form.** |

## 2.5 DIVERGENCE REGISTER — every place new ≠ legacy

Per the Governing Principle, everything here is **REVERT to legacy** unless ruled KEEP.
This register is exhaustive as of the 2026-07-28 investigation.

### KEEP — the only sanctioned divergences (6)

| # | Divergence | Why it stays |
|---|---|---|
| KEEP-1 | **Factory product: dependent dropdowns visible-but-disabled**, not hidden. Legacy `factory-product-input-component.html` wraps the BIP pair in `@if (mxVersion && mxBuildId)`. | User decision (D2). `FactoryProductSelectionStateService` already implements the disabled cascade. |
| KEEP-2 | **Branch API failure shows a generic message** ("Couldn't validate the branch. Please try again.") instead of legacy's `` `Unable to validate branch: ${err.message}` `` (raw backend text, including on 500s). | User explicitly requested this improvement. See W5. |
| KEEP-3 | **Backport prefill failure does not reproduce legacy's throw.** Legacy deadlocked the modal (see 5.3). New promotes the 3 ids to form controls + eager resolution (D3). | User decision D3, and legacy's behaviour is an outright bug — reproducing it would be harmful. |
| KEEP-4 | **User-story input is inline growable fields** with an inline validity icon and a blue "+" add button, instead of legacy's table + "Add User Story" modal. | **Design-mandated** by the captured Figma — `context.md` › Visual & Layout Details and AC-12 specify exactly this. Not accidental drift. |
| KEEP-5 | **Backport reviewers autocomplete keeps `[repositoryId]`** (legacy passed only `[projectId]` + `[reviewersFormControl]`), scoping the reviewer search to the repository instead of the whole project. | User decision 2026-07-28: the narrower, more relevant list is preferred. (Was CONF-1.) |
| KEEP-6 | **BT skip toggle uses `setValidators`**, not legacy's `addValidators`. Legacy accumulated duplicate `required` validators on every toggle. | Behaviourally identical (duplicate `required` yields the same result); legacy's version is a latent bug with no observable difference. User decision 2026-07-28. (Was CONF-2.) |

### REVERT — divergences to undo

| # | Divergence | Action |
|---|---|---|
| REV-1 | BT skip toggle: legacy `mxevolve-skip-build-scenario-radial-input` → new `p-checkbox` | Restore the legacy **radial** input presentation. (Was listed as open question B2 — now resolved: revert.) |
| REV-2 | BT skip toggle **lost the `mxevolveUsageTracker` analytics** binding (`CI Process - Prepare-Build Environment Skipped` / `… Not Skipped`, `EventCategory.CHECKBOX`, `EventAction.CLICK_CHECKBOX`, `trackOn: 'change'`) | Restore the analytics binding. |
| REV-3 | Toast wording "BP definition" (BT + Upgrade) vs legacy "**Process Template**" | Restore legacy wording. (B3, U4, U5.) |
| REV-4 | Upgrade config-params **order** swapped (Repository ↔ BP Quality Level) | Restore legacy order: BP Quality Level → Repository → Create Branch → Config Branch → Config Parent Branch. (U2) |
| REV-5 | Upgrade `[branchShouldExist]="false"` hardcoded | Restore `createBranchFormControl.value !== true`. (U3) |
| REV-6 | Upgrade lost the **second** config-branch toast variant keyed on `createBranch` | Restore both messages. (U4) |
| REV-7 | Upgrade parent-branch toast wording ("The branch name **you entered**…") | Restore legacy string. (U5) |
| REV-8 | Upgrade missing `businessProcessQualityLevel === "NA" → reset()` on init | Restore. (U6a) |
| REV-9 | Upgrade missing reset cascade when `repositoryId` is **cleared** (legacy watched `valueChanges.filter(v => !v)`) | Restore. (U6b) |
| REV-10 | Backport user-story group/input lost legacy's literal `[forceShow]="true"` on **both** the group and the `definition-input` | Make it literal. (Was open question K4 — now resolved: revert.) |
| REV-11 | All lost field **descriptions** and inline validation errors in BT / Backport / Upgrade | Restore verbatim. (W2; strings in §5.) |
| REV-12 | Validation BP Quality Level + MQG/DQG subtree render unconditionally | Restore `shouldShow`-equivalent gating. (V1, V2, W3) |
| REV-13 | Branch error rendered twice (wrapper + `branch-input`) | Restore legacy's `[showValidationErrors]="false"` on branch fields. (V3, W2) |
| REV-14 | Prefilled entities are never resolved / never invalidate the form | W1 restores legacy's net effect (legacy achieved it accidentally via content projection — see R1). |
| REV-15 | Final-product dropdown no longer owns commit-info + head-commit lookup | Move it back inside the dropdown, as legacy. (W6, D5) |

### CONFIRM WITH USER — none outstanding

Both former open items (CONF-1 reviewers scoping, CONF-2 `setValidators`) were resolved by the
user on 2026-07-28 and promoted to **KEEP-5** and **KEEP-6**. No divergence questions remain
open — the register is fully decided.

### NOT a divergence — verified identical (do not re-investigate)

Form models field-for-field and validator-for-validator in **all four** executors; group and
field ordering in BT / Backport / Validation and in Upgrade's top-level groups; upgrade-jump
options; `validationLevelFilter` / `stateFilter` / `sort` / `fetchParent` on both final-product
dropdowns; the validation `from-existing-branch` auto-fetch path incl. all four warning alerts;
the flag-gated `validationScopeStartCommitId` visibility matrix; submit payload key remaps;
the factory-product `errorOutput` being unbound (legacy also swallowed it). Details in §5.

---

## 3. Explicitly OUT of scope

- **The "{name} Details" prefilled panel.** Do not change it. It currently renders *every*
  prefilled input unfiltered, so a prefilled-but-invalid field appears both in the form and in
  the panel (most visible for factory product, which expands into 4 rows). The user has decided
  **not** to fix this. Restoring conditional show (W3) will reduce it as a side effect.
- Nav tabs / routing / `apps/shell`.
- Pact / contract tests (`open-points.md` #1, #2, #16, #20, #21).
- Legacy pages, services and MFEs — additive only.
- Re-migrating leaf selectors that already work.

---

## 4. Workstreams

Ordered. W1 and W2 are shared infrastructure; do them first.

### W1 — Eager prefill resolution (highest value, unblocks D1)

**Goal:** dialog opens → every prefilled id is resolved → misses produce a visible error and a
dead submit button.

**Why not "just render hidden fields with `[hidden]`":** that restores legacy exactly but keeps
the wasted per-field fetches and dead DOM. Rejected in favour of an explicit, batched pass.

**Shape:**

1. New service/helper in `domains/business-process/composite-widget/src/lib/shared/`
   (or `util` if it can stay Angular-free) that takes a list of
   `{ control, inputId, value, resolve: (id) => Observable<unknown> }` descriptors.
2. Runs them in parallel (`forkJoin`) when the executor's `definition()` first resolves.
3. On a miss (404 / not in list): `control.setErrors({ prefillMissing: '<message>' })` and
   `toast.showError(...)`. On fetch failure: a **generic** message (see W5).
4. While in flight, keep the submit button disabled (`form().pending` already covers this if
   controls are marked pending).
5. Fixes the "form gets enabled anyway" symptom **regardless of whether the field is visible**,
   which is the whole point.

**Per-executor field → resolver map** (this is the audit; use it verbatim):

**Build & Test** — `domains/business-process/composite-widget/src/lib/build-and-test/executor/`

| Prefilled input | Resolver | Today |
|---|---|---|
| `repositoryId` | `RepositorySelector` | silent stale |
| `configurationBranchName` | `BranchInput` | eager+toast, **only if visible AND repositoryId set** |
| `configurationParentBranch` | `BranchInput` | same |
| `buildScenarioDefinitionId` | `ScenarioDefinitionDropdown` | silent stale |
| `buildEnvironmentInfraGroup` | `InfraGroupSelector` | toast+null, only if visible |
| `buildAndTestInfraGroup` | `InfraGroupSelector` | same |
| `notificationsRecipients` | `NotificationsRecipientsInput` | **unreachable** (see B4) |

**Backport** — nothing resolvable today; see D3 / K1.

**Upgrade** — `domains/business-process/composite-widget/src/lib/upgrade-process/executor/`

| Prefilled input | Resolver | Today |
|---|---|---|
| `factoryProduct` | `FactoryProductSelector` | silent stale |
| `referenceFactoryProduct` | `FactoryProductSelector` | silent stale |
| `repositoryId` | `RepositorySelector` | silent stale |
| `testScenarioIds` | `ScenarioDefinitionMultiselect` | silent stale + **partial misses dropped** |
| `technicalUpgradeTestScenarioId` | `ScenarioDefinitionDropdown` | silent stale |
| `referenceEnvironmentDefinitionId` | `EnvironmentDefinitionSelector` | silent stale |
| `configurationBranchName` / `configurationParentBranch` | `BranchInput` | only if visible |
| `qualityGateExecutionInfraGroupId` / `binaryConversionInfraGroupId` / `referenceEnvironmentInfraGroupId` | `InfraGroupSelector` | only if visible |

**Validation** — `repositoryId`, `archivalBranchName`, `parentBranch`, `finalProductId`,
`qualityGateExecutionInfraGroupId`, `testScenarioIds`.

**Also fix in the 5 CVA selectors (R3):** on a miss, call `onChange(null)` so the control
actually reflects reality, and bind `(failureEvent)` in every executor template.

### W2 — Adopt `definition-input` in BT / Backport / Upgrade (R2)

Wrap every field. Restore the exact legacy `label` + `description` + `tooltip` strings
(transcribe from the legacy templates listed in §5 — do **not** invent them).

Set `[showValidationErrors]="false"` on any field whose control is a **branch input**, because
`BranchInputComponent` renders its own inline error. Legacy did exactly this. See V3.

### W3 — Restore legacy conditional show (D6)

The executors compute a `visibility()` map but **leak the policy** — nested groups either
ignore it or use a different predicate. Thread the map (or provide an injectable
`InputVisibility` token from the executor that nested groups read).

Known leaks: V1, V2 (Validation). Verify BT / Upgrade groups against §5 too.

### W4 — Upgrade factory product → directive + 4 dropdowns (D2)

Replace **both** `<mxevolve-factory-product-selector>` in
`upgrade-executor.component.html` (line ~93 conversion, line ~404 reference) with the
directive-based four-dropdown block.

- Reference implementation to copy:
  `domains/test/widget/src/lib/rerun-scenario-button/factory-product-input/factory-product-input.component.ts`
- Legacy equivalent (for label/behaviour parity):
  `ui/inputs/src/lib/business-process-factory-product-selector/` →
  `features/artifact-manager/src/lib/factory-product-input/`
- The legacy wrapper patched the object key-by-key from 5 outputs
  (`factoryProductIdChange`, `mxVersionChange`, `mxBuildIdChange`, `bipVersionChange`,
  `bipBuildIdChange`) and called `markAsDirty()`. `FactoryProductSelectionDirective` emits the
  same 5 outputs — reproduce the same patching into the `factoryProduct` /
  `referenceFactoryProduct` controls.
- **Verified**: `mx-build-id-dropdown`, `bip-version-dropdown` and `bip-build-id-dropdown`
  already bind `disabled` from `state.mxBuildIdDisabled()` / `bipVersionDisabled()` /
  `bipBuildIdDisabled()`, and the cascade resets + auto-select-when-single are implemented.
  Per D2, keep them **visible and disabled** (legacy hid the BIP pair with
  `@if (mxVersion && mxBuildId)` — intentionally diverging).
- The form validator `factoryProductAttributes()` (requires `value.id`) is already faithful to
  legacy `FactoryProductValidator`.

### W5 — Error-message hygiene

- **Branch API failures**: `BranchInputComponent.validateBranchExists` currently produces
  `` `Unable to validate branch: ${err.message}` `` — the raw backend message, including on
  500s. Legacy did the same, so this is a **carried-over wart, not a regression**. Replace with
  a generic "Couldn't validate the branch. Please try again." (user-requested improvement).
- **Toast wording drift**: BT and Upgrade say *"BP definition"*; legacy already used
  *"Process Template"*. Fix to match legacy.
- **Upgrade lost a message variant** — see U4.

### W6 — Final product dropdown owns its labelling (D5)

**Diagnosis:** `FinalProductDataProvider.buildLabel()` faithfully reproduces legacy
(`HEAD-` prefix, `displayId`, truncated commit message at 60 chars / 40 for head, tag modes),
and `FinalProductDropdownStateProvider` rebuilds labels in place when commit info arrives.
**But nothing feeds it.**

The component inverted the dependency, requiring each consumer to close a round-trip:

```
(loadedCommitIds) → CommitsService.getCommitsInfo → [commitMessages]
```

**No consumer does.** All four are broken:
`mqg-from-new-branch`, `dqg-from-new-branch`,
`domains/environment/widget/.../technical-reseed-section`,
`domains/test/widget/.../rerun-dialog`.

Result: `commitsInfo` stays an empty `Map`; `displayId` falls back to
`configurationCommitId.substring(0, 10)`; `buildCommitMessageSuffix(undefined)` returns `""`
→ **no commit message anywhere in the app.**

**The stated justification for the inversion is false.** The code comment claims
`artifact/widget → scm/data-access` "would close a dependency cycle through the legacy
libraries". Verified:

- `domains/scm/data-access/src` imports **nothing** from `artifact/*` → no cycle.
- Cross-domain `widget → data-access` is the house pattern (17 committed edges), **including
  `business-process/widget → @mxevolve/domains/scm/data-access` in 6 committed files** —
  the identical shape — which the implementation log records as passing
  `@nx/enforce-module-boundaries` clean.
- Caveat: the root eslint config with `depConstraints` is **not in this workspace** (only
  `ui/mxevolve-dropdown/eslint.config.mjs` is). Confirm with one `nx lint` run before relying
  on this.

**Fix:**

1. Add a **`repositoryId` input** to `FinalProductDropdownComponent` (currently missing;
   both `getCommitsInfo({projectId, repositoryId, commitIds})` and
   `getBranchDetails` need it). Legacy's selector takes it, and both MQG and DQG already hold
   the value — they pass it to `branch-input`.
2. Inject `CommitsService` + `BranchService` **in the dropdown**.
   - on `visibleCommitIds()` change → `getCommitsInfo` → `stateProvider.setCommitsInfo(...)`
   - on `branch` change → `getBranchDetails().latestCommitId` → head commit id
     (legacy `final-product-dropdown-state.service.ts:189`; only when `repositoryId && branch`)
3. Remove `commitMessages` / `loadedCommitIds` from the public API (nothing binds them); make
   `headCommitId` internal.
4. Delete the **unused** `CommitsService` provider from `final-product-from-existing-branch`
   (that path renders no dropdown).

**Effect:** call sites change only by passing `repositoryId`; `technical-reseed-section` and
`rerun-dialog` get commit messages for free; the MQG `HEAD-` prefix returns automatically.

> DQG legacy passes no branch → `EMPTY` → no `HEAD-` prefix. New also has none. Match; leave.

---

## 5. Per-executor findings

Legacy sources of truth are listed per section — **transcribe strings from them, do not invent.**

### 5.1 Validation

New: `domains/business-process/composite-widget/src/lib/validation-process/executor/`
Legacy: `features/business-process/src/lib/validation-process/validation-process-definition-executor/inputs/execute-validation-process-input.component.{html,ts}`
and `.../validation-process-configuration-parameters/**`

| # | Finding |
|---|---|
| V1 | **BP Quality Level always renders prefilled.** `validation-configuration-parameters.component.html` gates it on `businessProcessQualityLevelFormControl().enabled`; legacy gated it with `[inputAccessMode]="ACCESS_INVALID_INPUTS_ONLY"`. This is the user's "quality gate reappears" report. |
| V2 | **MQG/DQG subtrees ignore visibility entirely** — `Create Branch?`, archival branch, parent branch, final product, config/RTP commit all render unconditionally. Legacy passed `[inputAccessMode]` down to each `definition-input`. The executor computes these flags but passes only `showRepository` to the child. |
| V3 | **Branch error shown twice.** New `DefinitionInputComponent.errorMessage()` falls through to "any error with a string payload", which catches `branchInvalid` / `branchApiError` — while `BranchInputComponent` also renders them inline. Legacy set `[showValidationErrors]="false"` on exactly these fields. Affects all three validation config-param templates. |
| V4 | Final product dropdown — see **W6**. |

**Verified clean (do not re-open):** form model field-for-field and validator-for-validator vs
legacy `initializeForm`; the flag-gated `validationScopeStartCommitId` visibility matrix; the
`from-existing-branch` auto-fetch path (read-only inputs + all four warning alerts);
`validationLevelFilter` `["CQG"]`/`["MQG"]`; `stateFilter [AVAILABLE]`; `sort createdOn,desc`;
`fetchParent false`; labels "represented by a Commit ID" / "by Tag-Commit ID"; label modes
`COMMIT_ID` / `TAG_COMMIT_ID`.

### 5.2 Build & Test

New: `domains/business-process/composite-widget/src/lib/build-and-test/executor/`
Legacy: `features/business-process/src/lib/build-and-test/build-and-test-process-definition-executor/input/execute-build-and-test-process-input.component.{html,ts}`
+ `.../build-and-test-configuration-params-inputs/`

| # | Finding |
|---|---|
| B1 | No `definition-input` → descriptions lost. Restore: Repository = "Select the Repository where the configuration is stored"; Configuration Branch Name = "Enter the Configuration Branch Name that you wish to use"; Configuration Parent Branch = "Enter the Parent Branch from where you want to create your branch"; Build Environment Infra Group = "Select the Infra Group for the build environment"; Build and Test Infra Group = `Select the Infra Group for the test(s) executed under "Build & Test" step`; User Story IDs = "Enter the IDs of the stories you will be working on"; Notifications = "Select the users who will receive email notifications as the business process approaches its expiry date". |
| B2 | Skip toggle: legacy `mxevolve-skip-build-scenario-radial-input` → new `p-checkbox`; the legacy `mxevolveUsageTracker` analytics binding (`CI Process - Prepare-Build Environment Skipped/Not Skipped`, `EventCategory.CHECKBOX`, `EventAction.CLICK_CHECKBOX`) was **dropped**. Decide: restore analytics or accept. |
| B3 | Toast text says "BP definition"; legacy says "Process Template". |
| B4 | `NotificationsRecipientsInput` prefill resolution is **unreachable**: mode is `ACCESS_EMPTY_OPTIONAL_INPUTS`, so it mounts only when the control is *empty* — i.e. only when there is nothing to resolve. (Legacy ran it via content projection, and silently dropped unresolvable emails — that drop is parity; the never-running is new.) |

**Verified clean:** field/validator parity; group order (Name → Configuration → Build Scenario →
User Stories → Infrastructure → Notifications). New is *better* on one point: legacy used
`addValidators` on each skip toggle (accumulating duplicate `required`s); new uses `setValidators`.

### 5.3 Backport

New: `domains/business-process/composite-widget/src/lib/backport/executor/`
Legacy: `features/business-process/src/lib/backport/backport-definition-executor/**`

| # | Finding |
|---|---|
| K1 | `repositoryId`, `mergeConfigurationId`, `buildAndTestInfraGroup` are **not form controls**; read raw from `providedInputs` at submit. Per **D3**, promote to controls (seeded, `Validators.required`) so W1 can flag them. |
| K2 | Legacy `getInputValue` **threw**; new returns `""` → silent empty-string POST. **Do not port legacy's behaviour** — see the note below. |
| K3 | No `definition-input` → descriptions lost. Restore: Pull Request Id = "Enter the 4‑digit pull request ID. This ID appears in the pull‑request URL and in the merge‑request list (e.g., 4402)."; User Story IDs = "Enter the IDs of the stories you will be working on"; Reviewers = "Enter the names of the reviewers that you wish to review your changes"; Notifications = as B1. |
| K4 | Legacy set `[forceShow]="true"` on **both** the User Story IDs group and its `definition-input`; new uses plain `shouldShowInForm`. Equivalent in practice (control is required+empty) but not literal parity. |

> **Legacy backport is a deadlock bug — do not copy it.** `getInputValue()` throws inside
> `getExecuteBackportProcessRequest()`, which is an **argument expression** on line 60, evaluated
> *before* the observable exists — so the `.subscribe({ error })` handler is unreachable. The
> throw escapes into Angular's global `ErrorHandler` with `isExecuting = true` already set and
> `errorMessage` just cleared. Net effect: spinner forever, **no** error alert, dialog X disabled
> (`[closable]="!isExecuting"`), Cancel disabled too. Hard refresh required. It never bit anyone
> only because real backport definitions always carry all three inputs.
>
> New is already *ahead* of legacy here: `BACKPORT_PREFILLED_SECTIONS` surfaces all three
> read-only. It just doesn't validate them.

**Verified clean:** form model field/validator parity vs legacy `initializeForm`. New adds
`[repositoryId]` to the reviewers autocomplete (legacy didn't) — an improvement, keep.

### 5.4 Upgrade

New: `domains/business-process/composite-widget/src/lib/upgrade-process/executor/`
Legacy: `features/business-process/src/lib/upgrade-process/upgrade-process-definition-executor/inputs/execute-upgrade-process-definition-inputs.component.{html,ts}`
+ `.../upgrade-process-configuration-params-inputs/`

| # | Finding |
|---|---|
| U1 | Factory product is the **dummy single-select**; swap to the directive + 4 dropdowns. See **W4**. |
| U2 | **Config-params order regression.** Legacy: BP Quality Level → Repository → Create Branch → Config Branch → Config Parent Branch. New: **Repository → BP Quality Level** → … Swap back. |
| U3 | **`branchShouldExist` hardcoded `false`** (`upgrade-executor.component.html:231`). Legacy: `[branchShouldExist]="createBranchFormControl.value !== true"` — when *not* creating a branch the config branch must **exist**. Currently the create-branch=No path validates the wrong way round. |
| U4 | Legacy had **two** config-branch toast messages keyed on `createBranch` (…"doesn't exist in the repository…" when false, …"already exists…" when true). New has one. |
| U5 | Legacy parent-branch toast: "The branch name **you entered** doesn't exist in the repository. Please check the name and try again with an existing branch." New uses the BP-definition wording. |
| U6 | **Missing legacy resets**: (a) `if (businessProcessQualityLevelFormControl.value === "NA") reset()` on init; (b) reset cascade when `repositoryId` is **cleared** (legacy watched `valueChanges.filter(v => !v)`), not only when changed. |
| U7 | No `definition-input` → **all 12 descriptions lost.** Transcribe verbatim from the legacy template, e.g. Conversion Factory Product = "Select the factory product that you wish to validate your Quality Gate against"; Parent MX Archival Branch = "Enter the MX Archival Branch from where the selected MX Version was branched"; Upgrade Jump = "Select the type of jump you want to launch"; Quality Gate Execution Infra Group = `Select the Infra Group for the test(s) under "Execute Quality Gate" step`; Binary Conversion Infra Group = `Select the Infra Group for the test under "Convert Binary" step`; Quality Gate Execution Test Scenarios = `Select the collection of test scenarios that you wish to launch in the "Execute Quality Gate" step`; Binary Conversion Test Scenario = `Select the test scenario that you wish to launch in the "Convert Binary" step`; Reference Commit ID = "Select the commit ID of the reference environment"; Reference Environment Definition = "Select the environment definition for the reference environment"; Reference Factory Product = "Select the factory product that you wish to use in your reference environment"; Reference Environment Infra Group = "Select the Infra Group for the reference environment"; BP Quality Level = "Select the business process quality level". Note legacy gave the two factory-product fields **no label**, only a description (the selector renders its own labels). |
| U8 | *(context only — OUT OF SCOPE)* "factory product shown twice" = the field renders in the form **and** its 4 expanded rows render in the details panel. The two `<mxevolve-factory-product-selector>` in the form are **correct** (Conversion + Reference, matching legacy). W3 reduces this; the panel itself is not to be changed. |

**Verified clean:** field/validator parity incl. `standardCopiableTextInputValidators`
(required + notBlank + noWhitespaces) on `parentMxArchivalBranch` / `referenceCommitId`;
upgrade-jump options (`Continuous Greening`, `Mainstream Activation`) identical to
`BusinessProcessUpgradeJumpSelectorComponent`; group order (Official → Name → MX →
Configuration → Infrastructure → Tests → Reference Environment → Notifications); the
reference-env field order; the submit payload key remaps.

---

## 6. Suggested sequencing

1. **W1** — eager prefill resolution + fix the 5 CVA selectors + bind `failureEvent`.
   Single largest win; kills the silent-failure class everywhere at once.
2. **W3** — restore conditional show (V1, V2; verify BT/Upgrade).
3. **W2** — adopt `definition-input` in BT/Backport/Upgrade (B1, K3, U7) + `showValidationErrors=false` on branch fields (V3).
4. **W6** — final-product dropdown owns commit info + head commit.
5. **W4** — upgrade factory product → directive + 4 dropdowns.
6. **Upgrade specifics** — U2, U3, U4, U5, U6.
7. **W5** — generic branch-validation error; toast wording (B3).
8. **Backport** — K1 (promote controls) once W1 exists.
9. Sweep the **Divergence Register (§2.5)** and confirm every REVERT row is done. No open
   divergence questions remain — the register is fully decided.

## 7. Testing expectations

- Jest + Angular Testing Library, `screen` role/text queries, `userEvent`, `MockComponent` /
  `ngMocks`, `provideNoopAnimations()`. **No `data-testid`, no `NO_ERRORS_SCHEMA`** — matches
  the existing executor specs.
- Every executor already has a spec (`*-executor.component.spec.ts`) — extend rather than replace.
- New behaviour worth asserting: prefill-miss → control invalid + toast + submit disabled;
  conditional show matrices; description strings present; single branch error.
- Run `nx lint` on touched projects (module boundaries matter for W6).

## 8. Sources consulted

Legacy: `features/business-process/src/lib/{definition-input,definition-input-group,validation-process,build-and-test,backport,upgrade-process}/**`,
`features/scm/src/lib/branch-input-component/`,
`features/artifact-manager/src/lib/{factory-product-input,final-product}/**`,
`ui/inputs/src/lib/{business-process-infra-group-selector,business-process-factory-product-selector,business-process-final-product-selector,business-process-jump-type-selector,user-story-input}/**`,
`ui/mxevolve-dropdown/src/**`.

New: `domains/business-process/{ui,util,widget,composite-widget}/**`,
`domains/{scm,test,artifact,environment,infra,user}/{widget,data-access}/**`,
`shared/ui/primitive/src/lib/toast/`.
